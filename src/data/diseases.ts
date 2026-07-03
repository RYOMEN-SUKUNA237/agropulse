// AgroPulse Disease Knowledge Base — v3
// 57 total classes across 5 crops:
//   Cocoa(10) + Coffee(10) + Tomato(20) + Banana(9) + Maize(8)
//
// IMPORTANT: classIndex is now PER-SPECIALIST (0-based within each crop's model).
// It is NOT a global flat index anymore. Use getDiseaseBySpecialistIndex().

export interface TreatmentStep {
    step: number;
    title: string;
    desc: string;
}

export interface Disease {
    id: string;
    name: string;
    scientificName: string;
    crop: 'Cocoa' | 'Coffee' | 'Tomato' | 'Banana' | 'Maize';
    type: 'Fungal' | 'Bacterial' | 'Viral' | 'Pest' | 'Nutritional' | 'Physiological';
    risk: 'Low' | 'Medium' | 'High' | 'Critical';
    description: string;
    symptoms: string[];
    treatment: TreatmentStep[];
    products: string[];
    classIndex: number; // per-specialist index, NOT global
}

// ═══════════════════════════════════════════════════════════════════
// COCOA (10)
// ═══════════════════════════════════════════════════════════════════
const cocoaDiseases: Disease[] = [
    {
        id: 'cocoa_black_pod', name: 'Black Pod', scientificName: 'Phytophthora palmivora',
        crop: 'Cocoa', type: 'Fungal', risk: 'Critical', classIndex: 0,
        description: 'Most destructive cocoa disease worldwide, causing pod rot and tree cankers.',
        symptoms: ['Dark brown/black lesions on pods', 'White sporulation on pod surface', 'Internal bean rot', 'Cankers on stems'],
        treatment: [
            { step: 1, title: 'Remove Infected Pods', desc: 'Harvest and remove all infected pods immediately. Bury or burn them away from the plantation.' },
            { step: 2, title: 'Apply Copper Fungicide', desc: 'Spray copper-based fungicide (Bordeaux mixture) on remaining healthy pods every 2–3 weeks.' },
            { step: 3, title: 'Improve Drainage', desc: 'Ensure proper drainage around trees to reduce humidity. Prune lower branches for airflow.' },
        ],
        products: ['Bordeaux Mixture', 'Ridomil Gold', 'Copper Hydroxide'],
    },
    {
        id: 'cocoa_swollen_shoot', name: 'Swollen Shoot', scientificName: 'Cacao swollen shoot virus',
        crop: 'Cocoa', type: 'Viral', risk: 'Critical', classIndex: 1,
        description: 'Devastating viral disease transmitted by mealybugs, causing stem swelling and tree death.',
        symptoms: ['Stem and root swelling', 'Red vein banding on young leaves', 'Leaf mosaic patterns', 'Gradual yield decline'],
        treatment: [
            { step: 1, title: 'Remove Infected Trees', desc: 'Cut down and destroy all infected trees plus a 5 m buffer zone.' },
            { step: 2, title: 'Control Mealybugs', desc: 'Apply systemic insecticide to control mealybug vectors on remaining trees.' },
            { step: 3, title: 'Replant Resistant Varieties', desc: 'Replant with CSSV-tolerant hybrid varieties after a 6-month fallow period.' },
        ],
        products: ['Imidacloprid', 'Confidor', 'Resistant hybrid seedlings'],
    },
    {
        id: 'cocoa_witches_broom', name: "Witches' Broom", scientificName: 'Moniliophthora perniciosa',
        crop: 'Cocoa', type: 'Fungal', risk: 'High', classIndex: 2,
        description: 'Causes abnormal shoot proliferation and pod deformation.',
        symptoms: ['Abnormal shoot branching (brooms)', 'Swollen green pods that do not ripen', 'Deformed flowers', 'Die-back of vegetative shoots'],
        treatment: [
            { step: 1, title: 'Prune Brooms', desc: 'Remove all brooms and infected tissue at least 15 cm below visible symptoms.' },
            { step: 2, title: 'Apply Fungicide', desc: 'Spray copper oxychloride during the wet season to prevent new infections.' },
            { step: 3, title: 'Maintain Shade', desc: 'Regulate shade levels to 40–60 % to reduce spore dispersal.' },
        ],
        products: ['Copper Oxychloride', 'Mancozeb', 'Pruning shears (sterilized)'],
    },
    {
        id: 'cocoa_frosty_pod', name: 'Frosty Pod Rot', scientificName: 'Moniliophthora roreri',
        crop: 'Cocoa', type: 'Fungal', risk: 'High', classIndex: 3,
        description: 'Causes pod rot with characteristic white frost-like sporulation.',
        symptoms: ['Premature pod ripening', 'Brown necrotic spots', 'White powdery spore mass', 'Internal pod decay'],
        treatment: [
            { step: 1, title: 'Frequent Harvesting', desc: 'Harvest pods every 7–10 days to reduce spore buildup.' },
            { step: 2, title: 'Remove Diseased Pods', desc: 'Collect and bury all infected pods at least 30 cm deep.' },
            { step: 3, title: 'Biological Control', desc: 'Apply Trichoderma-based biocontrol agents to soil and pod surfaces.' },
        ],
        products: ['Trichoderma harzianum', 'Copper Sulfate', 'Mancozeb'],
    },
    {
        id: 'cocoa_monilia', name: 'Monilia Pod Rot', scientificName: 'Moniliophthora spp.',
        crop: 'Cocoa', type: 'Fungal', risk: 'High', classIndex: 4,
        description: 'Pod disease causing internal rotting and heavy yield loss.',
        symptoms: ['Watery brown lesions', 'Chocolate-colored internal rot', 'White mycelial growth', 'Mummified pods'],
        treatment: [
            { step: 1, title: 'Sanitary Harvest', desc: 'Remove all diseased and mummified pods from trees and ground.' },
            { step: 2, title: 'Fungicide Spray', desc: 'Apply systemic fungicide during flowering and early pod development.' },
            { step: 3, title: 'Canopy Management', desc: 'Thin canopy to improve air circulation and reduce humidity.' },
        ],
        products: ['Azoxystrobin', 'Mancozeb', 'Copper Hydroxide'],
    },
    {
        id: 'cocoa_vascular_streak', name: 'Vascular Streak Dieback', scientificName: 'Ceratobasidium theobromae',
        crop: 'Cocoa', type: 'Fungal', risk: 'Medium', classIndex: 5,
        description: 'Causes vascular discoloration and leaf drop from branch tips.',
        symptoms: ['Leaf chlorosis from 2nd–3rd flush', 'Brown streaks in vascular tissue', 'Leaf drop from branch tips', 'Star-shaped scars on branches'],
        treatment: [
            { step: 1, title: 'Prune Infected Branches', desc: 'Cut infected branches 30 cm below visible symptoms.' },
            { step: 2, title: 'Apply Phosphonate', desc: 'Inject or spray potassium phosphonate for systemic protection.' },
            { step: 3, title: 'Improve Nutrition', desc: 'Apply balanced fertilizer to boost tree vigor and resistance.' },
        ],
        products: ['Potassium Phosphonate', 'NPK Fertilizer', 'Pruning paint'],
    },
    {
        id: 'cocoa_pod_borer', name: 'Cocoa Pod Borer', scientificName: 'Conopomorpha cramerella',
        crop: 'Cocoa', type: 'Pest', risk: 'High', classIndex: 6,
        description: 'Moth larva boring into pods causing bean clumping and reduced quality.',
        symptoms: ['Premature pod ripening', 'Uneven pod surface', 'Beans fused together internally', 'Small exit holes on pod surface'],
        treatment: [
            { step: 1, title: 'Frequent Harvesting', desc: 'Harvest ripe pods every week to break the pest lifecycle.' },
            { step: 2, title: 'Sleeve Pods', desc: 'Protect developing pods with plastic sleeves or netting.' },
            { step: 3, title: 'Apply Insecticide', desc: 'Use targeted insecticide sprays during peak moth flight periods.' },
        ],
        products: ['Deltamethrin', 'Plastic pod sleeves', 'Pheromone traps'],
    },
    {
        id: 'cocoa_stem_canker', name: 'Stem Canker', scientificName: 'Phytophthora megakarya',
        crop: 'Cocoa', type: 'Fungal', risk: 'High', classIndex: 7,
        description: 'Aggressive bark rot specific to West/Central Africa causing tree death.',
        symptoms: ['Dark wet bark lesions', 'Reddish-brown exudate', 'Bark cracking and peeling', 'Wilting of canopy above canker'],
        treatment: [
            { step: 1, title: 'Excise Canker', desc: 'Cut away all infected bark plus 5 cm healthy margin. Sterilize tools.' },
            { step: 2, title: 'Apply Wound Dressing', desc: 'Paint exposed tissue with copper paste or Bordeaux paint.' },
            { step: 3, title: 'Reduce Humidity', desc: 'Remove weeds and low branches to increase airflow at trunk level.' },
        ],
        products: ['Bordeaux Paint', 'Metalaxyl', 'Wound sealant'],
    },
    {
        id: 'cocoa_mirids', name: 'Mirid Bug Damage', scientificName: 'Sahlbergella singularis',
        crop: 'Cocoa', type: 'Pest', risk: 'Medium', classIndex: 8,
        description: 'Capsid bugs causing feeding lesions and dieback on shoots.',
        symptoms: ['Dark necrotic feeding lesions', 'Shoot tip die-back', 'Sunken spots on pods', 'Sooty mold on honeydew'],
        treatment: [
            { step: 1, title: 'Monitor Population', desc: 'Scout trees weekly for mirid presence, especially during dry season.' },
            { step: 2, title: 'Apply Insecticide', desc: 'Spray bifenthrin or imidacloprid at economic threshold (2+ mirids/tree).' },
            { step: 3, title: 'Shade Management', desc: 'Maintain moderate shade to deter mirid colonization.' },
        ],
        products: ['Bifenthrin', 'Imidacloprid', 'Neem oil'],
    },
    {
        id: 'cocoa_healthy', name: 'Healthy', scientificName: 'N/A',
        crop: 'Cocoa', type: 'Physiological', risk: 'Low', classIndex: 9,
        description: 'Healthy cocoa plant with no visible disease symptoms.',
        symptoms: ['No symptoms — healthy tissue'],
        treatment: [
            { step: 1, title: 'Continue Monitoring', desc: 'Maintain regular scouting schedule to catch early infections.' },
            { step: 2, title: 'Preventive Care', desc: 'Apply preventive copper spray during wet season onset.' },
            { step: 3, title: 'Optimal Nutrition', desc: 'Maintain balanced fertilization program for continued tree health.' },
        ],
        products: ['NPK 20-10-10', 'Organic compost', 'Copper preventive spray'],
    },
];

