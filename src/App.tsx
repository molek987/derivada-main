/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { PresetType, ControlPoint, SimulationDataPoint } from './types';
import { generateSimulationData } from './utils';
import CalculusGraph from './components/CalculusGraph';
import CircuitSchematic from './components/CircuitSchematic';
import ConceptExplainer from './components/ConceptExplainer';
import ChallengePanel from './components/ChallengePanel';
import { Zap, Sliders, Info, HelpCircle, BookOpen, GraduationCap, Sparkles } from 'lucide-react';

export default function App() {
  // 1. Core State
  const [preset, setPreset] = useState<PresetType>('sine');
  const [capacitance, setCapacitance] = useState<number>(150); // in uF
  const [currentTime, setCurrentTime] = useState<number>(2.0); // in seconds, current scrubber location
  const [isPlaying, setIsPlaying] = useState<boolean>(true); // animates by default

  // Custom waveform spline control points
  const [customPoints, setCustomPoints] = useState<ControlPoint[]>([
    { id: 1, x: 0, y: 0 },
    { id: 2, x: 25, y: 4.0 },
    { id: 3, x: 50, y: -2.0 },
    { id: 4, x: 75, y: 3.0 },
    { id: 5, x: 100, y: 0 },
  ]);
  const [customStyle, setCustomStyle] = useState<'smooth' | 'linear'>('smooth');

  // 2. Generate entire dataset whenever preset, points, style, or capacitance changes
  const simulationData = useMemo(() => {
    return generateSimulationData(preset, customPoints, customStyle, capacitance);
  }, [preset, customPoints, customStyle, capacitance]);

  // 3. Find active metrics at the current scrubber time
  const currentPoint = useMemo(() => {
    const idx = Math.min(
      simulationData.length - 1,
      Math.max(0, Math.round((currentTime / 10) * (simulationData.length - 1)))
    );
    return simulationData[idx] || { time: currentTime, voltage: 0, current: 0, slope: 0 };
  }, [simulationData, currentTime]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col antialiased selection:bg-blue-100" id="main-layout">
      {/* HEADER BAR */}
      <header className="bg-slate-900 text-white border-b border-slate-800 py-5 px-6 shrink-0 shadow-md relative overflow-hidden" id="app-header">
        {/* Subtle decorative grid overlay to look technical/premium */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500 text-white p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
              <Zap size={24} className="fill-blue-100 text-blue-900 animate-pulse" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Cálculo I • Aplicaciones de la Derivada
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">
                  Grupo VI, Módulo IV: Competencias Docentes • 24-Jun-2026
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight mt-0.5">
                Derivadas en Circuitos Eléctricos
              </h1>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs font-mono bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
            <div>
              <span className="text-slate-400">Ecuación Rectora:</span>{' '}
              <strong className="text-amber-400">I(t) = C · (dV/dt)</strong>
            </div>
            <div className="hidden sm:block text-slate-600">|</div>
            <div>
              <span className="text-slate-400">Tasa de Cambio:</span>{' '}
              <strong className="text-blue-400">Corriente ∝ Pendiente</strong>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col gap-6" id="app-main-content">
        
        {/* CONCEPT EXPLAINER CHAPTERS */}
        <ConceptExplainer />
        
        {/* TOP DESCRIPTION HERO */}
        <section className="bg-gradient-to-r from-blue-50 to-indigo-50/50 rounded-2xl border border-blue-100 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs" id="intro-hero">
          <div className="flex-1">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <GraduationCap className="text-blue-600" size={18} />
              Laboratorio Matemático-Físico: El Capacitor como Derivador
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed mt-1">
              Esta simulación interactiva demuestra el concepto de <strong>derivada</strong> mediante el comportamiento de un capacitor eléctrico. 
              En física, la corriente <strong className="text-amber-700 font-mono">I(t)</strong> es la derivada instantánea del voltaje respecto al tiempo, escalada por la capacitancia <strong className="text-slate-900 font-mono">C</strong>. 
              Explora las ondas predeterminadas o dibuja tu propio voltaje para ver cómo la corriente responde instantáneamente a las tasas de cambio de voltaje.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 bg-white/80 border border-blue-100 px-3.5 py-2.5 rounded-xl shadow-xs text-xs">
            <Info size={16} className="text-blue-500 shrink-0" />
            <span className="text-slate-700 font-medium">
              Arrastra el marcador <strong className="text-slate-950">gris</strong> en las gráficas para analizar instantes.
            </span>
          </div>
        </section>

        {/* INTERACTIVE WORKSPACE GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="workspace-grid">
          
          {/* LEFT 2/3 COLUMN: DUAL AXIS GRAPH VISUALIZER */}
          <section className="lg:col-span-2 flex flex-col gap-4" id="graphs-section">
            <CalculusGraph
              data={simulationData}
              currentTime={currentTime}
              setCurrentTime={setCurrentTime}
              preset={preset}
              customPoints={customPoints}
              setCustomPoints={setCustomPoints}
              customStyle={customStyle}
              setCustomStyle={setCustomStyle}
              capacitance={capacitance}
              isPlaying={isPlaying}
              setIsPlaying={setIsPlaying}
            />
          </section>

          {/* RIGHT 1/3 COLUMN: CONTROLS, SCHEMATIC & PARAMETERS */}
          <section className="flex flex-col gap-6" id="sidebar-controls">
            
            {/* PANEL 2: CIRCUIT MODEL SCHEMATIC WITH LIVE VARIABLE METRICS */}
            <CircuitSchematic
              voltage={currentPoint.voltage}
              current={currentPoint.current}
              capacitance={capacitance}
            />

            {/* PANEL 1: PRESET WAVEFORM SELECTOR */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4" id="waveforms-selector">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sliders size={14} className="text-slate-500" />
                1. Selecciona Onda de Voltaje V(t)
              </h3>
              
              <div className="flex flex-col gap-2">
                {/* Sine preset */}
                <button
                  id="preset-sine-btn"
                  onClick={() => {
                    setPreset('sine');
                    setIsPlaying(true);
                  }}
                  className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                    preset === 'sine'
                      ? 'border-blue-500 bg-blue-50/40 text-blue-950 shadow-xs'
                      : 'border-slate-150 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">📈</span>
                    <div>
                      <strong className="text-xs block">Onda Senoidal</strong>
                      <span className="text-[10px] text-slate-500 font-mono">V(t) = 4·sen(2π f t)</span>
                    </div>
                  </div>
                  <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded-md">
                    Derivada Suave
                  </span>
                </button>

                {/* Triangle preset */}
                <button
                  id="preset-triangle-btn"
                  onClick={() => {
                    setPreset('triangle');
                    setIsPlaying(true);
                  }}
                  className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                    preset === 'triangle'
                      ? 'border-blue-500 bg-blue-50/40 text-blue-950 shadow-xs'
                      : 'border-slate-150 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">📐</span>
                    <div>
                      <strong className="text-xs block">Onda Triangular</strong>
                      <span className="text-[10px] text-slate-500 font-mono">Pendiente constante ±k</span>
                    </div>
                  </div>
                  <span className="text-[10px] bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded-md">
                    No-Derivable (Esquinas)
                  </span>
                </button>

                {/* RC Charging preset */}
                <button
                  id="preset-rc-btn"
                  onClick={() => {
                    setPreset('rc');
                    setIsPlaying(true);
                  }}
                  className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                    preset === 'rc'
                      ? 'border-blue-500 bg-blue-50/40 text-blue-950 shadow-xs'
                      : 'border-slate-150 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">📈</span>
                    <div>
                      <strong className="text-xs block">Respuesta Paso RC</strong>
                      <span className="text-[10px] text-slate-500 font-mono">Carga exponencial V₀(1-e^-t/τ)</span>
                    </div>
                  </div>
                  <span className="text-[10px] bg-purple-100 text-purple-700 font-bold px-1.5 py-0.5 rounded-md">
                    Exponencial
                  </span>
                </button>

                {/* Smoothed square preset */}
                <button
                  id="preset-smooth-square-btn"
                  onClick={() => {
                    setPreset('smooth-square');
                    setIsPlaying(true);
                  }}
                  className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                    preset === 'smooth-square'
                      ? 'border-blue-500 bg-blue-50/40 text-blue-950 shadow-xs'
                      : 'border-slate-150 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">🎛️</span>
                    <div>
                      <strong className="text-xs block">Onda Cuadrada Suave</strong>
                      <span className="text-[10px] text-slate-500 font-mono">Transición rápida (Sigmoide)</span>
                    </div>
                  </div>
                  <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded-md">
                    Derivada en Impulso
                  </span>
                </button>

                {/* Custom waveform */}
                <button
                  id="preset-custom-btn"
                  onClick={() => {
                    setPreset('custom');
                    setIsPlaying(false); // Let them play with custom points manually
                  }}
                  className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                    preset === 'custom'
                      ? 'border-blue-500 bg-blue-50/40 text-blue-950 shadow-xs'
                      : 'border-slate-150 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">🎨</span>
                    <div>
                      <strong className="text-xs block">Voltaje Personalizado</strong>
                      <span className="text-[10px] text-slate-500 font-mono">Arrastra y crea tu propia onda</span>
                    </div>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                    <Sparkles size={10} /> Táctil
                  </span>
                </button>
              </div>
            </div>

            {/* PANEL 3: CONSTANT MULTIPLIER CONTROLLER (CAPACITANCE SLIDER) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4" id="capacitance-slider-panel">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <span>⚙️</span> Ajustar Parámetro de Escala (Capacitancia C)
                </h3>
                <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                  C = {capacitance} µF
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <input
                  id="capacitance-slider"
                  type="range"
                  min="10"
                  max="500"
                  step="10"
                  value={capacitance}
                  onChange={(e) => setCapacitance(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-hidden"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>10 µF (Poco sensible)</span>
                  <span>500 µF (Gran amplificación)</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                📌 <strong>Significado de C en Cálculo:</strong> En la ecuación de la corriente, la capacitancia es el{' '}
                <strong className="text-slate-800">coeficiente multiplicativo</strong> (factor de escala) de la derivada:{' '}
                <span className="font-mono text-slate-700">I = C · (dV/dt)</span>. Al aumentar la capacitancia, mantienes la misma curva de voltaje pero amplificas verticalmente la curva de corriente en la gráfica.
              </div>
            </div>

          </section>
        </div>

        {/* BOTTOM SECTION: QUIZ CHALLENGE */}
        <div id="quiz-challenge-container">
          {/* INTERACTIVE CHALLENGE QUIZ PANEL */}
          <ChallengePanel />
        </div>

      </main>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-6 px-6 border-t border-slate-800 text-center text-xs mt-auto" id="app-footer">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          <p>
            Desarrollado para clases de <strong>Cálculo Integral y Diferencial (Cálculo 1)</strong> • Tema: Aplicaciones de la Derivada.
          </p>
          <p className="font-mono text-[11px] text-slate-500">
            Relación de Variables: q(t) = C · v(t) ⇒ i(t) = C · v&apos;(t)
          </p>
        </div>
      </footer>
    </div>
  );
}
