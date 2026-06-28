# peptideOS

This is a [Next.js](https://nextjs.org) project bootstrapped with [v0](https://v0.app).

## AI Protocol Assistant

Describe a protocol in plain English (e.g. "BPC-157 250mcg twice daily and TB-500 2.5mg twice weekly for 8 weeks") and the assistant builds the stack and dosing schedules for you. Open it from **Stacks → AI** or **More → AI Assistant**.

It is powered by Claude Haiku (`claude-haiku-4-5`) through a server-side API route — the API key never reaches the browser, and per-request cost is a fraction of a cent. The assistant only structures what you write; it never invents doses or gives recommendations.

**Setup:** set `ANTHROPIC_API_KEY` as a server environment variable (locally in `.env.local`; in production as a Worker secret — see Deployment below). Without the key, the rest of the app works normally and the assistant shows a setup hint.

## Deployment (Cloudflare Workers)

The app deploys to Cloudflare Workers via [OpenNext](https://opennext.js.org/cloudflare). `.github/workflows/deploy.yml` deploys every merge to `main` once two repository secrets are set (GitHub → Settings → Secrets and variables → Actions):

- `CLOUDFLARE_API_TOKEN` — Cloudflare dashboard → My Profile → API Tokens → "Edit Cloudflare Workers" template
- `CLOUDFLARE_ACCOUNT_ID` — Cloudflare dashboard → Workers & Pages → right sidebar

One-time after the first deploy, set the AI assistant key as a Worker secret:

```bash
pnpm exec wrangler secret put ANTHROPIC_API_KEY
```

Private beta gate:

- Production Workers set server-only `BETA_GATE_ENABLED=true` in `wrangler.jsonc`.
- Set the server-only Supabase service key in Cloudflare before inviting testers:

```bash
pnpm exec wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

- Optionally set a dedicated beta cookie signing secret. If omitted, the service-role key is used for signing:

```bash
pnpm exec wrangler secret put BETA_GATE_COOKIE_SECRET
```

- Apply Supabase migrations, then provision invite rows by storing SHA-256 code hashes in `beta_invite_codes`. Do not commit raw beta keys.

```bash
supabase db push
```

Only SHA-256 invite hashes are stored; share raw invite codes out of band. Redeeming stores a signed httpOnly beta access cookie and an email grant.

Manual deploy from a machine with Cloudflare credentials: `pnpm run deploy`. Local preview in the Workers runtime: `pnpm preview`.

Production diagnostics are emitted as sanitized `client-diagnostic` log lines from the Worker. For live triage:

```bash
pnpm diagnostics:tail
```

See `docs/developer-diagnostics-logging.md` for JSON capture, retention, and alerting options.

## Installing on iPhone

1. Open the deployed URL (`https://peptideos.<your-subdomain>.workers.dev` or a custom domain) in Safari.
2. Tap the Share button → **Add to Home Screen**.
3. Launch it from the home screen — it runs fullscreen as an installed PWA, works offline, and stores all data on the device.

## Built with v0

This repository is linked to a [v0](https://v0.app) project. You can continue developing by visiting the link below -- start new chats to make changes, and v0 will push commits directly to this repo. Every merge to `main` will automatically deploy.

[Continue working on v0 →](https://v0.app/chat/projects/prj_8fjYgC5ejDia6PqOi6rDHSsuwpKz)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Learn More

To learn more, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [v0 Documentation](https://v0.app/docs) - learn about v0 and how to use it.

<a href="https://v0.app/chat/api/kiro/clone/ColeMatthewBienek/peptideOS" alt="Open in Kiro"><img src="https://pdgvvgmkdvyeydso.public.blob.vercel-storage.com/open%20in%20kiro.svg?sanitize=true" /></a>
