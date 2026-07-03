/**
 * AgroPulse AI Pipeline — single flat TFLite model (MobileNetV2), in-browser via WASM.
 * ==========================================================================
 * Model:   /models/agropulse_offline_model.tflite
 * Classes: /models/agropulse_classes.json  (index → class id; length varies per training)
 *
 * Architecture:
 *   Base:   MobileNetV2 (ImageNet pre-trained), internal Rescaling [0,255]→[-1,1]
 *   Input:  [1, 224, 224, 3] float32, range [0, 255]
 *   Output: [1, N] float32 softmax  (N = number of trained classes)
 *
 * The class list is dynamic — NEVER assume fixed index ranges. Crop is derived
 * from each class id's prefix (see cropFromId). The model includes leaf-disease
 * classes, whole-fruit classes (tomato_fruit / banana_fruit / coffee_cherry),
 * and a `not_plant` rejection class for out-of-scope images.
 */

import type { Disease, CropType } from '../data/diseases';
import { getDiseaseById, getDiseasesByCrop } from '../data/diseases';

// ──────────────────────────────────────────────────────────────────
// Public types
// ──────────────────────────────────────────────────────────────────

export interface DiagnosisResult {
  crop: CropType;
  cropConfidence: number;
  disease: Disease;
  diseaseConfidence: number;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  processingTimeMs: number;
  mode: string;
  visualSymptoms: string[];
  reasoning: string;
}

// ──────────────────────────────────────────────────────────────────
// Crop derivation from class id prefix
// ──────────────────────────────────────────────────────────────────
// The model's class list can change between trainings, so we NEVER assume
// fixed index ranges. Crop is always derived from the class id prefix
// (e.g. "tomato_early_blight" → "Tomato"), read from agropulse_classes.json.

const PREFIX_TO_CROP: Record<string, CropType> = {
  cocoa: 'Cocoa', coffee: 'Coffee', tomato: 'Tomato', banana: 'Banana', maize: 'Maize',
};

function cropFromId(classId: string | undefined): CropType {
  const prefix = (classId ?? '').split('_')[0];
  return PREFIX_TO_CROP[prefix] ?? 'Tomato';
}

// ──────────────────────────────────────────────────────────────────
// In-memory caches
// ──────────────────────────────────────────────────────────────────

type TFLiteModel = { predict: (input: unknown) => unknown };

const modelCache = new Map<string, TFLiteModel>();
const classMapCache = new Map<string, Record<string, string>>();

async function getTFLite() {
  // TFLite is loaded globally via CDN in index.html
  if (!(window as any).tf?.tflite) {
    throw new Error('TFLite not loaded. Ensure index.html includes the CDN script.');
  }
  const tflite = (window as any).tf.tflite;
  // setWasmPath is called once per app lifecycle
  if (!tflite._wasmPathSet) {
    tflite.setWasmPath('/wasm/');
    tflite._wasmPathSet = true;
  }
  return tflite;
}

// ──────────────────────────────────────────────────────────────────
// Model & class-map loading
// ──────────────────────────────────────────────────────────────────

const MODEL_NAME  = 'agropulse_offline_model';
const MODEL_BASE  = '/models';

// Minimum top-class softmax probability to accept a prediction. Below this we
// reject the image as out-of-scope rather than reporting a low-quality guess.
// Works together with the model's dedicated `not_plant` class.
const REJECT_CONFIDENCE = 0.40;

async function loadModel(): Promise<TFLiteModel> {
  if (modelCache.has(MODEL_NAME)) return modelCache.get(MODEL_NAME)!;
  const tflite = await getTFLite();
  const path   = `${MODEL_BASE}/${MODEL_NAME}.tflite`;
  console.log(`[AgroPulse] Loading model: ${path}`);
  const model  = await tflite.loadTFLiteModel(path) as unknown as TFLiteModel;
  modelCache.set(MODEL_NAME, model);
  console.log('[AgroPulse] Model loaded and cached ✓');
  return model;
}

