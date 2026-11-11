// src/middleware.ts — guard admin/preview + edge cache halaman publik
import { defineMiddleware } from 'astro:middleware';
import { auth } from './lib/auth';
import type { Session, User } from 'better-auth';

declare global {
  namespace App {
    interface Locals {
      user: User | null;
      session: Session | null;
    }
  }
}

/** Route publik yang di-cache di edge (60s). */
function isCacheablePublicPath(pathname: string): boolean {
  return (
    pathname === '/' ||
    pathname === '/about' ||
    pathname === '/projects' ||
    pathname.startsWith('/projects/') ||
    pathname === '/sitemap.xml'
  );
}

const PUBLIC_ADMIN_PATHS = ['/admin/login'];

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, locals, redirect } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  // Admin & preview selalu SSR + wajib login.
  const isProtectedArea = path.startsWith('/admin') || path.startsWith('/preview');

  if (!isProtectedArea) {
    const cache = (globalThis as any).caches?.default as Cache | undefined;
    const canCache = request.method === 'GET' && isCacheablePublicPath(path);
    if (!canCache || !cache) return next();

    // ?v=timestamp = bypass total (tidak baca & tidak tulis cache) untuk cek instan.
    const bypass = url.searchParams.has('v');
    // Kunci cache tanpa query string supaya ?utm_*/?fbclid tidak memecah cache.
    const key = new Request(`${url.origin}${path}`, { method: 'GET' });

    if (!bypass) {
      const hit = await cache.match(key);
      if (hit) {
        const headers = new Headers(hit.headers);
        headers.set('x-cache', 'HIT');
        return new Response(hit.body, { status: hit.status, headers });
      }
    }

    const res = await next();
    if (res.status !== 200) return res;

    const headers = new Headers(res.headers);
    headers.set(
      'Cache-Control',
      bypass ? 'no-store' : 'public, s-maxage=60, stale-while-revalidate=300',
    );
    headers.set('x-cache', bypass ? 'BYPASS' : 'MISS');

    const fresh = new Response(res.body, { status: 200, headers });
    if (!bypass) (locals as any).cfContext?.waitUntil?.(cache.put(key, fresh.clone()));
    return fresh;
  }

  const isPublic = PUBLIC_ADMIN_PATHS.some((p) => path.startsWith(p));

  let session: Awaited<ReturnType<typeof auth.api.getSession>> | null = null;
  try {
    session = await auth.api.getSession({ headers: request.headers });
  } catch (err) {
    // DB belum siap (Neon belum diisi) — jangan blokir render halaman.
    console.error('[middleware] session check gagal:', err);
  }

  if (session) {
    locals.user = session.user;
    locals.session = session.session;
  }

  if (!isPublic && !locals.user) {
    return redirect(`/admin/login?redirect=${encodeURIComponent(path)}`);
  }

  if (path === '/admin/login' && locals.user) {
    return redirect('/admin');
  }

  return next();
});
