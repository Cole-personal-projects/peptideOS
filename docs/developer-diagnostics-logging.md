# Developer Diagnostics Logging

PeptideOS diagnostics must not expose an in-app developer console or local report viewer. Client diagnostics are emitted as sanitized events to `/api/client-diagnostics`, then written as `client-diagnostic` JSON lines from the server runtime.

## Current Signal

- Bottom-nav pointer/click intent.
- Bottom-nav route completion or route stall.
- Client JavaScript errors and unhandled promise rejections.
- Same-origin API failures, excluding the diagnostics endpoint itself.
- Long main-thread tasks over the configured threshold.

The payload intentionally excludes user notes, lab values, emails, compound names, protocol names, and local record data.

## Where To Read Logs

For live debugging on Cloudflare Workers, use Cloudflare Workers Logs or `wrangler tail` and filter for:

```text
client-diagnostic
```

For retained/searchable logs, use Cloudflare Workers Logs, Workers Logpush, or a Tail Worker that forwards only `client-diagnostic` events to an external logging destination.

Recommended production shape:

1. Keep `/api/client-diagnostics` as the app ingestion endpoint.
2. Keep the endpoint payload sanitized and bounded.
3. Use Cloudflare Workers Logs for immediate inspection.
4. Use Workers Logpush or a Tail Worker for retention, alerting, and search.
5. Do not add app-visible developer tooling unless it is behind a separate admin surface, not the user app.

Reference docs:

- Cloudflare Workers Logs: https://developers.cloudflare.com/workers/observability/logs/workers-logs/
- Cloudflare Workers Logpush: https://developers.cloudflare.com/workers/observability/logs/logpush/
- Cloudflare Tail Workers: https://developers.cloudflare.com/workers/observability/logs/tail-workers/
