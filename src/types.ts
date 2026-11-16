export type FitnessGoal = 'Weight Loss' | 'Muscle Gain' | 'General Fitness';

export type WorkoutEnvironment = 'Home' | 'Gym';

export type FoodEnvironment = 'Home-Cooked' | 'On-the-Go';

export type MealSlot = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';

export type ActiveTab = 'workout' | 'diet' | 'progress' | 'settings';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  goal: FitnessGoal;
  workoutEnv: WorkoutEnvironment;
  foodEnv: FoodEnvironment;
  onboarded: boolean;
  waterCupsToday: number;
  lastWaterDate: string; // YYYY-MM-DD
  completedDates: string[]; // array of YYYY-MM-DD
  createdAt: number;
  updatedAt: number;
}

export interface ExerciseItem {
  id: string;
  name: string;
  sets: number;
  reps: string;
  restSeconds: number;
  cue: string;
  alternative: string;
}

export interface WorkoutRoutine {
  id: string;
  ownerId: string;
  templateKey: string; // empty string if custom
  title: string;
  dayLabel: string;
  environment: WorkoutEnvironment;
  targetMuscles: string;
  exercises: ExerciseItem[];
  completedExerciseIds: string[];
  isCompleted: boolean;
  isCustom: boolean;
  lastCompletedDate: string;
  createdAt: number;
  updatedAt: number;
}

export interface GuidedWorkoutTemplate {
  templateKey: string;
  title: string;
  dayLabel: string;
  environment: WorkoutEnvironment;
  targetMuscles: string;
  exercises: ExerciseItem[];
}

export interface MealEntry {
  id: string;
  ownerId: string;
  templateKey: string; // empty string if custom
  title: string;
  slot: MealSlot;
  foodEnv: FoodEnvironment;
  goal: FitnessGoal;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  prepNotes: string;
  checkedDate: string; // YYYY-MM-DD when checked off, or ''
  isCustom: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface GuidedMealTemplate {
  templateKey: string;
  title: string;
  slot: MealSlot;
  foodEnv: FoodEnvironment;
  goal: FitnessGoal;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  prepNotes: string;
}

export interface MacroTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  waterCups: number;
  guidance: string;
}

export interface CustomWorkoutInput {
  id?: string;
  title: string;
  dayLabel: string;
  environment: WorkoutEnvironment;
  targetMuscles: string;
  exercises: ExerciseItem[];
}

export interface CustomMealInput {
  id?: string;
  title: string;
  slot: MealSlot;
  foodEnv: FoodEnvironment;
  goal: FitnessGoal;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  prepNotes: string;
}
