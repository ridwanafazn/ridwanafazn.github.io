// src/pages/admin/api/assets/index.ts
import type { APIRoute } from 'astro';
import { listAssets, createAsset } from '../../../../lib/queries';

export const prerender = false;

export const GET: APIRoute = async ({ locals, url }) => {
  if (!locals.user) return new Response('Unauthorized', { status: 401 });
  const folder = url.searchParams.get('folder') ?? undefined;
  try {
    const rows = await listAssets({ folder });
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
    const row = await createAsset(body);
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
