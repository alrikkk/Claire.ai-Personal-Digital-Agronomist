export interface User {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  farmName?: string;
  location?: string;
  avatar_base64?: string;
  authenticated: boolean;
  show_settings: boolean;
  layout_preferences?: string;
  created_at?: string;
  updated_at?: string;
}

export interface YieldLogItem {
  id: string;
  user_id: string;
  season: string;
  crop: string;
  target: string;
  actual: string;
  status: string;
  profit: string;
  created_at?: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  crop: string;
  location: string;
  created_at: string;
}

export interface WeatherData {
  name: string;
  admin1: string;
  country: string;
  latitude: number;
  longitude: number;
  temp: number;
  humidity: number;
  windSpeed: number;
  soilTemp: number;
  soilMoisture: number;
  dayType: string; // Sunny | Cloudy | Rainy
  isFallback?: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error' | 'warning';
}

export interface StateNode {
  id: string;
  stateName: string;
  stateCode: string;
  agroClimaticZone: string;
  primaryCrops: string[];
  activeSensorsCount: number;
  openModelsCount: number;
  soilType: string;
  averageRainfallMm: number;
  dpgStatus: 'Certified DPG' | 'Federated Node' | 'Under Review';
  climateResilienceScore: number; // 0 - 100
  cooperationPartners: string[]; // stateCodes
  lastSyncTime: string;
}

export interface OpenAgriModel {
  id: string;
  title: string;
  authorState: string;
  category: 'Soil Regeneration' | 'Pest Early Warning' | 'Monsoon Drought Coping' | 'Water Conservation' | 'Crop Phenology';
  description: string;
  targetCrops: string[];
  accuracyR2: number;
  downloadsCount: number;
  license: 'CC-BY-4.0 (Digital Public Good)' | 'ODbL-1.0' | 'Apache-2.0';
  schemaVersion: string;
  openApiEndpoint: string;
  tags: string[];
}

export interface SoilHealthCardData {
  sampleId: string;
  farmerName: string;
  villageState: string;
  soilType: 'Alluvial' | 'Black (Regur)' | 'Red & Yellow' | 'Laterite' | 'Arid / Desert' | 'Coastal Saline';
  nitrogenKgPerHa: number; // Low < 280, Medium 280-560, High > 560
  phosphorusKgPerHa: number; // Low < 10, Medium 10-25, High > 25
  potassiumKgPerHa: number; // Low < 108, Medium 108-280, High > 280
  soilOrganicCarbonPct: number; // Low < 0.5%, Medium 0.5-0.75%, High > 0.75%
  phLevel: number; // Acidic < 6.5, Neutral 6.5-7.5, Alkaline > 7.5
  electricalConductivityDsM: number; // Normal < 1.0, Critical > 2.0
  zincPpm: number;
  ironPpm: number;
  boronPpm: number;
  healthRating: 'Poor' | 'Moderate' | 'Good' | 'Optimal';
}

export interface SatelliteVegetationData {
  fieldCoordinates: { lat: number; lng: number };
  ndviIndex: number; // -1 to 1 (0.2-0.8 healthy canopy)
  ndwiWaterIndex: number; // -1 to 1 (Canopy water content)
  eviIndex: number; // Enhanced Vegetation Index
  surfaceTempCelsius: number;
  biomassCoveragePct: number;
  stressAnomalies: string[];
  spectralZoneClassification: 'Vigorous Growth' | 'Moderate Density' | 'Water Stress Alert' | 'Chlorosis / Nitrogen Deficient';
  lastPassDate: string;
  satelliteConstellation: 'Sentinel-2 Multispectral' | 'Landsat-9 OLI-2';
}

export interface RegenerativeCropPlan {
  id: string;
  cropName: string;
  variety: string;
  classification: 'Millet (Shree Anna)' | 'Nitrogen-Fixing Pulse' | 'Cover Crop / Bio-mulch' | 'Drought-Tolerant Oilseed' | 'Agro-Forestry Component';
  waterRequirementMm: number;
  growthDurationDays: number;
  soilCarbonSequestrationKgPerHa: number;
  recommendedIntercrop: string;
  marketDemandStatus: 'High' | 'Rising' | 'Steady';
  yieldExpectancy: string;
  whyRecommended: string;
}

