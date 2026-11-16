import React, { useState } from 'react';
import { ArrowRight, Dumbbell, Loader2, Utensils, CalendarCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthPage: React.FC = () => {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please enter both your email address and password.');
      return;
    }
    if (mode === 'signup' && password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    const res =
      mode === 'signin'
        ? await signInWithEmail(email, password)
        : await signUpWithEmail(email, password, displayName);

    if (!res.success) {
      setError(res.error || 'Authentication failed.');
    }
    setIsSubmitting(false);
  };

  const handleGoogle = async () => {
    setError(null);
    setIsSubmitting(true);
    const res = await signInWithGoogle();
    if (!res.success) {
      setError(res.error || 'Google sign-in failed.');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#0A0A0A] flex flex-col">
      {/* Top Minimal Brand Strip */}
      <header className="border-b border-[#E5E5E5]">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-[#0A0A0A] text-white flex items-center justify-center rounded-[2px] font-mono text-xs font-semibold">
              KF
            </div>
            <div className="flex items-baseline gap-2.5">
              <span className="text-base font-bold tracking-tight uppercase">KINETIC FORM</span>
              <span className="hidden sm:inline font-mono text-[11px] uppercase tracking-wider text-[#737373]">
                Training &amp; Nutrition Logbook
              </span>
            </div>
          </div>
          <span className="font-mono text-[11px] uppercase tracking-wider text-[#737373]">
            Personal Planner
          </span>
        </div>
      </header>

      {/* Main Split Editorial Layout */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-12 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        {/* Left Editorial Overview */}
        <section className="lg:col-span-7 space-y-8">
          <div className="space-y-4">
            <p className="font-mono text-xs uppercase tracking-widest text-[#737373]">
              Structured Fitness System
            </p>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#0A0A0A] leading-[1.08]">
              Train anywhere. Fuel with clarity.
            </h1>
            <p className="text-base sm:text-lg text-[#555555] max-w-xl leading-relaxed">
              A focused training and diet guide built for real-world schedules. Toggle seamlessly
              between Home Bodyweight and Commercial Gym splits, or Home-Cooked meal prep and
              On-the-Go food swaps.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="border border-[#E5E5E5] bg-[#FAFAFA] p-4 rounded-[2px] space-y-2">
              <Dumbbell className="w-4 h-4 text-[#0A0A0A]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#0A0A0A]">
                Adaptive Splits
              </h2>
              <p className="text-xs text-[#555555] leading-relaxed">
                Home bodyweight or commercial gym machine guides with beginner form cues and rest timers.
              </p>
            </div>
            <div className="border border-[#E5E5E5] bg-[#FAFAFA] p-4 rounded-[2px] space-y-2">
              <Utensils className="w-4 h-4 text-[#0A0A0A]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#0A0A0A]">
                Goal-Matched Diet
              </h2>
              <p className="text-xs text-[#555555] leading-relaxed">
                Macro breakdowns for Weight Loss, Muscle Gain, or General Fitness across kitchen or dorm setups.
              </p>
            </div>
            <div className="border border-[#E5E5E5] bg-[#FAFAFA] p-4 rounded-[2px] space-y-2">
              <CalendarCheck className="w-4 h-4 text-[#0A0A0A]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#0A0A0A]">
                Streak &amp; Custom Log
              </h2>
              <p className="text-xs text-[#555555] leading-relaxed">
                Check off sets, track water intake, save custom routines, and build a weekly streak.
              </p>
            </div>
          </div>
        </section>

        {/* Right Auth Panel */}
        <section className="lg:col-span-5">
          <div className="border border-[#0A0A0A] bg-[#FFFFFF] p-6 sm:p-8 rounded-[2px] space-y-6">
            {/* Mode Tabs */}
            <div className="grid grid-cols-2 border border-[#E5E5E5] bg-[#FAFAFA] p-1 rounded-[2px]">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setError(null);
                }}
                className={`py-2 text-xs font-semibold uppercase tracking-wider rounded-[2px] transition-colors cursor-pointer ${
                  mode === 'signin'
                    ? 'bg-[#0A0A0A] text-white'
                    : 'text-[#555555] hover:text-[#0A0A0A]'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError(null);
                }}
                className={`py-2 text-xs font-semibold uppercase tracking-wider rounded-[2px] transition-colors cursor-pointer ${
                  mode === 'signup'
                    ? 'bg-[#0A0A0A] text-white'
                    : 'text-[#555555] hover:text-[#0A0A0A]'
                }`}
              >
                Create Account
              </button>
            </div>

            <div>
              <h2 className="text-xl font-bold tracking-tight text-[#0A0A0A]">
                {mode === 'signin' ? 'Welcome back' : 'Start your training log'}
              </h2>
              <p className="text-xs text-[#737373] mt-1">
                {mode === 'signin'
                  ? 'Sign in to access your training split, daily diet schedule, and streak.'
                  : 'Create a free personal account to save preferences, workouts, and meals.'}
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="border border-[#0A0A0A] bg-[#FAFAFA] px-3.5 py-2.5 text-xs text-[#0A0A0A] rounded-[2px]"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div className="space-y-1.5">
                  <label
                    htmlFor="auth-name"
                    className="block font-mono text-[11px] uppercase tracking-wider text-[#555555]"
                  >
                    Name
                  </label>
                  <input
                    id="auth-name"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Alex Rivera"
                    maxLength={100}
                    className="w-full px-3 py-2.5 border border-[#E5E5E5] focus:border-[#0A0A0A] focus:outline-none text-sm bg-white rounded-[2px]"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label
                  htmlFor="auth-email"
                  className="block font-mono text-[11px] uppercase tracking-wider text-[#555555]"
                >
                  Email Address
                </label>
                <input
                  id="auth-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3 py-2.5 border border-[#E5E5E5] focus:border-[#0A0A0A] focus:outline-none text-sm bg-white rounded-[2px]"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="auth-password"
                  className="block font-mono text-[11px] uppercase tracking-wider text-[#555555]"
                >
                  Password
                </label>
                <input
                  id="auth-password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3 py-2.5 border border-[#E5E5E5] focus:border-[#0A0A0A] focus:outline-none text-sm bg-white rounded-[2px]"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-[#0A0A0A] hover:bg-[#262626] text-white text-xs font-semibold uppercase tracking-wider rounded-[2px] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Please wait...</span>
                  </>
                ) : (
                  <>
                    <span>{mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-[#E5E5E5] w-full" />
              <span className="bg-white px-3 font-mono text-[10px] uppercase tracking-widest text-[#737373]">
                OR
              </span>
              <div className="border-t border-[#E5E5E5] w-full" />
            </div>

            <button
              type="button"
              onClick={handleGoogle}
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 border border-[#E5E5E5] hover:border-[#0A0A0A] bg-white text-[#0A0A0A] text-xs font-semibold uppercase tracking-wider rounded-[2px] transition-colors flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81Z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};
