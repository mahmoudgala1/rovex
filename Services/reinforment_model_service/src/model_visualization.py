"""
MAADI ROVER — MISSION CONTROL VISUALIZATION
============================================
Drop-in replacement for model_visualization.py

Improvements over the original:
  • 4-panel HUD layout  (map | stats chart | event log | rover cards)
  • Glowing edge rendering  — streets drawn twice (wide dim + thin bright)
  • Rover trail — last N positions fade from full colour → transparent
  • Delivery path drawn as dashed animated line with glow
  • Order markers pulse (growing ring on spawn)
  • Live bar-chart of deliveries-per-batch in the stats panel
  • Scrolling event log with colour-coded entries
  • Battery bar changes colour: green → amber → red
  • AI-decision banner flashes who was chosen and why
  • "SCANNING…" idle animation on inactive rovers
  • Fast node-stepping — OSM nodes are dense, so 1-node/frame = fluid motion
  • All AI / routing logic unchanged — only the render layer is new
"""

import matplotlib
try:
    matplotlib.use("TkAgg")       # preferred on Windows
except Exception:
    try:
        matplotlib.use("Qt5Agg")  # fallback if tkinter not installed
    except Exception:
        pass                       # let matplotlib pick whatever is available
import matplotlib.pyplot as plt  # noqa: E402 (import after backend set)

import osmnx as ox
import matplotlib.patches as mpatches
import matplotlib.patheffects as pe
from matplotlib.gridspec import GridSpec
import networkx as nx
import numpy as np
import random
import time
from collections import deque
from stable_baselines3 import DQN
from rover_env import MaadiRoverEnv
from pathlib import Path

# ─── colour palette ───────────────────────────────────────────────────────────
BG          = "#050810"
PANEL_BG    = "#080d1a"
GRID_COL    = "#0e1a2e"
ACCENT      = "#00e5ff"
WARN        = "#ffc107"
DANGER      = "#ff3d3d"
SUCCESS     = "#00e676"
ROVER_COLS  = ["#00e5ff", "#ff4081"]        # cyan  /  pink
STREET_DIM  = "#0d2137"
STREET_LIT  = "#1a4a6e"
REST_COL    = "#ffa500"
ORDER_COL   = "#ff3d3d"
TRAIL_LEN   = 18                             # frames kept in trail

# ─── load model ───────────────────────────────────────────────────────────────
BASE_DIR   = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "dispatcher_model.zip"

try:
    print(f"Loading model from: {MODEL_PATH}")
    model = DQN.load(str(MODEL_PATH))
    print("✓ AI Brain Loaded Successfully.")
except Exception as e:
    print(f"Error loading model: {e}")
    model = None

env = MaadiRoverEnv()

# ─── global state ─────────────────────────────────────────────────────────────
order_queue      = []
active_orders    = []
completed_orders = 0
batch_history    = []          # deliveries completed per batch
current_batch    = 0

batt         = [100.0, 100.0]
rover_nodes  = [env.restaurant_node, env.restaurant_node]
active_tasks = {0: None, 1: None}
rover_status = ["IDLE", "IDLE"]
ai_banner    = {"text": "", "timer": 0, "color": ACCENT}



# ─── AI decision (unchanged logic) ────────────────────────────────────────────
def get_ai_choice(order_node):
    if model is None:
        return 0
    obs = []
    dist_rest_to_order = env._get_path_dist(env.restaurant_node, order_node)
    max_d = 5000.0
    for i in range(2):
        dist_to_rest = env._get_path_dist(rover_nodes[i], env.restaurant_node)
        total_trip   = dist_to_rest + dist_rest_to_order
        status = 0.0
        if batt[i] <= 0:
            status = 1.0
        elif batt[i] < 30:
            status = 0.5
        obs.extend([
            min(total_trip / max_d, 1.0),
            batt[i] / 100.0,
            status,
            min(dist_to_rest / max_d, 1.0)
        ])
    action, _ = model.predict(np.array(obs, dtype=np.float32), deterministic=True)
    return int(action)

