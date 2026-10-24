// Cloudflare Pages Function: /api/tasks
// Keeps the Gemini key on the server. Configure in the Pages project:
//   GEMINI_API_KEY  (secret, required for AI planning)
//   ACCESS_KEY      (secret, optional — the app asks for it once and remembers it)
//   GEMINI_MODEL    (optional, defaults to gemini-2.5-flash)

interface Env {
  GEMINI_API_KEY?: string;
  ACCESS_KEY?: string;
  GEMINI_MODEL?: string;
}

interface Ctx {
  request: Request;
  env: Env;
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

export const onRequestGet = ({ env }: Ctx) => json({ enabled: Boolean(env.GEMINI_API_KEY), locked: Boolean(env.ACCESS_KEY) });

export const onRequestPost = async ({ request, env }: Ctx) => {
  if (!env.GEMINI_API_KEY) return json({ error: 'AI is not configured (GEMINI_API_KEY missing).' }, 503);
  if (env.ACCESS_KEY && request.headers.get('X-Access-Key') !== env.ACCESS_KEY) return json({ error: 'Unauthorized' }, 401);

  let body: { goal?: unknown; count?: unknown; minutes?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }
  const goal = typeof body.goal === 'string' ? body.goal.trim().slice(0, 500) : '';
  const count = Math.min(20, Math.max(1, Math.round(Number(body.count) || 0)));
  const minutes = Math.min(180, Math.max(1, Math.round(Number(body.minutes) || 25)));
  if (!goal) return json({ error: 'Goal is required.' }, 400);

  const prompt = `Using the Pomodoro technique, break this goal into exactly ${count} sequential, concrete tasks.
Each task must be doable in one ${minutes}-minute focus session.
Give each a short actionable title and a one-sentence description.
Reply in the same language as the goal.
Goal: """${goal}"""`;

  const model = env.GEMINI_MODEL || 'gemini-2.5-flash';
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: { title: { type: 'STRING' }, note: { type: 'STRING' } },
            required: ['title', 'note'],
          },
        },
      },
    }),
  });

  if (!res.ok) return json({ error: `Gemini error (${res.status}). Check the API key / model.` }, 502);

  try {
    const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]';
    const tasks = (JSON.parse(text) as { title?: unknown; note?: unknown }[])
      .filter((t) => typeof t.title === 'string' && t.title)
      .slice(0, count)
      .map((t) => ({ title: String(t.title).slice(0, 200), note: typeof t.note === 'string' ? t.note.slice(0, 300) : undefined }));
    return json({ tasks });
  } catch {
    return json({ error: 'Could not read the AI response — try again.' }, 502);
  }
};
