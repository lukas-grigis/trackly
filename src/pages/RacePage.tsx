import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSessionStore } from '@/store/session-store';
import { DISCIPLINES, isTimedDiscipline, getMedalStyle, MAX_FIELD_ATTEMPTS } from '@/lib/constants';
import { formatTime, formatStopwatch, cn, getAgeGroup } from '@/lib/utils';
import { GenderBadgeInline } from '@/components/GenderBadge';
import { AthleteAvatar } from '@/components/ui/athlete-avatar';
import { useTranslation } from '@/lib/i18n';
import { ROUTES } from '@/routes';
import { Button } from '@/components/ui/button';

type Phase = 'setup' | 'countdown' | 'running' | 'finished' | 'field-entry';

type CountdownDuration = 0 | 3 | 5 | 10;
const COUNTDOWN_OPTIONS: CountdownDuration[] = [0, 3, 5, 10];
const COUNTDOWN_STORAGE_KEY = 'trackly-countdown-pref';

function loadCountdownPref(): CountdownDuration {
  try {
    const saved = localStorage.getItem(COUNTDOWN_STORAGE_KEY);
    if (saved !== null) {
      const num = Number(saved);
      if (COUNTDOWN_OPTIONS.includes(num as CountdownDuration)) return num as CountdownDuration;
    }
  } catch {
    /* ignore */
  }
  return 5;
}

function saveCountdownPref(val: CountdownDuration) {
  try {
    localStorage.setItem(COUNTDOWN_STORAGE_KEY, String(val));
  } catch {
    /* ignore */
  }
}

/** M12: Reuse AudioContext per countdown */
let _sharedAudioCtx: AudioContext | null = null;
function getAudioCtx(): AudioContext | null {
  try {
    if (!_sharedAudioCtx || _sharedAudioCtx.state === 'closed') {
      _sharedAudioCtx = new AudioContext();
    }
    return _sharedAudioCtx;
  } catch {
    return null;
  }
}

function closeAudioCtx() {
  try {
    _sharedAudioCtx?.close();
  } catch {
    /* ignore */
  }
  _sharedAudioCtx = null;
}

/** Play a short beep tone using AudioContext */
function playBeep(frequency: number, duration: number) {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = frequency;
    osc.type = 'sine';
    gain.gain.value = 0.3;
    osc.start();
    osc.stop(ctx.currentTime + duration / 1000);
  } catch {
    /* AudioContext not available */
  }
}

function vibrate(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* ignore */
  }
}

/** Split a formatStopwatch string into [beforeColon, colon, afterColon] */
function StopwatchDisplay({ value }: { value: string }) {
  const colonIdx = value.indexOf(':');
  if (colonIdx === -1) return <span>{value}</span>;
  const before = value.slice(0, colonIdx);
  const after = value.slice(colonIdx + 1);
  return (
    <>
      {before}
      <span className="animate-colon-blink">:</span>
      {after}
    </>
  );
}

