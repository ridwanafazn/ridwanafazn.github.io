// src/pages/admin/api/skills.ts
import type { APIRoute } from 'astro';
import { getSkills, upsertSkills } from '../../../lib/queries';
import { skillsSchema } from '../../../lib/validation/content';

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  if (!locals.user) return new Response('Unauthorized', { status: 401 });
  try {
    const row = await getSkills();
    return new Response(JSON.stringify(row ?? {}), { headers: { 'content-type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
};

export const PUT: APIRoute = async ({ request, locals }) => {
  if (!locals.user) return new Response('Unauthorized', { status: 401 });
  try {
    const body = await request.json();
    const data = skillsSchema.parse(body);
    const row = await upsertSkills(data);
    return new Response(JSON.stringify(row), { headers: { 'content-type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }
};
