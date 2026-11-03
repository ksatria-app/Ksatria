# Security Specification — Teka-Teki by Ksatria

## 1. Data Invariants
1. **Global Default Deny**: Any path not explicitly matched is rejected (`allow read, write: if false;`).
2. **Verified Identity**: All writes require `request.auth != null && request.auth.token.email_verified == true`.
3. **Path-to-Payload Identity Integrity**:
   - `/users/{userId}` requires `userId == request.auth.uid` and `incoming().uid == request.auth.uid`.
   - `/users/{userId}/private/{vaultId}` requires `userId == request.auth.uid`, `vaultId == 'vault'`, parent `/users/$(userId)` existence via Master Gate, and `incoming().uid == request.auth.uid`.
   - `/leaderboard/{userId}` requires `userId == request.auth.uid`, `incoming().uid == request.auth.uid`, and parent `/users/$(userId)` existence.
4. **PII Isolation**: Raw email/notes are never stored in `/users/{userId}` or `/leaderboard/{userId}`. Encrypted PII is strictly isolated inside `/users/{userId}/private/{vaultId}` and only readable by the document owner (`request.auth.uid == userId`).
5. **Temporal Integrity**: `createdAt` and `updatedAt` must equal `request.time`. On update, `createdAt` and `uid` are immutable.
6. **Strict Schema & Bounds**: Every string field enforces `.size()` limits and regex/enum constraints matching `firebase-blueprint.json`.

## 2. The "Dirty Dozen" Payloads
1. **Unauthenticated Write**: Writing to `/users/user_1` with `auth == null`.
2. **Unverified Email Spoof**: Writing to `/users/user_1` with `email_verified: false`.
3. **Identity Spoofing on Create**: User `user_1` creating `/users/user_2` or setting `uid: 'user_2'`.
4. **Shadow Field Injection**: Updating `/users/user_1` with an undeclared field `isAdmin: true`.
5. **Oversized String DoW**: Creating `/users/user_1` with a 5,000-character `displayName`.
6. **Path ID Poisoning**: Targeting a document ID with illegal characters or >128 chars.
7. **Timestamp Forgery**: Providing a past or future client timestamp instead of `request.time`.
8. **Immutable Field Mutation**: Attempting to change `createdAt` or `uid` during an `update` on `/users/user_1`.
9. **Cross-User Private Vault Read**: Authenticated `user_2` attempting `get` on `/users/user_1/private/vault`.
10. **Orphaned Subcollection Write**: Creating `/users/user_1/private/vault` when parent `/users/user_1` does not exist.
11. **Negative / Out-of-Range XP or Stars**: Writing `xp: -500` or `level1Stars: 99`.
12. **Invalid Enum Injection**: Setting `systemLang: 'fr'` or `themeVariant: 'neon'`.
