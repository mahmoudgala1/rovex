"""
Maadi Rover RL Dispatcher — Training Script

Properly configured DQN with:
  • learning_starts (1 000) ≪ total_timesteps (200 000)
  • Evaluation callback (every 5 000 steps, 10 episodes)
  • Diagnostics callback (action distribution, collapse detection)
  • Larger network [128, 128]
  • Progress bar via tqdm
"""

import os
import torch
from stable_baselines3 import DQN
from stable_baselines3.common.callbacks import EvalCallback
from rover_env import MaadiRoverEnv
from callbacks import DiagnosticsCallback


def verify_model(path):
    """Try loading the model to verify it's not corrupted."""
    try:
        DQN.load(path)
        return True
    except Exception as e:
        print(f"  ⚠ Verification failed for {path}: {e}")
        return False


def save_model_safe(model, path):
    """Save model and verify the save is valid. Retries on failure."""
    # Save to CPU first to avoid CUDA serialization issues
    model.policy.to("cpu")

    for attempt in range(3):
        zip_path = path + ".zip"
        # Remove old file if exists
        if os.path.exists(zip_path):
            os.remove(zip_path)

        model.save(path)
        print(f"  Save attempt {attempt + 1} → {zip_path}")

        if verify_model(path):
            print(f"  ✓ Verified: {zip_path}")
            # Move policy back to original device
            model.policy.to(model.device)
            return True
        else:
            print(f"  ✗ Corrupted, retrying...")

    # Fallback: save just the policy state dict with torch
    fallback_path = path + "_weights.pt"
    torch.save(model.policy.state_dict(), fallback_path)
    print(f"  ✓ Fallback: saved raw weights to {fallback_path}")
    model.policy.to(model.device)
    return False


def main():
    # ── Environments ─────────────────────────────────────────────────
    env      = MaadiRoverEnv(max_steps=200)
    eval_env = MaadiRoverEnv(max_steps=200)

    # ── Directories ──────────────────────────────────────────────────
    model_dir = "models"
    log_dir   = "logs"
    os.makedirs(model_dir, exist_ok=True)
    os.makedirs(log_dir,   exist_ok=True)

    # ── Callbacks ────────────────────────────────────────────────────
    eval_cb = EvalCallback(
        eval_env,
        best_model_save_path=os.path.join(model_dir, "best"),
        log_path=log_dir,
        eval_freq=5_000,
        n_eval_episodes=10,
        deterministic=True,
        verbose=1,
    )
    diag_cb = DiagnosticsCallback(log_freq=2_000, verbose=1)

    # ── Model ────────────────────────────────────────────────────────
    model = DQN(
        "MlpPolicy",
        env,
        verbose=1,
        learning_rate=3e-4,
        buffer_size=100_000,
        batch_size=64,
        exploration_fraction=0.4,
        exploration_final_eps=0.05,
        target_update_interval=500,
        learning_starts=1_000,
        gamma=0.99,
        train_freq=4,
        gradient_steps=1,
        policy_kwargs=dict(net_arch=[128, 128]),
        device="auto",          # auto-detect CPU/CUDA safely
    )

    # ── Banner ───────────────────────────────────────────────────────
    print("=" * 60)
    print("  Maadi Rover RL Dispatcher — Training")
    print("=" * 60)
    print(f"  Observation shape : {env.observation_space.shape}")
    print(f"  Actions           : {env.action_space.n}")
    print(f"  Max graph distance: {env.max_distance:,.0f} m")
    print(f"  Graph nodes       : {len(env.nodes):,}")
    print(f"  Device            : {model.device}")
    print(f"  Total timesteps   : 200,000")
    print(f"  Learning starts   : 1,000")
    print("=" * 60 + "\n")

    # ── Train ────────────────────────────────────────────────────────
    model.learn(
        total_timesteps=1000_000,
        callback=[eval_cb, diag_cb],
        progress_bar=True,
    )

    # ── Save (with verification) ─────────────────────────────────────
    print("\n── Saving model ──")
    final_path = os.path.join(model_dir, "dispatcher_final")
    save_model_safe(model, final_path)

    diag_cb.print_summary()


if __name__ == "__main__":
    main()
