// src/pages/admin/api/portfolio/[id].ts
import type { APIRoute } from 'astro';
import { getPortfolio, updatePortfolio, softDeletePortfolio } from '../../../../lib/queries';
import { portfolioUpdateSchema } from '../../../../lib/validation/portfolio';

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
  if (!locals.user) return new Response('Unauthorized', { status: 401 });
  try {
    const row = await getPortfolio(params.id!);
    if (!row) return new Response('Not found', { status: 404 });
    return new Response(JSON.stringify(row), { headers: { 'content-type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
};

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  if (!locals.user) return new Response('Unauthorized', { status: 401 });
  try {
    const raw = (await request.json()) as Record<string, unknown>;
    const parsed = portfolioUpdateSchema.parse(raw);
    // Hanya update field yang benar-benar dikirim (cegah default Zod menimpa data).
    const allowed = new Set(Object.keys(raw ?? {}));
    const data = Object.fromEntries(
      Object.entries(parsed).filter(([key]) => allowed.has(key)),
    );
    const row = await updatePortfolio(params.id!, data);
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
    await softDeletePortfolio(params.id!);
    return new Response(null, { status: 204 });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
};
