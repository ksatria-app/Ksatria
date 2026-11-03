import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { validateUserProfilePayload, type UserProfileData } from './game/rules';
import { encryptWithAesGcm } from './utils/cryptoVault';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection on boot as required by firebase-integration-rpc skill
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

export interface LeaderboardRow {
  uid: string;
  displayName: string;
  schoolClass: string;
  avatarColor: string;
  xp: number;
  streak: number;
  completedLevels: number;
}

export const INITIAL_COMPETITIVE_LEADERBOARD: LeaderboardRow[] = [
  {
    uid: 'ksatria_nadia',
    displayName: 'Nadia Putri Ksatria',
    schoolClass: 'Kelas 8A · SMPN 1',
    avatarColor: '#9333ea',
    xp: 620,
    streak: 14,
    completedLevels: 3,
  },
  {
    uid: 'ksatria_rizky',
    displayName: 'Rizky Pratama',
    schoolClass: 'Kelas 7B · SMPN 4',
    avatarColor: '#7c3aed',
    xp: 540,
    streak: 9,
    completedLevels: 3,
  },
  {
    uid: 'ksatria_aisyah',
    displayName: 'Aisyah Maharani',
    schoolClass: 'Kelas 9C · SMP Ksatria',
    avatarColor: '#6d28d9',
    xp: 480,
    streak: 7,
    completedLevels: 2,
  },
  {
    uid: 'ksatria_bagas',
    displayName: 'Bagas Adi Nugroho',
    schoolClass: 'Kelas 7A · SMPN 2',
    avatarColor: '#a855f7',
    xp: 390,
    streak: 5,
    completedLevels: 2,
  },
  {
    uid: 'ksatria_citra',
    displayName: 'Citra Kirana',
    schoolClass: 'Kelas 8D · SMPN 5',
    avatarColor: '#c084fc',
    xp: 310,
    streak: 4,
    completedLevels: 1,
  },
];

export async function signInWithGooglePopup(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signOutUser(): Promise<void> {
  await firebaseSignOut(auth);
}

export { onAuthStateChanged, type User };

/**
 * Loads user profile from Firestore when authenticated.
 */
export async function fetchCloudUserProfile(uid: string): Promise<UserProfileData | null> {
  if (!auth.currentUser || auth.currentUser.uid !== uid) return null;
  const userPath = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      uid: String(data.uid || uid),
      displayName: String(data.displayName || 'Ksatria Bahasa'),
      schoolClass: String(data.schoolClass || 'Kelas 7A'),
      avatarColor: String(data.avatarColor || '#7c3aed'),
      xp: Number(data.xp || 0),
      streak: Number(data.streak || 1),
      completedLevels: Number(data.completedLevels || 0),
      level1Stars: Number(data.level1Stars || 0),
      level2Stars: Number(data.level2Stars || 0),
      level3Stars: Number(data.level3Stars || 0),
      themeVariant: (data.themeVariant as 'royal' | 'amethyst' | 'lavender') || 'royal',
      darkMode: Boolean(data.darkMode),
      systemLang: (data.systemLang as 'id' | 'en') || 'id',
      dailyReminderTime: String(data.dailyReminderTime || '16:00'),
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('Missing or insufficient permissions')) {
      handleFirestoreError(error, OperationType.GET, userPath);
    }
    return null;
  }
}

/**
 * Syncs user profile, encrypted private vault, and public leaderboard entry to Firestore.
 */
