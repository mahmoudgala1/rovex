import gymnasium as gym
from gymnasium import spaces
import numpy as np
import osmnx as ox
import networkx as nx
import random
import os

# CONFIGURATION
LOCATION_NAME = "Maadi, Cairo, Egypt"
RESTAURANT_LATLON = (29.9575, 31.2820) 
GRAPH_FILENAME = "maadi_network.graphml"

class MaadiRoverEnv(gym.Env):
    def __init__(self):
        super(MaadiRoverEnv, self).__init__()
        
        # 1. GRAPH INITIALIZATION
        if os.path.exists(GRAPH_FILENAME):
            self.G = ox.load_graphml(GRAPH_FILENAME)
        else:
            self.G = ox.graph_from_point(RESTAURANT_LATLON, dist=2000, network_type="drive", simplify=True)
            self.G = ox.project_graph(self.G) 
            ox.save_graphml(self.G, GRAPH_FILENAME)

        self.nodes = list(self.G.nodes())
        self.restaurant_node = ox.nearest_nodes(self.G, RESTAURANT_LATLON[1], RESTAURANT_LATLON[0])
        
        # 2. RL SPACES
        self.action_space = spaces.Discrete(2) # 0 = Rover X, 1 = Rover Y
        
        # Observation: [total_trip, battery, status, dist_to_rest] * 2
        self.observation_space = spaces.Box(
            low=0, 
            high=100000, 
            shape=(8,), 
            dtype=np.float32
        )
        
        self.rovers = []
        self.order_node = None

    def reset(self, seed=None):
        super().reset(seed=seed)
        self.rovers = [
            {'node': self.restaurant_node, 'batt': random.randint(50, 100), 'broken': False},
            {'node': self.restaurant_node, 'batt': random.randint(50, 100), 'broken': False}
        ]
        self._spawn_order()
        return self._get_obs(), {}

    def _spawn_order(self):
        self.order_node = random.choice(self.nodes)

    def _get_path_dist(self, node_a, node_b):
        """Calculates distance using A* Algorithm with Euclidean heuristic."""
        try:
            # A* search using the 'length' attribute and a custom heuristic
            return nx.astar_path_length(
                self.G, 
                node_a, 
                node_b, 
                heuristic=self._heuristic, 
                weight='length'
            )
        except (nx.NetworkXNoPath, nx.NodeNotFound):
            return 99999.0

    def _heuristic(self, u, v):
        """Euclidean distance heuristic for A*."""
        x1, y1 = self.G.nodes[u]['x'], self.G.nodes[u]['y']
        x2, y2 = self.G.nodes[v]['x'], self.G.nodes[v]['y']
        return np.sqrt((x1 - x2)**2 + (y1 - y2)**2)

    def _get_obs(self):
        obs = []
        # Distance restaurant -> order (constant for both rovers in a single step)
        dist_rest_to_order = self._get_path_dist(self.restaurant_node, self.order_node)
        
        for r in self.rovers:
            dist_to_rest = self._get_path_dist(r['node'], self.restaurant_node)
            total_trip = dist_to_rest + dist_rest_to_order
            
            # Status: 0=Healthy, 2=Broken, 3=Low Battery (<30)
            status = 0
            if r['broken']: status = 2
            elif r['batt'] < 30: status = 3
            
            obs.extend([total_trip, r['batt'], status, dist_to_rest])
            
        return np.array(obs, dtype=np.float32)

    def step(self, action):
        selected = self.rovers[action]
        
        dist_to_rest = self._get_path_dist(selected['node'], self.restaurant_node)
        dist_rest_to_order = self._get_path_dist(self.restaurant_node, self.order_node)
        total_dist = dist_to_rest + dist_rest_to_order
        
        # 0.005% battery per meter
        batt_cost = total_dist * 0.005 
        reward = 0
        
        # --- REWARD CALCULATION ---
        # Formula: 50 - (total_dist * 0.5) + (selected['batt'] * 0.05)
        reward = 50 - (total_dist * 0.5) + (selected['batt'] * 0.05)

        # --- PENALTIES & FAILURE LOGIC ---
        if selected['broken']:
            reward -= 200 # Heavy penalty for choosing an already broken rover
            terminated = True # End episode on invalid choice
        elif selected['batt'] < batt_cost:
            reward -= 100 # Penalty for insufficient battery
            selected['broken'] = True # Rover breaks down
            terminated = True
        else:
            # Successful Delivery
            selected['batt'] -= batt_cost
            selected['node'] = self.order_node 
            terminated = True # For single-order training, we end episode per step

        return self._get_obs(), reward, terminated, False, {}