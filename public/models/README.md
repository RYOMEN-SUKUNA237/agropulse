# AgroPulse Local Models Directory

This folder is the target location for the offline-first, client-side inference models.

## Expected Files

Once you run the training pipeline (`kaggle_notebook.py`) on Kaggle, download the exported ZIP file (`agropulse_models.zip`), extract it, and place the following files directly in this directory:

### Gatekeeper (Level 1 Crop Router)
* `gatekeeper.tflite`
* `gatekeeper_classes.json`

### Specialist Models (Level 2 Disease Classifiers)
* `cocoa_specialist.tflite`
* `cocoa_specialist_classes.json`
* `coffee_specialist.tflite`
* `coffee_specialist_classes.json`
* `tomato_specialist.tflite`
* `tomato_specialist_classes.json`
* `banana_specialist.tflite`
* `banana_specialist_classes.json`
* `maize_specialist.tflite`
* `maize_specialist_classes.json`

## Note on Offline Support (PWA)
The service worker configuration in `vite.config.ts` is set to cache `.tflite` and `.json` files in this directory. Once loaded, the application will perform inference 100% offline.
