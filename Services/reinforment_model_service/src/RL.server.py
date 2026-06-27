import grpc
import numpy as np
import torch
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import networkx as nx
import osmnx as ox
from stable_baselines3 import DQN

import rl_pb2
import rl_pb2_grpc
from rover_env import MaadiRoverEnv

# ── Load environment (builds/loads the street graph) ────────────────
BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "dispatcher_final_weights.pt"

print("Loading map environment...")
env = MaadiRoverEnv()
print(f"Environment loaded. Graph nodes: {len(env.nodes):,}")
print(f"Max distance: {env.max_distance:,.0f} m")


print(f"Model file exists: {MODEL_PATH.exists()}")
if MODEL_PATH.exists():
    print(f"Model file size:   {MODEL_PATH.stat().st_size:,} bytes")

model = None
try:
    print(f"Loading weights from: {MODEL_PATH}")

    # 1. Blank DQN — architecture must match train.py exactly
    model = DQN(
        "MlpPolicy",
        env,
        policy_kwargs=dict(net_arch=[128, 128]),
        device="cpu",
    )

    # 2. Load raw state_dict
    sd = torch.load(str(MODEL_PATH), map_location="cpu", weights_only=True)

    # 3. Inject into the blank model's policy
    model.policy.load_state_dict(sd)
    model.policy.eval()

    print("AI brain loaded successfully.")
except Exception as e:
    print(f"ERROR loading model: {e}")
    print("Server will start but AssignRover will return errors.")
    model = None


# ── Observation builder — mirrors MaadiRoverEnv._get_obs() ──────────
def _build_obs(rovers_raw: list, order_node: int) -> tuple[np.ndarray, list]:

    # Enrich each rover with graph distances
    enriched = []
    d_rest_to_order = _path_dist(env.restaurant_node, order_node)

    for r in rovers_raw:
        rover_node = ox.nearest_nodes(env.G, r["longitude"], r["latitude"])
        d_to_rest = _path_dist(rover_node, env.restaurant_node)
        total_trip = d_to_rest + d_rest_to_order
        print("rover_node =", rover_node)
        print("d_to_rest =", d_to_rest)
        print("total_trip =", total_trip)
        is_broken = r["status"] == "broken"

        enriched.append({
            **r,
            "rover_node":  rover_node,
            "d_to_rest":   d_to_rest,
            "total_trip":  total_trip,
            "batt_pct":    r["battery_level"] ,   
            "health_pct":  r["health_level"],
            "broken":      is_broken,
        })

    
    enriched.sort(key=lambda r: (r["broken"], -r["batt_pct"]))
    obs = []
    batts = []
    for r in enriched[:2]:                      # always exactly 2 slots
        obs.extend([
            float(np.clip(r["total_trip"] / env.max_distance, 0.0, 1.0)),
            r["batt_pct"] / 100.0,
            r["health_pct"] / 100.0,
            float(np.clip(r["d_to_rest"] / env.max_distance, 0.0, 1.0)),
        ])
        batts.append(r["batt_pct"])

    # Global feature: battery difference
    obs.append(abs(batts[0] - batts[1]) / 100.0)

    return np.array(obs, dtype=np.float32), enriched




def _path_dist(node_a: int, node_b: int) -> float:
    """Shortest path distance between two graph nodes (metres)."""
    if node_a == node_b:
        return 0.0
    try:
        return nx.astar_path_length(env.G, node_a, node_b, weight="length")
    except (nx.NetworkXNoPath, nx.NodeNotFound):
        return env.max_distance


# ── Core selection logic ─────────────────────────────────────────────
def select_rover(rovers: list, order_lat: float, order_lon: float) -> str:
    """
    Use the trained DQN to pick the best rover for the order.

    Args:
        rovers:    list of rover dicts from gRPC proto
        order_lat: customer latitude
        order_lon: customer longitude

    Returns:
        rover_id of the selected rover (str)

    Raises:
        ValueError if all rovers are broken or list is empty
    """
    if not rovers:
        raise ValueError("No rovers provided")

    working = [r for r in rovers if r["status"] != "broken"]
    if not working:
        raise ValueError("All rovers are broken")

    # The model was trained with exactly 2 rovers.
    # If we have more, take the top 2 by battery (best candidates).
    # If we have only 1, duplicate it — obs shape stays (9,) and the
    # model will always pick action 0 (the better rover), which is correct.
    candidates = sorted(working, key=lambda r: -r["battery_level"])[:2]
    if len(candidates) == 1:
        candidates.append(candidates[0])   # pad to 2

    order_node = ox.nearest_nodes(env.G, order_lon, order_lat)

    obs, sorted_rovers = _build_obs(candidates, order_node)

    if model is not None:
        action, _ = model.predict(obs, deterministic=True)
        chosen_index = int(action)
        print("ai choose : ")
        print(chosen_index)
        print(repr(obs))
    else:
        # Fallback: pick rover with higher batteryl
        print("fallback to index zero")
        chosen_index = 0

    # Guard: if the original list only had 1 rover, always return it
    chosen_rover = sorted_rovers[min(chosen_index, len(working) - 1)]
    return chosen_rover["rover_id"]


# ── gRPC service ─────────────────────────────────────────────────────
class RLServiceServicer(rl_pb2_grpc.RLServiceServicer):

    def AssignRover(self, request, context):
        try:
            rovers = [
                {
                    "rover_id":      r.rover_id,
                    "latitude":      r.latitude,
                    "longitude":     r.longitude,
                    "battery_level": r.battery_level,  
                    "status":        r.status,  
                    "health_level" : r.health_level 
                }
                for r in request.rovers
            ]

            rover_id = select_rover(
                rovers,
                request.order_latitude,
                request.order_longitude,
            )

            return rl_pb2.AssignRoverResponse(
                success=True,
                rover_id=rover_id,
            )

        except Exception as e:
            print(f"[AssignRover] Error: {e}")
            return rl_pb2.AssignRoverResponse(
                success=False,
                error=str(e),
            )


# ── Server bootstrap ─────────────────────────────────────────────────
def serve():
    server = grpc.server(ThreadPoolExecutor(max_workers=10))
    rl_pb2_grpc.add_RLServiceServicer_to_server(RLServiceServicer(), server)

    port = "50053"
    server.add_insecure_port(f"0.0.0.0:{port}")
    server.start()
    print(f"RL gRPC server running on port {port}")
    server.wait_for_termination()


if __name__ == "__main__":
    serve()