import React, { useMemo } from 'react';
import {
  Check,
  Dumbbell,
  Edit3,
  Flame,
  Plus,
  Settings2,
  Trash2,
  Utensils,
} from 'lucide-react';
import {
  calculateStreak,
  formatShortDate,
  getCurrentWeekDays,
  getTodayIso,
} from '../utils/fitnessLimits';
import type { MealEntry, UserProfile, WorkoutRoutine } from '../types';

interface ProgressTabProps {
  profile: UserProfile;
  workouts: WorkoutRoutine[];
  meals: MealEntry[];
  onToggleDateLogged: (isoDate: string) => void;
  onOpenCreateWorkout: () => void;
  onEditWorkout: (workout: WorkoutRoutine) => void;
  onRequestDeleteWorkout: (workout: WorkoutRoutine) => void;
  onOpenCreateMeal: () => void;
  onEditMeal: (meal: MealEntry) => void;
  onRequestDeleteMeal: (meal: MealEntry) => void;
  onOpenPreferences: () => void;
}

export const ProgressTab: React.FC<ProgressTabProps> = ({
  profile,
  workouts,
  meals,
  onToggleDateLogged,
  onOpenCreateWorkout,
  onEditWorkout,
  onRequestDeleteWorkout,
  onOpenCreateMeal,
  onEditMeal,
  onRequestDeleteMeal,
  onOpenPreferences,
}) => {
  const todayIso = getTodayIso();
  const weekDays = useMemo(() => getCurrentWeekDays(), []);
  const streak = useMemo(() => calculateStreak(profile.completedDates), [profile.completedDates]);

  const completedSet = useMemo(
    () => new Set(profile.completedDates),
    [profile.completedDates]
  );

  const weekLoggedCount = useMemo(
    () => weekDays.filter((d) => completedSet.has(d.iso)).length,
    [weekDays, completedSet]
  );

  const completedWorkouts = useMemo(
    () => workouts.filter((w) => w.isCompleted || Boolean(w.lastCompletedDate)),
    [workouts]
  );

  const checkedMealsHistory = useMemo(
    () => meals.filter((m) => Boolean(m.checkedDate)),
    [meals]
  );

  const checkedMealsTodayCount = useMemo(
    () => meals.filter((m) => m.checkedDate === todayIso).length,
    [meals, todayIso]
  );

  const customWorkouts = useMemo(() => workouts.filter((w) => w.isCustom), [workouts]);
  const customMeals = useMemo(() => meals.filter((m) => m.isCustom), [meals]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E5E5E5] pb-5">
        <div className="space-y-1">
          <p className="font-mono text-[11px] uppercase tracking-widest text-[#737373]">
            Consistency &amp; Custom Library
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-[#0A0A0A]">
            Progress &amp; Training Log
          </h1>
          <p className="text-sm text-[#555555]">
            Log daily check-ins to maintain your weekly consistency streak, review completed
            sessions, and manage saved custom workouts or meals.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenPreferences}
          className="px-3.5 py-2 border border-[#E5E5E5] hover:border-[#0A0A0A] bg-white text-[#0A0A0A] text-xs font-semibold uppercase tracking-wider rounded-[2px] transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer self-start sm:self-auto"
        >
          <Settings2 className="w-3.5 h-3.5" />
          <span>Preferences</span>
        </button>
      </div>

      {/* Weekly Streak Card */}
      <section className="border border-[#0A0A0A] bg-white rounded-[2px] p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0A0A0A] text-white rounded-[2px] flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#737373] block">
                Current Consistency Streak
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold tabular-nums text-[#0A0A0A]">{streak}</span>
                <span className="text-sm font-medium text-[#555555]">
                  {streak === 1 ? 'consecutive day' : 'consecutive days'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-[#555555] tabular-nums">
              This week: <strong className="text-[#0A0A0A]">{weekLoggedCount}/7</strong> days
            </span>
            <button
              type="button"
              onClick={() => onToggleDateLogged(todayIso)}
              className={`px-4 py-2 border text-xs font-semibold uppercase tracking-wider rounded-[2px] transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                completedSet.has(todayIso)
                  ? 'bg-[#0A0A0A] border-[#0A0A0A] text-white'
                  : 'bg-white border-[#0A0A0A] text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>{completedSet.has(todayIso) ? 'Today Logged' : 'Log Today Complete'}</span>
            </button>
          </div>
        </div>

        {/* 7-Day Check-In Grid */}
        <div className="grid grid-cols-7 gap-2 pt-2 border-t border-[#E5E5E5]">
          {weekDays.map((day) => {
            const done = completedSet.has(day.iso);
            return (
              <button
                key={day.iso}
                type="button"
                disabled={day.isFuture}
                onClick={() => onToggleDateLogged(day.iso)}
                className={`p-2.5 border rounded-[2px] flex flex-col items-center justify-center gap-1 transition-colors ${
                  day.isFuture
                    ? 'border-[#E5E5E5] bg-[#FAFAFA] text-[#A3A3A3] cursor-not-allowed'
                    : done
                    ? 'border-[#0A0A0A] bg-[#0A0A0A] text-white cursor-pointer'
                    : day.isToday
                    ? 'border-[#0A0A0A] bg-white text-[#0A0A0A] hover:bg-[#FAFAFA] cursor-pointer'
                    : 'border-[#E5E5E5] bg-white text-[#555555] hover:border-[#0A0A0A] cursor-pointer'
                }`}
              >
                <span className="font-mono text-[10px] uppercase tracking-wider">
                  {day.shortLabel}
                </span>
                <span className="font-mono text-sm font-bold tabular-nums">{day.dayNumber}</span>
                <span className="h-3.5 flex items-center justify-center">
                  {done ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <span className="font-mono text-[10px] opacity-60">
                      {day.isToday ? 'TODAY' : '—'}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="border border-[#E5E5E5] bg-[#FAFAFA] p-4 rounded-[2px] space-y-1">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#737373]">
            Sessions Completed
          </span>
          <p className="font-mono text-2xl font-bold tabular-nums text-[#0A0A0A]">
            {completedWorkouts.length}
          </p>
        </div>
        <div className="border border-[#E5E5E5] bg-[#FAFAFA] p-4 rounded-[2px] space-y-1">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#737373]">
            Meals Checked Today
          </span>
          <p className="font-mono text-2xl font-bold tabular-nums text-[#0A0A0A]">
            {checkedMealsTodayCount}
          </p>
        </div>
        <div className="border border-[#E5E5E5] bg-[#FAFAFA] p-4 rounded-[2px] space-y-1">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#737373]">
            Water Cups Today
          </span>
          <p className="font-mono text-2xl font-bold tabular-nums text-[#0A0A0A]">
            {profile.waterCupsToday}
          </p>
        </div>
        <div className="border border-[#E5E5E5] bg-[#FAFAFA] p-4 rounded-[2px] space-y-1">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#737373]">
            Total Days Logged
          </span>
          <p className="font-mono text-2xl font-bold tabular-nums text-[#0A0A0A]">
            {profile.completedDates.length}
          </p>
        </div>
      </div>

      {/* Completed Workouts & Meals History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="border border-[#E5E5E5] bg-white rounded-[2px] p-5 space-y-3">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-[#0A0A0A] border-b border-[#E5E5E5] pb-2.5">
            Completed Workout History ({completedWorkouts.length})
          </h2>
          {completedWorkouts.length === 0 ? (
            <p className="text-xs text-[#737373] py-3">
              No completed workout sessions yet. Check off exercises or click &ldquo;Mark
              Complete&rdquo; in Workout Guide to log a session.
            </p>
          ) : (
            <div className="divide-y divide-[#E5E5E5]">
              {completedWorkouts.map((w) => (
                <div key={w.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#0A0A0A] truncate">{w.title}</p>
                    <p className="font-mono text-[11px] text-[#737373]">
                      {w.environment} · {w.dayLabel}
                    </p>
                  </div>
                  <span className="font-mono text-[11px] px-2 py-0.5 bg-[#0A0A0A] text-white rounded-[2px] shrink-0">
                    {w.lastCompletedDate ? formatShortDate(w.lastCompletedDate) : 'Done'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="border border-[#E5E5E5] bg-white rounded-[2px] p-5 space-y-3">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-[#0A0A0A] border-b border-[#E5E5E5] pb-2.5">
            Logged Meal History ({checkedMealsHistory.length})
          </h2>
          {checkedMealsHistory.length === 0 ? (
            <p className="text-xs text-[#737373] py-3">
              No meals checked off yet. Check off meals in Diet Planner to track daily macros and
              history.
            </p>
          ) : (
            <div className="divide-y divide-[#E5E5E5]">
              {checkedMealsHistory.map((m) => (
                <div key={m.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#0A0A0A] truncate">{m.title}</p>
                    <p className="font-mono text-[11px] text-[#737373] tabular-nums">
                      {m.slot} · {m.calories} kcal · P {m.protein}g
                    </p>
                  </div>
                  <span className="font-mono text-[11px] px-2 py-0.5 border border-[#0A0A0A] text-[#0A0A0A] rounded-[2px] shrink-0">
                    {formatShortDate(m.checkedDate)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Saved Custom Workouts & Custom Meals Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Custom Workouts */}
        <section className="border border-[#E5E5E5] bg-white rounded-[2px] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
            <div className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-[#0A0A0A]" />
              <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-[#0A0A0A]">
                Custom Workouts ({customWorkouts.length})
              </h2>
            </div>
            <button
              type="button"
              onClick={onOpenCreateWorkout}
              className="px-2.5 py-1 border border-[#0A0A0A] bg-[#0A0A0A] text-white text-[11px] font-semibold uppercase tracking-wider rounded-[2px] flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>New</span>
            </button>
          </div>

          {customWorkouts.length === 0 ? (
            <p className="text-xs text-[#737373] py-4">
              No custom workouts saved yet. Create a custom routine for Home or Gym to track it
              here.
            </p>
          ) : (
            <div className="divide-y divide-[#E5E5E5]">
              {customWorkouts.map((w) => (
                <div key={w.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 border border-[#E5E5E5] bg-[#FAFAFA] text-[#555555] rounded-[2px]">
                        {w.environment}
                      </span>
                      <span className="font-mono text-[10px] text-[#737373]">
                        {w.dayLabel}
                      </span>
                      {w.lastCompletedDate && (
                        <span className="font-mono text-[10px] text-[#737373]">
                          Last: {formatShortDate(w.lastCompletedDate)}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-[#0A0A0A] truncate">{w.title}</h3>
                    <p className="text-xs text-[#555555] truncate">
                      {w.exercises.length} exercises · {w.targetMuscles}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onEditWorkout(w)}
                      aria-label={`Edit ${w.title}`}
                      className="p-1.5 border border-[#E5E5E5] hover:border-[#0A0A0A] rounded-[2px] cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRequestDeleteWorkout(w)}
                      aria-label={`Delete ${w.title}`}
                      className="p-1.5 border border-[#E5E5E5] hover:border-[#0A0A0A] rounded-[2px] cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Custom Meals */}
        <section className="border border-[#E5E5E5] bg-white rounded-[2px] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
            <div className="flex items-center gap-2">
              <Utensils className="w-4 h-4 text-[#0A0A0A]" />
              <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-[#0A0A0A]">
                Custom Meals ({customMeals.length})
              </h2>
            </div>
            <button
              type="button"
              onClick={onOpenCreateMeal}
              className="px-2.5 py-1 border border-[#0A0A0A] bg-[#0A0A0A] text-white text-[11px] font-semibold uppercase tracking-wider rounded-[2px] flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>New</span>
            </button>
          </div>

          {customMeals.length === 0 ? (
            <p className="text-xs text-[#737373] py-4">
              No custom meals saved yet. Add a custom Breakfast, Lunch, Dinner, or Snack to reuse
              across days.
            </p>
          ) : (
            <div className="divide-y divide-[#E5E5E5]">
              {customMeals.map((m) => (
                <div key={m.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 bg-[#0A0A0A] text-white rounded-[2px]">
                        {m.slot}
                      </span>
                      <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 border border-[#E5E5E5] bg-[#FAFAFA] text-[#555555] rounded-[2px]">
                        {m.foodEnv}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-[#0A0A0A] truncate">{m.title}</h3>
                    <p className="font-mono text-[11px] text-[#555555] tabular-nums">
                      {m.calories} kcal · P {m.protein}g · C {m.carbs}g · F {m.fat}g
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onEditMeal(m)}
                      aria-label={`Edit ${m.title}`}
                      className="p-1.5 border border-[#E5E5E5] hover:border-[#0A0A0A] rounded-[2px] cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRequestDeleteMeal(m)}
                      aria-label={`Delete ${m.title}`}
                      className="p-1.5 border border-[#E5E5E5] hover:border-[#0A0A0A] rounded-[2px] cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
