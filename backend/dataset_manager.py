#!/usr/bin/env python3
"""
AgroPulse Dataset Manager — Downloads & organizes real plant disease image datasets.

Sources:
  1. PlantVillage (via HuggingFace) — Tomato diseases (20 classes, ~18K images)
  2. Coffee Rust datasets (via Kaggle/GitHub)
  3. RoCoLe Robusta Coffee leaves
  4. Br-Al Cocoa Diseases (GitHub)
  5. Additional cocoa/coffee sources

Usage:
  python dataset_manager.py download
  python dataset_manager.py stats
"""

import os
import sys
import json
import shutil
import subprocess
import requests
from pathlib import Path
from collections import defaultdict
from tqdm import tqdm

BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
RAW_DIR = DATA_DIR / "raw"
ORGANIZED_DIR = DATA_DIR / "organized"  # Final: organized/{crop}/{disease}/
STATS_FILE = DATA_DIR / "dataset_stats.json"

# ═══════════════════════════════════════════════════════════════
# DISEASE CLASS MAPPINGS — What folder names map to our 40 classes
# ═══════════════════════════════════════════════════════════════

TOMATO_CLASS_MAP = {
    # PlantVillage folder name → our disease ID
    "Tomato___Early_blight": "tomato_early_blight",
    "Tomato___Late_blight": "tomato_late_blight",
    "Tomato___Septoria_leaf_spot": "tomato_septoria",
    "Tomato___Bacterial_spot": "tomato_bacterial_spot",
    "Tomato___Leaf_Mold": "tomato_leaf_mold",
    "Tomato___Target_Spot": "tomato_target_spot",
    "Tomato___Tomato_mosaic_virus": "tomato_mosaic",
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus": "tomato_yellow_leaf_curl",
    "Tomato___Spider_mites Two-spotted_spider_mite": "tomato_spider_mites",
    "Tomato___healthy": "tomato_healthy",
}

COFFEE_CLASS_MAP = {
    "rust": "coffee_leaf_rust",
    "cercospora": "coffee_cercospora",
    "healthy": "coffee_healthy",
    "miner": "coffee_leaf_miner",
    "phoma": "coffee_brown_eye_spot",
}

COCOA_CLASS_MAP = {
    "black_pod": "cocoa_black_pod",
    "pod_borer": "cocoa_pod_borer",
    "healthy": "cocoa_healthy",
}


def ensure_pip_package(package_name, import_name=None):
    """Install a pip package if not already available."""
    import_name = import_name or package_name
    try:
        __import__(import_name)
    except ImportError:
        print(f"  Installing {package_name}...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", package_name, "-q"])


def download_plantvillage():
    """Download PlantVillage dataset via HuggingFace datasets library."""
    print("\n" + "=" * 60)
    print("  📥 DOWNLOADING: PlantVillage (Tomato) via HuggingFace")
    print("=" * 60)

    dest = ORGANIZED_DIR / "Tomato"
    if dest.exists() and len(list(dest.rglob("*.jpg"))) > 100:
        count = len(list(dest.rglob("*.jpg")))
        print(f"  [SKIP] Already have {count} tomato images")
        return

    ensure_pip_package("datasets")
    ensure_pip_package("Pillow", "PIL")

    from datasets import load_dataset
    from PIL import Image as PILImage

    print("  Loading PlantVillage color dataset from HuggingFace...")
    print("  (This may take several minutes on first download)")

    try:
        dataset = load_dataset("mohanty/PlantVillage", "color", trust_remote_code=True)
    except Exception as e:
        print(f"  ⚠ HuggingFace load failed: {e}")
        print("  Trying alternative download method...")
        download_plantvillage_git()
        return

    # Extract only Tomato classes
    tomato_count = 0
    for split_name in dataset:
        split = dataset[split_name]
        for i, example in enumerate(tqdm(split, desc=f"  Processing {split_name}")):
            label_name = example.get("label_name") or ""

            # Check if this is a tomato image
            matched_class = None
            for pv_name, our_id in TOMATO_CLASS_MAP.items():
                if pv_name.lower() in label_name.lower() or label_name.lower() in pv_name.lower():
                    matched_class = our_id
                    break

            if not matched_class:
                # Try partial matching
                if "tomato" in label_name.lower():
                    # Map to closest class or skip
                    for pv_name, our_id in TOMATO_CLASS_MAP.items():
                        key_part = pv_name.split("___")[-1].lower().replace("_", " ")
                        if key_part in label_name.lower():
                            matched_class = our_id
                            break

            if not matched_class:
                continue

            # Save image
            out_dir = ORGANIZED_DIR / "Tomato" / matched_class
            out_dir.mkdir(parents=True, exist_ok=True)

            img = example["image"]
            if isinstance(img, PILImage.Image):
                img_path = out_dir / f"{split_name}_{i:06d}.jpg"
                img = img.convert("RGB")
                img.save(img_path, "JPEG", quality=95)
                tomato_count += 1

    print(f"  ✓ Saved {tomato_count} tomato disease images")


