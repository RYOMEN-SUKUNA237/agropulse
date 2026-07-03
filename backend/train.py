#!/usr/bin/env python3
"""
AgroPulse Model Trainer — Trains real TFLite models from downloaded datasets.

Usage:
  python train.py             # Train all models
  python train.py gatekeeper  # Train gatekeeper only
  python train.py tomato      # Train tomato specialist only
"""

import os
import sys
import json
import shutil
from pathlib import Path
import numpy as np

BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data" / "organized"
MODELS_DIR = BASE_DIR / "models"

IMG_SIZE = (224, 224)
BATCH_SIZE = 32
EPOCHS_GATEKEEPER = 15
EPOCHS_SPECIALIST = 20


def check_tensorflow():
    try:
        import tensorflow as tf
        print(f"  TensorFlow: {tf.__version__}")
        gpus = tf.config.list_physical_devices('GPU')
        print(f"  GPU available: {len(gpus) > 0} ({gpus})")
        return tf
    except ImportError:
        print("  ERROR: TensorFlow not installed")
        print("  Run: pip install tensorflow")
        sys.exit(1)


def build_model(num_classes: int, name: str = "model"):
    """Build MobileNetV2-based classifier with transfer learning."""
    import tensorflow as tf

    base = tf.keras.applications.MobileNetV2(
        input_shape=(224, 224, 3), include_top=False, weights="imagenet"
    )
    # Freeze first 100 layers, fine-tune the rest
    for layer in base.layers[:100]:
        layer.trainable = False
    for layer in base.layers[100:]:
        layer.trainable = True

    model = tf.keras.Sequential([
        base,
        tf.keras.layers.GlobalAveragePooling2D(),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.Dropout(0.4),
        tf.keras.layers.Dense(256, activation="relu"),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.Dropout(0.3),
        tf.keras.layers.Dense(num_classes, activation="softmax"),
    ], name=name)

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-4),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model


def create_data_generators(data_dir: Path, img_size=(224, 224), batch_size=32):
    """Create train/validation data generators with augmentation."""
    import tensorflow as tf

    train_gen = tf.keras.preprocessing.image.ImageDataGenerator(
        rescale=1./255,
        rotation_range=30,
        width_shift_range=0.2,
        height_shift_range=0.2,
        shear_range=0.2,
        zoom_range=0.3,
        horizontal_flip=True,
        vertical_flip=True,
        brightness_range=[0.7, 1.3],
        fill_mode='nearest',
        validation_split=0.2,
    )

    train_data = train_gen.flow_from_directory(
        str(data_dir), target_size=img_size, batch_size=batch_size,
        class_mode="categorical", subset="training", shuffle=True,
    )

    val_data = train_gen.flow_from_directory(
        str(data_dir), target_size=img_size, batch_size=batch_size,
        class_mode="categorical", subset="validation", shuffle=False,
    )

    return train_data, val_data


def train_gatekeeper():
    """Train the 3-class crop type classifier (Cocoa/Coffee/Tomato)."""
    tf = check_tensorflow()
    print("\n" + "=" * 60)
    print("  🎯 TRAINING: Level 1 Gatekeeper (Crop Classifier)")
    print("=" * 60)

    # Create a temporary gatekeeper dataset
    gk_dir = BASE_DIR / "data" / "gatekeeper_temp"
    if gk_dir.exists():
        shutil.rmtree(gk_dir)

    crop_dirs = [d for d in DATA_DIR.iterdir() if d.is_dir()]
    if len(crop_dirs) == 0:
        print("  ✗ No organized data found. Run dataset_manager.py first.")
        return

    for crop_dir in crop_dirs:
        dest = gk_dir / crop_dir.name
        dest.mkdir(parents=True, exist_ok=True)
        count = 0
        for class_dir in crop_dir.iterdir():
            if not class_dir.is_dir():
                continue
            for img in class_dir.iterdir():
                if img.suffix.lower() in {".jpg", ".jpeg", ".png"} and count < 2000:
                    shutil.copy2(img, dest / f"{class_dir.name}_{img.name}")
                    count += 1
        print(f"  {crop_dir.name}: {count} images for gatekeeper")

    train_data, val_data = create_data_generators(gk_dir, IMG_SIZE, BATCH_SIZE)
    num_classes = train_data.num_classes
    print(f"  Classes: {train_data.class_indices}")
    print(f"  Training samples: {train_data.samples}")
    print(f"  Validation samples: {val_data.samples}")

    model = build_model(num_classes, "gatekeeper")
    print(f"  Parameters: {model.count_params():,}")

    callbacks = [
        tf.keras.callbacks.EarlyStopping(patience=5, restore_best_weights=True),
        tf.keras.callbacks.ReduceLROnPlateau(factor=0.5, patience=3),
    ]

    history = model.fit(
        train_data, validation_data=val_data,
        epochs=EPOCHS_GATEKEEPER, callbacks=callbacks,
    )

    # Save model
    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    # Save Keras
    model.save(str(MODELS_DIR / "gatekeeper.keras"))

    # Convert to TFLite
    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    converter.optimizations = [tf.lite.Optimize.DEFAULT]
    tflite_model = converter.convert()
    tflite_path = MODELS_DIR / "gatekeeper.tflite"
    tflite_path.write_bytes(tflite_model)

    # Save class mapping
    mapping = {v: k for k, v in train_data.class_indices.items()}
    (MODELS_DIR / "gatekeeper_classes.json").write_text(json.dumps(mapping, indent=2))

    val_acc = max(history.history.get("val_accuracy", [0]))
    print(f"\n  ✓ Gatekeeper trained — Val accuracy: {val_acc:.1%}")
    print(f"  ✓ Saved: {tflite_path} ({len(tflite_model)//1024} KB)")

    # Cleanup
    shutil.rmtree(gk_dir, ignore_errors=True)


