import osmnx as ox
import matplotlib.pyplot as plt
import networkx as nx
import numpy as np
import random
import time
from stable_baselines3 import DQN
from rover_env import MaadiRoverEnv
from pathlib import Path

# ================= LOAD MODEL =================
BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "dispatcher_model.zip"

try:
    print(f"Loading model from: {MODEL_PATH}")
    model = DQN.load(str(MODEL_PATH))
    print(" AI Brain Loaded Successfully.")
except Exception as e:
    print(f"Error loading model: {e}")
    model = None

env = MaadiRoverEnv()

# ================= GLOBAL STATE =================
order_queue = []
active_orders = []
completed_orders = 0
batch_active = False

batt = [100.0, 100.0]
rover_nodes = [env.restaurant_node, env.restaurant_node]

active_tasks = {0: None, 1: None}
rover_status = ["IDLE", "IDLE"]

# ================= AI DECISION=================
def get_ai_choice(order_node):
    if model is None:
        return 0

    obs = []
    dist_rest_to_order = env._get_path_dist(env.restaurant_node, order_node)
    max_d = 5000.0

    for i in range(2):
        dist_to_rest = env._get_path_dist(rover_nodes[i], env.restaurant_node)
        total_trip = dist_to_rest + dist_rest_to_order

        status = 0.0
        if batt[i] <= 0:
            status = 1.0  # Broken
        elif batt[i] < 30:
            status = 0.5  # Low Battery

        # Normalize observations before predicting
        obs.extend([
            min(total_trip / max_d, 1.0), 
            batt[i] / 100.0, 
            status, 
            min(dist_to_rest / max_d, 1.0)
        ])

    action, _ = model.predict(np.array(obs, dtype=np.float32), deterministic=True)
    return int(action)

# ================= HELPERS =================
def spawn_orders():
    global batch_active
    num = random.randint(1, 3)
    nodes = random.sample(env.nodes, num)
    order_queue.extend(nodes)
    active_orders.extend(nodes)
    batch_active = True
    print(f" New Batch Spawned: {num} orders")

def get_path(start, goal):
    if start == goal:
        return [start]
    try:
        return nx.shortest_path(env.G, start, goal, weight="length")
    except:
        return None

def assign_delivery(rover_id, target):
    # Path logic: Current Position -> Restaurant (Pickup) -> Target (Dropoff)
    p1 = get_path(rover_nodes[rover_id], env.restaurant_node)
    p2 = get_path(env.restaurant_node, target)

    if p1 and p2:
        full = p1 + p2[1:]
        active_tasks[rover_id] = {
            "path": full,
            "step": 0,
            "progress": 0.0,
            "target": target,
            "type": "DELIVERY"
        }
        rover_status[rover_id] = "DELIVERING"
        return full
    return None

def assign_return(rover_id):
    path = get_path(rover_nodes[rover_id], env.restaurant_node)
    if path:
        active_tasks[rover_id] = {
            "path": path,
            "step": 0,
            "progress": 0.0,
            "type": "RETURN"
        }
        rover_status[rover_id] = "RETURNING" 
        return path
    return None

