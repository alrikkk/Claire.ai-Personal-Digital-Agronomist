import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import {
  Layers,
  Sparkles,
  TrendingUp,
  Info,
  Calendar,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Maximize2,
  Download,
  Filter,
  Microscope,
  Leaf,
  Droplets,
  Flame,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { showToast } from '../types';

export interface QuadrantDefinition {
  id: string;
  code: string;
  name: string;
  row: number; // 0 to 2
  col: number; // 0 to 2 or 3
  soilTexture: string;
  drainageClass: string;
  elevationMeters: number;
}

export interface QuadrantMeasurement {
  quadrantId: string;
  seasonId: string;
  seasonName: string;
  year: number;
  sqi: number; // 0 to 100 (Soil Quality Index)
  soc: number; // Soil Organic Carbon %
  npkScore: number; // Available NPK Fertility (0 to 100)
  ph: number; // 4.5 to 8.5
  microbialScore: number; // 0 to 100
  moistureRetentionPct: number; // % VWC
  amendmentApplied: string;
  primaryCrop: string;
  statusGrade: 'Grade I' | 'Grade II' | 'Grade III' | 'Grade IV';
}

const FIELD_QUADRANTS: QuadrantDefinition[] = [
  { id: 'q1_nw', code: 'NW-1', name: 'North-West Ridge', row: 0, col: 0, soilTexture: 'Stony Loam', drainageClass: 'Excessive', elevationMeters: 1680 },
  { id: 'q2_nc', code: 'NC-2', name: 'North-Central Terrace', row: 0, col: 1, soilTexture: 'Deep Alluvial Loam', drainageClass: 'Well-Drained', elevationMeters: 1665 },
  { id: 'q3_ne', code: 'NE-3', name: 'North-East Plateau', row: 0, col: 2, soilTexture: 'Sandy Clay Loam', drainageClass: 'Well-Drained', elevationMeters: 1672 },
  { id: 'q4_cw', code: 'CW-4', name: 'Central-West Slope', row: 1, col: 0, soilTexture: 'Clay Loam', drainageClass: 'Moderate', elevationMeters: 1655 },
  { id: 'q5_cc', code: 'CC-5', name: 'Center Field Core', row: 1, col: 1, soilTexture: 'Black Regur Soil', drainageClass: 'Optimal', elevationMeters: 1650 },
  { id: 'q6_ce', code: 'CE-6', name: 'Central-East Terrace', row: 1, col: 2, soilTexture: 'Red Alfisol Loam', drainageClass: 'Moderate', elevationMeters: 1658 },
  { id: 'q7_sw', code: 'SW-7', name: 'South-West Terrace', row: 2, col: 0, soilTexture: 'Silt Loam', drainageClass: 'Moderate', elevationMeters: 1642 },
  { id: 'q8_sc', code: 'SC-8', name: 'South-Central Basin', row: 2, col: 1, soilTexture: 'Heavy Black Clay', drainageClass: 'Slow Drainage', elevationMeters: 1635 },
  { id: 'q9_se', code: 'SE-9', name: 'South-East Lowland', row: 2, col: 2, soilTexture: 'Alluvial Heavy Silt', drainageClass: 'Waterlogged Prone', elevationMeters: 1630 },
];

const HISTORICAL_SEASONS = [
  { id: 's2023_spring', label: '2023 Spring', period: 'Pre-Regenerative Baseline' },
  { id: 's2023_autumn', label: '2023 Autumn', period: 'Monoculture Rotation' },
  { id: 's2024_spring', label: '2024 Spring', period: 'Cover Crop Introduction' },
  { id: 's2024_autumn', label: '2024 Autumn', period: 'Bio-fertilizer Inoculation' },
  { id: 's2025_spring', label: '2025 Spring', period: 'Minimum-Till & Biochar' },
  { id: 's2025_autumn', label: '2025 Autumn', period: 'Legume Intercropping' },
  { id: 's2026_present', label: '2026 Present', period: 'Active Telemetry Cycle' },
];

// Generates realistic historical quadrant distribution dataset
function generateHistoricalQuadrantData(
  activeSoc: number = 0.54,
  activePh: number = 7.2,
  activeNitrogen: number = 240
): QuadrantMeasurement[] {
  const measurements: QuadrantMeasurement[] = [];

  // Base fertility profiles for each quadrant (some naturally richer like NC-2, some harder like NW-1 or SE-9)
  const quadrantModifiers: Record<string, { sqiBase: number; socBase: number; phBase: number }> = {
    q1_nw: { sqiBase: 48, socBase: 0.38, phBase: 6.2 },
    q2_nc: { sqiBase: 64, socBase: 0.52, phBase: 7.0 },
    q3_ne: { sqiBase: 58, socBase: 0.46, phBase: 6.8 },
    q4_cw: { sqiBase: 52, socBase: 0.42, phBase: 6.5 },
    q5_cc: { sqiBase: 62, socBase: 0.50, phBase: 7.1 },
    q6_ce: { sqiBase: 55, socBase: 0.44, phBase: 6.7 },
    q7_sw: { sqiBase: 59, socBase: 0.48, phBase: 6.9 },
    q8_sc: { sqiBase: 50, socBase: 0.41, phBase: 7.8 },
    q9_se: { sqiBase: 44, socBase: 0.35, phBase: 8.1 },
  };

  HISTORICAL_SEASONS.forEach((season, sIdx) => {
    // Regenerative progression gains over seasons (0 to 6)
    const seasonalProgressFactor = sIdx * 4.8; // SQI grows ~25-30 points over 3 years
    const socGains = sIdx * 0.07; // SOC increases ~0.4%

    FIELD_QUADRANTS.forEach((quad) => {
      const mod = quadrantModifiers[quad.id] || { sqiBase: 55, socBase: 0.45, phBase: 7.0 };

      // Micro variation for realism
      const seedNoise = Math.sin(quad.row * 13 + quad.col * 7 + sIdx * 3) * 2.5;

      let sqi = Math.min(96, Math.max(32, Math.round(mod.sqiBase + seasonalProgressFactor + seedNoise)));
      let soc = parseFloat(Math.min(1.25, Math.max(0.28, mod.socBase + socGains + seedNoise * 0.01)).toFixed(2));
      let npk = Math.min(98, Math.max(25, Math.round(sqi * 0.95 + seedNoise * 1.5)));
      let ph = parseFloat((mod.phBase + (7.0 - mod.phBase) * (sIdx / 8) + seedNoise * 0.05).toFixed(1));

      // In the latest season ('s2026_present'), blend with user's interactive Soil Health Card sliders!
      if (season.id === 's2026_present') {
        const userSqiBoost = Math.round((activeSoc / 0.54) * 5 + (activeNitrogen / 280) * 8 + (Math.abs(7.0 - activePh) < 0.5 ? 5 : -5));
        sqi = Math.min(98, Math.max(40, sqi + userSqiBoost));
        soc = parseFloat((activeSoc + (mod.socBase - 0.5) * 0.2).toFixed(2));
        ph = activePh;
        npk = Math.min(98, Math.max(35, Math.round((activeNitrogen / 400) * 85 + seedNoise)));
      }

      let statusGrade: 'Grade I' | 'Grade II' | 'Grade III' | 'Grade IV' = 'Grade II';
      if (sqi >= 80) statusGrade = 'Grade I';
      else if (sqi >= 65) statusGrade = 'Grade II';
      else if (sqi >= 50) statusGrade = 'Grade III';
      else statusGrade = 'Grade IV';

      measurements.push({
        quadrantId: quad.id,
        seasonId: season.id,
        seasonName: season.label,
        year: parseInt(season.label.split(' ')[0], 10),
        sqi,
        soc,
        npkScore: npk,
        ph,
        microbialScore: Math.min(95, Math.max(30, Math.round(sqi * 0.92 + (soc * 20)))),
        moistureRetentionPct: Math.round(22 + (soc * 18) + (quad.row === 2 ? 6 : 0)),
        amendmentApplied: sIdx >= 4 ? 'Jeevamrit + Biochar (5 t/ha)' : sIdx >= 2 ? 'Green Manure Dhaincha' : 'Chemical NPK 10:26:26',
        primaryCrop: sIdx % 2 === 0 ? 'Finger Millet & Pulses' : 'Soybean & Sorghum',
        statusGrade
      });
    });
  });

  return measurements;
}

interface SoilQualityHeatmapVisualizationProps {
  nitrogen?: number;
  soc?: number;
  ph?: number;
  activeLocation?: string;
  className?: string;
}

export default function SoilQualityHeatmapVisualization({
  nitrogen = 240,
  soc = 0.54,
  ph = 7.2,
  activeLocation = 'Field Parcel A',
  className = ''
}: SoilQualityHeatmapVisualizationProps) {
  // Heatmap Display Modes
  const [viewMode, setViewMode] = useState<'matrix' | 'spatial'>('spatial');
  const [selectedMetric, setSelectedMetric] = useState<'sqi' | 'soc' | 'npkScore' | 'ph' | 'microbialScore'>('sqi');
  const [activeSeasonIndex, setActiveSeasonIndex] = useState<number>(HISTORICAL_SEASONS.length - 1);
  const [isPlayingTimeline, setIsPlayingTimeline] = useState<boolean>(false);
  const [selectedQuadrantId, setSelectedQuadrantId] = useState<string | null>('q5_cc');
  const [hoveredCell, setHoveredCell] = useState<{ quad: QuadrantDefinition; data: QuadrantMeasurement } | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Generate historical quadrant measurement records
  const allMeasurements = useMemo(() => {
    return generateHistoricalQuadrantData(soc, ph, nitrogen);
  }, [soc, ph, nitrogen]);

  const activeSeason = HISTORICAL_SEASONS[activeSeasonIndex];

  // Timeline auto-play ticker
  useEffect(() => {
    let timer: any = null;
    if (isPlayingTimeline) {
      timer = setInterval(() => {
        setActiveSeasonIndex((prev) => {
          if (prev >= HISTORICAL_SEASONS.length - 1) {
            setIsPlayingTimeline(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1400);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlayingTimeline]);

  // Metric value range resolver
  const metricConfig = useMemo(() => {
    switch (selectedMetric) {
      case 'soc':
        return {
          label: 'Soil Organic Carbon (SOC)',
          unit: '%',
          domain: [0.3, 1.1] as [number, number],
          formatter: (v: number) => `${v.toFixed(2)}%`,
          colorInterpolator: d3.interpolateYlGn,
          description: 'Regulates water infiltration and biological fungal networks.'
        };
      case 'npkScore':
        return {
          label: 'Macronutrient Index (NPK)',
          unit: 'pts',
          domain: [35, 95] as [number, number],
          formatter: (v: number) => `${v} pts`,
          colorInterpolator: d3.interpolatePuBuGn,
          description: 'Combined nitrogen, phosphorus, and potassium bioavailability.'
        };
      case 'ph':
        return {
          label: 'Soil Reaction Balance (pH)',
          unit: 'pH',
          domain: [6.0, 8.2] as [number, number],
          formatter: (v: number) => `${v.toFixed(1)}`,
          colorInterpolator: d3.interpolateSpectral,
          description: 'Optimal nutrient mass-flow occurs between 6.5 and 7.5 pH.'
        };
      case 'microbialScore':
        return {
          label: 'Microbial Respiration Index',
          unit: '/100',
          domain: [35, 95] as [number, number],
          formatter: (v: number) => `${v} /100`,
          colorInterpolator: d3.interpolateViridis,
          description: 'Dehydrogenase enzymatic activity and mycorrhizal biomass.'
        };
      case 'sqi':
      default:
        return {
          label: 'Soil Quality Index (SQI)',
          unit: '/100',
          domain: [40, 95] as [number, number],
          formatter: (v: number) => `${v} /100`,
          colorInterpolator: d3.interpolateYlGn,
          description: 'Integrated physical, chemical, and biological soil health index.'
        };
    }
  }, [selectedMetric]);

  // Color Scale Generator
  const colorScale = useMemo(() => {
    return d3.scaleSequential()
      .domain(metricConfig.domain)
      .interpolator(metricConfig.colorInterpolator);
  }, [metricConfig]);

  // D3 Rendering Hook
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const containerWidth = containerRef.current.clientWidth || 640;
    const height = viewMode === 'spatial' ? 360 : 420;
    const margin = viewMode === 'spatial' 
      ? { top: 25, right: 30, bottom: 25, left: 30 }
      : { top: 35, right: 25, bottom: 50, left: 135 };

    const width = containerWidth - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // ==========================================
    // 1. SPATIAL TOP-DOWN QUADRANT HEATMAP (3x3)
    // ==========================================
    if (viewMode === 'spatial') {
      const cols = 3;
      const rows = 3;
      const cellWidth = Math.min(180, (width - (cols - 1) * 12) / cols);
      const cellHeight = (innerHeight - (rows - 1) * 12) / rows;
      const offsetX = Math.max(0, (width - (cols * cellWidth + (cols - 1) * 12)) / 2);

      // Filter measurements for active season
      const currentSeasonMeasurements = allMeasurements.filter(m => m.seasonId === activeSeason.id);
      const measurementMap = new Map<string, QuadrantMeasurement>(currentSeasonMeasurements.map(m => [m.quadrantId, m]));

      // Render spatial cells
      FIELD_QUADRANTS.forEach((quad) => {
        const m = measurementMap.get(quad.id);
        if (!m) return;

        const val = m[selectedMetric] as number;
        const fillColor = colorScale(val);
        const x = offsetX + quad.col * (cellWidth + 12);
        const y = quad.row * (cellHeight + 12);

        const isSelected = selectedQuadrantId === quad.id;

        const cellGroup = g.append('g')
          .attr('class', 'spatial-quadrant-cell')
          .attr('transform', `translate(${x},${y})`)
          .style('cursor', 'pointer')
          .on('mouseenter', () => setHoveredCell({ quad, data: m }))
          .on('mouseleave', () => setHoveredCell(null))
          .on('click', () => {
            setSelectedQuadrantId(quad.id);
            showToast(`Quadrant ${quad.code} (${quad.name}) selected for deep analytics.`, 'info');
          });

        // Background Rectangle
        cellGroup.append('rect')
          .attr('width', cellWidth)
          .attr('height', cellHeight)
          .attr('rx', 14)
          .attr('ry', 14)
          .attr('fill', fillColor)
          .attr('stroke', isSelected ? '#047857' : '#FFFFFF')
          .attr('stroke-width', isSelected ? 3.5 : 2)
          .style('filter', isSelected ? 'drop-shadow(0 4px 6px rgba(4,120,87,0.3))' : 'drop-shadow(0 1px 2px rgba(0,0,0,0.05))')
          .style('transition', 'all 0.3s ease');

        // Quadrant Code Tag Badge
        cellGroup.append('rect')
          .attr('x', 10)
          .attr('y', 10)
          .attr('width', 38)
          .attr('height', 18)
          .attr('rx', 6)
          .attr('fill', 'rgba(255, 255, 255, 0.85)');

        cellGroup.append('text')
          .attr('x', 29)
          .attr('y', 23)
          .attr('text-anchor', 'middle')
          .attr('font-size', '10px')
          .attr('font-weight', 'bold')
          .attr('fill', '#0F172A')
          .text(quad.code);

        // Grade Badge (Right aligned)
        cellGroup.append('text')
          .attr('x', cellWidth - 12)
          .attr('y', 23)
          .attr('text-anchor', 'end')
          .attr('font-size', '10px')
          .attr('font-weight', '700')
          .attr('fill', '#FFFFFF')
          .style('text-shadow', '0 1px 2px rgba(0,0,0,0.6)')
          .text(m.statusGrade);

        // Quadrant Name (Truncated)
        cellGroup.append('text')
          .attr('x', 12)
          .attr('y', 48)
          .attr('font-size', '11px')
          .attr('font-weight', '700')
          .attr('fill', '#FFFFFF')
          .style('text-shadow', '0 1px 2px rgba(0,0,0,0.7)')
          .text(quad.name.length > 18 ? quad.name.slice(0, 16) + '...' : quad.name);

        // Large Metric Value readout in center
        cellGroup.append('text')
          .attr('x', cellWidth / 2)
          .attr('y', cellHeight - 16)
          .attr('text-anchor', 'middle')
          .attr('font-size', '18px')
          .attr('font-weight', '900')
          .attr('fill', '#FFFFFF')
          .style('text-shadow', '0 2px 4px rgba(0,0,0,0.7)')
          .text(metricConfig.formatter(val));
      });
    }

    // ==========================================
    // 2. HISTORICAL MATRIX HEATMAP (Quadrants × Seasons)
    // ==========================================
    if (viewMode === 'matrix') {
      const seasonLabels = HISTORICAL_SEASONS.map(s => s.label);
      const quadCodes = FIELD_QUADRANTS.map(q => q.code);

      const xScale = d3.scaleBand()
        .domain(seasonLabels)
        .range([0, width])
        .padding(0.08);

      const yScale = d3.scaleBand()
        .domain(quadCodes)
        .range([0, innerHeight])
        .padding(0.1);

      // X Axis (Seasons)
      g.append('g')
        .attr('transform', `translate(0, ${innerHeight + 6})`)
        .call(d3.axisBottom(xScale).tickSize(0))
        .call(d => d.select('.domain').remove())
        .selectAll('text')
        .attr('font-size', '11px')
        .attr('font-weight', '600')
        .attr('fill', '#64748B')
        .style('text-anchor', 'middle');

      // Y Axis (Quadrant Codes & Names)
      const yAxis = g.append('g')
        .call(d3.axisLeft(yScale).tickSize(0))
        .call(d => d.select('.domain').remove());

      yAxis.selectAll('text')
        .attr('font-size', '11px')
        .attr('font-weight', '700')
        .attr('fill', '#1E293B')
        .text((code) => {
          const q = FIELD_QUADRANTS.find(item => item.code === code);
          return q ? `${code} (${q.name.slice(0, 10)})` : String(code);
        });

      // Render Matrix Cells
      allMeasurements.forEach((m) => {
        const quad = FIELD_QUADRANTS.find(q => q.id === m.quadrantId);
        if (!quad) return;

        const val = m[selectedMetric] as number;
        const fillColor = colorScale(val);
        const x = xScale(m.seasonName) || 0;
        const y = yScale(quad.code) || 0;
        const cellW = xScale.bandwidth();
        const cellH = yScale.bandwidth();

        const isSelected = selectedQuadrantId === quad.id && m.seasonId === activeSeason.id;

        const cell = g.append('g')
          .attr('class', 'matrix-quadrant-cell')
          .attr('transform', `translate(${x},${y})`)
          .style('cursor', 'pointer')
          .on('mouseenter', () => setHoveredCell({ quad, data: m }))
          .on('mouseleave', () => setHoveredCell(null))
          .on('click', () => {
            setSelectedQuadrantId(quad.id);
            const sIdx = HISTORICAL_SEASONS.findIndex(s => s.label === m.seasonName);
            if (sIdx !== -1) setActiveSeasonIndex(sIdx);
          });

        cell.append('rect')
          .attr('width', cellW)
          .attr('height', cellH)
          .attr('rx', 6)
          .attr('ry', 6)
          .attr('fill', fillColor)
          .attr('stroke', isSelected ? '#047857' : 'rgba(255,255,255,0.7)')
          .attr('stroke-width', isSelected ? 2.5 : 1)
          .style('transition', 'all 0.2s ease');

        // Number inside cell
        cell.append('text')
          .attr('x', cellW / 2)
          .attr('y', cellH / 2 + 4)
          .attr('text-anchor', 'middle')
          .attr('font-size', '10px')
          .attr('font-weight', 'bold')
          .attr('fill', '#FFFFFF')
          .style('text-shadow', '0 1px 2px rgba(0,0,0,0.6)')
          .text(typeof val === 'number' && val > 10 ? Math.round(val) : val.toFixed(1));
      });
    }

  }, [viewMode, selectedMetric, activeSeasonIndex, selectedQuadrantId, allMeasurements, colorScale, metricConfig]);

  // Currently inspected quadrant data
  const selectedQuadData = useMemo(() => {
    if (!selectedQuadrantId) return null;
    const quad = FIELD_QUADRANTS.find(q => q.id === selectedQuadrantId);
    const m = allMeasurements.find(item => item.quadrantId === selectedQuadrantId && item.seasonId === activeSeason.id);
    // Historical trajectory for this quadrant
    const trajectory = allMeasurements.filter(item => item.quadrantId === selectedQuadrantId);
    return { quad, current: m, history: trajectory };
  }, [selectedQuadrantId, activeSeason.id, allMeasurements]);

  // Overall Statistics for current season
  const seasonStats = useMemo(() => {
    const list = allMeasurements.filter(m => m.seasonId === activeSeason.id);
    const meanSQI = Math.round(list.reduce((acc, m) => acc + m.sqi, 0) / list.length);
    const meanSOC = parseFloat((list.reduce((acc, m) => acc + m.soc, 0) / list.length).toFixed(2));
    const bestQuad = [...list].sort((a, b) => b.sqi - a.sqi)[0];
    const lowestQuad = [...list].sort((a, b) => a.sqi - b.sqi)[0];

    const bestQuadDef = FIELD_QUADRANTS.find(q => q.id === bestQuad?.quadrantId);
    const lowestQuadDef = FIELD_QUADRANTS.find(q => q.id === lowestQuad?.quadrantId);

    // Initial baseline in 2023 vs today
    const baselineList = allMeasurements.filter(m => m.seasonId === 's2023_spring');
    const baselineMeanSQI = Math.round(baselineList.reduce((acc, m) => acc + m.sqi, 0) / baselineList.length);
    const sqiDelta = meanSQI - baselineMeanSQI;

    return {
      meanSQI,
      meanSOC,
      bestQuad: bestQuadDef ? `${bestQuadDef.code} (${bestQuad.sqi} SQI)` : 'N/A',
      lowestQuad: lowestQuadDef ? `${lowestQuadDef.code} (${lowestQuad.sqi} SQI)` : 'N/A',
      sqiDelta
    };
  }, [allMeasurements, activeSeason.id]);

  return (
    <div className={`bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 ${className}`}>
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 rounded-full text-xs font-bold">
            <Microscope className="w-3.5 h-3.5 text-amber-600" />
            D3 High-Precision Spatial Heatmap
          </div>
          <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            Historical Soil Quality Index (SQI) Heatmap
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              9 Field Quadrants
            </span>
          </h3>
          <p className="text-xs text-slate-500 font-sans">
            Distribution and multi-year regenerative trajectory of soil health indices across active field parcels in {activeLocation}.
          </p>
        </div>

        {/* View Mode & Metric Switcher Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Spatial vs Matrix View Mode */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setViewMode('spatial')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'spatial' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🗺️ Spatial Field Grid
            </button>
            <button
              type="button"
              onClick={() => setViewMode('matrix')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'matrix' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📊 Historical Matrix
            </button>
          </div>

          {/* Metric Selector Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedMetric}
              onChange={(e: any) => setSelectedMetric(e.target.value)}
              className="bg-transparent font-bold text-slate-800 text-xs outline-none cursor-pointer"
            >
              <option value="sqi">Soil Quality Index (SQI)</option>
              <option value="soc">Soil Organic Carbon (SOC %)</option>
              <option value="npkScore">Available Macronutrients (NPK)</option>
              <option value="ph">Soil Reaction (pH Balance)</option>
              <option value="microbialScore">Microbial Respiration Index</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Field-Wide Mean SQI</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-emerald-800">{seasonStats.meanSQI}</span>
            <span className="text-xs font-bold text-emerald-600">/100</span>
          </div>
          <span className="text-[11px] font-bold text-emerald-700 flex items-center">
            <TrendingUp className="w-3 h-3 mr-0.5" />
            +{seasonStats.sqiDelta} pts vs 2023 Baseline
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Average Carbon (SOC)</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-800">{seasonStats.meanSOC}%</span>
            <span className="text-xs font-medium text-slate-500">Organic Matter</span>
          </div>
          <span className="text-[11px] text-slate-500">Biological sequestration active</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-100 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Prime Fertile Quadrant</span>
          <div className="text-lg font-black text-amber-900 truncate">{seasonStats.bestQuad}</div>
          <span className="text-[11px] text-amber-800">Grade I • Superior moisture retention</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-100 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Remediation Priority Zone</span>
          <div className="text-lg font-black text-rose-900 truncate">{seasonStats.lowestQuad}</div>
          <span className="text-[11px] text-rose-800">Requires green manure & biochar</span>
        </div>
      </div>

      {/* Interactive Timeline & Playback Controller (Always accessible) */}
      <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPlayingTimeline(p => !p)}
            className={`h-9 px-3 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
              isPlayingTimeline
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
            }`}
          >
            {isPlayingTimeline ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Play Regeneration History</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setIsPlayingTimeline(false);
              setActiveSeasonIndex(0);
            }}
            title="Reset to 2023 Baseline"
            className="h-9 w-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Season Stepper Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs select-none">
          {HISTORICAL_SEASONS.map((season, idx) => (
            <button
              key={season.id}
              type="button"
              onClick={() => {
                setIsPlayingTimeline(false);
                setActiveSeasonIndex(idx);
              }}
              className={`px-2.5 py-1.5 rounded-xl font-bold text-[11px] whitespace-nowrap transition-all cursor-pointer ${
                activeSeasonIndex === idx
                  ? 'bg-slate-900 text-white shadow-xs scale-105'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
              }`}
            >
              {season.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Heatmap Visualization Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Heatmap SVG Canvas (8 Cols) */}
        <div ref={containerRef} className="lg:col-span-8 bg-slate-50/50 rounded-2xl p-4 border border-slate-200 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-500 font-sans mb-2 px-1">
            <span className="font-bold uppercase tracking-wider text-[11px] text-slate-700">
              {viewMode === 'spatial' ? `Spatial 9-Quadrant Parcel Map (${activeSeason.label})` : 'Full Historical Multi-Season Matrix'}
            </span>
            <span className="font-mono text-[10px] text-slate-400">
              Hover cell for nutrient breakdown • Click to isolate quadrant
            </span>
          </div>

          <div className="w-full flex justify-center">
            <svg
              ref={svgRef}
              className="w-full select-none overflow-visible"
              height={viewMode === 'spatial' ? 360 : 420}
            />
          </div>

          {/* D3 Continuous Color Scale Legend Bar */}
          <div className="pt-4 border-t border-slate-200/60 mt-2">
            <div className="flex items-center justify-between text-[11px] text-slate-600 font-medium pb-1.5">
              <span>{metricConfig.label} Gradient:</span>
              <span className="font-bold text-slate-800">{metricConfig.description}</span>
            </div>
            <div
              className="h-3 w-full rounded-full shadow-inner border border-slate-200"
              style={{
                background: `linear-gradient(to right, ${colorScale(metricConfig.domain[0])}, ${colorScale((metricConfig.domain[0] + metricConfig.domain[1]) / 2)}, ${colorScale(metricConfig.domain[1])})`
              }}
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500 pt-1">
              <span>{metricConfig.formatter(metricConfig.domain[0])} (Depleted / Stress)</span>
              <span>{metricConfig.formatter((metricConfig.domain[0] + metricConfig.domain[1]) / 2)} (Moderate)</span>
              <span>{metricConfig.formatter(metricConfig.domain[1])} (Prime Fertile)</span>
            </div>
          </div>
        </div>

        {/* Selected Quadrant Deep Dive Analytics Sidebar (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          {selectedQuadData?.current && selectedQuadData.quad ? (
            <motion.div
              key={selectedQuadData.quad.id + activeSeason.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4"
            >
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md uppercase">
                    {selectedQuadData.quad.code}
                  </span>
                  <h4 className="text-base font-extrabold text-slate-900 mt-1">
                    {selectedQuadData.quad.name}
                  </h4>
                  <p className="text-xs text-slate-400 font-sans">
                    Elevation: {selectedQuadData.quad.elevationMeters}m • {selectedQuadData.quad.soilTexture}
                  </p>
                </div>

                <span className={`text-xs font-black px-2.5 py-1 rounded-xl text-white ${
                  selectedQuadData.current.sqi >= 80 ? 'bg-emerald-600' : selectedQuadData.current.sqi >= 65 ? 'bg-lime-600' : 'bg-amber-600'
                }`}>
                  {selectedQuadData.current.statusGrade}
                </span>
              </div>

              {/* Sub-scores Matrix */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Soil Quality (SQI)</span>
                  <span className="text-lg font-black text-slate-800">{selectedQuadData.current.sqi} / 100</span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Organic Carbon</span>
                  <span className="text-lg font-black text-emerald-700">{selectedQuadData.current.soc}% SOC</span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">NPK Bioavailability</span>
                  <span className="text-lg font-black text-blue-700">{selectedQuadData.current.npkScore} pts</span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">pH Reaction</span>
                  <span className="text-lg font-black text-slate-800">{selectedQuadData.current.ph} pH</span>
                </div>
              </div>

              {/* Agronomic Action for this Quadrant */}
              <div className="bg-emerald-50/70 border border-emerald-100 p-3.5 rounded-xl text-xs space-y-1">
                <span className="font-bold text-emerald-900 block flex items-center gap-1">
                  <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                  Targeted Agronomic Protocol:
                </span>
                <p className="text-emerald-950 font-sans leading-relaxed text-[11px]">
                  {selectedQuadData.current.sqi < 65 
                    ? "Incorporate green manure (Sesbania) and apply 200 L/ha fermented Jeevamrit to stimulate mycorrhizal aggregation."
                    : "High organic fertility established. Optimal quadrant for high-value millet and legume intercropping without synthetic urea."}
                </p>
              </div>

              {/* 3-Year Historical Growth sparkline bar */}
              <div className="space-y-1 pt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Historical SQI Progression (2023 → 2026):
                </span>
                <div className="flex items-end gap-1.5 h-12 pt-1">
                  {selectedQuadData.history.map((h, i) => (
                    <div key={h.seasonId} className="flex-1 flex flex-col items-center gap-1 h-full justify-end" title={`${h.seasonName}: ${h.sqi} SQI`}>
                      <div
                        className={`w-full rounded-sm transition-all ${h.seasonId === activeSeason.id ? 'bg-emerald-600' : 'bg-slate-300 hover:bg-slate-400'}`}
                        style={{ height: `${(h.sqi / 100) * 100}%` }}
                      />
                      <span className="text-[8px] font-mono text-slate-400">
                        {h.seasonName.split(' ')[0].slice(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-500">
              Click any quadrant on the heatmap to view its complete historical physical & chemical soil profile.
            </div>
          )}
        </div>
      </div>

      {/* Floating Hover Tooltip (When user hovers over any cell) */}
      {hoveredCell && (
        <div className="fixed pointer-events-none z-50 p-3 bg-slate-950/95 backdrop-blur-md text-white rounded-xl shadow-2xl border border-white/20 text-xs space-y-1.5 max-w-xs bottom-4 right-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-1 font-bold">
            <span className="text-emerald-400">{hoveredCell.quad.code} • {hoveredCell.quad.name}</span>
            <span className="text-[10px] font-mono text-slate-300">{hoveredCell.data.seasonName}</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-slate-300">Soil Quality Index:</span>
            <span className="font-mono font-bold text-emerald-400 text-sm">{hoveredCell.data.sqi} / 100 ({hoveredCell.data.statusGrade})</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-300 pt-1 border-t border-white/10">
            <span>SOC: <strong>{hoveredCell.data.soc}%</strong></span>
            <span>NPK: <strong>{hoveredCell.data.npkScore} pts</strong></span>
            <span>pH: <strong>{hoveredCell.data.ph}</strong></span>
            <span>Moisture: <strong>{hoveredCell.data.moistureRetentionPct}%</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}
