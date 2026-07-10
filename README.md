# Feegow · Nova Agenda (prototype)

Interactive prototype of the redesigned Feegow agenda, exported from the
[Claude Design project "Feegow Agenda redesign"](https://claude.ai/design/p/1cf7c9d1-0074-4aa1-a0e9-e94a5ffead33).

**Live demo:** https://cristianecruz-doc.github.io/feegow-new-agenda/

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
