import React, { useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import {
  FITNESS_GOALS,
  FITNESS_LIMITS,
  FOOD_ENVIRONMENTS,
  MEAL_SLOTS,
} from '../utils/fitnessLimits';
import type {
  CustomMealInput,
  FitnessGoal,
  FoodEnvironment,
  MealEntry,
  MealSlot,
} from '../types';

interface MealModalProps {
  isOpen: boolean;
  defaultGoal: FitnessGoal;
  defaultFoodEnv: FoodEnvironment;
  editingMeal: MealEntry | null;
  onClose: () => void;
  onSave: (input: CustomMealInput) => Promise<void>;
}

export const MealModal: React.FC<MealModalProps> = ({
  isOpen,
  defaultGoal,
  defaultFoodEnv,
  editingMeal,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [slot, setSlot] = useState<MealSlot>('Lunch');
  const [foodEnv, setFoodEnv] = useState<FoodEnvironment>(defaultFoodEnv);
  const [goal, setGoal] = useState<FitnessGoal>(defaultGoal);
  const [calories, setCalories] = useState<number>(480);
  const [protein, setProtein] = useState<number>(40);
  const [carbs, setCarbs] = useState<number>(48);
  const [fat, setFat] = useState<number>(14);
  const [prepNotes, setPrepNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    if (editingMeal) {
      setTitle(editingMeal.title);
      setSlot(editingMeal.slot);
      setFoodEnv(editingMeal.foodEnv);
      setGoal(editingMeal.goal);
      setCalories(editingMeal.calories);
      setProtein(editingMeal.protein);
      setCarbs(editingMeal.carbs);
      setFat(editingMeal.fat);
      setPrepNotes(editingMeal.prepNotes);
    } else {
      setTitle('');
      setSlot('Lunch');
      setFoodEnv(defaultFoodEnv);
      setGoal(defaultGoal);
      setCalories(480);
      setProtein(40);
      setCarbs(48);
      setFat(14);
      setPrepNotes('');
    }
  }, [isOpen, editingMeal, defaultFoodEnv, defaultGoal]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Please enter a meal name.');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        id: editingMeal?.id,
        title: title.trim(),
        slot,
        foodEnv,
        goal,
        calories,
        protein,
        carbs,
        fat,
        prepNotes: prepNotes.trim(),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save meal.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A0A0A]/45 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="meal-modal-title"
    >
      <div className="bg-white border border-[#0A0A0A] rounded-[2px] max-w-xl w-full max-h-[90vh] flex flex-col">
        <div className="p-5 border-b border-[#E5E5E5] flex items-center justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-[#737373]">
              Nutrition Log Entry
            </p>
            <h2 id="meal-modal-title" className="text-lg font-bold text-[#0A0A0A]">
              {editingMeal ? 'Edit Custom Meal' : 'Add Custom Meal'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close meal modal"
            className="p-1.5 text-[#737373] hover:text-[#0A0A0A] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {error && (
            <div className="border border-[#0A0A0A] bg-[#FAFAFA] px-3.5 py-2.5 text-xs text-[#0A0A0A] rounded-[2px]">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block font-mono text-[11px] uppercase tracking-wider text-[#555555]">
              Meal Name *
            </label>
            <input
              type="text"
              required
              maxLength={FITNESS_LIMITS.MEAL_TITLE_MAX}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Crispy Tofu & Jasmine Rice Bowl"
              className="w-full px-3 py-2 border border-[#E5E5E5] focus:border-[#0A0A0A] focus:outline-none text-sm rounded-[2px]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block font-mono text-[11px] uppercase tracking-wider text-[#555555]">
                Meal Slot
              </label>
              <select
                value={slot}
                onChange={(e) => setSlot(e.target.value as MealSlot)}
                className="w-full px-3 py-2 border border-[#E5E5E5] focus:border-[#0A0A0A] focus:outline-none text-sm bg-white rounded-[2px]"
              >
                {MEAL_SLOTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block font-mono text-[11px] uppercase tracking-wider text-[#555555]">
                Food Environment
              </label>
              <div className="grid grid-cols-2 border border-[#E5E5E5] bg-[#FAFAFA] p-0.5 rounded-[2px]">
                {FOOD_ENVIRONMENTS.map((env) => (
                  <button
                    key={env}
                    type="button"
                    onClick={() => setFoodEnv(env)}
                    className={`py-2 text-xs font-semibold rounded-[2px] cursor-pointer ${
                      foodEnv === env
                        ? 'bg-[#0A0A0A] text-white'
                        : 'text-[#555555] hover:text-[#0A0A0A]'
                    }`}
                  >
                    {env}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block font-mono text-[11px] uppercase tracking-wider text-[#555555]">
              Associated Goal
            </label>
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value as FitnessGoal)}
              className="w-full px-3 py-2 border border-[#E5E5E5] focus:border-[#0A0A0A] focus:outline-none text-sm bg-white rounded-[2px]"
            >
              {FITNESS_GOALS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="block font-mono text-[10px] uppercase tracking-wider text-[#555555]">
                Calories
              </label>
              <input
                type="number"
                min={0}
                max={FITNESS_LIMITS.CALORIES_MAX}
                value={calories}
                onChange={(e) => setCalories(Number(e.target.value) || 0)}
                className="w-full px-2.5 py-2 border border-[#E5E5E5] focus:border-[#0A0A0A] focus:outline-none text-sm font-mono tabular-nums rounded-[2px]"
              />
            </div>
            <div className="space-y-1">
              <label className="block font-mono text-[10px] uppercase tracking-wider text-[#555555]">
                Protein (g)
              </label>
              <input
                type="number"
                min={0}
                max={FITNESS_LIMITS.PROTEIN_MAX}
                value={protein}
                onChange={(e) => setProtein(Number(e.target.value) || 0)}
                className="w-full px-2.5 py-2 border border-[#E5E5E5] focus:border-[#0A0A0A] focus:outline-none text-sm font-mono tabular-nums rounded-[2px]"
              />
            </div>
            <div className="space-y-1">
              <label className="block font-mono text-[10px] uppercase tracking-wider text-[#555555]">
                Carbs (g)
              </label>
              <input
                type="number"
                min={0}
                max={FITNESS_LIMITS.CARBS_MAX}
                value={carbs}
                onChange={(e) => setCarbs(Number(e.target.value) || 0)}
                className="w-full px-2.5 py-2 border border-[#E5E5E5] focus:border-[#0A0A0A] focus:outline-none text-sm font-mono tabular-nums rounded-[2px]"
              />
            </div>
            <div className="space-y-1">
              <label className="block font-mono text-[10px] uppercase tracking-wider text-[#555555]">
                Fat (g)
              </label>
              <input
                type="number"
                min={0}
                max={FITNESS_LIMITS.FAT_MAX}
                value={fat}
                onChange={(e) => setFat(Number(e.target.value) || 0)}
                className="w-full px-2.5 py-2 border border-[#E5E5E5] focus:border-[#0A0A0A] focus:outline-none text-sm font-mono tabular-nums rounded-[2px]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block font-mono text-[11px] uppercase tracking-wider text-[#555555]">
              Prep Instructions / Smart Swap Notes
            </label>
            <textarea
              rows={3}
              maxLength={FITNESS_LIMITS.MEAL_NOTES_MAX}
              value={prepNotes}
              onChange={(e) => setPrepNotes(e.target.value)}
              placeholder="Ingredients, portion sizes, or quick-order swap notes..."
              className="w-full px-3 py-2 border border-[#E5E5E5] focus:border-[#0A0A0A] focus:outline-none text-sm rounded-[2px]"
            />
          </div>

          <div className="pt-4 border-t border-[#E5E5E5] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 border border-[#E5E5E5] hover:border-[#0A0A0A] bg-white text-[#0A0A0A] text-xs font-semibold uppercase tracking-wider rounded-[2px] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-[#0A0A0A] hover:bg-[#262626] text-white text-xs font-semibold uppercase tracking-wider rounded-[2px] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{editingMeal ? 'Save Changes' : 'Save Meal'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
