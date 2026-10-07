import { WeatherData, CropMoistureThreshold } from '../types';

/**
 * FAO-56 Penman-Monteith inspired Reference Evapotranspiration (ET0) Calculation
 * Calculates reference evapotranspiration rate (mm/day) from local weather metrics:
 * - Temperature (°C)
 * - Relative Humidity (%)
 * - Wind Speed (km/h)
 * - Day Type / Solar Radiation (Sunny, Cloudy, Rainy)
 * - Soil Temperature (°C)
 */
export interface EtCalculationResult {
  et0: number;             // Reference ET in mm/day
  vpd: number;             // Vapor Pressure Deficit in kPa
  solarRadiation: number;  // Estimated net solar radiation MJ/m²/day
  rating: 'Low' | 'Moderate' | 'High' | 'Extreme';
  description: string;
}

export function calculateReferenceET0(weather: WeatherData): EtCalculationResult {
  const temp = typeof weather.temp === 'number' ? weather.temp : 24;
  const humidity = typeof weather.humidity === 'number' ? Math.max(10, Math.min(100, weather.humidity)) : 60;
  const windSpeedKmH = typeof weather.windSpeed === 'number' ? weather.windSpeed : 12;
  const dayType = (weather.dayType || 'Sunny').toLowerCase();

  // 1. Saturation vapor pressure es (kPa) via Tetens equation
  const es = 0.61078 * Math.exp((17.27 * temp) / (temp + 237.3));

  // 2. Actual vapor pressure ea (kPa)
  const ea = es * (humidity / 100);

  // 3. Vapor Pressure Deficit VPD (kPa)
  const vpd = Math.max(0.05, es - ea);

  // 4. Estimated solar radiation Rs based on cloudiness / dayType (MJ/m²/day)
  let solarRadiation = 20.0;
  if (dayType.includes('rain') || dayType.includes('storm')) {
    solarRadiation = 8.5;
  } else if (dayType.includes('cloud') || dayType.includes('overcast')) {
    solarRadiation = 14.5;
  } else {
    // Sunny / Clear
    solarRadiation = 23.5;
  }

  // 5. Net radiation Rn approximation (MJ/m²/day converted to equivalent evaporation)
  const rnEquivalent = Math.max(1.0, solarRadiation * 0.408 * 0.65);

  // 6. Wind speed at 2m height u2 (m/s)
  const u2 = Math.max(0.5, windSpeedKmH / 3.6);

  // 7. Psychrometric constant gamma (kPa/°C) & slope of vapor curve delta (kPa/°C)
  const delta = (4098 * es) / Math.pow(temp + 237.3, 2);
  const gamma = 0.067;

  // 8. Simplified FAO-56 Penman-Monteith daily equation
  const numerator = (delta * rnEquivalent) + (gamma * (900 / (temp + 273)) * u2 * vpd);
  const denominator = delta + gamma * (1 + 0.34 * u2);
  
  let rawEt0 = numerator / denominator;
  if (isNaN(rawEt0) || rawEt0 <= 0) rawEt0 = 3.8;

  // Clamped to realistic Earth agronomic limits (1.0 mm/day to 9.5 mm/day)
  const et0 = Math.round(Math.min(9.5, Math.max(1.2, rawEt0)) * 10) / 10;

  let rating: 'Low' | 'Moderate' | 'High' | 'Extreme' = 'Moderate';
  let description = '';

  if (et0 < 2.8) {
    rating = 'Low';
    description = 'Low evaporative demand. Soil moisture evaporates slowly due to cool air, cloud cover, or high humidity.';
  } else if (et0 <= 4.5) {
    rating = 'Moderate';
    description = 'Moderate evaporative demand. Typical baseline transpiration conditions for seasonal growth.';
  } else if (et0 <= 6.2) {
    rating = 'High';
    description = 'High evaporative demand. Warm conditions, drying winds, or direct solar irradiance accelerated soil depletion.';
  } else {
    rating = 'Extreme';
    description = 'Severe atmospheric vapor deficit. Extreme transpiration risk requiring protective moisture buffering.';
  }

  return {
    et0,
    vpd: Math.round(vpd * 100) / 100,
    solarRadiation: Math.round(solarRadiation * 10) / 10,
    rating,
    description
  };
}

/**
 * Standard FAO-56 Crop Coefficients (Kc)
 */
export const CROP_KC_FACTORS: Record<string, number> = {
  maize: 1.15,
  corn: 1.15,
  soybean: 1.10,
  legume: 1.10,
  citrus: 0.75,
  avocado: 0.80,
  fruit: 0.75,
  seedling: 1.05,
  nursery: 1.05,
  wheat: 1.12,
  grain: 1.10,
  tomato: 1.15,
  vegetable: 1.15
};

