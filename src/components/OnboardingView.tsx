import React, { useEffect, useState } from 'react';
import { ArrowRight, Check, Dumbbell, Target, Utensils } from 'lucide-react';
import {
  FITNESS_GOALS,
  FOOD_ENVIRONMENTS,
  WORKOUT_ENVIRONMENTS,
} from '../utils/fitnessLimits';
import type { FitnessGoal, FoodEnvironment, WorkoutEnvironment } from '../types';

interface OnboardingViewProps {
  initialGoal: FitnessGoal;
  initialWorkoutEnv: WorkoutEnvironment;
  initialFoodEnv: FoodEnvironment;
  displayName: string;
  onComplete: (prefs: {
    goal: FitnessGoal;
    workoutEnv: WorkoutEnvironment;
    foodEnv: FoodEnvironment;
  }) => void;
}

const GOAL_DESCRIPTIONS: Record<FitnessGoal, string> = {
  'Weight Loss': 'High-protein ~1,800 kcal target to cut fat while keeping strength.',
  'Muscle Gain': 'Controlled ~2,750 kcal surplus with steady carbs for lean hypertrophy.',
  'General Fitness': 'Balanced ~2,200 kcal maintenance for energy, mobility, and endurance.',
};

export const OnboardingView: React.FC<OnboardingViewProps> = ({
  initialGoal,
  initialWorkoutEnv,
  initialFoodEnv,
  displayName,
  onComplete,
}) => {
  const [goal, setGoal] = useState<FitnessGoal>(initialGoal);
  const [workoutEnv, setWorkoutEnv] = useState<WorkoutEnvironment>(initialWorkoutEnv);
  const [foodEnv, setFoodEnv] = useState<FoodEnvironment>(initialFoodEnv);

  useEffect(() => {
    setGoal(initialGoal);
    setWorkoutEnv(initialWorkoutEnv);
    setFoodEnv(initialFoodEnv);
  }, [initialGoal, initialWorkoutEnv, initialFoodEnv]);

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    // Instant synchronous transition via state + localStorage; cloud sync runs non-blockingly
    onComplete({ goal, workoutEnv, foodEnv });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <form
        onSubmit={handleConfirm}
        className="border border-[#0A0A0A] bg-[#FFFFFF] rounded-[2px] p-6 sm:p-8 space-y-8"
      >
        <div className="border-b border-[#E5E5E5] pb-5 space-y-1.5">
          <p className="font-mono text-[11px] uppercase tracking-widest text-[#737373]">
            Profile Calibration · {displayName}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0A0A0A]">
            Configure your training &amp; nutrition environment
          </h1>
          <p className="text-sm text-[#555555]">
            Your guided split and daily meal schedule adapt immediately to these selections. You can
            switch environments anytime from the dashboard bar.
          </p>
        </div>

        {/* Step 1: Primary Goal */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-[#0A0A0A]" />
            <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-[#0A0A0A]">
              01 · Primary Goal
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {FITNESS_GOALS.map((item) => {
              const selected = goal === item;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setGoal(item)}
                  className={`text-left p-4 border rounded-[2px] transition-colors cursor-pointer space-y-1.5 ${
                    selected
                      ? 'border-[#0A0A0A] bg-[#0A0A0A] text-white'
                      : 'border-[#E5E5E5] bg-[#FAFAFA] text-[#0A0A0A] hover:border-[#0A0A0A]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold">{item}</span>
                    {selected && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </div>
                  <p
                    className={`text-xs leading-relaxed ${
                      selected ? 'text-[#E5E5E5]' : 'text-[#555555]'
                    }`}
                  >
                    {GOAL_DESCRIPTIONS[item]}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Workout Environment */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-[#0A0A0A]" />
            <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-[#0A0A0A]">
              02 · Workout Environment
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {WORKOUT_ENVIRONMENTS.map((env) => {
              const selected = workoutEnv === env;
              return (
                <button
                  key={env}
                  type="button"
                  onClick={() => setWorkoutEnv(env)}
                  className={`text-left p-4 border rounded-[2px] transition-colors cursor-pointer space-y-1.5 ${
                    selected
                      ? 'border-[#0A0A0A] bg-[#0A0A0A] text-white'
                      : 'border-[#E5E5E5] bg-[#FAFAFA] text-[#0A0A0A] hover:border-[#0A0A0A]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold">
                      {env === 'Home' ? 'Home / Bodyweight' : 'Commercial Gym'}
                    </span>
                    {selected && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </div>
                  <p
                    className={`text-xs leading-relaxed ${
                      selected ? 'text-[#E5E5E5]' : 'text-[#555555]'
                    }`}
                  >
                    {env === 'Home'
                      ? 'Guided push-ups, squats, lunges, planks, dips, and optional bands or light dumbbells.'
                      : 'Guided chest press, lat pulldown, leg press, cable rows, and squats with joint-friendly swaps.'}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 3: Food / Diet Environment */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Utensils className="w-4 h-4 text-[#0A0A0A]" />
            <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-[#0A0A0A]">
              03 · Food &amp; Diet Environment
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FOOD_ENVIRONMENTS.map((env) => {
              const selected = foodEnv === env;
              return (
                <button
                  key={env}
                  type="button"
                  onClick={() => setFoodEnv(env)}
                  className={`text-left p-4 border rounded-[2px] transition-colors cursor-pointer space-y-1.5 ${
                    selected
                      ? 'border-[#0A0A0A] bg-[#0A0A0A] text-white'
                      : 'border-[#E5E5E5] bg-[#FAFAFA] text-[#0A0A0A] hover:border-[#0A0A0A]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold">
                      {env === 'Home-Cooked'
                        ? 'Home-Cooked / Meal Prep'
                        : 'On-the-Go / Dorm-Friendly'}
                    </span>
                    {selected && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </div>
                  <p
                    className={`text-xs leading-relaxed ${
                      selected ? 'text-[#E5E5E5]' : 'text-[#555555]'
                    }`}
                  >
                    {env === 'Home-Cooked'
                      ? 'Budget whole-food templates using rice, eggs, chicken, tuna, oats, and vegetables.'
                      : 'No-cook and quick-order high-protein meals with portion guidelines and smart swaps.'}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-4 border-t border-[#E5E5E5] flex items-center justify-end">
          <button
            type="submit"
            className="px-6 py-3 bg-[#0A0A0A] hover:bg-[#262626] text-white text-xs font-semibold uppercase tracking-wider rounded-[2px] transition-colors flex items-center gap-2 cursor-pointer"
          >
            <span>Enter Training Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
