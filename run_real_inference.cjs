const fs = require('fs');
const path = require('path');

// Polyfill fetch for file:// support in Node.js
const nativeFetch = global.fetch;
global.fetch = async (url, options) => {
  const urlStr = typeof url === 'object' && url.href ? url.href : String(url);
  console.log('[Mock Fetch] Requesting URL:', urlStr);
  if (urlStr.startsWith('file://') || urlStr.startsWith('C:') || urlStr.startsWith('c:') || !urlStr.includes('://')) {
    let filePath = urlStr;
    if (filePath.startsWith('file://')) {
      filePath = filePath.replace(/^file:\/\/\/?/, '');
    }
    // Decode URI component (spaces like %20)
    filePath = decodeURIComponent(filePath);
    // On Windows, if path looks like "C:/...", make sure it is valid
    if (process.platform === 'win32' && !/^[a-zA-Z]:/.test(filePath)) {
      filePath = filePath.replace(/^\/+/, '');
    }
    // If it's a relative path, make it absolute from project root
    if (!path.isAbsolute(filePath)) {
      filePath = path.resolve(filePath);
    }
    console.log('[Mock Fetch] Resolved to File Path:', filePath);
    try {
      const data = fs.readFileSync(filePath);
      return new Response(data, { status: 200, statusText: 'OK' });
    } catch (err) {
      console.error('[Mock Fetch] File read failed:', err.message);
      return new Response(null, { status: 404, statusText: 'Not Found: ' + err.message });
    }
  }
  return nativeFetch(url, options);
};

// Define global.self for node compatibility
global.self = global;
global.self.location = { origin: 'file://', href: 'file://' };

async function main() {
  console.log('Loading TensorFlow.js...');
  const tf = require('@tensorflow/tfjs');
  console.log('Loading TFJS-TFLite...');
  const tflite = require('@tensorflow/tfjs-tflite');

  // Set the WASM path to a file:// URL!
  const wasmPath = 'file://' + path.resolve('node_modules/@tensorflow/tfjs-tflite/wasm') + '/';
  console.log('Setting WASM path to:', wasmPath);
  tflite.setWasmPath(wasmPath);

  const absoluteModelPath = path.resolve('public/models/agropulse_offline_model.tflite');
  const modelUrl = 'file://' + absoluteModelPath;
  console.log('Loading model from URL:', modelUrl);
  
  const model = await tflite.loadTFLiteModel(modelUrl);
  console.log('Model loaded successfully!');

  console.log('Input details:', model.inputs.map(t => ({ name: t.name, shape: t.shape, dtype: t.dtype })));
  console.log('Output details:', model.outputs.map(t => ({ name: t.name, shape: t.shape, dtype: t.dtype })));

  // Let's create a synthetic green leaf image (all green pixels)
  const size = 224;
  const numChannels = 3;
  const numPixels = size * size;

  console.log('\n--- Test 1: [0, 1] Normalization ---');
  const input01 = new Float32Array(numPixels * numChannels);
  for (let i = 0; i < numPixels; i++) {
    input01[i * 3] = 0.1;     // R
    input01[i * 3 + 1] = 0.8; // G (healthy green)
    input01[i * 3 + 2] = 0.2; // B
  }
  await testInference(tf, model, input01);
}

async function testInference(tf, model, flatData) {
  const t = tf.tensor4d(flatData, [1, 224, 224, 3]);
  const output = model.predict(t);
  const scores = await (Array.isArray(output) ? output[0] : output).data();
  t.dispose();

  let maxIdx = 0;
  let maxScore = scores[0];
  let nonZeroCount = 0;
  let sum = 0;

  for (let i = 0; i < scores.length; i++) {
    sum += scores[i];
    if (scores[i] > 0) nonZeroCount++;
    if (scores[i] > maxScore) {
      maxScore = scores[i];
      maxIdx = i;
    }
  }

  console.log('Winning Index:', maxIdx);
  console.log('Winning Score:', maxScore);
  console.log('Sum of scores:', sum);
  console.log('Top 5 scores:', Array.from(scores)
    .map((s, idx) => ({ idx, score: s }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
  );
}

main().catch(console.error);
