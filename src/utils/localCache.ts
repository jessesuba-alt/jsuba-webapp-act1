import type { MealEntry, UserProfile, WorkoutRoutine } from '../types';

const PROFILE_PREFIX = 'kf_profile_v1_';
const WORKOUTS_PREFIX = 'kf_workouts_v1_';
const MEALS_PREFIX = 'kf_meals_v1_';
const DEMO_ACTIVE_KEY = 'kf_demo_active_v1';

export function isDemoSessionStored(): boolean {
  try {
    return window.localStorage.getItem(DEMO_ACTIVE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setDemoSessionStored(active: boolean): void {
  try {
    if (active) {
      window.localStorage.setItem(DEMO_ACTIVE_KEY, 'true');
    } else {
      window.localStorage.removeItem(DEMO_ACTIVE_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

export function clearCachedUserData(uid: string): void {
  try {
    window.localStorage.removeItem(`${PROFILE_PREFIX}${uid}`);
    window.localStorage.removeItem(`${WORKOUTS_PREFIX}${uid}`);
    window.localStorage.removeItem(`${MEALS_PREFIX}${uid}`);
  } catch {
    // Ignore storage errors
  }
}

export function loadCachedProfile(uid: string): UserProfile | null {
  try {
    const raw = window.localStorage.getItem(`${PROFILE_PREFIX}${uid}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserProfile;
    if (!parsed || parsed.uid !== uid) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveCachedProfile(profile: UserProfile): void {
  try {
    window.localStorage.setItem(`${PROFILE_PREFIX}${profile.uid}`, JSON.stringify(profile));
  } catch {
    // Ignore storage quota or private-mode errors
  }
}

export function loadCachedWorkouts(uid: string): WorkoutRoutine[] {
  try {
    const raw = window.localStorage.getItem(`${WORKOUTS_PREFIX}${uid}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as WorkoutRoutine[]) : [];
  } catch {
    return [];
  }
}

export function saveCachedWorkouts(uid: string, items: WorkoutRoutine[]): void {
  try {
    window.localStorage.setItem(`${WORKOUTS_PREFIX}${uid}`, JSON.stringify(items));
  } catch {
    // Ignore storage quota or private-mode errors
  }
}

export function loadCachedMeals(uid: string): MealEntry[] {
  try {
    const raw = window.localStorage.getItem(`${MEALS_PREFIX}${uid}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as MealEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveCachedMeals(uid: string, items: MealEntry[]): void {
  try {
    window.localStorage.setItem(`${MEALS_PREFIX}${uid}`, JSON.stringify(items));
  } catch {
    // Ignore storage quota or private-mode errors
  }
}