async function loadClassMap(): Promise<Record<string, string>> {
  const key = 'agropulse_classes';
  if (classMapCache.has(key)) return classMapCache.get(key)!;
  const url  = `${MODEL_BASE}/agropulse_classes.json`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Class map not found: ${url}`);
  const map: Record<string, string> = await resp.json();
  classMapCache.set(key, map);
  console.log('[AgroPulse] Class map loaded ✓', Object.keys(map).length, 'classes');
  return map;
}

export function unloadAllModels(): void {
  modelCache.clear();
  classMapCache.clear();
  tfliteModule = null;
  console.log('[AgroPulse] Model cache cleared');
}

// ──────────────────────────────────────────────────────────────────
// Image utilities
// ──────────────────────────────────────────────────────────────────

export function imageFileToElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function isImageBlank(img: HTMLImageElement | HTMLCanvasElement): boolean {
  const canvas = document.createElement('canvas');
  canvas.width  = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, 32, 32);
  const { data } = ctx.getImageData(0, 0, 32, 32);
  
  let sum = 0;
  for (let i = 0; i < data.length; i += 4) {
    const gray = data[i] * 0.299 + data[i+1] * 0.587 + data[i+2] * 0.114;
    sum += gray;
  }
  const mean = sum / (32 * 32);
  
  let sqSum = 0;
  for (let i = 0; i < data.length; i += 4) {
    const gray = data[i] * 0.299 + data[i+1] * 0.587 + data[i+2] * 0.114;
    sqSum += Math.pow(gray - mean, 2);
  }
  const stdDev = Math.sqrt(sqSum / (32 * 32));
  
  // Stdev < 8 indicates a very flat, blank, or out-of-focus image
  return stdDev < 8;
}

function preprocessToFloat32(img: HTMLImageElement | HTMLCanvasElement): Float32Array {
  const canvas = document.createElement('canvas');
  canvas.width  = 224;
  canvas.height = 224;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, 224, 224);
  const { data } = ctx.getImageData(0, 0, 224, 224);
  const f32 = new Float32Array(224 * 224 * 3);
  let fi = 0;
  // EfficientNetB0 offline model expects [0, 255] float input because the rescaling/normalization
  // layers are built directly into the model itself.
  for (let i = 0; i < data.length; i += 4) {
    f32[fi++] = data[i];
    f32[fi++] = data[i + 1];
    f32[fi++] = data[i + 2];
  }
  return f32;
}

// ──────────────────────────────────────────────────────────────────
// Model availability check
// ──────────────────────────────────────────────────────────────────

let modelsAvailable: boolean | null = null;

async function checkModelsAvailable(): Promise<boolean> {
  if (modelsAvailable !== null) return modelsAvailable;
  try {
    const resp = await fetch(`${MODEL_BASE}/${MODEL_NAME}.tflite`, { method: 'HEAD' });
    modelsAvailable = resp.ok;
  } catch {
    modelsAvailable = false;
  }
  console.log('[AgroPulse] TFLite model available:', modelsAvailable);
  return modelsAvailable;
}

// ──────────────────────────────────────────────────────────────────
// Run inference
// ──────────────────────────────────────────────────────────────────

async function runModelInference(
  input: Float32Array
): Promise<{ classIndex: number; confidence: number; allScores: Float32Array }> {
  const tf    = await import('@tensorflow/tfjs');
  const model = await loadModel();

  const inputTensor = tf.tensor4d(input, [1, 224, 224, 3]);
  const outputRaw   = (model as unknown as {
    predict: (t: unknown) => unknown;
  }).predict(inputTensor);

  let outputTensor: { data: () => Promise<Float32Array>; dispose: () => void };

  if (Array.isArray(outputRaw)) {
    // Array of tensors → take first
    outputTensor = outputRaw[0] as typeof outputTensor;
  } else if (outputRaw && typeof outputRaw === 'object') {
    const keys = Object.keys(outputRaw as object);
    if (keys.length > 0 && typeof (outputRaw as Record<string, unknown>)[keys[0]] === 'object') {
      // NamedTensorMap → take first value
      outputTensor = ((outputRaw as unknown as Record<string, unknown>)[keys[0]]) as typeof outputTensor;
    } else {
      // Plain tensor object
      outputTensor = outputRaw as typeof outputTensor;
    }
  } else {
    throw new Error('[AgroPulse] Unexpected model output type: ' + typeof outputRaw);
  }

  const outputData = (await outputTensor.data()) as Float32Array;
  inputTensor.dispose();
  outputTensor.dispose();

  let classIndex = 0;
  let confidence = outputData[0];
  for (let i = 1; i < outputData.length; i++) {
    if (outputData[i] > confidence) {
      confidence = outputData[i];
      classIndex = i;
    }
  }

  // Debug: log top-5 predictions to browser console
  const top5 = Array.from(outputData)
    .map((s, idx) => ({ idx, score: s }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
  console.log('[AgroPulse] Raw model output — top 5 classes:', top5.map(t => `#${t.idx}=${(t.score*100).toFixed(1)}%`).join(', '));
  console.log('[AgroPulse] Score sum:', Array.from(outputData).reduce((a, b) => a + b, 0).toFixed(4), '| Non-zero:', Array.from(outputData).filter(s => s > 0).length);

  return { classIndex, confidence, allScores: outputData };
}

