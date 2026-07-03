#!/usr/bin/env python3
"""
AgroPulse Kaggle Live Log Streamer
===================================
Polls Kaggle for new kernel log lines every 10 seconds and prints them live.
Press Ctrl+C to stop at any time.
"""

import os
import sys
import json
import time
import subprocess
from pathlib import Path

KAGGLE_API_TOKEN = "KGAT_942621603c66554abe7ae6f53c56272c"
KERNEL_REF       = "ngwayannick/agropulse-training-script"
POLL_INTERVAL    = 12   # seconds between log fetches

env = os.environ.copy()
env["KAGGLE_API_TOKEN"] = KAGGLE_API_TOKEN
env["PYTHONUTF8"] = "1"

def fetch_logs():
    result = subprocess.run(
        [sys.executable, "-m", "kaggle", "kernels", "logs", KERNEL_REF],
        capture_output=True, text=True, env=env
    )
    return result.stdout or ""

def fetch_status():
    result = subprocess.run(
        [sys.executable, "-m", "kaggle", "kernels", "status", KERNEL_REF],
        capture_output=True, text=True, env=env
    )
    return result.stdout.strip()

def parse_log_lines(raw_log):
    """Parse JSONL log format or plain text lines."""
    lines = []
    for raw_line in raw_log.strip().splitlines():
        raw_line = raw_line.strip().rstrip(",")
        if not raw_line:
            continue
        if raw_line.startswith("[") or raw_line.startswith("]"):
            continue
        try:
            obj = json.loads(raw_line)
            if "data" in obj:
                text = obj["data"].rstrip("\n")
                stream = obj.get("stream_name", "out")
                ts = obj.get("time", 0)
                lines.append((ts, stream, text))
        except json.JSONDecodeError:
            lines.append((0, "out", raw_line))
    return lines

print("=" * 60)
print(" AgroPulse Kaggle Live Log Stream")
print(f" Kernel: {KERNEL_REF}")
print("=" * 60)
print("Connecting to Kaggle... Press Ctrl+C to stop.\n")

seen_lines = set()
last_status = None
poll_count = 0

try:
    while True:
        # Check status
        status_raw = fetch_status()
        status_key = "unknown"
        for word in ["running", "complete", "error", "queued"]:
            if word in status_raw.lower():
                status_key = word
                break

        if status_key != last_status:
            print(f"\n[STATUS] >>> {status_raw} <<<\n")
            last_status = status_key

        # Fetch and print new log lines
        raw_log = fetch_logs()
        if raw_log.strip():
            parsed = parse_log_lines(raw_log)
            new_lines = [l for l in parsed if (l[0], l[2]) not in seen_lines]
            for ts, stream, text in new_lines:
                seen_lines.add((ts, text))
                prefix = "[ERR]" if stream == "stderr" else "     "
                # Only print stderr that is training output, skip CUDA noise
                if stream == "stderr":
                    low = text.lower()
                    if any(x in low for x in ["epoch", "traceback", "error", "loss", "accuracy",
                                               "phase", "warning: all", "scanning", "building",
                                               "warming", "saving", "exporting", "success",
                                               "total images", "fatal", "class distribution"]):
                        print(f"{prefix} {text}")
                else:
                    print(f"{prefix} {text}")
        else:
            poll_count += 1
            if poll_count % 5 == 0:
                print(f"[{time.strftime('%H:%M:%S')}] Waiting for log output... (status: {status_key})")

        if status_key == "complete":
            print("\n[DONE] Training completed successfully!")
            print("Run: py check_and_download.py  to download your model.\n")
            break
        elif status_key == "error":
            print("\n[FAILED] Training encountered an error.")
            print("Run: py check_and_download.py  to view the error output.\n")
            break

        time.sleep(POLL_INTERVAL)

except KeyboardInterrupt:
    print(f"\n\nStopped. Last status: {last_status}")
    print("The training continues running on Kaggle even after you close this.")
    print("Run: py check_and_download.py  to check status again later.\n")