def download_plantvillage_git():
    """Fallback: Clone PlantVillage from GitHub."""
    print("  Cloning PlantVillage from GitHub (large repo)...")
    dest = RAW_DIR / "PlantVillage-Dataset"

    if not dest.exists():
        try:
            subprocess.run(
                ["git", "clone", "--depth=1",
                 "https://github.com/spMohanty/PlantVillage-Dataset.git",
                 str(dest)],
                check=True, timeout=600,
            )
        except Exception as e:
            print(f"  ✗ Git clone failed: {e}")
            return

    # Organize tomato images
    color_dir = dest / "raw" / "color"
    if not color_dir.exists():
        print(f"  ✗ Expected color dir not found at {color_dir}")
        return

    count = 0
    for class_dir in color_dir.iterdir():
        if not class_dir.is_dir():
            continue

        matched_class = None
        for pv_name, our_id in TOMATO_CLASS_MAP.items():
            if pv_name.lower() == class_dir.name.lower():
                matched_class = our_id
                break

        if not matched_class:
            continue

        out_dir = ORGANIZED_DIR / "Tomato" / matched_class
        out_dir.mkdir(parents=True, exist_ok=True)

        for img_file in class_dir.glob("*"):
            if img_file.suffix.lower() in {".jpg", ".jpeg", ".png"}:
                shutil.copy2(img_file, out_dir / img_file.name)
                count += 1

    print(f"  ✓ Organized {count} tomato images from PlantVillage")


def download_cocoa_github():
    """Download Cocoa diseases dataset from GitHub."""
    print("\n" + "=" * 60)
    print("  📥 DOWNLOADING: Cocoa Diseases (Br-Al/GitHub)")
    print("=" * 60)

    dest = RAW_DIR / "Cocoa-diseases"
    if dest.exists():
        print(f"  [EXISTS] {dest}")
    else:
        try:
            subprocess.run(
                ["git", "clone", "--depth=1",
                 "https://github.com/Br-Al/Cocoa-diseases.git",
                 str(dest)],
                check=True, timeout=300,
            )
            print("  ✓ Cloned Cocoa-diseases")
        except Exception as e:
            print(f"  ✗ Clone failed: {e}")
            return

    # Organize cocoa images
    count = 0
    for root, dirs, files in os.walk(dest):
        root_path = Path(root)
        folder_name = root_path.name.lower()

        matched_class = None
        for key, our_id in COCOA_CLASS_MAP.items():
            if key in folder_name:
                matched_class = our_id
                break

        if not matched_class:
            continue

        out_dir = ORGANIZED_DIR / "Cocoa" / matched_class
        out_dir.mkdir(parents=True, exist_ok=True)

        for f in files:
            if Path(f).suffix.lower() in {".jpg", ".jpeg", ".png"}:
                shutil.copy2(root_path / f, out_dir / f)
                count += 1

    print(f"  ✓ Organized {count} cocoa images")


def download_coffee_kaggle():
    """Download coffee disease datasets."""
    print("\n" + "=" * 60)
    print("  📥 DOWNLOADING: Coffee Datasets")
    print("=" * 60)

    # Try Kaggle API first
    try:
        ensure_pip_package("opendatasets")
        import opendatasets as od

        coffee_dest = RAW_DIR / "coffee-rust"
        if not coffee_dest.exists():
            print("  Downloading Coffee Rust from Kaggle...")
            print("  (You may be prompted for Kaggle credentials)")
            try:
                od.download(
                    "https://www.kaggle.com/datasets/jorgearoca/coffee-rust",
                    data_dir=str(RAW_DIR),
                )
            except Exception as e:
                print(f"  ⚠ Kaggle download failed: {e}")
                print("  Trying alternative sources...")

        rocole_dest = RAW_DIR / "rocole"
        if not rocole_dest.exists():
            print("  Downloading RoCoLe from Kaggle...")
            try:
                od.download(
                    "https://www.kaggle.com/datasets/nirmalsankalana/rocole-a-robusta-coffee-leaf-images-dataset",
                    data_dir=str(RAW_DIR),
                )
            except Exception as e:
                print(f"  ⚠ Kaggle download failed: {e}")

    except Exception as e:
        print(f"  ⚠ opendatasets not available: {e}")

    # Organize whatever coffee images we found
    count = 0
    for root, dirs, files in os.walk(RAW_DIR):
        root_path = Path(root)
        folder_name = root_path.name.lower()

        # Skip non-coffee folders
        if not any(k in str(root_path).lower() for k in ["coffee", "rocole", "rust"]):
            continue

        matched_class = None
        for key, our_id in COFFEE_CLASS_MAP.items():
            if key in folder_name:
                matched_class = our_id
                break

        if not matched_class:
            # Default: if in a coffee dataset, try to infer
            if "healthy" in folder_name or "saudavel" in folder_name:
                matched_class = "coffee_healthy"
            elif "rust" in folder_name or "ferrugem" in folder_name:
                matched_class = "coffee_leaf_rust"
            elif "cerco" in folder_name:
                matched_class = "coffee_cercospora"
            elif "miner" in folder_name or "bicho" in folder_name:
                matched_class = "coffee_leaf_miner"
            else:
                continue

        out_dir = ORGANIZED_DIR / "Coffee" / matched_class
        out_dir.mkdir(parents=True, exist_ok=True)

        for f in files:
            if Path(f).suffix.lower() in {".jpg", ".jpeg", ".png"}:
                shutil.copy2(root_path / f, out_dir / f)
                count += 1

    print(f"  ✓ Organized {count} coffee images")


