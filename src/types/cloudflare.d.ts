// Binding Cloudflare yang dipakai middleware. Tipe Workers lengkap tidak
// di-include global (bentrok dengan DOM), jadi hanya yang dipakai di sini.
interface RateLimiterBinding {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

declare module 'cloudflare:workers' {
  export const env: {
    LOGIN_RATE_LIMIT?: RateLimiterBinding;
  };
}
