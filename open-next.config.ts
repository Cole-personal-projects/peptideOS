import { defineCloudflareConfig } from '@opennextjs/cloudflare';

// No incremental cache configured: every page is either statically prerendered
// at build time (served from Workers Assets) or rendered on demand. Add the R2
// incremental cache override if ISR/revalidation is introduced later.
export default defineCloudflareConfig();
