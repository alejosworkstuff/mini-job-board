# Mini Job Board

A frontend job board application built with vanilla JavaScript that simulates real hiring-platform workflows: searching, filtering, sorting, saved jobs, view preferences, and detail pages.

This project is part of my portfolio focus on production-style frontend engineering without framework abstractions.

## Live Demo

[View Live Demo](https://alejosworkstuff.github.io/mini-job-board/)

---

## Problem and Context

Most junior frontend demos only show static UIs. I wanted to build a project that demonstrates interaction-heavy product behavior: dynamic data rendering, multiple filter combinations, UI state persistence, and clear handling for edge cases like empty results.

## My Role

- Designed and implemented the full frontend architecture
- Created the data flow and filter logic in vanilla JS
- Built reusable UI behavior patterns (dropdowns, modals, toasts, view modes)
- Implemented persisted preferences via localStorage

## Architecture Overview

- `index.html` / `styles.css`: layout, styles, and responsive behavior
- `app.js`: main listing flow, filters, search, sorting, pagination-like loading, saved jobs state
- `job-details.js`: detail page rendering for selected jobs
- `saved-jobs.js`: saved jobs page behavior
- `site-header.js`: shared header/menu interactions
- `data/jobs.json`: source data used to simulate API-like job records

### Data Flow

1. Load `data/jobs.json`
2. Keep original data in memory
3. Apply user inputs (search + filters + sort)
4. Render visible jobs and result counters
5. Persist view/theme/saved-job preferences in localStorage

---

## Key Features

- Real-time search by title and company
- Multi-filter controls (type, seniority) with sorting
- Saved jobs behavior and modal/list workflows
- Job detail view with richer content
- Empty-state handling with fast reset actions
- Theme/view persistence (dark mode and grid/list)
- Responsive layout for smaller screens

## Technical Decisions and Tradeoffs

- **Vanilla JS first:** chosen to prove strong core DOM/event/state skills before relying on frameworks.
- **JSON-based data source:** faster to iterate during UI and logic development than introducing backend complexity.
- **LocalStorage for persistence:** practical for UX continuity, while accepting that this is device-local and non-user-account based.
- **Single-repo static architecture:** ideal for learning and speed, with clear future path to API + auth separation.

---

## CI / Quality Baseline

This project includes a GitHub Actions CI workflow that runs on push and pull requests:

- JavaScript syntax checks for core scripts
- Data schema validation for `data/jobs.json` (required fields, unique IDs, and non-empty arrays)

Note: the CI workflow is fully configured. If GitHub Actions appears as "not started," it may be due to temporary account billing restrictions on hosted runners; the same checks still run locally via `npm run ci`.

Run locally:

```bash
npm install
npm run ci
```

---

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript (ES6+)
- GitHub Actions (CI)
- Node.js (quality scripts)

## Project Structure

```text
mini-job-board/
├── .github/workflows/ci.yml
├── assets/
├── data/jobs.json
├── scripts/validate-jobs.mjs
├── app.js
├── job-details.js
├── saved-jobs.js
├── site-header.js
├── index.html
├── job-details.html
├── saved-jobs.html
├── styles.css
└── package.json
```

## Local Setup

```bash
git clone https://github.com/alejosworkstuff/mini-job-board.git
cd mini-job-board
npm install
npm run ci
```

Then open `index.html` with Live Server (recommended) or a local static server.

---

## Case Study Highlights (Portfolio Use)

- **Challenge:** Combine search, filters, sorting, and persisted preferences without framework state tools.
- **Approach:** Keep source-of-truth data in memory and derive UI from controlled filtering/sorting pipelines.
- **Result:** A realistic, interaction-heavy interface with clean empty states and reusable UX patterns.

## What I Would Improve Next

- Move data access to an API layer (pagination and server-side filtering)
- Add unit/integration/e2e automated tests
- Add accessibility audit and targeted fixes
- Add deployment previews and release notes workflow

## License

MIT