def train_specialist(crop: str):
    """Train a specialist model for one crop's diseases."""
    tf = check_tensorflow()
    crop_dir = DATA_DIR / crop
    if not crop_dir.exists():
        print(f"  ✗ No data for {crop} at {crop_dir}")
        return

    print(f"\n" + "=" * 60)
    print(f"  🔬 TRAINING: Level 2 — {crop} Specialist")
    print("=" * 60)

    train_data, val_data = create_data_generators(crop_dir, IMG_SIZE, BATCH_SIZE)
    num_classes = train_data.num_classes
    print(f"  Classes ({num_classes}): {list(train_data.class_indices.keys())}")
    print(f"  Training: {train_data.samples}, Validation: {val_data.samples}")

    model = build_model(num_classes, f"{crop.lower()}_specialist")
    print(f"  Parameters: {model.count_params():,}")

    callbacks = [
        tf.keras.callbacks.EarlyStopping(patience=7, restore_best_weights=True),
        tf.keras.callbacks.ReduceLROnPlateau(factor=0.5, patience=3),
    ]

    history = model.fit(
        train_data, validation_data=val_data,
        epochs=EPOCHS_SPECIALIST, callbacks=callbacks,
    )

    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    model.save(str(MODELS_DIR / f"{crop.lower()}_specialist.keras"))

    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    converter.optimizations = [tf.lite.Optimize.DEFAULT]
    tflite_model = converter.convert()
    tflite_path = MODELS_DIR / f"{crop.lower()}_specialist.tflite"
    tflite_path.write_bytes(tflite_model)

    mapping = {v: k for k, v in train_data.class_indices.items()}
    (MODELS_DIR / f"{crop.lower()}_specialist_classes.json").write_text(json.dumps(mapping, indent=2))

    val_acc = max(history.history.get("val_accuracy", [0]))
    print(f"\n  ✓ {crop} specialist trained — Val accuracy: {val_acc:.1%}")
    print(f"  ✓ Saved: {tflite_path} ({len(tflite_model)//1024} KB)")


def train_all():
    """Train gatekeeper + all specialist models."""
    print("\n" + "🌱" * 30)
    print("  AGROPULSE FULL MODEL TRAINING PIPELINE")
    print("🌱" * 30)

    train_gatekeeper()
    for crop in ["Cocoa", "Coffee", "Tomato"]:
        train_specialist(crop)

    print("\n" + "=" * 60)
    print("  ✅ ALL MODELS TRAINED SUCCESSFULLY")
    print("=" * 60)
    for f in MODELS_DIR.glob("*.tflite"):
        print(f"  📦 {f.name} ({f.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    target = sys.argv[1].lower() if len(sys.argv) > 1 else "all"
    if target == "all":
        train_all()
    elif target == "gatekeeper":
        train_gatekeeper()
    elif target in ("cocoa", "coffee", "tomato"):
        train_specialist(target.capitalize())
    else:
        print(f"Usage: python train.py [all|gatekeeper|cocoa|coffee|tomato]")
