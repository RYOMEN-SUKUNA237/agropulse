#!/usr/bin/env python3
"""
AgroPulse v6 — Correct, Contamination-Free Training Pipeline
============================================================
Why the previous versions always predicted "tomato early blight":
  * The old loader matched folders to classes with GLOBAL keyword maps,
    checking Tomato/Coffee first and using substring matching. Generic words
    (`healthy`, `rust`, `mosaic`, `spider_mite`) leaked across crops, so e.g.
    EVERY crop's `healthy` folder was relabelled `tomato_healthy`, and maize
    `Common Rust` became `coffee_leaf_rust`. The labels were scrambled.
  * 33 of 57 classes had zero data; several datasets were YOLO-detection
    format (images/+labels/) and were silently skipped.

v6 fixes both:
  1. EXPLICIT PER-DATASET routing — each /kaggle/input/<dir> has its own
     ordered (substring -> canonical class) map. A folder is only ever
     interpreted in the context of its own dataset, so no cross-crop leak.
  2. A fixed, curated 31-class list (only classes that actually have clean
     data). Empty/contaminated classes are gone.
  3. Balanced sampling (cap majority, clip class weights), strong augmentation.
  4. Stratified train/val/TEST split + a confusion matrix and per-class
     precision/recall on the held-out TEST set so accuracy is PROVEN, not guessed.
  5. A post-export self-test: the exported TFLite model is reloaded and run on
     real test images to confirm it works before you ever download it.
  6. Multi-GPU (T4 x2) via MirroredStrategy when available.

Preprocessing contract (must match the web app in src/services/aiPipeline.ts):
  Input  : [1, 224, 224, 3] float32 in RANGE [0, 255]
  Model  : an internal Rescaling layer maps [0,255] -> [-1,1] for MobileNetV2
  Output : [1, N] float32 softmax
"""

import os
import sys
import json
import math
from pathlib import Path
from collections import defaultdict, Counter
from typing import Dict, List, Optional, Tuple
from multiprocessing import Pool

sys.stdout.reconfigure(line_buffering=True)
sys.stderr.reconfigure(line_buffering=True)

import numpy as np
import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import (Dense, GlobalAveragePooling2D,
                                      Dropout, BatchNormalization)
from tensorflow.keras.models import Model
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau

# ═══════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════

KAGGLE_INPUT = Path("/kaggle/input")
OUTPUT_DIR   = Path("/kaggle/working")
MODEL_PATH   = OUTPUT_DIR / "agropulse_offline_model.tflite"
CLASSES_PATH = OUTPUT_DIR / "agropulse_classes.json"

IMAGE_SIZE = (224, 224)
BASE_BATCH = 32
EPOCHS_P1  = 6     # head only
EPOCHS_P2  = 16    # fine-tune
MAX_IMAGES_PER_CLASS = 3500   # cap majority classes to limit tomato dominance
MIN_IMAGES_PER_CLASS = 60     # drop a class if it ends up below this
VAL_FRAC   = 0.10
TEST_FRAC  = 0.10
SEED       = 42

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp"}

# ═══════════════════════════════════════════════════════════════════
# FINAL CLASS LIST (37) — the canonical output order. Must stay in sync
# with agropulse_classes.json consumed by the app. Crop is derived from
# the prefix before the first underscore.
# ═══════════════════════════════════════════════════════════════════

FINAL_CLASSES = [
    # Tomato (10)
    "tomato_bacterial_spot", "tomato_early_blight", "tomato_late_blight",
    "tomato_leaf_mold", "tomato_septoria", "tomato_spider_mites",
    "tomato_target_spot", "tomato_mosaic", "tomato_yellow_leaf_curl",
    "tomato_healthy",
    # Coffee (4)
    "coffee_cercospora", "coffee_brown_eye_spot", "coffee_leaf_rust",
    "coffee_healthy",
    # Cocoa (4)
    "cocoa_black_pod", "cocoa_monilia", "cocoa_pod_borer", "cocoa_healthy",
    # Banana (8)
    "banana_black_sigatoka", "banana_yellow_sigatoka", "banana_panama",
    "banana_moko", "banana_bract_mosaic", "banana_insect_pest",
    "banana_cordana", "banana_healthy",
    # Maize (7)
    "maize_gray_leaf_spot", "maize_common_rust", "maize_northern_blight",
    "maize_streak_virus", "maize_fall_armyworm", "maize_ear_rot",
    "maize_healthy",
    # Whole-fruit recognition (3) — lets the model tell a fruit from a leaf
    # instead of forcing a fruit photo into a leaf-disease label.
    "tomato_fruit", "banana_fruit", "coffee_cherry",
    # Negative / rejection (1) — non-crop images (objects, people, animals,
    # vehicles, scenery). Combined with app-side confidence gating this makes
    # the model REJECT out-of-scope photos instead of hallucinating a disease.
    "not_plant",
]