export default function RacePage() {
  const { id, discipline = 'sprint_60' } = useParams<{ id: string; discipline: string }>();
  const navigate = useNavigate();
  const session = useSessionStore((s) => s.sessions.find((sess) => sess.id === id));
  const allAthletes = useSessionStore((s) => s.athletes);
  const addHeat = useSessionStore((s) => s.addHeat);
  const addHeatResult = useSessionStore((s) => s.addHeatResult);
  const { t } = useTranslation();

  const disciplineConfig = DISCIPLINES[discipline] ?? DISCIPLINES['sprint_60'];

  const [phase, setPhase] = useState<Phase>('setup');
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [finishTimes, setFinishTimes] = useState<Record<string, number>>({});
  const [elapsed, setElapsed] = useState(0);
  const [heatId, setHeatId] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Countdown state
  const [countdownDuration, setCountdownDuration] = useState<CountdownDuration>(loadCountdownPref);
  const [countdownRemaining, setCountdownRemaining] = useState(0);
  const [countdownPaused, setCountdownPaused] = useState(false);
  const [showGo, setShowGo] = useState(false);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Field-entry state: attempts per athlete (up to MAX_FIELD_ATTEMPTS)
  interface Attempt {
    value: string; // raw input string
    foul: boolean;
  }
  const [fieldAttempts, setFieldAttempts] = useState<Record<string, Attempt[]>>({});
  const [fieldUnit, setFieldUnit] = useState<'m' | 'cm' | 's' | 'ms'>('m');
  const [showSaveWarning, setShowSaveWarning] = useState(false);
  const [warningAthletes, setWarningAthletes] = useState<string[]>([]);

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopTimer();
      closeAudioCtx();
    };
  }, [stopTimer]);

  // C4: beforeunload warning during active race
  useEffect(() => {
    if (phase !== 'running' && phase !== 'field-entry' && phase !== 'countdown') return;
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [phase]);

  // Visibility change handler for countdown pause/resume
  useEffect(() => {
    if (phase !== 'countdown') return;
    function handleVisibility() {
      if (document.hidden) {
        // Pause countdown
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
        }
        setCountdownPaused(true);
      }
    }
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [phase]);

  const startRunningPhase = useCallback(() => {
    const now = performance.now();
    setStartTime(now);
    setFinishTimes({});
    setElapsed(0);
    setPhase('running');
    intervalRef.current = setInterval(() => {
      setElapsed(performance.now() - now);
    }, 100);
  }, []);

  // I13: Track total ticks for correct frequency on resume
  const totalCountdownRef = useRef<number>(0);

  const startCountdown = useCallback((seconds: number, isResume = false) => {
    setCountdownRemaining(seconds);
    setCountdownPaused(false);
    setShowGo(false);

    const totalTicks = isResume ? totalCountdownRef.current : seconds;
    if (!isResume) totalCountdownRef.current = seconds;

    const baseFreq = 440;
    // Play initial beep for current tick
    const freq = baseFreq + ((totalTicks - seconds) / totalTicks) * 440;
    playBeep(freq, 100);
    vibrate(50);

    let remaining = seconds;
    countdownRef.current = setInterval(() => {
      remaining -= 1;
      if (remaining > 0) {
        setCountdownRemaining(remaining);
        const f = baseFreq + ((totalTicks - remaining) / totalTicks) * 440;
        playBeep(f, 100);
        vibrate(50);
      } else {
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
        }
        setCountdownRemaining(0);
        playBeep(1200, 200);
        vibrate([100, 50, 100]);

        const raceStart = performance.now();
        setStartTime(raceStart);
        setFinishTimes({});
        setElapsed(0);
        setShowGo(true);

        setTimeout(() => {
          setShowGo(false);
          setPhase('running');
          intervalRef.current = setInterval(() => {
            setElapsed(performance.now() - raceStart);
          }, 100);
        }, 500);
      }
    }, 1000);
  }, []);

  const resumeCountdown = useCallback(() => {
    setCountdownPaused(false);
    startCountdown(countdownRemaining, true);
  }, [countdownRemaining, startCountdown]);

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [repeatDialogOpen, setRepeatDialogOpen] = useState(false);

  if (!session || !id) {
    return <div className="py-12 text-center text-muted-foreground">{t.sessionNotFound}</div>;
  }

  function toggleAthlete(athleteId: string) {
    setSelectedChildren((prev) =>
      prev.includes(athleteId) ? prev.filter((c) => c !== athleteId) : [...prev, athleteId]
    );
  }

  function handleStart() {
    if (selectedChildren.length === 0 || !id) return;
    const nowIso = new Date().toISOString();
    const newHeatId = addHeat(id, {
      sessionId: id,
      disciplineType: discipline,
      participantIds: [...selectedChildren],
      startedAt: nowIso,
    });
    setHeatId(newHeatId);

    if (!isTimedDiscipline(discipline)) {
      // Field event — go to manual entry
      // Initialize attempts for each athlete
      const initial: Record<string, Attempt[]> = {};
      for (const cid of selectedChildren) {
        initial[cid] = [{ value: '', foul: false }];
      }
      setFieldAttempts(initial);
      // Set display unit based on discipline config
      const cfg = DISCIPLINES[discipline];
      if (cfg?.unit === 'cm') {
        // cm-stored disciplines: display as m (except high_jump which stays cm)
        setFieldUnit(discipline === 'high_jump' || discipline === 'pole_vault' ? 'cm' : 'm');
      } else {
        setFieldUnit('m');
      }
      setPhase('field-entry');
      return;
    }

    // Timed discipline: check countdown preference
    if (countdownDuration > 0) {
      setPhase('countdown');
      startCountdown(countdownDuration);
    } else {
      startRunningPhase();
    }
  }

  function handleFinish(athleteId: string) {
    if (!startTime) return;
    // eslint-disable-next-line react-hooks/purity -- event handler captures timestamp
    const time = performance.now() - startTime;
    setFinishTimes((prev) => {
      const next = { ...prev, [athleteId]: time };
      if (Object.keys(next).length >= selectedChildren.length) {
        stopTimer();
        setPhase('finished');
      }
      return next;
    });
  }

  function handleCancelRequest() {
    const hasPartial = Object.keys(finishTimes).length > 0;
    if (hasPartial) {
      setCancelDialogOpen(true);
    } else {
      // No results — just discard
      handleDiscardHeat();
    }
  }

  function handleSavePartial() {
    setCancelDialogOpen(false);
    stopTimer();
    setPhase('finished');
  }

  function handleDiscardHeat() {
    setCancelDialogOpen(false);
    stopTimer();
    // Delete the heat that was already created
    if (id && heatId) {
      useSessionStore.getState().deleteHeat(id, heatId);
    }
    handleReset();
  }

  function handleContinueRace() {
    setCancelDialogOpen(false);
  }

  function handleSave() {
    if (!id || !session || !heatId) return;
    const now = new Date().toISOString();
    for (const [athleteId, value] of Object.entries(finishTimes)) {
      addHeatResult(id, heatId, {
        athleteId,
        value: Math.round(value),
        unit: disciplineConfig.unit,
        recordedAt: now,
      });
    }
    // I11: Navbar handles toast via _heatJustSaved, no duplicate here
    navigate(ROUTES.SESSION(id));
  }

  function handleReset() {
    // Clean up orphan heat (zero results) on repeat/abort (#13)
    if (id && heatId) {
      const s = useSessionStore.getState().sessions.find((sess) => sess.id === id);
      const heat = s?.heats.find((h) => h.id === heatId);
      if (heat && heat.results.length === 0) {
        useSessionStore.getState().deleteHeat(id, heatId);
      }
    }
    setPhase('setup');
    setStartTime(null);
    setFinishTimes({});
    setElapsed(0);
    setHeatId(null);
    setFieldAttempts({});
    setShowSaveWarning(false);
    setWarningAthletes([]);
    setCountdownRemaining(0);
    setCountdownPaused(false);
    setShowGo(false);
    stopTimer();
  }

  const rankedResults = (() => {
    const sorted = Object.entries(finishTimes)
      .sort(([, a], [, b]) => a - b)
      .map(([athleteId, time]) => ({
        rank: 0,
        athleteId,
        time,
        name: allAthletes.find((a) => a.id === athleteId)?.name ?? '—',
      }));
    // C3: competition ranking (1,1,3 pattern)
    for (let i = 0; i < sorted.length; i++) {
      if (i === 0) sorted[i].rank = 1;
      else if (Math.round(sorted[i].time) === Math.round(sorted[i - 1].time)) sorted[i].rank = sorted[i - 1].rank;
      else sorted[i].rank = i + 1;
    }
    return sorted;
  })();

  const disciplineLabel = t.disciplines[discipline] ?? discipline;

  // SETUP PHASE
  if (phase === 'setup') {
    const sessionAthletes = allAthletes.filter((a) => session.athleteIds.includes(a.id));
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t.prepareRace}</h1>
          <p className="text-sm text-muted-foreground">{disciplineLabel}</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{t.selectParticipants}</p>
            {sessionAthletes.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const allIds = sessionAthletes.map((a) => a.id);
                  const allSelected = allIds.every((id) => selectedChildren.includes(id));
                  setSelectedChildren(allSelected ? [] : allIds);
                }}
              >
                {sessionAthletes.every((a) => selectedChildren.includes(a.id)) ? t.deselectAll : t.selectAll}
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {sessionAthletes.map((athlete) => {
              const selected = selectedChildren.includes(athlete.id);
              return (
                <Button
                  key={athlete.id}
                  variant={selected ? 'default' : 'outline'}
                  className="tap-target tap-press h-14 font-medium gap-2"
                  onClick={() => toggleAthlete(athlete.id)}
                >
                  <AthleteAvatar name={athlete.name} avatarBase64={athlete.avatarBase64} size="sm" />
                  <span className="flex flex-col items-start">
                    <span>{athlete.name}</span>
                    <span className="flex items-center gap-1">
                      {athlete.yearOfBirth && (
                        <span className="text-[10px] font-normal opacity-70">
                          {getAgeGroup(athlete.yearOfBirth, new Date(session.date).getFullYear())}
                        </span>
                      )}
                      <GenderBadgeInline gender={athlete.gender} />
                    </span>
                  </span>
                </Button>
              );
            })}
          </div>
          {session.athleteIds.length === 0 && <p className="text-sm text-muted-foreground">{t.noChildrenYet}</p>}
        </div>

        {isTimedDiscipline(discipline) && (
          <div className="space-y-2">
            <p className="text-sm font-medium">{t.countdownLabel}</p>
            <div className="flex gap-2">
              {COUNTDOWN_OPTIONS.map((val) => (
                <Button
                  key={val}
                  size="sm"
                  variant={countdownDuration === val ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => {
                    setCountdownDuration(val);
                    saveCountdownPref(val);
                  }}
                >
                  {val === 0 ? t.countdownNone : `${val}s`}
                </Button>
              ))}
            </div>
          </div>
        )}

        <Button
          className="tap-target tap-press h-20 w-full rounded-2xl text-2xl font-display tracking-wide btn-shimmer shadow-lg"
          disabled={selectedChildren.length === 0}
          onClick={handleStart}
        >
          {disciplineConfig.mode === 'distance' ? t.fieldEntry : t.start}
        </Button>
      </div>
    );
  }

  // COUNTDOWN PHASE
  if (phase === 'countdown') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
        {showGo ? (
          <div className="text-9xl font-display font-bold text-primary animate-pulse">{t.countdownGo}</div>
        ) : countdownPaused ? (
          <div className="flex flex-col items-center gap-6">
            <div className="text-9xl font-display font-bold tabular-nums text-muted-foreground">
              {countdownRemaining}
            </div>
            <p className="text-lg text-muted-foreground">{t.countdownPaused}</p>
            <Button className="tap-target tap-press h-16 px-12 text-xl font-display" onClick={resumeCountdown}>
              {t.countdownTapResume}
            </Button>
          </div>
        ) : (
          <div className="text-[12rem] leading-none font-display font-bold tabular-nums text-primary">
            {countdownRemaining}
          </div>
        )}
        {!showGo && (
          <Button variant="ghost" className="absolute bottom-12 text-muted-foreground" onClick={handleReset}>
            {t.cancel}
          </Button>
        )}
      </div>
    );
  }

  // FIELD-ENTRY PHASE
  if (phase === 'field-entry') {
    const isCustom = disciplineConfig.mode === 'custom';
    // For cm-stored disciplines display as "m" (easier to enter) except vertical jumps
    const displayUnit = isCustom
      ? fieldUnit
      : disciplineConfig.unit === 'cm'
        ? discipline === 'high_jump' || discipline === 'pole_vault'
          ? 'cm'
          : 'm'
        : (disciplineConfig.unit as 'm' | 'cm' | 's' | 'ms' | 'count');
    const unitLabel = displayUnit === 'count' ? '#' : displayUnit;

    function getStoredUnit(): 'cm' | 'm' | 's' | 'ms' | 'count' {
      if (isCustom) return fieldUnit;
      return disciplineConfig.unit as 'cm' | 'm' | 's' | 'ms' | 'count';
    }

    function toStoredValue(inputStr: string): number | null {
      const num = parseFloat(inputStr);
      if (isNaN(num) || num < 0) return null;
      const storedUnit = getStoredUnit();
      // If display is m but stored is cm, convert
      if (displayUnit === 'm' && storedUnit === 'cm') {
        return Math.round(num * 100);
      }
      // If display is s and stored is ms
      if (displayUnit === 's' && storedUnit === 'ms') {
        return Math.round(num * 1000);
      }
      return num;
    }

    function getBestAttemptIdx(attempts: { value: string; foul: boolean }[]): number | null {
      let bestIdx: number | null = null;
      let bestVal = -Infinity;
      for (let i = 0; i < attempts.length; i++) {
        if (attempts[i].foul) continue;
        const num = parseFloat(attempts[i].value);
        if (isNaN(num)) continue;
        if (num > bestVal) {
          bestVal = num;
          bestIdx = i;
        }
      }
      return bestIdx;
    }

    function updateAttempt(athleteId: string, idx: number, update: Partial<{ value: string; foul: boolean }>) {
      setFieldAttempts((prev) => {
        const attempts = [...(prev[athleteId] ?? [])];
        attempts[idx] = { ...attempts[idx], ...update };
        return { ...prev, [athleteId]: attempts };
      });
    }

    function addAttempt(athleteId: string) {
      setFieldAttempts((prev) => {
        const attempts = prev[athleteId] ?? [];
        if (attempts.length >= MAX_FIELD_ATTEMPTS) return prev;
        return { ...prev, [athleteId]: [...attempts, { value: '', foul: false }] };
      });
    }

    function handleFieldSave() {
      // Check for athletes with 0 valid attempts
      const athletesWithNoResults: string[] = [];
      for (const athleteId of selectedChildren) {
        const attempts = fieldAttempts[athleteId] ?? [];
        const hasValid = attempts.some((a) => !a.foul && a.value.trim() !== '' && !isNaN(parseFloat(a.value)));
        if (!hasValid) {
          athletesWithNoResults.push(athleteId);
        }
      }

      if (athletesWithNoResults.length > 0 && !showSaveWarning) {
        setWarningAthletes(athletesWithNoResults);
        setShowSaveWarning(true);
        return;
      }

      // Save best result per athlete
      if (!id || !heatId) return;
      const now = new Date().toISOString();
      const storedUnit = getStoredUnit();

      for (const athleteId of selectedChildren) {
        const attempts = fieldAttempts[athleteId] ?? [];
        const bestIdx = getBestAttemptIdx(attempts);
        if (bestIdx === null) continue;
        const stored = toStoredValue(attempts[bestIdx].value);
        if (stored === null) continue;
        addHeatResult(id, heatId, {
          athleteId,
          value: stored,
          unit: storedUnit,
          recordedAt: now,
        });
      }

      // I11: Navbar handles toast via _heatJustSaved
      navigate(ROUTES.SESSION(id));
    }

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t.fieldEntry}</h1>
          <p className="text-sm text-muted-foreground">{disciplineLabel}</p>
        </div>

        {isCustom && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{t.unitLabel}:</span>
            {(['m', 'cm', 's', 'ms'] as const).map((u) => (
              <Button
                key={u}
                size="sm"
                variant={fieldUnit === u ? 'default' : 'outline'}
                onClick={() => setFieldUnit(u)}
                aria-label={u}
              >
                {u}
              </Button>
            ))}
          </div>
        )}

        <div className="space-y-4">
          {selectedChildren.map((athleteId) => {
            const athlete = allAthletes.find((a) => a.id === athleteId);
            const attempts = fieldAttempts[athleteId] ?? [];
            const bestIdx = getBestAttemptIdx(attempts);

            return (
              <div key={athleteId} className="rounded-xl border p-3 space-y-2">
                <div className="flex items-center gap-2 font-semibold">
                  <AthleteAvatar name={athlete?.name ?? '?'} avatarBase64={athlete?.avatarBase64} size="sm" />
                  <span>{athlete?.name ?? '—'}</span>
                </div>

                <div className="space-y-1">
                  {attempts.map((attempt, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        'flex items-center gap-2 rounded-lg px-2 py-1',
                        bestIdx === idx && !attempt.foul && 'bg-primary/10 ring-1 ring-primary'
                      )}
                    >
                      <span className="text-xs text-muted-foreground w-4">{idx + 1}.</span>
                      {attempt.foul ? (
                        <span className="flex-1 text-sm text-destructive font-medium">{t.foul}</span>
                      ) : (
                        <input
                          type="number"
                          inputMode="decimal"
                          step="any"
                          min="0"
                          className="flex-1 rounded border bg-background px-2 py-1 text-base md:text-sm"
                          placeholder="0.00"
                          value={attempt.value}
                          onChange={(e) => updateAttempt(athleteId, idx, { value: e.target.value })}
                        />
                      )}
                      {!attempt.foul && <span className="text-xs text-muted-foreground">{unitLabel}</span>}
                      <Button
                        size="sm"
                        variant={attempt.foul ? 'destructive' : 'ghost'}
                        className="h-7 text-xs px-2"
                        onClick={() =>
                          updateAttempt(athleteId, idx, {
                            foul: !attempt.foul,
                            value: attempt.foul ? '' : attempt.value,
                          })
                        }
                      >
                        {attempt.foul ? t.undoFoul : t.foul}
                      </Button>
                      {bestIdx === idx && !attempt.foul && (
                        <span className="text-xs font-bold text-primary">{t.best}</span>
                      )}
                    </div>
                  ))}
                </div>

                {attempts.length < MAX_FIELD_ATTEMPTS && (
                  <Button size="sm" variant="ghost" className="text-xs" onClick={() => addAttempt(athleteId)}>
                    + {t.addAttempt}
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {showSaveWarning && (
          <div className="rounded-lg border border-yellow-400 bg-yellow-50 dark:bg-yellow-950/30 p-3 space-y-2">
            <p className="text-sm font-medium">{t.fieldSaveWarning}</p>
            <ul className="text-sm text-muted-foreground list-disc pl-4">
              {warningAthletes.map((cid) => {
                const a = allAthletes.find((ath) => ath.id === cid);
                return <li key={cid}>{a?.name ?? '—'}</li>;
              })}
            </ul>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleFieldSave}>
                {t.saveAll}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowSaveWarning(false)}>
                {t.back}
              </Button>
            </div>
          </div>
        )}

        {!showSaveWarning && (
          <div className="flex gap-2">
            <Button className="flex-1" onClick={handleFieldSave}>
              {t.saveAll}
            </Button>
            <Button variant="outline" className="flex-1" onClick={handleReset}>
              {t.abort}
            </Button>
          </div>
        )}
      </div>
    );
  }

  // RUNNING PHASE
  if (phase === 'running') {
    const finishedCount = Object.keys(finishTimes).length;
    const totalCount = selectedChildren.length;
    return (
      <div className="space-y-4">
        <div className="rounded-2xl bg-primary p-8 text-center text-primary-foreground animate-pulse-ring shadow-lg">
          <div className="font-display text-7xl sm:text-8xl tabular-nums">
            <StopwatchDisplay value={formatStopwatch(elapsed)} />
          </div>
          <p className="mt-2 text-sm opacity-70 font-medium">
            {finishedCount} / {totalCount}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {selectedChildren.map((athleteId) => {
            const athlete = allAthletes.find((a) => a.id === athleteId);
            const finished = athleteId in finishTimes;
            return (
              <button
                key={athleteId}
                disabled={finished}
                onClick={() => handleFinish(athleteId)}
                className={cn(
                  'tap-target tap-press flex w-full items-center justify-between rounded-2xl px-5 py-4 text-lg font-semibold transition-all min-h-[4.5rem]',
                  finished
                    ? 'bg-muted text-muted-foreground scale-[0.98]'
                    : 'bg-primary text-primary-foreground shadow-md active:shadow-none'
                )}
              >
                <span className="flex items-center gap-3">
                  <AthleteAvatar name={athlete?.name ?? '?'} avatarBase64={athlete?.avatarBase64} size="sm" />
                  <span className="flex flex-col items-start">
                    <span>{athlete?.name}</span>
                    <span className="flex items-center gap-1">
                      {athlete?.yearOfBirth && (
                        <span className="text-xs font-normal opacity-70">
                          {getAgeGroup(athlete.yearOfBirth, new Date(session.date).getFullYear())}
                        </span>
                      )}
                      <GenderBadgeInline gender={athlete?.gender} />
                    </span>
                  </span>
                </span>
                {finished && (
                  <span className="font-mono text-base animate-celebrate">{formatTime(finishTimes[athleteId])}</span>
                )}
              </button>
            );
          })}
        </div>

        <Button variant="outline" size="sm" className="w-full" onClick={handleCancelRequest}>
          {t.abort}
        </Button>

        {/* I14: Partial results dialog */}
        {cancelDialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="mx-4 w-full max-w-sm rounded-2xl border bg-background p-6 space-y-4 shadow-lg">
              <h2 className="text-lg font-bold">{t.partialResultsTitle}</h2>
              <p className="text-sm text-muted-foreground">
                {Object.keys(finishTimes).length} / {selectedChildren.length}
              </p>
              <div className="flex flex-col gap-2">
                <Button onClick={handleSavePartial}>{t.partialResultsSave}</Button>
                <Button variant="destructive" onClick={handleDiscardHeat}>
                  {t.partialResultsDiscard}
                </Button>
                <Button variant="outline" onClick={handleContinueRace}>
                  {t.partialResultsContinue}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // FINISHED PHASE
  return (
    <div className="space-y-6">
      <div className="animate-celebrate text-center">
        <h1 className="text-2xl font-bold heading-tight text-primary">{t.raceFinished}</h1>
      </div>

      {rankedResults.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 pr-4">{t.rankCol}</th>
                <th className="pb-2 pr-4">{t.nameCol}</th>
                <th className="pb-2 text-right">{t.timeCol}</th>
              </tr>
            </thead>
            <tbody>
              {rankedResults.map((r, i) => (
                <tr
                  key={r.athleteId}
                  className={cn('border-b last:border-0 animate-card-enter-stagger')}
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <td className="py-3 pr-4 font-medium">
                    {getMedalStyle(r.rank) ? (
                      <span
                        className={cn(
                          'inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold',
                          getMedalStyle(r.rank)
                        )}
                      >
                        {r.rank}
                      </span>
                    ) : (
                      r.rank
                    )}
                  </td>
                  <td className="py-3 pr-4 font-medium">{r.name}</td>
                  <td className="py-3 text-right font-mono font-semibold">{formatTime(r.time)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center text-muted-foreground">{t.noTimesRecorded}</p>
      )}

      <div className="flex gap-2">
        <Button className="flex-1 h-12 text-base rounded-xl" onClick={handleSave}>
          {t.save}
        </Button>
        <Button
          variant="outline"
          className="flex-1 h-12 text-base rounded-xl"
          onClick={() => setRepeatDialogOpen(true)}
        >
          {t.repeat}
        </Button>
      </div>

      {/* Repeat confirmation dialog (#19) */}
      {repeatDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-2xl border bg-background p-6 space-y-4 shadow-lg">
            <h2 className="text-lg font-bold">{t.repeatConfirmTitle}</h2>
            <p className="text-sm text-muted-foreground">{t.repeatConfirmDesc}</p>
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => {
                  setRepeatDialogOpen(false);
                  handleReset();
                }}
              >
                {t.repeatConfirmAction}
              </Button>
              <Button variant="outline" onClick={() => setRepeatDialogOpen(false)}>
                {t.cancel}
              </Button>
            </div>
          </div>
        </div>
      )}

      {id && (
        <Button variant="ghost" className="w-full h-10 text-sm" onClick={() => navigate(ROUTES.LEADERBOARD(id))}>
          {t.viewLeaderboard}
        </Button>
      )}
    </div>
  );
}
