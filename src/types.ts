export type SessionType = 'work' | 'short' | 'long';

export interface Session {
  type: SessionType;
  minutes: number;
  /** 1-based work session number; a break carries the number of the work session before it. */
  n: number;
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

export interface Run {
  /** Index into the schedule; equal to schedule.length when the plan is finished. */
  index: number;
  /** Epoch ms when the current session ends, or null while the timer isn't running. */
  endsAt: number | null;
  /** Seconds left in the current session; only used while endsAt is null. */
  remaining: number;
}

export interface Task {
  title: string;
  note?: string;
}

/** Tasks keyed by work session number. */
export type Tasks = Record<number, Task>;
