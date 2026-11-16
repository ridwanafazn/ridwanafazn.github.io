// src/middleware.ts — guard admin/preview, edge cache publik, security headers
import { defineMiddleware } from 'astro:middleware';
import { env as cfEnv } from 'cloudflare:workers';
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

type RateLimiter = { limit(options: { key: string }): Promise<{ success: boolean }> };

const PRIVATE_PREFIXES = ['/admin', '/preview', '/api'];
const RATE_LIMITED_PATHS = new Set(['/api/auth/sign-in/email', '/api/auth/sign-up/email']);
const RATE_LIMIT_BINDING = 'LOGIN_RATE_LIMIT';

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

function isPrivatePath(pathname: string): boolean {
  return PRIVATE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

// CSP moderat: script hanya same-origin (+ inline script Astro), gambar dari
// Cloudinary, koneksi upload ke api.cloudinary.com. Tidak ada iframe/object.
function contentSecurityPolicy(isHttps: boolean): string {
  const connect = [
    "'self'",
    'https://api.cloudinary.com',
    'https://res.cloudinary.com',
    // Cloudflare Web Analytics (beacon di-inject edge; aktif di zona ini).
    'https://cloudflareinsights.com',
  ];
  if (!isHttps) {
    // Dev (http) + Vite HMR memakai websocket.
    connect.push('ws:', 'wss:');
  }

  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://res.cloudinary.com",
    "font-src 'self' data:",
    "media-src 'self'",
    `connect-src ${connect.join(' ')}`,
  ];

  if (isHttps) directives.push('upgrade-insecure-requests');

  return directives.join('; ');
}

function applySecurityHeaders(response: Response, pathname: string, isHttps: boolean): Response {
  const headers = new Headers(response.headers);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('X-Frame-Options', 'DENY');
  headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  );
  headers.set('Content-Security-Policy', contentSecurityPolicy(isHttps));

  // HSTS hanya dikirim lewat HTTPS; tanpa includeSubDomains (belum semua
  // subdomain diverifikasi HTTPS) dan tanpa preload.
  if (isHttps) headers.set('Strict-Transport-Security', 'max-age=15552000');

  // Admin, preview, dan API tidak boleh disimpan browser/proxy.
  if (isPrivatePath(pathname)) {
    headers.set('Cache-Control', 'no-store');
    headers.set('Pragma', 'no-cache');
  }

  // 204/304 tidak boleh punya body.
  const nullBody = response.status === 204 || response.status === 304;
  return new Response(nullBody ? null : response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function loginRateLimiter(): RateLimiter | undefined {
  const binding = (cfEnv as Record<string, unknown> | undefined)?.[RATE_LIMIT_BINDING];
  if (!binding || typeof (binding as RateLimiter).limit !== 'function') return undefined;
  return binding as RateLimiter;
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, locals, redirect } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  const isHttps = url.protocol === 'https:';
  // `import.meta.env.DEV` bisa false di dev Cloudflare karena wrangler var
  // NODE_ENV=production; MODE tetap 'development'. Pakai MODE.
  const isDev = import.meta.env.MODE === 'development';
  const done = (response: Response) => applySecurityHeaders(response, path, isHttps);

  // Rate limit login/signup: 10 percobaan / 60 dtk per IP. Kalau binding tidak
  // ada / error, fail-open supaya admin tidak terkunci dari situsnya sendiri.
  if (request.method === 'POST' && RATE_LIMITED_PATHS.has(path)) {
    const limiter = loginRateLimiter();
    if (limiter) {
      const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
      try {
        const { success } = await limiter.limit({ key: `auth:${ip}` });
        if (!success) {
          return done(
            new Response(
              JSON.stringify({
                message: 'Terlalu banyak percobaan masuk. Coba lagi dalam 1 menit.',
              }),
              {
                status: 429,
                headers: {
                  'content-type': 'application/json; charset=utf-8',
                  'retry-after': '60',
                },
              },
            ),
          );
        }
      } catch (err) {
        console.error('[middleware] rate limit gagal:', err);
      }
    }
  }

  // www → apex (301). `www` tetap terpasang sebagai custom domain Worker,
  // tapi seluruh trafik disatukan ke domain kanonik.
  if (url.hostname === 'www.ridwanafazn.my.id') {
    return done(redirect(`https://ridwanafazn.my.id${path}${url.search}`, 301));
  }

  // Trailing slash → 301 ke tanpa slash. Menghindari URL duplikat dan
  // memastikan URL itu masuk allowlist cache (yang memakai path tanpa slash).
  if (path.length > 1 && path.endsWith('/')) {
    return done(redirect(`${url.origin}${path.replace(/\/+$/, '')}${url.search}`, 301));
  }

  // Admin & preview selalu SSR + wajib login.
  const isProtectedArea = path.startsWith('/admin') || path.startsWith('/preview');

  if (!isProtectedArea) {
    const cache = (globalThis as any).caches?.default as Cache | undefined;
    const canCache = request.method === 'GET' && isCacheablePublicPath(path);
    if (!canCache || !cache) return done(await next());

    // ?v=timestamp = bypass instan, HANYA saat dev. Di produksi, siapa pun
    // tidak boleh memaksa origin render (vektor cache-busting/DoS).
    const bypass = isDev && url.searchParams.has('v');
    // Kunci cache tanpa query string supaya ?utm_*/?fbclid tidak memecah cache.
    const key = new Request(`${url.origin}${path}`, { method: 'GET' });

    if (!bypass) {
      const hit = await cache.match(key);
      if (hit) {
        const headers = new Headers(hit.headers);
        headers.set('x-cache', 'HIT');
        return done(new Response(hit.body, { status: hit.status, headers }));
      }
    }

    const res = await next();
    if (res.status !== 200) return done(res);

    const headers = new Headers(res.headers);
    headers.set(
      'Cache-Control',
      bypass
        ? 'no-store'
        : 'public, max-age=60, s-maxage=60, stale-while-revalidate=300',
    );
    headers.set('x-cache', bypass ? 'BYPASS' : 'MISS');

    const fresh = done(new Response(res.body, { status: 200, headers }));
    if (!bypass) (locals as any).cfContext?.waitUntil?.(cache.put(key, fresh.clone()));
    return fresh;
  }

  const isPublic = path.startsWith('/admin/login');

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
    return done(redirect(`/admin/login?redirect=${encodeURIComponent(path)}`));
  }

  if (path === '/admin/login' && locals.user) {
    return done(redirect('/admin'));
  }

  return done(await next());
});
