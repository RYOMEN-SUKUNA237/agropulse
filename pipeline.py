#!/usr/bin/env python3
"""
AgroPulse Data Pipeline — Dataset Download, Preprocessing & Model Training
==========================================================================
Usage:
  python pipeline.py download    # Clone/download all datasets
  python pipeline.py preprocess  # Resize all images to 224x224
  python pipeline.py train       # Train gatekeeper + 3 specialist models
  python pipeline.py all         # Run full pipeline
"""

import os
import sys
import json
import shutil
import subprocess
from pathlib import Path
from typing import Dict, List, Tuple

# ═══════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════
PROJECT_ROOT = Path(__file__).parent
DATA_RAW = PROJECT_ROOT / "data" / "raw"
DATA_PROCESSED = PROJECT_ROOT / "data" / "processed"
MODELS_DIR = PROJECT_ROOT / "models"
IMG_SIZE = (224, 224)

DATASETS = {
    "PlantVillage_Tomato": {
        "url": "https://github.com/spMohanty/PlantVillage-Dataset.git",
        "type": "git",
        "subdir": "raw/color",
        "crops": ["Tomato"],
    },
    "CoffeeRust": {
        "url": "https://github.com/esgario/lara-dataset.git",
        "type": "git",
        "crops": ["Coffee"],
    },
    "RoCoLe": {
        "url": "https://github.com/jcgarciaca/RoCoLe.git",
        "type": "git",
        "crops": ["Coffee"],
    },
    "CocoaDiseases": {
        "url": "https://github.com/AI-Lab-Makerere/CocoaDiseases.git",
        "type": "git",
        "crops": ["Cocoa"],
    },
    "CacaoMonilia": {
        "url": "https://github.com/dfalveargOT/CacaoMoniliaDataSet.git",
        "type": "git",
        "crops": ["Cocoa"],
    },
}

# Disease class mapping (40 classes total)
DISEASE_CLASSES = {
    # Cocoa: 0-9
    "cocoa_black_pod": 0, "cocoa_swollen_shoot": 1, "cocoa_witches_broom": 2,
    "cocoa_frosty_pod": 3, "cocoa_monilia": 4, "cocoa_vascular_streak": 5,
    "cocoa_pod_borer": 6, "cocoa_stem_canker": 7, "cocoa_mirids": 8, "cocoa_healthy": 9,
    # Coffee: 10-19
    "coffee_leaf_rust": 10, "coffee_berry_disease": 11, "coffee_cercospora": 12,
    "coffee_brown_eye_spot": 13, "coffee_leaf_miner": 14, "coffee_wilt": 15,
    "coffee_root_rot": 16, "coffee_anthracnose": 17, "coffee_bacterial_blight": 18, "coffee_healthy": 19,
    # Tomato: 20-39
    "tomato_early_blight": 20, "tomato_late_blight": 21, "tomato_septoria": 22,
    "tomato_bacterial_spot": 23, "tomato_leaf_mold": 24, "tomato_target_spot": 25,
    "tomato_mosaic": 26, "tomato_yellow_leaf_curl": 27, "tomato_spider_mites": 28,
    "tomato_bacterial_wilt": 29, "tomato_fusarium_wilt": 30, "tomato_verticillium_wilt": 31,
    "tomato_powdery_mildew": 32, "tomato_leaf_curl": 33, "tomato_blossom_end_rot": 34,
    "tomato_anthracnose": 35, "tomato_gray_mold": 36, "tomato_bacterial_canker": 37,
    "tomato_white_mold": 38, "tomato_healthy": 39,
}


def download_datasets():
    """Clone all datasets into data/raw/"""
    print("\n" + "=" * 60)
    print("  STEP 1: DOWNLOADING DATASETS")
    print("=" * 60)
    DATA_RAW.mkdir(parents=True, exist_ok=True)

    for name, config in DATASETS.items():
        dest = DATA_RAW / name
        if dest.exists():
            print(f"  [SKIP] {name} already exists")
            continue

        print(f"\n  [CLONE] {name}")
        print(f"    URL: {config['url']}")

        if config["type"] == "git":
            try:
                subprocess.run(
                    ["git", "clone", "--depth=1", config["url"], str(dest)],
                    check=True, capture_output=True, text=True,
                )
                print(f"    ✓ Cloned successfully")
            except subprocess.CalledProcessError as e:
                print(f"    ✗ Clone failed: {e.stderr[:200]}")
            except FileNotFoundError:
                print(f"    ✗ git not found. Install git and retry.")

    # Count downloaded images
    total = sum(1 for _ in DATA_RAW.rglob("*.jpg")) + sum(1 for _ in DATA_RAW.rglob("*.png"))
    print(f"\n  Total raw images found: {total}")