export async function syncUserProfileToCloud(
  profile: UserProfileData,
  privateNotes: string,
): Promise<boolean> {
  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.emailVerified || currentUser.uid !== profile.uid) {
    return false;
  }

  const sanitized: UserProfileData = {
    uid: currentUser.uid,
    displayName: (profile.displayName || 'Ksatria Bahasa').trim().slice(0, 60) || 'Ksatria Bahasa',
    schoolClass: (profile.schoolClass || 'Kelas 7A').trim().slice(0, 40) || 'Kelas 7A',
    avatarColor: (profile.avatarColor || '#7c3aed').slice(0, 20),
    xp: Math.max(0, Math.min(1000000, Math.round(profile.xp))),
    streak: Math.max(0, Math.min(3650, Math.round(profile.streak))),
    completedLevels: Math.max(0, Math.min(3, Math.round(profile.completedLevels))),
    level1Stars: Math.max(0, Math.min(3, Math.round(profile.level1Stars))),
    level2Stars: Math.max(0, Math.min(3, Math.round(profile.level2Stars))),
    level3Stars: Math.max(0, Math.min(3, Math.round(profile.level3Stars))),
    themeVariant: ['royal', 'amethyst', 'lavender'].includes(profile.themeVariant)
      ? profile.themeVariant
      : 'royal',
    darkMode: Boolean(profile.darkMode),
    systemLang: profile.systemLang === 'en' ? 'en' : 'id',
    dailyReminderTime: (profile.dailyReminderTime || '16:00').slice(0, 10),
  };

  const validation = validateUserProfilePayload(sanitized, currentUser.uid);
  if (!validation.valid) {
    return false;
  }

  const userPath = `users/${currentUser.uid}`;
  const userRef = doc(db, 'users', currentUser.uid);

  try {
    const existingSnap = await getDoc(userRef);
    if (!existingSnap.exists()) {
      await setDoc(userRef, {
        ...sanitized,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      const existingData = existingSnap.data();
      await setDoc(userRef, {
        ...sanitized,
        createdAt: existingData.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('Missing or insufficient permissions')) {
      handleFirestoreError(error, OperationType.WRITE, userPath);
    }
    return false;
  }

  // Sync encrypted PII vault (/users/{uid}/private/vault)
  const vaultPath = `users/${currentUser.uid}/private/vault`;
  const vaultRef = doc(db, 'users', currentUser.uid, 'private', 'vault');
  try {
    const encEmail = await encryptWithAesGcm(currentUser.email || 'ksatria@edu.id', currentUser.uid);
    const encNotes = await encryptWithAesGcm(
      privateNotes || 'Catatan latihan Teks Prosedur Bahasa Indonesia',
      currentUser.uid,
    );
    const existingVault = await getDoc(vaultRef);
    if (!existingVault.exists()) {
      await setDoc(vaultRef, {
        uid: currentUser.uid,
        encryptedEmail: encEmail,
        encryptedNotes: encNotes,
        cipherAlgorithm: 'AES-256-GCM',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      const vData = existingVault.data();
      await setDoc(vaultRef, {
        uid: currentUser.uid,
        encryptedEmail: encEmail,
        encryptedNotes: encNotes,
        cipherAlgorithm: 'AES-256-GCM',
        createdAt: vData.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('Missing or insufficient permissions')) {
      handleFirestoreError(error, OperationType.WRITE, vaultPath);
    }
  }

  // Sync Leaderboard Entry (/leaderboard/{uid})
  const lbPath = `leaderboard/${currentUser.uid}`;
  const lbRef = doc(db, 'leaderboard', currentUser.uid);
  try {
    await setDoc(lbRef, {
      uid: currentUser.uid,
      displayName: sanitized.displayName,
      schoolClass: sanitized.schoolClass,
      avatarColor: sanitized.avatarColor,
      xp: sanitized.xp,
      streak: sanitized.streak,
      completedLevels: sanitized.completedLevels,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Missing or insufficient permissions')) {
      handleFirestoreError(error, OperationType.WRITE, lbPath);
    }
  }

  return true;
}

/**
 * Fetches live competitive leaderboard entries from Firestore and merges with Ksatria peers.
 */
export async function fetchLeaderboardEntries(localRow: LeaderboardRow): Promise<LeaderboardRow[]> {
  const mergedMap = new Map<string, LeaderboardRow>();
  for (const row of INITIAL_COMPETITIVE_LEADERBOARD) {
    mergedMap.set(row.uid, row);
  }
  mergedMap.set(localRow.uid, localRow);

  if (auth.currentUser) {
    const lbPath = 'leaderboard';
    try {
      const q = query(
        collection(db, 'leaderboard'),
        where('xp', '>=', 0),
        where('completedLevels', '<=', 3),
        orderBy('xp', 'desc'),
        limit(15),
      );
      const snap = await getDocs(q);
      snap.forEach((docSnap) => {
        const d = docSnap.data();
        mergedMap.set(docSnap.id, {
          uid: String(d.uid || docSnap.id),
          displayName: String(d.displayName || 'Ksatria'),
          schoolClass: String(d.schoolClass || 'Kelas 7'),
          avatarColor: String(d.avatarColor || '#7c3aed'),
          xp: Number(d.xp || 0),
          streak: Number(d.streak || 1),
          completedLevels: Number(d.completedLevels || 0),
        });
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Missing or insufficient permissions')) {
        handleFirestoreError(error, OperationType.LIST, lbPath);
      }
    }
  }

  return Array.from(mergedMap.values()).sort((a, b) => b.xp - a.xp);
}
