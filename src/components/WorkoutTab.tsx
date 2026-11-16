import React, { useMemo, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Edit3,
  Plus,
  Timer,
  Trash2,
} from 'lucide-react';
import { GUIDED_WORKOUT_TEMPLATES } from '../data/fitnessTemplates';
import { RestTimer } from './RestTimer';
import type {
  ExerciseItem,
  GuidedWorkoutTemplate,
  WorkoutEnvironment,
  WorkoutRoutine,
} from '../types';

interface WorkoutTabProps {
  environment: WorkoutEnvironment;
  workouts: WorkoutRoutine[];
  onToggleGuidedExercise: (
    template: GuidedWorkoutTemplate,
    existing: WorkoutRoutine | undefined,
    exerciseId: string
  ) => void | Promise<void>;
  onToggleGuidedComplete: (
    template: GuidedWorkoutTemplate,
    existing: WorkoutRoutine | undefined
  ) => void | Promise<void>;
  onToggleCustomExercise: (workout: WorkoutRoutine, exerciseId: string) => void | Promise<void>;
  onToggleCustomComplete: (workout: WorkoutRoutine) => void | Promise<void>;
  onOpenCreateWorkout: () => void;
  onEditWorkout: (workout: WorkoutRoutine) => void;
  onRequestDeleteWorkout: (workout: WorkoutRoutine) => void;
}

