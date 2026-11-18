import { GUIDED_MEAL_TEMPLATES, GUIDED_WORKOUT_TEMPLATES } from './fitnessTemplates';
import { getTodayIso } from '../utils/fitnessLimits';
import type { MealEntry, UserProfile, WorkoutRoutine } from '../types';

export const DEMO_UID = 'demo-user';

function getOffsetIso(daysAgo: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export interface DemoSeedBundle {
  profile: UserProfile;
  workouts: WorkoutRoutine[];
  meals: MealEntry[];
}

export function createDemoSeedData(): DemoSeedBundle {
  const now = Date.now();
  const todayIso = getTodayIso();
  const completedDates = [
    getOffsetIso(4),
    getOffsetIso(3),
    getOffsetIso(2),
    getOffsetIso(1),
    todayIso,
  ];

  const profile: UserProfile = {
    uid: DEMO_UID,
    email: 'demo@kineticform.local',
    displayName: 'Alex Mercer (Demo)',
    goal: 'Muscle Gain',
    workoutEnv: 'Gym',
    foodEnv: 'Home-Cooked',
    onboarded: true,
    waterCupsToday: 5,
    lastWaterDate: todayIso,
    completedDates,
    createdAt: now - 5 * 86400_000,
    updatedAt: now,
  };

  const gymDay1 = GUIDED_WORKOUT_TEMPLATES.find((t) => t.templateKey === 'gym-day-1');
  const gymDay2 = GUIDED_WORKOUT_TEMPLATES.find((t) => t.templateKey === 'gym-day-2');

  const workouts: WorkoutRoutine[] = [];

  // Today's active session: 2 of 4 exercises pre-marked complete
  if (gymDay1) {
    workouts.push({
      id: `${DEMO_UID}__w__${gymDay1.templateKey}`,
      ownerId: DEMO_UID,
      templateKey: gymDay1.templateKey,
      title: gymDay1.title,
      dayLabel: gymDay1.dayLabel,
      environment: gymDay1.environment,
      targetMuscles: gymDay1.targetMuscles,
      exercises: gymDay1.exercises,
      completedExerciseIds: gymDay1.exercises.slice(0, 2).map((e) => e.id),
      isCompleted: false,
      isCustom: false,
      lastCompletedDate: '',
      createdAt: now - 3 * 86400_000,
      updatedAt: now - 1800_000,
    });
  }

  // Past completed guided session (shows in Progress & Log history)
  if (gymDay2) {
    workouts.push({
      id: `${DEMO_UID}__w__${gymDay2.templateKey}`,
      ownerId: DEMO_UID,
      templateKey: gymDay2.templateKey,
      title: gymDay2.title,
      dayLabel: gymDay2.dayLabel,
      environment: gymDay2.environment,
      targetMuscles: gymDay2.targetMuscles,
      exercises: gymDay2.exercises,
      completedExerciseIds: gymDay2.exercises.map((e) => e.id),
      isCompleted: true,
      isCustom: false,
      lastCompletedDate: getOffsetIso(2),
      createdAt: now - 4 * 86400_000,
      updatedAt: now - 2 * 86400_000,
    });
  }

  // Past completed custom workout (shows in Custom Workouts + History)
  workouts.push({
    id: 'demo-custom-workout-1',
    ownerId: DEMO_UID,
    templateKey: '',
    title: 'Posterior Chain & Core Finisher',
    dayLabel: 'Day 05 · Custom',
    environment: 'Gym',
    targetMuscles: 'Hamstrings, Upper Back, Core',
    exercises: [
      {
        id: 'demo-ex-1',
        name: '45° Back Extension',
        sets: 3,
        reps: '12–15',
        restSeconds: 60,
        cue: 'Hinge at the hips and pause 1 second at torso-thigh alignment without hyperextending.',
        alternative: 'Glute bridge hold on mat.',
      },
      {
        id: 'demo-ex-2',
        name: 'Face Pulls (Rope Attachment)',
        sets: 3,
        reps: '15',
        restSeconds: 60,
        cue: 'Pull rope toward forehead while rotating thumbs backward to engage rear delts.',
        alternative: 'Band pull-aparts at shoulder height.',
      },
    ],
    completedExerciseIds: ['demo-ex-1', 'demo-ex-2'],
    isCompleted: true,
    isCustom: true,
    lastCompletedDate: getOffsetIso(1),
    createdAt: now - 3 * 86400_000,
    updatedAt: now - 86400_000,
  });

  // Pre-log Breakfast & Lunch for Home-Cooked + Muscle Gain; leave Dinner & Snack unchecked
  const breakfastTemplate = GUIDED_MEAL_TEMPLATES.find(
    (m) => m.templateKey === 'hc-mg-breakfast'
  );
  const lunchTemplate = GUIDED_MEAL_TEMPLATES.find(
    (m) => m.templateKey === 'hc-mg-lunch'
  );

  const meals: MealEntry[] = [];

  if (breakfastTemplate) {
    meals.push({
      id: `${DEMO_UID}__m__${breakfastTemplate.templateKey}`,
      ownerId: DEMO_UID,
      templateKey: breakfastTemplate.templateKey,
      title: breakfastTemplate.title,
      slot: breakfastTemplate.slot,
      foodEnv: breakfastTemplate.foodEnv,
      goal: breakfastTemplate.goal,
      calories: breakfastTemplate.calories,
      protein: breakfastTemplate.protein,
      carbs: breakfastTemplate.carbs,
      fat: breakfastTemplate.fat,
      prepNotes: breakfastTemplate.prepNotes,
      checkedDate: todayIso,
      isCustom: false,
      createdAt: now - 2 * 86400_000,
      updatedAt: now - 3600_000,
    });
  }

  if (lunchTemplate) {
    meals.push({
      id: `${DEMO_UID}__m__${lunchTemplate.templateKey}`,
      ownerId: DEMO_UID,
      templateKey: lunchTemplate.templateKey,
      title: lunchTemplate.title,
      slot: lunchTemplate.slot,
      foodEnv: lunchTemplate.foodEnv,
      goal: lunchTemplate.goal,
      calories: lunchTemplate.calories,
      protein: lunchTemplate.protein,
      carbs: lunchTemplate.carbs,
      fat: lunchTemplate.fat,
      prepNotes: lunchTemplate.prepNotes,
      checkedDate: todayIso,
      isCustom: false,
      createdAt: now - 2 * 86400_000,
      updatedAt: now - 1800_000,
    });
  }

  // Saved custom meal (unchecked today so today's Dinner/Snack remain open, but logged yesterday for history)
  meals.push({
    id: 'demo-custom-meal-1',
    ownerId: DEMO_UID,
    templateKey: '',
    title: 'Post-Lift Berry Whey Oats',
    slot: 'Snack',
    foodEnv: 'Home-Cooked',
    goal: 'Muscle Gain',
    calories: 430,
    protein: 36,
    carbs: 54,
    fat: 8,
    prepNotes: 'Blend 1 scoop whey, 50g rolled oats, 100g blueberries, and cold water or milk.',
    checkedDate: getOffsetIso(1),
    isCustom: true,
    createdAt: now - 3 * 86400_000,
    updatedAt: now - 86400_000,
  });

  return { profile, workouts, meals };
}
