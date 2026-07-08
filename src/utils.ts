/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ControlPoint, SimulationDataPoint, QuizQuestion } from './types';

// Helper for Catmull-Rom spline interpolation
export function interpolateCatmullRom(
  points: { x: number; y: number }[],
  t: number
): { y: number; dy: number } {
  const n = points.length;
  if (n === 0) return { y: 0, dy: 0 };
  if (n === 1) return { y: points[0].y, dy: 0 };

  // Clip t to the range of the points
  const tMin = points[0].x;
  const tMax = points[n - 1].x;
  const tClipped = Math.max(tMin, Math.min(tMax, t));

  // Find the interval
  let i = 0;
  while (i < n - 1 && points[i + 1].x < tClipped) {
    i++;
  }

  // Points of the interval: i and i+1
  const p0 = points[Math.max(0, i - 1)];
  const p1 = points[i];
  const p2 = points[i + 1];
  const p3 = points[Math.min(n - 1, i + 2)];

  // If we are at the boundaries, we extrapolate virtual control points
  let v0 = p0.y;
  let v1 = p1.y;
  let v2 = p2.y;
  let v3 = p3.y;

  if (i === 0) {
    v0 = p1.y - (p2.y - p1.y); // Extrapolate backward
  }
  if (i === n - 2) {
    v3 = p2.y + (p2.y - p1.y); // Extrapolate forward
  }

  const dt = p2.x - p1.x;
  if (dt === 0) return { y: p1.y, dy: 0 };

  const u = (tClipped - p1.x) / dt; // normalized coordinate in [0, 1]

  // Catmull-Rom formula:
  // y(u) = 0.5 * (u^3 * c3 + u^2 * c2 + u * c1 + c0)
  const c0 = 2 * v1;
  const c1 = -v0 + v2;
  const c2 = 2 * v0 - 5 * v1 + 4 * v2 - v3;
  const c3 = -v0 + 3 * v1 - 3 * v2 + v3;

  const y = 0.5 * (c3 * Math.pow(u, 3) + c2 * Math.pow(u, 2) + c1 * u + c0);

  // dy/du:
  const dyDu = 0.5 * (3 * c3 * Math.pow(u, 2) + 2 * c2 * u + c1);
  // dy/dt = dy/du * du/dt = dy/du * (1 / dt)
  const dy = dyDu / dt;

  return { y, dy };
}

// Helper for Piecewise Linear interpolation
export function interpolatePiecewiseLinear(
  points: { x: number; y: number }[],
  t: number
): { y: number; dy: number } {
  const n = points.length;
  if (n === 0) return { y: 0, dy: 0 };
  if (n === 1) return { y: points[0].y, dy: 0 };

  const tMin = points[0].x;
  const tMax = points[n - 1].x;
  const tClipped = Math.max(tMin, Math.min(tMax, t));

  let i = 0;
  while (i < n - 1 && points[i + 1].x < tClipped) {
    i++;
  }

  const p1 = points[i];
  const p2 = points[i + 1];
  const dt = p2.x - p1.x;

  if (dt === 0) return { y: p1.y, dy: 0 };

  const dy = (p2.y - p1.y) / dt;
  const y = p1.y + dy * (tClipped - p1.x);

  return { y, dy };
}

