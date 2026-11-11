// src/pages/admin/api/portfolio/[id]/archive.ts
import type { APIRoute } from 'astro';
import { archivePortfolio } from '../../../../../lib/queries';

export const prerender = false;

export const POST: APIRoute = async ({ params, locals }) => {
  if (!locals.user) return new Response('Unauthorized', { status: 401 });
  try {
    const row = await archivePortfolio(params.id!);
    if (!row) return new Response('Not found', { status: 404 });
    return new Response(JSON.stringify(row), { headers: { 'content-type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
};