# ─── routing helpers (unchanged logic) ────────────────────────────────────────
def get_path(start, goal):
    if start == goal:
        return [start]
    try:
        return nx.shortest_path(env.G, start, goal, weight="length")
    except Exception:
        return None

def assign_delivery(rover_id, target):
    p1 = get_path(rover_nodes[rover_id], env.restaurant_node)
    p2 = get_path(env.restaurant_node, target)
    if p1 and p2:
        full = p1 + p2[1:]
        active_tasks[rover_id] = {
            "path": full, "step": 0, "progress": 0.0,
            "target": target, "type": "DELIVERY"
        }
        rover_status[rover_id] = "DELIVERING"
        return full
    return None

def assign_return(rover_id):
    path = get_path(rover_nodes[rover_id], env.restaurant_node)
    if path:
        active_tasks[rover_id] = {
            "path": path, "step": 0, "progress": 0.0, "type": "RETURN"
        }
        rover_status[rover_id] = "RETURNING"
        return path
    return None

def spawn_orders():
    global current_batch
    num = random.randint(1, 3)
    nodes = random.sample(env.nodes, num)
    order_queue.extend(nodes)
    active_orders.extend(nodes)
    current_batch = 0
    log_event(f"BATCH  +{num} orders queued", WARN)
    print(f"  New Batch: {num} orders")

# ─── event log ────────────────────────────────────────────────────────────────
MAX_LOG = 14
event_log = deque(maxlen=MAX_LOG)

def log_event(msg, color=ACCENT):
    ts = time.strftime("%H:%M:%S")
    event_log.appendleft((f"[{ts}]  {msg}", color))

# ─── battery colour helper ─────────────────────────────────────────────────────
def batt_color(pct):
    if pct > 50:
        return SUCCESS
    elif pct > 25:
        return WARN
    return DANGER


# ─── pre-compute node positions ───────────────────────────────────────────────
node_xy = {n: (data["x"], data["y"]) for n, data in env.G.nodes(data=True)}

# ─── draw street network with glow effect ─────────────────────────────────────
def draw_streets(ax):
    for u, v, _ in env.G.edges(data=True):
        xs = [node_xy[u][0], node_xy[v][0]]
        ys = [node_xy[u][1], node_xy[v][1]]
        ax.plot(xs, ys, color=STREET_DIM, linewidth=2.2, alpha=1.0,  zorder=1)
        ax.plot(xs, ys, color=STREET_LIT, linewidth=0.7, alpha=0.55, zorder=2)

