# AgroPulse Implementation Plan

## Phase 1: Core Data Architecture
1. Disease Knowledge Base (40 diseases: 10 Cocoa, 10 Coffee, 20 Tomato)
2. Treatment Roadmap mapping for all 40 diseases
3. Local storage layer (IndexedDB via custom wrapper for web)
4. Scan result data model

## Phase 2: Hierarchical AI Pipeline (Web-based)
1. TensorFlow.js integration for in-browser inference
2. Level 1 Gatekeeper: Crop type classifier (Cocoa/Coffee/Tomato)
3. Level 2 Specialists: Disease classifiers per crop
4. Model loading/unloading memory management
5. Camera capture & image preprocessing (224x224 normalization)

## Phase 3: Offline-First Sync Architecture
1. IndexedDB persistence layer for ScanResults
2. Image file management (blob storage)
3. Supabase client setup
4. Background sync agent (online/offline detection)
5. Queue-based sync with retry logic

## Phase 4: Data Processing Pipeline (Python)
1. Dataset download/clone script
2. Image preprocessing script (resize 224x224, normalize)
3. Gatekeeper model training
4. Specialist model training (3 models)
5. Synthetic data generation stubs

## Phase 5: Functional UI Integration
1. Bind dashboard cards to live data streams
2. Dynamic result screen with real diagnosis data
3. Treatment roadmap driven by disease lookup
4. Library tab with full 40-disease database
5. Real-time scan history from IndexedDB

## Architecture Notes
- Web platform uses IndexedDB (not Isar which is Flutter/Dart)
- TensorFlow.js for in-browser model inference (not .tflite)
- Python scripts for training pipeline (separate from web app)
- Supabase JS client for cloud sync