export function getCropCoefficient(cropName: string, category?: string): number {
  const lowerName = cropName.toLowerCase();
  for (const [key, kc] of Object.entries(CROP_KC_FACTORS)) {
    if (lowerName.includes(key)) return kc;
  }
  if (category) {
    const lowerCat = category.toLowerCase();
    for (const [key, kc] of Object.entries(CROP_KC_FACTORS)) {
      if (lowerCat.includes(key)) return kc;
    }
  }
  return 1.10;
}

/**
 * Calculate Crop Evapotranspiration ETc (mm/day) = ET0 * Kc
 */
export function calculateCropETc(et0: number, cropName: string, category?: string): number {
  const kc = getCropCoefficient(cropName, category);
  return Math.round(et0 * kc * 10) / 10;
}

/**
 * Calculate dynamic moisture threshold adjustment offset (%) based on ETc
 * Baseline ETc benchmark is 4.0 mm/day.
 */
export function calculateThresholdAdjustment(
  etc: number,
  sensitivity: 'conservative' | 'balanced' | 'aggressive' = 'balanced'
): {
  criticalOffset: number;
  warningOffset: number;
  targetOffset: number;
  reason: string;
} {
  const benchmarkEtc = 4.0;
  const delta = etc - benchmarkEtc;

  // Sensitivity multiplier
  const multiplier = sensitivity === 'conservative' ? 1.35 : sensitivity === 'aggressive' ? 0.75 : 1.0;

  // Primary offset: scaled by delta ET
  let rawOffset = Math.round(delta * 1.3 * multiplier);

  // Clamped between -3% (cool/rainy days, avoid waterlogging) and +6% (severe heatwave)
  const offset = Math.max(-3, Math.min(6, rawOffset));

  const criticalOffset = offset;
  const warningOffset = offset > 0 ? offset + 1 : offset;
  const targetOffset = Math.max(0, offset);

  let reason = '';
  if (offset > 2) {
    reason = `High ETc (${etc} mm/day): Elevated threshold by +${offset}% to trigger irrigation earlier and prevent afternoon wilt.`;
  } else if (offset < 0) {
    reason = `Low ETc (${etc} mm/day): Relaxed threshold by ${offset}% to prevent waterlogging and conserve water.`;
  } else {
    reason = `Balanced ETc (${etc} mm/day): Operating at optimal baseline soil moisture targets.`;
  }

  return {
    criticalOffset,
    warningOffset,
    targetOffset,
    reason
  };
}

/**
 * Apply Smart Scheduling ET rates to a list of crop thresholds
 */
export function applySmartSchedulingToThresholds(
  thresholds: CropMoistureThreshold[],
  weather: WeatherData,
  sensitivity: 'conservative' | 'balanced' | 'aggressive' = 'balanced'
): {
  updatedThresholds: CropMoistureThreshold[];
  et0: number;
  avgEtc: number;
  summary: string;
} {
  const { et0 } = calculateReferenceET0(weather);
  let totalEtc = 0;

  const updatedThresholds = thresholds.map(crop => {
    // Determine baseline values (save if not already set)
    const baseCrit = crop.baselineCriticalThreshold ?? crop.criticalThreshold;
    const baseWarn = crop.baselineWarningThreshold ?? crop.warningThreshold;
    const baseTarget = crop.baselineTargetMoisture ?? crop.targetMoisture;
    const kc = crop.cropCoefficientKc ?? getCropCoefficient(crop.cropName, crop.category);

    const etc = Math.round(et0 * kc * 10) / 10;
    totalEtc += etc;

    const { criticalOffset, warningOffset, targetOffset } = calculateThresholdAdjustment(etc, sensitivity);

    const newCrit = Math.max(10, Math.min(50, baseCrit + criticalOffset));
    const newWarn = Math.max(newCrit + 3, Math.min(65, baseWarn + warningOffset));
    const newTarget = Math.max(newWarn + 4, Math.min(80, baseTarget + targetOffset));

    return {
      ...crop,
      baselineCriticalThreshold: baseCrit,
      baselineWarningThreshold: baseWarn,
      baselineTargetMoisture: baseTarget,
      cropCoefficientKc: kc,
      criticalThreshold: newCrit,
      warningThreshold: newWarn,
      targetMoisture: newTarget
    };
  });

  const avgEtc = thresholds.length > 0 ? Math.round((totalEtc / thresholds.length) * 10) / 10 : et0;
  const summary = `Today's ET0 is ${et0} mm/day (Avg crop ETc: ${avgEtc} mm/day). Thresholds dynamically tuned based on local weather.`;

  return {
    updatedThresholds,
    et0,
    avgEtc,
    summary
  };
}

/**
 * Restore manual baseline thresholds
 */
export function restoreBaselineThresholds(thresholds: CropMoistureThreshold[]): CropMoistureThreshold[] {
  return thresholds.map(crop => ({
    ...crop,
    criticalThreshold: crop.baselineCriticalThreshold ?? crop.criticalThreshold,
    warningThreshold: crop.baselineWarningThreshold ?? crop.warningThreshold,
    targetMoisture: crop.baselineTargetMoisture ?? crop.targetMoisture
  }));
}
