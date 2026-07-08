/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PresetType = 'sine' | 'triangle' | 'rc' | 'smooth-square' | 'custom';

export interface ControlPoint {
  x: number; // Value from 0 to 100 (percentage of time)
  y: number; // Value from -5 to 5 (Volts)
  id: number;
}

export interface SimulationDataPoint {
  time: number;       // In seconds (e.g., 0 to 10)
  voltage: number;    // In Volts
  current: number;    // In mA
  slope: number;      // dV/dt in V/s
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number; // Index of the correct option
  explanation: string;
}