# ═══════════════════════════════════════════════════════════════════
# PER-CROP FOLDER -> CLASS MAPS (ordered; first matching substring wins).
# A value of None means "ignore these images" (e.g. classes we don't model).
# These are applied ONLY within their own dataset, so generic tokens like
# "healthy" never leak across crops.
# ═══════════════════════════════════════════════════════════════════

TOMATO_MAP: List[Tuple[str, Optional[str]]] = [
    ("yellow_leaf_curl", "tomato_yellow_leaf_curl"),
    ("yellow leaf curl", "tomato_yellow_leaf_curl"),
    ("bacterial_spot",   "tomato_bacterial_spot"),
    ("bacterial spot",   "tomato_bacterial_spot"),
    ("early_blight",     "tomato_early_blight"),
    ("early blight",     "tomato_early_blight"),
    ("late_blight",      "tomato_late_blight"),
    ("late blight",      "tomato_late_blight"),
    ("leaf_mold",        "tomato_leaf_mold"),
    ("leaf mold",        "tomato_leaf_mold"),
    ("septoria",         "tomato_septoria"),
    ("spider",           "tomato_spider_mites"),
    ("target",           "tomato_target_spot"),
    ("mosaic",           "tomato_mosaic"),
    ("healthy",          "tomato_healthy"),
]

COFFEE_MAP: List[Tuple[str, Optional[str]]] = [
    ("red_spider",  None),          # no coffee spider-mite class
    ("red spider",  None),
    ("cerscospora", "coffee_cercospora"),   # common misspelling in datasets
    ("cercospora",  "coffee_cercospora"),
    ("phoma",       "coffee_brown_eye_spot"),
    ("brown_eye",   "coffee_brown_eye_spot"),
    ("brown eye",   "coffee_brown_eye_spot"),
    ("rust",        "coffee_leaf_rust"),
    ("healthy",     "coffee_healthy"),
]

COCOA_MAP: List[Tuple[str, Optional[str]]] = [
    ("black_pod", "cocoa_black_pod"),
    ("black pod", "cocoa_black_pod"),
    ("fito",      "cocoa_black_pod"),   # Fitoftora / Phytophthora = black pod
    ("pod_borer", "cocoa_pod_borer"),
    ("pod borer", "cocoa_pod_borer"),
    ("monilia",   "cocoa_monilia"),
    ("sana",      "cocoa_healthy"),     # "sana" = healthy (Spanish)
    ("healthy",   "cocoa_healthy"),
]

BANANA_MAP: List[Tuple[str, Optional[str]]] = [
    ("black_sigatoka",  "banana_black_sigatoka"),
    ("black sigatoka",  "banana_black_sigatoka"),
    ("yellow_sigatoka", "banana_yellow_sigatoka"),
    ("yellow sigatoka", "banana_yellow_sigatoka"),
    ("bract",           "banana_bract_mosaic"),
    ("insect",          "banana_insect_pest"),
    ("moko",            "banana_moko"),
    ("panama",          "banana_panama"),
    ("cordana",         "banana_cordana"),
    ("pestalotiopsis",  None),         # not modelled
    ("sigatoka",        "banana_black_sigatoka"),   # generic fallback
    ("healthy",         "banana_healthy"),
]

MAIZE_MAP: List[Tuple[str, Optional[str]]] = [
    ("gray_leaf_spot", "maize_gray_leaf_spot"),
    ("grey_leaf_spot", "maize_gray_leaf_spot"),
    ("gray leaf spot", "maize_gray_leaf_spot"),
    ("leaf_spot",      "maize_gray_leaf_spot"),
    ("leaf spot",      "maize_gray_leaf_spot"),
    ("common_rust",    "maize_common_rust"),
    ("common rust",    "maize_common_rust"),
    ("northern",       "maize_northern_blight"),
    ("streak",         "maize_streak_virus"),
    ("ear_rot",        "maize_ear_rot"),
    ("ear rot",        "maize_ear_rot"),
    ("armyworm",       "maize_fall_armyworm"),
    ("stem borer",     None),         # no class
    ("stem_borer",     None),
    ("grasshop",       None),
    ("blight",         "maize_northern_blight"),   # generic blight -> northern
    ("rust",           "maize_common_rust"),        # generic rust fallback
    ("healthy",        "maize_healthy"),
]

