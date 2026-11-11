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

## Local environment
- `.env.local` holds real Resend and Upstash keys. Don't submit the contact or waitlist forms against them while testing; mock or stub the API instead.
- A dev server is often already running on port 3000; use another port for a second server.

## Deskcloud
- Built and shipped from `docs/deskcloud-plan.md` (PRs #20–#28). The plan records what changed along the way in §11.
- Engine logic (`src/features/deskcloud/engine`) is plain TypeScript with Vitest tests; only `renderer.ts` and `loop.ts` touch the DOM.
