// src/lib/cloudinary.ts — signed upload + transform URL (tanpa SDK)
import { createHash } from 'node:crypto';
import {
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_UPLOAD_PRESET,
} from 'astro:env/server';

export function signUploadParams(folder = 'portfolio') {
  const timestamp = Math.floor(Date.now() / 1000);
  const params: Record<string, string | number> = {
    timestamp,
    folder,
    upload_preset: CLOUDINARY_UPLOAD_PRESET,
  };
  const toSign =
    Object.keys(params)
      .sort()
      .map((k) => `${k}=${params[k]}`)
      .join('&') + CLOUDINARY_API_SECRET;
  const signature = createHash('sha1').update(toSign).digest('hex');
  return { ...params, signature, api_key: CLOUDINARY_API_KEY };
}

export function getTransformUrl(
  publicId: string,
  opts: { w?: number; h?: number; q?: string; f?: string; c?: string } = {},
) {
  const parts = [`c_${opts.c ?? 'scale'}`, `q_${opts.q ?? 'auto'}`, `f_${opts.f ?? 'auto'}`];
  if (opts.w) parts.push(`w_${opts.w}`);
  if (opts.h) parts.push(`h_${opts.h}`);
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${parts.join(',')}/${publicId}`;
}
