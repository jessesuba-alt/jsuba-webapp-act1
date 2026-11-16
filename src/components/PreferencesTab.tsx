import React, { useEffect, useState } from 'react';
import { Check, Dumbbell, Settings2, Target, Utensils } from 'lucide-react';
import {
  FITNESS_GOALS,
  FITNESS_LIMITS,
  FOOD_ENVIRONMENTS,
  WORKOUT_ENVIRONMENTS,
} from '../utils/fitnessLimits';
import type {
  FitnessGoal,
  FoodEnvironment,
  UserProfile,
  WorkoutEnvironment,
} from '../types';

interface PreferencesTabProps {
  profile: UserProfile;
  onUpdatePrefs: (prefs: {
    displayName?: string;
    goal?: FitnessGoal;
    workoutEnv?: WorkoutEnvironment;
    foodEnv?: FoodEnvironment;
  }) => void;
  onOpenSetupWizard: () => void;
}

const GOAL_NOTES: Record<FitnessGoal, string> = {
  'Weight Loss': 'Target ~1,800 kcal/day with 155g protein for steady fat loss.',
  'Muscle Gain': 'Target ~2,750 kcal/day with 185g protein for hypertrophy.',
  'General Fitness': 'Target ~2,200 kcal/day balanced maintenance for daily energy.',
};

export const PreferencesTab: React.FC<PreferencesTabProps> = ({
  profile,
  onUpdatePrefs,
  onOpenSetupWizard,
}) => {
  const [nameInput, setNameInput] = useState(profile.displayName);
  const [savedFlag, setSavedFlag] = useState(false);

  useEffect(() => {
    setNameInput(profile.displayName);
  }, [profile.displayName]);

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = nameInput.trim();
    if (!cleaned) return;
    onUpdatePrefs({ displayName: cleaned });
    setSavedFlag(true);
    window.setTimeout(() => setSavedFlag(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E5E5E5] pb-5">
        <div className="space-y-1">
          <p className="font-mono text-[11px] uppercase tracking-widest text-[#737373]">
            Account &amp; Environment Settings
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-[#0A0A0A]">
            Training &amp; Nutrition Preferences
          </h1>
          <p className="text-sm text-[#555555]">
            Changes apply immediately across your Workout Guide, Diet Planner, and macro targets.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenSetupWizard}
          className="px-3.5 py-2 border border-[#E5E5E5] hover:border-[#0A0A0A] bg-white text-[#0A0A0A] text-xs font-semibold uppercase tracking-wider rounded-[2px] transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer self-start sm:self-auto"
        >
          <Settings2 className="w-3.5 h-3.5" />
          <span>Full Setup Wizard</span>
        </button>
      </div>

      {/* Display Name & Account Summary */}
      <section className="border border-[#E5E5E5] bg-white rounded-[2px] p-5 space-y-4">
        <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-[#0A0A0A]">
          Athlete Profile
        </h2>
        <form onSubmit={handleSaveName} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-5 space-y-1.5">
            <label
              htmlFor="pref-display-name"
              className="block font-mono text-[11px] uppercase tracking-wider text-[#555555]"
            >
              Display Name
            </label>
            <input
              id="pref-display-name"
              type="text"
              maxLength={FITNESS_LIMITS.DISPLAY_NAME_MAX}
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="w-full px-3 py-2 border border-[#E5E5E5] focus:border-[#0A0A0A] focus:outline-none text-sm rounded-[2px]"
            />
          </div>
          <div className="sm:col-span-5 space-y-1.5">
            <span className="block font-mono text-[11px] uppercase tracking-wider text-[#555555]">
              Account Email
            </span>
            <div className="px-3 py-2 border border-[#E5E5E5] bg-[#FAFAFA] text-sm text-[#737373] rounded-[2px] truncate">
              {profile.email || 'Signed-in athlete'}
            </div>
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="w-full py-2 px-4 bg-[#0A0A0A] hover:bg-[#262626] text-white text-xs font-semibold uppercase tracking-wider rounded-[2px] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {savedFlag ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved</span>
                </>
              ) : (
                <span>Update</span>
              )}
            </button>
          </div>
        </form>
      </section>

      {/* Primary Goal */}
      <section className="border border-[#E5E5E5] bg-white rounded-[2px] p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-[#0A0A0A]" />
          <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-[#0A0A0A]">
            Primary Fitness Goal
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {FITNESS_GOALS.map((g) => {
            const selected = profile.goal === g;
            return (
              <button
                key={g}
                type="button"
                onClick={() => onUpdatePrefs({ goal: g })}
                className={`text-left p-4 border rounded-[2px] transition-colors cursor-pointer space-y-1.5 ${
                  selected
                    ? 'border-[#0A0A0A] bg-[#0A0A0A] text-white'
                    : 'border-[#E5E5E5] bg-[#FAFAFA] text-[#0A0A0A] hover:border-[#0A0A0A]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold">{g}</span>
                  {selected && <Check className="w-3.5 h-3.5 shrink-0" />}
                </div>
                <p className={`text-xs ${selected ? 'text-[#E5E5E5]' : 'text-[#555555]'}`}>
                  {GOAL_NOTES[g]}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Environments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="border border-[#E5E5E5] bg-white rounded-[2px] p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-[#0A0A0A]" />
            <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-[#0A0A0A]">
              Workout Environment
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {WORKOUT_ENVIRONMENTS.map((env) => {
              const selected = profile.workoutEnv === env;
              return (
                <button
                  key={env}
                  type="button"
                  onClick={() => onUpdatePrefs({ workoutEnv: env })}
                  className={`text-left p-4 border rounded-[2px] transition-colors cursor-pointer space-y-1 ${
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
                  <p className={`text-xs ${selected ? 'text-[#E5E5E5]' : 'text-[#555555]'}`}>
                    {env === 'Home'
                      ? 'Bodyweight, bands & basic dumbbells.'
                      : 'Machines, cables & free weights.'}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        <section className="border border-[#E5E5E5] bg-white rounded-[2px] p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Utensils className="w-4 h-4 text-[#0A0A0A]" />
            <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-[#0A0A0A]">
              Food &amp; Diet Environment
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FOOD_ENVIRONMENTS.map((env) => {
              const selected = profile.foodEnv === env;
              return (
                <button
                  key={env}
                  type="button"
                  onClick={() => onUpdatePrefs({ foodEnv: env })}
                  className={`text-left p-4 border rounded-[2px] transition-colors cursor-pointer space-y-1 ${
                    selected
                      ? 'border-[#0A0A0A] bg-[#0A0A0A] text-white'
                      : 'border-[#E5E5E5] bg-[#FAFAFA] text-[#0A0A0A] hover:border-[#0A0A0A]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold">{env}</span>
                    {selected && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </div>
                  <p className={`text-xs ${selected ? 'text-[#E5E5E5]' : 'text-[#555555]'}`}>
                    {env === 'Home-Cooked'
                      ? 'Simple whole-food meal prep.'
                      : 'No-cook & quick-order smart swaps.'}
                  </p>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};