# ── PlantDoc: FIELD-condition disease photos (real phone shots, cluttered
#    backgrounds). Contains many crops; we take ONLY Tomato + Corn folders and
#    route them into our existing leaf classes. Everything else → None (skip).
#    Folders are underscored (e.g. Tomato_leaf_late_blight, Corn_rust_leaf), so
#    disease-specific needles MUST precede the generic "tomato_leaf" (healthy).
PLANTDOC_MAP: List[Tuple[str, Optional[str]]] = [
    ("tomato_early_blight",        "tomato_early_blight"),
    ("tomato_septoria",            "tomato_septoria"),
    ("tomato_leaf_bacterial_spot", "tomato_bacterial_spot"),
    ("tomato_leaf_late_blight",    "tomato_late_blight"),
    ("tomato_leaf_mosaic",         "tomato_mosaic"),
    ("tomato_leaf_yellow",         "tomato_yellow_leaf_curl"),
    ("tomato_mold_leaf",           "tomato_leaf_mold"),
    ("tomato_two_spotted_spider",  "tomato_spider_mites"),
    ("tomato_leaf",                "tomato_healthy"),   # plain "Tomato_leaf" = healthy; AFTER specifics
    ("corn_gray_leaf_spot",        "maize_gray_leaf_spot"),
    ("corn_leaf_blight",           "maize_northern_blight"),
    ("corn_rust",                  "maize_common_rust"),
]

# ── Whole-FRUIT recognition maps. These teach the model that a fruit photo is a
#    fruit (not a leaf disease). Fruits-360 holds hundreds of fruits; take only
#    banana + tomato (leading slash matches the class-folder boundary).
FRUITS360_MAP: List[Tuple[str, Optional[str]]] = [
    ("/banana", "banana_fruit"),
    ("/tomato", "tomato_fruit"),
]
BANANA_FRUIT_MAP:  List[Tuple[str, Optional[str]]] = [("banana", "banana_fruit")]   # all-banana ripeness set
COFFEE_CHERRY_MAP: List[Tuple[str, Optional[str]]] = [("images", "coffee_cherry")]  # flat images/ of cherries

# ── NEGATIVE / rejection maps → not_plant. natural-images: skip its flower/fruit
#    folders (would clash with real foliage/fruit), keep objects/animals/vehicles/
#    people. intel scenes: skip "forest" (distant green canopy could teach the
#    model that green = not-plant and reject real leaves); keep the rest.
NATURAL_IMAGES_MAP: List[Tuple[str, Optional[str]]] = [
    ("/flower",    None),
    ("/fruit",     None),
    ("/airplane",  "not_plant"),
    ("/car",       "not_plant"),
    ("/cat",       "not_plant"),
    ("/dog",       "not_plant"),
    ("/motorbike", "not_plant"),
    ("/person",    "not_plant"),
]
INTEL_MAP: List[Tuple[str, Optional[str]]] = [
    ("forest",     None),
    ("buildings",  "not_plant"),
    ("glacier",    "not_plant"),
    ("mountain",   "not_plant"),
    ("/sea",       "not_plant"),
    ("street",     "not_plant"),
    ("seg_pred",   "not_plant"),
]

# ═══════════════════════════════════════════════════════════════════
# DATASET ROUTING — keyed by the EXACT top-level dir under /kaggle/input.
# (Kaggle mounts each dataset at /kaggle/input/<dataset-name>.)
# value = (crop_map, require_substring_or_None)
#   require_substring: if set, the relative path must contain it for the
#   image to be considered (used to take ONLY maize from the CCMT set).
# ═══════════════════════════════════════════════════════════════════

