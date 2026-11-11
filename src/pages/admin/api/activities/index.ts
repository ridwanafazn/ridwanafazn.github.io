// src/pages/admin/api/activities/index.ts
import type { APIRoute } from 'astro';
import { listActivities, createActivity } from '../../../../lib/queries';
import { activitySchema } from '../../../../lib/validation/content';

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  if (!locals.user) return new Response('Unauthorized', { status: 401 });
  try {
    const rows = await listActivities();
    return new Response(JSON.stringify(rows), { headers: { 'content-type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.user) return new Response('Unauthorized', { status: 401 });
  try {
    const body = await request.json();
    const data = activitySchema.parse(body);
    const row = await createActivity(data);
    return new Response(JSON.stringify(row), {
      status: 201,
      headers: { 'content-type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }
};