// ═══════════════════════════════════════════════════════════════════
// COFFEE (10)
// ═══════════════════════════════════════════════════════════════════
const coffeeDiseases: Disease[] = [
    {
        id: 'coffee_leaf_rust', name: 'Coffee Leaf Rust', scientificName: 'Hemileia vastatrix',
        crop: 'Coffee', type: 'Fungal', risk: 'Critical', classIndex: 0,
        description: 'Most economically important coffee disease globally, causing severe defoliation.',
        symptoms: ['Orange-yellow powdery spots on leaf undersides', 'Chlorotic patches on upper leaf surface', 'Premature leaf drop', 'Cherry drop and yield loss'],
        treatment: [
            { step: 1, title: 'Apply Copper Fungicide', desc: 'Spray copper hydroxide preventively before wet season (every 3–4 weeks).' },
            { step: 2, title: 'Remove Infected Leaves', desc: 'Strip severely infected leaves and dispose away from plantation.' },
            { step: 3, title: 'Systemic Fungicide', desc: 'Apply triazole-based fungicide for curative action on established infections.' },
        ],
        products: ['Copper Hydroxide', 'Triadimefon', 'Cyproconazole'],
    },
    {
        id: 'coffee_berry_disease', name: 'Coffee Berry Disease', scientificName: 'Colletotrichum kahawae',
        crop: 'Coffee', type: 'Fungal', risk: 'Critical', classIndex: 1,
        description: 'Devastating disease attacking green berries, causing mummification.',
        symptoms: ['Dark sunken lesions on green berries', 'Berry mummification', 'Premature berry drop', 'Acervuli on lesion surface'],
        treatment: [
            { step: 1, title: 'Preventive Spray', desc: 'Apply copper-based fungicide at flowering and berry expansion stages.' },
            { step: 2, title: 'Remove Mummies', desc: 'Collect and destroy all mummified berries from trees and ground.' },
            { step: 3, title: 'Resistant Varieties', desc: 'Gradually replace susceptible varieties with CBD-resistant cultivars.' },
        ],
        products: ['Copper Oxychloride', 'Carbendazim', 'CBD-resistant seedlings'],
    },
    {
        id: 'coffee_cercospora', name: 'Cercospora Leaf Spot', scientificName: 'Cercospora coffeicola',
        crop: 'Coffee', type: 'Fungal', risk: 'Medium', classIndex: 2,
        description: 'Common leaf spot disease exacerbated by nutrient deficiency.',
        symptoms: ['Brown circular spots with gray centers', 'Yellow halo around spots', 'Spots on berries', 'Premature leaf yellowing'],
        treatment: [
            { step: 1, title: 'Correct Nutrition', desc: 'Apply nitrogen and potassium fertilizers to reduce plant stress.' },
            { step: 2, title: 'Apply Fungicide', desc: 'Spray copper-based fungicide during wet periods.' },
            { step: 3, title: 'Shade Management', desc: 'Provide adequate shade (40–50 %) to reduce leaf stress.' },
        ],
        products: ['Copper Hydroxide', 'Urea (46-0-0)', 'KCl Fertilizer'],
    },
    {
        id: 'coffee_brown_eye_spot', name: 'Brown Eye Spot', scientificName: 'Cercospora coffeicola',
        crop: 'Coffee', type: 'Fungal', risk: 'Medium', classIndex: 3,
        description: 'Berry and leaf disease causing quality downgrade.',
        symptoms: ['Concentric ring spots on berries', 'Bulls-eye pattern on leaves', 'Berry discoloration', 'Reduced bean quality'],
        treatment: [
            { step: 1, title: 'Improve Fertilization', desc: 'Apply balanced NPK with micronutrients to boost plant immunity.' },
            { step: 2, title: 'Fungicide Program', desc: 'Alternate copper and systemic fungicide applications monthly.' },
            { step: 3, title: 'Proper Spacing', desc: 'Ensure adequate plant spacing for air circulation.' },
        ],
        products: ['Mancozeb', 'Copper Sulfate', 'NPK 17-17-17'],
    },
    {
        id: 'coffee_leaf_miner', name: 'Coffee Leaf Miner', scientificName: 'Leucoptera coffeella',
        crop: 'Coffee', type: 'Pest', risk: 'High', classIndex: 4,
        description: 'Moth larva mining inside coffee leaves causing severe defoliation.',
        symptoms: ['Translucent blotch mines in leaves', 'Brown dried-out mines', 'Heavy defoliation', 'Reduced photosynthesis'],
        treatment: [
            { step: 1, title: 'Biological Control', desc: 'Encourage parasitoid wasp populations by diversifying shade trees.' },
            { step: 2, title: 'Systemic Insecticide', desc: 'Apply neonicotinoid soil drench during peak infestation period.' },
            { step: 3, title: 'Remove Mined Leaves', desc: 'Collect heavily mined leaves to reduce next-generation emergence.' },
        ],
        products: ['Thiamethoxam', 'Neem Extract', 'Parasitoid wasp releases'],
    },
    {
        id: 'coffee_wilt', name: 'Coffee Wilt Disease', scientificName: 'Fusarium xylarioides',
        crop: 'Coffee', type: 'Fungal', risk: 'Critical', classIndex: 5,
        description: 'Lethal vascular disease causing rapid tree death.',
        symptoms: ['Rapid wilting of entire branches', 'Blackening of vascular tissue', 'Leaf yellowing and drop', 'Tree death within months'],
        treatment: [
            { step: 1, title: 'Uproot and Burn', desc: 'Remove and burn entire infected trees including root systems.' },
            { step: 2, title: 'Quarantine Zone', desc: 'Establish 10 m quarantine around infected area. Do not replant for 2 years.' },
            { step: 3, title: 'Resistant Clones', desc: 'Replant with CWD-resistant clonal varieties from certified nurseries.' },
        ],
        products: ['CWD-resistant clones', 'Soil fumigant', 'Lime (soil amendment)'],
    },
    {
        id: 'coffee_root_rot', name: 'Root Rot', scientificName: 'Armillaria mellea',
        crop: 'Coffee', type: 'Fungal', risk: 'High', classIndex: 6,
        description: 'Soil-borne root disease causing gradual tree decline.',
        symptoms: ['Gradual yellowing and wilting', 'White mycelial mats under bark', 'Mushroom fruiting bodies at base', 'Root bark decay'],
        treatment: [
            { step: 1, title: 'Improve Drainage', desc: 'Create drainage channels to prevent waterlogging around roots.' },
            { step: 2, title: 'Remove Dead Stumps', desc: 'Excavate and burn old tree stumps that harbor the fungus.' },
            { step: 3, title: 'Soil Treatment', desc: 'Apply Trichoderma-based biocontrol agent to soil around affected area.' },
        ],
        products: ['Trichoderma viride', 'Phosphoric acid', 'Agricultural lime'],
    },
    {
        id: 'coffee_anthracnose', name: 'Anthracnose', scientificName: 'Colletotrichum gloeosporioides',
        crop: 'Coffee', type: 'Fungal', risk: 'Medium', classIndex: 7,
        description: 'Causes die-back of branches and berry spotting.',
        symptoms: ['Dark sunken lesions on berries', 'Branch tip die-back', 'Leaf margin necrosis', 'Pink spore masses in wet weather'],
        treatment: [
            { step: 1, title: 'Prune Die-back', desc: 'Remove all dead and dying branches well below infection point.' },
            { step: 2, title: 'Copper Spray', desc: 'Apply copper fungicide at 2-week intervals during rainy season.' },
            { step: 3, title: 'Balanced Nutrition', desc: 'Ensure adequate potassium and calcium nutrition for resistance.' },
        ],
        products: ['Copper Oxychloride', 'Carbendazim', 'Potassium Sulfate'],
    },
    {
        id: 'coffee_bacterial_blight', name: 'Bacterial Blight', scientificName: 'Pseudomonas syringae',
        crop: 'Coffee', type: 'Bacterial', risk: 'Medium', classIndex: 8,
        description: 'Bacterial infection causing leaf blight and die-back in high altitudes.',
        symptoms: ['Water-soaked leaf lesions', 'Black necrotic leaf patches', 'Shoot tip blackening', 'Gummosis on stems'],
        treatment: [
            { step: 1, title: 'Remove Infected Tissue', desc: 'Prune and burn all blighted shoots and branches.' },
            { step: 2, title: 'Copper Bactericide', desc: 'Apply copper hydroxide spray to protect healthy tissue.' },
            { step: 3, title: 'Wind Protection', desc: 'Plant windbreaks to reduce wind-driven rain damage.' },
        ],
        products: ['Copper Hydroxide', 'Streptomycin Sulfate', 'Windbreak seedlings'],
    },
    {
        id: 'coffee_healthy', name: 'Healthy', scientificName: 'N/A',
        crop: 'Coffee', type: 'Physiological', risk: 'Low', classIndex: 9,
        description: 'Healthy coffee plant with no disease symptoms.',
        symptoms: ['No symptoms — healthy tissue'],
        treatment: [
            { step: 1, title: 'Continue Monitoring', desc: 'Scout weekly for early signs of rust or berry disease.' },
            { step: 2, title: 'Preventive Program', desc: 'Apply copper preventive spray at start of rainy season.' },
            { step: 3, title: 'Soil Health', desc: 'Maintain organic mulch and balanced fertilization schedule.' },
        ],
        products: ['NPK 22-6-12', 'Organic mulch', 'Copper preventive spray'],
    },
];

