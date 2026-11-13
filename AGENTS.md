<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, but it invokes Vite through `vp dev` and `vp build`.

## Vite+ Workflow

`vp` is a global binary that handles the full development lifecycle. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

### Start

- create - Create a new project from a template
- migrate - Migrate an existing project to Vite+
- config - Configure hooks and agent integration
- staged - Run linters on staged files
- install (`i`) - Install dependencies
- env - Manage Node.js versions

### Develop

- dev - Run the development server
- check - Run format, lint, and TypeScript type checks
- lint - Lint code
- fmt - Format code
- test - Run tests

### Execute

- run - Run monorepo tasks
- exec - Execute a command from local `node_modules/.bin`
- dlx - Execute a package binary without installing it as a dependency
- cache - Manage the task cache

### Build

- build - Build for production
- pack - Build libraries
- preview - Preview production build

### Manage Dependencies

Vite+ automatically detects and wraps the underlying package manager such as pnpm, npm, or Yarn through the `packageManager` field in `package.json` or package manager-specific lockfiles.

- add - Add packages to dependencies
- remove (`rm`, `un`, `uninstall`) - Remove packages from dependencies
- update (`up`) - Update packages to latest versions
- dedupe - Deduplicate dependencies
- outdated - Check for outdated packages
- list (`ls`) - List installed packages
- why (`explain`) - Show why a package is installed
- info (`view`, `show`) - View package information from the registry
- link (`ln`) / unlink - Manage local package links
- pm - Forward a command to the package manager

### Maintain

- upgrade - Update `vp` itself to the latest version

These commands map to their corresponding tools. For example, `vp dev --port 3000` runs Vite's dev server and works the same as Vite. `vp test` runs JavaScript tests through the bundled Vitest. The version of all tools can be checked using `vp --version`. This is useful when researching documentation, features, and bugs.

## Common Pitfalls

- **Using the package manager directly:** Do not use pnpm, npm, or Yarn directly. Vite+ can handle all package manager operations.
- **Always use Vite commands to run tools:** Don't attempt to run `vp vitest` or `vp oxlint`. They do not exist. Use `vp test` and `vp lint` instead.
- **Running scripts:** Vite+ built-in commands (`vp dev`, `vp build`, `vp test`, etc.) always run the Vite+ built-in tool, not any `package.json` script of the same name. To run a custom script that shares a name with a built-in command, use `vp run <script>`. For example, if you have a custom `dev` script that runs multiple services concurrently, run it with `vp run dev`, not `vp dev` (which always starts Vite's dev server).
- **Do not install Vitest, Oxlint, Oxfmt, or tsdown directly:** Vite+ wraps these tools. They must not be installed directly. You cannot upgrade these tools by installing their latest versions. Always use Vite+ commands.
- **Use Vite+ wrappers for one-off binaries:** Use `vp dlx` instead of package-manager-specific `dlx`/`npx` commands.
- **Import JavaScript modules from `vite-plus`:** Instead of importing from `vite` or `vitest`, all modules should be imported from the project's `vite-plus` dependency. For example, `import { defineConfig } from 'vite-plus';` or `import { expect, test, vi } from 'vite-plus/test';`. You must not install `vitest` to import test utilities.
- **Type-Aware Linting:** There is no need to install `oxlint-tsgolint`, `vp lint --type-aware` works out of the box.

## Review Checklist for Agents

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to validate changes.

<!--VITE PLUS END-->

# This repo

The landing page for the two hero pickers. It links out to
[owheropicker.com](https://www.owheropicker.com) and
[valorantpicker.com](https://www.valorantpicker.com), and nothing else lives
here — no picker logic, no shared components with either site.

Unlike the two picker repos, this one has no framework: it is plain HTML and
Tailwind CSS, built by Vite itself. That means `vp build` really is the build
(in the pickers it is `next build`), and the whole site is `index.html`,
`404.html`, `src/style.css` and the two fonts in `src/fonts/`.

There is no JavaScript, deliberately — both HTML entries link `src/style.css`
directly, so the build emits a stylesheet and no bundle. Adding a script means
adding a `<script type="module">` entry back and accepting a JS payload on a
page that currently needs none.

Both HTML entries are listed in `vite.config.ts` under
`build.rollupOptions.input`. A new page has to be added there or Vite will not
emit it — only `index.html` is discovered automatically. Tailwind's `@source`
lines at the top of `src/style.css` need the same addition, or classes used
only by the new page get dropped from the CSS.

## Assets

`public/imgs/` holds the two picker logos (resized from the masters in each picker
repo's `images/logo/`). They are copies on purpose, so this repo has no build-time dependency on its siblings. If
a logo changes upstream, re-export it by hand and re-run `npm run generate-og`,
which draws the same files onto the social card.

The Discord, GitHub and coffee icons are inline SVG symbols at the top of
`index.html`, filled with `currentColor`, so they always match the link text.
Every secondary link (Discord, GitHub, Buy me a coffee) uses the same `.link`
style; keep new ones consistent with it rather than turning one into a button.

`src/fonts/` holds latin-only subsets of Sofia Sans and Sofia Sans Extra
Condensed (SIL OFL, licence alongside). They are referenced from
`src/style.css` so Vite fingerprints them, and the headline face is preloaded
from both HTML entries — keep that `href` pointing at the same file.

The design is flat on purpose: no gradients, glows or gradient text. Colours
are the slate tokens in `src/style.css`, and the two game accents are used for
underlines and markers only, because the Valorant red does not reach text
contrast on the tiles.

Hero and agent icons are deliberately not here: a page whose only job is to send
people to one of two links does not need a roster of portraits, and they were
the bulk of what it downloaded.

`public/og.png` and `public/apple-touch-icon.png` are generated and committed:

```
npm run generate-og
```

Re-run it only when the branding or the wording on the social card changes, and
look at the result — the card draws its text with whatever fonts the machine
running it has installed. It cannot use the page's fonts: sharp's bundled
renderer does not read WOFF2.

# Dependencies

Dependencies use caret ranges; the lockfile holds the exact versions. Do not
replace a range with an exact version — that is what blocks `vp update`.

- `npm run deps:check` - report Node.js alignment plus pending minor/patch and major updates
- `npm run deps:update` - apply everything the existing ranges allow (lockfile-only, non-breaking)
- `npm run deps:update:major` - interactively cross major boundaries; requires review and testing

Never apply a major update without reading its changelog and running `vp check`
and `vp build`.

## Node.js version

The target Node.js major is declared in three places that must always agree:
`engines.node`, `devEngines.runtime.version` (both in `package.json`), and the
`@types/node` major. `npm run deps:check` verifies this and reports a mismatch.

Changing it is a deliberate, standalone change: run `vp env pin <major>`, then
update `engines.node` and `@types/node` to match in the same commit.
