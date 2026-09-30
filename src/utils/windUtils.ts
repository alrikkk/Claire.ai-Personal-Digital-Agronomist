export interface WindInfo {
  directionDegrees: number;
  compassPoint: string;
  compassName: string;
  oppositePoint: string;
  speedKmH: number;
  gustsKmH: number;
  beaufortScale: string;
  beaufortForce: number;
  spraySafety: 'ideal' | 'caution' | 'unsafe';
  sprayStatusLabel: string;
  sprayAdvisory: string;
}

const COMPASS_POINTS = [
  { abbr: 'N', name: 'North', min: 348.75, max: 11.25 },
  { abbr: 'NNE', name: 'North-Northeast', min: 11.25, max: 33.75 },
  { abbr: 'NE', name: 'Northeast', min: 33.75, max: 56.25 },
  { abbr: 'ENE', name: 'East-Northeast', min: 56.25, max: 78.75 },
  { abbr: 'E', name: 'East', min: 78.75, max: 101.25 },
  { abbr: 'ESE', name: 'East-Southeast', min: 101.25, max: 123.75 },
  { abbr: 'SE', name: 'Southeast', min: 123.75, max: 146.25 },
  { abbr: 'SSE', name: 'South-Southeast', min: 146.25, max: 168.75 },
  { abbr: 'S', name: 'South', min: 168.75, max: 191.25 },
  { abbr: 'SSW', name: 'South-Southwest', min: 191.25, max: 213.75 },
  { abbr: 'SW', name: 'Southwest', min: 213.75, max: 236.25 },
  { abbr: 'WSW', name: 'West-Southwest', min: 236.25, max: 258.75 },
  { abbr: 'W', name: 'West', min: 258.75, max: 281.25 },
  { abbr: 'WNW', name: 'West-Northwest', min: 281.25, max: 303.75 },
  { abbr: 'NW', name: 'Northwest', min: 303.75, max: 326.25 },
  { abbr: 'NNW', name: 'North-Northwest', min: 326.25, max: 348.75 },
];

export function degreesToCompassPoint(deg: number): { abbr: string; name: string } {
  const normalized = ((deg % 360) + 360) % 360;
  for (const p of COMPASS_POINTS) {
    if (p.abbr === 'N') {
      if (normalized >= 348.75 || normalized < 11.25) {
        return { abbr: p.abbr, name: p.name };
      }
    } else if (normalized >= p.min && normalized < p.max) {
      return { abbr: p.abbr, name: p.name };
    }
  }
  return { abbr: 'N', name: 'North' };
}

export function getOppositeDirection(deg: number): { deg: number; abbr: string; name: string } {
  const oppositeDeg = ((deg + 180) % 360 + 360) % 360;
  const compass = degreesToCompassPoint(oppositeDeg);
  return { deg: oppositeDeg, ...compass };
}

export function getBeaufortClassification(speedKmH: number): { scale: string; force: number } {
  if (speedKmH < 2) return { scale: 'Calm', force: 0 };
  if (speedKmH <= 5) return { scale: 'Light Air', force: 1 };
  if (speedKmH <= 11) return { scale: 'Light Breeze', force: 2 };
  if (speedKmH <= 19) return { scale: 'Gentle Breeze', force: 3 };
  if (speedKmH <= 28) return { scale: 'Moderate Breeze', force: 4 };
  if (speedKmH <= 38) return { scale: 'Fresh Breeze', force: 5 };
  if (speedKmH <= 49) return { scale: 'Strong Breeze', force: 6 };
  if (speedKmH <= 61) return { scale: 'High Wind / Near Gale', force: 7 };
  return { scale: 'Gale / Severe Wind', force: 8 };
}

export function getSpraySafetyAdvisory(speedKmH: number, gustsKmH?: number): {
  safety: 'ideal' | 'caution' | 'unsafe';
  statusLabel: string;
  advisory: string;
} {
  const effectiveSpeed = Math.max(speedKmH, (gustsKmH ?? speedKmH) * 0.85);

  if (speedKmH < 3) {
    return {
      safety: 'caution',
      statusLabel: 'Inversion Hazard',
      advisory: 'Wind is dead calm (< 3 km/h). Temperature inversion risk is elevated — fine aerosol droplets may hang suspended in air without settling onto crop canopy.',
    };
  }

  if (effectiveSpeed <= 14) {
    return {
      safety: 'ideal',
      statusLabel: 'Ideal Spray Window',
      advisory: 'Steady laminar airflow (3–14 km/h) creates optimal canopy penetration with minimal off-target chemical drift.',
    };
  }

  if (effectiveSpeed <= 22) {
    return {
      safety: 'caution',
      statusLabel: 'Moderate Drift Caution',
      advisory: 'Wind velocity requires coarse air-induction nozzles, reduced boom height, and downwind sensitive crop buffers.',
    };
  }

  return {
    safety: 'unsafe',
    statusLabel: 'Unsafe Drift Risk',
    advisory: 'Gusts and velocities exceed 22 km/h. High risk of off-target environmental drift and volatilization. Foliar spraying strictly suspended.',
  };
}

export function parseWindData(
  windSpeed: number = 8.2,
  windDirection?: number,
  windGusts?: number,
  cityName: string = ''
): WindInfo {
  // Deterministic fallback if direction is undefined
  let dirDeg = windDirection;
  if (dirDeg === undefined || isNaN(dirDeg)) {
    // Generate deterministic angle based on city name or default to 65
    let hash = 0;
    for (let i = 0; i < (cityName || 'farm').length; i++) {
      hash = (cityName.charCodeAt(i) + ((hash << 5) - hash)) % 360;
    }
    dirDeg = Math.abs(hash) % 360;
  }

  dirDeg = ((Math.round(dirDeg) % 360) + 360) % 360;
  const compass = degreesToCompassPoint(dirDeg);
  const opposite = getOppositeDirection(dirDeg);
  const speed = Math.max(0, parseFloat(windSpeed.toFixed(1)));
  const gusts = windGusts !== undefined ? parseFloat(windGusts.toFixed(1)) : parseFloat((speed * 1.35).toFixed(1));
  const beaufort = getBeaufortClassification(speed);
  const spray = getSpraySafetyAdvisory(speed, gusts);

  return {
    directionDegrees: dirDeg,
    compassPoint: compass.abbr,
    compassName: compass.name,
    oppositePoint: opposite.abbr,
    speedKmH: speed,
    gustsKmH: gusts,
    beaufortScale: beaufort.scale,
    beaufortForce: beaufort.force,
    spraySafety: spray.safety,
    sprayStatusLabel: spray.statusLabel,
    sprayAdvisory: spray.advisory,
  };
}
