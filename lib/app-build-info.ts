export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? '1.0.0';
export const APP_BUILD_ID =
  process.env.NEXT_PUBLIC_APP_BUILD_ID ??
  process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ??
  'local';
export const SERVICE_WORKER_CACHE_NAME = 'peptideos-shell-v3';
