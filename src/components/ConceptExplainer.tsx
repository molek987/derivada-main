/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BookOpen, GraduationCap, Percent, HelpCircle, Activity, HeartPulse } from 'lucide-react';

export default function ConceptExplainer() {
  const [activeTab, setActiveTab] = useState<'calculo' | 'fisica' | 'puntos-criticos' | 'aplicaciones'>('calculo');

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-6" id="concept-explainer-panel">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <GraduationCap className="text-blue-600" size={24} />
        <div>
          <h2 className="text-base font-bold text-slate-900">Lección Teórica: La Derivada en Acción</h2>
          <p className="text-xs text-slate-500">¿Por qué la física de circuitos depende del cálculo diferencial?</p>
        </div>
      </div>

      {/* Concept Tabs */}
      <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl text-xs font-medium">
        <button
          id="tab-calculo"
          onClick={() => setActiveTab('calculo')}
          className={`flex-1 min-w-[100px] text-center py-2.5 rounded-lg transition-colors ${
            activeTab === 'calculo'
              ? 'bg-white text-blue-600 shadow-xs font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          🧮 Definición Matemática
        </button>
        <button
          id="tab-fisica"
          onClick={() => setActiveTab('fisica')}
          className={`flex-1 min-w-[100px] text-center py-2.5 rounded-lg transition-colors ${
            activeTab === 'fisica'
              ? 'bg-white text-blue-600 shadow-xs font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          ⚡ Relación Física
        </button>
        <button
          id="tab-puntos-criticos"
          onClick={() => setActiveTab('puntos-criticos')}
          className={`flex-1 min-w-[100px] text-center py-2.5 rounded-lg transition-colors ${
            activeTab === 'puntos-criticos'
              ? 'bg-white text-blue-600 shadow-xs font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          🎯 Puntos Críticos
        </button>
        <button
          id="tab-aplicaciones"
          onClick={() => setActiveTab('aplicaciones')}
          className={`flex-1 min-w-[100px] text-center py-2.5 rounded-lg transition-colors ${
            activeTab === 'aplicaciones'
              ? 'bg-white text-blue-600 shadow-xs font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          💡 Aplicaciones Reales
        </button>
      </div>

      {/* Tab Contents */}
      <div className="text-sm text-slate-600 leading-relaxed min-h-[220px]" id="explainer-content">
        {activeTab === 'calculo' && (
          <div className="flex flex-col gap-4 animate-fadeIn" id="content-calculo">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <span className="bg-blue-100 text-blue-700 w-5 h-5 rounded-full flex items-center justify-center text-xs">1</span>
              La derivada como razón de cambio instantánea
            </h3>
            <p>
              En cálculo, la derivada de una función &quot;f(t)&quot; en el instante &quot;t&quot; representa la{' '}
              <strong>tasa de cambio instantánea</strong> con la que cambia la variable dependiente respecto a la independiente (el tiempo).
            </p>

            {/* Formula Block */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 my-2 font-mono text-center relative overflow-hidden flex flex-col items-center justify-center">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
              <span className="text-xs text-slate-400 mb-1">Definición matemática formal (Límite):</span>
              <span className="text-base text-slate-800 font-bold block">
                V&apos;(t) = <span className="text-blue-600">dV/dt</span> = lim<sub>Δt → 0</sub> [V(t + Δt) - V(t)] / Δt
              </span>
              <span className="text-xs text-slate-500 mt-2">
                Geométricamente: representa la <strong>pendiente de la recta tangente</strong> a la curva de Voltaje &quot;V(t)&quot; en cualquier instante.
              </span>
            </div>

            <p>
              Observa que la recta roja discontinua en la gráfica superior es exactamente la tangente. A medida que avanzas el tiempo (o arrastras el control deslizante),{' '}
              <strong>la pendiente de esta recta cambia</strong>. Ese valor de la pendiente es exactamente el que se multiplica para dibujar la corriente abajo.
            </p>
          </div>
        )}

        {activeTab === 'fisica' && (
          <div className="flex flex-col gap-4 animate-fadeIn" id="content-fisica">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <span className="bg-amber-100 text-amber-700 w-5 h-5 rounded-full flex items-center justify-center text-xs">2</span>
              La física del capacitor y la Ley de Corriente
            </h3>
            <p>
              Un capacitor es un componente pasivo que almacena energía en forma de un campo eléctrico entre dos placas conductoras. La cantidad de carga acumulada es proporcional al voltaje aplicado:
            </p>

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 font-mono text-center relative overflow-hidden flex flex-col items-center justify-center">
              <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
              <span className="text-xs text-slate-400 mb-1">Ecuación de la carga y corriente derivada:</span>
              <span className="text-base text-slate-800 font-bold block mb-1">
                Q(t) = C · V(t) &nbsp;<span className="text-slate-400">| Diferenciando ambos lados...</span>
              </span>
              <span className="text-base text-amber-600 font-bold block">
                I(t) = dQ/dt = C · (dV/dt)
              </span>
              <span className="text-[11px] text-slate-500 mt-2 block">
                Donde: <strong>I</strong> es la corriente (Amperes), <strong>C</strong> es la capacitancia (Faradios), y <strong>dV/dt</strong> es la derivada instantánea del voltaje.
              </span>
            </div>

            <p>
              Esto significa que el capacitor es un <strong>bloque derivador físico</strong>. No reacciona al valor absoluto del voltaje, sino a la velocidad con la que este cambia. Si el voltaje no cambia (&quot;dV/dt = 0&quot;), no pasa corriente, sirviendo como un &quot;circuito abierto&quot; para corriente directa (C.D.).
            </p>
          </div>
        )}

        {activeTab === 'puntos-criticos' && (
          <div className="flex flex-col gap-4 animate-fadeIn" id="content-puntos-criticos">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <span className="bg-red-100 text-red-700 w-5 h-5 rounded-full flex items-center justify-center text-xs">3</span>
              Puntos críticos y propiedades geométricas clave
            </h3>
            <p>
              La simulación es ideal para conectar conceptos fundamentales de Cálculo 1 con comportamientos físicos del circuito:
            </p>
            
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1 text-xs">
              <li className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <strong className="text-blue-600 block mb-1">🎯 Picos y Valles (Derivada Cero)</strong>
                Cuando el voltaje <span className="font-mono text-blue-600">V(t)</span> alcanza un máximo o mínimo local, su derivada es nula (<span className="font-mono">dV/dt = 0</span>). Físicamente, la corriente se anula por completo (<span className="font-mono">I = 0</span>). ¡Compruébalo pausando la simulación senoidal justo en sus picos!
              </li>
              <li className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <strong className="text-emerald-600 block mb-1">📈 Cruces por Cero (Cambio Máximo)</strong>
                En una onda senoidal, la pendiente de subida o bajada es máxima cuando cruza por <span className="font-mono">0 V</span>. En ese instante de máxima tasa de cambio, la corriente alcanza su pico absoluto (positivo o negativo).
              </li>
              <li className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <strong className="text-amber-600 block mb-1">⚡ Esquinas (No-derivabilidad)</strong>
                En la onda triangular, los picos son afilados. Geométricamente son esquinas de no-derivabilidad. Al cambiar instantáneamente la pendiente, la corriente da un salto brusco (discontinuidad de salto).
              </li>
              <li className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <strong className="text-purple-600 block mb-1">📈 Curvas Exponenciales (Autoderivada)</strong>
                En el preset de Carga de Capacitor (RC), se observa que <span className="font-mono text-blue-600">V(t) = V₀(1 − e<sup>−t/τ</sup>)</span>. Su derivada es otra exponencial decreciente. Al principio sube rápido (alta corriente) y al final se estabiliza (corriente a cero).
              </li>
            </ul>
          </div>
        )}

        {activeTab === 'aplicaciones' && (
          <div className="flex flex-col gap-4 animate-fadeIn" id="content-aplicaciones">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <span className="bg-purple-100 text-purple-700 w-5 h-5 rounded-full flex items-center justify-center text-xs">4</span>
              El capacitor como pilar de la tecnología moderna
            </h3>
            <p>
              La relación matemática entre la derivada del voltaje y la corriente se explota a diario en ingeniería y medicina:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-2 text-xs">
              <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 flex flex-col gap-1">
                <span className="font-bold text-blue-700 flex items-center gap-1">
                  <Activity size={14} /> Filtros de Frecuencia
                </span>
                <p className="text-slate-600 leading-normal">
                  Al atenuar bajas o altas frecuencias, permiten separar el ruido eléctrico de la música, señales de radio, wifi y datos telefónicos.
                </p>
              </div>
              <div className="bg-amber-50/50 p-3 rounded-lg border border-amber-100 flex flex-col gap-1">
                <span className="font-bold text-amber-700 flex items-center gap-1">
                  <HeartPulse size={14} /> Desfibriladores
                </span>
                <p className="text-slate-600 leading-normal">
                  Cargan un capacitor lentamente con voltaje constante, y lo descargan instantáneamente en el pecho del paciente (altísima derivada <span className="font-mono">dV/dt</span>, lo que genera un pulso de alta corriente) para reiniciar el corazón.
                </p>
              </div>
              <div className="bg-purple-50/50 p-3 rounded-lg border border-purple-100 flex flex-col gap-1">
                <span className="font-bold text-purple-700 flex items-center gap-1">
                  <BookOpen size={14} /> Pantallas Táctiles
                </span>
                <p className="text-slate-600 leading-normal">
                  La pantalla detecta la capacitancia de tu dedo al tocar el panel de vidrio, calculando la derivada del flujo eléctrico para ubicar tu pulsación.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
