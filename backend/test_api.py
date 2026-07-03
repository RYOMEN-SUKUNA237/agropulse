"""Quick test script to verify the AgroPulse AI detection pipeline works."""
import requests
import json
import sys

API = "http://localhost:8000"

print("=" * 50)
print("  AGROPULSE AI DETECTION TEST")
print("=" * 50)

# 1. Health check
try:
    r = requests.get(f"{API}/api/health", timeout=5)
    h = r.json()
    print(f"\n[1] Health Check:")
    print(f"    Engine ready:     {h['engine_ready']}")
    print(f"    Gemini available: {h['gemini_available']}")
    print(f"    TFLite models:    {h['tflite_models'] or 'none'}")
except Exception as e:
    print(f"    FAILED: {e}")
    sys.exit(1)

# 2. Send test image
print(f"\n[2] Sending test image to /api/diagnose...")
try:
    with open("test_sample.jpg", "rb") as f:
        resp = requests.post(f"{API}/api/diagnose", files={"file": ("plant_test.jpg", f, "image/jpeg")}, timeout=60)

    print(f"    HTTP Status: {resp.status_code}")
    data = resp.json()

    if resp.status_code == 200 and data.get("success"):
        d = data["diagnosis"]
        print(f"\n    --- DETECTION RESULT ---")
        print(f"    CROP DETECTED:  {d['crop']} ({d['crop_confidence']*100:.1f}% confidence)")
        print(f"    DISEASE:        {d['disease_name']} ({d['confidence']*100:.1f}%)")
        print(f"    SCIENTIFIC:     {d['scientific_name']}")
        print(f"    SEVERITY:       {d['severity']}")
        print(f"    MODE:           {data['mode']}")
        print(f"    PROCESSING:     {data['processing_ms']}ms")
        print(f"    REASONING:      {d.get('reasoning', 'N/A')}")
        print(f"    SYMPTOMS:       {d.get('visual_symptoms', [])}")
        print(f"    TREATMENTS:     {len(data.get('treatment', []))} steps")
        print(f"    PRODUCTS:       {data.get('products', [])}")
        print(f"\n    === DETECTION SUCCESSFUL ===")
    elif resp.status_code == 422:
        err = data.get("error", "")
        detail = data.get("detail", {})
        if isinstance(detail, dict):
            inner_err = detail.get("error", "")
            print(f"    Result: {inner_err or err}")
            ms = detail.get("processing_ms", 0)
            print(f"    Processing: {ms}ms")
            if "not a plant" in (inner_err + err).lower():
                print(f"\n    NOTE: Random test image correctly rejected as non-plant.")
                print(f"    The AI is working! Try with a real Cocoa/Coffee/Tomato photo.")
        else:
            print(f"    Error: {err}")
            print(f"    Detail: {detail}")
    else:
        print(f"    Error: {data}")
except Exception as e:
    print(f"    FAILED: {e}")

print("\n" + "=" * 50)
