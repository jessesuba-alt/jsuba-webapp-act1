import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrors';
import { FITNESS_LIMITS, getTodayIso } from '../utils/fitnessLimits';
import type {
  CustomMealInput,
  CustomWorkoutInput,
  GuidedMealTemplate,
  GuidedWorkoutTemplate,
  MealEntry,
  UserProfile,
  WorkoutRoutine,
} from '../types';

const USERS_COLLECTION = 'users';
const WORKOUTS_COLLECTION = 'workouts';
const MEALS_COLLECTION = 'meals';

function clampInt(val: number, min: number, max: number): number {
  const num = Math.round(Number(val) || 0);
  return Math.max(min, Math.min(max, num));
}

export function withTimeout<T>(promise: Promise<T>, ms = 4000, label = 'Cloud sync'): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`));
    }, ms);
    promise
      .then((res) => {
        window.clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        window.clearTimeout(timer);
        reject(err);
      });
  });
}

export async function upsertUserProfile(params: {
  uid: string;
  email: string;
  displayName: string;
  fallbackProfile?: UserProfile | null;
}): Promise<UserProfile> {
  const path = `${USERS_COLLECTION}/${params.uid}`;
  const ref = doc(db, USERS_COLLECTION, params.uid);
  const now = Date.now();
  const todayIso = getTodayIso();

  try {
    const snap = await withTimeout(getDoc(ref), 4000, 'Profile fetch');
    if (snap.exists()) {
      const existing = snap.data() as Partial<UserProfile>;
      const fallback = params.fallbackProfile;
      const useFallback =
        fallback &&
        typeof fallback.updatedAt === 'number' &&
        typeof existing.updatedAt === 'number' &&
        fallback.updatedAt > existing.updatedAt;

      const resetWater = existing.lastWaterDate !== todayIso;
      const merged: UserProfile = {
        uid: params.uid,
        email: params.email.slice(0, FITNESS_LIMITS.EMAIL_MAX),
        displayName: (
          (useFallback ? fallback.displayName : existing.displayName) ||
          params.displayName ||
          'Athlete'
        ).slice(0, FITNESS_LIMITS.DISPLAY_NAME_MAX),
        goal: (useFallback ? fallback.goal : existing.goal) || 'General Fitness',
        workoutEnv: (useFallback ? fallback.workoutEnv : existing.workoutEnv) || 'Home',
        foodEnv: (useFallback ? fallback.foodEnv : existing.foodEnv) || 'Home-Cooked',
        onboarded: Boolean(existing.onboarded || fallback?.onboarded),
        waterCupsToday: resetWater
          ? fallback?.lastWaterDate === todayIso
            ? fallback.waterCupsToday
            : 0
          : clampInt(existing.waterCupsToday ?? 0, 0, FITNESS_LIMITS.WATER_CUPS_MAX),
        lastWaterDate: todayIso,
        completedDates: Array.from(
          new Set([...(existing.completedDates || []), ...(fallback?.completedDates || [])])
        )
          .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
          .sort()
          .slice(-FITNESS_LIMITS.COMPLETED_DATES_MAX),
        createdAt: typeof existing.createdAt === 'number' ? existing.createdAt : now,
        updatedAt: Math.max(now, fallback?.updatedAt || 0),
      };
      await withTimeout(
        updateDoc(ref, {
          email: merged.email,
          displayName: merged.displayName,
          goal: merged.goal,
          workoutEnv: merged.workoutEnv,
          foodEnv: merged.foodEnv,
          onboarded: merged.onboarded,
          waterCupsToday: merged.waterCupsToday,
          lastWaterDate: merged.lastWaterDate,
          completedDates: merged.completedDates,
          updatedAt: merged.updatedAt,
        }),
        4000,
        'Profile update'
      );
      return merged;
    }

    const fresh: UserProfile = {
      uid: params.uid,
      email: params.email.slice(0, FITNESS_LIMITS.EMAIL_MAX),
      displayName: (
        params.fallbackProfile?.displayName ||
        params.displayName ||
        'Athlete'
      ).slice(0, FITNESS_LIMITS.DISPLAY_NAME_MAX),
      goal: params.fallbackProfile?.goal || 'General Fitness',
      workoutEnv: params.fallbackProfile?.workoutEnv || 'Home',
      foodEnv: params.fallbackProfile?.foodEnv || 'Home-Cooked',
      onboarded: params.fallbackProfile?.onboarded ?? false,
      waterCupsToday:
        params.fallbackProfile?.lastWaterDate === todayIso
          ? clampInt(params.fallbackProfile.waterCupsToday, 0, FITNESS_LIMITS.WATER_CUPS_MAX)
          : 0,
      lastWaterDate: todayIso,
      completedDates: (params.fallbackProfile?.completedDates || []).slice(
        -FITNESS_LIMITS.COMPLETED_DATES_MAX
      ),
      createdAt: params.fallbackProfile?.createdAt || now,
      updatedAt: now,
    };
    await withTimeout(setDoc(ref, fresh), 4000, 'Profile create');
    return fresh;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncUserProfileDocument(profile: UserProfile): Promise<void> {
  const path = `${USERS_COLLECTION}/${profile.uid}`;
  const ref = doc(db, USERS_COLLECTION, profile.uid);
  const now = Date.now();
  const safeCompleted = Array.from(new Set(profile.completedDates))
    .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
    .sort()
    .slice(-FITNESS_LIMITS.COMPLETED_DATES_MAX);

  try {
    const snap = await withTimeout(getDoc(ref), 3500, 'Profile check');
    if (snap.exists()) {
      await withTimeout(
        updateDoc(ref, {
          email: profile.email.slice(0, FITNESS_LIMITS.EMAIL_MAX),
          displayName: profile.displayName.slice(0, FITNESS_LIMITS.DISPLAY_NAME_MAX),
          goal: profile.goal,
          workoutEnv: profile.workoutEnv,
          foodEnv: profile.foodEnv,
          onboarded: profile.onboarded,
          waterCupsToday: clampInt(profile.waterCupsToday, 0, FITNESS_LIMITS.WATER_CUPS_MAX),
          lastWaterDate: profile.lastWaterDate || getTodayIso(),
          completedDates: safeCompleted,
          updatedAt: Math.max(now, profile.updatedAt),
        }),
        3500,
        'Profile update'
      );
    } else {
      const payload: UserProfile = {
        uid: profile.uid,
        email: profile.email.slice(0, FITNESS_LIMITS.EMAIL_MAX),
        displayName: (profile.displayName || 'Athlete').slice(0, FITNESS_LIMITS.DISPLAY_NAME_MAX),
        goal: profile.goal,
        workoutEnv: profile.workoutEnv,
        foodEnv: profile.foodEnv,
        onboarded: profile.onboarded,
        waterCupsToday: clampInt(profile.waterCupsToday, 0, FITNESS_LIMITS.WATER_CUPS_MAX),
        lastWaterDate: profile.lastWaterDate || getTodayIso(),
        completedDates: safeCompleted,
        createdAt: profile.createdAt > 0 ? profile.createdAt : now,
        updatedAt: Math.max(now, profile.updatedAt, profile.createdAt || now),
      };
      await withTimeout(setDoc(ref, payload), 3500, 'Profile create');
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeToWorkouts(
  uid: string,
  onData: (items: WorkoutRoutine[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const q = query(collection(db, WORKOUTS_COLLECTION), where('ownerId', '==', uid));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: WorkoutRoutine[] = snapshot.docs.map((d) => {
        const data = d.data() as Omit<WorkoutRoutine, 'id'>;
        return {
          ...data,
          id: d.id,
        };
      });
      items.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, WORKOUTS_COLLECTION);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function saveGuidedWorkoutProgress(
  uid: string,
  template: GuidedWorkoutTemplate,
  existingRecord: WorkoutRoutine | undefined,
  completedExerciseIds: string[],
  isCompleted: boolean
): Promise<void> {
  const docId = existingRecord?.id || `${uid}__w__${template.templateKey}`;
  const path = `${WORKOUTS_COLLECTION}/${docId}`;
  const ref = doc(db, WORKOUTS_COLLECTION, docId);
  const now = Date.now();
  const boundedIds = completedExerciseIds.slice(0, FITNESS_LIMITS.WORKOUT_EXERCISES_MAX);
  const lastCompletedDate = isCompleted
    ? getTodayIso()
    : existingRecord?.lastCompletedDate || '';

  try {
    const snap = await withTimeout(getDoc(ref), 3500, 'Workout check');
    if (snap.exists()) {
      await withTimeout(
        updateDoc(ref, {
          completedExerciseIds: boundedIds,
          isCompleted,
          lastCompletedDate,
          updatedAt: now,
        }),
        3500,
        'Workout update'
      );
    } else {
      const payload: Omit<WorkoutRoutine, 'id'> = {
        ownerId: uid,
        templateKey: template.templateKey,
        title: template.title.slice(0, FITNESS_LIMITS.WORKOUT_TITLE_MAX),
        dayLabel: template.dayLabel.slice(0, FITNESS_LIMITS.WORKOUT_DAY_MAX),
        environment: template.environment,
        targetMuscles: template.targetMuscles.slice(0, FITNESS_LIMITS.WORKOUT_MUSCLES_MAX),
        exercises: template.exercises.slice(0, FITNESS_LIMITS.WORKOUT_EXERCISES_MAX),
        completedExerciseIds: boundedIds,
        isCompleted,
        isCustom: false,
        lastCompletedDate,
        createdAt: existingRecord?.createdAt || now,
        updatedAt: now,
      };
      await withTimeout(setDoc(ref, payload), 3500, 'Workout create');
    }
  } catch (error) {
    handleFirestoreError(
      error,
      existingRecord ? OperationType.UPDATE : OperationType.CREATE,
      path
    );
  }
}

export async function saveCustomWorkout(
  uid: string,
  input: CustomWorkoutInput,
  existingRecord?: WorkoutRoutine
): Promise<WorkoutRoutine> {
  const now = Date.now();
  const cleanExercises = input.exercises
    .filter((ex) => ex.name.trim().length > 0)
    .slice(0, FITNESS_LIMITS.WORKOUT_EXERCISES_MAX)
    .map((ex, idx) => ({
      id: ex.id || `ex-${now}-${idx}`,
      name: ex.name.trim().slice(0, 100),
      sets: clampInt(ex.sets, 1, 20),
      reps: (ex.reps || '10').trim().slice(0, 30),
      restSeconds: clampInt(ex.restSeconds, 15, 300),
      cue: ex.cue.trim().slice(0, 240),
      alternative: ex.alternative.trim().slice(0, 240),
    }));

  if (existingRecord) {
    const path = `${WORKOUTS_COLLECTION}/${existingRecord.id}`;
    const ref = doc(db, WORKOUTS_COLLECTION, existingRecord.id);
    const validIds = new Set(cleanExercises.map((e) => e.id));
    const nextRecord: WorkoutRoutine = {
      ...existingRecord,
      title: input.title.trim().slice(0, FITNESS_LIMITS.WORKOUT_TITLE_MAX),
      dayLabel: input.dayLabel.trim().slice(0, FITNESS_LIMITS.WORKOUT_DAY_MAX),
      environment: input.environment,
      targetMuscles: input.targetMuscles.trim().slice(0, FITNESS_LIMITS.WORKOUT_MUSCLES_MAX),
      exercises: cleanExercises,
      completedExerciseIds: existingRecord.completedExerciseIds.filter((id) => validIds.has(id)),
      updatedAt: now,
    };
    try {
      await withTimeout(
        updateDoc(ref, {
          title: nextRecord.title,
          dayLabel: nextRecord.dayLabel,
          environment: nextRecord.environment,
          targetMuscles: nextRecord.targetMuscles,
          exercises: nextRecord.exercises,
          completedExerciseIds: nextRecord.completedExerciseIds,
          updatedAt: nextRecord.updatedAt,
        }),
        3500,
        'Custom workout update'
      );
      return nextRecord;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  } else {
    const ref = doc(collection(db, WORKOUTS_COLLECTION));
    const path = `${WORKOUTS_COLLECTION}/${ref.id}`;
    const payload: Omit<WorkoutRoutine, 'id'> = {
      ownerId: uid,
      templateKey: '',
      title: input.title.trim().slice(0, FITNESS_LIMITS.WORKOUT_TITLE_MAX),
      dayLabel: input.dayLabel.trim().slice(0, FITNESS_LIMITS.WORKOUT_DAY_MAX),
      environment: input.environment,
      targetMuscles: input.targetMuscles.trim().slice(0, FITNESS_LIMITS.WORKOUT_MUSCLES_MAX),
      exercises: cleanExercises,
      completedExerciseIds: [],
      isCompleted: false,
      isCustom: true,
      lastCompletedDate: '',
      createdAt: now,
      updatedAt: now,
    };
    try {
      await withTimeout(setDoc(ref, payload), 3500, 'Custom workout create');
      return { ...payload, id: ref.id };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }
}

export async function updateCustomWorkoutProgress(
  workout: WorkoutRoutine,
  completedExerciseIds: string[],
  isCompleted: boolean
): Promise<void> {
  const path = `${WORKOUTS_COLLECTION}/${workout.id}`;
  const ref = doc(db, WORKOUTS_COLLECTION, workout.id);
  try {
    await withTimeout(
      updateDoc(ref, {
        completedExerciseIds: completedExerciseIds.slice(0, FITNESS_LIMITS.WORKOUT_EXERCISES_MAX),
        isCompleted,
        lastCompletedDate: isCompleted ? getTodayIso() : workout.lastCompletedDate,
        updatedAt: Date.now(),
      }),
      3500,
      'Workout progress update'
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteWorkout(workoutId: string): Promise<void> {
  const path = `${WORKOUTS_COLLECTION}/${workoutId}`;
  try {
    await withTimeout(deleteDoc(doc(db, WORKOUTS_COLLECTION, workoutId)), 3500, 'Delete workout');
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToMeals(
  uid: string,
  onData: (items: MealEntry[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const q = query(collection(db, MEALS_COLLECTION), where('ownerId', '==', uid));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: MealEntry[] = snapshot.docs.map((d) => {
        const data = d.data() as Omit<MealEntry, 'id'>;
        return {
          ...data,
          id: d.id,
        };
      });
      items.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, MEALS_COLLECTION);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function toggleGuidedMealCheck(
  uid: string,
  template: GuidedMealTemplate,
  existingRecord: MealEntry | undefined,
  checkedToday: boolean
): Promise<void> {
  const docId = existingRecord?.id || `${uid}__m__${template.templateKey}`;
  const path = `${MEALS_COLLECTION}/${docId}`;
  const ref = doc(db, MEALS_COLLECTION, docId);
  const now = Date.now();
  const checkedDate = checkedToday ? getTodayIso() : '';

  try {
    const snap = await withTimeout(getDoc(ref), 3500, 'Meal check');
    if (snap.exists()) {
      await withTimeout(
        updateDoc(ref, {
          checkedDate,
          updatedAt: now,
        }),
        3500,
        'Meal update'
      );
    } else {
      const payload: Omit<MealEntry, 'id'> = {
        ownerId: uid,
        templateKey: template.templateKey,
        title: template.title.slice(0, FITNESS_LIMITS.MEAL_TITLE_MAX),
        slot: template.slot,
        foodEnv: template.foodEnv,
        goal: template.goal,
        calories: clampInt(template.calories, 0, FITNESS_LIMITS.CALORIES_MAX),
        protein: clampInt(template.protein, 0, FITNESS_LIMITS.PROTEIN_MAX),
        carbs: clampInt(template.carbs, 0, FITNESS_LIMITS.CARBS_MAX),
        fat: clampInt(template.fat, 0, FITNESS_LIMITS.FAT_MAX),
        prepNotes: template.prepNotes.slice(0, FITNESS_LIMITS.MEAL_NOTES_MAX),
        checkedDate,
        isCustom: false,
        createdAt: existingRecord?.createdAt || now,
        updatedAt: now,
      };
      await withTimeout(setDoc(ref, payload), 3500, 'Meal create');
    }
  } catch (error) {
    handleFirestoreError(
      error,
      existingRecord ? OperationType.UPDATE : OperationType.CREATE,
      path
    );
  }
}

export async function toggleCustomMealCheck(
  meal: MealEntry,
  checkedToday: boolean
): Promise<void> {
  const path = `${MEALS_COLLECTION}/${meal.id}`;
  const ref = doc(db, MEALS_COLLECTION, meal.id);
  try {
    await withTimeout(
      updateDoc(ref, {
        checkedDate: checkedToday ? getTodayIso() : '',
        updatedAt: Date.now(),
      }),
      3500,
      'Custom meal check'
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function saveCustomMeal(
  uid: string,
  input: CustomMealInput,
  existingRecord?: MealEntry
): Promise<MealEntry> {
  const now = Date.now();
  if (existingRecord) {
    const path = `${MEALS_COLLECTION}/${existingRecord.id}`;
    const ref = doc(db, MEALS_COLLECTION, existingRecord.id);
    const nextRecord: MealEntry = {
      ...existingRecord,
      title: input.title.trim().slice(0, FITNESS_LIMITS.MEAL_TITLE_MAX),
      slot: input.slot,
      foodEnv: input.foodEnv,
      goal: input.goal,
      calories: clampInt(input.calories, 0, FITNESS_LIMITS.CALORIES_MAX),
      protein: clampInt(input.protein, 0, FITNESS_LIMITS.PROTEIN_MAX),
      carbs: clampInt(input.carbs, 0, FITNESS_LIMITS.CARBS_MAX),
      fat: clampInt(input.fat, 0, FITNESS_LIMITS.FAT_MAX),
      prepNotes: input.prepNotes.trim().slice(0, FITNESS_LIMITS.MEAL_NOTES_MAX),
      updatedAt: now,
    };
    try {
      await withTimeout(
        updateDoc(ref, {
          title: nextRecord.title,
          slot: nextRecord.slot,
          foodEnv: nextRecord.foodEnv,
          goal: nextRecord.goal,
          calories: nextRecord.calories,
          protein: nextRecord.protein,
          carbs: nextRecord.carbs,
          fat: nextRecord.fat,
          prepNotes: nextRecord.prepNotes,
          updatedAt: nextRecord.updatedAt,
        }),
        3500,
        'Custom meal update'
      );
      return nextRecord;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  } else {
    const ref = doc(collection(db, MEALS_COLLECTION));
    const path = `${MEALS_COLLECTION}/${ref.id}`;
    const payload: Omit<MealEntry, 'id'> = {
      ownerId: uid,
      templateKey: '',
      title: input.title.trim().slice(0, FITNESS_LIMITS.MEAL_TITLE_MAX),
      slot: input.slot,
      foodEnv: input.foodEnv,
      goal: input.goal,
      calories: clampInt(input.calories, 0, FITNESS_LIMITS.CALORIES_MAX),
      protein: clampInt(input.protein, 0, FITNESS_LIMITS.PROTEIN_MAX),
      carbs: clampInt(input.carbs, 0, FITNESS_LIMITS.CARBS_MAX),
      fat: clampInt(input.fat, 0, FITNESS_LIMITS.FAT_MAX),
      prepNotes: input.prepNotes.trim().slice(0, FITNESS_LIMITS.MEAL_NOTES_MAX),
      checkedDate: '',
      isCustom: true,
      createdAt: now,
      updatedAt: now,
    };
    try {
      await withTimeout(setDoc(ref, payload), 3500, 'Custom meal create');
      return { ...payload, id: ref.id };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }
}

export async function deleteMeal(mealId: string): Promise<void> {
  const path = `${MEALS_COLLECTION}/${mealId}`;
  try {
    await withTimeout(deleteDoc(doc(db, MEALS_COLLECTION, mealId)), 3500, 'Delete meal');
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