DATASET_RULES: Dict[str, Tuple[List[Tuple[str, Optional[str]]], Optional[str]]] = {
    # Tomato — kept ONE source. Dropped ashishmotwani/tomato (byte-identical
    # duplicate → train/val leakage) and plantvillage-tomato-leaf-dataset
    # (internally duplicated, lab-only, redundant).
    "tomato-disease-multiple-sources":         (TOMATO_MAP, None),
    # Coffee — dropped ethiopian-coffee-leaf-disease (12k augmented copies of
    # the same 4 classes jmuben already covers with 58k real images).
    "rocole-a-robusta-coffee-leaf-images-dataset": (COFFEE_MAP, None),
    "jmuben-coffee-dataset":                   (COFFEE_MAP, None),
    # Cocoa
    "cacao-diseases":                          (COCOA_MAP, None),
    "enfermedades-cacao-yolov4":               (COCOA_MAP, None),
    # Banana
    "banana-disease-recognition-dataset":      (BANANA_MAP, None),
    "bananalsd":                               (BANANA_MAP, None),
    # Maize
    "maize-disease-dataset":                   (MAIZE_MAP, None),
    "consolidated-corn-dataset":               (MAIZE_MAP, None),
    "corn-or-maize-leaf-disease-dataset":      (MAIZE_MAP, None),
    "crop-care-dataset-v2":                    (MAIZE_MAP, "maize"),  # maize only
    # Field-condition disease photos (real phone shots) → tomato + maize leaf
    # classes. Directly targets the weak FIELD accuracy (lab data dominates).
    "plantdoc-dataset":                        (PLANTDOC_MAP, None),
    # Whole-fruit recognition (tell fruit from leaf)
    "fruits":                                  (FRUITS360_MAP, None),   # moltean/fruits (Fruits-360)
    "banana-ripeness-classification-dataset":  (BANANA_FRUIT_MAP, None),
    "dataset-coffee-cherry":                   (COFFEE_CHERRY_MAP, None),
    # Negative / rejection class → not_plant (reject non-crop photos)
    "natural-images":                          (NATURAL_IMAGES_MAP, None),
    "intel-image-classification":              (INTEL_MAP, None),
}

CLASS_INDEX = {c: i for i, c in enumerate(FINAL_CLASSES)}


def identify_dataset(dir_parts: List[str]) -> Tuple[Optional[str], Optional[Tuple], str]:
    """Find which attached dataset an image belongs to by matching a
    DATASET_RULES slug against ANY component of its path. Kaggle does not
    always mount each dataset at /kaggle/input/<slug>; when many are attached
    it may nest several under a wrapper dir (e.g. /kaggle/input/datasets/<slug>/…).
    Keying on parts[0] then silently drops everything nested, so we search the
    whole path instead. Returns (matched_slug, rule, lowercased_full_path)."""
    lower_parts = [p.lower() for p in dir_parts]
    full = "/".join(lower_parts)
    for key, val in DATASET_RULES.items():
        if key in lower_parts or key in full:
            return key, val, full
    return None, None, full


def route_path(dir_parts: List[str]) -> Optional[str]:
    """Return the canonical class for an image path, or None to skip."""
    _, rule, full = identify_dataset(dir_parts)
    if rule is None:
        return None
    crop_map, require = rule
    if require is not None and require not in full:
        return None
    for needle, cls in crop_map:
        if needle in full:
            return cls   # may be None (explicit ignore)
    return None


# ═══════════════════════════════════════════════════════════════════
# IMAGE VALIDATION (parallel)
# ═══════════════════════════════════════════════════════════════════

from PIL import Image

def check_image_ok_worker(path_str: str) -> tuple:
    try:
        p = Path(path_str)
        if p.stat().st_size < 512:
            return path_str, False
        with open(p, "rb") as f:
            header = f.read(12)
        if not header:
            return path_str, False
        ok = (header.startswith(b"\xff\xd8") or
              header.startswith(b"\x89PNG\r\n\x1a\n") or
              header.startswith(b"GIF8") or
              header.startswith(b"BM"))
        if not ok:
            return path_str, False
        with Image.open(p) as img:
            # FULL pixel decode — catches truncated/corrupt scan data that
            # verify() (header-only) misses and that would otherwise crash
            # TensorFlow's decode_image mid-training.
            img.convert("RGB").load()
        return path_str, True
    except Exception:
        return path_str, False


# ═══════════════════════════════════════════════════════════════════
# DATASET DISCOVERY
# ═══════════════════════════════════════════════════════════════════

print("=" * 64)
print("Scanning /kaggle/input/ …")

seen_dataset_dirs = set()
candidate_paths: List[Path] = []
for d1 in sorted(KAGGLE_INPUT.iterdir()):
    if not d1.is_dir():
        continue
    seen_dataset_dirs.add(d1.name)
    for path in d1.rglob("*"):
        if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS:
            candidate_paths.append(path)

