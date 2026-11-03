/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  PROCEDURAL_LEVELS,
  SYSTEM_STRINGS,
  type ProceduralLevel,
  type SystemLanguage,
  type ThemeVariant,
} from './game/proceduralData';
import {
  evaluateStepAccuracy,
  calculateLevelReward,
  type StepEvaluationResult,
  type UserProfileData,
} from './game/rules';
import { ProceduralScene3D } from './components/ProceduralScene3D';
import { TitleScreenOverlay } from './components/TitleScreenOverlay';
import { PlayingHudOverlay } from './components/PlayingHudOverlay';
import { ModalsOverlay, type ActiveModalType } from './components/ModalsOverlay';
import { useOnlineStatus } from './components/PWAInstallButton';
import { playSoundEffect } from './utils/sound';
import {
  auth,
  onAuthStateChanged,
  signInWithGooglePopup,
  signOutUser,
  fetchCloudUserProfile,
  syncUserProfileToCloud,
  fetchLeaderboardEntries,
  INITIAL_COMPETITIVE_LEADERBOARD,
  type LeaderboardRow,
} from './firebase';

const LOCAL_STORAGE_PROFILE_KEY = 'teka_teki_ksatria_profile_v1';
const LOCAL_STORAGE_NOTES_KEY = 'teka_teki_ksatria_notes_v1';

const DEFAULT_PROFILE: UserProfileData = {
  uid: 'ksatria_lokal_01',
  displayName: 'Ksatria Muda',
  schoolClass: 'Kelas 7A · SMPN 1',
  avatarColor: '#7c3aed',
  xp: 120,
  streak: 3,
  completedLevels: 0,
  level1Stars: 0,
  level2Stars: 0,
  level3Stars: 0,
  themeVariant: 'royal',
  darkMode: true,
  systemLang: 'id',
  dailyReminderTime: '16:00',
};

