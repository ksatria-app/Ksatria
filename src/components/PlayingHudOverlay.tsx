import React from 'react';
import type { ProceduralLevel, ProceduralStep, SystemDictionary } from '../game/proceduralData';
import type { StepEvaluationResult, UserProfileData } from '../game/rules';
import type { ActiveModalType } from './ModalsOverlay';

interface PlayingHudOverlayProps {
  dict: SystemDictionary;
  profile: UserProfileData;
  activeLevel: ProceduralLevel;
  activeStep: ProceduralStep;
  activeStepIndex: number;
  currentMeasureValue: number;
  stepFeedback: StepEvaluationResult | null;
  explodedAmount: number;
  cameraPresetIndex: number;
  dockCollapsed: boolean;
  muted: boolean;
  isOnline: boolean;
  onIncrementMeasure: () => void;
  onChangeMeasureSlider: (val: number) => void;
  onResetMeasure: () => void;
  onVerifyStep: () => void;
  onChangeExploded: (val: number) => void;
  onChangeCameraPreset: (idx: number) => void;
  onToggleDock: () => void;
  onToggleMute: () => void;
  onPauseGame: () => void;
  onRestartLevel: () => void;
  onOpenModal: (modal: ActiveModalType) => void;
}

export const PlayingHudOverlay: React.FC<PlayingHudOverlayProps> = ({
  dict,
  profile,
  activeLevel,
  activeStep,
  activeStepIndex,
  currentMeasureValue,
  stepFeedback,
  explodedAmount,
  cameraPresetIndex,
  dockCollapsed,
  muted,
  isOnline,
  onIncrementMeasure,
  onChangeMeasureSlider,
  onResetMeasure,
  onVerifyStep,
  onChangeExploded,
  onChangeCameraPreset,
  onToggleDock,
  onToggleMute,
  onPauseGame,
  onRestartLevel,
  onOpenModal,
}) => {
  const isWithinTarget =
    Math.abs(currentMeasureValue - activeStep.targetVal) <= activeStep.tolerance;

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-3 md:p-5">
      {/* TOP PERIMETER CLUSTERS */}
      <div className="flex items-start justify-between gap-3">
        {/* Top-Left Cluster: Level Progress Pips + XP & Streak */}
        <div
          className="pointer-events-auto flex items-center gap-3.5 rounded-2xl px-4 py-2.5 border border-purple-400/35 shadow-xl"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.92)' }}
        >
          {/* Custom SVG Ksatria Icon */}
          <svg viewBox="0 0 28 28" className="w-7 h-7 shrink-0" aria-hidden="true">
            <path
              d="M14 2 L25 6.5 V14 C25 20.5 20.2 24.8 14 27 C7.8 24.8 3 20.5 3 14 V6.5 Z"
              fill="#facc15"
              stroke="#fef08a"
              strokeWidth="1.5"
            />
            <path
              d="M14 5 L22 8.2 V13.8 C22 18.8 18.5 22.2 14 24 C9.5 22.2 6 18.8 6 13.8 V8.2 Z"
              fill="#7c3aed"
            />
            <path d="M10.5 10.5 H17.5 V13 H15.2 V19.5 H12.8 V13 H10.5 Z" fill="#ffffff" />
          </svg>

          <div>
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase text-purple-300">
              <span>LEVEL {activeLevel.id}</span>
              <span aria-hidden="true">·</span>
              <span>{activeLevel.title}</span>
            </div>

            {/* Duolingo-style 4-Step Segmented Vitality/Progress Bar */}
            <div className="flex items-center gap-1.5 mt-1.5" aria-label="Progres Langkah Prosedur">
              {activeLevel.steps.map((st, idx) => {
                const isDone = idx < activeStepIndex;
                const isCurrent = idx === activeStepIndex;
                return (
                  <div
                    key={st.id}
                    className={`h-2.5 w-10 rounded-full transition-colors ${
                      isDone
                        ? 'bg-emerald-400'
                        : isCurrent
                          ? 'bg-amber-400'
                          : 'bg-slate-700'
                    }`}
                  />
                );
              })}
              <span className="ml-1.5 text-xs font-black text-white tabular-nums">
                {activeStepIndex + 1}/{activeLevel.steps.length}
              </span>
            </div>
          </div>

          {/* Tabular-Nums Hero Readouts */}
          <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-slate-700">
            <div>
              <div className="text-[10px] font-extrabold uppercase text-purple-300">SKOR XP</div>
              <div className="text-lg font-black text-amber-300 tabular-nums leading-none">
                {Math.round(profile.xp)}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-extrabold uppercase text-purple-300">STREAK</div>
              <div className="text-lg font-black text-emerald-400 tabular-nums leading-none">
                {Math.round(profile.streak)}d
              </div>
            </div>
          </div>
        </div>

        {/* Top-Right Cluster: Navigation Modals & Utility Icon Buttons (Mute [M], Pause [P], Restart [R]) */}
        <div className="pointer-events-auto flex flex-wrap items-center justify-end gap-2">
          {!isOnline && (
            <span
              className="rounded-xl px-3 py-2 text-xs font-extrabold text-amber-300 border border-amber-400/40"
              style={{ backgroundColor: 'rgba(15, 23, 42, 0.92)' }}
            >
              OFFLINE
            </span>
          )}

          <button
            type="button"
            onClick={() => onOpenModal('levels')}
            className="btn-duo rounded-xl px-3 py-2 text-xs font-extrabold text-white border border-purple-400/35 shadow-[0_3px_0_0_#3b0764] cursor-pointer whitespace-nowrap"
            style={{ backgroundColor: 'rgba(88, 28, 135, 0.92)' }}
          >
            {dict.levelMap}
          </button>

          <button
            type="button"
            onClick={() => onOpenModal('leaderboard')}
            className="btn-duo rounded-xl px-3 py-2 text-xs font-extrabold text-white border border-purple-400/35 shadow-[0_3px_0_0_#3b0764] cursor-pointer whitespace-nowrap"
            style={{ backgroundColor: 'rgba(88, 28, 135, 0.92)' }}
          >
            {dict.leaderboard}
          </button>

          <button
            type="button"
            onClick={() => onOpenModal('auth')}
            className="btn-duo rounded-xl px-3 py-2 text-xs font-extrabold text-white border border-purple-400/35 shadow-[0_3px_0_0_#3b0764] cursor-pointer whitespace-nowrap"
            style={{ backgroundColor: 'rgba(88, 28, 135, 0.92)' }}
          >
            {dict.profile}
          </button>

          <button
            type="button"
            onClick={() => onOpenModal('settings')}
            className="btn-duo rounded-xl px-3 py-2 text-xs font-extrabold text-white border border-purple-400/35 shadow-[0_3px_0_0_#3b0764] cursor-pointer whitespace-nowrap"
            style={{ backgroundColor: 'rgba(88, 28, 135, 0.92)' }}
          >
            {dict.settings}
          </button>

          {/* Compact Square SVG Utility Controls: Mute [M], Pause [P], Restart [R] */}
          <button
            type="button"
            tabIndex={-1}
            aria-label={muted ? 'Nyalakan Suara [M]' : 'Bisukan Suara [M]'}
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleMute();
            }}
            className="btn-duo w-9 h-9 rounded-xl flex items-center justify-center text-white border border-slate-700 cursor-pointer"
            style={{ backgroundColor: 'rgba(15, 23, 42, 0.92)' }}
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
              {muted ? (
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
              ) : (
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
              )}
            </svg>
          </button>

          <button
            type="button"
            tabIndex={-1}
            aria-label="Jeda Simulasi [P]"
            onClick={(e) => {
              e.currentTarget.blur();
              onPauseGame();
            }}
            className="btn-duo w-9 h-9 rounded-xl flex items-center justify-center text-white border border-slate-700 cursor-pointer"
            style={{ backgroundColor: 'rgba(15, 23, 42, 0.92)' }}
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          </button>

          <button
            type="button"
            tabIndex={-1}
            aria-label="Ulangi Level [R]"
            onClick={(e) => {
              e.currentTarget.blur();
              onRestartLevel();
            }}
            className="btn-duo w-9 h-9 rounded-xl flex items-center justify-center text-white border border-slate-700 cursor-pointer"
            style={{ backgroundColor: 'rgba(15, 23, 42, 0.92)' }}
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
            </svg>
          </button>
        </div>
      </div>

      {/* UNIFIED COLLAPSIBLE BOTTOM CONTROL DOCK (Pinned to bottom center, <= 15% viewport height) */}
      <div className="mx-auto w-full max-w-[1060px] flex flex-col items-center">
        {/* Collapse / Expand Toggle Tab */}
        <button
          type="button"
          onClick={onToggleDock}
          className="pointer-events-auto rounded-t-xl px-4 py-1 text-xs font-extrabold text-purple-200 border border-b-0 border-purple-400/35 cursor-pointer"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.92)' }}
        >
          {dockCollapsed ? `▴ ${dict.showControls}` : `▾ ${dict.hideControls}`}
        </button>

        {!dockCollapsed && (
          <div
            className="pointer-events-auto w-full rounded-3xl px-5 py-3.5 border border-purple-400/40 shadow-2xl text-white"
            style={{ backgroundColor: 'rgba(15, 23, 42, 0.94)' }}
          >
            {/* Top Row of Dock: Procedural Instruction & Target Readout */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2.5">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs font-black text-amber-300 mb-0.5">
                  <span>VERBA PROSEDURAL: {activeStep.verbBadge}</span>
                  <span aria-hidden="true">·</span>
                  <span>{activeStep.titleId}</span>
                </div>
                <p className="text-xs md:text-sm font-bold text-slate-100 leading-snug">
                  {activeStep.instructionId}
                </p>
                <p className="text-[11px] font-semibold text-purple-300 mt-0.5 truncate">
                  {activeStep.linguisticNoteId}
                </p>
              </div>

              {/* Live Tabular-Nums Readout */}
              <div className="flex items-center gap-3 shrink-0 rounded-2xl bg-slate-900 px-4 py-2 border border-purple-500/40">
                <div>
                  <div className="text-[10px] font-extrabold uppercase text-slate-400">
                    {dict.currentValue}
                  </div>
                  <div
                    className={`text-lg font-black font-mono tabular-nums ${
                      isWithinTarget ? 'text-emerald-400' : 'text-amber-300'
                    }`}
                  >
                    {Math.round(currentMeasureValue)} {activeStep.unit}
                  </div>
                </div>
                <div className="h-6 w-px bg-slate-700" />
                <div>
                  <div className="text-[10px] font-extrabold uppercase text-slate-400">
                    {dict.targetLabel}
                  </div>
                  <div className="text-lg font-black font-mono tabular-nums text-white">
                    {activeStep.targetVal} {activeStep.unit}
                  </div>
                </div>
              </div>
            </div>

            {/* Instant Feedback Callout if present */}
            {stepFeedback && (
              <div
                role="status"
                className={`mb-2.5 rounded-xl px-3.5 py-1.5 text-xs font-extrabold flex items-center justify-between ${
                  stepFeedback.passed
                    ? 'bg-emerald-500/20 border border-emerald-400 text-emerald-200'
                    : 'bg-amber-500/20 border border-amber-400 text-amber-200'
                }`}
              >
                <span>
                  {stepFeedback.passed ? '✓ BERHASIL: ' : '▲ PERHATIKAN TAKARAN: '}
                  {stepFeedback.feedbackId}
                </span>
                <span className="font-mono tabular-nums ml-2">
                  Ketepatan {stepFeedback.accuracyPercent}%
                </span>
              </div>
            )}

            {/* Single-Row Interactive Controls on Desktop */}
            <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-2.5">
              {/* Left: Interactive Slider + Action Button + Reset + Verify */}
              <div className="flex flex-1 items-center gap-2 min-w-0">
                <div className="w-36 sm:w-44 shrink-0">
                  <label
                    htmlFor="procedural-measure-slider"
                    className="block text-[10px] font-extrabold uppercase text-purple-300 mb-0.5 truncate"
                  >
                    Takaran ({activeStep.minVal}–{activeStep.maxVal} {activeStep.unit})
                  </label>
                  <input
                    id="procedural-measure-slider"
                    type="range"
                    min={activeStep.minVal}
                    max={activeStep.maxVal}
                    step={1}
                    value={currentMeasureValue}
                    onChange={(e) => onChangeMeasureSlider(Number(e.target.value))}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                </div>

                <button
                  type="button"
                  onClick={onIncrementMeasure}
                  className="btn-duo rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs px-3.5 py-2.5 shadow-[0_3px_0_0_#4c1d95] cursor-pointer whitespace-nowrap shrink-0"
                >
                  {activeStep.actionButtonLabelId}
                </button>

                <button
                  type="button"
                  onClick={onResetMeasure}
                  className="btn-duo rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold text-xs px-3 py-2.5 border border-slate-700 cursor-pointer whitespace-nowrap shrink-0"
                >
                  {dict.resetValue}
                </button>

                <button
                  type="button"
                  onClick={onVerifyStep}
                  className="btn-duo rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-4 py-2.5 shadow-[0_3px_0_0_#065f46] cursor-pointer whitespace-nowrap shrink-0"
                >
                  {dict.verifyStep}
                </button>
              </div>

              {/* Right: 3D Exploded Inspection Slider & Camera Presets */}
              <div className="flex items-center gap-2.5 lg:pl-2.5 lg:border-l border-slate-800 shrink-0">
                <div className="w-28">
                  <label
                    htmlFor="exploded-view-slider"
                    className="block text-[10px] font-extrabold uppercase text-purple-300 mb-0.5 truncate"
                  >
                    {dict.explodedView}: {Math.round(explodedAmount * 100)}%
                  </label>
                  <input
                    id="exploded-view-slider"
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={explodedAmount}
                    onChange={(e) => onChangeExploded(Number(e.target.value))}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                </div>

                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                  {(['Fokus', 'Depan', 'Atas', 'Iso'] as const).map((label, idx) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => onChangeCameraPreset(idx)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-extrabold cursor-pointer whitespace-nowrap ${
                        cameraPresetIndex === idx
                          ? 'bg-purple-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
