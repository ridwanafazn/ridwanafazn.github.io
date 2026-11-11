// src/pages/admin/api/portfolio/[id]/duplicate.ts — clone ke draft baru
import type { APIRoute } from 'astro';
import { getPortfolio, createPortfolio } from '../../../../../lib/queries';

export const prerender = false;

export const POST: APIRoute = async ({ params, locals }) => {
  if (!locals.user) return new Response('Unauthorized', { status: 401 });
  try {
    const source = await getPortfolio(params.id!);
    if (!source) return new Response('Not found', { status: 404 });

    const clone = await createPortfolio({
      slug: `${source.slug}-draft-${Date.now()}`,
      title: `${source.title} (Copy)`,
      role: source.role,
      description: source.description,
      longDescription: source.longDescription,
      techStack: source.techStack,
      highlights: source.highlights,
      links: source.links,
      isTopProject: false,
      status: 'draft',
      order: source.order + 1,
    });

    return new Response(JSON.stringify(clone), {
      status: 201,
      headers: { 'content-type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
};
