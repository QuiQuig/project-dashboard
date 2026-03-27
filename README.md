# Project Dashboard

A standalone project management dashboard that visualizes GitHub Project boards. Hosted on GitHub Pages, styled for Microsoft Teams embedding, and auto-updates via GitHub Actions.

## Features

- **Status Overview** — clickable metric cards showing total, done, in progress, and blocked items
- **Timeline Health** — at-a-glance banner indicating on track / at risk / behind schedule
- **Gantt Chart** — estimated vs actual timelines per issue
- **Phase Progress** — progress bars grouped by project phase
- **Priority Breakdown** — donut chart by priority level
- **Burndown Chart** — ideal vs actual completion over time
- **Issue Table** — sortable and filterable by status/priority
- **Activity Feed** — recent commits, closures, and events
- **Multi-Project Support** — switch between projects via dropdown

## Tech Stack

- Vanilla HTML/CSS/JS (no framework, no build step)
- [Apache ECharts](https://echarts.apache.org/) for charts
- GitHub Actions for automated data fetching
- GitHub Pages for hosting
- Microsoft Teams / Fluent UI styling

## Setup

1. **Clone the repo**

2. **Create a Classic Personal Access Token** with `repo` and `read:project` scopes

3. **Add it as a repo secret:**
   ```
   gh secret set PROJECT_TOKEN
   ```

4. **Configure projects** — edit `docs/projects.json`:
   ```json
   [
     {
       "id": "my-project",
       "projectNumber": 1,
       "owner": "your-username",
       "repo": "your-repo",
       "displayName": "My Project"
     }
   ]
   ```

5. **Fetch data locally:**
   ```
   GITHUB_TOKEN=<your-token> node scripts/fetch-project-data.js
   ```

6. **Preview locally:**
   ```
   python3 -m http.server 8000 -d docs
   ```

7. **Enable GitHub Pages** — repo Settings > Pages > Source: `main` branch, `/docs` folder

## Data Pipeline

The GitHub Action runs every 6 hours (and on push to main). It queries the GitHub Projects GraphQL API for project items, custom fields, and recent activity, then writes JSON to `docs/data/`. GitHub Pages serves the static files.

## Teams Integration

Add a **Website** tab in a Teams channel and paste the GitHub Pages URL. The CSS is responsive down to 320px.

## License

[MIT](LICENSE)
