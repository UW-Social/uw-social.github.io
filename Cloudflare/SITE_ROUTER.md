# GitHub Pages history routing

The `uw-social-site-router` Worker supports `/events/:id`, `/clubs/:id` and
the other Vue routes while keeping GitHub Pages as the origin. It is separate
from `uw-social-ai`; do not replace or redeploy the AI Worker for this change.

## Deployment order

1. Keep the existing GitHub Pages DNS records and custom-domain configuration.
   The `uw-social.com` DNS record must be proxied (orange cloud).
2. Review existing Workers Routes in the Cloudflare dashboard before deploying.
   This config adds `uw-social.com/*`. Existing more-specific routes such as
   `/api/*` take precedence and must be retained. If a Worker already owns the
   exact `uw-social.com/*` route, integrate the handler with that Worker rather
   than replacing its route.
3. From `Cloudflare/`, install dependencies with `npm ci`, run
   `npm run check:site`, authenticate with `npx wrangler login` if necessary,
   and deploy **the routing Worker first** with `npm run deploy:site`.
   The old hash-based frontend can still load normally during this step.
4. Publish the updated frontend through the existing GitHub Pages workflow.
   Keep `VITE_BASE_PATH=/`. Confirm the built HTML uses `/assets/...` paths so
   nested routes do not request `/events/assets/...`.
5. Verify actual GET responses, not just client-side navigation:

   ```sh
   curl -i https://uw-social.com/events
   curl -i https://uw-social.com/clubs
   curl -i https://uw-social.com/events/REAL_EVENT_ID
   curl -I https://uw-social.com/not-a-page
   ```

   Known application pages should return HTML/200. Unknown paths must retain
   the origin's 404; missing assets and API responses must not become HTML.
   Open a real event in the browser, refresh, and test a legacy `/#/events/ID`
   bookmark (including `returnTo` and `#comments`). Check login, save/delete
   buttons, title links, modifier-clicks and normal card clicks.
6. In Search Console inspect the real event URL and resubmit `/sitemap.xml`.
   The static sitemap lists public landing pages; current event/club title
   links expose detail URLs. Dynamic detail sitemap generation and HTML
   prerendering are separate follow-ups, not provided by this routing Worker.

## How requests are handled

- Known Vue page paths, GET/HEAD only: fetch `/index.html` on the same public
  hostname, without forwarding conditional/range headers or the page query.
- Assets, API paths, other methods and unknown paths: unchanged origin fetch.
- The browser address remains the requested page path. Vue uses history mode.
- Old router hashes are converted before the router starts; normal anchors
  and OAuth hashes are left intact. Canonical and JSON-LD URLs use clean paths.

This must run as a **Route Worker**, not a Worker Custom Domain. Same-zone
Route Worker fetches reach the DNS origin. Do not fetch `uw-social.github.io`
as a replacement origin: its custom-domain redirect would cause a loop.

This does not render event content on the server. Google still needs to run
the Vue app and fetch its public data. An unknown event ID on a valid detail
path still gets the application shell; distinguishing deleted/missing IDs
with HTTP 404 requires a data-aware handler or generated detail pages.

`www` keeps its existing redirect to the apex domain. No new DNS record,
Firebase authorized domain or CORS origin is needed for the production site.

## Rollback

Revert/publish the frontend to hash routing **before** removing the routing
Worker route. Removing the Worker while the frontend uses history routing
will break direct entry and refresh on nested pages. Keep unrelated Workers
Routes, AI configuration and DNS verification records unchanged.
