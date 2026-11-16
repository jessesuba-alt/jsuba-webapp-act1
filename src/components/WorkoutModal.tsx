import React, { useEffect, useState } from 'react';
import { Loader2, Plus, Trash2, X } from 'lucide-react';
import { FITNESS_LIMITS, WORKOUT_ENVIRONMENTS } from '../utils/fitnessLimits';
import type {
  CustomWorkoutInput,
  ExerciseItem,
  WorkoutEnvironment,
  WorkoutRoutine,
} from '../types';

interface WorkoutModalProps {
  isOpen: boolean;
  defaultEnvironment: WorkoutEnvironment;
  editingWorkout: WorkoutRoutine | null;
  onClose: () => void;
  onSave: (input: CustomWorkoutInput) => Promise<void>;
}

function createEmptyExercise(): ExerciseItem {
  return {
    id: `ex-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: '',
    sets: 3,
    reps: '10–12',
    restSeconds: 60,
    cue: '',
    alternative: '',
  };
}

export const WorkoutModal: React.FC<WorkoutModalProps> = ({
  isOpen,
  defaultEnvironment,
  editingWorkout,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [dayLabel, setDayLabel] = useState('Day 05 · Custom');
  const [environment, setEnvironment] = useState<WorkoutEnvironment>(defaultEnvironment);
  const [targetMuscles, setTargetMuscles] = useState('');
  const [exercises, setExercises] = useState<ExerciseItem[]>([createEmptyExercise()]);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    if (editingWorkout) {
      setTitle(editingWorkout.title);
      setDayLabel(editingWorkout.dayLabel);
      setEnvironment(editingWorkout.environment);
      setTargetMuscles(editingWorkout.targetMuscles);
      setExercises(
        editingWorkout.exercises.length > 0
          ? editingWorkout.exercises
          : [createEmptyExercise()]
      );
    } else {
      setTitle('');
      setDayLabel('Custom Session');
      setEnvironment(defaultEnvironment);
      setTargetMuscles('');
      setExercises([createEmptyExercise()]);
    }
  }, [isOpen, editingWorkout, defaultEnvironment]);

  if (!isOpen) return null;

  const updateExercise = (idx: number, patch: Partial<ExerciseItem>) => {
    setExercises((prev) => prev.map((ex, i) => (i === idx ? { ...ex, ...patch } : ex)));
  };

  const addExercise = () => {
    if (exercises.length >= FITNESS_LIMITS.WORKOUT_EXERCISES_MAX) return;
    setExercises((prev) => [...prev, createEmptyExercise()]);
  };

  const removeExercise = (idx: number) => {
    if (exercises.length <= 1) return;
    setExercises((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validExercises = exercises.filter((ex) => ex.name.trim().length > 0);
    if (!title.trim()) {
      setError('Please enter a workout title.');
      return;
    }
    if (!targetMuscles.trim()) {
      setError('Please specify target muscle groups.');
      return;
    }
    if (validExercises.length === 0) {
      setError('Add at least one exercise with a name.');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        id: editingWorkout?.id,
        title: title.trim(),
        dayLabel: dayLabel.trim() || 'Custom Session',
        environment,
        targetMuscles: targetMuscles.trim(),
        exercises: validExercises,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save workout.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A0A0A]/45 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="workout-modal-title"
    >
      <div className="bg-white border border-[#0A0A0A] rounded-[2px] max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="p-5 border-b border-[#E5E5E5] flex items-center justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-[#737373]">
              Custom Training Routine
            </p>
            <h2 id="workout-modal-title" className="text-lg font-bold text-[#0A0A0A]">
              {editingWorkout ? 'Edit Custom Workout' : 'Create Custom Workout'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close workout modal"
            className="p-1.5 text-[#737373] hover:text-[#0A0A0A] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5 overflow-y-auto">
          {error && (
            <div className="border border-[#0A0A0A] bg-[#FAFAFA] px-3.5 py-2.5 text-xs text-[#0A0A0A] rounded-[2px]">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block font-mono text-[11px] uppercase tracking-wider text-[#555555]">
                Workout Title *
              </label>
              <input
                type="text"
                required
                maxLength={FITNESS_LIMITS.WORKOUT_TITLE_MAX}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Push & Core Express"
                className="w-full px-3 py-2 border border-[#E5E5E5] focus:border-[#0A0A0A] focus:outline-none text-sm rounded-[2px]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-mono text-[11px] uppercase tracking-wider text-[#555555]">
                Day / Schedule Label
              </label>
              <input
                type="text"
                maxLength={FITNESS_LIMITS.WORKOUT_DAY_MAX}
                value={dayLabel}
                onChange={(e) => setDayLabel(e.target.value)}
                placeholder="Day 05 · Friday"
                className="w-full px-3 py-2 border border-[#E5E5E5] focus:border-[#0A0A0A] focus:outline-none text-sm rounded-[2px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block font-mono text-[11px] uppercase tracking-wider text-[#555555]">
                Environment
              </label>
              <div className="grid grid-cols-2 border border-[#E5E5E5] bg-[#FAFAFA] p-0.5 rounded-[2px]">
                {WORKOUT_ENVIRONMENTS.map((env) => (
                  <button
                    key={env}
                    type="button"
                    onClick={() => setEnvironment(env)}
                    className={`py-2 text-xs font-semibold rounded-[2px] cursor-pointer ${
                      environment === env
                        ? 'bg-[#0A0A0A] text-white'
                        : 'text-[#555555] hover:text-[#0A0A0A]'
                    }`}
                  >
                    {env}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block font-mono text-[11px] uppercase tracking-wider text-[#555555]">
                Target Muscle Groups *
              </label>
              <input
                type="text"
                required
                maxLength={FITNESS_LIMITS.WORKOUT_MUSCLES_MAX}
                value={targetMuscles}
                onChange={(e) => setTargetMuscles(e.target.value)}
                placeholder="Chest, Shoulders, Core"
                className="w-full px-3 py-2 border border-[#E5E5E5] focus:border-[#0A0A0A] focus:outline-none text-sm rounded-[2px]"
              />
            </div>
          </div>

          {/* Exercises List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-2">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#0A0A0A] font-semibold">
                Exercises ({exercises.length}/{FITNESS_LIMITS.WORKOUT_EXERCISES_MAX})
              </span>
              <button
                type="button"
                onClick={addExercise}
                disabled={exercises.length >= FITNESS_LIMITS.WORKOUT_EXERCISES_MAX}
                className="px-2.5 py-1 border border-[#0A0A0A] bg-white hover:bg-[#0A0A0A] hover:text-white text-[11px] font-semibold uppercase tracking-wider rounded-[2px] flex items-center gap-1 cursor-pointer disabled:opacity-40"
              >
                <Plus className="w-3 h-3" />
                <span>Add Exercise</span>
              </button>
            </div>

            <div className="space-y-3">
              {exercises.map((ex, idx) => (
                <div
                  key={ex.id}
                  className="border border-[#E5E5E5] bg-[#FAFAFA] p-3.5 rounded-[2px] space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#737373]">
                      Exercise 0{idx + 1}
                    </span>
                    {exercises.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeExercise(idx)}
                        aria-label={`Remove exercise ${idx + 1}`}
                        className="text-[#737373] hover:text-[#0A0A0A] cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                    <div className="sm:col-span-6">
                      <input
                        type="text"
                        placeholder="Exercise name (e.g. Goblet Squat)"
                        value={ex.name}
                        maxLength={100}
                        onChange={(e) => updateExercise(idx, { name: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-[#E5E5E5] focus:border-[#0A0A0A] focus:outline-none text-xs bg-white rounded-[2px]"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <input
                        type="number"
                        min={1}
                        max={20}
                        placeholder="Sets"
                        value={ex.sets}
                        onChange={(e) =>
                          updateExercise(idx, { sets: Number(e.target.value) || 1 })
                        }
                        className="w-full px-2.5 py-1.5 border border-[#E5E5E5] focus:border-[#0A0A0A] focus:outline-none text-xs font-mono bg-white rounded-[2px]"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        placeholder="Reps (8-12)"
                        value={ex.reps}
                        maxLength={30}
                        onChange={(e) => updateExercise(idx, { reps: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-[#E5E5E5] focus:border-[#0A0A0A] focus:outline-none text-xs font-mono bg-white rounded-[2px]"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <input
                        type="number"
                        min={15}
                        max={300}
                        step={15}
                        placeholder="Rest(s)"
                        value={ex.restSeconds}
                        onChange={(e) =>
                          updateExercise(idx, { restSeconds: Number(e.target.value) || 60 })
                        }
                        className="w-full px-2.5 py-1.5 border border-[#E5E5E5] focus:border-[#0A0A0A] focus:outline-none text-xs font-mono bg-white rounded-[2px]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <input
                      type="text"
                      placeholder="Form cue (optional)"
                      value={ex.cue}
                      maxLength={240}
                      onChange={(e) => updateExercise(idx, { cue: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-[#E5E5E5] focus:border-[#0A0A0A] focus:outline-none text-xs bg-white rounded-[2px]"
                    />
                    <input
                      type="text"
                      placeholder="Joint-friendly swap (optional)"
                      value={ex.alternative}
                      maxLength={240}
                      onChange={(e) => updateExercise(idx, { alternative: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-[#E5E5E5] focus:border-[#0A0A0A] focus:outline-none text-xs bg-white rounded-[2px]"
                    />
                  </div>
                </div>
              ))}
            </div>
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
                <span>{editingWorkout ? 'Save Changes' : 'Save Workout'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
