import React, { useState } from 'react';
import { FolderLock, ShieldCheck, ArrowRight, Lock, Mail, User, Building, Zap, CheckCircle2, Radio } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthPage: React.FC = () => {
  const { login, register, quickLogin } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'freelancer' | 'client'>('freelancer');
  const [company, setCompany] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (mode === 'signin') {
      const res = await login(email, password);
      if (!res.success) {
        setError(res.error || 'Failed to authenticate. Please verify email and password.');
      }
    } else {
      if (!name.trim()) {
        setError('Please enter your full name.');
        setIsLoading(false);
        return;
      }
      const res = await register({
        email,
        password,
        name,
        role,
        company
      });
      if (!res.success) {
        setError(res.error || 'Failed to initialize account.');
      }
    }

    setIsLoading(false);
  };

  const handleDemoSignIn = async (userRole: 'freelancer' | 'client') => {
    setError(null);
    setIsLoading(true);
    await quickLogin(userRole);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[#050507] cyber-grid relative overflow-hidden text-white">
      {/* Ambient Monochromatic Silver Atmosphere */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-white/[0.05] rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-white/[0.04] rounded-full blur-[140px] pointer-events-none" />

      {/* Cyber Grid Box */}
      <div className="relative w-full max-w-5xl rounded-3xl cyber-panel overflow-hidden shadow-[0_0_60px_rgba(255,255,255,0.08)] border border-white/20 grid grid-cols-1 lg:grid-cols-12">
        {/* Left Visual & Value Proposition Column (5 cols) */}
        <div className="lg:col-span-5 bg-gradient-to-b from-zinc-950 via-zinc-900 to-black p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-white/15">
          {/* Backdrop Monochromatic Image */}
          <div className="absolute inset-0 opacity-45 mix-blend-screen pointer-events-none">
            <img
              src="/src/assets/images/suvault_monochrome_vault_1794476735044.jpg"
              alt="SuVault Monochromatic Cyber Vault"
              className="w-full h-full object-cover grayscale"
            />
          </div>

          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-tr from-zinc-800 to-white p-0.5 border border-white shadow-[0_0_15px_rgba(255,255,255,0.4)]">
                <div className="w-full h-full rounded-[14px] bg-black flex items-center justify-center">
                  <FolderLock className="w-6 h-6 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-cyber text-2xl font-black tracking-widest text-white neon-glow-silver">
                    SuVault
                  </h1>
                  <span className="text-[9px] font-mono tracking-widest px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-white/30">
                    2000
                  </span>
                </div>
                <p className="text-xs font-mono text-zinc-400 tracking-wide flex items-center gap-1.5 mt-0.5">
                  <Radio className="w-3 h-3 text-white animate-pulse" />
                  CLIENT VAULT CORE
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-4">
              <h2 className="font-cyber text-lg sm:text-xl font-bold text-white leading-snug">
                MONOCHROMATIC FILE VAULT FOR CREATIVES & CLIENTS.
              </h2>
              <p className="text-xs font-mono text-zinc-300 leading-relaxed">
                Seamless client deliverable transfers, isolated vault partitions, and lightning-fast file management without third-party cloud storage bloat.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="space-y-3 pt-2 text-xs font-mono text-zinc-200">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                <span>Zero-Trust isolated encrypted client partitions</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                <span>Dedicated client upload links with instant access</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                <span>Independent high-speed server disk storage</span>
              </div>
            </div>
          </div>

          {/* Bottom Security Note */}
          <div className="relative z-10 pt-8 mt-6 border-t border-white/10 flex items-center gap-2 text-xs font-mono text-zinc-400">
            <ShieldCheck className="w-4 h-4 text-white shrink-0" />
            <span>256-BIT ENCRYPTION // NO THIRD-PARTY LOGS</span>
          </div>
        </div>

        {/* Right Form Column (7 cols) */}
        <div className="lg:col-span-7 p-8 sm:p-12 bg-black/90 backdrop-blur-2xl flex flex-col justify-center space-y-6">
          {/* Segmented Mode Switcher */}
          <div className="flex p-1 bg-zinc-900 rounded-xl border border-white/20 max-w-xs mx-auto w-full">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
              }}
              className={`flex-1 py-2 font-tech text-xs font-bold tracking-wider uppercase rounded-lg transition-all cursor-pointer ${
                mode === 'signin'
                  ? 'bg-white text-black font-bold shadow-[0_0_12px_rgba(255,255,255,0.4)]'
                  : 'text-zinc-400 hover:text-white'
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
              className={`flex-1 py-2 font-tech text-xs font-bold tracking-wider uppercase rounded-lg transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-white text-black font-bold shadow-[0_0_12px_rgba(255,255,255,0.4)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          <div className="text-center space-y-1">
            <h2 className="font-cyber text-lg sm:text-xl font-bold text-white neon-glow-silver">
              {mode === 'signin' ? 'ENTER SUVAULT PORTAL' : 'INITIALIZE NEW VAULT'}
            </h2>
            <p className="text-xs font-mono text-zinc-400">
              {mode === 'signin'
                ? 'Sign in to access your client deliverables and vault files'
                : 'Configure credentials to unlock private cyber file sharing'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto w-full font-mono">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    FULL NAME
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Alex Morgan"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-900 border border-white/20 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-white focus:shadow-[0_0_12px_rgba(255,255,255,0.2)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      USER ROLE
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as any)}
                      className="w-full py-2 px-2.5 text-xs bg-zinc-900 border border-white/20 rounded-xl text-white focus:outline-none focus:border-white"
                    >
                      <option value="freelancer">Freelancer / Designer</option>
                      <option value="client">Client</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      STUDIO / COMPANY
                    </label>
                    <div className="relative">
                      <Building className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="Cyber Studio"
                        className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-900 border border-white/20 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-white"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                EMAIL ADDRESS
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="designer@suvault.com"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-900 border border-white/20 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-white focus:shadow-[0_0_12px_rgba(255,255,255,0.2)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                PASSWORD
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-900 border border-white/20 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-white focus:shadow-[0_0_12px_rgba(255,255,255,0.2)]"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-zinc-900 border border-white/30 rounded-xl text-xs text-white">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 chrome-btn font-cyber font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{mode === 'signin' ? 'Sign In to SuVault' : 'Initialize Account'}</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          </form>

          {/* Quick Demo Logins Section */}
          <div className="max-w-md mx-auto w-full pt-4 border-t border-zinc-900 text-center space-y-2.5">
            <p className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase">
              // ONE-CLICK DEMO AUTHENTICATION
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoSignIn('freelancer')}
                disabled={isLoading}
                className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-white/20 hover:border-white/50 rounded-xl text-xs font-mono text-white transition-all text-left flex items-center gap-2 cursor-pointer group"
              >
                <div className="w-7 h-7 rounded-lg bg-black border border-white/40 text-white flex items-center justify-center font-bold text-[10px] shrink-0 group-hover:scale-105 transition-transform">
                  AM
                </div>
                <div className="truncate">
                  <span className="block font-tech font-bold text-white truncate">Alex Morgan</span>
                  <span className="text-[10px] text-zinc-400 block truncate">Designer Account</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoSignIn('client')}
                disabled={isLoading}
                className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-white/20 hover:border-white/50 rounded-xl text-xs font-mono text-white transition-all text-left flex items-center gap-2 cursor-pointer group"
              >
                <div className="w-7 h-7 rounded-lg bg-black border border-white/40 text-white flex items-center justify-center font-bold text-[10px] shrink-0 group-hover:scale-105 transition-transform">
                  SC
                </div>
                <div className="truncate">
                  <span className="block font-tech font-bold text-white truncate">Sarah Chen</span>
                  <span className="text-[10px] text-zinc-400 block truncate">Client Account</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