// ═══════════════════════════════════════════════════════════════════
// TOMATO (20)
// ═══════════════════════════════════════════════════════════════════
const tomatoDiseases: Disease[] = [
    { id: 'tomato_early_blight', name: 'Early Blight', scientificName: 'Alternaria solani', crop: 'Tomato', type: 'Fungal', risk: 'High', classIndex: 0, description: 'Common fungal disease causing concentric ring spots and defoliation.', symptoms: ['Dark concentric ring lesions', 'Lower leaf yellowing', 'Stem collar rot in seedlings', 'Fruit calyx-end rot'], treatment: [{ step: 1, title: 'Isolate & Prune', desc: 'Remove infected lower leaves immediately.' }, { step: 2, title: 'Apply Fungicide', desc: 'Use Chlorothalonil or Copper-based fungicide within 24 hours.' }, { step: 3, title: 'Adjust Irrigation', desc: 'Water at base only. Avoid overhead watering.' }], products: ['Chlorothalonil', 'Mancozeb', 'Copper Hydroxide'] },
    { id: 'tomato_late_blight', name: 'Late Blight', scientificName: 'Phytophthora infestans', crop: 'Tomato', type: 'Fungal', risk: 'Critical', classIndex: 1, description: 'Devastating oomycete disease that can destroy entire fields in days.', symptoms: ['Water-soaked dark lesions on leaves', 'White mold on leaf undersides', 'Firm brown fruit rot', 'Rapid plant collapse'], treatment: [{ step: 1, title: 'Emergency Spray', desc: 'Apply Metalaxyl + Mancozeb immediately.' }, { step: 2, title: 'Remove Infected Plants', desc: 'Pull and destroy severely infected plants.' }, { step: 3, title: 'Preventive Schedule', desc: 'Continue fungicide rotation every 7 days.' }], products: ['Ridomil Gold', 'Copper Hydroxide', 'Dimethomorph'] },
    { id: 'tomato_septoria', name: 'Septoria Leaf Spot', scientificName: 'Septoria lycopersici', crop: 'Tomato', type: 'Fungal', risk: 'Medium', classIndex: 2, description: 'Causes numerous small spots and progressive defoliation.', symptoms: ['Small circular spots with dark borders', 'Gray centers with tiny black dots', 'Lower leaf defoliation', 'Fruit sunscald'], treatment: [{ step: 1, title: 'Remove Lower Leaves', desc: 'Strip infected leaves below the first fruit cluster.' }, { step: 2, title: 'Fungicide Application', desc: 'Apply Chlorothalonil or Mancozeb.' }, { step: 3, title: 'Mulch Application', desc: 'Apply 3-inch mulch layer to prevent soil splash.' }], products: ['Chlorothalonil', 'Mancozeb', 'Straw mulch'] },
    { id: 'tomato_bacterial_spot', name: 'Bacterial Spot', scientificName: 'Xanthomonas vesicatoria', crop: 'Tomato', type: 'Bacterial', risk: 'High', classIndex: 3, description: 'Bacterial disease causing leaf spots and fruit blemishes.', symptoms: ['Small dark water-soaked leaf spots', 'Raised scabby fruit lesions', 'Leaf yellowing and drop', 'Spots may coalesce'], treatment: [{ step: 1, title: 'Copper + Mancozeb', desc: 'Apply copper hydroxide + mancozeb tank mix.' }, { step: 2, title: 'Reduce Overhead Water', desc: 'Switch to drip irrigation.' }, { step: 3, title: 'Crop Rotation', desc: 'Rotate with non-solanaceous crops for 2 seasons.' }], products: ['Copper Hydroxide', 'Mancozeb', 'Drip irrigation kit'] },
    { id: 'tomato_leaf_mold', name: 'Leaf Mold', scientificName: 'Passalora fulva', crop: 'Tomato', type: 'Fungal', risk: 'Medium', classIndex: 4, description: 'Greenhouse disease causing olive-green mold on leaf undersides.', symptoms: ['Pale yellowish spots on upper leaf', 'Olive-green velvety mold below', 'Leaf curling and withering', 'Reduced fruit set'], treatment: [{ step: 1, title: 'Improve Ventilation', desc: 'Open vents and space plants for airflow.' }, { step: 2, title: 'Reduce Humidity', desc: 'Keep relative humidity below 85 %.' }, { step: 3, title: 'Fungicide Spray', desc: 'Apply Chlorothalonil every 10 days.' }], products: ['Chlorothalonil', 'Greenhouse fans', 'Resistant varieties'] },
    { id: 'tomato_target_spot', name: 'Target Spot', scientificName: 'Corynespora cassiicola', crop: 'Tomato', type: 'Fungal', risk: 'Medium', classIndex: 5, description: 'Causes target-shaped lesions on leaves, stems and fruit.', symptoms: ['Concentric ringed lesions on leaves', 'Sunken fruit lesions', 'Stem lesions', 'Defoliation from lower canopy'], treatment: [{ step: 1, title: 'Remove Debris', desc: 'Clear all crop debris.' }, { step: 2, title: 'Apply Fungicide', desc: 'Use azoxystrobin or chlorothalonil in rotation.' }, { step: 3, title: 'Staking', desc: 'Stake and prune plants to improve air circulation.' }], products: ['Azoxystrobin', 'Chlorothalonil', 'Plant stakes'] },
    { id: 'tomato_mosaic', name: 'Tomato Mosaic Virus', scientificName: 'Tomato mosaic virus (ToMV)', crop: 'Tomato', type: 'Viral', risk: 'High', classIndex: 6, description: 'Highly contagious viral disease causing leaf mottling and yield loss.', symptoms: ['Light/dark green leaf mosaic', 'Leaf curling and distortion', 'Stunted growth', 'Reduced fruit size'], treatment: [{ step: 1, title: 'Remove Infected Plants', desc: 'Rogue out all symptomatic plants immediately.' }, { step: 2, title: 'Sanitize Tools', desc: 'Dip tools in 10 % bleach solution.' }, { step: 3, title: 'Use Resistant Varieties', desc: 'Replant with TMV-resistant varieties.' }], products: ['Sodium hypochlorite', 'TMV-resistant seeds', 'Disposable gloves'] },
    { id: 'tomato_yellow_leaf_curl', name: 'Yellow Leaf Curl', scientificName: 'TYLCV', crop: 'Tomato', type: 'Viral', risk: 'Critical', classIndex: 7, description: 'Whitefly-transmitted virus causing severe leaf curling and yield loss.', symptoms: ['Upward leaf curling and cupping', 'Leaf yellowing at margins', 'Stunted bushy growth', 'Flower drop and no fruit set'], treatment: [{ step: 1, title: 'Control Whiteflies', desc: 'Apply imidacloprid or install sticky traps.' }, { step: 2, title: 'Remove Infected Plants', desc: 'Uproot and destroy symptomatic plants in sealed bags.' }, { step: 3, title: 'Reflective Mulch', desc: 'Place silver mulch to repel whiteflies.' }], products: ['Imidacloprid', 'Yellow sticky traps', 'Silver reflective mulch'] },
    { id: 'tomato_spider_mites', name: 'Spider Mites', scientificName: 'Tetranychus urticae', crop: 'Tomato', type: 'Pest', risk: 'Medium', classIndex: 8, description: 'Tiny arachnids causing stippling and leaf bronzing.', symptoms: ['Fine stippling on upper leaf surface', 'Leaf bronzing and curling', 'Fine webbing on leaf undersides', 'Plant stunting in severe cases'], treatment: [{ step: 1, title: 'Water Spray', desc: 'Blast undersides with strong water jet.' }, { step: 2, title: 'Miticide Application', desc: 'Apply abamectin targeting leaf undersides.' }, { step: 3, title: 'Biological Control', desc: 'Release predatory mites for long-term control.' }], products: ['Abamectin', 'Spiromesifen', 'Predatory mites'] },
    { id: 'tomato_bacterial_wilt', name: 'Bacterial Wilt', scientificName: 'Ralstonia solanacearum', crop: 'Tomato', type: 'Bacterial', risk: 'Critical', classIndex: 9, description: 'Devastating soil-borne disease causing rapid whole-plant wilting.', symptoms: ['Rapid wilting without yellowing', 'Brown vascular discoloration', 'Bacterial ooze from cut stems', 'Plant death within days'], treatment: [{ step: 1, title: 'Remove & Destroy', desc: 'Uproot infected plants with surrounding soil.' }, { step: 2, title: 'Soil Solarization', desc: 'Cover affected area with clear plastic for 6 weeks.' }, { step: 3, title: 'Grafting', desc: 'Use grafted tomatoes on resistant rootstock.' }], products: ['Resistant rootstock', 'Clear plastic sheeting', 'Lime'] },
    { id: 'tomato_fusarium_wilt', name: 'Fusarium Wilt', scientificName: 'Fusarium oxysporum f.sp. lycopersici', crop: 'Tomato', type: 'Fungal', risk: 'High', classIndex: 10, description: 'Soil-borne fungal disease causing one-sided wilting.', symptoms: ['One-sided leaf yellowing', 'Wilting from lower leaves', 'Brown vascular tissue in stems', 'Plant stunting and death'], treatment: [{ step: 1, title: 'Remove Plants', desc: 'Remove infected plants and surrounding soil.' }, { step: 2, title: 'Soil Amendment', desc: 'Raise soil pH to 6.5–7.0 with lime.' }, { step: 3, title: 'Resistant Varieties', desc: 'Plant Fol-resistant varieties.' }], products: ['Agricultural lime', 'Trichoderma', 'Resistant seeds'] },
    { id: 'tomato_verticillium_wilt', name: 'Verticillium Wilt', scientificName: 'Verticillium dahliae', crop: 'Tomato', type: 'Fungal', risk: 'Medium', classIndex: 11, description: 'Soil-borne disease causing V-shaped yellowing patterns.', symptoms: ['V-shaped yellowing on leaf margins', 'Lower leaf wilting in daytime', 'Light brown vascular discoloration', 'Slow progressive decline'], treatment: [{ step: 1, title: 'Solarize Soil', desc: 'Cover soil with clear plastic for 4–6 weeks.' }, { step: 2, title: 'Crop Rotation', desc: 'Rotate with non-host crops for 4+ years.' }, { step: 3, title: 'Resistant Varieties', desc: 'Select Ve resistance gene varieties.' }], products: ['Clear plastic sheeting', 'Resistant seeds', 'Organic compost'] },
    { id: 'tomato_powdery_mildew', name: 'Powdery Mildew', scientificName: 'Oidium neolycopersici', crop: 'Tomato', type: 'Fungal', risk: 'Medium', classIndex: 12, description: 'White powdery fungal growth on leaf surfaces.', symptoms: ['White powdery patches on leaves', 'Leaf yellowing beneath mildew', 'Defoliation in severe cases', 'Rarely affects fruit'], treatment: [{ step: 1, title: 'Sulfur Spray', desc: 'Apply wettable sulfur as preventive.' }, { step: 2, title: 'Potassium Bicarbonate', desc: 'Spray 0.5 % potassium bicarbonate.' }, { step: 3, title: 'Air Circulation', desc: 'Improve spacing and pruning.' }], products: ['Wettable Sulfur', 'Potassium Bicarbonate', 'Neem Oil'] },
    { id: 'tomato_leaf_curl', name: 'Leaf Curl', scientificName: 'ToLCV complex', crop: 'Tomato', type: 'Viral', risk: 'High', classIndex: 13, description: 'Geminivirus complex transmitted by whiteflies.', symptoms: ['Severe upward leaf curling', 'Leaf thickening and brittleness', 'Stunted internode length', 'Flower abortion'], treatment: [{ step: 1, title: 'Vector Control', desc: 'Apply systemic insecticide for whitefly control.' }, { step: 2, title: 'Barrier Crops', desc: 'Plant maize around tomato fields.' }, { step: 3, title: 'Resistant Hybrids', desc: 'Use ToLCV-resistant hybrid varieties.' }], products: ['Thiamethoxam', 'Maize seed', 'Resistant hybrid seeds'] },
    { id: 'tomato_blossom_end_rot', name: 'Blossom End Rot', scientificName: 'Calcium deficiency', crop: 'Tomato', type: 'Nutritional', risk: 'Medium', classIndex: 14, description: 'Physiological disorder caused by calcium imbalance.', symptoms: ['Dark sunken area at fruit blossom end', 'Dry leathery texture', 'Secondary mold on lesion', 'First fruit clusters mainly affected'], treatment: [{ step: 1, title: 'Consistent Watering', desc: 'Maintain even soil moisture with drip irrigation.' }, { step: 2, title: 'Calcium Application', desc: 'Apply calcium chloride foliar spray (0.5 %) weekly.' }, { step: 3, title: 'Soil Calcium', desc: 'Incorporate gypsum or lime before next planting.' }], products: ['Calcium Chloride', 'Gypsum', 'Drip irrigation'] },
    { id: 'tomato_anthracnose', name: 'Anthracnose', scientificName: 'Colletotrichum coccodes', crop: 'Tomato', type: 'Fungal', risk: 'Medium', classIndex: 15, description: 'Fruit rot disease causing sunken circular lesions on ripe tomatoes.', symptoms: ['Circular sunken fruit lesions', 'Concentric ring pattern', 'Dark center dots (acervuli)', 'Mainly on ripe fruit'], treatment: [{ step: 1, title: 'Harvest Promptly', desc: 'Pick fruit at first ripeness.' }, { step: 2, title: 'Fungicide Program', desc: 'Apply chlorothalonil from first fruit set.' }, { step: 3, title: 'Remove Debris', desc: 'Clear old plant debris from field.' }], products: ['Chlorothalonil', 'Azoxystrobin', 'Harvest crates'] },
    { id: 'tomato_gray_mold', name: 'Gray Mold (Botrytis)', scientificName: 'Botrytis cinerea', crop: 'Tomato', type: 'Fungal', risk: 'High', classIndex: 16, description: 'Opportunistic fungus causing gray fuzzy mold on stems, leaves and fruit.', symptoms: ['Gray fuzzy mold on stems and leaves', 'Ghost spot rings on fruit', 'Stem cankers at pruning wounds', 'Flower cluster die-off'], treatment: [{ step: 1, title: 'Ventilation', desc: 'Reduce humidity below 80 %.' }, { step: 2, title: 'Hygiene', desc: 'Remove dead leaves and infected tissue.' }, { step: 3, title: 'Fungicide', desc: 'Apply iprodione or boscalid to protect wounds.' }], products: ['Iprodione', 'Boscalid', 'Greenhouse heater'] },
    { id: 'tomato_bacterial_canker', name: 'Bacterial Canker', scientificName: 'Clavibacter michiganensis', crop: 'Tomato', type: 'Bacterial', risk: 'High', classIndex: 17, description: 'Seed-borne bacterial disease causing wilting and canker formation.', symptoms: ['Unilateral leaf wilting', 'Stem cankers with bacterial ooze', 'Bird-eye fruit spots', 'Marginal leaf scorch'], treatment: [{ step: 1, title: 'Destroy Plants', desc: 'Remove and burn all infected plants.' }, { step: 2, title: 'Seed Treatment', desc: 'Use certified disease-free seed.' }, { step: 3, title: 'Copper Spray', desc: 'Apply copper bactericide preventively.' }], products: ['Certified seed', 'Copper Hydroxide', 'Hot water treater'] },
    { id: 'tomato_white_mold', name: 'White Mold', scientificName: 'Sclerotinia sclerotiorum', crop: 'Tomato', type: 'Fungal', risk: 'Medium', classIndex: 18, description: 'Soil-borne fungus producing fluffy white mycelium and sclerotia.', symptoms: ['White cottony fungal growth on stems', 'Hard black sclerotia in stems', 'Stem girdling and wilt', 'Fruit colonization near soil'], treatment: [{ step: 1, title: 'Remove Infected Parts', desc: 'Cut stems below infection.' }, { step: 2, title: 'Biocontrol', desc: 'Apply Coniothyrium minitans to soil.' }, { step: 3, title: 'Deep Plowing', desc: 'Bury sclerotia deeply (>15 cm).' }], products: ['Contans (C. minitans)', 'Iprodione', 'Deep plow equipment'] },
    { id: 'tomato_healthy', name: 'Healthy', scientificName: 'N/A', crop: 'Tomato', type: 'Physiological', risk: 'Low', classIndex: 19, description: 'Healthy tomato plant with no visible disease symptoms.', symptoms: ['No symptoms — healthy tissue'], treatment: [{ step: 1, title: 'Continue Monitoring', desc: 'Scout plants 2–3 times per week.' }, { step: 2, title: 'Preventive Program', desc: 'Maintain bi-weekly preventive fungicide rotation.' }, { step: 3, title: 'Optimal Practices', desc: 'Consistent watering, balanced nutrition, good airflow.' }], products: ['NPK 15-15-15', 'Organic mulch', 'Preventive copper spray'] },
];