// ──────────────────────────────────────────────────────────────────
// Crop-level confidence (sum of class probabilities per crop)
// ──────────────────────────────────────────────────────────────────

// Sum softmax probabilities per crop, grouping each output index by the crop
// of its class id in the class map. Returns total confidence for `crop`.
function cropConfidenceFor(
  crop: CropType,
  scores: Float32Array,
  classMap: Record<string, string>,
): number {
  let sum = 0;
  for (let i = 0; i < scores.length; i++) {
    if (cropFromId(classMap[String(i)]) === crop) sum += scores[i];
  }
  return sum;
}

// ──────────────────────────────────────────────────────────────────
// Heuristic colour fallback (when model not yet downloaded)
// ──────────────────────────────────────────────────────────────────

function analyzeImageColors(img: HTMLImageElement | HTMLCanvasElement) {
  const canvas = document.createElement('canvas');
  canvas.width  = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, 64, 64);
  const { data } = ctx.getImageData(0, 0, 64, 64);
  let r = 0, g = 0, b = 0;
  const n = data.length / 4;
  for (let i = 0; i < data.length; i += 4) {
    r += data[i]; g += data[i + 1]; b += data[i + 2];
  }
  const sum = r + g + b + 1;
  return { greenness: g / sum, brownness: (r * 0.6 + g * 0.3) / sum, redness: r / sum };
}

async function diagnoseFallback(file: File): Promise<DiagnosisResult> {
  const img = await imageFileToElement(file);
  const c   = analyzeImageColors(img);

  let crop: CropType;
  let cropConf: number;
  if (c.redness > 0.4)         { crop = 'Tomato'; cropConf = 0.60; }
  else if (c.brownness > 0.35) { crop = 'Cocoa';  cropConf = 0.55; }
  else                          { crop = 'Coffee'; cropConf = 0.50; }

  const diseases   = getDiseasesByCrop(crop);
  const isHealthy  = c.greenness > 0.40;
  const diseaseIdx = isHealthy
    ? diseases.findIndex(d => d.id.endsWith('_healthy'))
    : Math.floor(Math.random() * (diseases.length - 1));
  const disease = diseases[Math.max(0, diseaseIdx)];

  return {
    crop,
    cropConfidence: cropConf,
    disease,
    diseaseConfidence: 0.50,
    severity: 'Medium',
    processingTimeMs: 10,
    mode: 'offline_fallback',
    visualSymptoms: [],
    reasoning: '⚠ Model not yet loaded. Place agropulse_offline_model.tflite in public/models/ for real AI detection.',
  };
}

// ──────────────────────────────────────────────────────────────────
// Main entry point
// ──────────────────────────────────────────────────────────────────