// Generates simulation data points from 0 to 10 seconds
export function generateSimulationData(
  preset: 'sine' | 'triangle' | 'rc' | 'smooth-square' | 'custom',
  customPoints: ControlPoint[],
  customStyle: 'smooth' | 'linear',
  capacitanceUf: number // in microFarads (C)
): SimulationDataPoint[] {
  const points: SimulationDataPoint[] = [];
  const totalSamples = 300;
  const tMax = 10;
  const C = capacitanceUf * 1e-6; // C in Farads

  for (let i = 0; i <= totalSamples; i++) {
    const t = (i / totalSamples) * tMax;
    let voltage = 0;
    let slope = 0; // dV/dt

    switch (preset) {
      case 'sine': {
        // V(t) = 4 * sin(2 * pi * f * t)
        // f = 0.2 Hz, so Period T = 5s (2 full cycles in 10s)
        const f = 0.2;
        const omega = 2 * Math.PI * f;
        voltage = 4 * Math.sin(omega * t);
        slope = 4 * omega * Math.cos(omega * t);
        break;
      }
      case 'triangle': {
        // V(t) is triangle wave, peak amplitude 4V, T = 5s
        const T = 5;
        const amplitude = 4;
        const phase = t % T;
        
        if (phase < 1.25) {
          // rise from 0 to 4V in 1.25s
          voltage = (amplitude / 1.25) * phase;
          slope = amplitude / 1.25;
        } else if (phase < 3.75) {
          // fall from 4V to -4V in 2.5s
          voltage = amplitude - (2 * amplitude / 2.5) * (phase - 1.25);
          slope = -2 * amplitude / 2.5;
        } else {
          // rise from -4V to 0 in 1.25s (at phase = 5.0)
          voltage = -amplitude + (amplitude / 1.25) * (phase - 3.75);
          slope = amplitude / 1.25;
        }
        break;
      }
      case 'rc': {
        // Charging and discharging curves
        // V(t) = 4 * (1 - e^(-t / tau)) for t < 5
        // V(t) = 4 * e^(-(t-5) / tau) for t >= 5
        const tau = 1.2;
        const V0 = 4;
        if (t < 5) {
          voltage = V0 * (1 - Math.exp(-t / tau));
          slope = (V0 / tau) * Math.exp(-t / tau);
        } else {
          voltage = V0 * (1 - Math.exp(-5 / tau)) * Math.exp(-(t - 5) / tau);
          slope = -(V0 * (1 - Math.exp(-5 / tau)) / tau) * Math.exp(-(t - 5) / tau);
        }
        break;
      }
      case 'smooth-square': {
        // Smoothed square wave using tanh transition
        // Rises smoothly at t=2.5s and falls smoothly at t=7.5s
        // V(t) = -3.5 + 7 / (1 + e^-5(t-2.5)) - 7 / (1 + e^-5(t-7.5))
        const k = 6.0; // sharpness
        const t1 = 2.5;
        const t2 = 7.5;
        const amp = 7.0;
        
        const sig1 = 1 / (1 + Math.exp(-k * (t - t1)));
        const sig2 = 1 / (1 + Math.exp(-k * (t - t2)));
        
        voltage = -3.5 + amp * sig1 - amp * sig2;
        
        // dV/dt = amp * k * sig1 * (1 - sig1) - amp * k * sig2 * (1 - sig2)
        slope = amp * k * sig1 * (1 - sig1) - amp * k * sig2 * (1 - sig2);
        break;
      }
      case 'custom': {
        const sortedPoints = [...customPoints]
          .map(p => ({ x: (p.x / 100) * tMax, y: p.y }))
          .sort((a, b) => a.x - b.x);

        if (customStyle === 'smooth') {
          const res = interpolateCatmullRom(sortedPoints, t);
          voltage = res.y;
          slope = res.dy;
        } else {
          const res = interpolatePiecewiseLinear(sortedPoints, t);
          voltage = res.y;
          slope = res.dy;
        }
        break;
      }
    }

    // Current is I = C * dV/dt
    // We express current in milliamperes (mA)
    // I_mA = C_F * dV/dt * 1000 = C_uF * 1e-6 * dV/dt * 1000 = C_uF * 1e-3 * dV/dt
    const current = C * slope * 1000;

    points.push({
      time: parseFloat(t.toFixed(3)),
      voltage: parseFloat(voltage.toFixed(3)),
      current: parseFloat(current.toFixed(4)),
      slope: parseFloat(slope.toFixed(3)),
    });
  }

  return points;
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: "Si el voltaje en los terminales de un capacitor es constante e igual a 5 V, ¿cuál es el valor de la corriente que fluye por él?",
    options: [
      "La corriente es constante e igual a 5 mA.",
      "La corriente es de 0 mA.",
      "La corriente crece exponencialmente.",
      "La corriente es proporcional a la capacitancia multiplicada por 5."
    ],
    correctAnswer: 1,
    explanation: "La corriente en un capacitor se define como I = C * dV/dt. Como el voltaje es constante (V = 5 V), su derivada con respecto al tiempo dV/dt es cero. Por lo tanto, la corriente resultante es exactamente 0 mA. ¡La derivada de una constante es cero!"
  },
  {
    id: 2,
    question: "En una onda de voltaje senoidal V(t) = V₀ sen(ωt), ¿en qué puntos la corriente que atraviesa el capacitor es igual a cero (I = 0)?",
    options: [
      "Cuando el voltaje cruza por cero (V = 0).",
      "Cuando el voltaje alcanza sus valores máximos o mínimos (picos y valles).",
      "En todo momento, porque es corriente alterna.",
      "Cuando la frecuencia angular ω se reduce a la mitad."
    ],
    correctAnswer: 1,
    explanation: "En los picos máximos y mínimos de la onda senoidal, la recta tangente a la curva de voltaje es completamente horizontal, lo que significa que su pendiente (la derivada dV/dt) es igual a cero. Dado que I = C * dV/dt, la corriente es cero en esos instantes."
  },
  {
    id: 3,
    question: "Al simular la onda triangular, observamos que la corriente tiene 'saltos' instantáneos en los picos de voltaje. Desde el punto de vista del cálculo, ¿por qué ocurre esto?",
    options: [
      "Porque el capacitor se quema en esos instantes.",
      "Porque la función de voltaje no es continua.",
      "Porque en las esquinas de la onda de voltaje la función no es derivable (las derivadas laterales no coinciden).",
      "Porque la capacitancia C cambia de signo súbitamente."
    ],
    correctAnswer: 2,
    explanation: "La función de voltaje triangular es continua, pero tiene esquinas afiladas (puntos angulosos) donde cambia abruptamente su pendiente. En estos puntos, la derivada por la izquierda es positiva y por la derecha es negativa. Al no coincidir los límites laterales del cambio, la derivada no existe en ese instante exacto, lo que genera una discontinuidad de salto en la gráfica de corriente."
  },
  {
    id: 4,
    question: "Si duplicamos la capacitancia (C) del circuito manteniendo exactamente la misma onda de voltaje, ¿cómo se ve afectada la corriente instantánea?",
    options: [
      "La corriente máxima se duplica, pero el voltaje se reduce a la mitad.",
      "La corriente permanece idéntica pero la carga disminuye.",
      "La corriente instantánea se duplica en cada punto, escalando verticalmente la gráfica de corriente.",
      "La gráfica de corriente se desplaza en el tiempo (desfase adicional)."
    ],
    correctAnswer: 2,
    explanation: "Dado que I(t) = C * dV(t)/dt, la corriente es directamente proporcional a la capacitancia C. Si duplicamos C, la tasa de cambio de voltaje dV/dt en cada instante se multiplica por un factor de escala doble, por lo que toda la gráfica de corriente se amplifica verticalmente al doble."
  }
];