// ═══════════════════════════════════════════════════════════════════
// BANANA (9)
// ═══════════════════════════════════════════════════════════════════
const bananaDiseases: Disease[] = [
    {
        id: 'banana_black_sigatoka', name: 'Black Sigatoka', scientificName: 'Pseudocercospora fijiensis',
        crop: 'Banana', type: 'Fungal', risk: 'Critical', classIndex: 0,
        description: 'Most serious fungal disease of banana worldwide, causing premature ripening and severe yield loss.',
        symptoms: ['Small pale yellow streaks on leaves', 'Dark brown-black necrotic lesions', 'Leaf collapse and drying', 'Premature fruit ripening'],
        treatment: [
            { step: 1, title: 'Systemic Fungicide', desc: 'Apply propiconazole or trifloxystrobin at regular intervals.' },
            { step: 2, title: 'Deleafing', desc: 'Remove severely infected leaves and destroy them.' },
            { step: 3, title: 'Resistant Varieties', desc: 'Plant Black Sigatoka-resistant cultivars (e.g., FHIA hybrids).' },
        ],
        products: ['Propiconazole', 'Trifloxystrobin', 'Mancozeb'],
    },
    {
        id: 'banana_yellow_sigatoka', name: 'Yellow Sigatoka', scientificName: 'Pseudocercospora musae',
        crop: 'Banana', type: 'Fungal', risk: 'High', classIndex: 1,
        description: 'Leaf spot disease causing premature defoliation and reduced bunch weight.',
        symptoms: ['Yellow-green streaks on young leaves', 'Brown elliptical spots with yellow halos', 'Leaf drying from tips', 'Reduced leaf area'],
        treatment: [
            { step: 1, title: 'Copper Spray', desc: 'Apply copper fungicide at 3-week intervals during wet season.' },
            { step: 2, title: 'Remove Infected Leaves', desc: 'Deleaf infected leaves below 3rd functional leaf.' },
            { step: 3, title: 'Improve Drainage', desc: 'Ensure good drainage and reduce plant density.' },
        ],
        products: ['Copper Hydroxide', 'Mancozeb', 'Bordeaux mixture'],
    },
    {
        id: 'banana_panama', name: 'Panama Disease', scientificName: 'Fusarium oxysporum f.sp. cubense',
        crop: 'Banana', type: 'Fungal', risk: 'Critical', classIndex: 2,
        description: 'Soil-borne vascular wilt disease that has devastated banana plantations globally.',
        symptoms: ['Yellowing of oldest leaves first', 'Brown streaks in pseudo-stem vascular tissue', 'Plant collapse from outside in', 'Discolored rhizome tissue'],
        treatment: [
            { step: 1, title: 'Quarantine Area', desc: 'Mark and quarantine affected area immediately.' },
            { step: 2, title: 'Remove Infected Plants', desc: 'Uproot and destroy all infected plants and suckers.' },
            { step: 3, title: 'Plant Resistant Varieties', desc: 'Replant with Foc TR4-resistant varieties (e.g., GCTCV-219).' },
        ],
        products: ['TR4-resistant planting material', 'Soil fumigant', 'Lime (pH adjustment)'],
    },
    {
        id: 'banana_moko', name: 'Moko Disease', scientificName: 'Ralstonia solanacearum',
        crop: 'Banana', type: 'Bacterial', risk: 'Critical', classIndex: 3,
        description: 'Bacterial wilt causing rapid plant death and unmarketable fruit.',
        symptoms: ['Yellow wilting from youngest leaves', 'Brown vascular discoloration in pseudo-stem', 'Bacterial ooze from cut surfaces', 'Internal fruit browning'],
        treatment: [
            { step: 1, title: 'Destroy Infected Plants', desc: 'Cut and destroy all infected plants at soil level.' },
            { step: 2, title: 'Strict Hygiene', desc: 'Disinfect all tools with 10 % bleach before moving between plants.' },
            { step: 3, title: 'Control Insects', desc: 'Control insect vectors with insecticide to prevent mechanical spread.' },
        ],
        products: ['Glyphosate (stump treatment)', 'Sodium hypochlorite', 'Imidacloprid'],
    },
    {
        id: 'banana_bract_mosaic', name: 'Bract Mosaic Virus', scientificName: 'Banana bract mosaic virus (BBrMV)',
        crop: 'Banana', type: 'Viral', risk: 'High', classIndex: 4,
        description: 'Aphid-transmitted virus causing mosaic patterns and reduced yields.',
        symptoms: ['Mosaic and streaking on bracts and leaves', 'Necrotic streaks on pseudo-stem', 'Stunted bunch development', 'Distorted flowers'],
        treatment: [
            { step: 1, title: 'Remove Infected Plants', desc: 'Rogue out infected plants and replace with clean material.' },
            { step: 2, title: 'Control Aphids', desc: 'Apply systemic insecticide to control aphid vectors.' },
            { step: 3, title: 'Certified Planting Material', desc: 'Source only virus-tested, tissue-culture propagated suckers.' },
        ],
        products: ['Imidacloprid', 'Tissue-culture planting material', 'Mineral oil spray'],
    },
    {
        id: 'banana_insect_pest', name: 'Banana Weevil Borer', scientificName: 'Cosmopolites sordidus',
        crop: 'Banana', type: 'Pest', risk: 'High', classIndex: 5,
        description: 'Larvae bore tunnels in the corm causing plant weakening and toppling.',
        symptoms: ['Tunnels in corm and pseudo-stem base', 'Yellowing and wilting leaves', 'Reduced sucker production', 'Plant lodging in wind'],
        treatment: [
            { step: 1, title: 'Pheromone Traps', desc: 'Deploy weevil pheromone traps at 4 per hectare.' },
            { step: 2, title: 'Systemic Insecticide', desc: 'Apply carbofuran or chlorpyrifos at corm level.' },
            { step: 3, title: 'Crop Sanitation', desc: 'Remove old pseudo-stems that harbor weevils.' },
        ],
        products: ['Pheromone traps', 'Chlorpyrifos', 'Carbofuran'],
    },
    {
        id: 'banana_cordana', name: 'Cordana Leaf Spot', scientificName: 'Cordana musae',
        crop: 'Banana', type: 'Fungal', risk: 'Medium', classIndex: 6,
        description: 'Minor leaf spot disease appearing on older leaves.',
        symptoms: ['Oval brown spots with pale centers', 'Yellow border around spots', 'Mainly on older leaf margins', 'Limited spread under normal conditions'],
        treatment: [
            { step: 1, title: 'Remove Old Leaves', desc: 'Prune and destroy affected older leaves.' },
            { step: 2, title: 'Improve Nutrition', desc: 'Apply balanced fertilizer to strengthen resistance.' },
            { step: 3, title: 'Fungicide if Severe', desc: 'Apply copper fungicide if infection spreads to young leaves.' },
        ],
        products: ['Copper Hydroxide', 'NPK Fertilizer', 'Mancozeb'],
    },
    {
        id: 'banana_anthracnose', name: 'Banana Anthracnose', scientificName: 'Colletotrichum musae',
        crop: 'Banana', type: 'Fungal', risk: 'Medium', classIndex: 7,
        description: 'Post-harvest fruit disease causing black skin lesions on ripe bananas.',
        symptoms: ['Black sunken fruit skin lesions', 'Lesions enlarge rapidly at ripening', 'White spore masses in moist conditions', 'Premature rotting'],
        treatment: [
            { step: 1, title: 'Harvest at Correct Maturity', desc: 'Harvest at 75–80 % full (not overripe).' },
            { step: 2, title: 'Fungicide Dip', desc: 'Dip harvested hands in Thiabendazole solution.' },
            { step: 3, title: 'Cool Chain', desc: 'Maintain cold chain (13–14 °C) to slow disease.' },
        ],
        products: ['Thiabendazole', 'Prochloraz', 'Imazalil'],
    },
    {
        id: 'banana_healthy', name: 'Healthy', scientificName: 'N/A',
        crop: 'Banana', type: 'Physiological', risk: 'Low', classIndex: 8,
        description: 'Healthy banana plant with no visible disease symptoms.',
        symptoms: ['No symptoms — healthy tissue'],
        treatment: [
            { step: 1, title: 'Continue Monitoring', desc: 'Scout plantation weekly for Black Sigatoka and Moko disease.' },
            { step: 2, title: 'Preventive Program', desc: 'Apply copper spray at regular intervals during wet season.' },
            { step: 3, title: 'Soil Fertility', desc: 'Maintain potassium-rich fertilization and adequate irrigation.' },
        ],
        products: ['NPK 15-5-30', 'Copper preventive spray', 'Organic mulch'],
    },
];

