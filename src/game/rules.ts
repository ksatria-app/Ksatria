export interface StepEvaluationResult {
  passed: boolean;
  accuracyPercent: number;
  stars: 1 | 2 | 3 | 0;
  status: 'sempurna' | 'tepat' | 'kurang' | 'lebih';
  feedbackId: string; // Bahasa Indonesia instant feedback
}

/**
 * Evaluates a user's 3D procedural step action against the target measurement and tolerance.
 */
export function evaluateStepAccuracy(
  currentValue: number,
  targetValue: number,
  tolerance: number,
  unit: string,
): StepEvaluationResult {
  const diff = currentValue - targetValue;
  const absDiff = Math.abs(diff);

  if (absDiff <= tolerance * 0.35) {
    return {
      passed: true,
      accuracyPercent: 100,
      stars: 3,
      status: 'sempurna',
      feedbackId: `Sempurna! Takaran ${currentValue} ${unit} sangat presisi sesuai teks prosedur.`,
    };
  }

  if (absDiff <= tolerance) {
    const ratio = 1 - absDiff / (tolerance * 2);
    const accuracyPercent = Math.max(85, Math.min(99, Math.round(ratio * 100)));
    return {
      passed: true,
      accuracyPercent,
      stars: 3,
      status: 'tepat',
      feedbackId: `Tepat! Ukuran ${currentValue} ${unit} berada dalam batas toleransi langkah prosedur.`,
    };
  }

  const maxRange = Math.max(targetValue, 100);
  const rawAccuracy = Math.max(0, Math.round((1 - absDiff / maxRange) * 100));

  if (diff < 0) {
    return {
      passed: false,
      accuracyPercent: rawAccuracy,
      stars: 0,
      status: 'kurang',
      feedbackId: `Masih kurang ${Math.abs(diff)} ${unit}. Tambahkan lagi hingga mencapai target ${targetValue} ${unit}!`,
    };
  }

  return {
    passed: false,
    accuracyPercent: rawAccuracy,
    stars: 0,
    status: 'lebih',
    feedbackId: `Kelebihan ${diff} ${unit}! Tekan tombol "Ulangi Takaran" lalu takar tepat pada ${targetValue} ${unit}.`,
  };
}

export interface LevelRewardInput {
  baseXp: number;
  stepAccuracies: number[];
  mistakesCount: number;
  elapsedSeconds: number;
}

export interface LevelRewardOutput {
  totalXp: number;
  averageAccuracy: number;
  stars: 1 | 2 | 3;
}

/**
 * Calculates total XP, average precision, and 1-3 star rating upon completing a procedural level.
 */
export function calculateLevelReward(input: LevelRewardInput): LevelRewardOutput {
  const count = input.stepAccuracies.length;
  const sum = input.stepAccuracies.reduce((acc, v) => acc + v, 0);
  const averageAccuracy = count > 0 ? Math.round(sum / count) : 100;

  const speedBonus = input.elapsedSeconds <= 90 ? 30 : input.elapsedSeconds <= 180 ? 15 : 0;
  const accuracyBonus = Math.round((averageAccuracy / 100) * 50);
  const penalty = Math.min(40, input.mistakesCount * 10);

  const totalXp = Math.max(50, input.baseXp + speedBonus + accuracyBonus - penalty);

  let stars: 1 | 2 | 3 = 3;
  if (input.mistakesCount >= 4 || averageAccuracy < 75) {
    stars = 1;
  } else if (input.mistakesCount >= 2 || averageAccuracy < 90) {
    stars = 2;
  }

  return {
    totalXp,
    averageAccuracy,
    stars,
  };
}

export interface UserProfileData {
  uid: string;
  displayName: string;
  schoolClass: string;
  avatarColor: string;
  xp: number;
  streak: number;
  completedLevels: number;
  level1Stars: number;
  level2Stars: number;
  level3Stars: number;
  themeVariant: 'royal' | 'amethyst' | 'lavender';
  darkMode: boolean;
  systemLang: 'id' | 'en';
  dailyReminderTime: string;
}

const VALID_ID_REGEX = /^[a-zA-Z0-9_\-]+$/;

/**
 * Validates and sanitizes outgoing UserProfile payloads to strictly match firebase-blueprint.json & firestore.rules.
 */
