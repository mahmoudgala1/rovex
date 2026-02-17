from stable_baselines3 import DQN
from rover_env import MaadiRoverEnv

# 1. Init Map-Based Environment
env = MaadiRoverEnv()

# 2. Define DQN Model
model = DQN("MlpPolicy", env, 
            verbose=1, 
            learning_rate=0.0005, 
            buffer_size=10000,
            exploration_fraction=0.3)

print("Starting Training on Maadi Street Network...")
model.learn(total_timesteps=30000)

# 3. Save the "Maadi Brain"
model.save("maadi_dispatcher_model")
print(" Model Saved.")