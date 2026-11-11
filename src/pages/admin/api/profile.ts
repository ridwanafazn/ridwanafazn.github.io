// src/pages/admin/api/profile.ts
import type { APIRoute } from 'astro';
import { getProfile, upsertProfile } from '../../../lib/queries';
import { profileSchema } from '../../../lib/validation/content';
export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  if (!locals.user) return new Response('Unauthorized', { status: 401 });
  try {
    const row = await getProfile();
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
    const data = profileSchema.parse(body);
    // Gabung dengan row existing agar field yang tidak dikirim form tidak terhapus.
    const existing = await getProfile();
    const row = await upsertProfile({ ...(existing ?? {}), ...data, updatedAt: new Date() });
    return new Response(JSON.stringify(row), { headers: { 'content-type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }
};
