from stable_baselines3 import DQN
from rover_env import MaadiRoverEnv

env = MaadiRoverEnv()

model = DQN("MlpPolicy", env,
            verbose=1,
            learning_rate=0.0003,
            buffer_size=100000,
            batch_size=64,
            exploration_fraction=0.6,   
            exploration_final_eps=0.05,
            target_update_interval=500,
            learning_starts=2000)

print("Training AI dispatcher...")
model.learn(total_timesteps=100)
model.save("dispatcher_model")
print(" Model Saved.")