export type ApiProviderType = 
  | 'gemini' 
  | 'vertex_ai'
  | 'groq' 
  | 'openai' 
  | 'anthropic' 
  | 'deepseek' 
  | 'mistral' 
  | 'openrouter' 
  | 'custom';

export interface ApiProviderConfig {
  provider: ApiProviderType;
  apiKey: string;
  baseUrl?: string;
  model?: string;
  isActive: boolean;
  lastTestedAt?: string;
  testStatus?: 'success' | 'failed' | 'untested';
  testMessage?: string;
}

// -------------------------------------------------------------
// VERTEX AI & GOOGLE CLOUD ECOSYSTEM TYPES (7 TRACKS)
// -------------------------------------------------------------

export interface VertexPredictiveResult {
  predictionId: string;
  crop: string;
  soilZone: string;
  predictedYieldTonsPerHa: number;
  baselineYieldTonsPerHa: number;
  variancePct: number;
  confidenceScore: number;
  harvestWindowEstimate: string;
  pestOutbreakProbability: {
    pestName: string;
    riskLevel: 'Critical' | 'Elevated' | 'Low';
    probabilityPct: number;
    peakWindowDays: string;
  }[];
  shapKeyDrivers: {
    factor: string;
    impact: 'Positive' | 'Negative' | 'Neutral';
    weightPct: number;
  }[];
  recommendedOptimalInputs: {
    nitrogenKg: number;
    phosphorusKg: number;
    potassiumKg: number;
    irrigationSchedule: string;
  };
}

export interface VertexMultimodalVisionScan {
  scanId: string;
  timestamp: string;
  imageSource: 'Citizen Photo' | 'Multispectral Drone' | 'Satellite Sentinel-2' | 'Thermal Camera';
  diagnosedIssue: string;
  confidencePct: number;
  pathogenOrStressType: 'Fungal Pathogen' | 'Insect Damage' | 'Nitrogen Deficiency' | 'Canopy Water Deficit' | 'Spray Drift / Chemical Burn' | 'Healthy Crop';
  spatialBoundingBoxes?: { label: string; x: number; y: number; width: number; height: number }[];
  multispectralIndices?: {
    ndvi: number;
    ndwi: number;
    canopyTempCelsius: number;
    chlorophyllIndex: number;
  };
  remediationPlan: string[];
}

export interface VertexVoiceTranslationResult {
  sourceText: string;
  sourceLang: string;
  targetLang: string;
  targetLangNative: string;
  translatedText: string;
  phoneticSpelling?: string;
  audioVoiceType: 'Wavenet-Neural2' | 'Studio-HD' | 'Dialogflow-CX';
}

export interface VertexGeospatialLayer {
  layerId: string;
  name: string;
  sourceEngine: 'Google Earth Engine' | 'Google Maps Platform' | 'Sentinel-2 OLI';
  resolutionMeters: number;
  coverageRegion: string;
  currentAnomalyCount: number;
  lastUpdated: string;
  metrics: {
    soilMoistureAnomalyPct: number;
    droughtSeverityIndex: 'None' | 'Mild' | 'Moderate' | 'Severe';
    surfaceWaterRetentionPct: number;
    vegetationHealthIndex: number;
  };
}

export interface VertexBigQueryQuerySample {
  id: string;
  title: string;
  datasetName: string;
  recordsScanned: string;
  executionTimeMs: number;
  sqlQuery: string;
  results: Record<string, any>[];
  insightSummary: string;
}

export interface VertexPublicDataRecord {
  source: 'data.gov.in (Agmarknet)' | 'FAO Global Agri' | 'ISRO / Bhuvan Satellite' | 'IMD Meteorological';
  title: string;
  category: string;
  timestamp: string;
  dataPoints: { label: string; value: string | number; change?: string; status?: string }[];
  officialSourceUrl: string;
}

export function showToast(message: string, type: 'success' | 'info' | 'error' | 'warning' = 'success') {
  window.dispatchEvent(new CustomEvent('claire-toast', { detail: { message, type } }));
}

