#!/usr/bin/env python3
"""
AgroPulse Kaggle Training Automation Script
==========================================
This script automates the process of pushing the training script to Kaggle,
running it on Kaggle GPUs, polling the status, and downloading the trained
model and class map directly back into your project.
"""

import os
import sys
import json
import time
import subprocess
from pathlib import Path

# Workspace paths
WORKSPACE_DIR = Path(__file__).parent.resolve()
NOTEBOOK_FILE = WORKSPACE_DIR / "kaggle_notebook.py"
METADATA_FILE = WORKSPACE_DIR / "kernel-metadata.json"
OUTPUT_MODELS_DIR = WORKSPACE_DIR / "public" / "models"
LOCAL_CREDENTIALS_FILE = WORKSPACE_DIR / "kaggle.json"

# All 16 dataset slugs to attach to the kernel
DATASET_SLUGS = [
    "ahmednasser83/tomato-leaf-disease-dataset",
    "ashishmotwani/tomato",
    "charuchaudhry/plantvillage-tomato-leaf-dataset",
    "cookiefinder/tomato-disease-multiple-sources",
    "sadikmahir/tomato-fruit-disease",
    "nirmalsankalana/rocole-a-robusta-coffee-leaf-images-dataset",
    "noamaanabdulazeem/jmuben-coffee-dataset",
    "sujitraarw/coffee-green-bean-with-17-defects-original",
    "zaldyjr/cacao-diseases",
    "ohagwucollinspatrick/amini-cocoa-contamination-dataset",
    "serranosebas/enfermedades-cacao-yolov4",
    "brd401/cocoa-diseases-localization",
    "sujaykapadnis/banana-disease-recognition-dataset",
    "moro23/maize-disease-dataset",
    "hamishcrazeai/maize-in-field-dataset",
    "yasirahmad0810/consolidated-corn-dataset"
]

def load_credentials():
    """Load Kaggle credentials from environment, workspace kaggle.json, or prompt."""
    token = os.environ.get("KAGGLE_API_TOKEN")
    username = os.environ.get("KAGGLE_USERNAME", "ngwayannick")

    if token:
        return username, token

    # Check for local kaggle.json in workspace
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

    # Check for global kaggle.json
    global_path = Path.home() / ".kaggle" / "kaggle.json"
    if global_path.exists():
        try:
            with open(global_path, "r") as f:
                data = json.load(f)
                token_val = data.get("token") or data.get("key")
                user_val = data.get("username") or "ngwayannick"
                if token_val:
                    return user_val, token_val
        except Exception as e:
            print(f"Error reading global kaggle.json: {e}")

    return "ngwayannick", None

def install_kaggle_cli():
    """Install the Kaggle CLI package if it is missing."""
    print("Checking if Kaggle CLI is installed...")
    try:
        # Check if we can run it
        subprocess.run([sys.executable, "-m", "kaggle", "--version"], capture_output=True, check=True)
        print("Kaggle CLI is already installed.")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("Kaggle CLI not found. Installing now...")
        try:
            subprocess.run([sys.executable, "-m", "pip", "install", "kaggle"], check=True)
            print("Kaggle CLI installed successfully.")
        except Exception as e:
            print(f"Failed to install kaggle package: {e}")
            sys.exit(1)

def generate_metadata(username):
    """Generate the kernel-metadata.json file."""
    metadata = {
        "id": f"{username}/agropulse-training-script",
        "title": "AgroPulse Training Script",
        "code_file": str(NOTEBOOK_FILE.name),
        "language": "python",
        "kernel_type": "script",
        "is_private": "true",
        "enable_gpu": "true",
        "enable_tpu": "false",
        "enable_internet": "true",
        "dataset_sources": DATASET_SLUGS,
        "kernel_sources": [],
        "competition_sources": []
    }
    with open(METADATA_FILE, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"Generated {METADATA_FILE.name} [OK]")

def run_command_with_env(args, env):
    """Run a subprocess command with the given environment variables."""
    # Ensure env has standard system PATH etc.
    full_env = os.environ.copy()
    full_env.update(env)
    
    # Run the command through python -m kaggle to bypass potential script path issues
    if args[0] == "kaggle":
        args = [sys.executable, "-m", "kaggle"] + args[1:]

    result = subprocess.run(args, capture_output=True, text=True, env=full_env)
    return result

def main():
    print("=" * 60)
    print("AgroPulse Kaggle training automation launcher")
    print("=" * 60)

    # 1. Install Kaggle CLI
    install_kaggle_cli()

    # 2. Get Credentials
    username, token = load_credentials()
    if not token:
        print("\n[ERROR] Kaggle credentials not found!")
        print("Please place your 'kaggle.json' file in this workspace directory:")
        print(f"  {LOCAL_CREDENTIALS_FILE}")
        print("\nOr set this environment variable:")
        print("  set KAGGLE_API_TOKEN=your_access_token")
        sys.exit(1)

    env = {
        "KAGGLE_API_TOKEN": token,
        "PYTHONUTF8": "1"
    }

    # 3. Generate metadata
    generate_metadata(username)

    # 4. Push Kernel
    print("\nPushing training script to Kaggle...")
    result = run_command_with_env(["kaggle", "kernels", "push", "-p", str(WORKSPACE_DIR)], env)
    
    if result.returncode != 0:
        print(f"[ERROR] Failed to push kernel:\n{result.stderr}")
        print(f"Stdout:\n{result.stdout}")
        sys.exit(1)
    
    print(result.stdout.strip())
    print("Kernel pushed successfully! Training is now queued/running on Kaggle GPU.")

    # 5. Poll Status
    kernel_ref = f"{username}/agropulse-training-script"
    print(f"\nMonitoring kernel: {kernel_ref}")
    print("We will poll status every 60 seconds. You can stop this script at any time (Ctrl+C).")
    print("The training will continue running on Kaggle even if you stop this script.")

    last_status = None
    while True:
        status_result = run_command_with_env(["kaggle", "kernels", "status", kernel_ref], env)
        if status_result.returncode == 0:
            output = status_result.stdout.strip()
            # Parse status from output (e.g. "username/agropulse-training has status 'running'")
            status = "unknown"
            for word in ["running", "complete", "error", "queued"]:
                if word in output.lower():
                    status = word
                    break
            
            if status != last_status:
                print(f"[{time.strftime('%H:%M:%S')}] Status changed to: {status.upper()}")
                last_status = status

            if status == "complete":
                print("\nTraining completed successfully! [SUCCESS]")
                break
            elif status == "error":
                print("\n[ERROR] Training failed. Checking output logs...")
                log_result = run_command_with_env(["kaggle", "kernels", "output", kernel_ref], env)
                print(log_result.stdout)
                print(log_result.stderr)
                sys.exit(1)
        else:
            print(f"Error checking status: {status_result.stderr.strip()}")

        time.sleep(60)

    # 6. Retrieve Outputs
    print("\nDownloading outputs from Kaggle...")
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

    print("\nDone! Model files are downloaded and updated successfully:")
    print(f"  Model:     {OUTPUT_MODELS_DIR / 'agropulse_offline_model.tflite'}")
    print(f"  Class Map: {target_class_map}")

if __name__ == "__main__":
    main()