# ================= MAIN SIM =================
def run_dynamic_sim():
    global completed_orders, batch_active

    plt.ion()
    fig = plt.figure(figsize=(18, 12), facecolor="black")
    gs = fig.add_gridspec(1, 2, width_ratios=[4, 1])

    ax_map = fig.add_subplot(gs[0])
    ax_panel = fig.add_subplot(gs[1])

    ax_map.set_facecolor("black")
    ax_panel.set_facecolor("#111111")

    ox.plot_graph(env.G, ax=ax_map, show=False, close=False,
                  edge_color="#333333", node_size=0,
                  bgcolor="black", edge_linewidth=0.7)

    ax_map.set_axis_off()

    rx = env.G.nodes[env.restaurant_node]["x"]
    ry = env.G.nodes[env.restaurant_node]["y"]
    ax_map.scatter(rx, ry, c="#ffa500", s=350, marker="*", zorder=6, label="Restaurant")

    order_scat = ax_map.scatter([], [], c="#ff3333",
                                s=130, marker="o",
                                edgecolors="white", zorder=7)

    rover_draw = [None, None]
    rover_paths = [None, None]
    colors = ["#00FFFF", "#FF00FF"]

    spawn_orders()

    while True:
        # Spawn logic
        all_rovers_at_rest = all(
            active_tasks[i] is None and rover_nodes[i] == env.restaurant_node for i in range(2)
        )

        if not active_orders and not order_queue and all_rovers_at_rest:
            spawn_orders()

        # Dispatching logic
        available_rovers = [i for i in range(2) if active_tasks[i] is None or active_tasks[i]["type"] == "RETURN"]

        if order_queue and available_rovers:
            target = order_queue.pop(0)
            chosen = get_ai_choice(target)

           
            if chosen not in available_rovers:
                chosen = available_rovers[0]

            full_path = assign_delivery(chosen, target)

            if full_path:
                px, py = zip(*[(env.G.nodes[n]['x'], env.G.nodes[n]['y']) for n in full_path])
                if rover_paths[chosen]:
                    rover_paths[chosen][0].remove()
                rover_paths[chosen] = ax_map.plot(px, py, color=colors[chosen], linewidth=2, alpha=0.4, zorder=4)

        # Movement updates
        for i in range(2):
            if active_tasks[i] is None:
                rover_status[i] = "IDLE"
                continue

            task = active_tasks[i]
            path = task["path"]
            idx = task["step"]

            if idx >= len(path) - 1:
                rover_nodes[i] = path[-1]
                if task["type"] == "DELIVERY":
                    if task["target"] in active_orders:
                        active_orders.remove(task["target"])
                    completed_orders += 1
                    assign_return(i)
                else:
                    active_tasks[i] = None
                    if rover_paths[i]:
                        rover_paths[i][0].remove()
                        rover_paths[i] = None
                continue

            # Visual Smoothing
            n1 = path[idx]
            task["progress"] += 2.0  # INCREASED SPEED
            if task["progress"] >= 1.0:
                task["step"] += 1
                task["progress"] = 0.0
            
            rover_nodes[i] = n1
            batt[i] -= 0.02 # Battery drain per visual step

            if rover_draw[i]:
                rover_draw[i].remove()
            
            rover_draw[i] = ax_map.scatter(
                env.G.nodes[n1]["x"], env.G.nodes[n1]["y"],
                s=150, c=colors[i], edgecolors="white", zorder=10
            )

        # UI Updates
        if active_orders:
            order_scat.set_offsets([[env.G.nodes[n]["x"], env.G.nodes[n]["y"]] for n in active_orders])
        else:
            order_scat.set_offsets(np.empty((0, 2)))

        ax_panel.clear()
        ax_panel.set_facecolor("#111111")
        ax_panel.text(0.1, 0.92, "MAADI MISSION CONTROL", color="white", fontsize=16, fontweight="bold")

        for i in range(2):
            y_pos = 0.7 - i * 0.25
            ax_panel.text(0.1, y_pos, f"ROVER {i} [{rover_status[i]}]", color=colors[i], fontsize=12, fontweight="bold")
            ax_panel.text(0.1, y_pos - 0.05, f"Battery: {max(0, batt[i]):.1f}%", color="white", fontsize=10)
            ax_panel.barh(y_pos - 0.09, (max(0, batt[i]) / 100) * 0.8, left=0.1, height=0.03, color=colors[i])

        ax_panel.text(0.1, 0.1, f"Completed: {completed_orders}", color="#00ff00", fontsize=14)
        ax_panel.axis("off")

        fig.canvas.draw_idle()
        fig.canvas.flush_events()
        time.sleep(0.01)

if __name__ == "__main__":
    run_dynamic_sim()