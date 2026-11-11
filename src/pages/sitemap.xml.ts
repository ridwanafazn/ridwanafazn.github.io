// src/pages/sitemap.xml.ts — sitemap dinamis (SSR, di-cache 60s oleh middleware)
import type { APIRoute } from 'astro';
import { getAllProjects } from '../lib/content';

export const prerender = false;

export const GET: APIRoute = async ({ site }) => {
  const base = (site?.toString() ?? 'https://ridwanafazn.my.id').replace(/\/$/, '');
  const projects = await getAllProjects();

  const urls = [
    { loc: `${base}/`, priority: '1.0' },
    { loc: `${base}/about`, priority: '0.8' },
    { loc: `${base}/projects`, priority: '0.9' },
    ...projects.map((p) => ({ loc: `${base}/projects/${p.id}`, priority: '0.7' })),
  ];

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((u) => `  <url><loc>${u.loc}</loc><priority>${u.priority}</priority></url>`).join('\n') +
    `\n</urlset>\n`;

  return new Response(xml, {
    headers: { 'content-type': 'application/xml; charset=utf-8' },
  });
};