export default function App() {
  const isOnline = useOnlineStatus();

  // Check ?autostart=1 query parameter to skip directly to 'playing'
  const initialAutoStart =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('autostart') === '1';

  const [gameState, setGameState] = useState<'title' | 'playing' | 'paused' | 'gameover'>(
    initialAutoStart ? 'playing' : 'title',
  );
  const [activeModal, setActiveModal] = useState<ActiveModalType>('none');

  const [profile, setProfile] = useState<UserProfileData>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
      if (saved) {
        return { ...DEFAULT_PROFILE, ...JSON.parse(saved) };
      }
    } catch {
      // ignore storage error
    }
    return DEFAULT_PROFILE;
  });

  const [privateNotes, setPrivateNotes] = useState<string>(() => {
    try {
      return (
        localStorage.getItem(LOCAL_STORAGE_NOTES_KEY) ||
        'Berlatih menyusun kalimat imperatif dan konjungsi urutan dalam Teks Prosedur.'
      );
    } catch {
      return 'Berlatih Teks Prosedur Bahasa Indonesia.';
    }
  });

  const [isGoogleAuthenticated, setIsGoogleAuthenticated] = useState(false);
  const [cloudSynced, setCloudSynced] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(true);

  const [activeLevel, setActiveLevel] = useState<ProceduralLevel>(PROCEDURAL_LEVELS[0]);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [currentMeasureValue, setCurrentMeasureValue] = useState<number>(
    PROCEDURAL_LEVELS[0].steps[0].minVal,
  );
  const [stepFeedback, setStepFeedback] = useState<StepEvaluationResult | null>(null);
  const [stepAccuracies, setStepAccuracies] = useState<number[]>([]);
  const [mistakesCount, setMistakesCount] = useState(0);
  const [explodedAmount, setExplodedAmount] = useState(0);
  const [cameraPresetIndex, setCameraPresetIndex] = useState(0);
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [muted, setMuted] = useState(false);
  const [stepPulseTrigger, setStepPulseTrigger] = useState(0);

  const [lastRunStats, setLastRunStats] = useState<{
    clearTimeSec: number;
    xpEarned: number;
    accuracy: number;
    stars: 1 | 2 | 3;
  }>({
    clearTimeSec: 45,
    xpEarned: 180,
    accuracy: 100,
    stars: 3,
  });

  const [leaderboardRows, setLeaderboardRows] = useState<LeaderboardRow[]>(
    INITIAL_COMPETITIVE_LEADERBOARD,
  );

  const levelStartTimeRef = useRef<number>(Date.now());
  const dict = SYSTEM_STRINGS[profile.systemLang] || SYSTEM_STRINGS.id;
  const activeStep = activeLevel.steps[activeStepIndex] || activeLevel.steps[0];

  // Mirror game state to document.body.dataset.state & sync dark mode class on <html>
  useEffect(() => {
    document.body.dataset.state = gameState;
  }, [gameState]);

  useEffect(() => {
    const html = document.documentElement;
    if (profile.darkMode) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, [profile.darkMode]);

  // Persist profile locally for instant offline support
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(profile));
    } catch {
      // ignore
    }
  }, [profile]);

  // Refresh Leaderboard whenever profile changes
  useEffect(() => {
    const myRow: LeaderboardRow = {
      uid: profile.uid,
      displayName: profile.displayName,
      schoolClass: profile.schoolClass,
      avatarColor: profile.avatarColor,
      xp: profile.xp,
      streak: profile.streak,
      completedLevels: profile.completedLevels,
    };
    fetchLeaderboardEntries(myRow).then((rows) => {
      setLeaderboardRows(rows);
    });
  }, [
    profile.uid,
    profile.displayName,
    profile.schoolClass,
    profile.avatarColor,
    profile.xp,
    profile.streak,
    profile.completedLevels,
  ]);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsGoogleAuthenticated(true);
        const cloudProfile = await fetchCloudUserProfile(user.uid);
        if (cloudProfile) {
          setProfile(cloudProfile);
          setCloudSynced(true);
        } else {
          setProfile((prev) => {
            const merged: UserProfileData = {
              ...prev,
              uid: user.uid,
              displayName: user.displayName || prev.displayName,
            };
            syncUserProfileToCloud(merged, privateNotes).then((ok) => setCloudSynced(ok));
            return merged;
          });
        }
      } else {
        setIsGoogleAuthenticated(false);
      }
    });
    return () => unsub();
  }, []);

  // Auto-sync queued offline changes when connection returns
  useEffect(() => {
    if (isOnline && isGoogleAuthenticated) {
      syncUserProfileToCloud(profile, privateNotes).then((ok) => {
        if (ok) setCloudSynced(true);
      });
    }
  }, [isOnline, isGoogleAuthenticated]);

  const startLevelRun = (level: ProceduralLevel) => {
    setActiveLevel(level);
    setActiveStepIndex(0);
    setCurrentMeasureValue(level.steps[0].minVal);
    setStepFeedback(null);
    setStepAccuracies([]);
    setMistakesCount(0);
    setExplodedAmount(0);
    setCameraPresetIndex(0);
    setActiveModal('none');
    levelStartTimeRef.current = Date.now();
    document.body.dataset.state = 'playing';
    setGameState('playing');
    playSoundEffect('click', muted);
  };

  const handleIncrementMeasure = () => {
    const step = activeLevel.steps[activeStepIndex];
    const nextVal = Math.min(step.maxVal, currentMeasureValue + step.stepIncrement);
    setCurrentMeasureValue(nextVal);
    setStepPulseTrigger((c) => c + 1);
    const ratio = (nextVal - step.minVal) / Math.max(1, step.targetVal - step.minVal);
    playSoundEffect('pour', muted, ratio);
  };

  const handleVerifyCurrentStep = () => {
    const step = activeLevel.steps[activeStepIndex];
    const evalRes = evaluateStepAccuracy(
      currentMeasureValue,
      step.targetVal,
      step.tolerance,
      step.unit,
    );
    setStepFeedback(evalRes);
    setStepPulseTrigger((c) => c + 1);

    if (!evalRes.passed) {
      setMistakesCount((m) => m + 1);
      playSoundEffect('stepWarn', muted);
      return;
    }

    playSoundEffect('stepSuccess', muted);
    const updatedAccs = [...stepAccuracies, evalRes.accuracyPercent];
    setStepAccuracies(updatedAccs);

    // Check if there is a next step in this level
    if (activeStepIndex + 1 < activeLevel.steps.length) {
      const nextIdx = activeStepIndex + 1;
      window.setTimeout(() => {
        setActiveStepIndex(nextIdx);
        setCurrentMeasureValue(activeLevel.steps[nextIdx].minVal);
        setStepFeedback(null);
      }, 650);
    } else {
      // Level Complete! Calculate rewards and transition to 'gameover' (Victory modal)
      const elapsedSec = Math.max(5, Math.round((Date.now() - levelStartTimeRef.current) / 1000));
      const reward = calculateLevelReward({
        baseXp: activeLevel.xpReward,
        stepAccuracies: updatedAccs,
        mistakesCount,
        elapsedSeconds: elapsedSec,
      });

      setLastRunStats({
        clearTimeSec: elapsedSec,
        xpEarned: reward.totalXp,
        accuracy: reward.averageAccuracy,
        stars: reward.stars,
      });

      setProfile((prev) => {
        const nextCompleted = Math.max(prev.completedLevels, activeLevel.id);
        const updated: UserProfileData = {
          ...prev,
          xp: prev.xp + reward.totalXp,
          completedLevels: nextCompleted,
          level1Stars: activeLevel.id === 1 ? Math.max(prev.level1Stars, reward.stars) : prev.level1Stars,
          level2Stars: activeLevel.id === 2 ? Math.max(prev.level2Stars, reward.stars) : prev.level2Stars,
          level3Stars: activeLevel.id === 3 ? Math.max(prev.level3Stars, reward.stars) : prev.level3Stars,
        };
        if (isOnline && isGoogleAuthenticated) {
          syncUserProfileToCloud(updated, privateNotes).then((ok) => setCloudSynced(ok));
        }
        return updated;
      });

      playSoundEffect('levelWin', muted);
      document.body.dataset.state = 'gameover';
      setGameState('gameover');
    }
  };

  // Global Keyboard Shortcuts (Enter/Space on Title, Space action in Playing, 1-3 Level select, H Dock, Esc/P Pause, M Mute, R Restart)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (gameState === 'title' && activeModal === 'none') {
        if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          startLevelRun(activeLevel);
          return;
        }
      }

      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (activeModal !== 'none') {
          setActiveModal('none');
          return;
        }
        if (gameState === 'playing') {
          document.body.dataset.state = 'paused';
          setGameState('paused');
          return;
        }
        if (gameState === 'paused') {
          document.body.dataset.state = 'playing';
          setGameState('playing');
          return;
        }
      }

      if (gameState === 'playing' && activeModal === 'none') {
        if (e.code === 'Space') {
          e.preventDefault();
          handleIncrementMeasure();
        } else if (e.code === 'Enter') {
          e.preventDefault();
          handleVerifyCurrentStep();
        } else if (e.code === 'KeyH') {
          setDockCollapsed((c) => !c);
        } else if (e.code === 'KeyM') {
          setMuted((m) => !m);
        } else if (e.code === 'KeyR') {
          startLevelRun(activeLevel);
        } else if (e.code === 'Digit1') {
          startLevelRun(PROCEDURAL_LEVELS[0]);
        } else if (e.code === 'Digit2') {
          startLevelRun(PROCEDURAL_LEVELS[1]);
        } else if (e.code === 'Digit3') {
          startLevelRun(PROCEDURAL_LEVELS[2]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <main className="relative w-screen h-screen overflow-hidden select-none">
      {/* Isolated Full-Bleed Three.js 3D Procedural Simulation */}
      <ProceduralScene3D
        gameState={gameState}
        activeLevel={activeLevel}
        activeStepIndex={activeStepIndex}
        currentMeasureValue={currentMeasureValue}
        explodedAmount={explodedAmount}
        cameraPresetIndex={cameraPresetIndex}
        darkMode={profile.darkMode}
        stepPulseTrigger={stepPulseTrigger}
        onScenePropInteract={handleIncrementMeasure}
      />

      {/* Title Screen Overlay */}
      {gameState === 'title' && (
        <TitleScreenOverlay
          dict={dict}
          profile={profile}
          isGoogleAuthenticated={isGoogleAuthenticated}
          activeLevel={activeLevel}
          onSelectLevel={(lvl) => {
            setActiveLevel(lvl);
            playSoundEffect('click', muted);
          }}
          onStartGame={() => startLevelRun(activeLevel)}
          onOpenAuthModal={() => setActiveModal('auth')}
          onOpenLeaderboard={() => setActiveModal('leaderboard')}
          onOpenSettings={() => setActiveModal('settings')}
        />
      )}

      {/* Active Gameplay HUD & Collapsible Bottom Dock */}
      {gameState === 'playing' && (
        <PlayingHudOverlay
          dict={dict}
          profile={profile}
          activeLevel={activeLevel}
          activeStep={activeStep}
          activeStepIndex={activeStepIndex}
          currentMeasureValue={currentMeasureValue}
          stepFeedback={stepFeedback}
          explodedAmount={explodedAmount}
          cameraPresetIndex={cameraPresetIndex}
          dockCollapsed={dockCollapsed}
          muted={muted}
          isOnline={isOnline}
          onIncrementMeasure={handleIncrementMeasure}
          onChangeMeasureSlider={(val) => {
            setCurrentMeasureValue(val);
            setStepFeedback(null);
          }}
          onResetMeasure={() => {
            setCurrentMeasureValue(activeStep.minVal);
            setStepFeedback(null);
            playSoundEffect('click', muted);
          }}
          onVerifyStep={handleVerifyCurrentStep}
          onChangeExploded={setExplodedAmount}
          onChangeCameraPreset={setCameraPresetIndex}
          onToggleDock={() => setDockCollapsed((c) => !c)}
          onToggleMute={() => setMuted((m) => !m)}
          onPauseGame={() => {
            document.body.dataset.state = 'paused';
            setGameState('paused');
          }}
          onRestartLevel={() => startLevelRun(activeLevel)}
          onOpenModal={(m) => setActiveModal(m)}
        />
      )}

      {/* Pause, Victory, Auth, Level Map, Leaderboard & Settings Modals */}
      <ModalsOverlay
        gameState={gameState}
        activeModal={activeModal}
        dict={dict}
        profile={profile}
        privateNotes={privateNotes}
        isGoogleAuthenticated={isGoogleAuthenticated}
        isOnline={isOnline}
        cloudSynced={cloudSynced}
        activeLevel={activeLevel}
        lastRunStats={lastRunStats}
        leaderboardRows={leaderboardRows}
        reminderEnabled={reminderEnabled}
        onCloseModal={() => setActiveModal('none')}
        onResumeGame={() => {
          document.body.dataset.state = 'playing';
          setGameState('playing');
        }}
        onRestartLevel={() => startLevelRun(activeLevel)}
        onBackToTitle={() => {
          setActiveModal('none');
          document.body.dataset.state = 'title';
          setGameState('title');
        }}
        onNextLevel={() => {
          const nextIdx = activeLevel.id < 3 ? activeLevel.id : 0;
          startLevelRun(PROCEDURAL_LEVELS[nextIdx]);
        }}
        onSelectLevelAndPlay={(lvl) => startLevelRun(lvl)}
        onGoogleLogin={async () => {
          await signInWithGooglePopup();
        }}
        onGoogleLogout={async () => {
          await signOutUser();
        }}
        onSaveProfileAndNotes={async (name, schoolClass, notes, avatarColor) => {
          setPrivateNotes(notes);
          try {
            localStorage.setItem(LOCAL_STORAGE_NOTES_KEY, notes);
          } catch {
            // ignore
          }
          const updated: UserProfileData = {
            ...profile,
            displayName: name,
            schoolClass,
            avatarColor,
          };
          setProfile(updated);
          if (isOnline && isGoogleAuthenticated) {
            const ok = await syncUserProfileToCloud(updated, notes);
            setCloudSynced(ok);
          }
        }}
        onChangeLanguage={(lang: SystemLanguage) => {
          setProfile((prev) => ({ ...prev, systemLang: lang }));
        }}
        onChangeTheme={(theme: ThemeVariant) => {
          setProfile((prev) => ({ ...prev, themeVariant: theme }));
        }}
        onToggleDarkMode={(dark: boolean) => {
          setProfile((prev) => ({ ...prev, darkMode: dark }));
        }}
        onToggleReminder={(enabled: boolean, timeStr: string) => {
          setReminderEnabled(enabled);
          setProfile((prev) => ({ ...prev, dailyReminderTime: timeStr }));
        }}
        onTriggerCloudSync={async () => {
          const ok = await syncUserProfileToCloud(profile, privateNotes);
          setCloudSynced(ok);
        }}
      />
    </main>
  );
}
