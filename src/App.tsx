/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthPage } from './pages/AuthPage';
import { Navbar } from './components/Navbar';
import { OnboardingView } from './components/OnboardingView';
import { EnvironmentBar } from './components/EnvironmentBar';
import { WorkoutTab } from './components/WorkoutTab';
import { DietTab } from './components/DietTab';
import { ProgressTab } from './components/ProgressTab';
import { PreferencesTab } from './components/PreferencesTab';
import { WorkoutModal } from './components/WorkoutModal';
import { MealModal } from './components/MealModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import {
  deleteMeal,
  deleteWorkout,
  saveCustomMeal,
  saveCustomWorkout,
  saveGuidedWorkoutProgress,
  subscribeToMeals,
  subscribeToWorkouts,
  toggleCustomMealCheck,
  toggleGuidedMealCheck,
  updateCustomWorkoutProgress,
} from './services/fitnessService';
import { getTodayIso } from './utils/fitnessLimits';
import {
  loadCachedMeals,
  loadCachedWorkouts,
  saveCachedMeals,
  saveCachedWorkouts,
} from './utils/localCache';
import type {
  ActiveTab,
  CustomMealInput,
  CustomWorkoutInput,
  FitnessGoal,
  FoodEnvironment,
  GuidedMealTemplate,
  GuidedWorkoutTemplate,
  MealEntry,
  WorkoutEnvironment,
  WorkoutRoutine,
} from './types';

