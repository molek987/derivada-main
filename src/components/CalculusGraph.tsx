/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import { ControlPoint, SimulationDataPoint } from '../types';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface CalculusGraphProps {
  data: SimulationDataPoint[];
  currentTime: number;
  setCurrentTime: React.Dispatch<React.SetStateAction<number>>;
  preset: string;
  customPoints: ControlPoint[];
  setCustomPoints: (pts: ControlPoint[]) => void;
  customStyle: 'smooth' | 'linear';
  setCustomStyle: (style: 'smooth' | 'linear') => void;
  capacitance: number;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
}

export default function CalculusGraph({
  data,
  currentTime,
  setCurrentTime,
  preset,
  customPoints,
  setCustomPoints,
  customStyle,
  setCustomStyle,
  capacitance,
  isPlaying,
  setIsPlaying,
}: CalculusGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const vGraphRef = useRef<SVGSVGElement>(null);
  const iGraphRef = useRef<SVGSVGElement>(null);

  const [activeDragPointId, setActiveDragPointId] = useState<number | null>(null);
  const [isDraggingScrubber, setIsDraggingScrubber] = useState<boolean>(false);

  // Chart dimensions & padding
  const svgW = 800;
  const svgH = 200;
  const padL = 60;
  const padR = 25;
  const padT = 20;
  const padB = 30;
  const graphW = svgW - padL - padR;
  const graphH = svgH - padT - padB;

  // Coordinate converters
  const toX = (t: number) => padL + (t / 10) * graphW;
  const fromX = (x: number) => Math.max(0, Math.min(10, ((x - padL) / graphW) * 10));

  const toY_V = (v: number) => padT + graphH / 2 - (v / 5) * (graphH / 2);
  const fromY_V = (y: number) => Math.max(-5, Math.min(5, ((padT + graphH / 2 - y) / (graphH / 2)) * 5));

  // Determine maximum absolute current for adaptive scaling
  const maxIVal = Math.max(...data.map((d) => Math.abs(d.current)), 0.1);
  const displayMaxI = Math.max(0.5, Math.ceil(maxIVal * 1.1 * 10) / 10); // Round up nicely

  const toY_I = (iVal: number) => padT + graphH / 2 - (iVal / displayMaxI) * (graphH / 2);

  // Play/Pause interval timer
  useEffect(() => {
    let animationId: number;
    let lastTime = performance.now();

    const update = (now: number) => {
      if (isPlaying) {
        const delta = (now - lastTime) / 1000; // in seconds
        // Speed multiplier: 1.0 (real-time 10s loop)
        setCurrentTime((prev) => {
          const next = prev + delta;
          return next > 10 ? 0 : next;
        });
      }
      lastTime = now;
      animationId = requestAnimationFrame(update);
    };

    animationId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationId);
  }, [isPlaying, setCurrentTime]);

  // Find simulated value at scrubber
  const getCurrentDataPoint = (): SimulationDataPoint => {
    // Find closest index
    const index = Math.min(
      data.length - 1,
      Math.max(0, Math.round((currentTime / 10) * (data.length - 1)))
    );
    return data[index] || { time: currentTime, voltage: 0, current: 0, slope: 0 };
  };

  const currentPoint = getCurrentDataPoint();

  // Mouse & Touch interaction handlers for Voltage Graph (control points or scrubber)
  const handleVGraphPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!vGraphRef.current) return;
    const rect = vGraphRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    // Convert client coords to SVG coords
    const svgX = (clientX / rect.width) * svgW;
    const svgY = (clientY / rect.height) * svgH;

    // Check if clicking near a control point (only if custom preset is selected)
    if (preset === 'custom') {
      const clickTolerance = 15;
      const clickedPoint = customPoints.find((p) => {
        const px = toX((p.x / 100) * 10);
        const py = toY_V(p.y);
        const dist = Math.sqrt(Math.pow(svgX - px, 2) + Math.pow(svgY - py, 2));
        return dist < clickTolerance;
      });

      if (clickedPoint) {
        setActiveDragPointId(clickedPoint.id);
        setIsPlaying(false); // Pause while dragging
        vGraphRef.current.setPointerCapture(e.pointerId);
        return;
      }
    }

    // Otherwise, drag scrubber
    setIsDraggingScrubber(true);
    const newTime = fromX(svgX);
    setCurrentTime(newTime);
    vGraphRef.current.setPointerCapture(e.pointerId);
  };

  const handleVGraphPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!vGraphRef.current) return;
    const rect = vGraphRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    const svgX = (clientX / rect.width) * svgW;
    const svgY = (clientY / rect.height) * svgH;

    if (activeDragPointId !== null && preset === 'custom') {
      const newV = fromY_V(svgY);
      // Clamp V to [-5, 5] and round to 1 decimal
      const roundedV = Math.round(newV * 10) / 10;
      setCustomPoints(
        customPoints.map((p) => (p.id === activeDragPointId ? { ...p, y: roundedV } : p))
      );
    } else if (isDraggingScrubber) {
      const newTime = fromX(svgX);
      setCurrentTime(newTime);
    }
  };

  const handleVGraphPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!vGraphRef.current) return;
    vGraphRef.current.releasePointerCapture(e.pointerId);
    setActiveDragPointId(null);
    setIsDraggingScrubber(false);
  };

  // Mouse & Touch interaction for Current Graph (only drags scrubber)
  const handleIGraphPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!iGraphRef.current) return;
    const rect = iGraphRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const svgX = (clientX / rect.width) * svgW;

    setIsDraggingScrubber(true);
    const newTime = fromX(svgX);
    setCurrentTime(newTime);
    iGraphRef.current.setPointerCapture(e.pointerId);
  };

  const handleIGraphPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (isDraggingScrubber) {
      if (!iGraphRef.current) return;
      const rect = iGraphRef.current.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const svgX = (clientX / rect.width) * svgW;

      const newTime = fromX(svgX);
      setCurrentTime(newTime);
    }
  };

  const handleIGraphPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!iGraphRef.current) return;
    iGraphRef.current.releasePointerCapture(e.pointerId);
    setIsDraggingScrubber(false);
  };

  // Generate SVG path for Voltage
  const generateVPath = () => {
    if (data.length === 0) return '';
    let d = `M ${toX(data[0].time)} ${toY_V(data[0].voltage)}`;
    for (let i = 1; i < data.length; i++) {
      d += ` L ${toX(data[i].time)} ${toY_V(data[i].voltage)}`;
    }
    return d;
  };

  // Generate SVG path for Current
  const generateIPath = () => {
    if (data.length === 0) return '';
    
    if (preset === 'triangle') {
      // Triangle wave has jump discontinuities in derivative.
      // Let's split the paths to show discrete step jumps beautifully rather than sloped connecting lines.
      // Slopes change at 1.25s, 3.75s, 6.25s, 8.75s.
      let d = '';
      let isFirst = true;
      for (let i = 0; i < data.length; i++) {
        const pt = data[i];
        const prevPt = data[i - 1];
        
        // Check for discontinuity boundary crossing
        if (prevPt && Math.abs(pt.current - prevPt.current) > 2.0) {
          // Draw discontinuity as dashed helper, or stop path and start new
          d += ` M ${toX(pt.time)} ${toY_I(pt.current)}`;
        } else {
          if (isFirst) {
            d += `M ${toX(pt.time)} ${toY_I(pt.current)}`;
            isFirst = false;
          } else {
            d += ` L ${toX(pt.time)} ${toY_I(pt.current)}`;
          }
        }
      }
      return d;
    } else {
      let d = `M ${toX(data[0].time)} ${toY_I(data[0].current)}`;
      for (let i = 1; i < data.length; i++) {
        d += ` L ${toX(data[i].time)} ${toY_I(data[i].current)}`;
      }
      return d;
    }
  };

  // Compute tangent line geometry
  // y = v_scrub + slope * (t - t_scrub)
  const renderTangentLine = () => {
    const t_s = currentPoint.time;
    const v_s = currentPoint.voltage;
    const slope = currentPoint.slope;

    const dt = 1.2; // span on each side
    const t_a = Math.max(0, t_s - dt);
    const v_a = v_s + slope * (t_a - t_s);

    const t_b = Math.min(10, t_s + dt);
    const v_b = v_s + slope * (t_b - t_s);

    return (
      <line
        id="tangent-line"
        x1={toX(t_a)}
        y1={toY_V(v_a)}
        x2={toX(t_b)}
        y2={toY_V(v_b)}
        stroke="#ef4444"
        strokeWidth="2.5"
        strokeDasharray="4 4"
      />
    );
  };

  // Render a small slope visualization triangle (rise / run)
  const renderSlopeTriangle = () => {
    const t_s = currentPoint.time;
    const v_s = currentPoint.voltage;
    const slope = currentPoint.slope;

    // Triangle horizontal run
    const run = 0.8;
    if (t_s + run > 10.1) return null;

    const rise = slope * run;
    
    const xBase = toX(t_s);
    const xEnd = toX(t_s + run);
    const yBase = toY_V(v_s);
    const yEnd = toY_V(v_s + rise);

    return (
      <g id="slope-triangle" className="opacity-85">
        {/* Horizontal run leg */}
        <line
          x1={xBase}
          y1={yBase}
          x2={xEnd}
          y2={yBase}
          stroke="#ef4444"
          strokeWidth="1.5"
          strokeDasharray="2 2"
        />
        {/* Vertical rise leg */}
        <line
          x1={xEnd}
          y1={yBase}
          x2={xEnd}
          y2={yEnd}
          stroke="#10b981"
          strokeWidth="2.5"
        />
        {/* Tiny labels */}
        <text
          x={(xBase + xEnd) / 2}
          y={yBase + (rise >= 0 ? 12 : -6)}
          fontSize="10"
          className="fill-red-500 font-mono text-center"
          textAnchor="middle"
        >
          Δt = {run}s
        </text>
        <text
          x={xEnd + 5}
          y={(yBase + yEnd) / 2 + 3}
          fontSize="10"
          className="fill-emerald-600 font-mono"
          textAnchor="start"
        >
          ΔV = {rise.toFixed(2)}V
        </text>
      </g>
    );
  };

  return (
    <div className="flex flex-col gap-6" id="calculus-graph-panel">
      {/* Simulation Playback controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            id="play-pause-btn"
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all shadow-sm ${
              isPlaying
                ? 'bg-amber-600 text-white hover:bg-amber-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause size={16} /> Pausar Simulación
              </>
            ) : (
              <>
                <Play size={16} /> Iniciar Recorrido (Tiempo)
              </>
            )}
          </button>
          <button
            id="reset-time-btn"
            onClick={() => {
              setIsPlaying(false);
              setCurrentTime(0);
            }}
            title="Reiniciar tiempo"
            className="p-2 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors shadow-xs"
          >
            <RotateCcw size={16} />
          </button>
          <span className="text-slate-700 font-mono text-sm bg-white border border-slate-200 px-3 py-1.5 rounded-md shadow-xs">
            t = <strong className="text-blue-600">{currentTime.toFixed(2)}</strong> s / 10s
          </span>
        </div>

        {/* Custom Preset Style selector (Linear vs Smooth) */}
        {preset === 'custom' && (
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1 text-xs shadow-xs">
            <span className="text-slate-500 font-medium px-2">Interpolación:</span>
            <button
              id="custom-linear-btn"
              onClick={() => setCustomStyle('linear')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                customStyle === 'linear'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Lineal por tramos
            </button>
            <button
              id="custom-smooth-btn"
              onClick={() => setCustomStyle('smooth')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                customStyle === 'smooth'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Curva suave
            </button>
          </div>
        )}

        <div className="flex items-center gap-3 text-xs font-mono text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-blue-500 rounded-full inline-block"></span>
            Voltaje (V)
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-amber-500 rounded-full inline-block"></span>
            Corriente (I)
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-0.5 border-t border-dashed border-red-500 inline-block"></span>
            Derivada dV/dt (Pendiente)
          </div>
        </div>
      </div>

      {/* GRAPH 1: VOLTAGE */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative flex flex-col gap-2">
        <div className="flex justify-between items-center px-2">
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            Gráfica de Entrada: Voltaje del Capacitor <span className="font-mono text-blue-600 font-semibold">V(t)</span>
          </h3>
          <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md">
            Voltaje Instantáneo: <strong className="text-blue-600 text-sm">{currentPoint.voltage.toFixed(2)} V</strong>
          </span>
        </div>

        <div className="relative select-none" ref={containerRef}>
          <svg
            id="voltage-graph-svg"
            ref={vGraphRef}
            viewBox={`0 0 ${svgW} ${svgH}`}
            className="w-full h-auto cursor-crosshair overflow-visible touch-none"
            onPointerDown={handleVGraphPointerDown}
            onPointerMove={handleVGraphPointerMove}
            onPointerUp={handleVGraphPointerUp}
          >
            {/* Background Grid Lines */}
            <g id="grid-lines" stroke="#e2e8f0" strokeWidth="1">
              {/* Horizontal Volt grid lines */}
              <line x1={padL} y1={toY_V(4)} x2={svgW - padR} y2={toY_V(4)} strokeDasharray="3 3" />
              <line x1={padL} y1={toY_V(2)} x2={svgW - padR} y2={toY_V(2)} strokeDasharray="3 3" />
              <line x1={padL} y1={toY_V(0)} x2={svgW - padR} y2={toY_V(0)} strokeWidth="1.5" stroke="#cbd5e1" />
              <line x1={padL} y1={toY_V(-2)} x2={svgW - padR} y2={toY_V(-2)} strokeDasharray="3 3" />
              <line x1={padL} y1={toY_V(-4)} x2={svgW - padR} y2={toY_V(-4)} strokeDasharray="3 3" />

              {/* Vertical time grid lines every 1 sec */}
              {Array.from({ length: 9 }).map((_, idx) => {
                const sec = idx + 1;
                return (
                  <line
                    key={`v-grid-${sec}`}
                    x1={toX(sec)}
                    y1={padT}
                    x2={toX(sec)}
                    y2={svgH - padB}
                    strokeDasharray="2 2"
                  />
                );
              })}
            </g>

            {/* Y-Axis Labels */}
            <g id="y-axis-labels" className="font-mono text-[11px] fill-slate-500" textAnchor="end">
              <text x={padL - 10} y={toY_V(4) + 4}>+4V</text>
              <text x={padL - 10} y={toY_V(2) + 4}>+2V</text>
              <text x={padL - 10} y={toY_V(0) + 4}>0V</text>
              <text x={padL - 10} y={toY_V(-2) + 4}>-2V</text>
              <text x={padL - 10} y={toY_V(-4) + 4}>-4V</text>
            </g>

            {/* X-Axis Labels */}
            <g id="x-axis-labels" className="font-mono text-[11px] fill-slate-500" textAnchor="middle">
              <text x={toX(0)} y={svgH - padB + 18}>0s</text>
              <text x={toX(2.5)} y={svgH - padB + 18}>2.5s</text>
              <text x={toX(5)} y={svgH - padB + 18}>5.0s</text>
              <text x={toX(7.5)} y={svgH - padB + 18}>7.5s</text>
              <text x={toX(10)} y={svgH - padB + 18}>10s</text>
              <text x={svgW / 2 + 15} y={svgH - 2} className="fill-slate-600 font-sans text-xs">
                Tiempo t (segundos)
              </text>
            </g>

            {/* Voltage Waveform Path */}
            <path
              id="voltage-curve"
              d={generateVPath()}
              fill="none"
              stroke="#0284c7"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Tangent line at current position */}
            {renderTangentLine()}

            {/* Slope Rise/Run Triangle */}
            {renderSlopeTriangle()}

            {/* Tangent point dot */}
            <circle
              id="tangent-point-dot"
              cx={toX(currentPoint.time)}
              cy={toY_V(currentPoint.voltage)}
              r="5"
              fill="#ef4444"
              stroke="white"
              strokeWidth="2"
              className="shadow-xs"
            />

            {/* Drag handles for custom nodes (only if preset is custom) */}
            {preset === 'custom' &&
              customPoints.map((pt) => {
                const tVal = (pt.x / 100) * 10;
                const px = toX(tVal);
                const py = toY_V(pt.y);
                const isHovered = activeDragPointId === pt.id;
                return (
                  <g key={`handle-${pt.id}`} className="group cursor-ns-resize">
                    <circle
                      cx={px}
                      cy={py}
                      r="16"
                      fill="transparent"
                      className="transition-colors group-hover:fill-blue-50/20"
                    />
                    <circle
                      cx={px}
                      cy={py}
                      r={isHovered ? "9" : "7"}
                      fill="#0284c7"
                      stroke="white"
                      strokeWidth="2"
                      className="transition-all duration-150 shadow-md group-hover:scale-125"
                    />
                    <text
                      x={px}
                      y={py - 12}
                      fontSize="9"
                      className="fill-slate-700 font-mono font-bold"
                      textAnchor="middle"
                    >
                      {pt.y}V
                    </text>
                  </g>
                );
              })}

            {/* Vertical Time Scrubber */}
            <line
              id="scrubber-line"
              x1={toX(currentTime)}
              y1={padT - 5}
              x2={toX(currentTime)}
              y2={svgH - padB}
              stroke="#64748b"
              strokeWidth="1.5"
            />
            {/* Scrubber Handle */}
            <rect
              x={toX(currentTime) - 8}
              y={padT - 10}
              width="16"
              height="10"
              rx="3"
              fill="#64748b"
              className="cursor-ew-resize"
            />
          </svg>
        </div>

        {preset === 'custom' && (
          <p className="text-[11px] text-slate-500 italic px-2 text-center mt-1">
            💡 <strong>Arrastra los puntos azules</strong> hacia arriba o abajo en la gráfica para rediseñar la onda de voltaje V(t). El sistema recalculará instantáneamente su derivada para graficar la corriente.
          </p>
        )}
      </div>

      {/* GRAPH 2: CURRENT */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative flex flex-col gap-2">
        <div className="flex justify-between items-center px-2">
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            Gráfica de Salida (Derivada Escalada): Corriente del Capacitor <span className="font-mono text-amber-600 font-semibold">I(t) = C · dV/dt</span>
          </h3>
          <span className="text-xs font-mono bg-amber-50 text-amber-800 px-2.5 py-1 rounded-md border border-amber-200">
            Corriente Instantánea: <strong className="text-amber-600 text-sm">{currentPoint.current >= 0 ? '+' : ''}{currentPoint.current.toFixed(3)} mA</strong>
          </span>
        </div>

        <div className="relative select-none">
          <svg
            id="current-graph-svg"
            ref={iGraphRef}
            viewBox={`0 0 ${svgW} ${svgH}`}
            className="w-full h-auto cursor-ew-resize overflow-visible touch-none"
            onPointerDown={handleIGraphPointerDown}
            onPointerMove={handleIGraphPointerMove}
            onPointerUp={handleIGraphPointerUp}
          >
            {/* Background Grid Lines */}
            <g id="grid-lines-i" stroke="#e2e8f0" strokeWidth="1">
              {/* Horizontal Current lines scaled to displayMaxI */}
              <line x1={padL} y1={toY_I(displayMaxI * 0.8)} x2={svgW - padR} y2={toY_I(displayMaxI * 0.8)} strokeDasharray="3 3" />
              <line x1={padL} y1={toY_I(displayMaxI * 0.4)} x2={svgW - padR} y2={toY_I(displayMaxI * 0.4)} strokeDasharray="3 3" />
              <line x1={padL} y1={toY_I(0)} x2={svgW - padR} y2={toY_I(0)} strokeWidth="1.5" stroke="#cbd5e1" />
              <line x1={padL} y1={toY_I(-displayMaxI * 0.4)} x2={svgW - padR} y2={toY_I(-displayMaxI * 0.4)} strokeDasharray="3 3" />
              <line x1={padL} y1={toY_I(-displayMaxI * 0.8)} x2={svgW - padR} y2={toY_I(-displayMaxI * 0.8)} strokeDasharray="3 3" />

              {/* Vertical time grid lines */}
              {Array.from({ length: 9 }).map((_, idx) => {
                const sec = idx + 1;
                return (
                  <line
                    key={`i-grid-${sec}`}
                    x1={toX(sec)}
                    y1={padT}
                    x2={toX(sec)}
                    y2={svgH - padB}
                    strokeDasharray="2 2"
                  />
                );
              })}
            </g>

            {/* Y-Axis Labels (Current) */}
            <g id="y-axis-labels-i" className="font-mono text-[11px] fill-slate-500" textAnchor="end">
              <text x={padL - 10} y={toY_I(displayMaxI * 0.8) + 4}>+{(displayMaxI * 0.8).toFixed(2)}</text>
              <text x={padL - 10} y={toY_I(displayMaxI * 0.4) + 4}>+{(displayMaxI * 0.4).toFixed(2)}</text>
              <text x={padL - 10} y={toY_I(0) + 4}>0.00 mA</text>
              <text x={padL - 10} y={toY_I(-displayMaxI * 0.4) + 4}>-{(displayMaxI * 0.4).toFixed(2)}</text>
              <text x={padL - 10} y={toY_I(-displayMaxI * 0.8) + 4}>-{(displayMaxI * 0.8).toFixed(2)}</text>
            </g>

            {/* X-Axis Labels */}
            <g id="x-axis-labels-i" className="font-mono text-[11px] fill-slate-500" textAnchor="middle">
              <text x={toX(0)} y={svgH - padB + 18}>0s</text>
              <text x={toX(2.5)} y={svgH - padB + 18}>2.5s</text>
              <text x={toX(5)} y={svgH - padB + 18}>5.0s</text>
              <text x={toX(7.5)} y={svgH - padB + 18}>7.5s</text>
              <text x={toX(10)} y={svgH - padB + 18}>10s</text>
              <text x={svgW / 2 + 15} y={svgH - 2} className="fill-slate-600 font-sans text-xs">
                Tiempo t (segundos)
              </text>
            </g>

            {/* Current Waveform Path */}
            <path
              id="current-curve"
              d={generateIPath()}
              fill="none"
              stroke="#d97706"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* If triangle wave, render open dots representing the limits at derivative discontinuities */}
            {preset === 'triangle' && (
              <g id="discontinuity-dots">
                {/* Discontinuity points: t = 1.25, 3.75, 6.25, 8.75 */}
                {[1.25, 3.75, 6.25, 8.75].map((tDis, index) => {
                  const slopePos = 3.2; // positive current mA approx
                  const slopeNeg = -3.2; // negative current mA approx
                  const xPos = toX(tDis);

                  return (
                    <g key={`disc-${index}`}>
                      <line
                        x1={xPos}
                        y1={toY_I(slopePos)}
                        x2={xPos}
                        y2={toY_I(slopeNeg)}
                        stroke="#94a3b8"
                        strokeWidth="1"
                        strokeDasharray="2 2"
                      />
                      <circle cx={xPos} cy={toY_I(slopePos)} r="4" fill="white" stroke="#d97706" strokeWidth="1.5" />
                      <circle cx={xPos} cy={toY_I(slopeNeg)} r="4" fill="white" stroke="#d97706" strokeWidth="1.5" />
                    </g>
                  );
                })}
              </g>
            )}

            {/* Live active current dot */}
            <circle
              id="current-point-dot"
              cx={toX(currentPoint.time)}
              cy={toY_I(currentPoint.current)}
              r="6"
              fill="#d97706"
              stroke="white"
              strokeWidth="2"
              className="animate-pulse shadow-md"
            />

            {/* Vertical Time Scrubber */}
            <line
              id="scrubber-line-i"
              x1={toX(currentTime)}
              y1={padT - 5}
              x2={toX(currentTime)}
              y2={svgH - padB}
              stroke="#64748b"
              strokeWidth="1.5"
            />
          </svg>
        </div>
        <div className="flex justify-between items-center text-xs text-slate-500 px-2 mt-1">
          <span>Relación física: <strong>I(t) = C · (dV/dt)</strong></span>
          <span className="font-mono text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
            dV/dt actual = {currentPoint.slope.toFixed(2)} V/s
          </span>
        </div>
      </div>
    </div>
  );
}
