// src/pages/admin/api/assets/[id].ts
import type { APIRoute } from 'astro';
import { softDeleteAsset } from '../../../../lib/queries';

export const prerender = false;

export const DELETE: APIRoute = async ({ params, locals }) => {
  if (!locals.user) return new Response('Unauthorized', { status: 401 });
  try {
    await softDeleteAsset(params.id!);
    return new Response(null, { status: 204 });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
};
