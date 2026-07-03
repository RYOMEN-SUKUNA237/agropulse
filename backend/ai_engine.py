#!/usr/bin/env python3
"""
AgroPulse AI Detection Engine — REAL plant disease detection.

Two modes:
  1. GEMINI MODE (immediate, cloud): Uses Google Gemini Vision API for real-time
     plant disease identification. Works right now with any plant photo.
  2. TFLITE MODE (offline, fast): Uses locally trained TFLite models (after training).

The engine automatically uses the best available method.
"""

import os
import io
import json
import base64
import time
import logging
from pathlib import Path
from typing import Optional
from PIL import Image
import numpy as np

logger = logging.getLogger("agropulse.ai")

BASE_DIR = Path(__file__).parent
MODELS_DIR = BASE_DIR / "models"
DISEASE_MAP_FILE = BASE_DIR / "disease_knowledge.json"

# ═══════════════════════════════════════════════════════════════
# DISEASE KNOWLEDGE BASE
# ═══════════════════════════════════════════════════════════════
DISEASE_KNOWLEDGE = {
    # COCOA (10)
    "cocoa_black_pod": {"name": "Black Pod", "scientific": "Phytophthora palmivora", "crop": "Cocoa", "risk": "Critical",
        "treatment": [{"step":1,"title":"Remove Infected Pods","desc":"Harvest and remove all infected pods immediately. Bury or burn them away from the plantation."},{"step":2,"title":"Apply Copper Fungicide","desc":"Spray copper-based fungicide (Bordeaux mixture) on remaining healthy pods every 2-3 weeks."},{"step":3,"title":"Improve Drainage","desc":"Ensure proper drainage around trees to reduce humidity. Prune lower branches."}],
        "products": ["Bordeaux Mixture","Ridomil Gold","Copper Hydroxide"]},
    "cocoa_swollen_shoot": {"name": "Swollen Shoot Virus", "scientific": "CSSV", "crop": "Cocoa", "risk": "Critical",
        "treatment": [{"step":1,"title":"Remove Infected Trees","desc":"Cut down and destroy all infected trees plus a 5m buffer zone."},{"step":2,"title":"Control Mealybugs","desc":"Apply systemic insecticide to control mealybug vectors."},{"step":3,"title":"Replant Resistant Varieties","desc":"Replant with CSSV-tolerant hybrid varieties after 6 months."}],
        "products": ["Imidacloprid","Resistant hybrid seedlings"]},
    "cocoa_witches_broom": {"name": "Witches' Broom", "scientific": "Moniliophthora perniciosa", "crop": "Cocoa", "risk": "High",
        "treatment": [{"step":1,"title":"Prune Brooms","desc":"Remove all brooms and infected tissue at least 15cm below visible symptoms."},{"step":2,"title":"Apply Fungicide","desc":"Spray copper oxychloride during wet season."},{"step":3,"title":"Maintain Shade","desc":"Regulate shade levels to 40-60%."}],
        "products": ["Copper Oxychloride","Mancozeb"]},
    "cocoa_pod_borer": {"name": "Cocoa Pod Borer", "scientific": "Conopomorpha cramerella", "crop": "Cocoa", "risk": "High",
        "treatment": [{"step":1,"title":"Frequent Harvesting","desc":"Harvest ripe pods every week to break pest lifecycle."},{"step":2,"title":"Sleeve Pods","desc":"Protect developing pods with plastic sleeves."},{"step":3,"title":"Apply Insecticide","desc":"Use targeted insecticide during peak moth flight."}],
        "products": ["Deltamethrin","Plastic pod sleeves","Pheromone traps"]},
    "cocoa_frosty_pod": {"name": "Frosty Pod Rot", "scientific": "Moniliophthora roreri", "crop": "Cocoa", "risk": "High",
        "treatment": [{"step":1,"title":"Frequent Harvesting","desc":"Harvest pods every 7-10 days."},{"step":2,"title":"Remove Diseased Pods","desc":"Collect and bury infected pods 30cm deep."},{"step":3,"title":"Biological Control","desc":"Apply Trichoderma biocontrol agents."}],
        "products": ["Trichoderma harzianum","Copper Sulfate"]},
    "cocoa_stem_canker": {"name": "Stem Canker", "scientific": "Phytophthora megakarya", "crop": "Cocoa", "risk": "High",
        "treatment": [{"step":1,"title":"Excise Canker","desc":"Cut away infected bark plus 5cm healthy margin."},{"step":2,"title":"Apply Wound Dressing","desc":"Paint with copper paste or Bordeaux paint."},{"step":3,"title":"Reduce Humidity","desc":"Remove weeds and low branches."}],
        "products": ["Bordeaux Paint","Metalaxyl"]},
    "cocoa_mirids": {"name": "Mirid Bug Damage", "scientific": "Sahlbergella singularis", "crop": "Cocoa", "risk": "Medium",
        "treatment": [{"step":1,"title":"Monitor","desc":"Scout weekly for mirid presence."},{"step":2,"title":"Insecticide","desc":"Spray bifenthrin at economic threshold."},{"step":3,"title":"Shade Management","desc":"Maintain moderate shade."}],
        "products": ["Bifenthrin","Neem oil"]},
    "cocoa_monilia": {"name": "Monilia Pod Rot", "scientific": "Moniliophthora spp.", "crop": "Cocoa", "risk": "High",
        "treatment": [{"step":1,"title":"Sanitary Harvest","desc":"Remove all diseased and mummified pods."},{"step":2,"title":"Fungicide","desc":"Apply systemic fungicide during flowering."},{"step":3,"title":"Canopy Management","desc":"Thin canopy for air circulation."}],
        "products": ["Azoxystrobin","Mancozeb"]},
    "cocoa_vascular_streak": {"name": "Vascular Streak Dieback", "scientific": "Ceratobasidium theobromae", "crop": "Cocoa", "risk": "Medium",
        "treatment": [{"step":1,"title":"Prune","desc":"Cut infected branches 30cm below symptoms."},{"step":2,"title":"Phosphonate","desc":"Apply potassium phosphonate."},{"step":3,"title":"Nutrition","desc":"Apply balanced fertilizer."}],
        "products": ["Potassium Phosphonate","NPK Fertilizer"]},
    "cocoa_healthy": {"name": "Healthy Cocoa", "scientific": "N/A", "crop": "Cocoa", "risk": "Low",
        "treatment": [{"step":1,"title":"Continue Monitoring","desc":"Maintain regular scouting."},{"step":2,"title":"Preventive Care","desc":"Apply preventive copper spray."},{"step":3,"title":"Nutrition","desc":"Maintain balanced fertilization."}],
        "products": ["NPK 20-10-10","Copper spray"]},

    # COFFEE (10)
    "coffee_leaf_rust": {"name": "Coffee Leaf Rust", "scientific": "Hemileia vastatrix", "crop": "Coffee", "risk": "Critical",
        "treatment": [{"step":1,"title":"Apply Copper Fungicide","desc":"Spray copper hydroxide every 3-4 weeks before wet season."},{"step":2,"title":"Remove Infected Leaves","desc":"Strip severely infected leaves."},{"step":3,"title":"Systemic Fungicide","desc":"Apply triazole-based fungicide for curative action."}],
        "products": ["Copper Hydroxide","Triadimefon","Cyproconazole"]},
    "coffee_berry_disease": {"name": "Coffee Berry Disease", "scientific": "Colletotrichum kahawae", "crop": "Coffee", "risk": "Critical",
        "treatment": [{"step":1,"title":"Preventive Spray","desc":"Apply copper fungicide at flowering and berry expansion."},{"step":2,"title":"Remove Mummies","desc":"Collect and destroy all mummified berries."},{"step":3,"title":"Resistant Varieties","desc":"Replace with CBD-resistant cultivars."}],
        "products": ["Copper Oxychloride","Carbendazim"]},
    "coffee_cercospora": {"name": "Cercospora Leaf Spot", "scientific": "Cercospora coffeicola", "crop": "Coffee", "risk": "Medium",
        "treatment": [{"step":1,"title":"Correct Nutrition","desc":"Apply nitrogen and potassium fertilizers."},{"step":2,"title":"Apply Fungicide","desc":"Spray copper during wet periods."},{"step":3,"title":"Shade Management","desc":"Provide 40-50% shade."}],
        "products": ["Copper Hydroxide","Urea","KCl"]},
    "coffee_brown_eye_spot": {"name": "Brown Eye Spot", "scientific": "Cercospora coffeicola", "crop": "Coffee", "risk": "Medium",
        "treatment": [{"step":1,"title":"Fertilization","desc":"Apply balanced NPK with micronutrients."},{"step":2,"title":"Fungicide Program","desc":"Alternate copper and systemic fungicide monthly."},{"step":3,"title":"Spacing","desc":"Ensure adequate plant spacing."}],
        "products": ["Mancozeb","Copper Sulfate","NPK 17-17-17"]},
    "coffee_leaf_miner": {"name": "Coffee Leaf Miner", "scientific": "Leucoptera coffeella", "crop": "Coffee", "risk": "High",
        "treatment": [{"step":1,"title":"Biological Control","desc":"Encourage parasitoid wasp populations."},{"step":2,"title":"Systemic Insecticide","desc":"Apply neonicotinoid soil drench."},{"step":3,"title":"Remove Mined Leaves","desc":"Collect heavily mined leaves."}],
        "products": ["Thiamethoxam","Neem Extract"]},
    "coffee_wilt": {"name": "Coffee Wilt Disease", "scientific": "Fusarium xylarioides", "crop": "Coffee", "risk": "Critical",
        "treatment": [{"step":1,"title":"Uproot and Burn","desc":"Remove and burn entire infected trees."},{"step":2,"title":"Quarantine","desc":"Establish 10m quarantine zone."},{"step":3,"title":"Resistant Clones","desc":"Replant with CWD-resistant clones."}],
        "products": ["CWD-resistant clones","Soil fumigant"]},
    "coffee_root_rot": {"name": "Root Rot", "scientific": "Armillaria mellea", "crop": "Coffee", "risk": "High",
        "treatment": [{"step":1,"title":"Drainage","desc":"Create drainage channels."},{"step":2,"title":"Remove Stumps","desc":"Excavate and burn old stumps."},{"step":3,"title":"Biocontrol","desc":"Apply Trichoderma to soil."}],
        "products": ["Trichoderma viride","Agricultural lime"]},
    "coffee_anthracnose": {"name": "Anthracnose", "scientific": "Colletotrichum gloeosporioides", "crop": "Coffee", "risk": "Medium",
        "treatment": [{"step":1,"title":"Prune Die-back","desc":"Remove dead branches."},{"step":2,"title":"Copper Spray","desc":"Apply copper every 2 weeks in rain."},{"step":3,"title":"Nutrition","desc":"Ensure adequate potassium and calcium."}],
        "products": ["Copper Oxychloride","Carbendazim"]},
    "coffee_bacterial_blight": {"name": "Bacterial Blight", "scientific": "Pseudomonas syringae", "crop": "Coffee", "risk": "Medium",
        "treatment": [{"step":1,"title":"Remove Tissue","desc":"Prune and burn blighted shoots."},{"step":2,"title":"Copper Bactericide","desc":"Apply copper hydroxide spray."},{"step":3,"title":"Wind Protection","desc":"Plant windbreaks."}],
        "products": ["Copper Hydroxide","Streptomycin Sulfate"]},
    "coffee_healthy": {"name": "Healthy Coffee", "scientific": "N/A", "crop": "Coffee", "risk": "Low",
        "treatment": [{"step":1,"title":"Continue Monitoring","desc":"Scout weekly."},{"step":2,"title":"Preventive Program","desc":"Apply copper at start of rains."},{"step":3,"title":"Soil Health","desc":"Maintain organic mulch."}],
        "products": ["NPK 22-6-12","Copper spray"]},

    # TOMATO (20)
    "tomato_early_blight": {"name": "Early Blight", "scientific": "Alternaria solani", "crop": "Tomato", "risk": "High",
        "treatment": [{"step":1,"title":"Isolate & Prune","desc":"Remove infected lower leaves immediately."},{"step":2,"title":"Apply Fungicide","desc":"Use Chlorothalonil or Copper-based fungicide within 24h."},{"step":3,"title":"Adjust Irrigation","desc":"Water at base only. Avoid overhead watering."}],
        "products": ["Chlorothalonil","Mancozeb","Copper Hydroxide"]},
    "tomato_late_blight": {"name": "Late Blight", "scientific": "Phytophthora infestans", "crop": "Tomato", "risk": "Critical",
        "treatment": [{"step":1,"title":"Emergency Spray","desc":"Apply Metalaxyl+Mancozeb immediately."},{"step":2,"title":"Remove Plants","desc":"Pull and destroy severely infected plants."},{"step":3,"title":"Preventive Schedule","desc":"Continue fungicide rotation every 7 days."}],
        "products": ["Ridomil Gold","Copper Hydroxide","Dimethomorph"]},
    "tomato_septoria": {"name": "Septoria Leaf Spot", "scientific": "Septoria lycopersici", "crop": "Tomato", "risk": "Medium",
        "treatment": [{"step":1,"title":"Remove Lower Leaves","desc":"Strip infected leaves below first fruit cluster."},{"step":2,"title":"Fungicide","desc":"Apply Chlorothalonil or Mancozeb."},{"step":3,"title":"Mulch","desc":"Apply 3-inch layer of mulch to prevent soil splash."}],
        "products": ["Chlorothalonil","Mancozeb","Straw mulch"]},
    "tomato_bacterial_spot": {"name": "Bacterial Spot", "scientific": "Xanthomonas vesicatoria", "crop": "Tomato", "risk": "High",
        "treatment": [{"step":1,"title":"Copper+Mancozeb","desc":"Apply copper hydroxide+mancozeb tank mix."},{"step":2,"title":"Drip Irrigation","desc":"Switch to drip to minimize leaf wetness."},{"step":3,"title":"Crop Rotation","desc":"Rotate with non-solanaceous crops for 2 seasons."}],
        "products": ["Copper Hydroxide","Mancozeb","Drip irrigation kit"]},
    "tomato_leaf_mold": {"name": "Leaf Mold", "scientific": "Passalora fulva", "crop": "Tomato", "risk": "Medium",
        "treatment": [{"step":1,"title":"Ventilation","desc":"Open vents and space plants for airflow."},{"step":2,"title":"Reduce Humidity","desc":"Keep RH below 85%."},{"step":3,"title":"Fungicide","desc":"Apply Chlorothalonil every 10 days."}],
        "products": ["Chlorothalonil","Greenhouse fans"]},
    "tomato_target_spot": {"name": "Target Spot", "scientific": "Corynespora cassiicola", "crop": "Tomato", "risk": "Medium",
        "treatment": [{"step":1,"title":"Remove Debris","desc":"Clear crop debris."},{"step":2,"title":"Fungicide","desc":"Use azoxystrobin or chlorothalonil."},{"step":3,"title":"Staking","desc":"Stake and prune for air circulation."}],
        "products": ["Azoxystrobin","Chlorothalonil"]},
    "tomato_mosaic": {"name": "Tomato Mosaic Virus", "scientific": "ToMV", "crop": "Tomato", "risk": "High",
        "treatment": [{"step":1,"title":"Remove Plants","desc":"Rogue out symptomatic plants."},{"step":2,"title":"Sanitize Tools","desc":"Dip tools in 10% bleach between plants."},{"step":3,"title":"Resistant Varieties","desc":"Replant with TMV-resistant varieties."}],
        "products": ["Sodium hypochlorite","TMV-resistant seeds"]},
    "tomato_yellow_leaf_curl": {"name": "Yellow Leaf Curl Virus", "scientific": "TYLCV", "crop": "Tomato", "risk": "Critical",
        "treatment": [{"step":1,"title":"Control Whiteflies","desc":"Apply imidacloprid or yellow sticky traps."},{"step":2,"title":"Remove Infected","desc":"Uproot symptomatic plants in sealed bags."},{"step":3,"title":"Reflective Mulch","desc":"Use silver mulch to repel whiteflies."}],
        "products": ["Imidacloprid","Yellow sticky traps","Reflective mulch"]},
    "tomato_spider_mites": {"name": "Spider Mites", "scientific": "Tetranychus urticae", "crop": "Tomato", "risk": "Medium",
        "treatment": [{"step":1,"title":"Water Spray","desc":"Blast leaf undersides with water jet."},{"step":2,"title":"Miticide","desc":"Apply abamectin targeting undersides."},{"step":3,"title":"Biocontrol","desc":"Release predatory mites."}],
        "products": ["Abamectin","Predatory mites"]},
    "tomato_bacterial_wilt": {"name": "Bacterial Wilt", "scientific": "Ralstonia solanacearum", "crop": "Tomato", "risk": "Critical",
        "treatment": [{"step":1,"title":"Remove & Destroy","desc":"Uproot with surrounding soil."},{"step":2,"title":"Solarization","desc":"Cover area with clear plastic 6 weeks."},{"step":3,"title":"Grafting","desc":"Use grafted tomatoes on resistant rootstock."}],
        "products": ["Resistant rootstock","Clear plastic sheeting"]},
    "tomato_fusarium_wilt": {"name": "Fusarium Wilt", "scientific": "Fusarium oxysporum", "crop": "Tomato", "risk": "High",
        "treatment": [{"step":1,"title":"Remove Plants","desc":"Remove infected plants and soil."},{"step":2,"title":"Soil Amendment","desc":"Raise pH to 6.5-7.0 with lime."},{"step":3,"title":"Resistant Varieties","desc":"Plant Fol-resistant varieties."}],
        "products": ["Agricultural lime","Trichoderma","Resistant seeds"]},
    "tomato_verticillium_wilt": {"name": "Verticillium Wilt", "scientific": "Verticillium dahliae", "crop": "Tomato", "risk": "Medium",
        "treatment": [{"step":1,"title":"Solarize Soil","desc":"Cover soil with clear plastic 4-6 weeks."},{"step":2,"title":"Crop Rotation","desc":"Rotate with non-host crops for 4+ years."},{"step":3,"title":"Resistant Varieties","desc":"Select Ve-resistant varieties."}],
        "products": ["Clear plastic","Resistant seeds","Compost"]},
    "tomato_powdery_mildew": {"name": "Powdery Mildew", "scientific": "Oidium neolycopersici", "crop": "Tomato", "risk": "Medium",
        "treatment": [{"step":1,"title":"Sulfur Spray","desc":"Apply wettable sulfur."},{"step":2,"title":"K-Bicarb","desc":"Spray 0.5% potassium bicarbonate."},{"step":3,"title":"Air Circulation","desc":"Improve spacing and pruning."}],
        "products": ["Wettable Sulfur","Potassium Bicarbonate","Neem Oil"]},
    "tomato_leaf_curl": {"name": "Leaf Curl Virus", "scientific": "ToLCV complex", "crop": "Tomato", "risk": "High",
        "treatment": [{"step":1,"title":"Vector Control","desc":"Apply systemic insecticide for whiteflies."},{"step":2,"title":"Barrier Crops","desc":"Plant maize around fields."},{"step":3,"title":"Resistant Hybrids","desc":"Use ToLCV-resistant varieties."}],
        "products": ["Thiamethoxam","Maize seed","Resistant hybrids"]},
    "tomato_blossom_end_rot": {"name": "Blossom End Rot", "scientific": "Calcium deficiency", "crop": "Tomato", "risk": "Medium",
        "treatment": [{"step":1,"title":"Consistent Watering","desc":"Maintain even soil moisture with drip + mulch."},{"step":2,"title":"Calcium Spray","desc":"Apply 0.5% calcium chloride weekly."},{"step":3,"title":"Soil Calcium","desc":"Incorporate gypsum or lime before planting."}],
        "products": ["Calcium Chloride","Gypsum","Drip irrigation"]},
    "tomato_anthracnose": {"name": "Anthracnose", "scientific": "Colletotrichum coccodes", "crop": "Tomato", "risk": "Medium",
        "treatment": [{"step":1,"title":"Harvest Promptly","desc":"Pick fruit at first ripeness."},{"step":2,"title":"Fungicide","desc":"Apply chlorothalonil from first fruit set."},{"step":3,"title":"Remove Debris","desc":"Clear old plant debris."}],
        "products": ["Chlorothalonil","Azoxystrobin"]},
    "tomato_gray_mold": {"name": "Gray Mold (Botrytis)", "scientific": "Botrytis cinerea", "crop": "Tomato", "risk": "High",
        "treatment": [{"step":1,"title":"Ventilation","desc":"Reduce humidity below 80%."},{"step":2,"title":"Hygiene","desc":"Remove dead leaves and infected tissue."},{"step":3,"title":"Fungicide","desc":"Apply iprodione or boscalid."}],
        "products": ["Iprodione","Boscalid"]},
    "tomato_bacterial_canker": {"name": "Bacterial Canker", "scientific": "Clavibacter michiganensis", "crop": "Tomato", "risk": "High",
        "treatment": [{"step":1,"title":"Destroy Plants","desc":"Remove and burn all infected plants."},{"step":2,"title":"Seed Treatment","desc":"Use certified disease-free seed."},{"step":3,"title":"Copper Spray","desc":"Apply copper bactericide preventively."}],
        "products": ["Certified seed","Copper Hydroxide"]},
    "tomato_white_mold": {"name": "White Mold", "scientific": "Sclerotinia sclerotiorum", "crop": "Tomato", "risk": "Medium",
        "treatment": [{"step":1,"title":"Remove Infected","desc":"Cut stems below infection."},{"step":2,"title":"Biocontrol","desc":"Apply Coniothyrium to soil."},{"step":3,"title":"Deep Plowing","desc":"Bury sclerotia deeply."}],
        "products": ["Contans","Iprodione"]},
    "tomato_healthy": {"name": "Healthy Tomato", "scientific": "N/A", "crop": "Tomato", "risk": "Low",
        "treatment": [{"step":1,"title":"Continue Monitoring","desc":"Scout 2-3 times per week."},{"step":2,"title":"Preventive Program","desc":"Maintain bi-weekly fungicide rotation."},{"step":3,"title":"Best Practices","desc":"Consistent watering, balanced nutrition, good airflow."}],
        "products": ["NPK 15-15-15","Organic mulch","Copper spray"]},
}


