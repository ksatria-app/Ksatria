import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateStepAccuracy,
  calculateLevelReward,
  validateUserProfilePayload,
  simulateFirestoreRuleCheck,
} from './rules';
import { PROCEDURAL_LEVELS } from './proceduralData';

test('PROCEDURAL_LEVELS defines 3 complete Indonesian procedural levels with 4 steps each', () => {
  assert.equal(PROCEDURAL_LEVELS.length, 3);
  for (const level of PROCEDURAL_LEVELS) {
    assert.equal(level.steps.length, 4);
    assert.ok(level.title.length > 5);
    assert.ok(level.teksProsedur.tujuan.length > 10);
  }
});

test('evaluateStepAccuracy marks exact target measurement as sempurna (100%, 3 stars)', () => {
  const res = evaluateStepAccuracy(150, 150, 10, 'gram');
  assert.equal(res.passed, true);
  assert.equal(res.status, 'sempurna');
  assert.equal(res.accuracyPercent, 100);
  assert.equal(res.stars, 3);
});

test('evaluateStepAccuracy marks within-tolerance measurement as tepat (passed)', () => {
  const res = evaluateStepAccuracy(158, 150, 10, 'gram');
  assert.equal(res.passed, true);
  assert.equal(res.status, 'tepat');
  assert.ok(res.accuracyPercent >= 85);
});

test('evaluateStepAccuracy rejects under-target and over-target measurements with Indonesian guidance', () => {
  const under = evaluateStepAccuracy(90, 150, 10, 'gram');
  assert.equal(under.passed, false);
  assert.equal(under.status, 'kurang');
  assert.ok(under.feedbackId.includes('Masih kurang'));

  const over = evaluateStepAccuracy(210, 150, 10, 'gram');
  assert.equal(over.passed, false);
  assert.equal(over.status, 'lebih');
  assert.ok(over.feedbackId.includes('Kelebihan'));
});

test('calculateLevelReward computes XP bonus and star rating accurately', () => {
  const perfect = calculateLevelReward({
    baseXp: 150,
    stepAccuracies: [100, 100, 100, 100],
    mistakesCount: 0,
    elapsedSeconds: 60,
  });
  assert.equal(perfect.stars, 3);
  assert.equal(perfect.averageAccuracy, 100);
  assert.equal(perfect.totalXp, 230);

  const manyMistakes = calculateLevelReward({
    baseXp: 150,
    stepAccuracies: [70, 72, 68, 70],
    mistakesCount: 4,
    elapsedSeconds: 200,
  });
  assert.equal(manyMistakes.stars, 1);
});

