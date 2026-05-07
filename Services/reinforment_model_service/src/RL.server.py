import grpc
import numpy as np
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from stable_baselines3 import DQN
from rover_env import MaadiRoverEnv
import osmnx as ox
import networkx as nx

import rl_pb2
import rl_pb2_grpc

# ================= LOAD MODEL & ENV =================
BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "dispatcher_model.zip"
# Add this temporarily in rl_server.py before loading
print(f"File exists: {MODEL_PATH.exists()}")
print(f"File size: {MODEL_PATH.stat().st_size if MODEL_PATH.exists() else 'NOT FOUND'}")
print(f"Loading map environment...")
env = MaadiRoverEnv()
print(f"Environment loaded.")

try:
    print(f"Loading model from: {MODEL_PATH}")
    model = DQN.load(str(MODEL_PATH))
    print("AI Brain Loaded Successfully.")
except Exception as e:
    print(f"Error loading model: {e}")
    model = None

MAX_D = 5000.0  

# ================= CORE LOGIC =================
def _get_path_dist(node_a, node_b) -> float:
    """Get shortest path distance between two graph nodes."""
    try:
        return nx.astar_path_length(env.G, node_a, node_b, weight="length")
    except:
        return MAX_D


def select_rover(rovers: list, order_lat: float, order_lon: float) -> str:

    if not rovers:
        raise ValueError("No rovers provided")

    # Snap order lat/lon to nearest graph node
    order_node = ox.nearest_nodes(env.G, order_lon, order_lat)

    dist_rest_to_order = _get_path_dist(env.restaurant_node, order_node)

    #  only support 2 rovers (matches the trained model's observation space of 8)
    # If more than 2 are passed, we pick the best 2 candidates first by proximity
    working_rovers = [r for r in rovers if r["status"] != "broken"]

    if not working_rovers:
        raise ValueError("All rovers are broken")

    # Take up to 2 rovers — pad with a dummy if only 1 available
    selected = working_rovers[:2]
    if len(selected) == 1:
        selected.append(selected[0])  # duplicate so obs shape stays (8,)

    obs = []
    for rover in selected:
        # Snap rover lat/lon to nearest graph node
        rover_node = ox.nearest_nodes(env.G, rover["longitude"], rover["latitude"])

        dist_to_rest = _get_path_dist(rover_node, env.restaurant_node)
        total_trip = dist_to_rest + dist_rest_to_order

        # Match status encoding from rover_env.py
        battery_pct = rover["battery_level"] * 100.0  # normalize back to 0-100
        if rover["status"] == "broken":
            status = 1.0
        elif battery_pct < 30 or rover["status"] == "low_battery":
            status = 0.5
        else:
            status = 0.0

        obs.extend([
            min(total_trip / MAX_D, 1.0),
            rover["battery_level"],        # already 0.0-1.0
            status,
            min(dist_to_rest / MAX_D, 1.0)
        ])

    obs_array = np.array(obs, dtype=np.float32)

    if model is not None:
        action, _ = model.predict(obs_array, deterministic=True)
        chosen_index = int(action)

    return working_rovers[chosen_index]["rover_id"]


# ================= gRPC SERVICE =================
class RLServiceServicer(rl_pb2_grpc.RLServiceServicer):
    def AssignRover(self, request, context):
        try:
            # Convert proto Rover objects to plain dicts
            rovers = [
                {
                    "rover_id":      r.rover_id,
                    "latitude":      r.latitude,
                    "longitude":     r.longitude,
                    "battery_level": r.battery_level,
                    "status":        r.status,
                }
                for r in request.rovers
            ]

            rover_id = select_rover(rovers, request.order_latitude, request.order_longitude)

            return rl_pb2.AssignRoverResponse(
                success=True,
                rover_id=rover_id,
            )

        except Exception as e:
            print(f"Error in AssignRover: {e}")
            return rl_pb2.AssignRoverResponse(
                success=False,
                error=str(e),
            )


# ================= SERVER BOOTSTRAP =================
def serve():
    server = grpc.server(ThreadPoolExecutor(max_workers=10))
    rl_pb2_grpc.add_RLServiceServicer_to_server(RLServiceServicer(), server)

    port = "50053"
    server.add_insecure_port(f"0.0.0.0:{port}")
    server.start()
    print(f"RL gRPC Server running on port {port}")
    server.wait_for_termination()


if __name__ == "__main__":
    serve()