def download_sample_images():
    """Download a small set of sample images for immediate testing."""
    print("\n" + "=" * 60)
    print("  📥 DOWNLOADING: Sample test images")
    print("=" * 60)

    samples_dir = DATA_DIR / "samples"
    samples_dir.mkdir(parents=True, exist_ok=True)

    # These are direct image URLs for testing
    sample_urls = {
        "tomato_early_blight_sample.jpg": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Alternaria_solani_02.jpg/1280px-Alternaria_solani_02.jpg",
        "tomato_late_blight_sample.jpg": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Phytophthora_infestans-Blatt.jpg/1280px-Phytophthora_infestans-Blatt.jpg",
        "coffee_leaf_rust_sample.jpg": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Hemileia_vastatrix_-_coffee_leaf_rust.jpg/1280px-Hemileia_vastatrix_-_coffee_leaf_rust.jpg",
    }

    for filename, url in sample_urls.items():
        filepath = samples_dir / filename
        if filepath.exists():
            continue
        try:
            print(f"  Downloading {filename}...")
            resp = requests.get(url, timeout=30, headers={"User-Agent": "AgroPulse/1.0"})
            if resp.status_code == 200:
                filepath.write_bytes(resp.content)
                print(f"    ✓ Saved ({len(resp.content) // 1024} KB)")
            else:
                print(f"    ✗ HTTP {resp.status_code}")
        except Exception as e:
            print(f"    ✗ Failed: {e}")


def get_dataset_stats() -> dict:
    """Count images per crop and disease class."""
    stats = {"crops": {}, "total_images": 0, "total_classes": 0}

    if not ORGANIZED_DIR.exists():
        return stats

    for crop_dir in sorted(ORGANIZED_DIR.iterdir()):
        if not crop_dir.is_dir():
            continue
        crop_name = crop_dir.name
        crop_stats = {"classes": {}, "total": 0}

        for class_dir in sorted(crop_dir.iterdir()):
            if not class_dir.is_dir():
                continue
            img_count = len([f for f in class_dir.iterdir()
                           if f.suffix.lower() in {".jpg", ".jpeg", ".png"}])
            crop_stats["classes"][class_dir.name] = img_count
            crop_stats["total"] += img_count

        stats["crops"][crop_name] = crop_stats
        stats["total_images"] += crop_stats["total"]
        stats["total_classes"] += len(crop_stats["classes"])

    return stats


def print_stats():
    """Print dataset statistics."""
    stats = get_dataset_stats()
    print("\n" + "=" * 60)
    print("  📊 DATASET STATISTICS")
    print("=" * 60)
    print(f"  Total images: {stats['total_images']}")
    print(f"  Total classes: {stats['total_classes']}")

    for crop, crop_stats in stats.get("crops", {}).items():
        print(f"\n  {crop} ({crop_stats['total']} images):")
        for cls, count in crop_stats.get("classes", {}).items():
            bar = "█" * min(count // 50, 40)
            print(f"    {cls:40s} {count:5d}  {bar}")

    # Save stats
    STATS_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(STATS_FILE, "w") as f:
        json.dump(stats, f, indent=2)
    print(f"\n  Stats saved to {STATS_FILE}")


def download_all():
    """Download all datasets."""
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    ORGANIZED_DIR.mkdir(parents=True, exist_ok=True)

    download_plantvillage()
    download_cocoa_github()
    download_coffee_kaggle()
    download_sample_images()
    print_stats()


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "download"
    if cmd == "download":
        download_all()
    elif cmd == "stats":
        print_stats()
    else:
        print(f"Unknown command: {cmd}")
        print("Usage: python dataset_manager.py [download|stats]")
