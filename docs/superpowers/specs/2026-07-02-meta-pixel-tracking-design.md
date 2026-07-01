# Meta Pixel Tracking & Analytics — Design Spec

**Date:** 2026-07-02
**Status:** Approved, pending implementation plan

## 1. Goal

Add detailed, client-side Meta Pixel tracking across burnesshomes.co.nz so Meta Ads can optimize toward real engagement and leads, and so every enquiry email carries the ad/campaign context that produced it.

## 2. Constraints & context

- The site is static HTML/CSS/vanilla JS, hosted on **GitHub Pages** (no server runtime). Squarespace only handles DNS.
- Page-to-page navigation is handled by **Barba.js** (`js/transitions.js`) — it fetches HTML and swaps a container rather than doing full page reloads, except when the browser genuinely leaves the origin (e.g. the contact form's POST to FormSubmit.co, or the very first load).
- The contact form posts to FormSubmit.co (`contact.html`), which emails a table of whatever named fields are submitted, then redirects back to `contact.html?sent=1`.
- No server-side code exists or is being introduced by this project — **Conversions API is explicitly out of scope**. This is Pixel-only, client-side tracking, with hashed manual Advanced Matching to improve match quality in place of CAPI.
- The Meta Pixel ID is `3217859525090747` (provided by the user) — no placeholder needed.
- No cookie-consent legal requirement applies (NZ business), but a simple, non-blocking, GSAP-animated consent banner is included per user request. It never gates tracking — it's informational only.

## 3. Scope: which pages get what

All real, public-facing pages get the Pixel base code + `js/analytics.js`:

`index.html`, `about.html`, `projects.html`, `services.html`, `listings.html`, `listing-39-dorper-road.html`, `project-25-panama-crescent.html`, `project-1-101-trices-road.html`, `project-22-kahurangi-road.html`, `contact.html`, `template.html` (so future pages created from the template inherit tracking automatically).

Excluded: `kanban.html` (internal tool, not public), `test-about.html`, `test-contact.html`, `test-home.html` (dev scratch pages, unlinked from navigation).

**Funnel pages** (Listings → Listing detail → Contact) get the full "deep" instrumentation (scroll depth, engaged time, gallery interaction, form-start). All other pages still get PageView, Contact-intent clicks (tel/mailto), CTA clicks, and outbound social clicks — just not the scroll/engagement/gallery instrumentation, since those pages aren't the primary ad-landing targets right now.

Barba namespaces in play: `home`, `about`, `builds` (Projects), `project`, `listings`, `listing`, `services`, `contact`.

## 4. Architecture

One new file: **`js/analytics.js`**.

- Contains the Meta Pixel base snippet (using the real Pixel ID above), the full event schema, attribution capture/persistence, contact-form instrumentation, and the consent banner — all in one isolated module so `js/transitions.js` (animation/routing logic) is never touched.
- Integrates with Barba via its public hook API — `barba.hooks.once(...)` for first-load setup and `barba.hooks.after(...)` for every subsequent transition — rather than editing `transitions.js` directly.
- **Script load order** in every page's HTML (bottom of `<body>`, matching existing pattern):
  1. `gsap.min.js`
  2. `ScrollTrigger.min.js`
  3. `barba.umd.js`
  4. **`js/analytics.js`** (new — needs the global `barba` object to register hooks, must run before `barba.init()` is called)
  5. `js/transitions.js` (calls `barba.init()`)
- The Pixel base `<script>` + `<noscript>` fallback `<img>` snippet goes in the `<head>` of each page listed above, right after the existing `<link rel="stylesheet" href="css/global.css">` line, matching Meta's recommended placement.

## 5. Event schema

### Standard Meta Pixel events

| Event | Fires when | Parameters |
|---|---|---|
| `PageView` | Initial load (via the base snippet's own call) + every Barba transition (`barba.hooks.after`) | — |
| `ViewContent` | A `listing` namespace page finishes loading | `content_name` (listing address), `content_category: "Listing"`, `content_ids: [listing-slug]` |
| `Contact` | Any `a[href^="tel:"]` or `a[href^="mailto:"]` click, sitewide (delegated on `document`) | `contact_method: "phone"｜"email"`, `page` (current namespace) |
| `Lead` | Contact form submit is intercepted (see §6) | `content_name` (selected "Service Interested In" value), plus hashed Advanced Matching (`em`, `ph`) re-issued via `fbq('init', PIXEL_ID, { em, ph })` before the track call |

### Custom events (`fbq('trackCustom', ...)`)

| Event | Fires when | Parameters | Scope |
|---|---|---|---|
| `ListingCardClick` | Click on a listing card's image, title, or "View Listing" CTA (delegated) | `listing_id` (slug) | Sitewide |
| `EnquireClick` | Click on any CTA linking to `contact.html` (nav "Enquire", hero/footer/CTA-band buttons, "Enquire about this home") — delegated, excludes same-page anchors on `contact.html` itself | `source_page` (namespace), `cta_label` (link text), `listing_id` (if the click happened on/relates to a listing card) | Sitewide |
| `FormStart` | First `focusin` on any contact-form field | — | Contact page only, fires once per page view |
| `ScrollDepth` | Scroll passes 25/50/75/90% of page height | `depth`, `page` (namespace) | Funnel pages only, each threshold fires once per page view |
| `EngagedTime` | Cumulative *visible-tab* time on page reaches 15s/30s/60s | `seconds`, `page` (namespace) | Funnel pages only, each threshold fires once per page view; timer pauses via the Page Visibility API when the tab isn't active |
| `GalleryInteraction` | Plan-carousel prev/next/dot click, or lightbox open/prev/next click (delegated) | `listing_id` or `project_id`, `slide_index` | Funnel pages only (plan carousel lives on listing detail pages) |
| `OutboundClick` | Click on a footer social icon (delegated on `.footer-social a`) | `network` ("instagram"｜"facebook") | Sitewide |

All per-page-view state (which scroll/engaged thresholds have already fired, whether `FormStart` already fired) resets on every Barba `after` transition and on initial load.

## 6. Lead submission flow (Advanced Matching)

The contact form is intercepted on `submit`:

1. `preventDefault()`.
2. Read the email/phone field values; normalize (trim, lowercase email; strip non-digits from phone) and hash each with SHA-256 via `crypto.subtle.digest` (Meta's required format for manually-supplied Advanced Matching data).
3. Call `fbq('init', '3217859525090747', { em: hashedEmail, ph: hashedPhone })` to attach the matching data, then `fbq('track', 'Lead', { content_name: service })`.
4. Regardless of whether hashing finishes, submit the form for real (`form.submit()`) no later than **400ms** after the intercept began (`Promise.race` against a timeout) — this guarantees the user's submission is never meaningfully delayed or blocked if the Web Crypto call is slow for any reason.
5. A flag on the form element prevents this intercept logic from re-triggering during the programmatic re-submit.

This is optimistic (fires on submit, not on the post-redirect `?sent=1` page), which is what makes the SHA-256 hashing possible — by the time the user is redirected back, the original field values are gone.

## 7. Attribution capture → lead email

On every page load and every Barba transition, the current URL's query string is checked for `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `fbclid`, `gclid`. Each stored record below also captures the **landing page** (`location.pathname` at the moment those params were seen) and a **timestamp**.

- **First-touch**: written once to `localStorage` (`bh_attribution_first`), and never overwritten while less than 30 days old.
- **Last-touch**: written to `localStorage` (`bh_attribution_last`) every time any of those params are present, always overwriting.
- **Last-viewed listing**: whenever a `listing` namespace page loads, its slug + display name are written to `localStorage` (`bh_last_listing`).

On `contact.html`, hidden `<input>` fields are (re-)injected into the form on page load, populated from the stored values above plus `document.referrer` and the current `location.href`:

`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `fbclid`, `gclid` (from the **last-touch** record, since that's the most recent ad interaction), `first_touch_page`, `first_touch_date`, `last_touch_page`, `referring_listing`, `page_referrer` (`document.referrer`).

Because the form already uses `_template: table` with FormSubmit.co, these appear automatically as extra rows in the enquiry email — no FormSubmit configuration changes needed. Fields with no captured value are sent blank rather than omitted, so the email table stays consistently shaped.

## 8. Consent banner

- A fixed bottom bar styled to match the site (`--bg-card` background, `--accent` pill button), shown once per browser (tracked via `localStorage` key `bh_consent_dismissed`) after a ~1s delay on first load only (not re-shown on Barba transitions).
- Copy: a short one-liner noting the site uses tracking to understand traffic and improve ads, with a single "Got it" pill button.
- GSAP animates it in (translateY + fade from the bottom) and, on click, animates it out the same way before removing it from the DOM and setting the dismissed flag.
- Purely informational — never delays or gates any Pixel/event code, per the earlier decision that no legal consent-gating is required.

## 9. Setup steps for the user (post-implementation)

1. In Meta Events Manager, open the Pixel (`3217859525090747`) and enable **Automatic Advanced Matching** for extra match quality on top of the manual `em`/`ph` hashing already being sent — no code change needed for this, it's a toggle in Pixel settings.
2. Install the **Meta Pixel Helper** browser extension and click through the funnel (Listings → a listing → Contact → submit) to confirm every event in §5 fires with the expected parameters.
3. In Events Manager's **Test Events** tool, verify the `Lead` event shows Advanced Matching data (hashed email/phone) attached.
4. In Ads Manager, set the ad campaigns' optimization event to `Lead` (or `ViewContent`/`Contact` for upper-funnel campaigns, as desired).

## 10. Out of scope (for this project)

- Conversions API / any server-side event forwarding (blocked by static hosting; revisit if the site ever moves to a platform with server functions).
- Google Analytics / GTM (not requested).
- Blocking/opt-out consent gating.
- Value/currency parameters on events (no listing prices are published on the site currently).