// ═══════════════════════════════════════════════════════════════════
// MAIZE (8)
// ═══════════════════════════════════════════════════════════════════
const maizeDiseases: Disease[] = [
    {
        id: 'maize_gray_leaf_spot', name: 'Gray Leaf Spot', scientificName: 'Cercospora zeae-maydis',
        crop: 'Maize', type: 'Fungal', risk: 'High', classIndex: 0,
        description: 'Major foliar disease of maize causing rectangular gray lesions and yield loss.',
        symptoms: ['Rectangular gray-tan lesions parallel to leaf veins', 'Lesions turn tan with dark borders', 'Severe defoliation in high humidity', 'Premature plant senescence'],
        treatment: [
            { step: 1, title: 'Apply Fungicide', desc: 'Apply strobilurin or triazole fungicide at early disease appearance.' },
            { step: 2, title: 'Crop Rotation', desc: 'Rotate out of maize for at least one season.' },
            { step: 3, title: 'Resistant Hybrids', desc: 'Plant hybrids with good GLS tolerance ratings.' },
        ],
        products: ['Azoxystrobin', 'Propiconazole', 'Pyraclostrobin'],
    },
    {
        id: 'maize_common_rust', name: 'Common Rust', scientificName: 'Puccinia sorghi',
        crop: 'Maize', type: 'Fungal', risk: 'Medium', classIndex: 1,
        description: 'Widespread rust disease of maize causing brick-red pustules on leaves.',
        symptoms: ['Brick-red oval to elongated pustules on both leaf surfaces', 'Pustules turn dark at maturity', 'Heavy infestation causes leaf death', 'Favored by cool humid weather'],
        treatment: [
            { step: 1, title: 'Early Fungicide', desc: 'Apply fungicide if >5 % of leaf area is infected before tasseling.' },
            { step: 2, title: 'Resistant Varieties', desc: 'Plant rust-resistant maize varieties.' },
            { step: 3, title: 'Timely Planting', desc: 'Plant early to reduce exposure during vulnerable stages.' },
        ],
        products: ['Mancozeb', 'Triazole fungicide', 'Propiconazole'],
    },
    {
        id: 'maize_northern_blight', name: 'Northern Leaf Blight', scientificName: 'Exserohilum turcicum',
        crop: 'Maize', type: 'Fungal', risk: 'High', classIndex: 2,
        description: 'Causes large cigar-shaped lesions that can destroy the entire upper canopy.',
        symptoms: ['Long (10–15 cm) cigar-shaped gray-green to tan lesions', 'Lesions begin on lower leaves', 'Dark sporulation in center of lesions', 'Lesion coalescence causing blight'],
        treatment: [
            { step: 1, title: 'Fungicide at VT/R1', desc: 'Apply strobilurin fungicide at tasseling/silking stage.' },
            { step: 2, title: 'Tillage', desc: 'Till crop residue to reduce inoculum carryover.' },
            { step: 3, title: 'Resistant Hybrids', desc: 'Use hybrids with Ht1/Ht2/Htn1 resistance genes.' },
        ],
        products: ['Azoxystrobin + Propiconazole', 'Pyraclostrobin', 'Tebuconazole'],
    },
    {
        id: 'maize_southern_blight', name: 'Southern Leaf Blight', scientificName: 'Bipolaris maydis',
        crop: 'Maize', type: 'Fungal', risk: 'Medium', classIndex: 3,
        description: 'Causes small rectangular lesions on leaves, significant in tropical climates.',
        symptoms: ['Small tan rectangular lesions with brown borders', 'Lesion alignment between veins', 'Leaf blighting in severe cases', 'Most severe in hot humid weather'],
        treatment: [
            { step: 1, title: 'Apply Fungicide', desc: 'Use mancozeb or triazole-based fungicide early.' },
            { step: 2, title: 'Balanced Nutrition', desc: 'Maintain adequate NPK nutrition.' },
            { step: 3, title: 'Resistant Varieties', desc: 'Select varieties with Southern Blight tolerance.' },
        ],
        products: ['Mancozeb', 'Carbendazim', 'Triazole fungicide'],
    },
    {
        id: 'maize_streak_virus', name: 'Maize Streak Virus', scientificName: 'Maize streak virus (MSV)',
        crop: 'Maize', type: 'Viral', risk: 'High', classIndex: 4,
        description: 'Leafhopper-transmitted virus endemic to Africa causing characteristic leaf streaking.',
        symptoms: ['Narrow interrupted yellow streaks on leaves', 'Streaks run parallel to leaf veins', 'Severe stunting in early infections', 'Reduced cob size and grain fill'],
        treatment: [
            { step: 1, title: 'Resistant Varieties', desc: 'Plant MSV-resistant hybrid varieties (primary management tool).' },
            { step: 2, title: 'Control Leafhoppers', desc: 'Apply imidacloprid seed treatment to reduce early damage.' },
            { step: 3, title: 'Early Planting', desc: 'Plant at start of rains to escape peak leafhopper pressure.' },
        ],
        products: ['MSV-resistant seed', 'Imidacloprid seed treatment', 'Lambda-cyhalothrin'],
    },
    {
        id: 'maize_fall_armyworm', name: 'Fall Armyworm', scientificName: 'Spodoptera frugiperda',
        crop: 'Maize', type: 'Pest', risk: 'Critical', classIndex: 5,
        description: 'Invasive moth pest devastating maize across Africa, causing catastrophic yield losses.',
        symptoms: ['Ragged feeding damage in whorl', 'Frass (sawdust-like excrement) in whorl', 'Windowed leaves (transparent patches)', 'Larvae with inverted Y on head capsule'],
        treatment: [
            { step: 1, title: 'Early Detection', desc: 'Scout crops weekly from emergence. Act when >20 % plants show damage.' },
            { step: 2, title: 'Apply Insecticide', desc: 'Apply lambda-cyhalothrin, emamectin benzoate, or spinosad into whorl.' },
            { step: 3, title: 'Biological Control', desc: 'Encourage natural enemies; apply Bt (Bacillus thuringiensis) products.' },
        ],
        products: ['Emamectin benzoate', 'Lambda-cyhalothrin', 'Bt (Bacillus thuringiensis)'],
    },
    {
        id: 'maize_ear_rot', name: 'Ear Rot (Aflatoxin)', scientificName: 'Aspergillus flavus',
        crop: 'Maize', type: 'Fungal', risk: 'Critical', classIndex: 6,
        description: 'Produces aflatoxin mycotoxins toxic to humans and livestock. Major food safety concern.',
        symptoms: ['Olive-green/yellow-green mold on ears', 'Discolored silk and husk', 'Shriveled grayish kernels', 'Premature husk opening'],
        treatment: [
            { step: 1, title: 'Harvest Early', desc: 'Harvest at physiological maturity (30 % moisture); do not delay.' },
            { step: 2, title: 'Proper Drying', desc: 'Dry grain to below 12 % moisture content within 24–48 hours.' },
            { step: 3, title: 'Biocontrol', desc: 'Apply Aflasafe (atoxigenic Aspergillus) before silking.' },
        ],
        products: ['Aflasafe biocontrol', 'Grain dryer', 'Moisture meter'],
    },
    {
        id: 'maize_healthy', name: 'Healthy', scientificName: 'N/A',
        crop: 'Maize', type: 'Physiological', risk: 'Low', classIndex: 7,
        description: 'Healthy maize plant with no visible disease symptoms.',
        symptoms: ['No symptoms — healthy tissue'],
        treatment: [
            { step: 1, title: 'Continue Monitoring', desc: 'Scout weekly for fall armyworm and streak virus.' },
            { step: 2, title: 'Preventive Fertilization', desc: 'Apply nitrogen in split doses at V4 and V8 stages.' },
            { step: 3, title: 'Pest Management', desc: 'Maintain insecticide seed treatment for leafhopper/FAW control.' },
        ],
        products: ['NPK 23-10-5', 'Urea (top-dress)', 'Imidacloprid seed treatment'],
    },
];

