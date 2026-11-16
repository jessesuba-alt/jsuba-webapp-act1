# Security Specification — KINETIC FORM

## Architecture
- Pure client-side React + Vite SPA deployed for zero cost on Firebase Spark Plan.
- Authentication: Firebase Auth (`Email/Password` and `Google Sign-In`).
- Persistence: Cloud Firestore only (zero Cloud Storage buckets, zero Cloud Functions).

## Collections & Ownership Invariants
1. `/users/{userId}`
   - Readable/writable strictly by the authenticated owner (`request.auth.uid == userId`) or an authorized admin (`isAdmin()`).
   - `list` is restricted to `isAdmin()` to prevent user enumeration.
   - `uid` is immutable after creation (`incoming().uid == existing().uid`).
   - Validates `goal` (`Weight Loss`, `Muscle Gain`, `General Fitness`), `workoutEnv` (`Home`, `Gym`), `foodEnv` (`Home-Cooked`, `On-the-Go`), `waterCupsToday` (0..24), and `completedDates` (<= 90 entries).

2. `/workouts/{workoutId}`
   - Strictly owner-scoped (`resource.data.ownerId == request.auth.uid` on read/update/delete; `incoming().ownerId == request.auth.uid` on create).
   - `list` queries do NOT call `isAdmin()` (Pillar 8 list cost optimization) and require `resource.data.ownerId == request.auth.uid`.
   - `ownerId` and `createdAt` are immutable on `update`.
   - Enforces max lengths and bounded arrays (`exercises.size() <= 20`, `completedExerciseIds.size() <= 20`).

3. `/meals/{mealId}`
   - Strictly owner-scoped (`resource.data.ownerId == request.auth.uid` on read/update/delete; `incoming().ownerId == request.auth.uid` on create).
   - `list` queries do NOT call `isAdmin()` and require `resource.data.ownerId == request.auth.uid`.
   - `ownerId` and `createdAt` are immutable on `update`.
   - Validates `slot`, `foodEnv`, `goal`, macro integer bounds (`calories <= 5000`, `protein <= 400`, `carbs <= 600`, `fat <= 300`), and `prepNotes <= 1000`.

4. `/admins/{adminId}`
   - Readable only by the matching admin user; all client writes denied (`allow write: if false`). Managed solely from Firebase Console.

## Admin Readiness
- Modular `isAdmin()` function checks:
  1. `exists(/databases/$(database)/documents/admins/$(request.auth.uid))`
  2. Verified project owner email (`request.auth.token.email == 'jessesuba@gmail.com' && request.auth.token.email_verified == true`)
  3. Static UID placeholder ready for owner replacement.
- Note: Standard user writes (`users`, `workouts`, `meals`) intentionally do NOT require `email_verified == true` so newly registered Email/Password users can onboard and log workouts immediately.

## Dirty Dozen Verification Cases
1. Unauthenticated read/write to `/users/*`, `/workouts/*`, `/meals/*` -> DENIED.
2. User A reading/updating/deleting User B's workout or meal -> DENIED.
3. User A creating a workout/meal with `ownerId: User B` -> DENIED.
4. User A changing `ownerId` on an existing workout/meal -> DENIED.
5. Unlisted/extra field injected into user/workout/meal payload -> DENIED (`hasOnly`).
6. Invalid enum (`goal: "Keto"`, `workoutEnv: "Outdoor"`, `slot: "Brunch"`) -> DENIED.
7. Oversized arrays (`exercises.size() > 20`, `completedDates.size() > 90`) -> DENIED.
8. Out-of-range numeric macros (`calories: 99999` or `-10`, `waterCupsToday: 99`) -> DENIED.
9. Broad `list` query on `/users` by non-admin -> DENIED.
10. Client write to `/admins/{uid}` -> DENIED.
11. Unmatched collection path write -> DENIED (global catch-all).
12. Email spoofing without `email_verified == true` for `isAdmin()` -> DENIED.
