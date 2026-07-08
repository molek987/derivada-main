/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from 'react';
import { Sparkles, Eye, Zap } from 'lucide-react';

interface CircuitSchematicProps {
  voltage: number;   // Current voltage in V
  current: number;   // Current current in mA
  capacitance: number; // Capacitance in uF
}

export default function CircuitSchematic({ voltage, current, capacitance }: CircuitSchematicProps) {
  // We track the electron offset manually so they flow at a speed proportional to the actual current
  const [electronOffset, setElectronOffset] = useState(0);
  const lastTimeRef = useRef<number | null>(null);

  // Accumulate electron flow over time based on the active current
  useEffect(() => {
    let animId: number;

    const tick = (now: number) => {
      if (lastTimeRef.current !== null) {
        const delta = (now - lastTimeRef.current) / 1000; // in seconds
        
        // Speed of electrons: let 1 mA correspond to 120 pixels/second
        // Positive current = clockwise electron flow
        const speed = current * 120; 
        setElectronOffset((prev) => {
          let next = prev + speed * delta;
          // Loop offset within a sensible window [0, 1000]
          if (next > 1000) next -= 1000;
          if (next < -1000) next += 1000;
          return next;
        });
      }
      lastTimeRef.current = now;
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(animId);
      lastTimeRef.current = null;
    };
  }, [current]);

  // Dimension helpers
  const svgW = 480;
  const svgH = 260;

  // Let's define the positions for the loop
  // Voltage source on left at (90, 130)
  // Capacitor on right (plates at y=100 and y=160, center x=340)
  const sourceX = 90;
  const sourceY = 130;
  const capacitorX = 350;
  const topPlateY = 100;
  const bottomPlateY = 160;

  // Wires coordinates for drawing the path
  const topWirePath = `M ${sourceX} ${sourceY - 30} V 60 H ${capacitorX} V ${topPlateY}`;
  const bottomWirePath = `M ${capacitorX} ${bottomPlateY} V 200 H ${sourceX} V ${sourceY + 30}`;

  // Electrons: we place multiple dots along the wire paths
  // A simple function to interpolate coordinates along a rectangular wire loop
  // Path 1 (Top wire: from Source to Top Plate)
  // Points: (90, 100) -> (90, 60) -> (350, 60) -> (350, 100)
  // Total length = 40 + 260 + 40 = 340
  const getTopWirePoint = (offsetVal: number) => {
    const segments = [
      { start: { x: sourceX, y: sourceY - 30 }, end: { x: sourceX, y: 60 }, len: 40 },
      { start: { x: sourceX, y: 60 }, end: { x: capacitorX, y: 60 }, len: 260 },
      { start: { x: capacitorX, y: 60 }, end: { x: capacitorX, y: topPlateY }, len: 40 },
    ];
    const totalLen = 340;
    
    // Normalize offset to [0, totalLen]
    let d = ((offsetVal % totalLen) + totalLen) % totalLen;
    
    for (const seg of segments) {
      if (d <= seg.len) {
        const ratio = d / seg.len;
        return {
          x: seg.start.x + (seg.end.x - seg.start.x) * ratio,
          y: seg.start.y + (seg.end.y - seg.start.y) * ratio,
        };
      }
      d -= seg.len;
    }
    return { x: capacitorX, y: topPlateY };
  };

  // Path 2 (Bottom wire: from Bottom Plate to Source)
  // Points: (350, 160) -> (350, 200) -> (90, 200) -> (90, 160)
  // Total length = 40 + 260 + 40 = 340
  const getBottomWirePoint = (offsetVal: number) => {
    const segments = [
      { start: { x: capacitorX, y: bottomPlateY }, end: { x: capacitorX, y: 200 }, len: 40 },
      { start: { x: capacitorX, y: 200 }, end: { x: sourceX, y: 200 }, len: 260 },
      { start: { x: sourceX, y: 200 }, end: { x: sourceX, y: sourceY + 30 }, len: 40 },
    ];
    const totalLen = 340;

    let d = ((offsetVal % totalLen) + totalLen) % totalLen;

    for (const seg of segments) {
      if (d <= seg.len) {
        const ratio = d / seg.len;
        return {
          x: seg.start.x + (seg.end.x - seg.start.x) * ratio,
          y: seg.start.y + (seg.end.y - seg.start.y) * ratio,
        };
      }
      d -= seg.len;
    }
    return { x: sourceX, y: sourceY + 30 };
  };

  // Generate 8 electrons for the top wire and 8 for the bottom wire
  const electronCount = 8;
  const topElectrons = Array.from({ length: electronCount }).map((_, idx) => {
    const spacing = 340 / electronCount;
    // We offset each electron and get its position
    return getTopWirePoint(electronOffset + idx * spacing);
  });

  const bottomElectrons = Array.from({ length: electronCount }).map((_, idx) => {
    const spacing = 340 / electronCount;
    // Note: electrons flow clockwise, so we keep bottom aligned
    return getBottomWirePoint(electronOffset + idx * spacing);
  });

  // Charge visualization on capacitor plates
  // Charge Q = C * V
  // Let's decide how many "+" and "-" symbols to show
  // We can scale the symbols based on voltage. Max voltage is ~4V, so say up to 8 charges
  const maxCharges = 8;
  const chargeFactor = Math.abs(voltage) / 4; // fraction of maximum charge
  const chargeCount = Math.min(maxCharges, Math.max(1, Math.round(chargeFactor * maxCharges)));
  const showCharges = Math.abs(voltage) > 0.15; // only show charges if voltage is non-trivial

  // Charge positions on top plate (x range 310 to 390)
  const plateCharges = Array.from({ length: chargeCount }).map((_, idx) => {
    const xMin = 310;
    const xMax = 390;
    const xStep = (xMax - xMin) / (maxCharges - 1);
    
    // Spread them out centered
    const offsetIndex = idx + Math.floor((maxCharges - chargeCount) / 2);
    return xMin + offsetIndex * xStep;
  });

  // Arrow indicators for electric field (pointing from + to -)
  const renderElectricField = () => {
    if (!showCharges) return null;

    const isTopPositive = voltage > 0;
    const yStart = isTopPositive ? topPlateY + 12 : bottomPlateY - 12;
    const yEnd = isTopPositive ? bottomPlateY - 12 : topPlateY + 12;
    
    // Draw 3 fields arrows
    const arrowXPositions = [325, 350, 375];
    const opacity = Math.min(1.0, Math.max(0.15, chargeFactor));

    return (
      <g id="electric-field" stroke={isTopPositive ? '#ef4444' : '#0284c7'} strokeWidth="1.5" style={{ opacity }}>
        {arrowXPositions.map((xVal, idx) => (
          <g key={`arrow-${idx}`}>
            <line
              x1={xVal}
              y1={yStart}
              x2={xVal}
              y2={yEnd}
              strokeDasharray="2 2"
            />
            {/* Arrow head */}
            <polygon
              points={
                isTopPositive
                  ? `${xVal},${yEnd} ${xVal - 4},${yEnd - 6} ${xVal + 4},${yEnd - 6}`
                  : `${xVal},${yEnd} ${xVal - 4},${yEnd + 6} ${xVal + 4},${yEnd + 6}`
              }
              fill={isTopPositive ? '#ef4444' : '#0284c7'}
            />
          </g>
        ))}
        <text
          x="400"
          y="135"
          className="fill-slate-600 font-sans font-semibold text-[11px]"
          textAnchor="start"
        >
          Campo E
        </text>
      </g>
    );
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center h-full gap-4" id="circuit-schematic-panel">
      <div className="flex justify-between items-center w-full">
        <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
          <Zap size={16} className="text-amber-500 animate-pulse" />
          Modelo Físico: Comportamiento del Capacitor
        </h3>
        <span className="text-xs bg-slate-100 text-slate-700 font-mono px-2 py-1 rounded-md">
          Capacitancia: <strong className="text-slate-950 font-bold">{capacitance} µF</strong>
        </span>
      </div>

      {/* Interactive Circuit Drawing */}
      <div className="w-full bg-slate-50 border border-slate-100 rounded-xl relative overflow-hidden flex items-center justify-center p-2">
        <svg
          id="circuit-svg"
          viewBox={`0 0 ${svgW} ${svgH}`}
          className="w-full h-auto max-w-[450px] overflow-visible"
        >
          {/* Wire loop background */}
          <g stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" fill="none">
            {/* Top Wire */}
            <path d={topWirePath} />
            {/* Bottom Wire */}
            <path d={bottomWirePath} />
          </g>

          {/* Voltage Source (Generator Circle) on Left */}
          <g transform={`translate(${sourceX}, ${sourceY})`}>
            <circle cx="0" cy="0" r="26" fill="white" stroke="#3b82f6" strokeWidth="4" className="shadow-xs" />
            
            {/* Sine waveform symbol inside source */}
            <path
              d="M -12,0 C -6,-10 0,-10 0,0 C 0,10 6,10 12,0"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            
            {/* Source Label */}
            <text x="0" y="38" className="fill-blue-600 font-mono text-[10px] font-bold" textAnchor="middle">
              {voltage.toFixed(1)} V
            </text>
            <text x="0" y="-32" className="fill-slate-500 font-sans text-[10px] font-bold" textAnchor="middle">
              Generador V(t)
            </text>
          </g>

          {/* Capacitor Plates on Right */}
          <g id="capacitor-plates">
            {/* Top Plate (Metal horizontal block) */}
            <rect x="290" y={topPlateY} width="120" height="10" rx="2" fill="#475569" stroke="#334155" strokeWidth="1" />
            <text x="415" y={topPlateY + 8} className="fill-slate-500 font-sans text-[10px]" textAnchor="start">
              Placa A
            </text>

            {/* Bottom Plate (Metal horizontal block) */}
            <rect x="290" y={bottomPlateY} width="120" height="10" rx="2" fill="#475569" stroke="#334155" strokeWidth="1" />
            <text x="415" y={bottomPlateY + 8} className="fill-slate-500 font-sans text-[10px]" textAnchor="start">
              Placa B
            </text>
            
            {/* Capacitor label */}
            <text x="350" y={topPlateY - 14} className="fill-slate-600 font-sans font-bold text-xs" textAnchor="middle">
              Capacitor (C)
            </text>
          </g>

          {/* Charge Symbols on Plates (+ and -) */}
          {showCharges && (
            <g id="charges" className="font-bold text-xs">
              {plateCharges.map((xVal, idx) => {
                const isTopPositive = voltage > 0;
                return (
                  <g key={`charge-item-${idx}`}>
                    {/* Top Plate charge label */}
                    <text
                      x={xVal}
                      y={topPlateY - 4}
                      className={isTopPositive ? 'fill-red-500' : 'fill-sky-500'}
                      textAnchor="middle"
                    >
                      {isTopPositive ? '+' : '−'}
                    </text>
                    {/* Bottom Plate charge label */}
                    <text
                      x={xVal}
                      y={bottomPlateY + 18}
                      className={isTopPositive ? 'fill-sky-500' : 'fill-red-500'}
                      textAnchor="middle"
                    >
                      {isTopPositive ? '−' : '+'}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* Electric Field Arrows */}
          {renderElectricField()}

          {/* Animated Electron dots (blue glowing circles representing negative charge carriers) */}
          <g id="electrons">
            {topElectrons.map((el, idx) => (
              <circle
                key={`top-el-${idx}`}
                cx={el.x}
                cy={el.y}
                r="4.5"
                fill="#38bdf8"
                stroke="#0284c7"
                strokeWidth="1"
                filter="drop-shadow(0 0 2px rgba(56, 189, 248, 0.8))"
              />
            ))}
            {bottomElectrons.map((el, idx) => (
              <circle
                key={`bot-el-${idx}`}
                cx={el.x}
                cy={el.y}
                r="4.5"
                fill="#38bdf8"
                stroke="#0284c7"
                strokeWidth="1"
                filter="drop-shadow(0 0 2px rgba(56, 189, 248, 0.8))"
              />
            ))}
          </g>
        </svg>

        {/* Current Direction Arrow overlay */}
        {Math.abs(current) > 0.05 && (
          <div className="absolute top-4 right-4 bg-white/90 border border-slate-200 px-2.5 py-1 rounded-md flex items-center gap-1.5 text-[11px] font-mono shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            Flujo: <strong className="text-amber-600">{current > 0 ? 'Horario (+)' : 'Antihorario (−)'}</strong>
          </div>
        )}
      </div>

      {/* Physics variables breakdown gauge panel */}
      <div className="w-full grid grid-cols-3 gap-2 text-center text-xs">
        <div className="bg-blue-50/50 rounded-lg p-2 border border-blue-100 flex flex-col justify-center">
          <span className="text-slate-500">Voltaje (V)</span>
          <strong className="text-blue-600 text-sm font-mono">{voltage.toFixed(2)} V</strong>
        </div>
        <div className="bg-amber-50/50 rounded-lg p-2 border border-amber-100 flex flex-col justify-center">
          <span className="text-slate-500">Corriente (I)</span>
          <strong className="text-amber-600 text-sm font-mono">{current.toFixed(3)} mA</strong>
        </div>
        <div className="bg-slate-100/60 rounded-lg p-2 border border-slate-200 flex flex-col justify-center">
          <span className="text-slate-500">Carga (Q = C·V)</span>
          {/* Q_nC = C_uF * V_V = Q_microCoulombs. E.g. 100uF * 4V = 400 uC */}
          <strong className="text-slate-800 text-sm font-mono">{(capacitance * voltage).toFixed(1)} µC</strong>
        </div>
      </div>

      <div className="text-[11px] text-slate-500 leading-relaxed">
        <strong>Efecto Físico de la Derivada:</strong> La corriente{' '}
        <span className="text-amber-600 font-semibold font-mono">I(t)</span> representa el flujo de electrones que se mueven para cargar o descargar las placas metálicas del capacitor. Si el voltaje está{' '}
        <span className="text-blue-600 font-bold">subiendo</span> (pendiente positiva), los electrones corren en dirección positiva. Si el voltaje es{' '}
        <span className="text-slate-700 font-semibold">constante</span> (pendiente cero), los electrones se detienen por completo, sin importar qué tan alto sea el voltaje.
      </div>
    </div>
  );
}
