import type { MealEntry, UserProfile, WorkoutRoutine } from '../types';

const PROFILE_PREFIX = 'kf_profile_v1_';
const WORKOUTS_PREFIX = 'kf_workouts_v1_';
const MEALS_PREFIX = 'kf_meals_v1_';

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