function WorkspaceApp() {
  const {
    firebaseUser,
    activeUid,
    isDemoUser,
    demoResetNonce,
    profile,
    isAuthReady,
    cloudSyncNotice,
    dismissCloudSyncNotice,
    setCloudSyncNotice,
    logout,
    resetDemoData,
    exitDemoMode,
    setPreferences,
    setWaterCups,
    toggleDateLogged,
    markTodayLogged,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<ActiveTab>('workout');
  const [workouts, setWorkouts] = useState<WorkoutRoutine[]>([]);
  const [meals, setMeals] = useState<MealEntry[]>([]);

  // Modals
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<WorkoutRoutine | null>(null);
  const [isMealModalOpen, setIsMealModalOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<MealEntry | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'workout' | 'meal';
    id: string;
    title: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!activeUid) {
      setWorkouts([]);
      setMeals([]);
      return;
    }

    // Load instant local cache first (used exclusively in Demo Mode; also prevents UI flicker for Firebase users)
    setWorkouts(loadCachedWorkouts(activeUid));
    setMeals(loadCachedMeals(activeUid));

    // Bypass Firestore listeners completely in Demo Mode ($0 Firebase usage)
    if (isDemoUser || !firebaseUser) {
      return;
    }

    const unsubWorkouts = subscribeToWorkouts(
      firebaseUser.uid,
      (items) => {
        setWorkouts((prev) => {
          const map = new Map<string, WorkoutRoutine>();
          prev.forEach((w) => map.set(w.id, w));
          items.forEach((remote) => {
            const local = map.get(remote.id);
            if (!local || remote.updatedAt >= local.updatedAt) {
              map.set(remote.id, remote);
            }
          });
          const merged = Array.from(map.values()).sort(
            (a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)
          );
          saveCachedWorkouts(firebaseUser.uid, merged);
          return merged;
        });
      },
      (err) => {
        console.warn('Workout cloud listener notice:', err.message);
      }
    );

    const unsubMeals = subscribeToMeals(
      firebaseUser.uid,
      (items) => {
        setMeals((prev) => {
          const map = new Map<string, MealEntry>();
          prev.forEach((m) => map.set(m.id, m));
          items.forEach((remote) => {
            const local = map.get(remote.id);
            if (!local || remote.updatedAt >= local.updatedAt) {
              map.set(remote.id, remote);
            }
          });
          const merged = Array.from(map.values()).sort(
            (a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)
          );
          saveCachedMeals(firebaseUser.uid, merged);
          return merged;
        });
      },
      (err) => {
        console.warn('Meals cloud listener notice:', err.message);
      }
    );

    return () => {
      unsubWorkouts();
      unsubMeals();
    };
  }, [activeUid, isDemoUser, firebaseUser, demoResetNonce]);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-[#FFFFFF] flex items-center justify-center p-6">
        <div className="border border-[#E5E5E5] bg-[#FAFAFA] px-6 py-4 rounded-[2px] font-mono text-xs uppercase tracking-widest text-[#737373]">
          Initializing KINETIC FORM...
        </div>
      </div>
    );
  }

  if (!activeUid || !profile) {
    return <AuthPage />;
  }

  const runCloudTask = (task: () => Promise<unknown>, fallbackLabel: string) => {
    if (isDemoUser || !firebaseUser) return;
    void (async () => {
      try {
        await task();
      } catch (err) {
        console.warn(`${fallbackLabel} deferred:`, err);
        setCloudSyncNotice(
          'Saved locally on this device. Cloud sync paused — check your connection or Firebase rules.'
        );
      }
    })();
  };

  // Unified tab switch handler: works even if user was still on onboarding
  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    if (!profile.onboarded) {
      setPreferences({ onboarded: true });
    }
  };

  const handleCompleteOnboarding = (prefs: {
    goal: FitnessGoal;
    workoutEnv: WorkoutEnvironment;
    foodEnv: FoodEnvironment;
  }) => {
    setPreferences({ ...prefs, onboarded: true });
    setActiveTab('workout');
  };

  // Workout Handlers
  const handleToggleGuidedExercise = (
    template: GuidedWorkoutTemplate,
    existing: WorkoutRoutine | undefined,
    exerciseId: string
  ) => {
    const current = existing?.completedExerciseIds || [];
    const nextIds = current.includes(exerciseId)
      ? current.filter((id) => id !== exerciseId)
      : [...current, exerciseId];
    const allDone = nextIds.length >= template.exercises.length;
    const now = Date.now();
    const docId = existing?.id || `${activeUid}__w__${template.templateKey}`;

    const updatedRecord: WorkoutRoutine = existing
      ? {
          ...existing,
          completedExerciseIds: nextIds,
          isCompleted: allDone,
          lastCompletedDate: allDone ? getTodayIso() : existing.lastCompletedDate,
          updatedAt: now,
        }
      : {
          id: docId,
          ownerId: activeUid,
          templateKey: template.templateKey,
          title: template.title,
          dayLabel: template.dayLabel,
          environment: template.environment,
          targetMuscles: template.targetMuscles,
          exercises: template.exercises,
          completedExerciseIds: nextIds,
          isCompleted: allDone,
          isCustom: false,
          lastCompletedDate: allDone ? getTodayIso() : '',
          createdAt: now,
          updatedAt: now,
        };

    setWorkouts((prev) => {
      const next = prev.some((w) => w.id === docId)
        ? prev.map((w) => (w.id === docId ? updatedRecord : w))
        : [updatedRecord, ...prev];
      saveCachedWorkouts(activeUid, next);
      return next;
    });

    if (allDone) {
      markTodayLogged();
    }

    runCloudTask(
      () => saveGuidedWorkoutProgress(activeUid, template, existing, nextIds, allDone),
      'Workout exercise sync'
    );
  };

  const handleToggleGuidedComplete = (
    template: GuidedWorkoutTemplate,
    existing: WorkoutRoutine | undefined
  ) => {
    const nextComplete = !(existing?.isCompleted ?? false);
    const nextIds = nextComplete ? template.exercises.map((e) => e.id) : [];
    const now = Date.now();
    const docId = existing?.id || `${activeUid}__w__${template.templateKey}`;

    const updatedRecord: WorkoutRoutine = existing
      ? {
          ...existing,
          completedExerciseIds: nextIds,
          isCompleted: nextComplete,
          lastCompletedDate: nextComplete ? getTodayIso() : existing.lastCompletedDate,
          updatedAt: now,
        }
      : {
          id: docId,
          ownerId: activeUid,
          templateKey: template.templateKey,
          title: template.title,
          dayLabel: template.dayLabel,
          environment: template.environment,
          targetMuscles: template.targetMuscles,
          exercises: template.exercises,
          completedExerciseIds: nextIds,
          isCompleted: nextComplete,
          isCustom: false,
          lastCompletedDate: nextComplete ? getTodayIso() : '',
          createdAt: now,
          updatedAt: now,
        };

    setWorkouts((prev) => {
      const next = prev.some((w) => w.id === docId)
        ? prev.map((w) => (w.id === docId ? updatedRecord : w))
        : [updatedRecord, ...prev];
      saveCachedWorkouts(activeUid, next);
      return next;
    });

    if (nextComplete) {
      markTodayLogged();
    }

    runCloudTask(
      () => saveGuidedWorkoutProgress(activeUid, template, existing, nextIds, nextComplete),
      'Workout completion sync'
    );
  };

  const handleToggleCustomExercise = (workout: WorkoutRoutine, exerciseId: string) => {
    const current = workout.completedExerciseIds || [];
    const nextIds = current.includes(exerciseId)
      ? current.filter((id) => id !== exerciseId)
      : [...current, exerciseId];
    const allDone = workout.exercises.length > 0 && nextIds.length >= workout.exercises.length;
    const now = Date.now();

    const updated: WorkoutRoutine = {
      ...workout,
      completedExerciseIds: nextIds,
      isCompleted: allDone,
      lastCompletedDate: allDone ? getTodayIso() : workout.lastCompletedDate,
      updatedAt: now,
    };

    setWorkouts((prev) => {
      const next = prev.map((w) => (w.id === workout.id ? updated : w));
      saveCachedWorkouts(activeUid, next);
      return next;
    });

    if (allDone) {
      markTodayLogged();
    }

    runCloudTask(
      () => updateCustomWorkoutProgress(workout, nextIds, allDone),
      'Custom exercise sync'
    );
  };

  const handleToggleCustomComplete = (workout: WorkoutRoutine) => {
    const nextComplete = !workout.isCompleted;
    const nextIds = nextComplete ? workout.exercises.map((e) => e.id) : [];
    const now = Date.now();

    const updated: WorkoutRoutine = {
      ...workout,
      completedExerciseIds: nextIds,
      isCompleted: nextComplete,
      lastCompletedDate: nextComplete ? getTodayIso() : workout.lastCompletedDate,
      updatedAt: now,
    };

    setWorkouts((prev) => {
      const next = prev.map((w) => (w.id === workout.id ? updated : w));
      saveCachedWorkouts(activeUid, next);
      return next;
    });

    if (nextComplete) {
      markTodayLogged();
    }

    runCloudTask(
      () => updateCustomWorkoutProgress(workout, nextIds, nextComplete),
      'Custom workout sync'
    );
  };

  const handleSaveCustomWorkout = async (input: CustomWorkoutInput) => {
    const existingRecord = input.id ? workouts.find((w) => w.id === input.id) : undefined;
    const now = Date.now();
    const localId = existingRecord?.id || `local-w-${now}`;
    const optimistic: WorkoutRoutine = {
      id: localId,
      ownerId: activeUid,
      templateKey: '',
      title: input.title,
      dayLabel: input.dayLabel,
      environment: input.environment,
      targetMuscles: input.targetMuscles,
      exercises: input.exercises,
      completedExerciseIds: existingRecord?.completedExerciseIds || [],
      isCompleted: existingRecord?.isCompleted || false,
      isCustom: true,
      lastCompletedDate: existingRecord?.lastCompletedDate || '',
      createdAt: existingRecord?.createdAt || now,
      updatedAt: now,
    };

    setWorkouts((prev) => {
      const next = existingRecord
        ? prev.map((w) => (w.id === existingRecord.id ? optimistic : w))
        : [optimistic, ...prev];
      saveCachedWorkouts(activeUid, next);
      return next;
    });

    runCloudTask(async () => {
      const saved = await saveCustomWorkout(activeUid, input, existingRecord);
      setWorkouts((prev) => {
        const next = prev.map((w) => (w.id === localId ? saved : w));
        saveCachedWorkouts(activeUid, next);
        return next;
      });
    }, 'Save custom workout');
  };

  // Meal Handlers
  const handleToggleGuidedMeal = (
    template: GuidedMealTemplate,
    existing: MealEntry | undefined,
    checkedToday: boolean
  ) => {
    const now = Date.now();
    const docId = existing?.id || `${activeUid}__m__${template.templateKey}`;
    const checkedDate = checkedToday ? getTodayIso() : '';

    const updatedRecord: MealEntry = existing
      ? {
          ...existing,
          checkedDate,
          updatedAt: now,
        }
      : {
          id: docId,
          ownerId: activeUid,
          templateKey: template.templateKey,
          title: template.title,
          slot: template.slot,
          foodEnv: template.foodEnv,
          goal: template.goal,
          calories: template.calories,
          protein: template.protein,
          carbs: template.carbs,
          fat: template.fat,
          prepNotes: template.prepNotes,
          checkedDate,
          isCustom: false,
          createdAt: now,
          updatedAt: now,
        };

    setMeals((prev) => {
      const next = prev.some((m) => m.id === docId)
        ? prev.map((m) => (m.id === docId ? updatedRecord : m))
        : [updatedRecord, ...prev];
      saveCachedMeals(activeUid, next);
      return next;
    });

    runCloudTask(
      () => toggleGuidedMealCheck(activeUid, template, existing, checkedToday),
      'Meal check sync'
    );
  };

  const handleToggleCustomMeal = (meal: MealEntry, checkedToday: boolean) => {
    const updated: MealEntry = {
      ...meal,
      checkedDate: checkedToday ? getTodayIso() : '',
      updatedAt: Date.now(),
    };

    setMeals((prev) => {
      const next = prev.map((m) => (m.id === meal.id ? updated : m));
      saveCachedMeals(activeUid, next);
      return next;
    });

    runCloudTask(() => toggleCustomMealCheck(meal, checkedToday), 'Custom meal check sync');
  };

  const handleSaveCustomMeal = async (input: CustomMealInput) => {
    const existingRecord = input.id ? meals.find((m) => m.id === input.id) : undefined;
    const now = Date.now();
    const localId = existingRecord?.id || `local-m-${now}`;
    const optimistic: MealEntry = {
      id: localId,
      ownerId: activeUid,
      templateKey: '',
      title: input.title,
      slot: input.slot,
      foodEnv: input.foodEnv,
      goal: input.goal,
      calories: input.calories,
      protein: input.protein,
      carbs: input.carbs,
      fat: input.fat,
      prepNotes: input.prepNotes,
      checkedDate: existingRecord?.checkedDate || '',
      isCustom: true,
      createdAt: existingRecord?.createdAt || now,
      updatedAt: now,
    };

    setMeals((prev) => {
      const next = existingRecord
        ? prev.map((m) => (m.id === existingRecord.id ? optimistic : m))
        : [optimistic, ...prev];
      saveCachedMeals(activeUid, next);
      return next;
    });

    runCloudTask(async () => {
      const saved = await saveCustomMeal(activeUid, input, existingRecord);
      setMeals((prev) => {
        const next = prev.map((m) => (m.id === localId ? saved : m));
        saveCachedMeals(activeUid, next);
        return next;
      });
    }, 'Save custom meal');
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const target = deleteTarget;

    if (target.type === 'workout') {
      setWorkouts((prev) => {
        const next = prev.filter((w) => w.id !== target.id);
        saveCachedWorkouts(activeUid, next);
        return next;
      });
      if (!target.id.startsWith('local-w-') && !target.id.startsWith('demo-')) {
        runCloudTask(() => deleteWorkout(target.id), 'Delete workout');
      }
    } else {
      setMeals((prev) => {
        const next = prev.filter((m) => m.id !== target.id);
        saveCachedMeals(activeUid, next);
        return next;
      });
      if (!target.id.startsWith('local-m-') && !target.id.startsWith('demo-')) {
        runCloudTask(() => deleteMeal(target.id), 'Delete meal');
      }
    }

    setIsDeleting(false);
    setDeleteTarget(null);
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#0A0A0A] flex flex-col">
      <Navbar
        profile={profile}
        activeTab={activeTab}
        isDemoUser={isDemoUser}
        onChangeTab={handleSelectTab}
        onLogout={logout}
        onResetDemo={() => {
          resetDemoData();
        }}
        onExitDemo={() => {
          exitDemoMode();
          setActiveTab('workout');
        }}
      />

      {!profile.onboarded ? (
        <main className="flex-1">
          <OnboardingView
            initialGoal={profile.goal}
            initialWorkoutEnv={profile.workoutEnv}
            initialFoodEnv={profile.foodEnv}
            displayName={profile.displayName}
            onComplete={handleCompleteOnboarding}
          />
        </main>
      ) : (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
          <EnvironmentBar profile={profile} onUpdatePrefs={setPreferences} />

          {cloudSyncNotice && !isDemoUser && (
            <div
              role="status"
              className="border border-[#E5E5E5] bg-[#FAFAFA] px-4 py-2.5 rounded-[2px] flex items-center justify-between gap-4"
            >
              <p className="text-xs text-[#555555]">{cloudSyncNotice}</p>
              <button
                type="button"
                onClick={dismissCloudSyncNotice}
                className="font-mono text-[11px] uppercase tracking-wider text-[#0A0A0A] underline shrink-0 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {activeTab === 'workout' && (
            <WorkoutTab
              environment={profile.workoutEnv}
              workouts={workouts}
              onToggleGuidedExercise={handleToggleGuidedExercise}
              onToggleGuidedComplete={handleToggleGuidedComplete}
              onToggleCustomExercise={handleToggleCustomExercise}
              onToggleCustomComplete={handleToggleCustomComplete}
              onOpenCreateWorkout={() => {
                setEditingWorkout(null);
                setIsWorkoutModalOpen(true);
              }}
              onEditWorkout={(w) => {
                setEditingWorkout(w);
                setIsWorkoutModalOpen(true);
              }}
              onRequestDeleteWorkout={(w) =>
                setDeleteTarget({ type: 'workout', id: w.id, title: w.title })
              }
            />
          )}

          {activeTab === 'diet' && (
            <DietTab
              goal={profile.goal}
              foodEnv={profile.foodEnv}
              meals={meals}
              waterCupsToday={profile.waterCupsToday}
              onUpdateWaterCups={setWaterCups}
              onToggleGuidedMeal={handleToggleGuidedMeal}
              onToggleCustomMeal={handleToggleCustomMeal}
              onOpenCreateMeal={() => {
                setEditingMeal(null);
                setIsMealModalOpen(true);
              }}
              onEditMeal={(m) => {
                setEditingMeal(m);
                setIsMealModalOpen(true);
              }}
              onRequestDeleteMeal={(m) =>
                setDeleteTarget({ type: 'meal', id: m.id, title: m.title })
              }
            />
          )}

          {activeTab === 'progress' && (
            <ProgressTab
              profile={profile}
              workouts={workouts}
              meals={meals}
              onToggleDateLogged={toggleDateLogged}
              onOpenCreateWorkout={() => {
                setEditingWorkout(null);
                setIsWorkoutModalOpen(true);
              }}
              onEditWorkout={(w) => {
                setEditingWorkout(w);
                setIsWorkoutModalOpen(true);
              }}
              onRequestDeleteWorkout={(w) =>
                setDeleteTarget({ type: 'workout', id: w.id, title: w.title })
              }
              onOpenCreateMeal={() => {
                setEditingMeal(null);
                setIsMealModalOpen(true);
              }}
              onEditMeal={(m) => {
                setEditingMeal(m);
                setIsMealModalOpen(true);
              }}
              onRequestDeleteMeal={(m) =>
                setDeleteTarget({ type: 'meal', id: m.id, title: m.title })
              }
              onOpenPreferences={() => setActiveTab('settings')}
            />
          )}

          {activeTab === 'settings' && (
            <PreferencesTab
              profile={profile}
              onUpdatePrefs={setPreferences}
              onOpenSetupWizard={() => setPreferences({ onboarded: false })}
            />
          )}
        </main>
      )}

      <WorkoutModal
        isOpen={isWorkoutModalOpen}
        defaultEnvironment={profile.workoutEnv}
        editingWorkout={editingWorkout}
        onClose={() => {
          setIsWorkoutModalOpen(false);
          setEditingWorkout(null);
        }}
        onSave={handleSaveCustomWorkout}
      />

      <MealModal
        isOpen={isMealModalOpen}
        defaultGoal={profile.goal}
        defaultFoodEnv={profile.foodEnv}
        editingMeal={editingMeal}
        onClose={() => {
          setIsMealModalOpen(false);
          setEditingMeal(null);
        }}
        onSave={handleSaveCustomMeal}
      />

      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        itemType={deleteTarget?.type || 'workout'}
        title={deleteTarget?.title || ''}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          if (!isDeleting) setDeleteTarget(null);
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <WorkspaceApp />
    </AuthProvider>
  );
}