export const WorkoutTab: React.FC<WorkoutTabProps> = ({
  environment,
  workouts,
  onToggleGuidedExercise,
  onToggleGuidedComplete,
  onToggleCustomExercise,
  onToggleCustomComplete,
  onOpenCreateWorkout,
  onEditWorkout,
  onRequestDeleteWorkout,
}) => {
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({
    'home-day-1': true,
    'gym-day-1': true,
  });
  const [timerTrigger, setTimerTrigger] = useState<{
    seconds: number;
    label: string;
    nonce: number;
  } | null>(null);

  const guidedTemplates = useMemo(
    () => GUIDED_WORKOUT_TEMPLATES.filter((t) => t.environment === environment),
    [environment]
  );

  const guidedProgressMap = useMemo(() => {
    const map = new Map<string, WorkoutRoutine>();
    workouts.forEach((w) => {
      if (!w.isCustom && w.templateKey) {
        map.set(w.templateKey, w);
      }
    });
    return map;
  }, [workouts]);

  const customWorkouts = useMemo(
    () => workouts.filter((w) => w.isCustom && w.environment === environment),
    [workouts, environment]
  );

  const completedThisEnvCount = useMemo(() => {
    const guidedDone = guidedTemplates.filter(
      (t) => guidedProgressMap.get(t.templateKey)?.isCompleted
    ).length;
    const customDone = customWorkouts.filter((w) => w.isCompleted).length;
    return guidedDone + customDone;
  }, [guidedTemplates, guidedProgressMap, customWorkouts]);

  const totalSessions = guidedTemplates.length + customWorkouts.length;

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const renderExerciseList = (
    exercises: ExerciseItem[],
    completedIds: string[],
    onToggleEx: (exId: string) => void
  ) => (
    <div className="divide-y divide-[#E5E5E5] border-t border-[#E5E5E5]">
      {exercises.map((ex, idx) => {
        const checked = completedIds.includes(ex.id);
        return (
          <div
            key={ex.id}
            className={`p-4 transition-colors ${checked ? 'bg-[#FAFAFA]' : 'bg-white'}`}
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={checked}
                  aria-label={`Mark ${ex.name} complete`}
                  onClick={() => onToggleEx(ex.id)}
                  className={`mt-0.5 w-5 h-5 border rounded-[2px] flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                    checked
                      ? 'bg-[#0A0A0A] border-[#0A0A0A] text-white'
                      : 'bg-white border-[#0A0A0A] text-transparent hover:bg-[#FAFAFA]'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="font-mono text-[11px] text-[#737373] tabular-nums">
                      0{idx + 1}
                    </span>
                    <h4
                      className={`text-sm font-bold ${
                        checked ? 'line-through text-[#737373]' : 'text-[#0A0A0A]'
                      }`}
                    >
                      {ex.name}
                    </h4>
                  </div>

                  {ex.cue && (
                    <p className="text-xs text-[#555555] leading-relaxed">
                      <span className="font-semibold text-[#0A0A0A]">Form cue: </span>
                      {ex.cue}
                    </p>
                  )}

                  {ex.alternative && (
                    <p className="text-xs text-[#737373] leading-relaxed">
                      <span className="font-medium text-[#555555]">Joint-friendly swap: </span>
                      {ex.alternative}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 pl-8 sm:pl-0 shrink-0">
                <span className="font-mono text-xs font-semibold tabular-nums text-[#0A0A0A] border border-[#E5E5E5] bg-[#FAFAFA] px-2.5 py-1 rounded-[2px] whitespace-nowrap">
                  {ex.sets} × {ex.reps}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setTimerTrigger({
                      seconds: ex.restSeconds,
                      label: `Rest after ${ex.name}`,
                      nonce: Date.now(),
                    })
                  }
                  className="font-mono text-[11px] text-[#555555] hover:text-[#0A0A0A] border border-[#E5E5E5] hover:border-[#0A0A0A] bg-white px-2.5 py-1 rounded-[2px] flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors"
                >
                  <Timer className="w-3 h-3" />
                  <span className="tabular-nums">{ex.restSeconds}s rest</span>
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header Strip */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E5E5E5] pb-5">
        <div className="space-y-1">
          <p className="font-mono text-[11px] uppercase tracking-widest text-[#737373]">
            {environment === 'Home'
              ? 'Home / Bodyweight & Basic Dumbbells Split'
              : 'Commercial Gym / Machines & Free Weights Split'}
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-[#0A0A0A]">
            Guided Weekly Workout Plan
          </h1>
          <p className="text-sm text-[#555555]">
            {environment === 'Home'
              ? 'Zero machines needed. Controlled tempo push-ups, squats, lunges, bands, and core stability.'
              : 'Structured machine and free-weight movements with clear setup cues and joint-friendly swaps.'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="border border-[#E5E5E5] bg-[#FAFAFA] px-3 py-2 rounded-[2px] font-mono text-xs tabular-nums">
            <span className="text-[#737373]">COMPLETED </span>
            <span className="font-bold text-[#0A0A0A]">
              {completedThisEnvCount}/{totalSessions}
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenCreateWorkout}
            className="px-4 py-2 bg-[#0A0A0A] hover:bg-[#262626] text-white text-xs font-semibold uppercase tracking-wider rounded-[2px] transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Custom Workout</span>
          </button>
        </div>
      </div>

      {/* Interactive Rest Timer */}
      <RestTimer externalTrigger={timerTrigger} />

      {/* Guided Workout Cards */}
      <div className="space-y-4">
        {guidedTemplates.map((template) => {
          const record = guidedProgressMap.get(template.templateKey);
          const completedIds = record?.completedExerciseIds || [];
          const isCompleted = Boolean(record?.isCompleted);
          const isExpanded = Boolean(expandedKeys[template.templateKey]);

          return (
            <article
              key={template.templateKey}
              className="border border-[#E5E5E5] bg-white rounded-[2px] overflow-hidden"
            >
              <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => toggleExpand(template.templateKey)}
                  className="text-left flex-1 space-y-1 cursor-pointer group"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-[#737373]">
                      {template.dayLabel}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 border border-[#E5E5E5] bg-[#FAFAFA] text-[#555555] rounded-[2px]">
                      Guided · {template.environment}
                    </span>
                    {isCompleted && (
                      <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 bg-[#0A0A0A] text-white rounded-[2px]">
                        Session Done
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-[#0A0A0A] group-hover:underline">
                    {template.title}
                  </h3>
                  <p className="text-xs text-[#555555]">
                    Target: {template.targetMuscles} ·{' '}
                    <span className="font-mono tabular-nums">
                      {completedIds.length}/{template.exercises.length} exercises
                    </span>
                  </p>
                </button>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onToggleGuidedComplete(template, record)}
                    className={`px-3 py-1.5 border text-xs font-semibold rounded-[2px] transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                      isCompleted
                        ? 'bg-[#0A0A0A] border-[#0A0A0A] text-white'
                        : 'bg-white border-[#E5E5E5] hover:border-[#0A0A0A] text-[#0A0A0A]'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isCompleted ? 'Completed' : 'Mark Complete'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleExpand(template.templateKey)}
                    aria-label={isExpanded ? 'Collapse workout exercises' : 'Expand workout exercises'}
                    className="p-2 border border-[#E5E5E5] hover:border-[#0A0A0A] bg-[#FAFAFA] text-[#0A0A0A] rounded-[2px] transition-colors cursor-pointer"
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {isExpanded &&
                renderExerciseList(template.exercises, completedIds, (exId) =>
                  onToggleGuidedExercise(template, record, exId)
                )}
            </article>
          );
        })}
      </div>

      {/* Custom Workouts Section for Active Environment */}
      <div className="pt-4 space-y-3">
        <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-2.5">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-widest text-[#0A0A0A]">
            Your Custom {environment} Workouts ({customWorkouts.length})
          </h2>
          <button
            type="button"
            onClick={onOpenCreateWorkout}
            className="font-mono text-[11px] uppercase tracking-wider text-[#0A0A0A] hover:underline cursor-pointer"
          >
            + Add Routine
          </button>
        </div>

        {customWorkouts.length === 0 ? (
          <div className="border border-dashed border-[#E5E5E5] bg-[#FAFAFA] p-6 rounded-[2px] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[#0A0A0A]">
                No custom {environment.toLowerCase()} routines added yet
              </p>
              <p className="text-xs text-[#737373]">
                Create your own split day with custom sets, reps, and rest timers.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenCreateWorkout}
              className="px-3.5 py-2 border border-[#0A0A0A] bg-white hover:bg-[#0A0A0A] hover:text-white text-[#0A0A0A] text-xs font-semibold uppercase tracking-wider rounded-[2px] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Create Custom Workout
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {customWorkouts.map((workout) => {
              const isExpanded = Boolean(expandedKeys[workout.id]);
              return (
                <article
                  key={workout.id}
                  className="border border-[#0A0A0A] bg-white rounded-[2px] overflow-hidden"
                >
                  <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={() => toggleExpand(workout.id)}
                      className="text-left flex-1 space-y-1 cursor-pointer group"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[11px] uppercase tracking-wider text-[#737373]">
                          {workout.dayLabel}
                        </span>
                        <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 border border-[#0A0A0A] bg-white text-[#0A0A0A] rounded-[2px]">
                          Custom · {workout.environment}
                        </span>
                        {workout.isCompleted && (
                          <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 bg-[#0A0A0A] text-white rounded-[2px]">
                            Session Done
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-[#0A0A0A] group-hover:underline">
                        {workout.title}
                      </h3>
                      <p className="text-xs text-[#555555]">
                        Target: {workout.targetMuscles} ·{' '}
                        <span className="font-mono tabular-nums">
                          {workout.completedExerciseIds.length}/{workout.exercises.length} exercises
                        </span>
                      </p>
                    </button>

                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                      <button
                        type="button"
                        onClick={() => onToggleCustomComplete(workout)}
                        className={`px-3 py-1.5 border text-xs font-semibold rounded-[2px] transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                          workout.isCompleted
                            ? 'bg-[#0A0A0A] border-[#0A0A0A] text-white'
                            : 'bg-white border-[#E5E5E5] hover:border-[#0A0A0A] text-[#0A0A0A]'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{workout.isCompleted ? 'Completed' : 'Mark Complete'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onEditWorkout(workout)}
                        aria-label={`Edit ${workout.title}`}
                        className="p-2 border border-[#E5E5E5] hover:border-[#0A0A0A] bg-white text-[#0A0A0A] rounded-[2px] transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onRequestDeleteWorkout(workout)}
                        aria-label={`Delete ${workout.title}`}
                        className="p-2 border border-[#E5E5E5] hover:border-[#0A0A0A] bg-white text-[#0A0A0A] rounded-[2px] transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleExpand(workout.id)}
                        aria-label={isExpanded ? 'Collapse custom workout' : 'Expand custom workout'}
                        className="p-2 border border-[#E5E5E5] hover:border-[#0A0A0A] bg-[#FAFAFA] text-[#0A0A0A] rounded-[2px] transition-colors cursor-pointer"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {isExpanded &&
                    renderExerciseList(
                      workout.exercises,
                      workout.completedExerciseIds,
                      (exId) => onToggleCustomExercise(workout, exId)
                    )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
