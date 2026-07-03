#!/usr/bin/env python3
"""
AgroPulse Kaggle Training Status Checker and Downloader
======================================================
Use this script to check the progress of the active training run on Kaggle,
and download the final TFLite model and class map once training is complete.
This does NOT restart or push a new training run.
"""

import os
import sys
import json
import time
import subprocess
from pathlib import Path

# Workspace paths
WORKSPACE_DIR = Path(__file__).parent.resolve()
OUTPUT_MODELS_DIR = WORKSPACE_DIR / "public" / "models"
LOCAL_CREDENTIALS_FILE = WORKSPACE_DIR / "kaggle.json"

def load_credentials():
    """Load Kaggle credentials from environment, workspace kaggle.json."""
    token = os.environ.get("KAGGLE_API_TOKEN")
    username = os.environ.get("KAGGLE_USERNAME", "ngwayannick")

    if token:
        return username, token

    if LOCAL_CREDENTIALS_FILE.exists():
        try:
            with open(LOCAL_CREDENTIALS_FILE, "r") as f:
                data = json.load(f)
                token_val = data.get("token") or data.get("key") or data.get("password")
                user_val = data.get("username") or "ngwayannick"
                if token_val:
                    return user_val, token_val
        except Exception as e:
            print(f"Error reading local kaggle.json: {e}")

    return "ngwayannick", None

def run_command_with_env(args, env):
    """Run a subprocess command with the given environment variables."""
    full_env = os.environ.copy()
    full_env.update(env)
    
    if args[0] == "kaggle":
        args = [sys.executable, "-m", "kaggle"] + args[1:]

    result = subprocess.run(args, capture_output=True, text=True, env=full_env)
    return result

def main():
    print("=" * 60)
    print("AgroPulse Kaggle training checker & downloader")
    print("=" * 60)

    # 1. Get Credentials
    username, token = load_credentials()
    if not token:
        print("\n[ERROR] Kaggle credentials not found!")
        print("Please ensure your 'kaggle.json' file is in this workspace directory:")
        print(f"  {LOCAL_CREDENTIALS_FILE}")
        sys.exit(1)

    env = {
        "KAGGLE_API_TOKEN": token,
        "PYTHONUTF8": "1"
    }

    kernel_ref = f"{username}/agropulse-training"
    print(f"Checking status for: {kernel_ref}")

    status_result = run_command_with_env(["kaggle", "kernels", "status", kernel_ref], env)
    if status_result.returncode != 0:
        # Fallback to the title-modified slug
        kernel_ref = f"{username}/agropulse-training-script"
        print(f"Retrying with alternative slug: {kernel_ref}")
        status_result = run_command_with_env(["kaggle", "kernels", "status", kernel_ref], env)

    if status_result.returncode != 0:
        print(f"[ERROR] Failed to check status:\n{status_result.stderr}")
        sys.exit(1)

    output = status_result.stdout.strip()
    print(f"\nStatus: {output}")

    # Parse status
    status = "unknown"
    for word in ["running", "complete", "error", "queued"]:
        if word in output.lower():
            status = word
            break

    if status == "complete":
        print("\nTraining is COMPLETE! Starting download...")
        OUTPUT_MODELS_DIR.mkdir(parents=True, exist_ok=True)
        
        download_result = run_command_with_env(["kaggle", "kernels", "output", kernel_ref, "-p", str(OUTPUT_MODELS_DIR)], env)
        if download_result.returncode != 0:
            print(f"[ERROR] Failed to download output files:\n{download_result.stderr}")
            sys.exit(1)

        print(download_result.stdout)
        
        # Rename class_map.json to agropulse_classes.json if it exists
        raw_class_map = OUTPUT_MODELS_DIR / "class_map.json"
        target_class_map = OUTPUT_MODELS_DIR / "agropulse_classes.json"
        if raw_class_map.exists():
            if target_class_map.exists():
                target_class_map.unlink()
            raw_class_map.rename(target_class_map)
            print(f"Renamed class_map.json to {target_class_map.name} [OK]")

        print("\n[SUCCESS] Model files downloaded and updated successfully:")
        print(f"  Model:     {OUTPUT_MODELS_DIR / 'agropulse_offline_model.tflite'}")
        print(f"  Class Map: {target_class_map}")
    elif status == "running":
        print("\nThe model is still training on Kaggle. Please run this script again later.")
    elif status == "queued":
        print("\nThe training job is currently queued on Kaggle. Please wait.")
    elif status == "error":
        print("\n[ERROR] Training failed on Kaggle. You can run the following command to see error logs:")
        print(f"  py -m kaggle kernels output {kernel_ref}")
    else:
        print("\nStatus is unknown. Please try again.")

if __name__ == "__main__":
    main()
