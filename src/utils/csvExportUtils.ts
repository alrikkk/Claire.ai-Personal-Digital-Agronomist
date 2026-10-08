import { User, Project, SoilRecord, ExportDataOptions } from '../types';

export interface YieldRecordItem {
  id?: string;
  season: string;
  crop: string;
  target: string;
  actual: string;
  status: string;
  profit: string;
  created_at?: string;
}

/**
 * Escapes a single cell according to RFC 4180 rules.
 */
export const escapeCsvCell = (val: any, delimiter: ',' | ';' = ','): string => {
  if (val === undefined || val === null) return '""';
  const str = String(val);
  // If the cell contains quotes, delimiter, or newline, wrap in quotes and escape internal quotes
  if (str.includes('"') || str.includes(delimiter) || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
};

/**
 * Parses numerical yield from formatted string e.g. "4.8 tons/ha" -> 4.8
 */
const parseNum = (str: string): number => {
  const match = str.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
};

/**
 * Parses numerical profit from formatted string e.g. "+$1,120" -> 1120, "-$420" -> -420
 */
const parseProfitNum = (str: string): number => {
  const isNeg = str.includes('-');
  const clean = str.replace(/[^\d.]/g, '');
  const num = clean ? parseFloat(clean) : 0;
  return isNeg ? -num : num;
};

/**
 * Generates formatted CSV report based on provided options.
 */
export const generateYieldAndSoilCsv = (
  user: User,
  yieldLogs: YieldRecordItem[],
  soilRecords: SoilRecord[],
  projects: Project[] = [],
  options: ExportDataOptions
): string => {
  const { format, delimiter, includeMetadata } = options;
  const lines: string[] = [];
  const now = new Date();
  const timestampStr = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

  // 1. Executive Metadata Block
  if (includeMetadata) {
    lines.push([escapeCsvCell('=== CLAIRE.AI AGRICULTURAL REPORT: YIELD & SOIL TELEMETRY ===', delimiter)].join(delimiter));
    lines.push([escapeCsvCell('Generated Date', delimiter), escapeCsvCell(timestampStr, delimiter)].join(delimiter));
    lines.push([escapeCsvCell('Farmer Name', delimiter), escapeCsvCell(user.fullName || 'Agricultural Operator', delimiter)].join(delimiter));
    lines.push([escapeCsvCell('Farm Enterprise', delimiter), escapeCsvCell(user.farmName || 'Primary Field Station', delimiter)].join(delimiter));
    lines.push([escapeCsvCell('Global Location', delimiter), escapeCsvCell(user.location || 'Regional Zone', delimiter)].join(delimiter));
    lines.push([escapeCsvCell('Registered Email', delimiter), escapeCsvCell(user.email || 'N/A', delimiter)].join(delimiter));
    lines.push([escapeCsvCell('Contact Phone', delimiter), escapeCsvCell(user.phone || 'N/A', delimiter)].join(delimiter));
    lines.push([escapeCsvCell('Historical Yield Logs Count', delimiter), escapeCsvCell(yieldLogs.length, delimiter)].join(delimiter));
    lines.push([escapeCsvCell('Soil Test Records Count', delimiter), escapeCsvCell(soilRecords.length, delimiter)].join(delimiter));
    lines.push([escapeCsvCell('Active Field Projects Count', delimiter), escapeCsvCell(projects.length, delimiter)].join(delimiter));
    lines.push([escapeCsvCell('Compliance Standard', delimiter), escapeCsvCell('RFC 4180 / UTF-8 with BOM', delimiter)].join(delimiter));
    lines.push('');
  }

  // 2. Format: Yield Only
  if (format === 'yield_only') {
    lines.push([
      escapeCsvCell('Log ID', delimiter),
      escapeCsvCell('Season Period', delimiter),
      escapeCsvCell('Cultivar Crop', delimiter),
      escapeCsvCell('Expected Target (tons/ha)', delimiter),
      escapeCsvCell('Actual Yield (tons/ha)', delimiter),
      escapeCsvCell('Yield Variance (tons/ha)', delimiter),
      escapeCsvCell('Performance Status', delimiter),
      escapeCsvCell('Net Profit Margin', delimiter),
      escapeCsvCell('Record Timestamp', delimiter)
    ].join(delimiter));

    yieldLogs.forEach((l, idx) => {
      const targetVal = parseNum(l.target);
      const actualVal = parseNum(l.actual);
      const variance = (actualVal - targetVal).toFixed(2);
      const varianceStr = (actualVal >= targetVal ? '+' : '') + variance + ' tons/ha';

      lines.push([
        escapeCsvCell(l.id || `LOG-${idx + 1}`, delimiter),
        escapeCsvCell(l.season, delimiter),
        escapeCsvCell(l.crop, delimiter),
        escapeCsvCell(targetVal.toFixed(1), delimiter),
        escapeCsvCell(actualVal.toFixed(1), delimiter),
        escapeCsvCell(varianceStr, delimiter),
        escapeCsvCell(l.status, delimiter),
        escapeCsvCell(l.profit, delimiter),
        escapeCsvCell(l.created_at || timestampStr, delimiter)
      ].join(delimiter));
    });

    return lines.join('\r\n');
  }

  // 3. Format: Soil Only
  if (format === 'soil_only') {
    lines.push([
      escapeCsvCell('Sample ID', delimiter),
      escapeCsvCell('Field / Plot Name', delimiter),
      escapeCsvCell('Location', delimiter),
      escapeCsvCell('Sampling Date', delimiter),
      escapeCsvCell('Associated Crop', delimiter),
      escapeCsvCell('Soil Texture / Classification', delimiter),
      escapeCsvCell('Nitrogen N (kg/ha)', delimiter),
      escapeCsvCell('Phosphorus P (kg/ha)', delimiter),
      escapeCsvCell('Potassium K (kg/ha)', delimiter),
      escapeCsvCell('Soil Organic Carbon SOC (%)', delimiter),
      escapeCsvCell('Soil pH Level', delimiter),
      escapeCsvCell('Electrical Conductivity EC (dS/m)', delimiter),
      escapeCsvCell('Topsoil Moisture (% VWC)', delimiter),
      escapeCsvCell('Soil Temperature (°C)', delimiter),
      escapeCsvCell('Overall Health Grade', delimiter),
      escapeCsvCell('Agronomic Notes & Remediation Directives', delimiter)
    ].join(delimiter));

    soilRecords.forEach((s, idx) => {
      lines.push([
        escapeCsvCell(s.id || `SOIL-${idx + 1}`, delimiter),
        escapeCsvCell(s.fieldName, delimiter),
        escapeCsvCell(s.location, delimiter),
        escapeCsvCell(s.sampleDate, delimiter),
        escapeCsvCell(s.crop || 'General Rotational', delimiter),
        escapeCsvCell(s.soilType, delimiter),
        escapeCsvCell(s.nitrogenKgHa, delimiter),
        escapeCsvCell(s.phosphorusKgHa, delimiter),
        escapeCsvCell(s.potassiumKgHa, delimiter),
        escapeCsvCell(s.organicCarbonPct.toFixed(2), delimiter),
        escapeCsvCell(s.phLevel.toFixed(1), delimiter),
        escapeCsvCell(s.ecDsM.toFixed(2), delimiter),
        escapeCsvCell(s.moisturePct.toFixed(1), delimiter),
        escapeCsvCell(s.soilTempC.toFixed(1), delimiter),
        escapeCsvCell(s.healthRating, delimiter),
        escapeCsvCell(s.notes || 'Routine seasonal verification', delimiter)
      ].join(delimiter));
    });

    return lines.join('\r\n');
  }

  // 4. Format: Combined Matrix (Correlated flat row format)
  if (format === 'combined_matrix') {
    lines.push([
      escapeCsvCell('Record Index', delimiter),
      escapeCsvCell('Season / Period', delimiter),
      escapeCsvCell('Field / Plot Location', delimiter),
      escapeCsvCell('Cultivar Crop', delimiter),
      escapeCsvCell('Target Yield (tons/ha)', delimiter),
      escapeCsvCell('Actual Yield (tons/ha)', delimiter),
      escapeCsvCell('Yield Variance (tons/ha)', delimiter),
      escapeCsvCell('Crop Status', delimiter),
      escapeCsvCell('Net Profit', delimiter),
      escapeCsvCell('Soil Texture Type', delimiter),
      escapeCsvCell('Soil Organic Carbon (%)', delimiter),
      escapeCsvCell('Soil pH', delimiter),
      escapeCsvCell('Topsoil Moisture (% VWC)', delimiter),
      escapeCsvCell('Available Nitrogen N (kg/ha)', delimiter),
      escapeCsvCell('Available Phosphorus P (kg/ha)', delimiter),
      escapeCsvCell('Available Potassium K (kg/ha)', delimiter),
      escapeCsvCell('Soil Health Grade', delimiter)
    ].join(delimiter));

    // Combine yield log with closest corresponding soil record
    yieldLogs.forEach((yl, idx) => {
      const targetVal = parseNum(yl.target);
      const actualVal = parseNum(yl.actual);
      const variance = (actualVal - targetVal).toFixed(2);
      const matchingSoil = soilRecords[idx % Math.max(1, soilRecords.length)] || {
        fieldName: user.location || 'Plot A',
        soilType: 'Alluvial Loam',
        organicCarbonPct: 0.65,
        phLevel: 7.0,
        moisturePct: 28.0,
        nitrogenKgHa: 260,
        phosphorusKgHa: 18,
        potassiumKgHa: 210,
        healthRating: 'Good'
      };

      lines.push([
        escapeCsvCell(idx + 1, delimiter),
        escapeCsvCell(yl.season, delimiter),
        escapeCsvCell(matchingSoil.fieldName || user.location || 'Field Parcel', delimiter),
        escapeCsvCell(yl.crop, delimiter),
        escapeCsvCell(targetVal.toFixed(1), delimiter),
        escapeCsvCell(actualVal.toFixed(1), delimiter),
        escapeCsvCell((actualVal >= targetVal ? '+' : '') + variance, delimiter),
        escapeCsvCell(yl.status, delimiter),
        escapeCsvCell(yl.profit, delimiter),
        escapeCsvCell(matchingSoil.soilType, delimiter),
        escapeCsvCell(matchingSoil.organicCarbonPct.toFixed(2), delimiter),
        escapeCsvCell(matchingSoil.phLevel.toFixed(1), delimiter),
        escapeCsvCell(matchingSoil.moisturePct.toFixed(1), delimiter),
        escapeCsvCell(matchingSoil.nitrogenKgHa, delimiter),
        escapeCsvCell(matchingSoil.phosphorusKgHa, delimiter),
        escapeCsvCell(matchingSoil.potassiumKgHa, delimiter),
        escapeCsvCell(matchingSoil.healthRating, delimiter)
      ].join(delimiter));
    });

    return lines.join('\r\n');
  }

  // 5. Format: Combined Sections (Default: Complete Multi-Section Agronomy Dossier)
  // Section 1: Yield Performance
  lines.push([escapeCsvCell('--- SECTION 1: HISTORICAL CROP YIELD PERFORMANCE RECORDS ---', delimiter)].join(delimiter));
  lines.push([
    escapeCsvCell('Log ID', delimiter),
    escapeCsvCell('Season Period', delimiter),
    escapeCsvCell('Cultivar Crop', delimiter),
    escapeCsvCell('Target Expected (tons/ha)', delimiter),
    escapeCsvCell('Actual Harvested (tons/ha)', delimiter),
    escapeCsvCell('Variance (tons/ha)', delimiter),
    escapeCsvCell('Performance Status', delimiter),
    escapeCsvCell('Net Economic Return', delimiter),
    escapeCsvCell('Record Timestamp', delimiter)
  ].join(delimiter));

  yieldLogs.forEach((l, idx) => {
    const targetVal = parseNum(l.target);
    const actualVal = parseNum(l.actual);
    const variance = (actualVal - targetVal).toFixed(2);
    const varianceStr = (actualVal >= targetVal ? '+' : '') + variance + ' tons/ha';

    lines.push([
      escapeCsvCell(l.id || `LOG-${idx + 1}`, delimiter),
      escapeCsvCell(l.season, delimiter),
      escapeCsvCell(l.crop, delimiter),
      escapeCsvCell(targetVal.toFixed(1), delimiter),
      escapeCsvCell(actualVal.toFixed(1), delimiter),
      escapeCsvCell(varianceStr, delimiter),
      escapeCsvCell(l.status, delimiter),
      escapeCsvCell(l.profit, delimiter),
      escapeCsvCell(l.created_at || timestampStr, delimiter)
    ].join(delimiter));
  });

  lines.push('');

  // Section 2: Soil Records
  lines.push([escapeCsvCell('--- SECTION 2: SOIL HEALTH, CHEMICAL & MOISTURE RECORDS ---', delimiter)].join(delimiter));
  lines.push([
    escapeCsvCell('Sample ID', delimiter),
    escapeCsvCell('Field / Plot Name', delimiter),
    escapeCsvCell('Geographic Location', delimiter),
    escapeCsvCell('Sampling Date', delimiter),
    escapeCsvCell('Monitored Crop', delimiter),
    escapeCsvCell('Soil Texture / Matrix', delimiter),
    escapeCsvCell('Nitrogen N (kg/ha)', delimiter),
    escapeCsvCell('Phosphorus P (kg/ha)', delimiter),
    escapeCsvCell('Potassium K (kg/ha)', delimiter),
    escapeCsvCell('Soil Organic Carbon SOC (%)', delimiter),
    escapeCsvCell('Soil pH', delimiter),
    escapeCsvCell('Electrical Conductivity EC (dS/m)', delimiter),
    escapeCsvCell('Topsoil Moisture (% VWC)', delimiter),
    escapeCsvCell('Soil Temp (°C)', delimiter),
    escapeCsvCell('Health Rating', delimiter),
    escapeCsvCell('Agronomic Field Observations', delimiter)
  ].join(delimiter));

  soilRecords.forEach((s, idx) => {
    lines.push([
      escapeCsvCell(s.id || `SOIL-${idx + 1}`, delimiter),
      escapeCsvCell(s.fieldName, delimiter),
      escapeCsvCell(s.location, delimiter),
      escapeCsvCell(s.sampleDate, delimiter),
      escapeCsvCell(s.crop || 'Rotational Crop', delimiter),
      escapeCsvCell(s.soilType, delimiter),
      escapeCsvCell(s.nitrogenKgHa, delimiter),
      escapeCsvCell(s.phosphorusKgHa, delimiter),
      escapeCsvCell(s.potassiumKgHa, delimiter),
      escapeCsvCell(s.organicCarbonPct.toFixed(2), delimiter),
      escapeCsvCell(s.phLevel.toFixed(1), delimiter),
      escapeCsvCell(s.ecDsM.toFixed(2), delimiter),
      escapeCsvCell(s.moisturePct.toFixed(1), delimiter),
      escapeCsvCell(s.soilTempC.toFixed(1), delimiter),
      escapeCsvCell(s.healthRating, delimiter),
      escapeCsvCell(s.notes || 'Optimal profile balance', delimiter)
    ].join(delimiter));
  });

  lines.push('');

  // Section 3: Summary KPIs and Agronomic Correlation
  const totalActual = yieldLogs.reduce((acc, cur) => acc + parseNum(cur.actual), 0);
  const avgYield = yieldLogs.length > 0 ? (totalActual / yieldLogs.length).toFixed(2) : '0.00';
  const totalProfit = yieldLogs.reduce((acc, cur) => acc + parseProfitNum(cur.profit), 0);
  const avgSoc = soilRecords.length > 0 
    ? (soilRecords.reduce((acc, cur) => acc + cur.organicCarbonPct, 0) / soilRecords.length).toFixed(2)
    : '0.64';
  const avgPh = soilRecords.length > 0
    ? (soilRecords.reduce((acc, cur) => acc + cur.phLevel, 0) / soilRecords.length).toFixed(2)
    : '7.0';
  const avgMoisture = soilRecords.length > 0
    ? (soilRecords.reduce((acc, cur) => acc + cur.moisturePct, 0) / soilRecords.length).toFixed(1)
    : '28.1';

  lines.push([escapeCsvCell('--- SECTION 3: AGRONOMIC BENCHMARK & SUMMARY METRICS ---', delimiter)].join(delimiter));
  lines.push([escapeCsvCell('Benchmark Metric', delimiter), escapeCsvCell('Observed Quantitative Value', delimiter)].join(delimiter));
  lines.push([escapeCsvCell('Historical Average Crop Yield', delimiter), escapeCsvCell(`${avgYield} tons/ha`, delimiter)].join(delimiter));
  lines.push([escapeCsvCell('Cumulative Net Profit', delimiter), escapeCsvCell(`$${totalProfit >= 0 ? '+' : ''}${totalProfit.toLocaleString()}`, delimiter)].join(delimiter));
  lines.push([escapeCsvCell('Mean Soil Organic Carbon (SOC)', delimiter), escapeCsvCell(`${avgSoc}%`, delimiter)].join(delimiter));
  lines.push([escapeCsvCell('Mean Topsoil Reaction (pH)', delimiter), escapeCsvCell(`${avgPh} pH`, delimiter)].join(delimiter));
  lines.push([escapeCsvCell('Average Topsoil Volumetric Moisture', delimiter), escapeCsvCell(`${avgMoisture}% VWC`, delimiter)].join(delimiter));
  lines.push([escapeCsvCell('Yield Records Analyzed', delimiter), escapeCsvCell(`${yieldLogs.length} Harvest Cycles`, delimiter)].join(delimiter));
  lines.push([escapeCsvCell('Soil Samples Analyzed', delimiter), escapeCsvCell(`${soilRecords.length} Lab Test Points`, delimiter)].join(delimiter));

  return lines.join('\r\n');
};

/**
 * Initiates browser download of CSV string with UTF-8 BOM.
 */
export const downloadCsvBlob = (csvString: string, filename: string): void => {
  // Prepend UTF-8 BOM so spreadsheet apps (Excel, Numbers, Sheets) parse UTF-8 seamlessly
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