print(f"Mounted top-level dirs: {sorted(seen_dataset_dirs)}")
# Sanity check: every attached dataset slug must appear SOMEWHERE in the mounted
# tree (it may be nested under a wrapper dir). Warn only if a slug is truly absent.
mounted_blob = "\n".join(str(p).lower() for p in candidate_paths[:200000])
missing_slugs = [k for k in DATASET_RULES if k not in mounted_blob]
if missing_slugs:
    print(f"⚠️  Attached datasets NOT found in mount tree: {missing_slugs}")
else:
    print("✓ All attached dataset slugs are present in the mounted tree.")
print(f"Found {len(candidate_paths)} candidate image files. Verifying in parallel…")

path_strs = [str(p) for p in candidate_paths]
valid_paths = set()
with Pool() as pool:
    for path_str, ok in pool.map(check_image_ok_worker, path_strs, chunksize=200):
        if ok:
            valid_paths.add(path_str)
print(f"Valid images: {len(valid_paths)}")

# Route every valid image to a class
per_class_paths: Dict[int, List[str]] = defaultdict(list)
skipped_by_dataset = Counter()
routed_by_dataset = Counter()

for path_str in sorted(valid_paths):
    path = Path(path_str)
    try:
        rel = path.relative_to(KAGGLE_INPUT)
        parts = list(rel.parts)
    except Exception:
        continue
    if len(parts) < 2:
        continue
    dir_parts = parts[:-1]    # every directory from just under /kaggle/input to the file's parent
    disp_key, _, _ = identify_dataset(dir_parts)
    disp = disp_key or parts[0]   # key the diagnostic by matched slug, not the (possibly wrapper) top dir
    cls = route_path(dir_parts)
    if cls is None or cls not in CLASS_INDEX:
        skipped_by_dataset[disp] += 1
        continue
    per_class_paths[CLASS_INDEX[cls]].append(path_str)
    routed_by_dataset[disp] += 1

print("\nRouted images per dataset (identified by slug, nesting-agnostic):")
for d in sorted(set(routed_by_dataset) | set(skipped_by_dataset)):
    print(f"  {d:<46s} routed={routed_by_dataset[d]:6d}  skipped={skipped_by_dataset[d]:6d}")

# Apply per-class cap (shuffle deterministically first)
rng = np.random.default_rng(SEED)
for idx in list(per_class_paths.keys()):
    paths = per_class_paths[idx]
    rng.shuffle(paths)
    if len(paths) > MAX_IMAGES_PER_CLASS:
        per_class_paths[idx] = paths[:MAX_IMAGES_PER_CLASS]