// ═══════════════════════════════════════════════════════════════════
// FRUIT RECOGNITION (3) — the model was taught to tell a fruit from a leaf.
// These are NOT diseases; they signal "you photographed fruit". We still
// surface a helpful, benign result and nudge the user to shoot a leaf for a
// disease diagnosis. Ids must match the fruit classes in kaggle_notebook.py.
// ═══════════════════════════════════════════════════════════════════
const fruitRecognition: Disease[] = [
    {
        id: 'tomato_fruit', name: 'Tomato Fruit', scientificName: 'Solanum lycopersicum (fruit)',
        crop: 'Tomato', type: 'Physiological', risk: 'Low', classIndex: 90,
        description: 'A tomato fruit was recognised (not a leaf). Leaf diseases are diagnosed from foliage — photograph a leaf for a disease reading.',
        symptoms: ['Whole fruit in frame rather than a leaf'],
        treatment: [
            { step: 1, title: 'Photograph a Leaf', desc: 'For disease detection, take a clear photo of a single leaf (top and underside) instead of the fruit.' },
        ],
        products: [],
    },
    {
        id: 'banana_fruit', name: 'Banana Fruit', scientificName: 'Musa spp. (fruit)',
        crop: 'Banana', type: 'Physiological', risk: 'Low', classIndex: 91,
        description: 'A banana fruit/bunch was recognised (not a leaf). Photograph a leaf for a disease reading.',
        symptoms: ['Whole fruit/bunch in frame rather than a leaf'],
        treatment: [
            { step: 1, title: 'Photograph a Leaf', desc: 'For disease detection, take a clear photo of a banana leaf instead of the fruit.' },
        ],
        products: [],
    },
    {
        id: 'coffee_cherry', name: 'Coffee Cherry', scientificName: 'Coffea spp. (fruit)',
        crop: 'Coffee', type: 'Physiological', risk: 'Low', classIndex: 92,
        description: 'Coffee cherries were recognised (not a leaf). Photograph a leaf for a disease reading.',
        symptoms: ['Cherries/berries in frame rather than a leaf'],
        treatment: [
            { step: 1, title: 'Photograph a Leaf', desc: 'For disease detection, take a clear photo of a coffee leaf instead of the cherries.' },
        ],
        products: [],
    },
];

