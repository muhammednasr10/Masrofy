# Masrofy agent notes

Masrofy is a Vite + React + TypeScript app. Routing uses React Router. Do not add Next.js APIs (`next/link`, `next/navigation`, `app/` route handlers, or middleware).

## Run

- `npm run dev` starts Vite at http://localhost:3000
- `npm run build` writes the static app to `dist`
- `npm start` serves `dist` and the Node API in `server/`

## Data

The browser talks to Supabase with the anon key. Public env vars still use the `NEXT_PUBLIC_` prefix; Vite exposes that prefix.

These actions need server secrets and live in `server/api.ts`:

- `DELETE /api/account/delete`
- `POST /api/admin/notify-category-suggestion`
- `GET /api/cron/due-notifications`

On Vercel, `api/` re-exports those handlers and `vercel.json` publishes the Vite build plus the daily cron. Local Vite mounts the same handlers through `server/plugin.ts`.

## Checks

`npm run lint` covers TypeScript. `npm run typecheck` and `npm test` should pass before a change is finished.
