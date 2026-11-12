# Deskcloud — Build Plan

> **Status: complete.** All nine PRs in §8 shipped (#20–#28). §11 lists where the build differed from this plan.

> **For Claude Code:** This is the source of truth for the Deskcloud feature in this repo.
> Every decision in §2 is **final**. Don't re-open them, swap libraries, or add scope.
> Work **one PR at a time** from §8. Stop when that PR's *Done when* checks pass, then report back.
> If something in this plan conflicts with the actual code, stop and ask; don't guess.

Suggested location in the repo: `docs/deskcloud-plan.md`

---

## 1. What we're building

**Deskcloud** is an interactive showcase page in my portfolio, at **`/lab/deskcloud`**. It's inspired by Deskland (an adaptive Windows wallpaper), but the name, copy and art are all original.

The hero is a **live, fake desktop**: a soft sky where clouds drift and **part around the desktop icons**. Drag an icon and the clouds reflow around its new spot. Below the hero is a short landing page: how it works, features, FAQ, a waitlist and a footer.

Goals, in order:
1. A portfolio piece that looks great and shows real engineering: a canvas engine, performance, accessibility and tests.
2. A learning project.
3. Keep a path open to a real Windows app later. The waitlist measures interest, and the engine logic is plain TypeScript.

---

## 2. Decisions (final)

| Topic | Decision |
|---|---|
| Location | Inside this repo. A new route group `(lab)` with its **own layout** (no portfolio Nav/Footer/frame). URL `/lab/deskcloud`. |
| Stack | Existing stack only: Next.js 16 (App Router), React 19, TypeScript, Tailwind 4, next-themes, Resend, Upstash. **No new runtime dependencies.** Only new dev dependency: `vitest`. |
| Rendering | **Canvas 2D**, hand-written. No PixiJS, Three.js, SVG scene or image assets. GSAP is allowed for page UI only, never for the scene. |
| Art style | **Procedural, flat**: everything drawn in code from palettes. (Changed after launch to soft, shaded clouds; see §11.) |
| Themes | **One theme at launch: Sky.** Clouds part around icons, with small accents (birds by day, stars by night). Built as a theme config so more themes can be added later. |
| Day / night | Follows the site's **light/dark theme** (`next-themes` `resolvedTheme`): light → day sky, dark → night sky. Smooth palette cross-fade on toggle. |
| Icons | 5–7 HTML `<button>` icons layered over the canvas. Drag (mouse and touch), **+ New file**, **Reset**, open on double-click (mouse) or tap (touch) for real links: CV, GitHub, case study, home. |
| Mobile / a11y | Touch drag works, with fewer icons on small screens. `prefers-reduced-motion` → static, settled scene (no drift; reflow is instant). Icons can be moved with the arrow keys. |
| Performance | Pause when the canvas is off-screen (IntersectionObserver) or the tab is hidden (`visibilitychange`). DPR capped at **2**. Render capped at **30 fps**. The engine is loaded client-side lazily (`next/dynamic`, `ssr: false`). |
| Page sections | Hero (live demo) → How it works (3 steps) → Features (4 cards) → FAQ → Waitlist → Footer. **No pricing section.** |
| Waitlist | `POST /api/waitlist` → zod validation + honeypot → rate limit → `SADD` the email into an Upstash Redis set → Resend notification **to me only**. No confirmation email to the signer. One-line privacy note under the form. |
| i18n | English only, but **all copy lives in `content/en.ts`** (a typed dictionary). No i18n library yet. |
| Discoverability | Add a `deskcloud` entry to `src/data/projects.ts` (case study + Selected Work + command palette pick it up automatically). Add `/lab/deskcloud` to `sitemap.ts`. |
| Tests | **Vitest** for the engine's pure logic only (grid, clearance field, cloud placement and reflow). Added to CI. |
| Workflow | One PR per step in §8, following `notes.md`: feature branch → PR → CI → Vercel preview → squash merge. |

### Out of scope (don't build)
- Pricing, payments and checkout
- A downloadable Windows app or installer
- A second theme (Meadow is a later stretch goal, not part of this plan)
- Languages other than English
- A confirmation email to waitlist signups
- Any change to the look of the existing homepage or case study pages
- Copying Deskland's text, images, icons or name

---

## 3. Facts about the current repo (verified)

- `src/app/layout.tsx` (root) currently renders **everything** for every page: fonts, `ThemeProvider` (`attribute="class"`), `DeferredCursor`, `DeferredCommandPalette`, `SmoothScroll` (Lenis), the skip link, the frame wrappers, `FrameShell`, `Nav`, `<main id="main">`, `Footer`, `Analytics` and `SpeedInsights`.
  → A route-group layout can't remove the Nav/Footer while they live in the root layout. **PR 0 moves them into `(site)/layout.tsx`.**
- ⚠️ Spotted while reading: the root layout wraps `FrameShell` in `div.bg-frame > div.bg-background`, and `FrameShell` renders the **same** two wrappers again, so the frame is nested twice. Check the preview in PR 0. If it's unintended, keep only `FrameShell`'s wrappers (it's the one with the GSAP corner animation).
- `src/lib/rate-limit.ts` builds its own `Redis` client and only exports `checkContactLimit` (prefixes `portfolio:contact:*`). It fails open if Upstash env vars are missing.
- `src/app/api/contact/route.ts` pattern: parse JSON → honeypot (`website`) → zod `safeParse` → rate limit → Resend `from: "Portfolio <onboarding@resend.dev>"` to `CONTACT_TO_EMAIL`. The Resend client is created inside the handler so `next build` doesn't need the key.
- Env vars in `.env.example`: `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`. **No new env vars are needed.**
- `CommandPalette.tsx` and `SelectedWork.tsx` both map over `projects` from `src/data/projects.ts`, so a new project entry shows up in both automatically.
- The case study page opens `links.live` with `target="_blank"`.
- `sitemap.ts` lists `/` and every `/projects/[slug]`.
- `Cursor.tsx` hides over `input, textarea, select`, switches to "link" mode over `a, button, [role='button'], summary`, and has a `[data-cursor]` mode. Check what it shows before using it on icons.
- Theme tokens are in `src/app/globals.css` (`--background`, `--foreground`, `--card`, `--muted`, `--primary`, `--frame`; `.dark` overrides). Dark mode is class-based: `@custom-variant dark`.
- Fonts: `font-display` (Bricolage Grotesque), `font-sans` (Geist), `font-mono` (JetBrains Mono).
- CI (`.github/workflows/ci.yml`): Node 22 → `npm ci` → `lint` → `typecheck` → `build`. There's no test step yet.
- Path alias: `@/*` → `./src/*`.

---

## 4. Target folder structure

```
src/
  app/
    layout.tsx                      # SLIMMED: html/body, fonts, metadata, ThemeProvider,
                                    # DeferredCursor, DeferredCommandPalette, Analytics, SpeedInsights
    (site)/
      layout.tsx                    # NEW: SmoothScroll, skip link, FrameShell, Nav, <main>, Footer
      page.tsx                      # MOVED from app/page.tsx (URL unchanged: /)
      projects/[slug]/...           # MOVED from app/projects (URLs unchanged)
    (lab)/
      layout.tsx                    # NEW: SmoothScroll, skip link, LabHeader, <main id="main">, LabFooter
      lab/deskcloud/
        page.tsx                    # NEW: the Deskcloud page (server component + metadata)
        opengraph-image.tsx         # NEW: OG image (sky gradient + "Deskcloud" title)
    api/
      contact/route.ts              # unchanged
      waitlist/route.ts             # NEW
    sitemap.ts                      # + /lab/deskcloud
    robots.ts, icon.tsx, opengraph-image.tsx   # stay at app root, unchanged
  features/
    deskcloud/
      content/en.ts                 # ALL user-facing copy (typed)
      icons.ts                      # initial icon set + links
      themes/
        types.ts                    # Theme, Palette types
        sky.ts                      # the Sky theme (day + night palettes, tunables)
        index.ts
      engine/                       # pure TS; only renderer.ts and loop.ts touch the DOM
        types.ts                    # Rect, Puff, Cloud, EngineOptions...
        random.ts                   # seeded PRNG (mulberry32)
        grid.ts                     # occupancy grid from icon rects
        field.ts                    # clearance (distance) field + gradient sampling
        clouds.ts                   # placement, drift, reflow (pure, step(dt))
        accents.ts                  # birds (day), stars (night), sun/moon placement
        renderer.ts                 # draws a frame to CanvasRenderingContext2D
        loop.ts                     # rAF loop with 30 fps cap + pause/resume
        engine.ts                   # public API used by React (see §5.6)
        __tests__/
          grid.test.ts
          field.test.ts
          clouds.test.ts
      components/
        DeskcloudHero.tsx           # section: SSR headline + lazy demo
        DeskcloudCanvas.tsx         # "use client": owns <canvas> + engine instance
        DemoDesktop.tsx             # "use client": canvas + IconLayer + toolbar, holds icon state
        IconLayer.tsx
        DesktopIcon.tsx
        DemoToolbar.tsx             # + New file, Reset
        HowItWorks.tsx
        Features.tsx
        Faq.tsx                     # <details>/<summary>, no JS needed
        WaitlistForm.tsx            # "use client": React Hook Form + zod (same pattern as ContactForm)
        LabHeader.tsx               # "← Back to portfolio" + ThemeToggle
        LabFooter.tsx               # "Concept project by John Ford Actub" + links
  lib/
    redis.ts                        # NEW: shared lazy getRedis() (null if not configured)
    rate-limit.ts                   # REFACTOR: use getRedis(); add checkWaitlistLimit()
    waitlist-schema.ts              # NEW: zod { email, website (honeypot) }
vitest.config.mts                   # NEW
```

---

## 5. Engine design

All sizes are in CSS pixels; the renderer multiplies by DPR at draw time.

### 5.1 Inputs
- `obstacles: Rect[]`: the bounding boxes of the icons, relative to the canvas, sent by React whenever icons move, including **live during a drag**, throttled to one update per frame.
- `mode: "day" | "night"`
- `reducedMotion: boolean`
- `size: { width, height }` from a `ResizeObserver`

### 5.2 Occupancy grid (`grid.ts`)
- Cell size `theme.cellSize` (default **12 px**).
- `blocked: Uint8Array`, 1 if the cell centre lies inside any obstacle **expanded by `theme.iconPadding`** (default **20 px**).
- Rebuild only when obstacles or size change.

### 5.3 Clearance field (`field.ts`)
- `clearance: Float32Array`: for each cell, the distance in px to the nearest blocked cell. Use a **two-pass chamfer distance transform** (3-4 weights, scaled to px). It's simple and fast enough at this grid size.
- If there are no obstacles, clearance = `Infinity`.
- `sample(x, y)` → bilinear clearance at any point.
- `gradient(x, y)` → central-difference gradient (points **away** from icons).

### 5.4 Clouds (`clouds.ts`, pure)
- A **cloud** = `{ x, y, vx, puffs: Puff[] }`. A **puff** = `{ restDx, restDy, r, dx, dy, scale, vdx, vdy }`.
- **Placement** (on init and resize): seeded random. The cloud count comes from `theme.density × area`. Reject centres whose clearance is below `0.8 × cloud radius` (up to N tries). Each cloud is 4–7 puffs arranged in a flat-bottomed cluster.
- **Drift:** `x += vx × dt`. Wrap horizontally with a margin so clouds re-enter smoothly.
- **Reflow (the key effect),** for each puff at world position `p`:
  - `c = field.sample(p)`
  - if `c < r`: **target offset** = rest offset + `normalize(gradient(p)) × (r − c) × theme.pushStrength`, and **target scale** = `max(theme.minScale, c / r)`
  - otherwise the target is the rest offset and scale 1, so the cloud regrows when an icon moves away
  - Ease `dx, dy, scale` toward their targets with a **critically damped spring** (`theme.stiffness`). This gives the smooth "parting" and "regrowing" motion.
- `settle(steps)`: run N fixed steps without drift. Used for reduced motion, the first paint, and while paused.

### 5.5 Accents (`accents.ts`)
- **Sun / moon:** placed at the highest-clearance cell in the top third of the canvas, then eased to new spots when icons move. So the sun also avoids icons.
- **Day:** 2–3 small "V" birds flying in horizontal lanes with high clearance.
- **Night:** a seeded star field. Skip stars in blocked cells, add a gentle twinkle (off with reduced motion), and use moonlit cloud colours.

### 5.6 Renderer, loop and public API
- `renderer.ts`: vertical sky gradient → sun/moon → back clouds → front clouds → accents. Flat two-tone clouds: a shadow pass (circles offset +y, shadow colour), then a main pass. Palettes are lerped by `modeT ∈ [0,1]` (day→night) over **~800 ms**.
- `loop.ts`: `requestAnimationFrame`. Accumulate time and only step + render when ≥ **33.3 ms** has passed (30 fps). Clamp `dt` to avoid jumps after tab switches. Exposes `start/stop`.
- `engine.ts`:

```ts
createEngine(canvas: HTMLCanvasElement, opts: { theme: Theme; seed?: number }): {
  setSize(width: number, height: number, dpr: number): void; // dpr already capped at 2
  setObstacles(rects: Rect[]): void;
  setMode(mode: "day" | "night"): void;      // animated cross-fade
  setReducedMotion(on: boolean): void;       // on → stop loop, settle(), draw once on every change
  pause(): void;
  resume(): void;
  destroy(): void;
}
```

### 5.7 React wiring
- `DeskcloudHero` (server component) renders the **headline, subhead and CTAs as SSR HTML**, so they're good for SEO and LCP, over a **CSS gradient placeholder** that matches the day/night sky. The demo loads via `next/dynamic(() => import("./DemoDesktop"), { ssr: false })`.
- `DemoDesktop` holds icon state and the toolbar. `DeskcloudCanvas` creates the engine in an effect, wires up `ResizeObserver`, `IntersectionObserver`, `visibilitychange`, `matchMedia('(prefers-reduced-motion: reduce)')` and `useTheme().resolvedTheme`, and destroys everything on unmount.
- The canvas is `aria-hidden="true"`. All interaction happens on the HTML icons.

---

## 6. Icons (demo behaviour)

- **Desktop grid:** icons snap to slots (≈ **88 × 96 px**, column-major from the top-left, like Windows) on drop. During a drag they follow the pointer freely. On drop they snap to the nearest **free** slot.
- **Initial set** (`icons.ts`, labels in `content/en.ts`), using `lucide-react` glyphs:
  - `resume.pdf` → `site.cvPath` (new tab)
  - `GitHub` → `site.links.github` (new tab)
  - `How I built this` → `/projects/deskcloud`
  - `Portfolio` → `/`
  - 2–3 decorative files (`notes.txt`, `photos`, `todo.md`). Opening one does a small wiggle; there are no fake windows.
  - Small screens (< 640 px): show only 4 icons (CV, GitHub, How I built this, one decorative).
- **Drag:** Pointer Events with `setPointerCapture`, `touch-action: none` on icons only (page scrolling elsewhere still works with Lenis). Treat it as a drag only after moving > 5 px.
- **Open:** mouse → `dblclick`; touch → a tap with no drag; keyboard → `Enter`.
- **Keyboard:** icons are focusable `<button>`s; arrow keys move the focused icon by one slot. Accessible name: e.g. "resume.pdf. Press Enter to open, arrow keys to move."
- **+ New file:** adds `New file (n).txt` at the first free slot (max 12 icons total).
- **Reset:** restores the initial set and positions.
- Icon state is kept in **slot units**, so it survives resize. On resize, clamp icons into the visible slot range.

---

## 7. Page content (`content/en.ts`)

All copy is original. Don't reuse Deskland's wording. Suggested starting copy (edit freely):

- **Hero:** headline: *"A sky that makes room for your files."*; subhead: one sentence explaining that the clouds drift around your desktop icons and reshape when you move them; CTAs: **Join the waitlist** (scrolls to `#waitlist`) and **How I built it** (`/projects/deskcloud`). A small hint: *"Try dragging an icon."*
- **How it works (3 steps):** It sees where your icons are → It keeps them clear → It reshapes when you move things.
- **Features (4 cards):** Knows your icons (only positions; this demo runs fully in your browser) · Reshapes as you go · Easy on your battery (30 fps, pauses when hidden) · Day and night (follows your theme).
- **FAQ (4–6):** Is this a real app? (A concept. A Windows version might come; join the waitlist.) · Does it read my files? · Will it slow my computer down? · Does it work on phones? · Mac? · Is the code public?
- **Waitlist:** heading, the email field, the button, and the privacy line: *"I'll only use your email to tell you if Deskcloud becomes a real app. No spam, no sharing."*
- **Footer:** "Deskcloud is a concept project by John Ford Actub." Links: Portfolio · Case study · GitHub.
- **Metadata:** title `Deskcloud`, description = subhead, canonical `/lab/deskcloud`, OG image from `opengraph-image.tsx`.

---

## 8. Build order: one PR each

Every PR's **Done when** includes: `npm run lint`, `npm run typecheck`, `npm test` (from PR 1 on), and `npm run build` all pass; the Vercel preview has been checked on desktop **and** phone; and existing pages look unchanged.

### PR 0: Split layouts (day 1, morning) · `refactor/route-groups`
- Slim `app/layout.tsx` to the parts that apply site-wide (see §4).
- Create `app/(site)/layout.tsx` with SmoothScroll, skip link, FrameShell, Nav, `<main id="main">` and Footer. Move `page.tsx` and `projects/` into `(site)`.
- Check the double-frame issue from §3 and fix it if unintended.
- Create `app/(lab)/layout.tsx` and a placeholder `app/(lab)/lab/deskcloud/page.tsx` ("Coming soon").
- **Done when:** `/` and `/projects/*` look identical to production (compare side by side), `/lab/deskcloud` renders without the portfolio Nav/Footer, and the theme toggle, command palette and cursor still work everywhere.

### PR 1: Vitest + grid + field (day 1) · `feat/deskcloud-engine-grid`
- Add `vitest` (dev), `vitest.config.mts` (`environment: "node"`, alias `@` → `./src`, include `src/**/*.test.ts`), the script `"test": "vitest run"`, and a `npm test` step in CI after typecheck.
- Implement `types.ts`, `random.ts`, `grid.ts`, `field.ts`.
- **Tests:** cells inside padded rects are blocked; clearance is 0 on blocked cells and grows with distance; the gradient points away from a single obstacle; no obstacles → `Infinity`; the same seed → the same random sequence.

### PR 2: Clouds, renderer, loop on a bare canvas (days 2–3) · `feat/deskcloud-engine-clouds`
- Implement `clouds.ts`, `accents.ts` (day only for now), `renderer.ts`, `loop.ts`, `engine.ts`, and the Sky **day** palette in `themes/sky.ts`.
- On `/lab/deskcloud`, a full-width canvas with **hard-coded** obstacle rects (temporary).
- **Tests:** with a fixed seed, after `settle(200)` no puff circle overlaps a padded obstacle by more than a small tolerance; moving an obstacle and settling again also leaves no overlap; with no obstacles, every puff returns to its rest offset and scale 1; horizontal wrap keeps the cloud count constant.
- **Done when:** clouds visibly part around the fake rects and stay smooth on a mid-range phone. **Checkpoint:** if this isn't working by the end of day 3, simplify (fewer puffs, larger cells) before moving on.

### PR 3: Icons (day 4) · `feat/deskcloud-icons`
- `DemoDesktop`, `IconLayer`, `DesktopIcon`, `DemoToolbar`, `icons.ts`. Replace the hard-coded rects with real icon rects, including live updates during a drag.
- Slots, drag/snap, + New file, Reset, open behaviours and keyboard moves, all as in §6.
- **Done when:** everything in §6 works with mouse, touch (real phone) and keyboard only.

### PR 4: Theme system + day/night (day 5) · `feat/deskcloud-themes`
- Move every colour and tunable into `themes/sky.ts` (day + night palettes, density, cellSize, iconPadding, pushStrength, minScale, stiffness).
- Night accents (moon, stars), wiring to `resolvedTheme`, and the 800 ms cross-fade.
- **Done when:** flipping the site toggle (and the command palette's theme action) cross-fades the sky smoothly, with no flash on first load in either mode.

### PR 5: Mobile, reduced motion, performance (day 6) · `feat/deskcloud-perf`
- IntersectionObserver + `visibilitychange` pause, DPR cap of 2, the 30 fps cap verified, the reduced-motion static mode, the < 640 px icon set, and a lazy `next/dynamic` import.
- **Done when:** the Chrome Performance panel shows no rAF work while the canvas is scrolled away or the tab is hidden; with reduced motion on (OS setting), the scene is static and still reflows instantly on drop; and Lighthouse mobile on the preview is no worse than the homepage (Performance in the high 80s, Accessibility 100).

### PR 6: Page sections + content (days 7–8) · `feat/deskcloud-page`
- `content/en.ts`, `DeskcloudHero` (SSR text + placeholder), `HowItWorks`, `Features`, `Faq`, `LabHeader`, `LabFooter`, page metadata, and `opengraph-image.tsx`.
- Visual style: reuse the existing tokens and fonts (`font-display` for headings, `font-mono` for small labels) so it feels like part of the portfolio, while the sky gives the page its own personality.
- **Done when:** the page reads well at 360 px, 768 px and 1440 px in both themes; headings are in order (one `h1`); and all text comes from `content/en.ts`.

### PR 7: Waitlist (day 9) · `feat/deskcloud-waitlist`
- `lib/redis.ts`: a lazy `getRedis()` that returns `null` if env vars are missing. Refactor `rate-limit.ts` to use it, with **no behaviour change** for the contact form.
- Add `checkWaitlistLimit(ip)`: per-IP 5 / 10 min, global 200 / day, prefixes `portfolio:waitlist:ip` / `portfolio:waitlist:global`, failing open like the contact limiter.
- `lib/waitlist-schema.ts`: `{ email: trimmed, lowercased, max 120, valid email; website: optional honeypot }`.
- `api/waitlist/route.ts`, mirroring the contact route: parse → honeypot (pretend success) → validate (422) → limit (429 + `Retry-After`) → if no Redis: 500 "Server not configured" → `SADD deskcloud:waitlist <email>` → **only if newly added**, send a Resend email to `CONTACT_TO_EMAIL` (subject `Deskcloud waitlist: new signup`) → always return `{ ok: true }` (don't reveal whether an email was already on the list). A Resend failure is logged but doesn't fail the signup, since the email is already stored.
- `WaitlistForm`: React Hook Form + zod resolver, states idle / sending / done / error / rate-limited, a hidden honeypot field, and the privacy line.
- **Done when:** a signup on the preview lands in Redis and notifies me; a duplicate signup returns ok without a second email; a spam burst hits 429; and the contact form still works.

### PR 8: Case study, discoverability, polish (day 10) · `feat/deskcloud-case-study`
- Add a `deskcloud` entry to `src/data/projects.ts`: client "Personal project", role "Design & front-end", year 2026, stack groups, problem, approach (Engine, Icons, Performance, Accessibility, Waitlist), outcome, `links.live: "/lab/deskcloud"`, repo link, and images (day + night screenshots, plus a short animated GIF of clouds parting). Note: the live link currently opens in a new tab. Leave it unless it feels wrong.
- Add `/lab/deskcloud` to `sitemap.ts`. Add a "Deskcloud" line to the README highlights.
- Final pass: focus states, both themes, a real-phone check, and Lighthouse.
- **Done when:** Deskcloud appears in Selected Work and the command palette, its case study renders, and the sitemap includes the lab URL.

---

## 9. Case study outline (for `projects.ts`)

- **Problem:** Desktop wallpapers ignore what's on your desktop. Could the scenery make room for your files instead?
- **Approach:**
  - *Engine:* occupancy grid → distance field → spring-based reflow; why Canvas 2D and no library.
  - *Icons:* real HTML buttons over the canvas for accessibility; slot snapping; live reflow while dragging.
  - *Performance:* 30 fps cap, pausing when off-screen or hidden, DPR cap, lazy loading; before/after numbers.
  - *Accessibility:* keyboard moves, reduced-motion static mode, SSR headline.
  - *Waitlist:* reuse of the contact form's validation and rate-limit patterns; duplicate-safe Redis set.
- **Outcome:** what I learned, Lighthouse scores, waitlist signups so far, and what a Windows version would reuse (the whole `engine/` minus the renderer).

---

## 10. Suggested `CLAUDE.md` (add to the repo root if it doesn't exist)

```md
# Portfolio — notes for Claude Code

## Commands
- Dev: `npm run dev` · Lint: `npm run lint` · Types: `npm run typecheck` · Tests: `npm test` · Build: `npm run build`
- Before saying a change is done, run lint, typecheck, test and build.

## Workflow
- Never commit to `main`. One small PR per change: branch → PR → CI → Vercel preview → squash merge (see notes.md).
- Branch names: `feat/...`, `fix/...`, `refactor/...`, `docs/...`.

## Conventions
- Next.js App Router, React 19, TypeScript strict, Tailwind 4 with tokens from `src/app/globals.css`.
- Respect `prefers-reduced-motion` for every animation.
- Don't add runtime dependencies without asking.
- Copy for Deskcloud lives in `src/features/deskcloud/content/en.ts`. No hard-coded strings in components.

## Current work
- Deskcloud: follow `docs/deskcloud-plan.md`, one PR at a time. Its decisions are final.
```

### How to run it with Claude Code
1. Put this file at `docs/deskcloud-plan.md` and add the `CLAUDE.md` above (PR: `docs/deskcloud-plan`).
2. For each step, start Claude Code with a prompt like:
   *"Read docs/deskcloud-plan.md. Implement **PR 0** only, on branch `refactor/route-groups`. Follow the Done-when checks, run lint/typecheck/build, and stop before opening the PR so I can review."*
3. Review the Vercel preview yourself before merging. Then move to the next PR.

---

## 11. What shipped differently

Recorded after the build, so this document stays an accurate record.

| PR | Change from the plan | Why |
|---|---|---|
| 0 | Removed the doubled frame wrappers, so the frame border is half as thick as before (12/24 px instead of 24/48 px). Added a root `not-found.tsx` that wraps 404s in the site shell. | The double frame was unintended (§3). Unmatched URLs only get the root layout, so the split had left the 404 page unframed. |
| 1 | Vitest 4.1 instead of 5.x. | Vitest 5 requires `@types/node` 22 or later; 4.1 works with the repo's `^20`. |
| 2 | Puffs shrink by the clearance at their *pushed* position, not `c / r` at rest. Puffs resting inside an icon's padding fade to scale 0. | The plan's formula pushed puffs aside *and* shrank them, so clouds broke into tiny blobs. Inside the padding the field is flat, so there's no direction to push. |
| 2 | Added `Puff.vscale` and `Cloud.layer`, plus extra theme tunables. Cloud density 1.6 instead of 1. | The scale spring needs its own velocity; back and front layers need a flag. At density 1 the sky looked bare. |
| 2 | Reduced motion was wired into the canvas in PR 2 rather than PR 5. | The repo rule is that every animation respects reduced motion. |
| 3 | GitHub uses the `CodeXml` glyph. Added screen-reader announcements; New file uses `aria-disabled` at the cap. | `lucide-react` v1 has no brand icons. |
| 4 | Renamed the sun to "orb" (the sun by day, the moon by night). | One position and placement rule for both. |
| 5 | The small-screen icon set landed in PR 5, not PR 3. | PR 5 lists it explicitly. |
| 6 | The waitlist section shipped first with a "form opens soon" note. The page stayed `noindex` until PR 8. | The hero's CTA needed a target before the form existed. |
| 7 | Also fixed the contact form, which showed the generic error instead of the rate-limit message on a 429. | Found while mirroring the contact form. |
| 8 | Deskcloud is added at the end of `projects.ts`. The case study's outcome has no Lighthouse scores or sign-up counts yet. | Keeps the existing projects' order. The numbers couldn't be measured during the build and weren't invented. |
| After launch | The sky became the home page hero's background. The engine gained `setOrbTop` (keep the sun and moon below a sticky header) and fades the orb out when no spot has room. | On the hero the canvas runs up behind the navbar, and on phones the top of the hero has no open sky. |
| After launch | Flat two-tone clouds became soft, shaded puffs stamped from cached sprites (one per layer and light side, rebuilt only when colours change). Clouds are lit from the sun's side, back clouds are softer and partly transparent, the sky has a third stop for horizon haze, and the sun has a glow and a wide halo. The sun and moon scale with the canvas (7% of its shorter side, 40–90 px). The day sky is deeper. | The flat style read as clip art behind the portfolio's hero. Sprites keep the per-frame cost low: about 0.33 ms of JavaScript per frame at 1280×800, up from about 0.14 ms. |
| After launch | The engine gained `setPalettes` (swap the day and night palettes) and `setMoonPhase` (shade the unlit part of the moon). The home hero uses them for dawn and golden-hour tints and the real moon phase over San Fernando, Pampanga; the demo keeps the plain Sky theme and a full moon. | Part of making the hero's sky follow the real time of day. |
| After launch | The sun and moon can follow an arc (`setOrbArc`): rising on the left at the horizon, highest at local noon, setting on the right. The hero and the demo place them from the real time over San Fernando, Pampanga (the moon from its phase, good to about an hour), and hide them below the horizon. `setOrbBlockers` limits what the orb fades behind; on the hero only the name. The demo now shows the full live sky, with a line saying whose sky it is. | Placement by open space looked arbitrary next to real time-of-day colours and moon phase. |
| After launch | More clouds: density 2.4 instead of 1.6. The sun is drawn as a light source: a tight corona added onto the sky, then a disc that is near white in the middle with a slightly warmer, soft rim (limb darkening). The moon is a lit body: pale highlands darkening toward the limb, its seas (maria) roughly where they really are (each built from a few overlapping soft blobs so the edges are ragged), Tycho as a bright point, a blurred terminator, and earthshine showing through the dark side. | The sky looked sparse, and the flat sun and moon didn't match the soft shaded clouds. |