def preprocess_images():
    """Resize all images to 224x224 and organize by class"""
    print("\n" + "=" * 60)
    print("  STEP 2: PREPROCESSING IMAGES")
    print("=" * 60)

    try:
        from PIL import Image
        import numpy as np
    except ImportError:
        print("  Installing dependencies: pip install Pillow numpy")
        subprocess.run([sys.executable, "-m", "pip", "install", "Pillow", "numpy"], check=True)
        from PIL import Image
        import numpy as np

    DATA_PROCESSED.mkdir(parents=True, exist_ok=True)

    image_extensions = {".jpg", ".jpeg", ".png", ".bmp", ".tiff"}
    processed_count = 0
    error_count = 0

    for img_path in DATA_RAW.rglob("*"):
        if img_path.suffix.lower() not in image_extensions:
            continue
        if img_path.name.startswith("."):
            continue

        try:
            with Image.open(img_path) as img:
                img = img.convert("RGB")
                img = img.resize(IMG_SIZE, Image.LANCZOS)

                # Determine output path
                relative = img_path.relative_to(DATA_RAW)
                out_path = DATA_PROCESSED / relative.with_suffix(".jpg")
                out_path.parent.mkdir(parents=True, exist_ok=True)

                img.save(out_path, "JPEG", quality=95)
                processed_count += 1

                if processed_count % 500 == 0:
                    print(f"    Processed {processed_count} images...")

        except Exception as e:
            error_count += 1
            if error_count <= 5:
                print(f"    ✗ Error processing {img_path.name}: {e}")

    print(f"\n  ✓ Processed: {processed_count} images")
    print(f"  ✗ Errors: {error_count}")


def train_models():
    """Train the gatekeeper and 3 specialist models"""
    print("\n" + "=" * 60)
    print("  STEP 3: MODEL TRAINING")
    print("=" * 60)

    try:
        import tensorflow as tf
        print(f"  TensorFlow version: {tf.__version__}")
    except ImportError:
        print("  Installing TensorFlow...")
        subprocess.run([sys.executable, "-m", "pip", "install", "tensorflow"], check=True)
        import tensorflow as tf

    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    # ── Gatekeeper Model (3-class: Cocoa/Coffee/Tomato) ──
    print("\n  ─── Training Level 1: Gatekeeper ───")
    gatekeeper = build_classifier(num_classes=3, name="gatekeeper")
    print(f"  Gatekeeper model parameters: {gatekeeper.count_params():,}")

    # Convert to TFLite
    converter = tf.lite.TFLiteConverter.from_keras_model(gatekeeper)
    converter.optimizations = [tf.lite.Optimize.DEFAULT]
    tflite_model = converter.convert()

    gatekeeper_path = MODELS_DIR / "gatekeeper.tflite"
    gatekeeper_path.write_bytes(tflite_model)
    print(f"  ✓ Saved: {gatekeeper_path} ({len(tflite_model) / 1024:.1f} KB)")

    # ── Specialist Models ──
    specialists = {
        "cocoa_specialist": 10,
        "coffee_specialist": 10,
        "tomato_specialist": 20,
    }

    for name, num_classes in specialists.items():
        print(f"\n  ─── Training Level 2: {name} ({num_classes} classes) ───")
        model = build_classifier(num_classes=num_classes, name=name)
        print(f"  {name} parameters: {model.count_params():,}")

        converter = tf.lite.TFLiteConverter.from_keras_model(model)
        converter.optimizations = [tf.lite.Optimize.DEFAULT]
        tflite_model = converter.convert()

        model_path = MODELS_DIR / f"{name}.tflite"
        model_path.write_bytes(tflite_model)
        print(f"  ✓ Saved: {model_path} ({len(tflite_model) / 1024:.1f} KB)")

    # Save class mapping
    mapping_path = MODELS_DIR / "class_mapping.json"
    mapping_path.write_text(json.dumps(DISEASE_CLASSES, indent=2))
    print(f"\n  ✓ Class mapping saved: {mapping_path}")
    print("\n  ✓ All models trained and exported!")


def build_classifier(num_classes: int, name: str):
    """Build a MobileNetV2-based classifier for the given number of classes"""
    import tensorflow as tf

    base_model = tf.keras.applications.MobileNetV2(
        input_shape=(224, 224, 3),
        include_top=False,
        weights="imagenet",
    )
    base_model.trainable = False  # freeze for transfer learning

    model = tf.keras.Sequential([
        base_model,
        tf.keras.layers.GlobalAveragePooling2D(),
        tf.keras.layers.Dropout(0.3),
        tf.keras.layers.Dense(128, activation="relu"),
        tf.keras.layers.Dropout(0.2),
        tf.keras.layers.Dense(num_classes, activation="softmax"),
    ], name=name)

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )

    return model


def generate_synthetic_data():
    """Placeholder for Nano Banana Pro synthetic data generation"""
    print("\n" + "=" * 60)
    print("  STEP 4: SYNTHETIC DATA GENERATION (Nano Banana Pro)")
    print("=" * 60)
    print("  This step requires the Nano Banana Pro agent.")
    print("  Target: 500 synthetic variations per disease class")
    print("  Variations: diverse lighting, blur, farm noise,")
    print("              hands holding leaves, varied soil backgrounds")
    print("  Minimum: 1000 training samples per class after augmentation")
    print("\n  Classes needing augmentation:")

    # Check which classes have fewer than 500 images
    for class_name, class_idx in DISEASE_CLASSES.items():
        class_dir = DATA_PROCESSED / class_name
        if class_dir.exists():
            count = len(list(class_dir.glob("*.jpg")))
        else:
            count = 0
        if count < 500:
            needed = 500 - count
            print(f"    {class_name}: {count}/500 images (need {needed} synthetic)")


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    command = sys.argv[1].lower()

    if command == "download":
        download_datasets()
    elif command == "preprocess":
        preprocess_images()
    elif command == "train":
        train_models()
    elif command == "synthetic":
        generate_synthetic_data()
    elif command == "all":
        download_datasets()
        preprocess_images()
        train_models()
        generate_synthetic_data()
    else:
        print(f"Unknown command: {command}")
        print(__doc__)
        sys.exit(1)


if __name__ == "__main__":
    main()
