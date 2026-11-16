import React, { useEffect, useState } from 'react';
import { Pause, Play, RotateCcw, Timer } from 'lucide-react';

interface RestTimerProps {
  externalTrigger?: { seconds: number; label: string; nonce: number } | null;
}

const PRESETS = [30, 60, 90, 120];

export const RestTimer: React.FC<RestTimerProps> = ({ externalTrigger }) => {
  const [duration, setDuration] = useState<number>(60);
  const [remaining, setRemaining] = useState<number>(60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activeLabel, setActiveLabel] = useState<string>('Between Sets');

  useEffect(() => {
    if (!externalTrigger) return;
    setDuration(externalTrigger.seconds);
    setRemaining(externalTrigger.seconds);
    setActiveLabel(externalTrigger.label);
    setIsRunning(true);
  }, [externalTrigger]);

  useEffect(() => {
    if (!isRunning) return;
    const id = window.setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [isRunning]);

  const selectPreset = (sec: number) => {
    setIsRunning(false);
    setDuration(sec);
    setRemaining(sec);
    setActiveLabel('Manual Rest');
  };

  const resetTimer = () => {
    setIsRunning(false);
    setRemaining(duration);
  };

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const pct = duration > 0 ? Math.round(((duration - remaining) / duration) * 100) : 0;

  return (
    <div className="border border-[#E5E5E5] bg-[#FFFFFF] rounded-[2px] p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Timer className="w-4 h-4 text-[#0A0A0A]" />
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#737373] block">
              Rest Timer
            </span>
            <span className="text-xs font-semibold text-[#0A0A0A] truncate max-w-[220px] block">
              {remaining === 0 ? 'Rest Complete — Next Set Ready' : activeLabel}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono text-2xl font-semibold tabular-nums tracking-tight text-[#0A0A0A]">
            {formatted}
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                if (remaining === 0) setRemaining(duration);
                setIsRunning((prev) => !prev);
              }}
              aria-label={isRunning ? 'Pause rest timer' : 'Start rest timer'}
              className="px-3 py-1.5 bg-[#0A0A0A] hover:bg-[#262626] text-white text-xs font-semibold rounded-[2px] transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              {isRunning ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>{remaining === 0 ? 'Restart' : 'Start'}</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={resetTimer}
              aria-label="Reset rest timer"
              className="p-1.5 border border-[#E5E5E5] hover:border-[#0A0A0A] bg-white text-[#0A0A0A] rounded-[2px] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Progress Track */}
      <div className="h-1 bg-[#EAEAEA] w-full overflow-hidden">
        <div
          className="h-full bg-[#0A0A0A] transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Presets */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="font-mono text-[10px] uppercase tracking-wider text-[#737373]">
          Quick Presets
        </span>
        <div className="flex items-center gap-1.5">
          {PRESETS.map((sec) => {
            const active = duration === sec;
            return (
              <button
                key={sec}
                type="button"
                onClick={() => selectPreset(sec)}
                className={`px-2.5 py-1 font-mono text-[11px] border rounded-[2px] transition-colors cursor-pointer ${
                  active
                    ? 'border-[#0A0A0A] bg-[#0A0A0A] text-white'
                    : 'border-[#E5E5E5] bg-[#FAFAFA] text-[#555555] hover:border-[#0A0A0A] hover:text-[#0A0A0A]'
                }`}
              >
                {sec}s
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