test('Dirty Dozen security payloads are rejected by Firestore rule validator', () => {
  const now = 1762129000000;
  const validPayload = {
    uid: 'ksatria_01',
    displayName: 'Budi Ksatria',
    schoolClass: 'Kelas 7A',
    avatarColor: '#7c3aed',
    xp: 150,
    streak: 3,
    completedLevels: 1,
    level1Stars: 3,
    level2Stars: 0,
    level3Stars: 0,
    themeVariant: 'royal',
    darkMode: true,
    systemLang: 'id',
    dailyReminderTime: '16:00',
    createdAt: now,
    updatedAt: now,
  };

  // Valid write passes
  const validRes = simulateFirestoreRuleCheck({
    collection: 'users',
    docId: 'ksatria_01',
    authUid: 'ksatria_01',
    emailVerified: true,
    parentUserExists: true,
    isUpdate: false,
    incomingCreatedAt: now,
    incomingUpdatedAt: now,
    requestTime: now,
    payload: validPayload,
  });
  assert.equal(validRes.allowed, true);

  // 1. Unauthenticated write
  assert.equal(
    simulateFirestoreRuleCheck({
      collection: 'users',
      docId: 'ksatria_01',
      authUid: null,
      emailVerified: false,
      parentUserExists: false,
      isUpdate: false,
      incomingCreatedAt: now,
      incomingUpdatedAt: now,
      requestTime: now,
      payload: validPayload,
    }).allowed,
    false,
  );

  // 2. Unverified email spoof
  assert.equal(
    simulateFirestoreRuleCheck({
      collection: 'users',
      docId: 'ksatria_01',
      authUid: 'ksatria_01',
      emailVerified: false,
      parentUserExists: false,
      isUpdate: false,
      incomingCreatedAt: now,
      incomingUpdatedAt: now,
      requestTime: now,
      payload: validPayload,
    }).allowed,
    false,
  );

  // 3. Identity spoofing on create
  assert.equal(
    simulateFirestoreRuleCheck({
      collection: 'users',
      docId: 'ksatria_02',
      authUid: 'ksatria_01',
      emailVerified: true,
      parentUserExists: false,
      isUpdate: false,
      incomingCreatedAt: now,
      incomingUpdatedAt: now,
      requestTime: now,
      payload: validPayload,
    }).allowed,
    false,
  );

  // 4. Shadow field injection
  assert.equal(
    simulateFirestoreRuleCheck({
      collection: 'users',
      docId: 'ksatria_01',
      authUid: 'ksatria_01',
      emailVerified: true,
      parentUserExists: true,
      isUpdate: true,
      existingCreatedAt: now,
      incomingCreatedAt: now,
      incomingUpdatedAt: now,
      requestTime: now,
      payload: { ...validPayload, isAdmin: true },
    }).allowed,
    false,
  );

  // 5. Oversized displayName
  assert.equal(
    validateUserProfilePayload(
      { ...(validPayload as any), displayName: 'A'.repeat(200) },
      'ksatria_01',
    ).valid,
    false,
  );

  // 6. Path ID poisoning
  assert.equal(
    simulateFirestoreRuleCheck({
      collection: 'users',
      docId: 'invalid/path$id!',
      authUid: 'invalid/path$id!',
      emailVerified: true,
      parentUserExists: false,
      isUpdate: false,
      incomingCreatedAt: now,
      incomingUpdatedAt: now,
      requestTime: now,
      payload: validPayload,
    }).allowed,
    false,
  );

  // 7. Timestamp forgery
  assert.equal(
    simulateFirestoreRuleCheck({
      collection: 'users',
      docId: 'ksatria_01',
      authUid: 'ksatria_01',
      emailVerified: true,
      parentUserExists: false,
      isUpdate: false,
      incomingCreatedAt: now,
      incomingUpdatedAt: now - 5000,
      requestTime: now,
      payload: validPayload,
    }).allowed,
    false,
  );

  // 8. Immutable createdAt mutation on update
  assert.equal(
    simulateFirestoreRuleCheck({
      collection: 'users',
      docId: 'ksatria_01',
      authUid: 'ksatria_01',
      emailVerified: true,
      parentUserExists: true,
      isUpdate: true,
      existingCreatedAt: now - 10000,
      incomingCreatedAt: now,
      incomingUpdatedAt: now,
      requestTime: now,
      payload: validPayload,
    }).allowed,
    false,
  );

  // 9 & 10. Orphaned private vault write without parent user
  assert.equal(
    simulateFirestoreRuleCheck({
      collection: 'private',
      docId: 'vault',
      authUid: 'ksatria_01',
      emailVerified: true,
      parentUserExists: false,
      isUpdate: false,
      incomingCreatedAt: now,
      incomingUpdatedAt: now,
      requestTime: now,
      payload: {
        uid: 'ksatria_01',
        encryptedEmail: 'cipher1',
        encryptedNotes: 'cipher2',
        cipherAlgorithm: 'AES-256-GCM',
        createdAt: now,
        updatedAt: now,
      },
    }).allowed,
    false,
  );

  // 11. Negative XP
  assert.equal(
    validateUserProfilePayload({ ...(validPayload as any), xp: -100 }, 'ksatria_01').valid,
    false,
  );

  // 12. Invalid enum injection
  assert.equal(
    validateUserProfilePayload({ ...(validPayload as any), systemLang: 'fr' }, 'ksatria_01').valid,
    false,
  );
});
