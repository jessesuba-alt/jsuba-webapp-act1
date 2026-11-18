import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';
import { syncUserProfileDocument, upsertUserProfile } from '../services/fitnessService';
import { createDemoSeedData, DEMO_UID } from '../data/demoSeedData';
import { FITNESS_LIMITS, getTodayIso } from '../utils/fitnessLimits';
import {
  clearCachedUserData,
  isDemoSessionStored,
  loadCachedMeals,
  loadCachedProfile,
  loadCachedWorkouts,
  saveCachedMeals,
  saveCachedProfile,
  saveCachedWorkouts,
  setDemoSessionStored,
} from '../utils/localCache';
import type {
  FitnessGoal,
  FoodEnvironment,
  UserProfile,
  WorkoutEnvironment,
} from '../types';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  activeUid: string | null;
  isDemoUser: boolean;
  demoResetNonce: number;
  profile: UserProfile | null;
  isAuthReady: boolean;
  cloudSyncNotice: string | null;
  dismissCloudSyncNotice: () => void;
  setCloudSyncNotice: (msg: string | null) => void;
  enterDemoMode: () => void;
  resetDemoData: () => void;
  exitDemoMode: () => void;
  signInWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  setPreferences: (
    prefs: Partial<{
      displayName: string;
      goal: FitnessGoal;
      workoutEnv: WorkoutEnvironment;
      foodEnv: FoodEnvironment;
      onboarded: boolean;
    }>
  ) => void;
  setWaterCups: (cups: number) => void;
  toggleDateLogged: (isoDate: string) => void;
  markTodayLogged: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapAuthError(err: unknown): string {
  if (err instanceof FirebaseError) {
    switch (err.code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Invalid email or password. Please check your credentials and try again.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists. Try signing in instead.';
      case 'auth/weak-password':
        return 'Password must be at least 6 characters long.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/operation-not-allowed':
        return 'Email/Password sign-in is not yet enabled in your Firebase Console (Authentication → Sign-in method).';
      case 'auth/popup-closed-by-user':
        return 'Google sign-in popup was closed before completion.';
      case 'auth/popup-blocked':
        return 'Sign-in popup was blocked by your browser. Please allow popups for this site.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please wait a moment and try again.';
      default:
        return err.message || 'Authentication failed. Please try again.';
    }
  }
  return err instanceof Error ? err.message : 'An unexpected error occurred.';
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isDemoUser, setIsDemoUser] = useState<boolean>(() => isDemoSessionStored());
  const [demoResetNonce, setDemoResetNonce] = useState<number>(0);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);
  const [cloudSyncNotice, setCloudSyncNotice] = useState<string | null>(null);
  const latestLocalUpdateRef = useRef<number>(0);
  const isDemoRef = useRef<boolean>(isDemoUser);

  useEffect(() => {
    isDemoRef.current = isDemoUser;
  }, [isDemoUser]);

  const activeUid = isDemoUser ? DEMO_UID : firebaseUser?.uid ?? null;

  const dismissCloudSyncNotice = useCallback(() => {
    setCloudSyncNotice(null);
  }, []);

  const hydrateDemoSession = useCallback((forceFresh = false) => {
    setDemoSessionStored(true);
    setIsDemoUser(true);
    setCloudSyncNotice(null);

    if (!forceFresh) {
      const existingProfile = loadCachedProfile(DEMO_UID);
      const existingWorkouts = loadCachedWorkouts(DEMO_UID);
      const existingMeals = loadCachedMeals(DEMO_UID);
      if (existingProfile && (existingWorkouts.length > 0 || existingMeals.length > 0)) {
        const today = getTodayIso();
        const syncedProfile: UserProfile = {
          ...existingProfile,
          waterCupsToday:
            existingProfile.lastWaterDate === today ? existingProfile.waterCupsToday : 0,
          lastWaterDate: today,
        };
        saveCachedProfile(syncedProfile);
        setProfile(syncedProfile);
        setIsAuthReady(true);
        return;
      }
    }

    const seed = createDemoSeedData();
    saveCachedProfile(seed.profile);
    saveCachedWorkouts(DEMO_UID, seed.workouts);
    saveCachedMeals(DEMO_UID, seed.meals);
    setProfile(seed.profile);
    setDemoResetNonce((n) => n + 1);
    setIsAuthReady(true);
  }, []);

  const enterDemoMode = useCallback(() => {
    hydrateDemoSession(false);
  }, [hydrateDemoSession]);

  const resetDemoData = useCallback(() => {
    clearCachedUserData(DEMO_UID);
    hydrateDemoSession(true);
  }, [hydrateDemoSession]);

  const exitDemoMode = useCallback(() => {
    setDemoSessionStored(false);
    setIsDemoUser(false);
    setProfile(null);
    setCloudSyncNotice(null);
  }, []);

  const syncProfileInBackground = useCallback((nextProfile: UserProfile) => {
    if (isDemoRef.current || nextProfile.uid === DEMO_UID) {
      return;
    }
    void (async () => {
      try {
        await syncUserProfileDocument(nextProfile);
        setCloudSyncNotice(null);
      } catch (err) {
        console.warn('Background Firestore profile sync deferred:', err);
        setCloudSyncNotice(
          'Saved locally on this device. Cloud sync paused — check your connection or Firebase permissions.'
        );
      }
    })();
  }, []);

  useEffect(() => {
    // If visitor refreshed while inside Demo Mode, restore locally with zero Firebase reads/writes
    if (isDemoSessionStored()) {
      hydrateDemoSession(false);
    }

    let unsubProfile: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      setFirebaseUser(user);

      // Keep local Demo Mode active if user explicitly entered Demo Mode and isn't signed into Firebase
      if (!user && isDemoRef.current) {
        setIsAuthReady(true);
        return;
      }

      if (user) {
        // Real Firebase Auth takes precedence over Demo Mode
        setDemoSessionStored(false);
        setIsDemoUser(false);

        const email = user.email || '';
        const displayName = user.displayName || email.split('@')[0] || 'Athlete';
        const now = Date.now();
        const today = getTodayIso();
        const cached = loadCachedProfile(user.uid);

        const initialProfile: UserProfile = cached
          ? {
              ...cached,
              email: email || cached.email,
              waterCupsToday: cached.lastWaterDate === today ? cached.waterCupsToday : 0,
              lastWaterDate: today,
            }
          : {
              uid: user.uid,
              email,
              displayName,
              goal: 'General Fitness',
              workoutEnv: 'Home',
              foodEnv: 'Home-Cooked',
              onboarded: false,
              waterCupsToday: 0,
              lastWaterDate: today,
              completedDates: [],
              createdAt: now,
              updatedAt: now,
            };

        saveCachedProfile(initialProfile);
        setProfile(initialProfile);
        setIsAuthReady(true);

        void (async () => {
          try {
            const synced = await upsertUserProfile({
              uid: user.uid,
              email,
              displayName,
              fallbackProfile: loadCachedProfile(user.uid) || initialProfile,
            });
            setProfile((current) => {
              if (current && current.updatedAt > synced.updatedAt) {
                return current;
              }
              const merged: UserProfile = {
                ...synced,
                onboarded: Boolean(synced.onboarded || current?.onboarded),
              };
              saveCachedProfile(merged);
              return merged;
            });
          } catch (err) {
            console.warn('Initial profile sync deferred:', err);
          }
        })();

        unsubProfile = onSnapshot(
          doc(db, 'users', user.uid),
          (snap) => {
            if (snap.exists()) {
              const data = snap.data() as UserProfile;
              const resetWater = data.lastWaterDate !== getTodayIso();
              setProfile((current) => {
                if (
                  current &&
                  current.updatedAt > data.updatedAt &&
                  latestLocalUpdateRef.current > data.updatedAt
                ) {
                  return current;
                }
                const next: UserProfile = {
                  ...data,
                  onboarded: Boolean(data.onboarded || current?.onboarded),
                  waterCupsToday: resetWater ? 0 : data.waterCupsToday,
                  lastWaterDate: resetWater ? getTodayIso() : data.lastWaterDate,
                };
                saveCachedProfile(next);
                return next;
              });
            }
          },
          (err) => {
            console.warn('Profile snapshot error:', err);
          }
        );
      } else {
        setProfile(null);
        setCloudSyncNotice(null);
        setIsAuthReady(true);
      }
    });

    return () => {
      unsubAuth();
      if (unsubProfile) unsubProfile();
    };
  }, [hydrateDemoSession]);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      return { success: true };
    } catch (err) {
      return { success: false, error: mapAuthError(err) };
    }
  };

  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const cleanName = displayName.trim() || email.split('@')[0] || 'Athlete';
      await updateProfile(cred.user, { displayName: cleanName });
      const now = Date.now();
      const freshProfile: UserProfile = {
        uid: cred.user.uid,
        email: cred.user.email || email.trim(),
        displayName: cleanName,
        goal: 'General Fitness',
        workoutEnv: 'Home',
        foodEnv: 'Home-Cooked',
        onboarded: false,
        waterCupsToday: 0,
        lastWaterDate: getTodayIso(),
        completedDates: [],
        createdAt: now,
        updatedAt: now,
      };
      saveCachedProfile(freshProfile);
      setProfile(freshProfile);
      syncProfileInBackground(freshProfile);
      return { success: true };
    } catch (err) {
      return { success: false, error: mapAuthError(err) };
    }
  };

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      return { success: true };
    } catch (err) {
      return { success: false, error: mapAuthError(err) };
    }
  };

  const logout = async () => {
    if (isDemoUser) {
      exitDemoMode();
      return;
    }
    await signOut(auth);
  };

  const setPreferences = useCallback(
    (
      prefs: Partial<{
        displayName: string;
        goal: FitnessGoal;
        workoutEnv: WorkoutEnvironment;
        foodEnv: FoodEnvironment;
        onboarded: boolean;
      }>
    ) => {
      if (!activeUid) return;
      const now = Date.now();
      latestLocalUpdateRef.current = now;
      setProfile((prev) => {
        const base: UserProfile = prev || {
          uid: activeUid,
          email: isDemoUser ? 'demo@kineticform.local' : firebaseUser?.email || '',
          displayName: isDemoUser
            ? 'Alex Mercer (Demo)'
            : firebaseUser?.displayName || 'Athlete',
          goal: 'General Fitness',
          workoutEnv: 'Home',
          foodEnv: 'Home-Cooked',
          onboarded: false,
          waterCupsToday: 0,
          lastWaterDate: getTodayIso(),
          completedDates: [],
          createdAt: now,
          updatedAt: now,
        };
        const next: UserProfile = {
          ...base,
          ...prefs,
          displayName:
            (prefs.displayName ?? base.displayName)
              .trim()
              .slice(0, FITNESS_LIMITS.DISPLAY_NAME_MAX) || base.displayName,
          updatedAt: now,
        };
        saveCachedProfile(next);
        syncProfileInBackground(next);
        return next;
      });
    },
    [activeUid, isDemoUser, firebaseUser, syncProfileInBackground]
  );

  const setWaterCups = useCallback(
    (cups: number) => {
      if (!activeUid) return;
      const clamped = Math.max(0, Math.min(FITNESS_LIMITS.WATER_CUPS_MAX, cups));
      const now = Date.now();
      latestLocalUpdateRef.current = now;
      setProfile((prev) => {
        if (!prev) return prev;
        const next: UserProfile = {
          ...prev,
          waterCupsToday: clamped,
          lastWaterDate: getTodayIso(),
          updatedAt: now,
        };
        saveCachedProfile(next);
        syncProfileInBackground(next);
        return next;
      });
    },
    [activeUid, syncProfileInBackground]
  );

  const toggleDateLogged = useCallback(
    (isoDate: string) => {
      if (!activeUid) return;
      const now = Date.now();
      latestLocalUpdateRef.current = now;
      setProfile((prev) => {
        if (!prev) return prev;
        const exists = prev.completedDates.includes(isoDate);
        const nextDates = exists
          ? prev.completedDates.filter((d) => d !== isoDate)
          : [...prev.completedDates, isoDate];
        const next: UserProfile = {
          ...prev,
          completedDates: Array.from(new Set(nextDates))
            .sort()
            .slice(-FITNESS_LIMITS.COMPLETED_DATES_MAX),
          updatedAt: now,
        };
        saveCachedProfile(next);
        syncProfileInBackground(next);
        return next;
      });
    },
    [activeUid, syncProfileInBackground]
  );

  const markTodayLogged = useCallback(() => {
    if (!activeUid) return;
    const today = getTodayIso();
    const now = Date.now();
    latestLocalUpdateRef.current = now;
    setProfile((prev) => {
      if (!prev || prev.completedDates.includes(today)) return prev;
      const next: UserProfile = {
        ...prev,
        completedDates: [...prev.completedDates, today]
          .sort()
          .slice(-FITNESS_LIMITS.COMPLETED_DATES_MAX),
        updatedAt: now,
      };
      saveCachedProfile(next);
      syncProfileInBackground(next);
      return next;
    });
  }, [activeUid, syncProfileInBackground]);

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        activeUid,
        isDemoUser,
        demoResetNonce,
        profile,
        isAuthReady,
        cloudSyncNotice,
        dismissCloudSyncNotice,
        setCloudSyncNotice,
        enterDemoMode,
        resetDemoData,
        exitDemoMode,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        logout,
        setPreferences,
        setWaterCups,
        toggleDateLogged,
        markTodayLogged,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
