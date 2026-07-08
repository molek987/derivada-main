/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { QUIZ_QUESTIONS } from '../utils';
import { HelpCircle, CheckCircle2, XCircle, ChevronRight, Award, RotateCcw } from 'lucide-react';

export default function ChallengePanel() {
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswerIdx, setSelectedAnswerIdx] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const currentQuestion = QUIZ_QUESTIONS[currentQuestionIdx];

  const handleOptionClick = (idx: number) => {
    if (isSubmitted) return;
    setSelectedAnswerIdx(idx);
  };

  const handleSubmit = () => {
    if (selectedAnswerIdx === null || isSubmitted) return;
    
    setIsSubmitted(true);
    if (selectedAnswerIdx === currentQuestion.correctAnswer) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIdx < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuestionIdx((prev) => prev + 1);
      setSelectedAnswerIdx(null);
      setIsSubmitted(false);
    } else {
      setIsFinished(true);
    }
  };

  const handleReset = () => {
    setCurrentQuestionIdx(0);
    setSelectedAnswerIdx(null);
    setIsSubmitted(false);
    setScore(0);
    setIsFinished(false);
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-5 h-full" id="quiz-challenge-panel">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <HelpCircle className="text-amber-500" size={22} />
          <div>
            <h2 className="text-base font-bold text-slate-900">Reto de Cálculo: Demuestra tu Conocimiento</h2>
            <p className="text-xs text-slate-500">¿Puedes relacionar la teoría de derivadas con las gráficas?</p>
          </div>
        </div>
        {!isFinished && (
          <span className="text-xs bg-slate-100 px-2.5 py-1 rounded-md font-mono font-medium text-slate-600">
            Pregunta {currentQuestionIdx + 1} de {QUIZ_QUESTIONS.length}
          </span>
        )}
      </div>

      {!isFinished ? (
        <div className="flex flex-col gap-4" id={`quiz-question-box-${currentQuestion.id}`}>
          {/* Question Text */}
          <p className="text-sm font-semibold text-slate-800 leading-relaxed">
            {currentQuestion.question}
          </p>

          {/* Options list */}
          <div className="flex flex-col gap-2.5">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedAnswerIdx === idx;
              const isCorrect = currentQuestion.correctAnswer === idx;
              
              let optionStyle = 'border-slate-200 hover:bg-slate-50 text-slate-700';
              if (isSelected && !isSubmitted) {
                optionStyle = 'border-blue-500 bg-blue-50/50 text-blue-950 font-medium';
              } else if (isSubmitted) {
                if (isCorrect) {
                  optionStyle = 'border-emerald-500 bg-emerald-50/60 text-emerald-950 font-medium';
                } else if (isSelected) {
                  optionStyle = 'border-red-500 bg-red-50/60 text-red-950';
                } else {
                  optionStyle = 'border-slate-100 bg-slate-50/20 text-slate-400';
                }
              }

              return (
                <button
                  key={`option-${idx}`}
                  onClick={() => handleOptionClick(idx)}
                  disabled={isSubmitted}
                  className={`w-full text-left p-3.5 rounded-xl border text-xs leading-relaxed transition-all flex items-start gap-3 ${optionStyle}`}
                >
                  <span className="font-mono text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md mt-0.5">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="flex-1">{option}</span>
                  
                  {isSubmitted && isCorrect && <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={16} />}
                  {isSubmitted && isSelected && !isCorrect && <XCircle className="text-red-500 shrink-0 mt-0.5" size={16} />}
                </button>
              );
            })}
          </div>

          {/* Actions & Feedback */}
          <div className="mt-3 flex flex-col gap-4">
            {!isSubmitted ? (
              <button
                onClick={handleSubmit}
                disabled={selectedAnswerIdx === null}
                className={`w-full py-2.5 rounded-xl text-xs font-semibold shadow-xs transition-colors text-center ${
                  selectedAnswerIdx !== null
                    ? 'bg-slate-900 text-white hover:bg-slate-800 cursor-pointer'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                Comprobar Respuesta
              </button>
            ) : (
              <div className="flex flex-col gap-3.5 bg-slate-50 border border-slate-100 p-4 rounded-xl">
                <div className="flex gap-2">
                  {selectedAnswerIdx === currentQuestion.correctAnswer ? (
                    <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold uppercase shrink-0 h-fit">
                      ✓ Correcto
                    </span>
                  ) : (
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-md font-bold uppercase shrink-0 h-fit">
                      ✗ Incorrecto
                    </span>
                  )}
                  <p className="text-xs text-slate-600 leading-normal">
                    {currentQuestion.explanation}
                  </p>
                </div>

                <button
                  onClick={handleNext}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  {currentQuestionIdx < QUIZ_QUESTIONS.length - 1 ? (
                    <>
                      Siguiente Pregunta <ChevronRight size={14} />
                    </>
                  ) : (
                    <>
                      Finalizar y Ver Puntaje <Award size={14} />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Quiz Completed Screen */
        <div className="flex flex-col items-center justify-center text-center py-6 gap-5" id="quiz-finished-screen">
          <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center border border-amber-200 shadow-sm animate-bounce">
            <Award size={36} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base">¡Reto de Cálculo Completado!</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-[280px] mx-auto leading-normal">
              Has respondido correctamente las preguntas sobre derivadas aplicadas a circuitos eléctricos.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-xl px-6 py-4 w-full max-w-[240px] text-center shadow-xs">
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Tu Puntaje</span>
            <div className="text-3xl font-extrabold text-slate-900 mt-0.5">
              <span className="text-emerald-600">{score}</span> / {QUIZ_QUESTIONS.length}
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              {score === QUIZ_QUESTIONS.length
                ? '¡Excelente! Tienes un dominio perfecto de las derivadas.'
                : score >= QUIZ_QUESTIONS.length / 2
                ? '¡Buen trabajo! Entiendes los conceptos básicos.'
                : 'Sigue practicando para dominar las tasas de cambio.'}
            </p>
          </div>

          <button
            onClick={handleReset}
            className="w-full max-w-[200px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
          >
            <RotateCcw size={14} /> Reintentar Cuestionario
          </button>
        </div>
      )}
    </div>
  );
}
