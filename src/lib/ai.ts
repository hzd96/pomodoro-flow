import type { Task } from '../types';
import { getAccessKey } from './storage';

export class AuthError extends Error {}

export interface AiStatus {
  enabled: boolean;
  locked: boolean;
}

/** Asks the Cloudflare Function whether AI is configured. False when running without it (e.g. `vite dev`). */
export async function getAiStatus(): Promise<AiStatus> {
  try {
    const res = await fetch('/api/tasks');
    if (!res.ok || !res.headers.get('content-type')?.includes('json')) return { enabled: false, locked: false };
    return (await res.json()) as AiStatus;
  } catch {
    return { enabled: false, locked: false };
  }
}

export async function suggestTasks(goal: string, count: number, minutes: number): Promise<Task[]> {
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Access-Key': getAccessKey() },
    body: JSON.stringify({ goal, count, minutes }),
  });
  if (res.status === 401) throw new AuthError('Access key required');
  const data = (await res.json().catch(() => ({}))) as { tasks?: Task[]; error?: string };
  if (!res.ok || !data.tasks) throw new Error(data.error || `Request failed (${res.status})`);
  return data.tasks;
}
