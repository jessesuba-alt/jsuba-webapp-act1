import React from 'react';
import { BarChart3, Dumbbell, LogOut, SlidersHorizontal, Utensils } from 'lucide-react';
import type { ActiveTab, UserProfile } from '../types';

interface NavbarProps {
  profile: UserProfile | null;
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  onLogout: () => void;
}

const TABS: {
  id: ActiveTab;
  label: string;
  mobileLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'workout', label: 'Workout Guide', mobileLabel: 'Workout', icon: Dumbbell },
  { id: 'diet', label: 'Diet Planner', mobileLabel: 'Diet', icon: Utensils },
  { id: 'progress', label: 'Progress & Log', mobileLabel: 'Progress', icon: BarChart3 },
  { id: 'settings', label: 'Preferences', mobileLabel: 'Prefs', icon: SlidersHorizontal },
];

export const Navbar: React.FC<NavbarProps> = ({
  profile,
  activeTab,
  onChangeTab,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#FFFFFF] border-b border-[#E5E5E5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Wordmark */}
        <button
          type="button"
          onClick={() => onChangeTab('workout')}
          className="flex items-center gap-3 shrink-0 text-left cursor-pointer"
        >
          <div className="w-7 h-7 bg-[#0A0A0A] text-white flex items-center justify-center rounded-[2px] font-mono text-xs font-semibold">
            KF
          </div>
          <div className="flex items-baseline gap-2.5">
            <span className="text-base font-bold tracking-tight text-[#0A0A0A] uppercase whitespace-nowrap">
              KINETIC FORM
            </span>
            <span className="hidden xl:inline font-mono text-[11px] uppercase tracking-wider text-[#737373] whitespace-nowrap">
              Personal Training &amp; Nutrition
            </span>
          </div>
        </button>

        {/* Desktop Tab Navigation */}
        <nav
          aria-label="Primary Workspace Sections"
          className="hidden md:flex items-center gap-1"
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                aria-current={isActive ? 'page' : undefined}
                onClick={() => onChangeTab(tab.id)}
                className={`px-3 py-2 text-xs font-semibold uppercase tracking-wider rounded-[2px] border transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]'
                    : 'bg-white text-[#555555] border-transparent hover:text-[#0A0A0A] hover:border-[#E5E5E5]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Controls */}
        <div className="flex items-center gap-3 shrink-0">
          {profile && (
            <button
              type="button"
              onClick={() => onChangeTab('settings')}
              className="hidden sm:flex flex-col items-end leading-tight text-right cursor-pointer hover:opacity-80"
            >
              <span className="text-xs font-semibold text-[#0A0A0A] max-w-[160px] truncate">
                {profile.displayName}
              </span>
              <span className="font-mono text-[10px] text-[#737373] uppercase tracking-wider">
                {profile.goal}
              </span>
            </button>
          )}
          <button
            type="button"
            onClick={onLogout}
            className="px-3 py-1.5 border border-[#E5E5E5] hover:border-[#0A0A0A] bg-white text-[#0A0A0A] text-xs font-medium rounded-[2px] transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Mobile Tab Navigation */}
      <nav
        aria-label="Mobile Workspace Sections"
        className="md:hidden border-t border-[#E5E5E5] grid grid-cols-4 bg-[#FAFAFA]"
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onChangeTab(tab.id)}
              className={`py-2.5 px-1.5 text-[11px] font-semibold uppercase tracking-wider flex items-center justify-center gap-1 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'border-[#0A0A0A] bg-white text-[#0A0A0A]'
                  : 'border-transparent text-[#737373] hover:text-[#0A0A0A]'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{tab.mobileLabel}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
};
