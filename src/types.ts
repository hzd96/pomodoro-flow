export type SessionType = 'work' | 'short' | 'long';

export interface Session {
  type: SessionType;
  minutes: number;
  /** 1-based focus session number; a break carries the number of the focus session before it. */
  focusNumber: number;
}

export type ThemeName = 'classic' | 'cyberpunk' | 'forest' | 'ocean' | 'synthwave' | 'glamour' | 'light';

export interface Settings {
  workMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  sessionsBeforeLongBreak: number;
  totalSessions: number;
  autoStart: boolean;
  sound: boolean;
  notifications: boolean;
  keepAwake: boolean;
  timerStyle: 'digital' | 'analog';
  theme: ThemeName;
}

export type NumericSetting = 'workMinutes' | 'shortBreakMinutes' | 'longBreakMinutes' | 'sessionsBeforeLongBreak' | 'totalSessions';

export interface TimerState {
  /** Index into the schedule; equal to schedule.length when the plan is finished. */
  sessionIndex: number;
  /** Epoch ms when the current session ends, or null while the timer isn't running. */
  endsAt: number | null;
  /** Seconds left in the current session; only used while endsAt is null. */
  remainingSeconds: number;
}

export interface Task {
  title: string;
  note?: string;
}

/** Tasks keyed by focus session number. */
export type Tasks = Record<number, Task>;
