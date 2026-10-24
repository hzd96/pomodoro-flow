export type SessionType = 'work' | 'short' | 'long';

export interface Session {
  type: SessionType;
  minutes: number;
  /** Work session number; breaks carry the number of the work session before them. */
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
  /** Epoch ms when the current session ends, or null while paused. */
  endsAt: number | null;
  /** Seconds left in the current session while paused. */
  remaining: number;
}

export interface Task {
  title: string;
  note?: string;
}

/** Tasks keyed by work session number. */
export type Tasks = Record<number, Task>;
