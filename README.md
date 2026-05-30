# Sentinels in Syrius — documentation

Evidence-backed documentation for **implementing a Sentinel service node that runs from
inside the Syrius wallet**. The thesis: Syrius already runs a full Zenon node in-process and
serves RPC from it, so the framework to be a Sentinel is already in the codebase — finishing
it is a buildable extension, and the MVP needs no consensus change.

The docs are written for both human contributors and AI coding agents. Claims about Syrius
carry `file:line` receipts into the `syrius/` submodule (or its pinned `znn_sdk_dart` SDK,
which is not vendored here), and provenance is tagged (`[DOC]` documented · `[INF]` inferred
· `[OPEN]` unresolved).

## What's here

```
docs/
  intro.md                         Overview / landing
  understanding/                   What a Sentinel is (and why the papers disagree)
  evidence/investigation.md        Forensic proof the framework is in Syrius (+ raw Q&A appendix)
  specification/                   The design contract (v1, peer-reviewed)
  implementation/                  Build roadmap + AI agent guide
  community/forum-post.md          Community-facing pitch
syrius/                            Syrius source, git submodule (pinned v0.2.4-alphanet)
static/llms.txt                    AI index of the doc set
```

This repo is a [Docusaurus](https://docusaurus.io) site deployed to GitHub Pages.

## Run the site locally

```bash
git clone --recurse-submodules <this-repo>
cd wer-sentinels
npm install
npm start            # dev server at http://localhost:3000
```

If you already cloned without `--recurse-submodules`:

```bash
git submodule update --init --recursive
```

Build the static site:

```bash
npm run build        # output in ./build
npm run serve        # preview the production build
```

## Deploying

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds and publishes to
GitHub Pages. **Before the first deploy, update these fields** in `docusaurus.config.js` to
match your repository:

- `url` — e.g. `https://<org>.github.io`
- `baseUrl` — `/<repo-name>/` (for a project site) or `/` (for a user/org site)
- `organizationName` / `projectName`

Then enable GitHub Pages for the repo with **Source: GitHub Actions**.

## Editing conventions

- Keep `file:line` references accurate against the pinned `syrius/` submodule; if the
  submodule is bumped, re-verify them.
- Preserve the provenance tags — don't promote `[INF]`/`[OPEN]` to `[DOC]` without a cited
  source.
- `.md` files are processed as CommonMark (see `markdown.format: 'detect'`), so inline `<`
  and `{` in prose are safe; use code fences for anything code-like.
