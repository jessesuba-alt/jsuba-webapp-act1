import type { FitnessGoal, FoodEnvironment, MealSlot, WorkoutEnvironment } from '../types';

// Validation constants synchronized with firebase-blueprint.json & firestore.rules
export const FITNESS_LIMITS = {
  DISPLAY_NAME_MAX: 100,
  EMAIL_MAX: 320,
  WORKOUT_TITLE_MAX: 120,
  WORKOUT_DAY_MAX: 40,
  WORKOUT_MUSCLES_MAX: 140,
  WORKOUT_EXERCISES_MAX: 20,
  MEAL_TITLE_MAX: 140,
  MEAL_NOTES_MAX: 1000,
  CALORIES_MAX: 5000,
  PROTEIN_MAX: 400,
  CARBS_MAX: 600,
  FAT_MAX: 300,
  WATER_CUPS_MAX: 24,
  COMPLETED_DATES_MAX: 90,
} as const;

export const FITNESS_GOALS: FitnessGoal[] = [
  'Weight Loss',
  'Muscle Gain',
  'General Fitness',
];

export const WORKOUT_ENVIRONMENTS: WorkoutEnvironment[] = ['Home', 'Gym'];

export const FOOD_ENVIRONMENTS: FoodEnvironment[] = ['Home-Cooked', 'On-the-Go'];

export const MEAL_SLOTS: MealSlot[] = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

export function getTodayIso(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export interface WeekDayStatus {
  iso: string;
  shortLabel: string;
  dayNumber: string;
  isToday: boolean;
  isFuture: boolean;
}

export function getCurrentWeekDays(): WeekDayStatus[] {
  const today = new Date();
  const todayIso = getTodayIso();
  const jsDay = today.getDay(); // 0=Sun, 1=Mon
  const diffToMonday = jsDay === 0 ? -6 : 1 - jsDay;

  const monday = new Date(today);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(today.getDate() + diffToMonday);

  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const days: WeekDayStatus[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`;
    days.push({
      iso,
      shortLabel: labels[i],
      dayNumber: String(d.getDate()).padStart(2, '0'),
      isToday: iso === todayIso,
      isFuture: iso > todayIso,
    });
  }

  return days;
}

export function calculateStreak(completedDates: string[]): number {
  if (!completedDates.length) return 0;
  const set = new Set(completedDates);
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  const todayIso = getTodayIso();
  if (!set.has(todayIso)) {
    // Allow ongoing streak if yesterday was completed even if today isn't logged yet
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  for (let i = 0; i < 90; i++) {
    const iso = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(
      cursor.getDate()
    ).padStart(2, '0')}`;
    if (set.has(iso)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export function formatShortDate(iso: string): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
