# Developer Diagnostics Logging

PeptideOS diagnostics must not expose an in-app developer console or local report viewer. Client diagnostics are emitted as sanitized events to `/api/client-diagnostics`, then written as `client-diagnostic` JSON lines from the server runtime.

## Current Signal

- Bottom-nav pointer/click intent.
- Bottom-nav route completion or route stall.
- Client JavaScript errors and unhandled promise rejections.
- Same-origin API failures, excluding the diagnostics endpoint itself.
- Long main-thread tasks over the configured threshold.

The payload intentionally excludes user notes, lab values, emails, compound names, protocol names, and local record data.

## Live Triage

Tail production diagnostics from a machine authenticated with Cloudflare:

```bash
pnpm diagnostics:tail
```

Capture JSON lines for a debugging session:

```bash
pnpm diagnostics:tail:json | tee diagnostics-$(date +%Y%m%d-%H%M%S).jsonl
```

Tail only errored Worker invocations that also include diagnostics:

```bash
pnpm diagnostics:tail:errors
```

Equivalent raw Wrangler command:

```bash
pnpm exec wrangler tail peptideos --search client-diagnostic --format json
```

## Production Smoke

After a deploy, verify the pipeline:

1. Start `pnpm diagnostics:tail`.
2. Open the deployed app on a real device.
3. Tap a bottom-nav item.
4. Confirm `bottom_nav_pointer_down`, `bottom_nav_click`, and `bottom_nav_route_complete` events appear.
5. If the app appears frozen, keep the tail running and look for `bottom_nav_route_stalled`, `client_long_task`, `client_error`, or `client_fetch_*`.

## Retention And Alerts

Live tail is not enough for production support. Use one of these off-app retention paths:

- Cloudflare Workers Logs for searchable operational logs.
- Workers Logpush to send Worker events to an external log destination.
- Tail Worker that filters `client-diagnostic` events and forwards only sanitized diagnostics to a dedicated sink.

Recommended alert candidates:

- `bottom_nav_route_stalled`: page tap did not complete route transition within the stall window.
- `client_long_task`: browser main thread blocked long enough to feel frozen.
- `client_error` or `client_unhandled_rejection`: client runtime error.
- `client_fetch_http_error` with status `>= 500`: server-side/API regression.

Recommended production shape:

1. Keep `/api/client-diagnostics` as the app ingestion endpoint.
2. Keep the endpoint payload sanitized and bounded.
3. Use `pnpm diagnostics:tail` or Cloudflare Workers Logs for immediate inspection.
4. Use Workers Logpush or a Tail Worker for retention, alerting, and search.
5. Do not add app-visible developer tooling unless it is behind a separate admin surface, not the user app.

Reference docs:

- Cloudflare Workers Logs: https://developers.cloudflare.com/workers/observability/logs/workers-logs/
- Cloudflare Workers Logpush: https://developers.cloudflare.com/workers/observability/logs/logpush/
- Cloudflare Tail Workers: https://developers.cloudflare.com/workers/observability/logs/tail-workers/
