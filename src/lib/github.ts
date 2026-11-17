// Kalender kontribusi GitHub (12 bulan) tanpa token.
//
// Sumber: endpoint publik yang dipakai halaman profil GitHub. Tidak ada secret
// dan tidak ada request dari browser. Hasil di-cache 6 jam di Cache API
// (produksi) + memori (dev). Kalau GitHub mengubah markup atau fetch gagal,
// fungsi mengembalikan null dan section tidak dirender — halaman tetap utuh.

const GITHUB_USER = 'ridwanafazn';
const SOURCE = `https://github.com/users/${GITHUB_USER}/contributions`;
const CACHE_KEY = `https://ridwanafazn.my.id/__internal/github-contributions/${GITHUB_USER}`;
const TTL_SECONDS = 6 * 60 * 60;
const FETCH_TIMEOUT_MS = 2500;

export interface GitHubContributions {
  total: number;
  /** 7 level per minggu (0–4); null untuk hari di luar rentang. */
  weeks: (number | null)[][];
  from: string;
  to: string;
}

let memory: { at: number; value: GitHubContributions } | null = null;

function parse(html: string): GitHubContributions | null {
  const totalMatch = /([\d,]+)\s+contributions?\s+in the last year/i.exec(html);
  if (!totalMatch) return null;

  const total = Number(totalMatch[1].replace(/,/g, ''));
  if (!Number.isFinite(total)) return null;

  const cells: { date: string; level: number }[] = [];
  const tdRe = /<td\b[^>]*class="ContributionCalendar-day"[^>]*>/g;
  for (const match of html.matchAll(tdRe)) {
    const tag = match[0];
    const date = /data-date="(\d{4}-\d{2}-\d{2})"/.exec(tag)?.[1];
    const level = /data-level="(\d)"/.exec(tag)?.[1];
    if (date && level !== undefined) cells.push({ date, level: Number(level) });
  }

  // Kalender setahun selalu >300 hari; kalau jauh di bawah itu, markup berubah.
  if (cells.length < 300) return null;

  cells.sort((a, b) => a.date.localeCompare(b.date));
  const first = new Date(`${cells[0].date}T00:00:00Z`);
  const start = new Date(first);
  start.setUTCDate(start.getUTCDate() - start.getUTCDay());

  const weeks: (number | null)[][] = [];
  for (const cell of cells) {
    const date = new Date(`${cell.date}T00:00:00Z`);
    const weekIndex = Math.floor((date.getTime() - start.getTime()) / 604_800_000);
    const week = (weeks[weekIndex] ??= Array<number | null>(7).fill(null));
    week[date.getUTCDay()] = cell.level;
  }

  return {
    total,
    weeks: weeks.map((week) => week ?? Array<number | null>(7).fill(null)),
    from: cells[0].date,
    to: cells[cells.length - 1].date,
  };
}

async function fetchContributions(): Promise<GitHubContributions | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(SOURCE, {
      headers: {
        'user-agent': 'portofx-v2 (+https://ridwanafazn.my.id)',
        accept: 'text/html',
      },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    return parse(await res.text());
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function getGitHubContributions(): Promise<GitHubContributions | null> {
  if (memory && Date.now() - memory.at < TTL_SECONDS * 1000) return memory.value;

  const cache = (globalThis as { caches?: { default?: Cache } }).caches?.default;
  const key = new Request(CACHE_KEY);

  if (cache) {
    try {
      const hit = await cache.match(key);
      if (hit) {
        const value = (await hit.json()) as GitHubContributions;
        memory = { at: Date.now(), value };
        return value;
      }
    } catch {
      // Cache tidak tersedia / isi rusak: lanjut fetch.
    }
  }

  const value = await fetchContributions();
  if (!value) return null;

  memory = { at: Date.now(), value };

  if (cache) {
    try {
      await cache.put(
        key,
        new Response(JSON.stringify(value), {
          headers: {
            'content-type': 'application/json',
            'cache-control': `public, max-age=${TTL_SECONDS}`,
          },
        }),
      );
    } catch {
      // Gagal menulis cache bukan error halaman.
    }
  }

  return value;
}
