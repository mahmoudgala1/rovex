from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import osmnx as ox
import networkx as nx
import numpy as np
from stable_baselines3 import DQN
from pathlib import Path

app = FastAPI(title="Fleet Dispatcher")

# --- ASSET LOADING ---

BASE_DIR = Path(__file__).resolve().parent.parent

GRAPH_PATH = BASE_DIR / "data" / "maadi_network.graphml"
MODEL_PATH = BASE_DIR / "data" / "dispatcher_model.zip"
G = ox.load_graphml(GRAPH_PATH)
model = DQN.load(MODEL_PATH)

RESTAURANT_LATLON = (29.9575, 31.2820)
restaurant_node = ox.nearest_nodes(G, RESTAURANT_LATLON[1], RESTAURANT_LATLON[0])

class RoverState(BaseModel):
    id: str
    lat: float
    lon: float
    battery: float
    status: int 

class DispatchRequest(BaseModel):
    order_lat: float
    order_lon: float
    rovers: List[RoverState]

def get_path_dist(node_a, node_b):
    try:
        return nx.shortest_path_length(G, node_a, node_b, weight='length')
    except:
        return 99999.0
@app.get("/")
async def root():
    return {
        "status": "online",
        "message": "Maadi Rover Dispatcher AI is running",
        "port": 8000
    }
@app.post("/dispatch/select")
async def select_best_rover(request: DispatchRequest):
    if not request.rovers:
        raise HTTPException(status_code=400, detail="No rovers provided.")

    # 1. Locate Order
    order_node = ox.nearest_nodes(G, request.order_lon, request.order_lat)
    dist_rest_to_order = get_path_dist(restaurant_node, order_node)
    
    # 2. Tournament Logic: Compare rovers to find the best
    
    best_rover_data = request.rovers[0]
    
    competitor = request.rovers[i]
        
        # Build features for current "Best"
    b_node = ox.nearest_nodes(G, best_rover_data.lon, best_rover_data.lat)
    b_dist = get_path_dist(b_node, restaurant_node)
    b_total = b_dist + dist_rest_to_order
        
    # Build features for the "Competitor"
    c_node = ox.nearest_nodes(G, competitor.lon, competitor.lat)
    c_dist = get_path_dist(c_node, restaurant_node)
    c_total = c_dist + dist_rest_to_order
        
        # 3. Create the 8-feature observation for the DQN
        # [TotalDist_1, Batt_1, Status_1, DistRest_1, TotalDist_2, Batt_2, Status_2, DistRest_2]
    obs = np.array([
            b_total, best_rover_data.battery, best_rover_data.status, b_dist,
            c_total, competitor.battery, competitor.status, c_dist
        ], dtype=np.float32)
        
        # 4. Ask the AI
    action, _ = model.predict(obs, deterministic=True)
        
        # If action is 1, the competitor is better than our current best
    if int(action) == 1:
            best_rover_data = competitor

    # 5. Return the winner
    return {
        "order_node": int(order_node),
        "selected_rover_id": best_rover_data.id,
        "estimated_trip_meters": round(get_path_dist(ox.nearest_nodes(G, best_rover_data.lon, best_rover_data.lat), restaurant_node) + dist_rest_to_order, 2)
    }