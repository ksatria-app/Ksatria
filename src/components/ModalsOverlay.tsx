import React, { useState, useEffect } from 'react';
import {
  PROCEDURAL_LEVELS,
  type ProceduralLevel,
  type SystemDictionary,
  type SystemLanguage,
  type ThemeVariant,
} from '../game/proceduralData';
import type { UserProfileData } from '../game/rules';
import type { LeaderboardRow } from '../firebase';
import { encryptWithAesGcm } from '../utils/cryptoVault';

export type ActiveModalType = 'none' | 'auth' | 'levels' | 'leaderboard' | 'settings' | 'guide';

interface ModalsOverlayProps {
  gameState: 'title' | 'playing' | 'paused' | 'gameover';
  activeModal: ActiveModalType;
  dict: SystemDictionary;
  profile: UserProfileData;
  privateNotes: string;
  isGoogleAuthenticated: boolean;
  isOnline: boolean;
  cloudSynced: boolean;
  activeLevel: ProceduralLevel;
  lastRunStats: {
    clearTimeSec: number;
    xpEarned: number;
    accuracy: number;
    stars: 1 | 2 | 3;
  };
  leaderboardRows: LeaderboardRow[];
  reminderEnabled: boolean;
  onCloseModal: () => void;
  onResumeGame: () => void;
  onRestartLevel: () => void;
  onBackToTitle: () => void;
  onNextLevel: () => void;
  onSelectLevelAndPlay: (level: ProceduralLevel) => void;
  onGoogleLogin: () => Promise<void>;
  onGoogleLogout: () => Promise<void>;
  onSaveProfileAndNotes: (name: string, schoolClass: string, notes: string, avatarColor: string) => Promise<void>;
  onChangeLanguage: (lang: SystemLanguage) => void;
  onChangeTheme: (theme: ThemeVariant) => void;
  onToggleDarkMode: (dark: boolean) => void;
  onToggleReminder: (enabled: boolean, timeStr: string) => void;
  onTriggerCloudSync: () => Promise<void>;
}

