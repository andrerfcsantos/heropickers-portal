# Hero Pickers

Landing page for the hero pickers — a single static page that introduces both
sites and links out to them.

- **Website:** https://heropickers.com
- **Overwatch Hero Picker:** https://www.owheropicker.com ([source](https://github.com/andrerfcsantos/overwatch-hero-picker))
- **Valorant Agent Picker:** https://www.valorantpicker.com ([source](https://github.com/andrerfcsantos/valorant-agent-picker))

## Tech Stack

- [Vite](https://vite.dev/) via [Vite+](https://viteplus.dev) — no framework, the
  page is hand-written HTML
- [Tailwind CSS](https://tailwindcss.com/)
- [Oxlint + Oxfmt](https://oxc.rs/), through `vp check`

The page ships no JavaScript at all: the stylesheet is linked straight from the
HTML entries, so Vite emits CSS and nothing else.

`vp build` emits a plain static site into `dist/` that can be served by any
webserver. Deployment is to Cloudflare Workers static assets via
[Wrangler](https://developers.cloudflare.com/workers/wrangler/).

## Building the site from source

### Prerequisites

- [Node.js](https://nodejs.org/en/) 24 (the active LTS line)

The required major is declared in `package.json` in two places: `engines.node`,
which makes `npm install` fail on the wrong major (`engine-strict=true` is set in
`.npmrc`), and `devEngines.runtime`, which [Vite+](https://viteplus.dev) uses to
download and select the right runtime automatically. `@types/node` is kept on the
same major so the types match what actually runs.

### Running the site

- Clone the repo
- `cd` into the repo folder
- `vp install` to install the dependencies
- Then:
  - `vp dev` to serve the site on localhost in development mode
  - `vp build` to write the production build to `dist/`
  - `vp preview` to serve that build on localhost
  - `vp check` to run formatting, linting and type checks

`dist/` is self-contained — copy it to any webserver and point the document root
at it. `404.html` is the not-found page; configure the server to serve it on a
miss (the bundled Cloudflare config already does).

## Layout

| Path                      | What it is                                                    |
| ------------------------- | ------------------------------------------------------------- |
| `index.html`              | The landing page itself                                       |
| `404.html`                | Not-found page                                                |
| `src/style.css`           | Tailwind entry plus the fonts, theme tokens and link styles   |
| `src/fonts/`              | Self-hosted Sofia Sans fonts (SIL OFL)                        |
| `public/imgs/`            | The two picker logos                                          |
| `scripts/generate-og.mts` | Regenerates the committed `og.png` and `apple-touch-icon.png` |

Both HTML files are registered in `vite.config.ts` under
`build.rollupOptions.input`; Vite only discovers `index.html` on its own.

## Deploying

```bash
npm run deploy   # vp build && wrangler deploy
npm run upload   # vp build && wrangler versions upload
npm run deploy:preview   # vp build && wrangler preview
```

`deploy:preview` publishes a [Workers Preview](https://developers.cloudflare.com/workers/previews/)
named after the current Git branch (override with `-- --name <name>`). It
prints a Preview URL that tracks the branch's latest deploy, plus a unique URL
for that deployment. Preview settings live in the `previews` block of
`wrangler.jsonc`; it is empty because the site has no bindings. Preview URLs
are public unless access controls are configured.

To have a Preview built and linked on every pull request, enable preview builds
for the Worker in Workers Builds (Cloudflare dashboard → the Worker → Settings →
Builds).

## Upgrading dependencies

Every dependency is declared as a caret range, so `vp update` is free to move
within a major. The lockfile is what pins exact versions.

| Command               | What it does                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------- |
| `npm run deps:check`  | Reports the Node.js version alignment and splits pending updates into minor/patch and major |
| `npm run deps:update` | Applies every minor/patch update the declared ranges already allow                          |

`deps:update` is the routine one — it only moves the lockfile, so `package.json`
stays untouched and the changes are non-breaking by semver. Run `vp check` and
`vp build` afterwards and commit `package-lock.json`.

Major updates widen a range in `package.json` and need real testing. Read the
changelog, then take one package at a time with `vp add <name>@latest` (add `-D`
for a devDependency), which writes the new caret range. The `vite` alias is the exception: it moves
with `vite-plus`, so `deps:check` leaves it out of both lists. Validate with `vp check`
and `vp build` before committing. (Vite+ rejects `vp update --latest` and
`--interactive` in npm projects.)

`vite-plus` and the `vite` alias (`@voidzero-dev/vite-plus-core`) move as a
pair: each Vite+ release requires one exact core build, which
`npm view vite-plus@<version> dependencies.vite` prints. Both are caret ranges, so a
routine update can pick a core the installed CLI rejects, and `vp build` then
stops and asks for `vp migrate`. `npm run deps:check` compares the two in the
lockfile and fails on a mismatch. To fix it, set the `vite` devDependency and
the `vite` override to the exact core version and run `vp install`, then put the
`^` back on both and run `vp install` again. The lockfile keeps the exact
version, and a caret alone would not move a newer, already locked core back
down. `vp migrate` also writes exact pins; turn them back into caret ranges the
same way. The direct `vite` devDependency is there so npm hoists the core to the
top of `node_modules`; without it `vp test` cannot resolve `vite`.

Bumping `@types/node` across a major is a Node.js upgrade, not a types upgrade.
Do it together with `vp env pin <major>` and a matching `engines.node`, in one
commit — `npm run deps:check` reports it if the three ever disagree, and
fails with `--ci`.

`npm run deps:check -- --ci` exits non-zero when the Node.js declarations are out
of sync or when in-range updates are pending, which makes it usable as a CI gate.
A Vite+ mismatch, or a `vp outdated` that failed (for example, the registry is
unreachable), fails `deps:check` with or without `--ci`.

## Disclaimer

This site links to fan-sites for Overwatch and Valorant. It is not affiliated
with, endorsed or sponsored by Blizzard Entertainment or Riot Games. All rights
belong to their respective owners.
