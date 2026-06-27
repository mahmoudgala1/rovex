"""
Maadi Rover Delivery Dispatcher — Gymnasium Environment (v3)

Simplified design:
  - Discrete(2): just pick which rover delivers
  - Auto-recharge: rovers gain battery/health when they pick up
    orders at the restaurant (every trip passes through it)
  - Short trips → net battery gain (sustainable)
  - Long trips → net battery loss (forces smart dispatching)
  - No charging actions, no exploitation, clean learning signal
"""

import gymnasium as gym
from gymnasium import spaces
import numpy as np
import osmnx as ox
import networkx as nx
import random
import os

# ── Map Configuration ────────────────────────────────────────────────
LOCATION_NAME = "Maadi, Cairo, Egypt"
RESTAURANT_LATLON = (29.9575, 31.2820)
GRAPH_FILENAME = "maadi_network.graphml"

# ── Auto-recharge at restaurant ──────────────────────────────────────
RECHARGE_BATTERY = 15.0   # +15% battery each time rover visits restaurant
RECHARGE_HEALTH  = 8.0    # +8 health each visit


class MaadiRoverEnv(gym.Env):
    """
    Two-rover delivery dispatcher for Maadi, Cairo.

    Action Space — Discrete(2):
        0  Dispatch rover A  (higher battery after sorting)
        1  Dispatch rover B  (lower  battery after sorting)

    Every delivery trip: rover → restaurant (pickup + auto-recharge) → customer.
    Short trips cost less battery than the recharge gives → sustainable.
    Long trips cost more → forces the agent to balance rover usage.

    Observation Space — Box(9,):
        Rovers sorted by battery (best first) for permutation invariance.

        Per rover (4 features × 2 rovers = 8):
            total_trip_distance_norm   [0, 1]
            battery_norm               [0, 1]
            health_norm                [0, 1]
            dist_to_restaurant_norm    [0, 1]

        Global (1 feature):
            battery_difference_norm    [0, 1]
    """

    metadata = {"render_modes": []}

    def __init__(self, max_steps: int = 200):
        super().__init__()

        # Load / build street graph
        if os.path.exists(GRAPH_FILENAME):
            self.G = ox.load_graphml(GRAPH_FILENAME)
        else:
            self.G = ox.graph_from_point(
                RESTAURANT_LATLON, dist=2000,
                network_type="drive", simplify=True,
            )
            self.G = ox.project_graph(self.G)
            ox.save_graphml(self.G, GRAPH_FILENAME)

        self.nodes = list(self.G.nodes())
        self.restaurant_node = ox.nearest_nodes(
            self.G, RESTAURANT_LATLON[1], RESTAURANT_LATLON[0],
        )

        # ── Dynamic normalization ────────────────────────────────────
        try:
            dists = nx.single_source_dijkstra_path_length(
                self.G, self.restaurant_node, weight="length",
            )
            self.max_distance = max(dists.values()) * 2.0
        except Exception:
            self.max_distance = 10_000.0
        if self.max_distance < 100.0:
            self.max_distance = 10_000.0

        # ── Order hotspot weights ────────────────────────────────────
        self.order_weights = self._compute_order_weights()

        # ── Spaces ───────────────────────────────────────────────────
        self.action_space = spaces.Discrete(2)
        self.observation_space = spaces.Box(
            low=0.0, high=1.0, shape=(9,), dtype=np.float32,
        )

        self.max_steps = max_steps
        self.rovers = []
        self.order_node = None
        self.steps_taken = 0
        self.sorted_indices = [0, 1]
        self.episode_stats = self._empty_stats()

    # ── Helpers ──────────────────────────────────────────────────────
    @staticmethod
    def _empty_stats():
        return {
            "deliveries": 0,
            "failures": 0,
            "total_reward": 0.0,
            "action_counts": [0, 0],
        }

    def _compute_order_weights(self):
        """Closer nodes → higher delivery probability (hotspot model)."""
        try:
            dists = nx.single_source_dijkstra_path_length(
                self.G, self.restaurant_node, weight="length",
            )
        except Exception:
            return [1.0 / len(self.nodes)] * len(self.nodes)

        half_max = (self.max_distance / 2.0) * 0.5
        weights = [
            np.exp(-dists.get(n, self.max_distance) / max(half_max, 1.0))
            for n in self.nodes
        ]
        total = sum(weights)
        if total == 0:
            return [1.0 / len(self.nodes)] * len(self.nodes)
        return [w / total for w in weights]

    def _spawn_order(self):
        self.order_node = random.choices(
            self.nodes, weights=self.order_weights, k=1,
        )[0]

    def _path_dist(self, a, b):
        if a == b:
            return 0.0
        try:
            return nx.astar_path_length(self.G, a, b, weight="length")
        except (nx.NetworkXNoPath, nx.NodeNotFound):
            return self.max_distance

    def _battery_cost(self, distance: float, rover: dict) -> float:
        """Realistic cost: base × terrain × wear factor."""
        if distance <= 0:
            return 0.0
        base = distance * 0.003              # reduced from 0.005
        terrain = random.uniform(0.90, 1.10)  # tighter noise band
        wear = 1.0 + (100.0 - rover["health"]) * 0.003  # less wear penalty
        return base * terrain * wear

    def _health_cost(self, distance: float) -> float:
        return distance * 0.001 + random.uniform(0.0, 0.3)  # slower health drain

    # ── Sorting (permutation invariance) ─────────────────────────────
    def _sort_rovers(self):
        """Sort rovers: non-broken first, then by battery descending.
        Broken rovers are ALWAYS placed in position B (worse)."""
        r0, r1 = self.rovers[0], self.rovers[1]

        # If one is broken and the other isn't, non-broken goes first
        if r0["broken"] and not r1["broken"]:
            self.sorted_indices = [1, 0]
        elif r1["broken"] and not r0["broken"]:
            self.sorted_indices = [0, 1]
        # Both same broken status → sort by battery
        elif r0["batt"] >= r1["batt"]:
            self.sorted_indices = [0, 1]
        else:
            self.sorted_indices = [1, 0]

    # ── Observation ──────────────────────────────────────────────────
    def _get_obs(self):
        self._sort_rovers()
        d_rest_order = self._path_dist(self.restaurant_node, self.order_node)

        obs = []
        batts = []
        for sp in range(2):
            r = self.rovers[self.sorted_indices[sp]]
            d_to_rest = self._path_dist(r["node"], self.restaurant_node)
            trip = d_to_rest + d_rest_order

            obs.extend([
                float(np.clip(trip / self.max_distance, 0.0, 1.0)),
                r["batt"] / 100.0,
                r["health"] / 100.0,
                float(np.clip(d_to_rest / self.max_distance, 0.0, 1.0)),
            ])
            batts.append(r["batt"])

        obs.append(abs(batts[0] - batts[1]) / 100.0)
        return np.array(obs, dtype=np.float32)

    # ── Episode lifecycle ────────────────────────────────────────────
    def reset(self, seed=None, options=None):
        super().reset(seed=seed)
        self.steps_taken = 0

        self.rovers = [
            {"node": self.restaurant_node,
             "batt": random.uniform(40.0, 100.0),
             "health": random.uniform(70.0, 100.0),
             "broken": False},
            {"node": self.restaurant_node,
             "batt": random.uniform(40.0, 100.0),
             "health": random.uniform(70.0, 100.0),
             "broken": False},
        ]
        self.episode_stats = self._empty_stats()
        self._spawn_order()
        return self._get_obs(), {}

    def _is_done(self) -> bool:
        if all(r["broken"] for r in self.rovers):
            return True
        if self.steps_taken >= self.max_steps:
            return True
        return False

    # ── Step ─────────────────────────────────────────────────────────
    def step(self, action: int):
        self.steps_taken += 1
        self.episode_stats["action_counts"][action] += 1

        # Map logical action → physical rover
        phys_idx = self.sorted_indices[action]  # 0=better, 1=worse
        selected = self.rovers[phys_idx]
        other    = self.rovers[1 - phys_idx]

        reward = self._do_dispatch(selected, other)

        terminated = self._is_done()

        if not terminated:
            self._spawn_order()

        self.episode_stats["total_reward"] += reward
        info = {"episode_stats": self.episode_stats.copy()}
        return self._get_obs(), reward, terminated, False, info

    # ── Dispatch logic ───────────────────────────────────────────────
    def _do_dispatch(self, sel, other):
        # Dispatch a broken rover → hard penalty
        if sel["broken"]:
            self.episode_stats["failures"] += 1
            return -30.0

        # ── Trip: rover → restaurant (pickup + recharge) → customer ──
        d_to_rest    = self._path_dist(sel["node"], self.restaurant_node)
        d_rest_order = self._path_dist(self.restaurant_node, self.order_node)
        total        = d_to_rest + d_rest_order
        cost_batt    = self._battery_cost(total, sel)
        cost_hp      = self._health_cost(total)

        # Other rover's counterfactual cost
        d_oth_rest = self._path_dist(other["node"], self.restaurant_node)
        oth_total  = d_oth_rest + d_rest_order
        oth_cost   = self._battery_cost(oth_total, other)

        # ── Auto-recharge at restaurant during pickup ────────────────
        # The rover visits the restaurant to pick up the order,
        # so it naturally recharges a bit while there.
        sel["batt"]   = min(100.0, sel["batt"]   + RECHARGE_BATTERY)
        sel["health"] = min(100.0, sel["health"] + RECHARGE_HEALTH)

        # ── Now check if rover has enough battery for the trip ───────
        if sel["batt"] < cost_batt:
            sel["broken"] = True
            sel["health"] = max(0.0, sel["health"] - 20.0)
            self.episode_stats["failures"] += 1
            if not other["broken"] and other["batt"] >= oth_cost:
                return -40.0   # other rover was fine — bad choice
            return -25.0       # nobody could do it

        # ── Successful delivery ──────────────────────────────────────
        sel["batt"]  -= cost_batt
        sel["health"] = max(0.0, sel["health"] - cost_hp)
        sel["node"]   = self.order_node

        if sel["health"] <= 0.0:
            sel["broken"] = True

        self.episode_stats["deliveries"] += 1

        # ── Reward shaping ───────────────────────────────────────────
        base = 20.0

        # Distance penalty (prefer shorter trips)
        dist_pen = (total / self.max_distance) * 10.0

        # Counterfactual: was the other rover a better choice?
        comparison = 0.0
        if not other["broken"]:
            diff = oth_cost - cost_batt       # +ve = we chose cheaper
            comparison = float(np.clip(diff * 0.3, -5.0, 5.0))

        # Symmetric balance penalty (keep rovers evenly used)
        batt_imb   = abs(sel["batt"]   - other["batt"])   / 100.0
        health_imb = abs(sel["health"] - other["health"]) / 100.0
        balance_pen = (batt_imb + health_imb) * 3.0

        # Health bonus (prefer dispatching healthy rovers)
        hp_bonus = (sel["health"] / 100.0) * 2.0

        return base - dist_pen + comparison - balance_pen + hp_bonus