export async function runDiagnosis(
  imageSource: File | HTMLImageElement
): Promise<DiagnosisResult> {
  const t0 = Date.now();

  // Normalise input to File
  let file: File;
  if (imageSource instanceof File) {
    file = imageSource;
  } else {
    const canvas  = document.createElement('canvas');
    canvas.width  = imageSource.naturalWidth  || imageSource.width;
    canvas.height = imageSource.naturalHeight || imageSource.height;
    canvas.getContext('2d')!.drawImage(imageSource, 0, 0);
    const blob = await new Promise<Blob>(res => canvas.toBlob(b => res(b!), 'image/jpeg', 0.9));
    file = new File([blob], 'scan.jpg', { type: 'image/jpeg' });
  }

  // Check if the model file is available on the server
  const hasModel = await checkModelsAvailable();
  if (!hasModel) {
    console.warn('[AgroPulse] Model not found — using colour heuristic fallback');
    return diagnoseFallback(file);
  }

  // Load model + class map, falling back if loading fails
  let classMap: Record<string, string>;
  try {
    const [cm] = await Promise.all([loadClassMap(), loadModel()]);
    classMap = cm;
  } catch (loadErr) {
    console.error('[AgroPulse] Model load failed:', loadErr);
    // Reset cache so next attempt retries
    modelsAvailable = null;
    modelCache.clear();
    console.warn('[AgroPulse] Falling back to colour heuristic');
    return diagnoseFallback(file);
  }

  // Preprocess image
  const img   = await imageFileToElement(file);
  if (isImageBlank(img)) {
    throw new Error('No leaf detected. The image appears blank or out of focus. Please upload a clear photo of a plant leaf.');
  }
  const input = preprocessToFloat32(img);

  // Run inference
  const { classIndex, confidence, allScores } = await runModelInference(input);

  const diseaseId = classMap[String(classIndex)];

  // ── OUT-OF-SCOPE REJECTION ──────────────────────────────────────
  // The model has a dedicated `not_plant` class trained on non-crop images
  // (objects, people, animals, scenery). If it wins, or if no class is
  // confident enough, we REFUSE to guess a disease instead of hallucinating.
  if (diseaseId === 'not_plant') {
    throw new Error(
      "No crop detected. This doesn't look like a tomato, coffee, cocoa, " +
      "banana, or maize plant. Please photograph a leaf or fruit of one of " +
      "these crops."
    );
  }
  // Confidence floor: even among crop classes, a very unsure top score usually
  // means an out-of-distribution / poor photo. Reject rather than mislead.
  if (confidence < REJECT_CONFIDENCE) {
    throw new Error(
      `Not confident this is a crop leaf or fruit (best guess only ` +
      `${(confidence * 100).toFixed(0)}%). Please retake a clear, close photo ` +
      `of a single leaf in good light.`
    );
  }

  // Resolve disease from class map
  let disease = getDiseaseById(diseaseId);
  if (!disease) {
    console.warn(`[AgroPulse] Disease not found in local DB for ID: ${diseaseId}. Falling back to default.`);
    const fallbackCrop = cropFromId(diseaseId);
    const cropDiseases = getDiseasesByCrop(fallbackCrop);
    disease = cropDiseases[0] ?? getDiseasesByCrop('Tomato')[0];
  }

  // Crop is the crop of the predicted disease; confidence is the summed
  // probability mass of that crop's classes.
  const crop = disease.crop;
  const cropConf = cropConfidenceFor(crop, allScores, classMap);

  const ms = Date.now() - t0;

  console.log(`[AgroPulse] ✓ ${crop} → ${disease.name} (${(confidence * 100).toFixed(1)}%) in ${ms}ms`);

  return {
    crop,
    cropConfidence: cropConf,
    disease,
    diseaseConfidence: confidence,
    severity: disease.risk,
    processingTimeMs: ms,
    mode: 'tflite_local',
    visualSymptoms: disease.symptoms,
    reasoning: `Offline AI detected ${disease.name} on ${crop} with ${(confidence * 100).toFixed(0)}% confidence (${ms} ms).`,
  };
}

// ──────────────────────────────────────────────────────────────────
// Camera capture utility
// ──────────────────────────────────────────────────────────────────

export async function captureFromCamera(): Promise<{ file: File; previewUrl: string }> {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
  });
  const video = document.createElement('video');
  video.srcObject = stream;
  video.setAttribute('playsinline', 'true');
  await video.play();
  await new Promise(r => setTimeout(r, 500));

  const canvas  = document.createElement('canvas');
  canvas.width  = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d')!.drawImage(video, 0, 0);
  stream.getTracks().forEach(t => t.stop());

  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (!blob) return reject(new Error('Camera capture failed'));
      const f = new File([blob], `scan_${Date.now()}.jpg`, { type: 'image/jpeg' });
      resolve({ file: f, previewUrl: URL.createObjectURL(blob) });
    }, 'image/jpeg', 0.9);
  });
}
