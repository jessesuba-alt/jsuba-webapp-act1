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
import { FITNESS_LIMITS, getTodayIso } from '../utils/fitnessLimits';
import { loadCachedProfile, saveCachedProfile } from '../utils/localCache';
import type {
  FitnessGoal,
  FoodEnvironment,
  UserProfile,
  WorkoutEnvironment,
} from '../types';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  profile: UserProfile | null;
  isAuthReady: boolean;
  cloudSyncNotice: string | null;
  dismissCloudSyncNotice: () => void;
  setCloudSyncNotice: (msg: string | null) => void;
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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);
  const [cloudSyncNotice, setCloudSyncNotice] = useState<string | null>(null);
  const latestLocalUpdateRef = useRef<number>(0);

  const dismissCloudSyncNotice = useCallback(() => {
    setCloudSyncNotice(null);
  }, []);

  const syncProfileInBackground = useCallback((nextProfile: UserProfile) => {
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
    let unsubProfile: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      setFirebaseUser(user);
      if (user) {
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

        // Non-blocking initial cloud sync
        void (async () => {
          try {
            const synced = await upsertUserProfile({
              uid: user.uid,
              email,
              displayName,
              fallbackProfile: loadCachedProfile(user.uid) || initialProfile,
            });
            setProfile((current) => {
              // Never overwrite newer local user interaction (like clicking Enter Training Dashboard)
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
                if (current && current.updatedAt > data.updatedAt && latestLocalUpdateRef.current > data.updatedAt) {
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
  }, []);

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
      if (!firebaseUser) return;
      const now = Date.now();
      latestLocalUpdateRef.current = now;
      setProfile((prev) => {
        const base: UserProfile = prev || {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || 'Athlete',
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
          displayName: (prefs.displayName ?? base.displayName)
            .trim()
            .slice(0, FITNESS_LIMITS.DISPLAY_NAME_MAX) || base.displayName,
          updatedAt: now,
        };
        saveCachedProfile(next);
        syncProfileInBackground(next);
        return next;
      });
    },
    [firebaseUser, syncProfileInBackground]
  );

  const setWaterCups = useCallback(
    (cups: number) => {
      if (!firebaseUser) return;
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
    [firebaseUser, syncProfileInBackground]
  );

  const toggleDateLogged = useCallback(
    (isoDate: string) => {
      if (!firebaseUser) return;
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
    [firebaseUser, syncProfileInBackground]
  );

  const markTodayLogged = useCallback(() => {
    if (!firebaseUser) return;
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
  }, [firebaseUser, syncProfileInBackground]);

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        profile,
        isAuthReady,
        cloudSyncNotice,
        dismissCloudSyncNotice,
        setCloudSyncNotice,
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