export const ModalsOverlay: React.FC<ModalsOverlayProps> = ({
  gameState,
  activeModal,
  dict,
  profile,
  privateNotes,
  isGoogleAuthenticated,
  isOnline,
  cloudSynced,
  activeLevel,
  lastRunStats,
  leaderboardRows,
  reminderEnabled,
  onCloseModal,
  onResumeGame,
  onRestartLevel,
  onBackToTitle,
  onNextLevel,
  onSelectLevelAndPlay,
  onGoogleLogin,
  onGoogleLogout,
  onSaveProfileAndNotes,
  onChangeLanguage,
  onChangeTheme,
  onToggleDarkMode,
  onToggleReminder,
  onTriggerCloudSync,
}) => {
  const [nameInput, setNameInput] = useState(profile.displayName);
  const [classInput, setClassInput] = useState(profile.schoolClass);
  const [notesInput, setNotesInput] = useState(privateNotes);
  const [avatarColorInput, setAvatarColorInput] = useState(profile.avatarColor);
  const [authStatusMsg, setAuthStatusMsg] = useState('');
  const [cipherPreview, setCipherPreview] = useState('');
  const [reminderTimeInput, setReminderTimeInput] = useState(profile.dailyReminderTime || '16:00');
  const [reminderToast, setReminderToast] = useState('');

  useEffect(() => {
    setNameInput(profile.displayName);
    setClassInput(profile.schoolClass);
    setAvatarColorInput(profile.avatarColor);
    setReminderTimeInput(profile.dailyReminderTime || '16:00');
  }, [profile]);

  useEffect(() => {
    setNotesInput(privateNotes);
  }, [privateNotes]);

  useEffect(() => {
    let active = true;
    encryptWithAesGcm(`${nameInput} | ${classInput} | ${notesInput}`, profile.uid).then((res) => {
      if (active) setCipherPreview(res);
    });
    return () => {
      active = false;
    };
  }, [nameInput, classInput, notesInput, profile.uid]);

  // 1. PAUSE MODAL (document.body.dataset.state === 'paused')
  if (gameState === 'paused') {
    return (
      <div
        className="fixed inset-0 z-30 flex items-center justify-center p-4 pointer-events-auto"
        style={{ backgroundColor: 'rgba(9, 5, 20, 0.82)' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pause-modal-title"
      >
        <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border-2 border-purple-500 p-7 shadow-2xl text-slate-900 dark:text-slate-100">
          <h2 id="pause-modal-title" className="text-2xl font-black text-purple-600 dark:text-purple-300 mb-2">
            {dict.pauseTitle}
          </h2>
          <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-5">
            {activeLevel.title} — {activeLevel.subtitle}
          </p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="rounded-2xl bg-purple-50 dark:bg-slate-800 p-3.5 border border-purple-200 dark:border-slate-700">
              <div className="text-xs font-extrabold uppercase text-purple-600 dark:text-purple-300">LEVEL</div>
              <div className="text-2xl font-black tabular-nums">{activeLevel.id} / 3</div>
            </div>
            <div className="rounded-2xl bg-purple-50 dark:bg-slate-800 p-3.5 border border-purple-200 dark:border-slate-700">
              <div className="text-xs font-extrabold uppercase text-purple-600 dark:text-purple-300">TOTAL XP</div>
              <div className="text-2xl font-black tabular-nums">{profile.xp}</div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                onResumeGame();
              }}
              className="btn-duo w-full rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black py-3.5 shadow-[0_4px_0_0_#4c1d95] cursor-pointer"
            >
              {dict.resumeGame}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                onRestartLevel();
              }}
              className="btn-duo w-full rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black py-3.5 shadow-[0_4px_0_0_#b45309] cursor-pointer"
            >
              {dict.restartLevel}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                onBackToTitle();
              }}
              className="btn-duo w-full rounded-2xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold py-3 cursor-pointer"
            >
              {dict.backToTitle}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. VICTORY / STAGE CLEAR MODAL (document.body.dataset.state === 'gameover')
  if (gameState === 'gameover') {
    return (
      <div
        className="fixed inset-0 z-30 flex items-center justify-center p-4 pointer-events-auto overflow-y-auto"
        style={{ backgroundColor: 'rgba(9, 5, 20, 0.85)' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="victory-modal-title"
      >
        <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-slate-900 border-2 border-yellow-400 p-7 shadow-2xl text-slate-900 dark:text-slate-100 my-auto">
          <div className="flex items-center justify-between gap-3 mb-2">
            <h2 id="victory-modal-title" className="text-2xl md:text-3xl font-black text-purple-600 dark:text-purple-300">
              {dict.victoryTitle}
            </h2>
            <div className="text-2xl font-black text-yellow-400 tabular-nums">
              {'★'.repeat(lastRunStats.stars) + '☆'.repeat(3 - lastRunStats.stars)}
            </div>
          </div>
          <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-5">{dict.victorySubtitle}</p>

          {/* 3 Tabular-Nums Mastery Stat Tiles */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="rounded-2xl bg-purple-50 dark:bg-slate-800 p-3.5 border border-purple-200 dark:border-slate-700">
              <div className="text-xs font-extrabold uppercase text-purple-600 dark:text-purple-300">
                {dict.clearTime}
              </div>
              <div className="text-2xl font-black tabular-nums">{lastRunStats.clearTimeSec}s</div>
            </div>
            <div className="rounded-2xl bg-amber-50 dark:bg-slate-800 p-3.5 border border-amber-300 dark:border-slate-700">
              <div className="text-xs font-extrabold uppercase text-amber-700 dark:text-amber-300">
                {dict.xpEarned}
              </div>
              <div className="text-2xl font-black tabular-nums">+{lastRunStats.xpEarned} XP</div>
            </div>
            <div className="rounded-2xl bg-emerald-50 dark:bg-slate-800 p-3.5 border border-emerald-300 dark:border-slate-700">
              <div className="text-xs font-extrabold uppercase text-emerald-700 dark:text-emerald-300">
                {dict.accuracy}
              </div>
              <div className="text-2xl font-black tabular-nums">{lastRunStats.accuracy}%</div>
            </div>
          </div>

          {/* Ringkasan Struktur Teks Prosedur Bahasa Indonesia */}
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-4 mb-6 text-xs space-y-2">
            <div className="font-black text-purple-700 dark:text-purple-300 text-sm">
              Evaluasi Struktur Teks Prosedur: {activeLevel.title}
            </div>
            <p className="text-slate-700 dark:text-slate-300">
              <strong>Tujuan:</strong> {activeLevel.teksProsedur.tujuan}
            </p>
            <p className="text-slate-700 dark:text-slate-300">
              <strong>Penutup:</strong> {activeLevel.teksProsedur.penutup}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              data-start="true"
              onClick={(e) => {
                e.currentTarget.blur();
                onNextLevel();
              }}
              className="btn-duo flex-1 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black py-3.5 px-5 shadow-[0_4px_0_0_#4c1d95] cursor-pointer"
            >
              {activeLevel.id < 3 ? `${dict.nextLevel} (Level ${activeLevel.id + 1})` : dict.playAgain}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                onRestartLevel();
              }}
              className="btn-duo rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black py-3.5 px-5 shadow-[0_4px_0_0_#b45309] cursor-pointer"
            >
              {dict.playAgain}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                onBackToTitle();
              }}
              className="btn-duo rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-extrabold py-3.5 px-4 cursor-pointer"
            >
              {dict.backToTitle}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (activeModal === 'none') return null;

  // 3. AUTH & PENDAFTARAN AKUN KSATRIA MODAL
  if (activeModal === 'auth') {
    return (
      <div
        className="fixed inset-0 z-30 flex items-center justify-center p-4 pointer-events-auto overflow-y-auto"
        style={{ backgroundColor: 'rgba(9, 5, 20, 0.84)' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border-2 border-purple-500 p-6 md:p-7 shadow-2xl text-slate-900 dark:text-slate-100 my-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 id="auth-modal-title" className="text-2xl font-black text-purple-600 dark:text-purple-300">
              {dict.registerAccount}
            </h2>
            <button
              type="button"
              onClick={onCloseModal}
              className="rounded-xl px-3 py-1.5 text-xs font-extrabold bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              {dict.closeModal}
            </button>
          </div>

          {/* Google Login Button connected to Firebase Auth */}
          <div className="mb-5 p-4 rounded-2xl bg-purple-50 dark:bg-slate-800/90 border border-purple-200 dark:border-slate-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Autentikasi Google & Cloud Firebase
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  {isGoogleAuthenticated
                    ? `Terhubung ke Firebase Auth (${profile.uid.slice(0, 10)}...)`
                    : 'Masuk dengan akun Google untuk sinkronisasi otomatis antar perangkat.'}
                </div>
              </div>
              {isGoogleAuthenticated ? (
                <button
                  type="button"
                  onClick={async () => {
                    await onGoogleLogout();
                    setAuthStatusMsg('Berhasil keluar dari sesi Google.');
                  }}
                  className="btn-duo rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs px-4 py-2.5 cursor-pointer whitespace-nowrap"
                >
                  Keluar Google
                </button>
              ) : (
                <button
                  type="button"
                  onClick={async () => {
                    setAuthStatusMsg('Membuka jendela masuk Google...');
                    try {
                      await onGoogleLogin();
                      setAuthStatusMsg('Berhasil masuk dengan akun Google!');
                    } catch {
                      setAuthStatusMsg(
                        'Popup Google ditutup atau diblokir browser. Anda tetap dapat mendaftar dan menyimpan profil Ksatria di bawah ini.',
                      );
                    }
                  }}
                  className="btn-duo rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-4 py-2.5 shadow-[0_3px_0_0_#b45309] cursor-pointer whitespace-nowrap"
                >
                  {dict.googleSignIn}
                </button>
              )}
            </div>
          </div>

          {/* Form Pendaftaran & Profil Siswa */}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!nameInput.trim() || !classInput.trim()) {
                setAuthStatusMsg('Mohon isi Nama Ksatria dan Kelas terlebih dahulu.');
                return;
              }
              await onSaveProfileAndNotes(
                nameInput.trim(),
                classInput.trim(),
                notesInput.trim(),
                avatarColorInput,
              );
              setAuthStatusMsg('Profil Ksatria berhasil disimpan & dienkripsi dengan AES-256-GCM!');
            }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="ksatria-name" className="block text-xs font-extrabold uppercase mb-1">
                {dict.studentNameLabel}
              </label>
              <input
                id="ksatria-name"
                type="text"
                required
                maxLength={60}
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm font-bold text-slate-900 dark:text-white"
                placeholder="Contoh: Raditya Ksatria"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="ksatria-class" className="block text-xs font-extrabold uppercase mb-1">
                  {dict.studentClassLabel}
                </label>
                <input
                  id="ksatria-class"
                  type="text"
                  required
                  maxLength={40}
                  value={classInput}
                  onChange={(e) => setClassInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm font-bold text-slate-900 dark:text-white"
                  placeholder="Kelas 7A · SMPN 1"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase mb-1">Warna Lambang</label>
                <div className="flex items-center gap-2 pt-1">
                  {['#7c3aed', '#9333ea', '#6d28d9', '#a855f7', '#eab308'].map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => setAvatarColorInput(hex)}
                      aria-label={`Pilih warna ${hex}`}
                      className={`w-8 h-8 rounded-full border-2 cursor-pointer ${
                        avatarColorInput === hex ? 'border-yellow-400 scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="ksatria-notes" className="block text-xs font-extrabold uppercase mb-1">
                {dict.privateNotesLabel}
              </label>
              <textarea
                id="ksatria-notes"
                rows={2}
                maxLength={300}
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-white"
                placeholder="Catatan target belajar Teks Prosedur..."
              />
            </div>

            {/* AES-256-GCM Live Ciphertext Proof */}
            <div className="rounded-xl bg-slate-100 dark:bg-slate-950 p-3 border border-slate-200 dark:border-slate-800">
              <div className="text-xs font-extrabold text-purple-600 dark:text-purple-400 mb-1">
                {dict.encryptionTitle}
              </div>
              <div className="font-mono text-[11px] text-slate-600 dark:text-slate-400 break-all line-clamp-2">
                {cipherPreview || 'GCM256:Generating...'}
              </div>
            </div>

            {authStatusMsg && (
              <div className="rounded-xl bg-emerald-500/15 border border-emerald-500/40 px-3.5 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                {authStatusMsg}
              </div>
            )}

            <button
              type="submit"
              className="btn-duo w-full rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black py-3.5 shadow-[0_4px_0_0_#4c1d95] cursor-pointer"
            >
              {dict.saveProfile}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 4. PETA LEVEL DUOLINGO & LEMBAR TEKS PROSEDUR MODAL
  if (activeModal === 'levels' || activeModal === 'guide') {
    return (
      <div
        className="fixed inset-0 z-30 flex items-center justify-center p-4 pointer-events-auto overflow-y-auto"
        style={{ backgroundColor: 'rgba(9, 5, 20, 0.84)' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="levels-modal-title"
      >
        <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border-2 border-purple-500 p-6 md:p-7 shadow-2xl text-slate-900 dark:text-slate-100 my-auto">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 id="levels-modal-title" className="text-2xl font-black text-purple-600 dark:text-purple-300">
                {dict.levelMap} & Materi Teks Prosedur
              </h2>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                Pilih level prosedural 3D dan pelajari struktur Teks Prosedur Bahasa Indonesia
              </p>
            </div>
            <button
              type="button"
              onClick={onCloseModal}
              className="rounded-xl px-3.5 py-2 text-xs font-extrabold bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              {dict.closeModal}
            </button>
          </div>

          {/* Duolingo-style Winding Level Nodes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-6">
            {PROCEDURAL_LEVELS.map((lvl) => {
              const isCurrent = activeLevel.id === lvl.id;
              const stars =
                lvl.id === 1
                  ? profile.level1Stars
                  : lvl.id === 2
                    ? profile.level2Stars
                    : profile.level3Stars;
              return (
                <div
                  key={lvl.id}
                  className={`rounded-2xl p-4 border-2 flex flex-col justify-between ${
                    isCurrent
                      ? 'border-purple-500 bg-purple-50/70 dark:bg-purple-950/50'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-xs font-black text-purple-600 dark:text-purple-300 mb-1">
                      <span>{lvl.difficultyLabel}</span>
                      <span className="text-amber-500 tabular-nums">
                        {'★'.repeat(stars) + '☆'.repeat(3 - stars)}
                      </span>
                    </div>
                    <h3 className="text-base font-black mb-1">{lvl.title}</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">{lvl.subtitle}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectLevelAndPlay(lvl)}
                    className="btn-duo w-full rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs py-2.5 shadow-[0_3px_0_0_#4c1d95] cursor-pointer"
                  >
                    Praktik Level {lvl.id} (+{lvl.xpReward} XP)
                  </button>
                </div>
              );
            })}
          </div>

          {/* Complete Teks Prosedur Sheet for Active Level */}
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-purple-700 dark:text-purple-300">
                Lembar Teks Prosedur: {activeLevel.title}
              </h3>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {activeLevel.categoryVerb}
              </span>
            </div>

            <div className="text-xs leading-relaxed">
              <strong className="text-slate-900 dark:text-white">1. Tujuan: </strong>
              <span className="text-slate-700 dark:text-slate-300">{activeLevel.teksProsedur.tujuan}</span>
            </div>

            <div className="text-xs leading-relaxed">
              <strong className="text-slate-900 dark:text-white">2. Bahan & Alat: </strong>
              <ul className="list-disc list-inside text-slate-700 dark:text-slate-300 mt-1 space-y-0.5">
                {activeLevel.teksProsedur.bahanAlat.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="text-xs leading-relaxed">
              <strong className="text-slate-900 dark:text-white">3. Langkah-langkah Prosedural: </strong>
              <ol className="list-decimal list-inside text-slate-700 dark:text-slate-300 mt-1 space-y-0.5">
                {activeLevel.teksProsedur.langkahRingkas.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>

            <div className="text-xs leading-relaxed">
              <strong className="text-slate-900 dark:text-white">4. Penutup / Penegasan Ulang: </strong>
              <span className="text-slate-700 dark:text-slate-300">{activeLevel.teksProsedur.penutup}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 5. LEADERBOARD (PAPAN SKOR KOMPETITIF) MODAL
  if (activeModal === 'leaderboard') {
    return (
      <div
        className="fixed inset-0 z-30 flex items-center justify-center p-4 pointer-events-auto overflow-y-auto"
        style={{ backgroundColor: 'rgba(9, 5, 20, 0.84)' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="leaderboard-modal-title"
      >
        <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-slate-900 border-2 border-purple-500 p-6 md:p-7 shadow-2xl text-slate-900 dark:text-slate-100 my-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 id="leaderboard-modal-title" className="text-2xl font-black text-purple-600 dark:text-purple-300">
                {dict.leaderboard} — Liga Ksatria Ungu
              </h2>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                {isOnline ? dict.cloudSynced : dict.offlineCached}
              </p>
            </div>
            <button
              type="button"
              onClick={onCloseModal}
              className="rounded-xl px-3.5 py-2 text-xs font-extrabold bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              {dict.closeModal}
            </button>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden mb-5">
            {leaderboardRows.map((row, idx) => {
              const isMe = row.uid === profile.uid;
              return (
                <div
                  key={row.uid}
                  className={`flex items-center justify-between px-4 py-3 text-sm ${
                    isMe
                      ? 'bg-purple-100/80 dark:bg-purple-950/60 font-black'
                      : 'bg-white dark:bg-slate-900 font-bold'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center font-mono font-black tabular-nums text-purple-600 dark:text-purple-300">
                      #{idx + 1}
                    </span>
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0"
                      style={{ backgroundColor: row.avatarColor || '#7c3aed' }}
                    >
                      {row.displayName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-slate-900 dark:text-white leading-tight">
                        {row.displayName} {isMe ? '(Anda)' : ''}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {row.schoolClass} · {row.completedLevels} Level Tuntas · {row.streak} Hari Streak
                      </div>
                    </div>
                  </div>
                  <div className="font-mono font-black text-sm tabular-nums text-purple-700 dark:text-purple-300">
                    {row.xp} XP
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
              {cloudSynced ? 'Data skor tersinkron dengan Cloud Firestore' : 'Tersimpan di perangkat (siap sinkron)'}
            </span>
            <button
              type="button"
              onClick={onTriggerCloudSync}
              className="btn-duo rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs px-4 py-2.5 shadow-[0_3px_0_0_#4c1d95] cursor-pointer"
            >
              {dict.syncNow}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 6. SETTINGS, THEME, LANGUAGE, DAILY REMINDER & SECURITY MODAL
  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center p-4 pointer-events-auto overflow-y-auto"
      style={{ backgroundColor: 'rgba(9, 5, 20, 0.84)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-slate-900 border-2 border-purple-500 p-6 md:p-7 shadow-2xl text-slate-900 dark:text-slate-100 my-auto space-y-5">
        <div className="flex items-center justify-between">
          <h2 id="settings-modal-title" className="text-2xl font-black text-purple-600 dark:text-purple-300">
            {dict.settings}
          </h2>
          <button
            type="button"
            onClick={onCloseModal}
            className="rounded-xl px-3.5 py-2 text-xs font-extrabold bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer"
          >
            {dict.closeModal}
          </button>
        </div>

        {/* Bahasa Sistem (Indonesian / English System UI) */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
          <div className="text-sm font-black mb-1">{dict.languageSetting}</div>
          <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">{dict.languageNote}</p>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => onChangeLanguage('id')}
              className={`btn-duo rounded-xl py-2.5 px-3 text-xs font-extrabold border cursor-pointer ${
                profile.systemLang === 'id'
                  ? 'bg-purple-600 text-white border-purple-400 shadow-[0_3px_0_0_#4c1d95]'
                  : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700'
              }`}
            >
              Bahasa Indonesia (Sistem)
            </button>
            <button
              type="button"
              onClick={() => onChangeLanguage('en')}
              className={`btn-duo rounded-xl py-2.5 px-3 text-xs font-extrabold border cursor-pointer ${
                profile.systemLang === 'en'
                  ? 'bg-purple-600 text-white border-purple-400 shadow-[0_3px_0_0_#4c1d95]'
                  : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700'
              }`}
            >
              English (System UI Only)
            </button>
          </div>
        </div>

        {/* Tema Ungu & Mode Malam (Dark Mode) */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-black">{dict.darkModeSetting}</span>
            <button
              type="button"
              onClick={() => onToggleDarkMode(!profile.darkMode)}
              className={`btn-duo rounded-xl px-4 py-2 text-xs font-extrabold cursor-pointer ${
                profile.darkMode
                  ? 'bg-purple-600 text-white shadow-[0_3px_0_0_#4c1d95]'
                  : 'bg-slate-200 text-slate-900'
              }`}
            >
              {profile.darkMode ? 'Mode Gelap: AKTIF' : 'Mode Terang: AKTIF'}
            </button>
          </div>

          <div>
            <div className="text-xs font-extrabold uppercase text-slate-500 dark:text-slate-400 mb-2">
              {dict.themeSetting}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'royal', label: 'Ungu Ksatria' },
                  { id: 'amethyst', label: 'Amethyst Dalam' },
                  { id: 'lavender', label: 'Lavender Cerah' },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onChangeTheme(t.id)}
                  className={`btn-duo rounded-xl py-2 px-3 text-xs font-extrabold border cursor-pointer ${
                    profile.themeVariant === t.id
                      ? 'bg-purple-600 text-white border-yellow-400'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Pengingat Belajar Harian (Daily Notification) */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-black">{dict.reminderSetting}</span>
            <input
              type="time"
              aria-label={dict.reminderTime}
              value={reminderTimeInput}
              onChange={(e) => {
                setReminderTimeInput(e.target.value);
                onToggleReminder(reminderEnabled, e.target.value);
              }}
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs font-mono font-bold"
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                const next = !reminderEnabled;
                onToggleReminder(next, reminderTimeInput);
                if (next && typeof window !== 'undefined' && 'Notification' in window) {
                  Notification.requestPermission().catch(() => {});
                }
                setReminderToast(
                  next
                    ? `Pengingat harian dijadwalkan setiap pukul ${reminderTimeInput}.`
                    : 'Pengingat harian dinonaktifkan.',
                );
              }}
              className={`btn-duo rounded-xl px-4 py-2 text-xs font-extrabold cursor-pointer ${
                reminderEnabled
                  ? 'bg-emerald-600 text-white'
                  : 'bg-purple-600 text-white shadow-[0_3px_0_0_#4c1d95]'
              }`}
            >
              {reminderEnabled ? 'Notifikasi Aktif' : dict.reminderEnable}
            </button>
            {reminderToast && (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{reminderToast}</span>
            )}
          </div>
        </div>

        {/* Keamanan Enkripsi AES-256-GCM & Cloud Sync */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
          <div className="text-sm font-black text-purple-600 dark:text-purple-300">{dict.encryptionTitle}</div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{dict.encryptionDesc}</p>
          <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
            Status Jaringan: {isOnline ? dict.cloudSynced : dict.offlineCached}
          </div>
        </div>
      </div>
    </div>
  );
};
