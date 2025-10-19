# Repository Guidelines

## Project Structure & Module Organization
- The GitHub Pages entry point lives at `index.html`; keep it lean and route rich interactions to the adventure client.
- Core game files sit in `ollamas-adventure/client`: `index.html` bootstraps the canvas UI, `css/` holds shared styling, and `js/` contains gameplay modules (`main.js`, `player.js`, `obstacle.js`, `stages.js`). Add new front-end modules inside `js/` and include them via `<script>` tags at the bottom of the client HTML.
- Use `ollamas-adventure/server` for Node-based helpers such as leaderboards or persistence. Keep database adapters in `database.js` and HTTP logic in `server.js`.

## Build, Test, and Development Commands
- `python3 -m http.server 8000 --directory ollamas-adventure/client` — start a local static server for iterative work, then open `http://localhost:8000`.
- `open ollamas-adventure/client/index.html` (macOS) or `xdg-open ollamas-adventure/client/index.html` (Linux) — quick smoke-test without running a server.
- When you add backend functionality, run it from `ollamas-adventure/server` with `node server.js`; keep environment secrets in an untracked `.env`.

## Coding Style & Naming Conventions
- JavaScript: prefer 4-space indentation, lowercase camelCase for variables/functions (`spawnObstacle`), and PascalCase for constructor-like objects. Group constants at the top of each module.
- HTML: use semantic tags, kebab-case IDs (`start-button`), and descriptive, flat CSS class names (`.game-overlay`). Keep shared styles in `css/`.
- Run Prettier or ESLint before committing once introduced; until then, match the surrounding whitespace and formatting.

## Testing Guidelines
- Manual play-testing is required before every PR: verify jumping, collision detection, score milestones, audio cues, and UI state transitions on desktop and mobile widths.
- For new logic, add temporary console assertions or HUD diagnostics during development and remove them before merging.
- If you introduce automated tests, place them under `ollamas-adventure/tests`, document the command, and target critical game loops first.

## Commit & Pull Request Guidelines
- Follow the existing short, imperative commit style (`git commit -m "Adjust obstacle timing"`). Keep each commit narrowly scoped.
- Pull requests should explain the gameplay impact, list manual test steps, and include screenshots or GIFs for UI changes.
- Link issues when available and call out follow-up tasks so maintainers can track future work.
