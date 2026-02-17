import osmnx as ox
import matplotlib.pyplot as plt
import networkx as nx
import numpy as np
import random
from rover_env import MaadiRoverEnv

env = MaadiRoverEnv()

# Global States
order_queue = []
active_orders = []      
active_tasks = {0: None, 1: None} 
completed_orders = 0
batt = [100.0, 100.0]
rover_nodes = [env.restaurant_node, env.restaurant_node]
new_batch_triggered = False 

def spawn_orders():
    global new_batch_triggered
    num_new = random.randint(1, 3) 
    new_nodes = random.sample(env.nodes, num_new)
    order_queue.extend(new_nodes)
    active_orders.extend(new_nodes)
    new_batch_triggered = False 

def get_path(start, goal):
    if start == goal: return [start]
    try:
        return nx.shortest_path(env.G, start, goal, weight='length')
    except:
        return None

def run_dynamic_sim():
    global completed_orders, new_batch_triggered
    plt.ion()

    fig = plt.figure(figsize=(18, 12), facecolor='black')
    gs = fig.add_gridspec(1, 2, width_ratios=[4, 1])
    ax_map = fig.add_subplot(gs[0])
    ax_panel = fig.add_subplot(gs[1])

    ax_map.set_facecolor('black')
    ax_panel.set_facecolor('#111111')

    ox.plot_graph(env.G, ax=ax_map, show=False, close=False, edge_color="#333333", 
                  node_size=0, bgcolor='black', edge_linewidth=0.7)
    
    ax_map.set_axis_off()
    rx, ry = env.G.nodes[env.restaurant_node]['x'], env.G.nodes[env.restaurant_node]['y']
    ax_map.scatter(rx, ry, c='#ffa500', s=350, marker='*', zorder=6)

    order_scat = ax_map.scatter([], [], c='#ff3333', s=130, marker='o', edgecolors='white', zorder=7)
    rover_arrows = [None, None]
    rover_paths = [None, None] 
    colors = ['#00FFFF', '#FF00FF'] 

    spawn_orders()

    while True:
        if not active_orders and not new_batch_triggered:
            new_batch_triggered = True 
            spawn_orders()

        for i in range(2):
            # 1. Charging Logic
            if rover_nodes[i] == env.restaurant_node and active_tasks[i] is None:
                batt[i] = min(100, batt[i] + 0.8)

            # 2. Dispatch / Return Logic
            if active_tasks[i] is None:
                # If battery sufficient and orders exist, pick next delivery
                if batt[i] > 10 and order_queue:
                    target = order_queue.pop(0)
                    # Force pickup at restaurant if not already there
                    p_to_rest = [rover_nodes[i]] if rover_nodes[i] == env.restaurant_node else get_path(rover_nodes[i], env.restaurant_node)
                    p_to_target = get_path(env.restaurant_node, target)
                    
                    if p_to_rest and p_to_target:
                        full_path = p_to_rest + p_to_target[1:]
                        active_tasks[i] = {"path": full_path, "step": 0, "progress": 0.0, 
                                           "target": target, "type": "delivery"}
                        px, py = zip(*[(env.G.nodes[n]['x'], env.G.nodes[n]['y']) for n in full_path])
                        if rover_paths[i]: rover_paths[i][0].remove()
                        # Visualizing Delivery Path (Solid)
                        rover_paths[i] = ax_map.plot(px, py, color=colors[i], alpha=0.5, linewidth=2, zorder=4)
                    else:
                        order_queue.insert(0, target)
                
                # AUTO-RETURN: If idle and not at restaurant, start return trip
                elif rover_nodes[i] != env.restaurant_node:
                    ret_path = get_path(rover_nodes[i], env.restaurant_node)
                    if ret_path and len(ret_path) > 1:
                        active_tasks[i] = {"path": ret_path, "step": 0, "progress": 0.0, 
                                           "target": env.restaurant_node, "type": "returning"}
                        px, py = zip(*[(env.G.nodes[n]['x'], env.G.nodes[n]['y']) for n in ret_path])
                        if rover_paths[i]: rover_paths[i][0].remove()
                        # Visualizing Return Path (Dotted line with 'o' markers)
                        rover_paths[i] = ax_map.plot(px, py, color=colors[i], alpha=0.4, 
                                                     linewidth=1.5, linestyle=':', marker='o', 
                                                     markersize=2, zorder=4)

            # 3. Movement Logic
            if active_tasks[i]:
                task = active_tasks[i]
                path = task["path"]
                idx = task["step"]

                if idx >= len(path) - 1:
                    rover_nodes[i] = path[-1]
                    if task["type"] == "delivery":
                        if task["target"] in active_orders:
                            active_orders.remove(task["target"])
                        completed_orders += 1
                    
                    # Task finished, set to None so "AUTO-RETURN" can trigger in next frame
                    active_tasks[i] = None
                    if rover_arrows[i]: rover_arrows[i].remove(); rover_arrows[i] = None
                    if rover_paths[i]: rover_paths[i][0].remove(); rover_paths[i] = None
                    continue

                n1, n2 = path[idx], path[idx+1]
                x1, y1 = env.G.nodes[n1]['x'], env.G.nodes[n1]['y']
                x2, y2 = env.G.nodes[n2]['x'], env.G.nodes[n2]['y']

                task["progress"] += 0.7
                if task["progress"] >= 1.0:
                    task["step"] += 1
                    task["progress"] = 0.0
                    curr_x, curr_y = x2, y2
                else:
                    curr_x, curr_y = x1 + (x2 - x1) * task["progress"], y1 + (y2 - y1) * task["progress"]

                batt[i] -= 0.04

                # Update Arrow
                if rover_arrows[i]: rover_arrows[i].remove()
                dx, dy = (x2 - x1), (y2 - y1)
                mag = np.sqrt(dx**2 + dy**2)
                if mag > 1e-5:
                    ux, uy = (dx/mag) * 40, (dy/mag) * 40
                    rover_arrows[i] = ax_map.arrow(curr_x, curr_y, ux, uy, 
                                                   head_width=90, head_length=100, 
                                                   fc=colors[i], ec=colors[i], zorder=10, 
                                                   length_includes_head=True)
            else:
                curr_x, curr_y = env.G.nodes[rover_nodes[i]]['x'], env.G.nodes[rover_nodes[i]]['y']
                if rover_arrows[i]: rover_arrows[i].remove()
                rover_arrows[i] = ax_map.scatter(curr_x, curr_y, s=120, c=colors[i], edgecolors='white', zorder=10)

        # 4. Update Graphics
        if active_orders:
            order_scat.set_offsets([[env.G.nodes[n]['x'], env.G.nodes[n]['y']] for n in active_orders])
        else:
            order_scat.set_offsets(np.empty((0, 2)))

        ax_panel.clear()
        ax_panel.set_facecolor("#111111")
        ax_panel.text(0.1, 0.9, "MISSION CONTROL", color="white", fontsize=18, fontweight="bold")
        for i in range(2):
            c, y_off = colors[i], 0.65 - (i * 0.22)
            status = "CHARGING" if active_tasks[i] is None and rover_nodes[i] == env.restaurant_node else ("RETURNING" if active_tasks[i] and active_tasks[i]["type"] == "returning" else "DELIVERING")
            ax_panel.text(0.1, y_off, f"ROVER {i} [{status}]", color=c, fontsize=11, fontweight="bold")
            ax_panel.text(0.1, y_off - 0.04, f"Battery: {max(0, batt[i]):.1f}%", color="white", fontsize=10)
            ax_panel.barh(y_off - 0.07, (max(0, batt[i])/100)*0.8, left=0.1, height=0.02, color=c)
        ax_panel.text(0.1, 0.1, f"Total Success: {completed_orders}", color="#00ff00", fontsize=14)
        ax_panel.axis('off')

        try:
            plt.pause(0.01)
        except:
            break

if __name__ == "__main__":
    run_dynamic_sim()