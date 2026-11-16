import React, { useMemo } from 'react';
import { Check, Droplets, Edit3, Minus, Plus, Trash2 } from 'lucide-react';
import { GOAL_MACRO_TARGETS, GUIDED_MEAL_TEMPLATES } from '../data/fitnessTemplates';
import { getTodayIso, MEAL_SLOTS } from '../utils/fitnessLimits';
import type {
  FitnessGoal,
  FoodEnvironment,
  GuidedMealTemplate,
  MealEntry,
} from '../types';

interface DietTabProps {
  goal: FitnessGoal;
  foodEnv: FoodEnvironment;
  meals: MealEntry[];
  waterCupsToday: number;
  onUpdateWaterCups: (cups: number) => void | Promise<void>;
  onToggleGuidedMeal: (
    template: GuidedMealTemplate,
    existing: MealEntry | undefined,
    checkedToday: boolean
  ) => void | Promise<void>;
  onToggleCustomMeal: (meal: MealEntry, checkedToday: boolean) => void | Promise<void>;
  onOpenCreateMeal: () => void;
  onEditMeal: (meal: MealEntry) => void;
  onRequestDeleteMeal: (meal: MealEntry) => void;
}

export const DietTab: React.FC<DietTabProps> = ({
  goal,
  foodEnv,
  meals,
  waterCupsToday,
  onUpdateWaterCups,
  onToggleGuidedMeal,
  onToggleCustomMeal,
  onOpenCreateMeal,
  onEditMeal,
  onRequestDeleteMeal,
}) => {
  const todayIso = getTodayIso();
  const targets = GOAL_MACRO_TARGETS[goal];

  const guidedTemplates = useMemo(
    () =>
      GUIDED_MEAL_TEMPLATES.filter((m) => m.foodEnv === foodEnv && m.goal === goal).sort(
        (a, b) => MEAL_SLOTS.indexOf(a.slot) - MEAL_SLOTS.indexOf(b.slot)
      ),
    [foodEnv, goal]
  );

  const guidedRecordMap = useMemo(() => {
    const map = new Map<string, MealEntry>();
    meals.forEach((m) => {
      if (!m.isCustom && m.templateKey) {
        map.set(m.templateKey, m);
      }
    });
    return map;
  }, [meals]);

  const customMeals = useMemo(
    () =>
      meals
        .filter((m) => m.isCustom)
        .sort((a, b) => MEAL_SLOTS.indexOf(a.slot) - MEAL_SLOTS.indexOf(b.slot)),
    [meals]
  );

  // Sum checked-off meals today across guided + custom
  const consumedTotals = useMemo(() => {
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;
    let checkedCount = 0;

    guidedTemplates.forEach((t) => {
      const rec = guidedRecordMap.get(t.templateKey);
      if (rec?.checkedDate === todayIso) {
        calories += t.calories;
        protein += t.protein;
        carbs += t.carbs;
        fat += t.fat;
        checkedCount += 1;
      }
    });

    customMeals.forEach((m) => {
      if (m.checkedDate === todayIso) {
        calories += m.calories;
        protein += m.protein;
        carbs += m.carbs;
        fat += m.fat;
        checkedCount += 1;
      }
    });

    return { calories, protein, carbs, fat, checkedCount };
  }, [guidedTemplates, guidedRecordMap, customMeals, todayIso]);

  const plannedGuidedCalories = guidedTemplates.reduce((acc, m) => acc + m.calories, 0);

  const macroMetrics = [
    { label: 'Calories', current: consumedTotals.calories, target: targets.calories, unit: 'kcal' },
    { label: 'Protein', current: consumedTotals.protein, target: targets.protein, unit: 'g' },
    { label: 'Carbs', current: consumedTotals.carbs, target: targets.carbs, unit: 'g' },
    { label: 'Fat', current: consumedTotals.fat, target: targets.fat, unit: 'g' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Strip */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E5E5E5] pb-5">
        <div className="space-y-1">
          <p className="font-mono text-[11px] uppercase tracking-widest text-[#737373]">
            {foodEnv === 'Home-Cooked'
              ? 'Home-Cooked / Budget Meal Prep'
              : 'On-the-Go / Dorm-Friendly & Smart Swaps'}{' '}
            · {goal}
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-[#0A0A0A]">
            Daily Diet &amp; Macro Schedule
          </h1>
          <p className="text-sm text-[#555555]">{targets.guidance}</p>
        </div>

        <button
          type="button"
          onClick={onOpenCreateMeal}
          className="px-4 py-2 bg-[#0A0A0A] hover:bg-[#262626] text-white text-xs font-semibold uppercase tracking-wider rounded-[2px] transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Custom Meal</span>
        </button>
      </div>

      {/* Macro Summary + Water Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <section className="lg:col-span-8 border border-[#E5E5E5] bg-white rounded-[2px] p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-[#0A0A0A]">
              Today&apos;s Intake vs. Target
            </h2>
            <span className="font-mono text-[11px] text-[#737373] tabular-nums">
              Plan baseline: {plannedGuidedCalories} kcal
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {macroMetrics.map((m) => {
              const pct = Math.min(100, Math.round((m.current / Math.max(1, m.target)) * 100));
              return (
                <div
                  key={m.label}
                  className="border border-[#E5E5E5] bg-[#FAFAFA] p-3 rounded-[2px] space-y-2"
                >
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#737373] block">
                    {m.label}
                  </span>
                  <div className="font-mono text-sm font-bold text-[#0A0A0A] tabular-nums">
                    {m.current}
                    <span className="text-xs font-normal text-[#737373]">
                      /{m.target} {m.unit}
                    </span>
                  </div>
                  <div className="h-1 bg-[#E5E5E5] w-full">
                    <div className="h-full bg-[#0A0A0A]" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Water Intake Check-off Tracker */}
        <section className="lg:col-span-4 border border-[#E5E5E5] bg-white rounded-[2px] p-4 sm:p-5 flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <Droplets className="w-4 h-4 text-[#0A0A0A]" />
              <div>
                <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-[#0A0A0A]">
                  Hydration Log
                </h2>
                <p className="text-[11px] text-[#737373]">1 cup ≈ 250 ml / 8 oz</p>
              </div>
            </div>
            <span className="font-mono text-sm font-bold tabular-nums text-[#0A0A0A]">
              {waterCupsToday}/{targets.waterCups}
            </span>
          </div>

          <div className="grid grid-cols-5 gap-1.5">
            {Array.from({ length: targets.waterCups }).map((_, idx) => {
              const cupNumber = idx + 1;
              const filled = cupNumber <= waterCupsToday;
              return (
                <button
                  key={cupNumber}
                  type="button"
                  onClick={() =>
                    onUpdateWaterCups(
                      filled && waterCupsToday === cupNumber ? cupNumber - 1 : cupNumber
                    )
                  }
                  aria-label={`Set water intake to ${cupNumber} cups`}
                  className={`h-8 border rounded-[2px] font-mono text-[11px] tabular-nums transition-colors cursor-pointer ${
                    filled
                      ? 'bg-[#0A0A0A] border-[#0A0A0A] text-white'
                      : 'bg-[#FAFAFA] border-[#E5E5E5] text-[#737373] hover:border-[#0A0A0A]'
                  }`}
                >
                  {cupNumber}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#E5E5E5]">
            <button
              type="button"
              onClick={() => onUpdateWaterCups(Math.max(0, waterCupsToday - 1))}
              disabled={waterCupsToday <= 0}
              className="px-2.5 py-1 border border-[#E5E5E5] hover:border-[#0A0A0A] rounded-[2px] text-xs font-medium flex items-center gap-1 disabled:opacity-40 cursor-pointer"
            >
              <Minus className="w-3 h-3" />
              <span>1 Cup</span>
            </button>
            <button
              type="button"
              onClick={() => onUpdateWaterCups(Math.min(24, waterCupsToday + 1))}
              className="px-2.5 py-1 border border-[#0A0A0A] bg-[#0A0A0A] text-white rounded-[2px] text-xs font-medium flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>1 Cup</span>
            </button>
          </div>
        </section>
      </div>

      {/* Guided Meal Schedule */}
      <div className="space-y-3">
        <h2 className="font-mono text-xs font-semibold uppercase tracking-widest text-[#0A0A0A]">
          Guided Daily Meals ({foodEnv})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {guidedTemplates.map((meal) => {
            const record = guidedRecordMap.get(meal.templateKey);
            const checkedToday = record?.checkedDate === todayIso;
            return (
              <article
                key={meal.templateKey}
                className={`border rounded-[2px] p-4 sm:p-5 flex flex-col justify-between gap-4 transition-colors ${
                  checkedToday
                    ? 'border-[#0A0A0A] bg-[#FAFAFA]'
                    : 'border-[#E5E5E5] bg-white'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 bg-[#0A0A0A] text-white rounded-[2px]">
                          {meal.slot}
                        </span>
                        <span className="font-mono text-[10px] uppercase tracking-wider text-[#737373]">
                          {meal.foodEnv}
                        </span>
                      </div>
                      <h3
                        className={`text-base font-bold ${
                          checkedToday ? 'line-through text-[#737373]' : 'text-[#0A0A0A]'
                        }`}
                      >
                        {meal.title}
                      </h3>
                    </div>

                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={checkedToday}
                      aria-label={`Mark ${meal.title} eaten today`}
                      onClick={() => onToggleGuidedMeal(meal, record, !checkedToday)}
                      className={`w-6 h-6 border rounded-[2px] flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                        checkedToday
                          ? 'bg-[#0A0A0A] border-[#0A0A0A] text-white'
                          : 'bg-white border-[#0A0A0A] text-transparent hover:bg-[#FAFAFA]'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-xs text-[#555555] leading-relaxed">{meal.prepNotes}</p>
                </div>

                {/* Macro Strip */}
                <div className="pt-3 border-t border-[#E5E5E5] flex items-center justify-between gap-2 font-mono text-[11px] tabular-nums">
                  <span className="font-bold text-[#0A0A0A]">{meal.calories} kcal</span>
                  <div className="flex items-center gap-3 text-[#555555]">
                    <span>P {meal.protein}g</span>
                    <span>C {meal.carbs}g</span>
                    <span>F {meal.fat}g</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* Custom Meals Section */}
      <div className="pt-2 space-y-3">
        <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-2.5">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-widest text-[#0A0A0A]">
            Your Saved Custom Meals ({customMeals.length})
          </h2>
          <button
            type="button"
            onClick={onOpenCreateMeal}
            className="font-mono text-[11px] uppercase tracking-wider text-[#0A0A0A] hover:underline cursor-pointer"
          >
            + Add Meal
          </button>
        </div>

        {customMeals.length === 0 ? (
          <div className="border border-dashed border-[#E5E5E5] bg-[#FAFAFA] p-6 rounded-[2px] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[#0A0A0A]">No custom meals logged yet</p>
              <p className="text-xs text-[#737373]">
                Save favorite shakes, dorm bowls, or home recipes with exact macros.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenCreateMeal}
              className="px-3.5 py-2 border border-[#0A0A0A] bg-white hover:bg-[#0A0A0A] hover:text-white text-[#0A0A0A] text-xs font-semibold uppercase tracking-wider rounded-[2px] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Add Custom Meal
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customMeals.map((meal) => {
              const checkedToday = meal.checkedDate === todayIso;
              return (
                <article
                  key={meal.id}
                  className={`border rounded-[2px] p-4 sm:p-5 flex flex-col justify-between gap-4 ${
                    checkedToday
                      ? 'border-[#0A0A0A] bg-[#FAFAFA]'
                      : 'border-[#0A0A0A] bg-white'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 bg-[#0A0A0A] text-white rounded-[2px]">
                            {meal.slot}
                          </span>
                          <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 border border-[#E5E5E5] text-[#555555] rounded-[2px]">
                            Custom · {meal.foodEnv}
                          </span>
                        </div>
                        <h3
                          className={`text-base font-bold ${
                            checkedToday ? 'line-through text-[#737373]' : 'text-[#0A0A0A]'
                          }`}
                        >
                          {meal.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => onEditMeal(meal)}
                          aria-label={`Edit ${meal.title}`}
                          className="p-1.5 border border-[#E5E5E5] hover:border-[#0A0A0A] bg-white text-[#0A0A0A] rounded-[2px] cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onRequestDeleteMeal(meal)}
                          aria-label={`Delete ${meal.title}`}
                          className="p-1.5 border border-[#E5E5E5] hover:border-[#0A0A0A] bg-white text-[#0A0A0A] rounded-[2px] cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={checkedToday}
                          aria-label={`Mark ${meal.title} eaten today`}
                          onClick={() => onToggleCustomMeal(meal, !checkedToday)}
                          className={`w-7 h-7 border rounded-[2px] flex items-center justify-center transition-colors cursor-pointer ${
                            checkedToday
                              ? 'bg-[#0A0A0A] border-[#0A0A0A] text-white'
                              : 'bg-white border-[#0A0A0A] text-transparent hover:bg-[#FAFAFA]'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {meal.prepNotes && (
                      <p className="text-xs text-[#555555] leading-relaxed">{meal.prepNotes}</p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[#E5E5E5] flex items-center justify-between gap-2 font-mono text-[11px] tabular-nums">
                    <span className="font-bold text-[#0A0A0A]">{meal.calories} kcal</span>
                    <div className="flex items-center gap-3 text-[#555555]">
                      <span>P {meal.protein}g</span>
                      <span>C {meal.carbs}g</span>
                      <span>F {meal.fat}g</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
