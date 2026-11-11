// src/pages/admin/api/portfolio/reorder.ts — simpan urutan hasil drag & drop
import type { APIRoute } from 'astro';
import { reorderPortfolios } from '../../../../lib/queries';

export const prerender = false;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.user) return new Response('Unauthorized', { status: 401 });

  try {
    const body = (await request.json()) as { ids?: unknown };
    const ids = Array.isArray(body.ids)
      ? body.ids.filter((id): id is string => typeof id === 'string' && UUID.test(id))
      : [];

    if (ids.length === 0) {
      return new Response(JSON.stringify({ error: 'ids wajib diisi' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
    }

    await reorderPortfolios(ids);
    return new Response(JSON.stringify({ ok: true, count: ids.length }), {
      headers: { 'content-type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
};
