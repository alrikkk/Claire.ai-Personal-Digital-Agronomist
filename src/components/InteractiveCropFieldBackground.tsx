import React, { useEffect, useRef, useState } from 'react';

interface InteractiveCropFieldBackgroundProps {
  className?: string;
  isTransitioningToSky?: boolean;
}

interface CropStalk {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  length: number;
  width: number;
  headLength: number;
  headWidth: number;
  awnCount: number;
  baseAngle: number;
  currentAngle: number;
  // Smooth returning parameters
  elasticity: number;     // Soft pulling force returning to rest
  damping: number;        // Critical damping prevents rigid rubber-band bouncing
  colorBase: string;
  colorMid: string;
  colorTip: string;
  colorAwn: string;
  phase: number;
  breezeSpeed: number;
  breezeAmp: number;
  depth: number;          // 0.45 (far) to 1.0 (near)
}

export default function InteractiveCropFieldBackground({ 
  className = '',
  isTransitioningToSky = false
}: InteractiveCropFieldBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Field crop variety selector
  const [cropTheme, setCropTheme] = useState<'golden_wheat' | 'amber_barley' | 'emerald_paddy'>('golden_wheat');
  const [windBoost, setWindBoost] = useState(3.0); // Default to 3x breeze / gale dynamics

  // Sky transition progress tracking (0 = regular canopy, 1 = camera pointed straight up into glowing sky)
  const skyProgressRef = useRef(0);
  const transitionStartTimeRef = useRef<number | null>(null);

  // Continuous low-pass filtered wind vector & wake state
  const mouseRef = useRef({
    x: -2000,
    y: -2000,
    prevX: -2000,
    prevY: -2000,
    flowVx: 0,
    flowVy: 0,
    speed: 0,
    smoothedSpeed: 0,
    isHovering: false,
    lastTime: performance.now()
  });

  const cropsRef = useRef<CropStalk[]>([]);
  const animFrameIdRef = useRef<number | null>(null);
  const dimensionsRef = useRef({ width: 0, height: 0, dpr: 1 });

  // Natural agricultural color palettes
  const getThemePalette = (theme: typeof cropTheme) => {
    switch (theme) {
      case 'amber_barley':
        return {
          soilBgTop: '#24170a',
          soilBgBottom: '#140c05',
          furrowColor: 'rgba(217, 145, 45, 0.035)',
          base: '#6b3f11',
          mid: '#b87c24',
          tip: '#e8b551',
          awn: '#dc9f33',
          glint: '#fff0be'
        };
      case 'emerald_paddy':
        return {
          soilBgTop: '#0c2217',
          soilBgBottom: '#06130c',
          furrowColor: 'rgba(52, 211, 153, 0.04)',
          base: '#064e3b',
          mid: '#059669',
          tip: '#34d399',
          awn: '#a7f3d0',
          glint: '#ecfdf5'
        };
      case 'golden_wheat':
      default:
        return {
          soilBgTop: '#2b1606',
          soilBgBottom: '#160902',
          furrowColor: 'rgba(245, 158, 11, 0.04)',
          base: '#78350f',
          mid: '#d97706',
          tip: '#fbbf24',
          awn: '#fde68a',
          glint: '#fef3c7'
        };
    }
  };

  // Re-initialize dense crop stalks matrix
  const initCrops = (width: number, height: number) => {
    const palette = getThemePalette(cropTheme);
    const stalks: CropStalk[] = [];

    // Dense canopy with staggered rows
    const spacingX = Math.max(13, Math.min(20, width / 70));
    const spacingY = Math.max(15, Math.min(24, height / 50));

    const cols = Math.ceil(width / spacingX) + 4;
    const rows = Math.ceil(height / spacingY) + 4;

    for (let r = -2; r < rows; r++) {
      for (let c = -2; c < cols; c++) {
        const rowJitterX = r % 2 === 0 ? 0 : spacingX * 0.45;
        const jitterX = (Math.random() - 0.5) * (spacingX * 0.75);
        const jitterY = (Math.random() - 0.5) * (spacingY * 0.75);

        const baseX = c * spacingX + rowJitterX + jitterX;
        const baseY = r * spacingY + jitterY;

        const depth = 0.45 + Math.random() * 0.55;
        const length = (24 + Math.random() * 16) * depth;
        const widthPx = (1.9 + Math.random() * 1.3) * depth;
        const headLength = (15 + Math.random() * 13) * depth;
        const headWidth = (3.8 + Math.random() * 2.8) * depth;
        const awnCount = 4 + Math.floor(Math.random() * 4);

        // Natural rest angle (facing gently upwards)
        const baseAngle = -Math.PI / 2 + (Math.random() - 0.5) * 0.28;

        stalks.push({
          x: baseX,
          y: baseY,
          baseX,
          baseY,
          length,
          width: widthPx,
          headLength,
          headWidth,
          awnCount,
          baseAngle,
          currentAngle: baseAngle,
          // Organic plant stem physics: high damping, gentle returning elasticity
          elasticity: 0.045 + Math.random() * 0.02,
          damping: 0.88 + Math.random() * 0.04,
          colorBase: palette.base,
          colorMid: palette.mid,
          colorTip: palette.tip,
          colorAwn: palette.awn,
          phase: Math.random() * Math.PI * 2,
          breezeSpeed: 0.0011 + Math.random() * 0.0009,
          breezeAmp: 0.045 + Math.random() * 0.05,
          depth
        });
      }
    }

    cropsRef.current = stalks;
  };

  // Canvas Resize handling
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const handleResize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      dimensionsRef.current = { width: rect.width, height: rect.height, dpr };
      initCrops(rect.width, rect.height);
    };

    handleResize();

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [cropTheme]);

  // Main 60fps Physics & Smooth Wind Dynamics Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let startTime = performance.now();

    const render = (currentTime: number) => {
      const { width, height, dpr } = dimensionsRef.current;
      if (width === 0 || height === 0) {
        animFrameIdRef.current = requestAnimationFrame(render);
        return;
      }

      const elapsed = currentTime - startTime;
      const palette = getThemePalette(cropTheme);
      const mouse = mouseRef.current;

      // Calculate sky transition progress (camera pitch upwards into glowing morning sky)
      if (isTransitioningToSky) {
        if (transitionStartTimeRef.current === null) {
          transitionStartTimeRef.current = currentTime;
        }
        const duration = 2600; // 2.6s smooth tilt and bloom
        const progressRaw = Math.min(1, (currentTime - transitionStartTimeRef.current) / duration);
        // Smooth cubic ease in out
        const easeProgress = progressRaw < 0.5 
          ? 4 * progressRaw * progressRaw * progressRaw 
          : 1 - Math.pow(-2 * progressRaw + 2, 3) / 2;
        skyProgressRef.current = easeProgress;
      } else {
        transitionStartTimeRef.current = null;
        skyProgressRef.current = 0;
      }
      const skyProgress = skyProgressRef.current;
      const cameraYOffset = skyProgress * (height * 0.95);

      // 1. Calculate continuous mouse velocity with exponential smoothing (wind draft vector)
      const dt = Math.max(1, Math.min(32, currentTime - mouse.lastTime));
      const rawVx = (mouse.x - mouse.prevX) / dt;
      const rawVy = (mouse.y - mouse.prevY) / dt;
      const rawSpeed = Math.sqrt(rawVx * rawVx + rawVy * rawVy);

      // Low-pass filtered flow vectors
      mouse.flowVx = mouse.flowVx * 0.86 + rawVx * 0.14;
      mouse.flowVy = mouse.flowVy * 0.86 + rawVy * 0.14;
      mouse.speed = mouse.speed * 0.88 + rawSpeed * 0.12;
      mouse.smoothedSpeed = mouse.smoothedSpeed * 0.92 + mouse.speed * 0.08;

      mouse.prevX = mouse.x;
      mouse.prevY = mouse.y;
      mouse.lastTime = currentTime;

      ctx.save();
      ctx.scale(dpr, dpr);

      // 2. Draw Soil Bed & Furrow Contours (slides down with camera pitch)
      const bgGradient = ctx.createRadialGradient(
        width * 0.5, height * 0.45 + cameraYOffset * 0.5, width * 0.1,
        width * 0.5, height * 0.5 + cameraYOffset * 0.5, Math.max(width, height) * 0.75
      );
      bgGradient.addColorStop(0, palette.soilBgTop);
      bgGradient.addColorStop(1, palette.soilBgBottom);
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // Subtle crop line furrows
      ctx.lineWidth = 1.0;
      ctx.strokeStyle = palette.furrowColor;
      const rowStep = 34;
      for (let y = 0; y < height + 60; y += rowStep) {
        ctx.beginPath();
        const furrowY = y + cameraYOffset * 0.8;
        ctx.moveTo(0, furrowY);
        const wave = Math.sin((y * 0.015) + (elapsed * 0.00025)) * 5;
        ctx.bezierCurveTo(width * 0.33, furrowY + wave, width * 0.66, furrowY - wave, width, furrowY);
        ctx.stroke();
      }

      // 3. Ambient Natural Field Waves (Continuous soft rolling breeze across entire field)
      const ambientWave1 = Math.sin(elapsed * 0.00085) * 0.09 * windBoost;
      const ambientWave2 = Math.cos((elapsed * 0.00055) + 1.2) * 0.06 * windBoost;
      const ambientBreeze = ambientWave1 + ambientWave2;

      // 4. Update & Render Stalks with Gentle Wind Stream
      const stalks = cropsRef.current;
      const stalkCount = stalks.length;

      // Wind radius increases smoothly with motion speed (soft, continuous wake)
      const baseRadius = 120;
      const speedRadiusBonus = Math.min(80, mouse.smoothedSpeed * 22);
      const effectiveRadius = baseRadius + speedRadiusBonus;
      const effectiveRadiusSq = effectiveRadius * effectiveRadius;

      // Wind direction determined by motion flow (if stationary or slow, gently flows outwards)
      const hasMotion = mouse.smoothedSpeed > 0.08;
      const motionFlowAngle = Math.atan2(mouse.flowVy, mouse.flowVx);

      for (let i = 0; i < stalkCount; i++) {
        const stalk = stalks[i];

        // Plant's individual gentle breathing in the breeze
        const individualBreeze = Math.sin(elapsed * stalk.breezeSpeed + stalk.phase + (stalk.x * 0.004) + (stalk.y * 0.002)) * stalk.breezeAmp * windBoost;

        // Natural baseline orientation (stalks will always smoothly return here)
        let naturalRestAngle = stalk.baseAngle + individualBreeze + ambientBreeze;
        
        // Tilt backwards organically as camera pitches up
        if (skyProgress > 0) {
          naturalRestAngle += 0.28 * skyProgress;
        }

        let breezeOffsetAngle = 0;

        if (mouse.isHovering && skyProgress < 0.7) {
          const mdx = stalk.x - mouse.x;
          const mdy = stalk.y - mouse.y;
          const distSq = mdx * mdx + mdy * mdy;

          if (distSq < effectiveRadiusSq) {
            const dist = Math.sqrt(distSq);
            // Smooth cosine bell curve (0 to 1 with zero sharp edge / no crater)
            const ratio = dist / effectiveRadius;
            const softWeight = 0.5 * (1 + Math.cos(Math.PI * ratio));

            // Wind direction: primarily aligned with the cursor travel direction, with slight natural outward expansion
            const radialAngle = Math.atan2(mdy, mdx);
            const windDirAngle = hasMotion
              ? (motionFlowAngle * 0.82 + radialAngle * 0.18)
              : (radialAngle * 0.4 + stalk.baseAngle * 0.6);

            // Soft deflection amount scaled by speed (subtle when slow, sweeping when fast)
            const speedScale = Math.min(1.8, 0.4 + mouse.smoothedSpeed * 0.35);
            const maxDeflection = 0.55 * speedScale; // Realistic bending limit (won't violently snap)

            // Offset relative to base orientation
            breezeOffsetAngle = (windDirAngle - stalk.baseAngle) * softWeight * maxDeflection;
          }
        }

        // Target angle is the current wind-deflected position
        const targetAngle = naturalRestAngle + breezeOffsetAngle;

        // Smooth critically damped recovery: asymptotic return to natural rest position
        const angleDiff = targetAngle - stalk.currentAngle;
        stalk.currentAngle += angleDiff * stalk.elasticity * 1.5;

        // 3D Top-Down Geometry with natural curved spine & camera pitch offset
        const bend = stalk.currentAngle;
        const stemLength = stalk.length * (1 - skyProgress * 0.15);
        const curBaseX = stalk.baseX;
        const curBaseY = stalk.baseY + cameraYOffset;

        const tipX = curBaseX + Math.cos(bend) * stemLength;
        const tipY = curBaseY + Math.sin(bend) * stemLength;

        // Mid-point curvature for soft organic stalk flexure
        const midCtrlX = curBaseX + Math.cos(bend * 0.94) * (stemLength * 0.54);
        const midCtrlY = curBaseY + Math.sin(bend * 0.94) * (stemLength * 0.54);

        // 4.1 Draw Flexible Stalk Stem
        ctx.beginPath();
        ctx.moveTo(curBaseX, curBaseY);
        ctx.quadraticCurveTo(midCtrlX, midCtrlY, tipX, tipY);
        ctx.strokeStyle = stalk.colorBase;
        ctx.lineWidth = stalk.width;
        ctx.lineCap = 'round';
        ctx.stroke();

        // 4.2 Draw Wheat/Barley Grain Head (Follows spine smoothly)
        const headLength = stalk.headLength;
        const headAngle = bend;
        const headEndX = tipX + Math.cos(headAngle) * headLength;
        const headEndY = tipY + Math.sin(headAngle) * headLength;

        // Grain ear body
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(headEndX, headEndY);
        ctx.strokeStyle = stalk.colorMid;
        ctx.lineWidth = stalk.headWidth;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Grain highlight on upper sunlight facet
        ctx.beginPath();
        ctx.moveTo(tipX + 0.5, tipY - 0.5);
        ctx.lineTo(headEndX + 0.5, headEndY - 0.5);
        ctx.strokeStyle = stalk.colorTip;
        ctx.lineWidth = stalk.headWidth * 0.6;
        ctx.stroke();

        // 4.3 Draw Awns (Soft natural bristles that follow the ear)
        ctx.strokeStyle = stalk.colorAwn;
        ctx.lineWidth = 0.65 * stalk.depth;
        const awnCount = stalk.awnCount;

        for (let a = 0; a < awnCount; a++) {
          const t = (a + 0.5) / awnCount;
          const ax = tipX + (headEndX - tipX) * t;
          const ay = tipY + (headEndY - tipY) * t;

          const side = a % 2 === 0 ? 1 : -1;
          const splayAngle = headAngle + (side * 0.45);
          const awnLen = (9 + a * 1.8) * stalk.depth;

          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.quadraticCurveTo(
            ax + Math.cos(splayAngle) * (awnLen * 0.5),
            ay + Math.sin(splayAngle) * (awnLen * 0.5),
            ax + Math.cos(splayAngle + (side * 0.12)) * awnLen,
            ay + Math.sin(splayAngle + (side * 0.12)) * awnLen
          );
          ctx.stroke();
        }

        // 4.4 Subtle Sun Glint on wind crests
        if (Math.abs(stalk.currentAngle - stalk.baseAngle) > 0.12) {
          ctx.beginPath();
          ctx.arc(headEndX, headEndY, 1.3 * stalk.depth, 0, Math.PI * 2);
          ctx.fillStyle = palette.glint;
          ctx.fill();
        }
      }

      // 5. Aerial Cinematic Vignette & Warm Golden Sun Overlay
      const vignette = ctx.createRadialGradient(
        width * 0.5, height * 0.5, Math.min(width, height) * 0.35,
        width * 0.5, height * 0.5, Math.max(width, height) * 0.75
      );
      vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vignette.addColorStop(1, 'rgba(10, 5, 2, 0.45)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);

      // Warm atmospheric lighting gradient
      const sunBeam = ctx.createLinearGradient(0, 0, width, height);
      sunBeam.addColorStop(0, 'rgba(255, 215, 140, 0.10)');
      sunBeam.addColorStop(0.5, 'rgba(255, 175, 75, 0.03)');
      sunBeam.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = sunBeam;
      ctx.fillRect(0, 0, width, height);

      // 6. Sky Transition Luminous Bloom & Skywash (Camera pitch to sky)
      if (skyProgress > 0) {
        // Sky horizon & golden sun flare
        const sunCenterY = -height * 0.2 + (height * 0.5 * skyProgress);
        const sunRadius = Math.max(width, height) * (0.5 + skyProgress * 0.85);
        const skyGrad = ctx.createRadialGradient(
          width * 0.5, sunCenterY, 5,
          width * 0.5, sunCenterY, sunRadius
        );
        skyGrad.addColorStop(0, `rgba(255, 253, 240, ${Math.min(1, skyProgress * 1.5)})`);
        skyGrad.addColorStop(0.3, `rgba(255, 225, 155, ${Math.min(1, skyProgress * 1.35)})`);
        skyGrad.addColorStop(0.65, `rgba(255, 245, 230, ${Math.min(1, skyProgress * 1.15)})`);
        skyGrad.addColorStop(1, `rgba(255, 255, 255, ${skyProgress})`);
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, width, height);

        // Radiant white bloom transition over canvas
        if (skyProgress > 0.3) {
          const bloomAlpha = Math.min(1, (skyProgress - 0.3) / 0.7);
          ctx.fillStyle = `rgba(255, 255, 255, ${bloomAlpha})`;
          ctx.fillRect(0, 0, width, height);
        }
      }

      ctx.restore();

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [cropTheme, windBoost]);

  // Pointer move handlers
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const mouse = mouseRef.current;
    if (!mouse.isHovering) {
      mouse.prevX = x;
      mouse.prevY = y;
    }
    mouse.x = x;
    mouse.y = y;
    mouse.isHovering = true;
  };

  const handlePointerLeave = () => {
    mouseRef.current.isHovering = false;
    mouseRef.current.x = -2000;
    mouseRef.current.y = -2000;
  };

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={`absolute inset-0 overflow-hidden select-none pointer-events-auto ${className}`}
    >
      {/* High Performance 3D Crop Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-crosshair touch-none"
      />
    </div>
  );
}
