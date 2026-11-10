# Campus Arena Development Log

## Stage 1: Technical cleanup and truthful interface (branch `phase-1-cleanup-v2`)

Dates: 2026-11-09 (implementation), 2026-11-10 (re-applied on `phase-1-cleanup-v2` from `main`, requirements re-checked against the files).
Status: **committed locally, not pushed, not deployed, build not yet run.**

Why not pushed: this session's GitHub token is invalid and Claude has no linked GitHub account for write access.
Why build not run: the session has no access to the npm registry, so `npm install`, the lockfile, `npm run lint` and `npm run build` could not run. Run them before merging.

### What changed
- **False claims removed**
  - Rooms page no longer says Django Channels or Redis are integrated. It now says rooms are saved only in this browser and real multiplayer is not built yet.
  - Lobby no longer says "Ethiopian High-Speed Campus LAN Relay". The opponent slot now says multiplayer is not built yet, and the button is "Close Lobby".
  - Leaderboard no longer says "all 48 universities". Home page numbers ("48 campuses", "8,420 matches", "12 tournaments") were invented; they now show real counts (universities listed, playable games, sample tournaments).
  - Profile no longer shows "Verified student". It says "Not verified".
  - Leaderboard "Master Tier" for everyone replaced with "Sample" or "This device".
  - "Official"/"sanction" wording on tournaments removed. Toasts now say the tournament is saved on this device.
  - Chess board says it is a preview and not playable.
  - Joining an unknown room code now says "not found" instead of pretending to connect.
- **Demo data labeled**: a "Preview build" banner under the header; seed tournaments and rooms prefixed "Sample:"; default profile is a blank guest (0 XP, no invented wins or badges).
- **Double-escaping fixed**: removed 32 `escapeHTML()` calls inside React JSX (React already escapes; this showed `&amp;` on screen). Helper kept in `security.ts` with a warning comment.
- **Undefined CSS fixed**: added the `animate-bounce-short` animation (respects reduced-motion).
- **Privacy**: removed Google Fonts and DiceBear avatar requests. App now uses system fonts and a local initials avatar.
- **Dependencies removed (unused)**: express, dotenv, @google/genai, motion, autoprefixer, esbuild, tsx, @types/express.
- **Metadata**: package renamed `campus-arena` v0.1.0; removed AI Studio `metadata.json`, Gemini `.env.example` content, and AI Studio HMR settings in `vite.config.ts`.
- **Netlify**: added `netlify.toml` (build, publish dir, Node 22, basic security headers).

### Files affected
`src/App.tsx`, `src/data.ts`, `src/security.ts`, `src/index.css`, `index.html`, `package.json`, `vite.config.ts`, `.env.example`, `netlify.toml` (new), `metadata.json` (deleted), `DEVELOPMENT_LOG.md` (new).

### Tests performed
- TypeScript check: **partial only.** Dependencies could not be installed (no network), so React types were missing. With missing-library errors filtered out, no new type errors appeared compared with the original code.
- **Production build: NOT run.** **App not opened in a browser.** **No automated tests exist.**
- Searched the source for leftover references to DiceBear, Google Fonts, Django, Redis, "LAN Relay", "48": none remain.

### Problems discovered / still open
- **No `package-lock.json`**: needs network access (`npm install`) and must be committed. Until then, builds on Netlify are not reproducible.
- **No Content-Security-Policy yet**: must be tested against a real build first.
- Game rewards can be farmed by replaying; XP/wins are editable in browser DevTools. Needs a server (Phases 3-4).
- Checkers: 2 players on one device, no kings, forced captures, multi-jumps or win detection. Chess: picture only.
- Quiz question 1 ("pioneering engineering in Bishoftu/Adama") should be fact-checked.

### Features still simulated
Accounts, multiplayer rooms, tournaments and brackets, leaderboard (other rows), chess, student verification. Payments: **none exist and none are activated.**

### Deployment status
Nothing pushed. The live Netlify site still runs the old code from `main`.

### Notes for later phases
- Owner idea: a **premium tier** (leaderboards, prizes, private 1v1 rooms). Charging for it means collecting payments, and prizes funded by player fees may count as gambling. Both are gated on legal review (Phase 8). No payment code, Telebirr number or credentials belong in this repo.
