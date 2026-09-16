# Feegow · Nova Agenda (prototype)

Interactive prototype of the redesigned Feegow agenda, exported from the
[Claude Design project "Feegow Agenda redesign"](https://claude.ai/design/p/1cf7c9d1-0074-4aa1-a0e9-e94a5ffead33).

## Two live versions

| URL | What it is | Owner |
|-----|-----------|-------|
| https://cristianecruz-doc.github.io/feegow-new-agenda/ | **Default** — mirrors the Claude Design project (currently: waitlist / Lista de espera) | design, synced by the `design-to-github-pages` skill |
| https://cristianecruz-doc.github.io/feegow-new-agenda/designer/ | Dev build — the docked/minimizable booking side panel (PR #2) | dev (@rafalziolek) |

The two diverged in August 2026: the side panel exists only in the dev build,
the waitlist only in the design project. Keeping both URLs means neither branch
of work overwrites the other while the team decides how to reconcile them
(see PR #3).

**Syncing rules**

- A design sync overwrites the root (`index.html`, `src/`, `transicao/`, `assets/`)
  and must never touch `designer/` or `olddesign/`.
- `designer/` is a frozen copy of the dev version. To refresh it, copy the dev
  files into the folder deliberately — it has no automatic updates.

**Local patches (re-apply after every sync)**

Upstream copies overwrite these, so each sync must put them back:

1. `transicao/legacy-shell.jsx` — edition hrefs `New Agenda.html#…` → `index.html#…`
   (one per edition: `#final`, `#expansion`, `#mvp`).
2. `src/shell.jsx` — Legado href → `legado.html`.
3. `src/recurrence.jsx` line 30 — `(rule.dow || []).slice()` →
   `(Array.isArray(rule.dow) ? rule.dow : []).slice()`. **Crash fix**: the monthly
   preset passes `dow` as a number (`{freq:'month', nth, dow: 3}`) while `rcLabel`
   unconditionally treats it as an array, so picking "Mensal na(o) …" white-screens
   the whole prototype. Fix it in the Claude Design project to retire this patch.

## Running locally

Static site — serve the folder over HTTP (Babel loads the JSX modules via fetch,
so opening `index.html` directly from the filesystem won't work):

```bash
python3 -m http.server 4173
# → http://localhost:4173
```

## Structure

- `index.html` — entry point (`New Agenda.html` in the design project)
- `src/*.jsx` — React modules, compiled in-browser by Babel standalone
- `assets/` — Feegow / Doctoralia logos
- `SPEC.md` — design spec the prototype implements

Mock data is generated relative to the real current date, so the agenda is
always "alive" whenever it's opened. Follows the Watson design system
(customer / web / light).
