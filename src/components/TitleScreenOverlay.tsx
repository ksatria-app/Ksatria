import React from 'react';
import { PROCEDURAL_LEVELS, type ProceduralLevel, type SystemDictionary } from '../game/proceduralData';
import type { UserProfileData } from '../game/rules';
import { PWAInstallButton } from './PWAInstallButton';

interface TitleScreenOverlayProps {
  dict: SystemDictionary;
  profile: UserProfileData;
  isGoogleAuthenticated: boolean;
  activeLevel: ProceduralLevel;
  onSelectLevel: (level: ProceduralLevel) => void;
  onStartGame: () => void;
  onOpenAuthModal: () => void;
  onOpenLeaderboard: () => void;
  onOpenSettings: () => void;
}

export const TitleScreenOverlay: React.FC<TitleScreenOverlayProps> = ({
  dict,
  profile,
  isGoogleAuthenticated,
  activeLevel,
  onSelectLevel,
  onStartGame,
  onOpenAuthModal,
  onOpenLeaderboard,
  onOpenSettings,
}) => {
  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-6 md:p-10">
      {/* Top Row: Minimal Status & Quick Modal Triggers */}
      <div className="flex items-center justify-between gap-4">
        <div
          className="pointer-events-auto flex items-center gap-3 rounded-2xl px-4 py-2.5 border border-purple-400/30 shadow-lg"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.88)' }}
        >
          {/* Inline SVG Ksatria Shield Mini Emblem */}
          <svg viewBox="0 0 36 36" className="w-8 h-8 shrink-0" aria-hidden="true">
            <path
              d="M18 3 L31 8 V17 C31 25.5 25.2 31.2 18 34 C10.8 31.2 5 25.5 5 17 V8 Z"
              fill="#facc15"
              stroke="#fef08a"
              strokeWidth="2"
            />
            <path
              d="M18 6.5 L27.5 10.2 V16.8 C27.5 23.2 23.4 27.8 18 30.2 C12.6 27.8 8.5 23.2 8.5 16.8 V10.2 Z"
              fill="#6b21a8"
            />
            <path d="M13.5 13.5 H22.5 V16.5 H19.5 V24.5 H16.5 V16.5 H13.5 Z" fill="#ffffff" />
          </svg>
          <div>
            <div className="text-sm font-extrabold text-white leading-tight">{profile.displayName}</div>
            <div className="text-xs font-semibold text-purple-300 tabular-nums">
              {profile.schoolClass} · {profile.xp} XP · {profile.streak} Hari Beruntun
            </div>
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-2.5">
          <PWAInstallButton label={dict.installApp} />
          <button
            type="button"
            onClick={onOpenLeaderboard}
            className="btn-duo rounded-xl px-4 py-2.5 text-xs font-extrabold text-white border border-purple-400/30 shadow-[0_3px_0_0_#3b0764] cursor-pointer whitespace-nowrap"
            style={{ backgroundColor: 'rgba(88, 28, 135, 0.92)' }}
          >
            {dict.leaderboard}
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            className="btn-duo rounded-xl px-4 py-2.5 text-xs font-extrabold text-white border border-purple-400/30 shadow-[0_3px_0_0_#3b0764] cursor-pointer whitespace-nowrap"
            style={{ backgroundColor: 'rgba(88, 28, 135, 0.92)' }}
          >
            {dict.settings}
          </button>
        </div>
      </div>

      {/* Left-Third Asymmetric Negative Space Title Lockup & Primary CTAs */}
      <div className="my-auto max-w-xl pointer-events-auto">
        <div
          className="rounded-3xl p-6 md:p-8 border border-purple-400/30 shadow-2xl"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.90)' }}
        >
          {/* Bespoke Inline SVG Title Emblem Lockup */}
          <svg
            viewBox="0 0 520 118"
            className="w-full max-w-md h-auto mb-3"
            role="img"
            aria-label="Teka-Teki by Ksatria"
          >
            <defs>
              <linearGradient id="crestGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#581c87" />
              </linearGradient>
              <linearGradient id="goldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fde047" />
                <stop offset="100%" stopColor="#ca8a04" />
              </linearGradient>
            </defs>
            {/* Ksatria Royal Shield */}
            <path
              d="M54 10 L96 26 V58 C96 86 78 104 54 112 C30 104 12 86 12 58 V26 Z"
              fill="url(#goldGrad)"
              stroke="#fef08a"
              strokeWidth="4"
            />
            <path
              d="M54 20 L86 32 V57 C86 79 72 93 54 100 C36 93 22 79 22 57 V32 Z"
              fill="url(#crestGrad)"
            />
            <path d="M38 42 H70 V52 H59 V82 H49 V52 H38 Z" fill="#ffffff" />
            <circle cx="54" cy="31" r="4.5" fill="#fde047" />

            {/* Display Title Lettering */}
            <text
              x="114"
              y="62"
              fill="#ffffff"
              fontFamily="Nunito, sans-serif"
              fontWeight="900"
              fontSize="50"
              letterSpacing="-1"
            >
              TEKA-TEKI
            </text>
            <rect x="116" y="74" width="194" height="30" rx="8" fill="#7c3aed" />
            <text
              x="130"
              y="95"
              fill="#fde047"
              fontFamily="Nunito, sans-serif"
              fontWeight="800"
              fontSize="18"
              letterSpacing="1.5"
            >
              BY KSATRIA · 3D
            </text>
          </svg>

          <p className="text-sm md:text-base font-bold text-purple-200 leading-relaxed mb-5">
            {dict.tagline} — Praktik langsung membuat, merakit, memasang, dan mengunduh melalui simulasi 3D interaktif.
          </p>

          {/* 3 Level Path Selector Cards (Duolingo-inspired tactile nodes) */}
          <div className="grid grid-cols-3 gap-2.5 mb-6" role="group" aria-label="Pilih Level Teks Prosedur">
            {PROCEDURAL_LEVELS.map((lvl) => {
              const isSelected = activeLevel.id === lvl.id;
              const stars =
                lvl.id === 1
                  ? profile.level1Stars
                  : lvl.id === 2
                    ? profile.level2Stars
                    : profile.level3Stars;
              return (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => onSelectLevel(lvl)}
                  className={`btn-duo text-left rounded-2xl p-3 border-2 transition-transform cursor-pointer ${
                    isSelected
                      ? 'border-yellow-400 bg-purple-700 text-white shadow-[0_4px_0_0_#4c1d95]'
                      : 'border-purple-500/30 bg-slate-900/90 text-slate-200 hover:border-purple-400'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-extrabold text-yellow-300 mb-1">
                    <span>LEVEL {lvl.id}</span>
                    <span className="tabular-nums">{'★'.repeat(stars) + '☆'.repeat(3 - stars)}</span>
                  </div>
                  <div className="text-xs font-extrabold leading-snug line-clamp-2">{lvl.title}</div>
                </button>
              );
            })}
          </div>

          {/* Primary & Secondary Action Buttons (<= 3 menu actions total) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              type="button"
              data-start="true"
              onClick={(e) => {
                e.currentTarget.blur();
                onStartGame();
              }}
              className="btn-duo flex-1 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-base py-3.5 px-6 shadow-[0_5px_0_0_#4c1d95] border border-purple-300/40 cursor-pointer text-center"
            >
              {dict.startLearning} — Level {activeLevel.id}
            </button>

            <button
              type="button"
              onClick={onOpenAuthModal}
              className="btn-duo rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm py-3.5 px-5 shadow-[0_5px_0_0_#b45309] cursor-pointer whitespace-nowrap"
            >
              {isGoogleAuthenticated ? dict.continueAsKsatria : dict.googleSignIn}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Safe Margin: Single Flat Inline Control Hint Line */}
      <div className="text-center">
        <p
          className="inline-block rounded-xl px-4 py-1.5 text-xs font-bold text-purple-200"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.85)' }}
        >
          {dict.controlHint}
        </p>
      </div>
    </div>
  );
};
