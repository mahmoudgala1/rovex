import gymnasium as gym
from gymnasium import spaces
import numpy as np
import osmnx as ox
import networkx as nx
import random
import os

LOCATION_NAME = "Maadi, Cairo, Egypt"
RESTAURANT_LATLON = (29.9575, 31.2820)
GRAPH_FILENAME = "maadi_network.graphml"

class MaadiRoverEnv(gym.Env):
    def __init__(self):
        super(MaadiRoverEnv, self).__init__()

        if os.path.exists(GRAPH_FILENAME):
            self.G = ox.load_graphml(GRAPH_FILENAME)
        else:
            self.G = ox.graph_from_point(RESTAURANT_LATLON, dist=2000, network_type="drive", simplify=True)
            self.G = ox.project_graph(self.G)
            ox.save_graphml(self.G, GRAPH_FILENAME)

        self.nodes = list(self.G.nodes())
        self.restaurant_node = ox.nearest_nodes(self.G, RESTAURANT_LATLON[1], RESTAURANT_LATLON[0])

        self.action_space = spaces.Discrete(2)

        # 8 features: [total_trip_dist, battery, status, dist_to_rest] x2 rovers
        self.observation_space = spaces.Box(low=0, high=1.0, shape=(8,), dtype=np.float32)

        self.rovers = []
        self.order_node = None
        self.steps_taken = 0
        self.max_steps = 50  

    def reset(self, seed=None):
        super().reset(seed=seed)
        self.steps_taken = 0

        self.rovers = [
            {'node': self.restaurant_node, 'batt': random.uniform(40.0, 100.0), 'broken': False},
            {'node': self.restaurant_node, 'batt': random.uniform(40.0, 100.0), 'broken': False}
        ]
        self._spawn_order()
        return self._get_obs(), {}

    def _spawn_order(self):
        self.order_node = random.choice(self.nodes)

    def _get_path_dist(self, node_a, node_b):
        try:
            return nx.astar_path_length(self.G, node_a, node_b, weight='length')
        except:
            return 5000.0

    def _get_obs(self):
        obs = []
        dist_rest_to_order = self._get_path_dist(self.restaurant_node, self.order_node)
        max_d = 5000.0

        for r in self.rovers:
            dist_to_rest = self._get_path_dist(r['node'], self.restaurant_node)
            total_trip = dist_to_rest + dist_rest_to_order

            status = 0.0
            if r['broken']:
                status = 1.0
            elif r['batt'] < 30:
                status = 0.5

            obs.extend([
                min(total_trip / max_d, 1.0),
                r['batt'] / 100.0,
                status,
                min(dist_to_rest / max_d, 1.0)
            ])

        return np.array(obs, dtype=np.float32)

    def step(self, action):
        selected = self.rovers[action]
        other = self.rovers[1 - action]
        self.steps_taken += 1

        dist_to_rest = self._get_path_dist(selected['node'], self.restaurant_node)
        dist_rest_to_order = self._get_path_dist(self.restaurant_node, self.order_node)
        total_dist = dist_to_rest + dist_rest_to_order
        batt_cost = total_dist * 0.005

        reward = 0
        terminated = False

        if selected['broken']:
            reward = -50
            terminated = True

        elif selected['batt'] < batt_cost:
            other_dist = self._get_path_dist(other['node'], self.restaurant_node) + dist_rest_to_order
            other_cost = other_dist * 0.005
            if not other['broken'] and other['batt'] >= other_cost:
                reward = -150  
            else:
                reward = -100  
            selected['broken'] = True
            terminated = True

        else:
           
            batt_diff = selected['batt'] - other['batt']
            load_balance_penalty = max(0, batt_diff) * 0.05  

            reward = 20 - (total_dist * 0.01) - load_balance_penalty

            selected['batt'] -= batt_cost
            selected['node'] = self.order_node

            if self.steps_taken >= self.max_steps:
                terminated = True
            else:
                self._spawn_order()

        return self._get_obs(), reward, terminated, False, {}