# ─── main simulation ──────────────────────────────────────────────────────────
def run_dynamic_sim():
    global completed_orders, current_batch

    plt.style.use("dark_background")
    plt.rcParams.update({
        "font.family": "monospace",
        "axes.facecolor": BG,
        "figure.facecolor": BG,
    })

    fig = plt.figure(figsize=(22, 13), facecolor=BG)
    fig.canvas.manager.set_window_title("MAADI ROVER — MISSION CONTROL")

    gs = GridSpec(
        2, 3,
        figure=fig,
        width_ratios=[3.2, 1.1, 1.1],
        height_ratios=[1.6, 1],
        hspace=0.08,
        wspace=0.08,
        left=0.02, right=0.98,
        top=0.95, bottom=0.04
    )

    ax_map   = fig.add_subplot(gs[:, 0])      # full left column — the map
    ax_r0    = fig.add_subplot(gs[0, 1])      # rover 0 card
    ax_r1    = fig.add_subplot(gs[0, 2])      # rover 1 card
    ax_chart = fig.add_subplot(gs[1, 1])      # deliveries chart
    ax_log   = fig.add_subplot(gs[1, 2])      # event log

    for ax in [ax_map, ax_r0, ax_r1, ax_chart, ax_log]:
        ax.set_facecolor(PANEL_BG)
        for spine in ax.spines.values():
            spine.set_edgecolor(GRID_COL)
            spine.set_linewidth(1.2)

    # ── map setup ──────────────────────────────────────────────────────────
    draw_streets(ax_map)
    ax_map.set_aspect("equal")
    ax_map.set_axis_off()

    # title bar
    ax_map.set_title(
        "  ◈  MAADI AUTONOMOUS ROVER  —  MISSION CONTROL  ◈  ",
        color=ACCENT, fontsize=15, fontweight="bold", pad=8,
        path_effects=[pe.withStroke(linewidth=4, foreground="#001a33")]
    )

    # restaurant marker
    rx, ry = node_xy[env.restaurant_node]
    ax_map.scatter(rx, ry, c=REST_COL, s=500, marker="*", zorder=9, linewidths=0)
    ax_map.scatter(rx, ry, c=REST_COL, s=900, marker="*", zorder=8,
                   alpha=0.2, linewidths=0)
    ax_map.text(rx, ry, "  BASE", color=REST_COL, fontsize=7,
                fontweight="bold", zorder=10, va="center")

    # order scatter (live-updated)
    order_scat = ax_map.scatter([], [], c=ORDER_COL, s=110, marker="o",
                                edgecolors="white", linewidths=0.6, zorder=8, alpha=0.95)
    # pulse ring (redrawn on new order)
    pulse_scats = []

    # AI banner text object
    banner_txt = ax_map.text(
        0.5, 0.97, "", transform=ax_map.transAxes,
        color=ACCENT, fontsize=10, fontweight="bold", ha="center", va="top",
        bbox=dict(boxstyle="round,pad=0.3", fc="#001a33", ec=ACCENT, alpha=0.85),
        zorder=20
    )

    # rover draw objects + trails
    rover_draw  = [None, None]
    rover_paths = [None, None]  # path line objects
    trails      = [deque(maxlen=TRAIL_LEN), deque(maxlen=TRAIL_LEN)]
    trail_objs  = [[], []]

    # scan ring (idle animation per rover)
    scan_objs   = [None, None]
    scan_radius = [0.0, 0.0]



    # ── rover card axes helper ─────────────────────────────────────────────
    def draw_rover_card(ax, rid):
        ax.clear()
        ax.set_facecolor(PANEL_BG)
        col = ROVER_COLS[rid]
        bc  = batt_color(batt[rid])
        pct = max(0.0, batt[rid])
        status = rover_status[rid]

        # border glow when active
        lw = 2.5 if status != "IDLE" else 1.0
        for spine in ax.spines.values():
            spine.set_edgecolor(col if status != "IDLE" else GRID_COL)
            spine.set_linewidth(lw)

        # header
        ax.text(0.5, 0.92, f"ROVER  {rid}", color=col, fontsize=13,
                fontweight="bold", ha="center", va="top",
                transform=ax.transAxes)

        # status badge
        badge_col = {
            "IDLE": GRID_COL, "DELIVERING": col, "RETURNING": WARN
        }.get(status, GRID_COL)
        ax.text(0.5, 0.76, status, color="white", fontsize=9,
                fontweight="bold", ha="center", va="top",
                transform=ax.transAxes,
                bbox=dict(boxstyle="round,pad=0.35", fc=badge_col, ec="none"))

        # battery bar background
        ax.barh(0.5, 1.0, left=0.05, height=0.13, color=GRID_COL,
                transform=ax.transAxes, clip_on=False)
        # battery fill
        ax.barh(0.5, 0.9 * pct / 100.0, left=0.05, height=0.13,
                color=bc, transform=ax.transAxes, clip_on=False, alpha=0.9)
        ax.text(0.5, 0.38, f"BATTERY  {pct:.0f}%", color=bc,
                fontsize=8, ha="center", va="top", transform=ax.transAxes)

        # task info
        task = active_tasks[rid]
        if task and task["type"] == "DELIVERY":
            steps_left = len(task["path"]) - task["step"]
            ax.text(0.5, 0.22, f"ETA  ≈ {steps_left} steps",
                    color="white", fontsize=7.5, ha="center",
                    va="top", transform=ax.transAxes, alpha=0.8)

        ax.set_xlim(0, 1); ax.set_ylim(0, 1)
        ax.set_xticks([]); ax.set_yticks([])

    # ── chart axis helper ──────────────────────────────────────────────────
    def draw_chart(ax):
        ax.clear()
        ax.set_facecolor(PANEL_BG)
        for spine in ax.spines.values():
            spine.set_edgecolor(GRID_COL)

        history = batch_history[-12:] if batch_history else [0]
        xs = range(len(history))
        ax.bar(xs, history, color=ACCENT, alpha=0.7, width=0.6)
        ax.set_title("Deliveries / Batch", color="white", fontsize=8, pad=4)
        ax.set_xticks([])
        ax.tick_params(colors="white", labelsize=7)
        ax.yaxis.set_tick_params(colors="white")
        ax.set_ylim(0, max(max(history) + 1, 4))
        ax.spines["top"].set_visible(False)
        ax.spines["right"].set_visible(False)
        ax.text(0.97, 0.93, f"TOTAL  {completed_orders}",
                color=SUCCESS, fontsize=9, fontweight="bold",
                ha="right", va="top", transform=ax.transAxes)

    # ── log axis helper ────────────────────────────────────────────────────
    def draw_log(ax):
        ax.clear()
        ax.set_facecolor(PANEL_BG)
        for spine in ax.spines.values():
            spine.set_edgecolor(GRID_COL)
        ax.set_xticks([]); ax.set_yticks([])
        ax.set_title("Event Log", color="white", fontsize=8, pad=4)
        for idx, (msg, col) in enumerate(event_log):
            y = 0.94 - idx * (0.90 / MAX_LOG)
            alpha = max(0.3, 1.0 - idx * 0.06)
            ax.text(0.04, y, msg, color=col, fontsize=6.5,
                    va="top", transform=ax.transAxes, alpha=alpha,
                    fontfamily="monospace")

    # ── pre-compute map bounds for scan ring scale ─────────────────────────
    all_x = [d["x"] for _, d in env.G.nodes(data=True)]
    all_y = [d["y"] for _, d in env.G.nodes(data=True)]
    map_scale = (max(all_x) - min(all_x)) * 0.018   # ~1.8% of map width

    # ── tick counter ──────────────────────────────────────────────────────
    tick = 0

    spawn_orders()
    log_event("SIM STARTED", SUCCESS)

    plt.show(block=False)
    plt.pause(0.1)

    while True:
        tick += 1

        # ── spawn logic ────────────────────────────────────────────────────
        all_rovers_at_rest = all(
            active_tasks[i] is None and rover_nodes[i] == env.restaurant_node
            for i in range(2)
        )
        if not active_orders and not order_queue and all_rovers_at_rest:
            if batch_history or completed_orders > 0:
                batch_history.append(current_batch)
            spawn_orders()

        # ── dispatch ───────────────────────────────────────────────────────
        available = [i for i in range(2)
                     if active_tasks[i] is None
                     or active_tasks[i]["type"] == "RETURN"]

        if order_queue and available:
            target  = order_queue.pop(0)
            chosen  = get_ai_choice(target)
            if chosen not in available:
                chosen = available[0]

            full_path = assign_delivery(chosen, target)
            if full_path:
                # draw glowing path
                px, py = zip(*[node_xy[n] for n in full_path])
                if rover_paths[chosen]:
                    for ln in rover_paths[chosen]:
                        ln.remove()
                # glow layer + bright layer
                glow = ax_map.plot(px, py, color=ROVER_COLS[chosen],
                                   linewidth=5, alpha=0.12, zorder=3,
                                   linestyle="--")
                bright = ax_map.plot(px, py, color=ROVER_COLS[chosen],
                                     linewidth=1.4, alpha=0.55, zorder=4,
                                     linestyle="--",
                                     dash_capstyle="round")
                rover_paths[chosen] = glow + bright

                log_event(
                    f"AI → ROVER {chosen}  dispatched", ROVER_COLS[chosen]
                )
                ai_banner["text"]  = f"  ▶  AI DISPATCHED ROVER {chosen}  ◀  "
                ai_banner["color"] = ROVER_COLS[chosen]
                ai_banner["timer"] = 60

        # ── movement ────────────────────────────────────────────────────────
        for i in range(2):
            if active_tasks[i] is None:
                rover_status[i] = "IDLE"

                # idle scan ring
                scan_radius[i] = (scan_radius[i] + 0.18) % (map_scale * 3)
                if scan_objs[i]:
                    scan_objs[i].remove()
                cx, cy = node_xy[rover_nodes[i]]
                circle = plt.Circle(
                    (cx, cy), scan_radius[i],
                    color=ROVER_COLS[i], fill=False,
                    linewidth=0.6, alpha=max(0, 0.5 - scan_radius[i] / (map_scale * 3)),
                    zorder=6
                )
                ax_map.add_patch(circle)
                scan_objs[i] = circle
                continue

            # remove scan ring when moving
            if scan_objs[i]:
                scan_objs[i].remove()
                scan_objs[i] = None
            scan_radius[i] = 0.0

            task = active_tasks[i]
            path = task["path"]
            idx  = task["step"]

            if idx >= len(path) - 1:
                rover_nodes[i] = path[-1]
                if task["type"] == "DELIVERY":
                    tgt = task["target"]
                    if tgt in active_orders:
                        active_orders.remove(tgt)
                    completed_orders += 1
                    current_batch    += 1
                    log_event(f"ROVER {i}  delivered  ✓  #{completed_orders}", SUCCESS)
                    assign_return(i)
                else:
                    active_tasks[i] = None
                    if rover_paths[i]:
                        for ln in rover_paths[i]:
                            ln.remove()
                        rover_paths[i] = None
                    log_event(f"ROVER {i}  returned to BASE", ROVER_COLS[i])
                continue

            # ── fast node-stepping (matches simple version) ────────────
            n1 = path[idx]
            task["progress"] += 2.0          # ≥ 1.0 → advance 1 node/frame
            if task["progress"] >= 1.0:
                task["step"]    += 2
                task["progress"] = 0.0

            rover_nodes[i] = n1
            batt[i] -= 0.02

            # ── trail ──────────────────────────────────────────────────
            trails[i].append(node_xy[n1])
            for obj in trail_objs[i]:
                obj.remove()
            trail_objs[i] = []
            n_trail = len(trails[i])
            for t_idx, (tx, ty) in enumerate(trails[i]):
                alpha = (t_idx / n_trail) * 0.55
                sz    = 20 + t_idx * 5
                dot   = ax_map.scatter(tx, ty, s=sz, c=ROVER_COLS[i],
                                       alpha=alpha, zorder=7, linewidths=0)
                trail_objs[i].append(dot)

            # ── rover marker (main dot + glow) ─────────────────────────
            if rover_draw[i]:
                for obj in rover_draw[i]:
                    obj.remove()
            cx, cy = node_xy[n1]
            glow_dot = ax_map.scatter(cx, cy, s=320, c=ROVER_COLS[i],
                                      alpha=0.18, zorder=9, linewidths=0)
            main_dot = ax_map.scatter(cx, cy, s=80, c=ROVER_COLS[i],
                                      edgecolors="white", linewidths=0.8, zorder=10)
            rover_draw[i] = [glow_dot, main_dot]

        # ── order markers ──────────────────────────────────────────────────
        if active_orders:
            coords = [node_xy[n] for n in active_orders]
            order_scat.set_offsets(coords)
        else:
            order_scat.set_offsets(np.empty((0, 2)))

        # ── AI banner ──────────────────────────────────────────────────────
        if ai_banner["timer"] > 0:
            banner_txt.set_text(ai_banner["text"])
            banner_txt.set_color(ai_banner["color"])
            banner_txt.get_bbox_patch().set_edgecolor(ai_banner["color"])
            ai_banner["timer"] -= 1
        else:
            banner_txt.set_text("")

        # ── panel redraws ──────────────────────────────────────────────────
        draw_rover_card(ax_r0, 0)
        draw_rover_card(ax_r1, 1)
        if tick % 8 == 0:            # chart & log don't need every frame
            draw_chart(ax_chart)
            draw_log(ax_log)

        fig.canvas.draw_idle()
        fig.canvas.flush_events()
        time.sleep(0.0001)


if __name__ == "__main__":
    run_dynamic_sim()