// ═══════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════
export const ALL_DISEASES: Disease[] = [
    ...cocoaDiseases,
    ...coffeeDiseases,
    ...tomatoDiseases,
    ...bananaDiseases,
    ...maizeDiseases,
    ...fruitRecognition,
];

export const CROP_TYPES = ['Cocoa', 'Coffee', 'Tomato', 'Banana', 'Maize'] as const;
export type CropType = typeof CROP_TYPES[number];

export function getDiseasesByCrop(crop: CropType): Disease[] {
    return ALL_DISEASES.filter(d => d.crop === crop);
}

export function getDiseaseById(id: string): Disease | undefined {
    return ALL_DISEASES.find(d => d.id === id);
}

/**
 * Resolve specialist model output (index + class map JSON) to a Disease.
 * classMap comes from the *_classes.json file generated during training.
 * Format: {"0": "disease_id_a", "1": "disease_id_b", ...}
 * This is the Bug A fix — no hardcoded index assumptions.
 */
export function getDiseaseFromClassMap(
    classMap: Record<string, string>,
    outputIndex: number
): Disease | undefined {
    const diseaseId = classMap[String(outputIndex)];
    if (!diseaseId) return undefined;
    return getDiseaseById(diseaseId);
}

/**
 * Maps gatekeeper output class name string → CropType.
 * The gatekeeper class map returns folder names that match crop names.
 */
export function getCropFromGatekeeperLabel(label: string): CropType {
    const map: Record<string, CropType> = {
        Cocoa: 'Cocoa', cocoa: 'Cocoa',
        Coffee: 'Coffee', coffee: 'Coffee',
        Tomato: 'Tomato', tomato: 'Tomato',
        Banana: 'Banana', banana: 'Banana',
        Maize: 'Maize', maize: 'Maize', Corn: 'Maize', corn: 'Maize',
    };
    return map[label] || 'Tomato';
}

export const CROP_DISEASE_COUNTS: Record<CropType, number> = {
    Cocoa: 10, Coffee: 10, Tomato: 20, Banana: 9, Maize: 8,
};

// ── Backward-compat shims ─────────────────────────────────────────
/** @deprecated Use getDiseaseFromClassMap instead (Bug A fix). */
export function getDiseaseByClassIndex(index: number): Disease | undefined {
    return ALL_DISEASES.find(d => d.classIndex === index);
}
/** @deprecated Use getCropFromGatekeeperLabel instead. */
export function getCropFromGatekeeperIndex(index: number): CropType {
    return (['Cocoa', 'Coffee', 'Tomato', 'Banana', 'Maize'] as CropType[])[index] || 'Tomato';
}