print("\nFinal class distribution (after cap):")
kept_classes = []
for i, cls in enumerate(FINAL_CLASSES):
    cnt = len(per_class_paths.get(i, []))
    flag = ""
    if cnt < MIN_IMAGES_PER_CLASS:
        flag = "  ✗ DROPPED (too few)"
    else:
        kept_classes.append(i)
    bar = "█" * (cnt // 80)
    print(f"  {i:2d}  {cls:<26s} {cnt:5d}  {bar}{flag}")

if any(len(per_class_paths.get(i, [])) < MIN_IMAGES_PER_CLASS for i in range(len(FINAL_CLASSES))):
    print("\n⚠️  Some classes fell below the minimum and would be dropped. "
          "Re-indexing to a compact label space.")

# Re-index to a compact, gap-free label space over the kept classes only,
# preserving FINAL_CLASSES order. This keeps softmax tight and keeps
# agropulse_classes.json aligned with the model outputs.
kept_classes = [i for i in range(len(FINAL_CLASSES))
                if len(per_class_paths.get(i, [])) >= MIN_IMAGES_PER_CLASS]
ACTIVE_CLASSES = [FINAL_CLASSES[i] for i in kept_classes]
NUM_CLASSES = len(ACTIVE_CLASSES)
old_to_new = {old: new for new, old in enumerate(kept_classes)}
print(f"\nTraining on {NUM_CLASSES} classes: {ACTIVE_CLASSES}")

# ═══════════════════════════════════════════════════════════════════
# STRATIFIED TRAIN / VAL / TEST SPLIT
# ═══════════════════════════════════════════════════════════════════

train_paths, train_labels = [], []
val_paths,   val_labels   = [], []
test_paths,  test_labels  = [], []

for old_idx in kept_classes:
    new_idx = old_to_new[old_idx]
    paths = per_class_paths[old_idx][:]
    rng.shuffle(paths)
    n = len(paths)
    n_test = max(1, int(n * TEST_FRAC))
    n_val  = max(1, int(n * VAL_FRAC))
    test_p = paths[:n_test]
    val_p  = paths[n_test:n_test + n_val]
    train_p = paths[n_test + n_val:]
    for p in train_p: train_paths.append(p); train_labels.append(new_idx)
    for p in val_p:   val_paths.append(p);   val_labels.append(new_idx)
    for p in test_p:  test_paths.append(p);  test_labels.append(new_idx)

print(f"\nSplit → train={len(train_paths)}  val={len(val_paths)}  test={len(test_paths)}")

# ═══════════════════════════════════════════════════════════════════
# CLASS WEIGHTS (balanced, clipped to avoid rare-class explosion)
# ═══════════════════════════════════════════════════════════════════

train_counts = Counter(train_labels)
total_train = len(train_labels)
class_weight = {}
for i in range(NUM_CLASSES):
    cnt = train_counts.get(i, 0)
    w = (total_train / (NUM_CLASSES * cnt)) if cnt > 0 else 1.0
    class_weight[i] = float(min(8.0, max(0.5, w)))   # clip to [0.5, 8]
print("\nClass weights (clipped to [0.5, 8]):")
for i in range(NUM_CLASSES):
    print(f"  {i:2d} {ACTIVE_CLASSES[i]:<26s} n={train_counts.get(i,0):5d}  w={class_weight[i]:.2f}")

# ═══════════════════════════════════════════════════════════════════
# TF DATA PIPELINE
# ═══════════════════════════════════════════════════════════════════

strategy = tf.distribute.MirroredStrategy()
n_replicas = strategy.num_replicas_in_sync
BATCH_SIZE = BASE_BATCH * max(1, n_replicas)
print(f"\nReplicas (GPUs) in sync: {n_replicas}  |  global batch size: {BATCH_SIZE}")

AUTOTUNE = tf.data.AUTOTUNE

@tf.function
def _decode(path):
    raw = tf.io.read_file(path)
    img = tf.image.decode_image(raw, channels=3, expand_animations=False, dtype=tf.uint8)
    img = tf.image.resize(img, IMAGE_SIZE)
    img.set_shape(IMAGE_SIZE + (3,))
    return tf.cast(img, tf.float32)

@tf.function
def load_and_augment(path, label):
    img = _decode(path)
    img = tf.image.random_flip_left_right(img)
    img = tf.image.random_flip_up_down(img)
    img = tf.image.random_brightness(img, 0.15)
    img = tf.image.random_contrast(img, 0.85, 1.15)
    img = tf.image.random_saturation(img, 0.85, 1.15)
    img = tf.clip_by_value(img, 0.0, 255.0)
    return img, label   # raw [0,255]; model rescales internally

@tf.function
def load_only(path, label):
    return _decode(path), label

def make_ds(paths, labels, training):
    ds = tf.data.Dataset.from_tensor_slices((tf.constant(paths), tf.constant(labels, tf.int32)))
    if training:
        ds = ds.shuffle(min(20_000, len(paths)), seed=SEED, reshuffle_each_iteration=True)
        ds = ds.map(load_and_augment, num_parallel_calls=AUTOTUNE)
        ds = ds.ignore_errors()   # drop any image that fails to decode instead of crashing the run
        ds = ds.batch(BATCH_SIZE, drop_remainder=True)
    else:
        ds = ds.map(load_only, num_parallel_calls=AUTOTUNE)
        ds = ds.ignore_errors()   # same safety net for val/test
        ds = ds.batch(BATCH_SIZE, drop_remainder=False)
    return ds.prefetch(AUTOTUNE)

train_ds = make_ds(train_paths, train_labels, True)
val_ds   = make_ds(val_paths,   val_labels,   False)
test_ds  = make_ds(test_paths,  test_labels,  False)

# ═══════════════════════════════════════════════════════════════════
# BUILD MODEL (MobileNetV2, internal rescaling [0,255]->[-1,1])
# ═══════════════════════════════════════════════════════════════════

print("\nBuilding MobileNetV2 …")
with strategy.scope():
    base = MobileNetV2(input_shape=IMAGE_SIZE + (3,), include_top=False, weights="imagenet")
    base.trainable = False

    inputs = tf.keras.Input(shape=IMAGE_SIZE + (3,))
    x = tf.keras.layers.Rescaling(1.0 / 127.5, offset=-1.0)(inputs)
    x = base(x, training=False)
    x = GlobalAveragePooling2D()(x)
    x = BatchNormalization()(x)
    x = Dropout(0.4)(x)
    x = Dense(512, activation="relu")(x)
    x = BatchNormalization()(x)
    x = Dropout(0.3)(x)
    x = Dense(256, activation="relu")(x)
    x = Dropout(0.2)(x)
    predictions = Dense(NUM_CLASSES, activation="softmax")(x)
    model = Model(inputs, predictions)
    # clipnorm=1.0 guards against the exploding-gradient collapse we hit on the
    # v12 run (the heterogeneous not_plant class produced huge gradients).
    model.compile(optimizer=tf.keras.optimizers.Adam(1e-3, clipnorm=1.0),
                  loss="sparse_categorical_crossentropy", metrics=["accuracy"])
print(f"Total params: {model.count_params():,}")

# Separate checkpoints per phase so a bad fine-tune can NEVER overwrite a good
# head-trained model. We pick the best of the two for export below.
P1_CKPT = str(OUTPUT_DIR / "agropulse_p1.keras")
P2_CKPT = str(OUTPUT_DIR / "agropulse_p2.keras")

# ═══════════════════════════════════════════════════════════════════
# PHASE 1 — train head
# ═══════════════════════════════════════════════════════════════════

print("\n[Phase 1] Training classification head (backbone frozen) …")
cb1 = [
    EarlyStopping(monitor="val_accuracy", patience=3, restore_best_weights=True, mode="max", verbose=1),
    ModelCheckpoint(P1_CKPT, save_best_only=True, monitor="val_accuracy", mode="max", verbose=1),
    ReduceLROnPlateau(monitor="val_loss", factor=0.3, patience=2, min_lr=1e-6, verbose=1),
]
hist1 = model.fit(train_ds, validation_data=val_ds, epochs=EPOCHS_P1,
                  callbacks=cb1, class_weight=class_weight, verbose=2)
best_p1 = max(hist1.history.get("val_accuracy", [0.0]))
print(f"[Phase 1] best val_accuracy = {best_p1:.4f}")

# ═══════════════════════════════════════════════════════════════════
# PHASE 2 — fine-tune top layers (gentle: low LR + clipnorm, fewer layers).
# The v12 run diverged at lr=1e-4 with 60 layers unfrozen; 3e-5 + clipnorm on
# the top 40 layers fine-tunes without wrecking the phase-1 features.
# ═══════════════════════════════════════════════════════════════════

print("\n[Phase 2] Fine-tuning top 40 backbone layers (lr=3e-5, clipnorm=1.0) …")
with strategy.scope():
    for layer in base.layers[-40:]:
        if not isinstance(layer, tf.keras.layers.BatchNormalization):
            layer.trainable = True
    model.compile(optimizer=tf.keras.optimizers.Adam(3e-5, clipnorm=1.0),
                  loss="sparse_categorical_crossentropy", metrics=["accuracy"])
cb2 = [
    EarlyStopping(monitor="val_accuracy", patience=4, restore_best_weights=True, mode="max", verbose=1),
    ModelCheckpoint(P2_CKPT, save_best_only=True, monitor="val_accuracy", mode="max", verbose=1),
    ReduceLROnPlateau(monitor="val_loss", factor=0.3, patience=2, min_lr=1e-7, verbose=1),
]
hist2 = model.fit(train_ds, validation_data=val_ds, epochs=EPOCHS_P2,
                  callbacks=cb2, class_weight=class_weight, verbose=2)
best_p2 = max(hist2.history.get("val_accuracy", [0.0]))
print(f"[Phase 2] best val_accuracy = {best_p2:.4f}")

# ── BEST-OF-BOTH-PHASES GUARD ────────────────────────────────────────
# Load whichever phase produced the higher val_accuracy for eval + export.
# This makes the run robust even if fine-tuning underperforms or diverges.
import os as _os
best_ckpt = P2_CKPT if (best_p2 >= best_p1 and _os.path.exists(P2_CKPT)) else P1_CKPT
print(f"\nSelecting best model: {'Phase 2' if best_ckpt==P2_CKPT else 'Phase 1'} "
      f"({best_ckpt})  [p1={best_p1:.4f} p2={best_p2:.4f}]")
model = tf.keras.models.load_model(best_ckpt)
model.save(str(OUTPUT_DIR / "agropulse_best.keras"))

# ═══════════════════════════════════════════════════════════════════
# EVALUATE ON HELD-OUT TEST SET (the honest number)
# ═══════════════════════════════════════════════════════════════════

print("\n" + "=" * 64)
print("Evaluating on held-out TEST set …")
y_true, y_pred = [], []
for xb, yb in test_ds:
    probs = model.predict(xb, verbose=0)
    y_pred.extend(np.argmax(probs, axis=1).tolist())
    y_true.extend(yb.numpy().tolist())
y_true = np.array(y_true); y_pred = np.array(y_pred)
test_acc = float((y_true == y_pred).mean())
print(f"\n✅ TEST accuracy: {test_acc*100:.2f}%  (n={len(y_true)})")

try:
    from sklearn.metrics import classification_report, confusion_matrix
    print("\nPer-class report (TEST):")
    print(classification_report(y_true, y_pred, target_names=ACTIVE_CLASSES,
                                digits=3, zero_division=0))
    cm = confusion_matrix(y_true, y_pred, labels=list(range(NUM_CLASSES)))
    print("Top confusions (true → predicted, count):")
    pairs = []
    for i in range(NUM_CLASSES):
        for j in range(NUM_CLASSES):
            if i != j and cm[i, j] > 0:
                pairs.append((cm[i, j], ACTIVE_CLASSES[i], ACTIVE_CLASSES[j]))
    for c, a, b in sorted(pairs, reverse=True)[:25]:
        print(f"  {c:4d}  {a}  →  {b}")
except Exception as e:
    print("sklearn report unavailable:", e)

# ═══════════════════════════════════════════════════════════════════
# SAVE CLASS MAP  (index -> class id, matches model output order)
# ═══════════════════════════════════════════════════════════════════

class_map = {str(i): name for i, name in enumerate(ACTIVE_CLASSES)}
with open(CLASSES_PATH, "w") as f:
    json.dump(class_map, f, indent=2)
print(f"\nSaved {CLASSES_PATH}")

# ═══════════════════════════════════════════════════════════════════
# EXPORT TO TFLITE  (float32 — no quantisation, preserves softmax)
# ═══════════════════════════════════════════════════════════════════

print("\nExporting to TFLite (float32) …")
converter = tf.lite.TFLiteConverter.from_keras_model(model)
tflite_model = converter.convert()
with open(MODEL_PATH, "wb") as f:
    f.write(tflite_model)
size_mb = os.path.getsize(MODEL_PATH) / 1024 / 1024
print(f"Wrote {MODEL_PATH} ({size_mb:.1f} MB)")

# ═══════════════════════════════════════════════════════════════════
# POST-EXPORT SELF-TEST — reload the TFLite model and run real images.
# This catches export/quantisation breakage BEFORE you download it.
# ═══════════════════════════════════════════════════════════════════

print("\nSelf-testing the exported TFLite model on real TEST images …")
interp = tf.lite.Interpreter(model_path=str(MODEL_PATH))
interp.allocate_tensors()
in_d = interp.get_input_details()[0]
out_d = interp.get_output_details()[0]

def tflite_predict(np_img_255):
    x = np_img_255.astype(np.float32)[None, ...]
    interp.set_tensor(in_d["index"], x)
    interp.invoke()
    return interp.get_tensor(out_d["index"])[0]

sample = list(zip(test_paths, test_labels))
rng.shuffle(sample)
correct = 0; shown = 0
for p, lab in sample[:200]:
    img = Image.open(p).convert("RGB").resize(IMAGE_SIZE)
    arr = np.asarray(img, dtype=np.float32)
    probs = tflite_predict(arr)
    pred = int(np.argmax(probs))
    correct += int(pred == lab)
    if shown < 12:
        print(f"  true={ACTIVE_CLASSES[lab]:<24s} pred={ACTIVE_CLASSES[pred]:<24s} "
              f"conf={probs[pred]*100:4.1f}%  sum={probs.sum():.3f}")
        shown += 1
print(f"TFLite self-test accuracy on 200 images: {correct/min(200,len(sample))*100:.1f}%")

print("\n🎉 DONE")
print(f"   Model       : {MODEL_PATH} ({size_mb:.1f} MB)")
print(f"   Classes     : {CLASSES_PATH} ({NUM_CLASSES} classes)")
print(f"   TEST accuracy: {test_acc*100:.2f}%")
print("\nDownload agropulse_offline_model.tflite + agropulse_classes.json")
print("into the app at: public/models/")