class AIEngine:
    """Main AI detection engine with Gemini (cloud) + TFLite (local) modes."""

    def __init__(self, gemini_api_key: str = ""):
        self.gemini_api_key = gemini_api_key or os.getenv("GEMINI_API_KEY", "")
        self.tflite_models = {}
        self.gemini_client = None
        self._init_gemini()
        self._load_tflite_models()

    def _init_gemini(self):
        """Initialize Gemini Vision API client."""
        if not self.gemini_api_key:
            logger.warning("No GEMINI_API_KEY — cloud detection disabled")
            return
        try:
            from google import genai
            self.gemini_client = genai.Client(api_key=self.gemini_api_key)
            logger.info("Gemini Vision API initialized")
        except Exception as e:
            logger.error(f"Gemini init failed: {e}")

    def _load_tflite_models(self):
        """Load trained TFLite models if available."""
        for model_name in ["gatekeeper", "cocoa_specialist", "coffee_specialist", "tomato_specialist"]:
            model_path = MODELS_DIR / f"{model_name}.tflite"
            if model_path.exists():
                try:
                    import tensorflow as tf
                    interpreter = tf.lite.Interpreter(model_path=str(model_path))
                    interpreter.allocate_tensors()
                    self.tflite_models[model_name] = interpreter
                    logger.info(f"Loaded TFLite model: {model_name}")
                except Exception as e:
                    logger.warning(f"Failed to load {model_name}: {e}")

    async def diagnose(self, image_bytes: bytes, filename: str = "scan.jpg") -> dict:
        """Run diagnosis on a plant image. Returns structured result."""
        start_time = time.time()

        gemini_error = None
        # Try Gemini first (most accurate with real-world photos)
        if self.gemini_client:
            try:
                result = await self._diagnose_gemini(image_bytes, filename)
                result["mode"] = "gemini_vision"
                result["processing_ms"] = int((time.time() - start_time) * 1000)
                return result
            except Exception as e:
                gemini_error = str(e)
                logger.error(f"Gemini diagnosis failed: {gemini_error}")

        # Fallback to TFLite if models are trained
        if self.tflite_models:
            try:
                result = self._diagnose_tflite(image_bytes)
                result["mode"] = "tflite_local"
                result["processing_ms"] = int((time.time() - start_time) * 1000)
                return result
            except Exception as e:
                logger.error(f"TFLite diagnosis failed: {e}")

        # If both fail or are unavailable, explicitly inform the frontend of the issue
        error_msg = "No AI engine available or operational."
        if gemini_error:
            if "429" in gemini_error or "Quota" in gemini_error or "RESOURCE_EXHAUSTED" in gemini_error:
                error_msg = "Gemini AI Quota Exceeded (429). Check your Google AI Studio billing or try a different key."
            else:
                error_msg = f"Gemini AI Error: {gemini_error[:100]}..."
        
        return {
            "success": False,
            "error": error_msg,
            "processing_ms": int((time.time() - start_time) * 1000),
        }

    async def _diagnose_gemini(self, image_bytes: bytes, filename: str) -> dict:
        """Use Gemini Vision for real plant disease detection."""
        from google import genai
        from google.genai import types

        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        img_data = buf.getvalue()

        # Build the expert prompt with explicit crop identification rules
        prompt = f"""You are a world-class plant pathologist and botanist. Your task is to analyze this image in TWO mandatory stages.

=== STAGE 1: CROP IDENTIFICATION (MANDATORY, 100% ACCURACY REQUIRED) ===
First, identify which of these THREE crops the plant belongs to. These are the ONLY options:

COCOA (Theobroma cacao):
- Large, glossy, elongated-ovate leaves (15-30cm long)
- Leaves are alternate, simple, with entire margins
- Young leaves are reddish/bronze, mature leaves dark green
- Pods grow directly from trunk/branches (cauliflory)
- Pods are ovoid, 15-25cm, ribbed, yellow/red/brown when ripe
- Trees have palmate branching (jorquette)

COFFEE (Coffea arabica / C. canephora):
- Opposite, dark green, elliptical waxy leaves (6-12cm)
- Prominent central vein with lateral veins at 45-degree angles
- White fragrant flowers in leaf axils
- Berries (cherries) are round, green turning red, 1-2cm
- Short-petioled leaves with slightly wavy margins

TOMATO (Solanum lycopersicum):
- Compound pinnate leaves with 5-9 leaflets
- Serrated/lobed leaflets, hairy stems and leaves
- Strong characteristic tomato odor from trichomes
- Yellow star-shaped flowers
- Round/oblong fruit, green to red
- Herbaceous plant (not a tree)

You MUST identify the crop with 100% certainty. These three plants look COMPLETELY different — there is zero ambiguity.

=== STAGE 2: DISEASE DIAGNOSIS ===
After identifying the crop, diagnose the specific disease using ONLY diseases for that crop.

Valid disease IDs per crop:
COCOA: {json.dumps([k for k in DISEASE_KNOWLEDGE if k.startswith("cocoa_")])}
COFFEE: {json.dumps([k for k in DISEASE_KNOWLEDGE if k.startswith("coffee_")])}
TOMATO: {json.dumps([k for k in DISEASE_KNOWLEDGE if k.startswith("tomato_")])}

=== RESPONSE FORMAT ===
IMPORTANT: Respond with ONLY a valid JSON object, no other text.

{{
  "disease_id": "<exact disease ID from the valid IDs above>",
  "confidence": <0.0-1.0 confidence in disease diagnosis>,
  "crop_detected": "<Cocoa|Coffee|Tomato>",
  "crop_confidence": <0.95-1.0, these crops are visually very distinct>,
  "severity": "<Low|Medium|High|Critical>",
  "visual_symptoms": ["specific symptom 1", "specific symptom 2", "specific symptom 3"],
  "reasoning": "Stage 1: Identified as [crop] because [botanical features]. Stage 2: Diagnosed [disease] because [visible symptoms].",
  "is_plant": true
}}

If the image is NOT a plant or not one of these three crops, return:
{{"is_plant": false, "error": "Image is not a Cocoa, Coffee, or Tomato plant"}}

CRITICAL RULES:
1. NEVER confuse crops. Cocoa has huge simple leaves. Coffee has small opposite waxy leaves. Tomato has compound serrated hairy leaves.
2. Disease ID MUST start with the correct crop prefix (cocoa_, coffee_, or tomato_).
3. If the plant looks healthy, use the _healthy variant for that crop.
4. Be specific about visual symptoms you actually see in the image."""

        response = self.gemini_client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[
                types.Content(
                    role="user",
                    parts=[
                        types.Part.from_bytes(data=img_data, mime_type="image/jpeg"),
                        types.Part.from_text(text=prompt),
                    ],
                )
            ],
        )

        # Parse the JSON response
        response_text = response.text.strip()
        # Remove markdown code fences if present
        if response_text.startswith("```"):
            response_text = response_text.split("\n", 1)[1]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            response_text = response_text.strip()

        try:
            parsed = json.loads(response_text)
        except json.JSONDecodeError:
            # Try to extract JSON from the response
            import re
            json_match = re.search(r'\{[\s\S]*\}', response_text)
            if json_match:
                parsed = json.loads(json_match.group())
            else:
                return {"success": False, "error": f"Failed to parse Gemini response: {response_text[:200]}"}

        if not parsed.get("is_plant", True):
            return {"success": False, "error": "Image does not appear to be a plant"}

        disease_id = parsed.get("disease_id", "")
        disease_info = DISEASE_KNOWLEDGE.get(disease_id)

        if not disease_info:
            # Try fuzzy matching
            for kid, kinfo in DISEASE_KNOWLEDGE.items():
                if kinfo["name"].lower() in disease_id.lower() or disease_id.lower() in kid:
                    disease_id = kid
                    disease_info = kinfo
                    break

        if not disease_info:
            # Use the crop_detected to fall back to the correct crop's healthy class
            detected_crop = parsed.get("crop_detected", "").lower()
            fallback_map = {"cocoa": "cocoa_healthy", "coffee": "coffee_healthy", "tomato": "tomato_healthy"}
            fallback_id = fallback_map.get(detected_crop, "tomato_healthy")
            disease_info = DISEASE_KNOWLEDGE[fallback_id]
            disease_id = fallback_id

        return {
            "success": True,
            "disease_id": disease_id,
            "disease_name": disease_info["name"],
            "scientific_name": disease_info["scientific"],
            "crop": disease_info["crop"],
            "crop_confidence": parsed.get("crop_confidence", 0.9),
            "confidence": parsed.get("confidence", 0.85),
            "severity": parsed.get("severity", disease_info["risk"]),
            "risk": disease_info["risk"],
            "treatment": disease_info["treatment"],
            "products": disease_info["products"],
            "visual_symptoms": parsed.get("visual_symptoms", []),
            "reasoning": parsed.get("reasoning", ""),
        }

    def _diagnose_tflite(self, image_bytes: bytes) -> dict:
        """Use locally trained TFLite models for offline detection."""
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img = img.resize((224, 224))
        img_array = np.array(img, dtype=np.float32) / 255.0
        img_array = np.expand_dims(img_array, axis=0)

        # Level 1: Gatekeeper
        if "gatekeeper" not in self.tflite_models:
            return {"success": False, "error": "Gatekeeper model not found"}

        gk = self.tflite_models["gatekeeper"]
        input_details = gk.get_input_details()
        output_details = gk.get_output_details()
        gk.set_tensor(input_details[0]['index'], img_array)
        gk.invoke()
        crop_probs = gk.get_tensor(output_details[0]['index'])[0]

        crop_idx = int(np.argmax(crop_probs))
        crop_conf = float(crop_probs[crop_idx])
        crop_names = ["Cocoa", "Coffee", "Tomato"]
        crop = crop_names[crop_idx]

        # Level 2: Specialist
        specialist_key = f"{crop.lower()}_specialist"
        if specialist_key not in self.tflite_models:
            return {"success": False, "error": f"{crop} specialist model not found"}

        sp = self.tflite_models[specialist_key]
        input_details = sp.get_input_details()
        output_details = sp.get_output_details()
        sp.set_tensor(input_details[0]['index'], img_array)
        sp.invoke()
        disease_probs = sp.get_tensor(output_details[0]['index'])[0]

        disease_idx = int(np.argmax(disease_probs))
        disease_conf = float(disease_probs[disease_idx])

        # Map class index to disease ID
        crop_diseases = [k for k, v in DISEASE_KNOWLEDGE.items() if v["crop"] == crop]
        if disease_idx < len(crop_diseases):
            disease_id = crop_diseases[disease_idx]
        else:
            disease_id = crop_diseases[-1]  # healthy

        disease_info = DISEASE_KNOWLEDGE[disease_id]

        return {
            "success": True,
            "disease_id": disease_id,
            "disease_name": disease_info["name"],
            "scientific_name": disease_info["scientific"],
            "crop": crop,
            "crop_confidence": crop_conf,
            "confidence": disease_conf,
            "severity": disease_info["risk"],
            "risk": disease_info["risk"],
            "treatment": disease_info["treatment"],
            "products": disease_info["products"],
            "visual_symptoms": [],
            "reasoning": f"TFLite model prediction (class {disease_idx})",
        }
