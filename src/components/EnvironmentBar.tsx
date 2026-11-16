import React from 'react';
import {
  FITNESS_GOALS,
  FOOD_ENVIRONMENTS,
  WORKOUT_ENVIRONMENTS,
} from '../utils/fitnessLimits';
import type {
  FitnessGoal,
  FoodEnvironment,
  UserProfile,
  WorkoutEnvironment,
} from '../types';

interface EnvironmentBarProps {
  profile: UserProfile;
  onUpdatePrefs: (prefs: {
    goal?: FitnessGoal;
    workoutEnv?: WorkoutEnvironment;
    foodEnv?: FoodEnvironment;
  }) => void;
}

export const EnvironmentBar: React.FC<EnvironmentBarProps> = ({
  profile,
  onUpdatePrefs,
}) => {
  return (
    <section
      aria-label="Environment and Goal Controls"
      className="border border-[#E5E5E5] bg-[#FAFAFA] rounded-[2px] p-3.5 sm:p-4"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start lg:items-center">
        {/* Goal Selector */}
        <div className="lg:col-span-5 space-y-1.5">
          <span className="block font-mono text-[10px] uppercase tracking-widest text-[#737373]">
            Active Goal
          </span>
          <div className="grid grid-cols-3 border border-[#E5E5E5] bg-white p-0.5 rounded-[2px]">
            {FITNESS_GOALS.map((g) => {
              const active = profile.goal === g;
              const shortLabel =
                g === 'Weight Loss'
                  ? 'Weight Loss'
                  : g === 'Muscle Gain'
                  ? 'Muscle Gain'
                  : 'General Fit';
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => onUpdatePrefs({ goal: g })}
                  className={`px-2 py-1.5 text-[11px] font-semibold rounded-[2px] transition-colors whitespace-nowrap truncate cursor-pointer ${
                    active
                      ? 'bg-[#0A0A0A] text-white'
                      : 'text-[#555555] hover:text-[#0A0A0A]'
                  }`}
                >
                  {shortLabel}
                </button>
              );
            })}
          </div>
        </div>

        {/* Workout Environment Toggle */}
        <div className="lg:col-span-3 space-y-1.5">
          <span className="block font-mono text-[10px] uppercase tracking-widest text-[#737373]">
            Workout Environment
          </span>
          <div className="grid grid-cols-2 border border-[#E5E5E5] bg-white p-0.5 rounded-[2px]">
            {WORKOUT_ENVIRONMENTS.map((env) => {
              const active = profile.workoutEnv === env;
              return (
                <button
                  key={env}
                  type="button"
                  onClick={() => onUpdatePrefs({ workoutEnv: env })}
                  className={`px-2 py-1.5 text-[11px] font-semibold rounded-[2px] transition-colors whitespace-nowrap truncate cursor-pointer ${
                    active
                      ? 'bg-[#0A0A0A] text-white'
                      : 'text-[#555555] hover:text-[#0A0A0A]'
                  }`}
                >
                  {env === 'Home' ? 'Home / BW' : 'Gym'}
                </button>
              );
            })}
          </div>
        </div>

        {/* Food Environment Toggle */}
        <div className="lg:col-span-4 space-y-1.5">
          <span className="block font-mono text-[10px] uppercase tracking-widest text-[#737373]">
            Food Environment
          </span>
          <div className="grid grid-cols-2 border border-[#E5E5E5] bg-white p-0.5 rounded-[2px]">
            {FOOD_ENVIRONMENTS.map((env) => {
              const active = profile.foodEnv === env;
              return (
                <button
                  key={env}
                  type="button"
                  onClick={() => onUpdatePrefs({ foodEnv: env })}
                  className={`px-2 py-1.5 text-[11px] font-semibold rounded-[2px] transition-colors whitespace-nowrap truncate cursor-pointer ${
                    active
                      ? 'bg-[#0A0A0A] text-white'
                      : 'text-[#555555] hover:text-[#0A0A0A]'
                  }`}
                >
                  {env === 'Home-Cooked' ? 'Home-Cooked' : 'On-the-Go'}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
