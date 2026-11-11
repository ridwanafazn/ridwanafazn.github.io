// src/pages/admin/api/activities/[id].ts
import type { APIRoute } from 'astro';
import { updateActivity, softDeleteActivity } from '../../../../lib/queries';
import { activitySchema } from '../../../../lib/validation/content';

export const prerender = false;

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  if (!locals.user) return new Response('Unauthorized', { status: 401 });
  try {
    const body = await request.json();
    const raw = (body ?? {}) as Record<string, unknown>;
    const parsed = activitySchema.partial().parse(raw);
    // Hanya update key yang dikirim (cegah default Zod menimpa data).
    const allowed = new Set(Object.keys(raw));
    const data = Object.fromEntries(Object.entries(parsed).filter(([key]) => allowed.has(key)));
    const row = await updateActivity(params.id!, data);
    if (!row) return new Response('Not found', { status: 404 });
    return new Response(JSON.stringify(row), { headers: { 'content-type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  if (!locals.user) return new Response('Unauthorized', { status: 401 });
  try {
    await softDeleteActivity(params.id!);
    return new Response(null, { status: 204 });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
};
