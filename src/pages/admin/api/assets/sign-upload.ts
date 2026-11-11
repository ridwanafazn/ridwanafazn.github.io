// src/pages/admin/api/assets/sign-upload.ts
import type { APIRoute } from 'astro';
import { signUploadParams } from '../../../../lib/cloudinary';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.user) return new Response('Unauthorized', { status: 401 });
  const body = await request.json().catch(() => ({}));
  const folder = typeof body?.folder === 'string' ? body.folder : 'portfolio';
  return new Response(JSON.stringify(signUploadParams(folder)), {
    headers: { 'content-type': 'application/json' },
  });
};
