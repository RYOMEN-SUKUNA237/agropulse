#!/usr/bin/env python3
"""
AgroPulse FastAPI Backend — Real Plant Disease Detection API.

Start: python main.py
Or:    uvicorn main:app --reload --port 8000
"""

import os
import io
import json
import time
import logging
import asyncio
from pathlib import Path
from typing import Optional
from datetime import datetime

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

# Load .env from project root
env_path = Path(__file__).parent.parent / ".env"
if env_path.exists():
    load_dotenv(env_path)
else:
    load_dotenv()

from ai_engine import AIEngine, DISEASE_KNOWLEDGE

# ═══════════════════════════════════════════════════════════════
# SETUP
# ═══════════════════════════════════════════════════════════════
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(levelname)s: %(message)s")
logger = logging.getLogger("agropulse.api")

app = FastAPI(
    title="AgroPulse AI API",
    description="Real-time plant disease detection for Cocoa, Coffee, and Tomato crops",
    version="2.0.0",
)

# CORS — allow the Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize AI engine
engine: Optional[AIEngine] = None


@app.on_event("startup")
async def startup():
    global engine
    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key or api_key == "MY_GEMINI_API_KEY":
        logger.warning("=" * 50)
        logger.warning("  [!] GEMINI_API_KEY not set!")
        logger.warning("  Create a .env file with:")
        logger.warning('  GEMINI_API_KEY="your-key-here"')
        logger.warning("  Get a key at: https://aistudio.google.com/app/apikey")
        logger.warning("=" * 50)
    else:
        logger.info(f"  [OK] GEMINI_API_KEY configured (ends with ...{api_key[-4:]})")

    engine = AIEngine(gemini_api_key=api_key)
    logger.info("  [OK] AgroPulse AI Engine initialized")
    logger.info(f"  [OK] TFLite models loaded: {list(engine.tflite_models.keys()) or 'none (using Gemini)'}")
    logger.info("  [OK] API ready at http://localhost:8000")
    logger.info("  [OK] Docs at http://localhost:8000/docs")


# ═══════════════════════════════════════════════════════════════
# ENDPOINTS
# ═══════════════════════════════════════════════════════════════

@app.get("/")
async def root():
    return {
        "name": "AgroPulse AI API",
        "version": "2.0.0",
        "status": "running",
        "engine": "gemini" if (engine and engine.gemini_client) else "tflite" if (engine and engine.tflite_models) else "none",
        "diseases_count": len(DISEASE_KNOWLEDGE),
        "crops": ["Cocoa", "Coffee", "Tomato"],
    }


@app.post("/api/diagnose")
async def diagnose_plant(file: UploadFile = File(...)):
    """
    Upload a plant photo and get an AI-powered disease diagnosis.
    
    Returns: disease name, confidence, treatment roadmap, recommended products.
    """
    if not engine:
        raise HTTPException(status_code=503, detail="AI engine not initialized")

    # Validate file
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image (JPEG, PNG)")

    image_bytes = await file.read()
    if len(image_bytes) < 1000:
        raise HTTPException(status_code=400, detail="Image file too small")
    if len(image_bytes) > 20_000_000:
        raise HTTPException(status_code=400, detail="Image file too large (max 20MB)")

    logger.info(f"  [SCAN] Diagnosing: {file.filename} ({len(image_bytes)//1024}KB)")

    result = await engine.diagnose(image_bytes, filename=file.filename or "scan.jpg")

    if not result.get("success", False):
        return JSONResponse(
            status_code=422,
            content={"error": result.get("error", "Diagnosis failed"), "detail": result}
        )

    logger.info(f"  [OK] Diagnosis: {result['disease_name']} ({result['crop']}) - {result['confidence']:.0%} confidence [{result.get('mode', '?')}]")

    return {
        "success": True,
        "timestamp": datetime.utcnow().isoformat(),
        "mode": result.get("mode", "unknown"),
        "processing_ms": result.get("processing_ms", 0),
        "diagnosis": {
            "disease_id": result["disease_id"],
            "disease_name": result["disease_name"],
            "scientific_name": result["scientific_name"],
            "crop": result["crop"],
            "crop_confidence": round(result["crop_confidence"], 4),
            "confidence": round(result["confidence"], 4),
            "severity": result["severity"],
            "risk": result["risk"],
            "visual_symptoms": result.get("visual_symptoms", []),
            "reasoning": result.get("reasoning", ""),
        },
        "treatment": result["treatment"],
        "products": result["products"],
    }


@app.get("/api/diseases")
async def list_diseases(crop: Optional[str] = None):
    """List all known diseases, optionally filtered by crop."""
    diseases = []
    for disease_id, info in DISEASE_KNOWLEDGE.items():
        if crop and info["crop"].lower() != crop.lower():
            continue
        diseases.append({
            "id": disease_id,
            "name": info["name"],
            "scientific_name": info["scientific"],
            "crop": info["crop"],
            "risk": info["risk"],
            "treatment_steps": len(info["treatment"]),
            "products": info["products"],
        })
    return {"diseases": diseases, "count": len(diseases)}


@app.get("/api/diseases/{disease_id}")
async def get_disease(disease_id: str):
    """Get full details for a specific disease."""
    info = DISEASE_KNOWLEDGE.get(disease_id)
    if not info:
        raise HTTPException(status_code=404, detail=f"Disease '{disease_id}' not found")
    return {"id": disease_id, **info}


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "engine_ready": engine is not None,
        "gemini_available": bool(engine and engine.gemini_client),
        "tflite_models": list(engine.tflite_models.keys()) if engine else [],
        "timestamp": datetime.utcnow().isoformat(),
    }


# ═══════════════════════════════════════════════════════════════
# RUN
# ═══════════════════════════════════════════════════════════════
if __name__ == "__main__":
    import uvicorn
    print("\n" + "=" * 50)
    print("  [*] AgroPulse AI Backend Starting...")
    print("=" * 50)
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
