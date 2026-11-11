// src/pages/admin/api/portfolio/index.ts
import type { APIRoute } from 'astro';
import { listPortfolios, createPortfolio } from '../../../../lib/queries';
import { portfolioCreateSchema } from '../../../../lib/validation/portfolio';

export const prerender = false;

export const GET: APIRoute = async ({ locals, url }) => {
  if (!locals.user) return new Response('Unauthorized', { status: 401 });
  const status = url.searchParams.get('status') ?? undefined;
  try {
    const rows = await listPortfolios({ status });
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
    const data = portfolioCreateSchema.parse(body);
    const row = await createPortfolio(data);
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