export function validateUserProfilePayload(
  profile: UserProfileData,
  authUid: string,
): { valid: boolean; reason?: string } {
  if (!authUid || !VALID_ID_REGEX.test(authUid) || authUid.length > 128) {
    return { valid: false, reason: 'Invalid auth UID' };
  }
  if (profile.uid !== authUid) {
    return { valid: false, reason: 'UID mismatch with authenticated user' };
  }
  if (typeof profile.displayName !== 'string' || profile.displayName.length < 1 || profile.displayName.length > 60) {
    return { valid: false, reason: 'displayName out of bounds (1..60)' };
  }
  if (typeof profile.schoolClass !== 'string' || profile.schoolClass.length < 1 || profile.schoolClass.length > 40) {
    return { valid: false, reason: 'schoolClass out of bounds (1..40)' };
  }
  if (typeof profile.avatarColor !== 'string' || profile.avatarColor.length < 4 || profile.avatarColor.length > 20) {
    return { valid: false, reason: 'avatarColor out of bounds (4..20)' };
  }
  if (!Number.isInteger(profile.xp) || profile.xp < 0 || profile.xp > 1000000) {
    return { valid: false, reason: 'xp out of bounds' };
  }
  if (!Number.isInteger(profile.streak) || profile.streak < 0 || profile.streak > 3650) {
    return { valid: false, reason: 'streak out of bounds' };
  }
  if (!Number.isInteger(profile.completedLevels) || profile.completedLevels < 0 || profile.completedLevels > 3) {
    return { valid: false, reason: 'completedLevels out of bounds (0..3)' };
  }
  for (const stars of [profile.level1Stars, profile.level2Stars, profile.level3Stars]) {
    if (!Number.isInteger(stars) || stars < 0 || stars > 3) {
      return { valid: false, reason: 'stars out of bounds (0..3)' };
    }
  }
  if (!['royal', 'amethyst', 'lavender'].includes(profile.themeVariant)) {
    return { valid: false, reason: 'Invalid themeVariant' };
  }
  if (typeof profile.darkMode !== 'boolean') {
    return { valid: false, reason: 'Invalid darkMode' };
  }
  if (!['id', 'en'].includes(profile.systemLang)) {
    return { valid: false, reason: 'Invalid systemLang' };
  }
  if (
    typeof profile.dailyReminderTime !== 'string' ||
    profile.dailyReminderTime.length < 4 ||
    profile.dailyReminderTime.length > 10
  ) {
    return { valid: false, reason: 'Invalid dailyReminderTime' };
  }
  return { valid: true };
}

/**
 * Evaluates a simulated Firestore security rule check against the Dirty Dozen payloads.
 */
export function simulateFirestoreRuleCheck(params: {
  collection: 'users' | 'private' | 'leaderboard';
  docId: string;
  authUid: string | null;
  emailVerified: boolean;
  parentUserExists: boolean;
  isUpdate: boolean;
  existingCreatedAt?: number;
  incomingCreatedAt?: number;
  incomingUpdatedAt?: number;
  requestTime: number;
  payload: Record<string, unknown>;
}): { allowed: boolean; reason: string } {
  const {
    collection,
    docId,
    authUid,
    emailVerified,
    parentUserExists,
    isUpdate,
    existingCreatedAt,
    incomingCreatedAt,
    incomingUpdatedAt,
    requestTime,
    payload,
  } = params;

  if (!authUid) return { allowed: false, reason: 'Unauthenticated' };
  if (!emailVerified) return { allowed: false, reason: 'Email not verified' };
  if (!VALID_ID_REGEX.test(docId) || docId.length < 1 || docId.length > 128) {
    return { allowed: false, reason: 'Invalid path ID' };
  }
  if (incomingUpdatedAt !== requestTime) {
    return { allowed: false, reason: 'Temporal integrity violation on updatedAt' };
  }

  if (collection === 'users') {
    if (docId !== authUid) return { allowed: false, reason: 'Not document owner' };
    const allowedKeys = new Set([
      'uid',
      'displayName',
      'schoolClass',
      'avatarColor',
      'xp',
      'streak',
      'completedLevels',
      'level1Stars',
      'level2Stars',
      'level3Stars',
      'themeVariant',
      'darkMode',
      'systemLang',
      'dailyReminderTime',
      'createdAt',
      'updatedAt',
    ]);
    const keys = Object.keys(payload);
    if (keys.length !== allowedKeys.size || keys.some((k) => !allowedKeys.has(k))) {
      return { allowed: false, reason: 'Shadow or missing keys on UserProfile' };
    }
    if (isUpdate && incomingCreatedAt !== existingCreatedAt) {
      return { allowed: false, reason: 'Immutable createdAt modified' };
    }
    if (!isUpdate && incomingCreatedAt !== requestTime) {
      return { allowed: false, reason: 'Invalid createdAt on create' };
    }
    const check = validateUserProfilePayload(payload as unknown as UserProfileData, authUid);
    if (!check.valid) return { allowed: false, reason: check.reason || 'Invalid schema' };
    return { allowed: true, reason: 'Allowed' };
  }

  if (collection === 'private') {
    if (docId !== 'vault') return { allowed: false, reason: 'Invalid vaultId' };
    if (!parentUserExists) return { allowed: false, reason: 'Orphaned private vault without parent user' };
    const allowedKeys = new Set([
      'uid',
      'encryptedEmail',
      'encryptedNotes',
      'cipherAlgorithm',
      'createdAt',
      'updatedAt',
    ]);
    const keys = Object.keys(payload);
    if (keys.length !== allowedKeys.size || keys.some((k) => !allowedKeys.has(k))) {
      return { allowed: false, reason: 'Shadow or missing keys on UserPrivateVault' };
    }
    if (payload.uid !== authUid) return { allowed: false, reason: 'UID mismatch' };
    if (payload.cipherAlgorithm !== 'AES-256-GCM') return { allowed: false, reason: 'Invalid cipher' };
    return { allowed: true, reason: 'Allowed' };
  }

  if (collection === 'leaderboard') {
    if (docId !== authUid) return { allowed: false, reason: 'Not leaderboard entry owner' };
    if (!parentUserExists) return { allowed: false, reason: 'Missing parent user document' };
    return { allowed: true, reason: 'Allowed' };
  }

  return { allowed: false, reason: 'Default deny' };
}
