/**
 * App — orchestrator, project switcher, initialization
 */
const App = (() => {
  let projects = [];
  let currentProject = null;

  async function init() {
    try {
      projects = await DataLoader.loadProjects();
      populateSwitcher();

      if (projects.length > 0) {
        await loadProject(projects[0].id);
      }
    } catch (err) {
      console.error('Failed to initialize dashboard:', err);
      showError('Failed to load dashboard configuration. Make sure projects.json exists and data has been fetched.');
    }
  }

  function populateSwitcher() {
    const switcher = document.getElementById('projectSwitcher');
    switcher.innerHTML = projects.map(p =>
      `<option value="${p.id}">${DashboardUtils.escapeHtml(p.displayName)}</option>`
    ).join('');

    switcher.addEventListener('change', () => {
      loadProject(switcher.value);
    });
  }

  async function loadProject(projectId) {
    currentProject = projectId;

    try {
      const { meta, issues, activity } = await DataLoader.loadProjectData(projectId);

      // Update header
      document.querySelector('.header-title').textContent = meta.displayName || meta.projectTitle;
      document.getElementById('lastUpdated').textContent =
        `Last updated: ${new Date(meta.fetchedAt).toLocaleString()}`;

      // Render all components with error isolation
      const components = [
        { name: 'StatusOverview', fn: () => StatusOverview.render(meta, issues) },
        { name: 'TimelineHealth', fn: () => TimelineHealth.render(issues) },
        { name: 'PhaseProgress',  fn: () => PhaseProgress.render(meta) },
        { name: 'ActivityFeed',   fn: () => ActivityFeed.render(activity) },
        { name: 'IssueTable',     fn: () => IssueTable.render(issues) },
        { name: 'PriorityChart',  fn: () => PriorityChart.render(meta) },
        { name: 'BurndownChart',  fn: () => BurndownChart.render(issues) },
        { name: 'GanttChart',     fn: () => GanttChart.render(issues) },
      ];

      for (const { name, fn } of components) {
        try {
          fn();
        } catch (err) {
          console.error(`Component ${name} failed to render:`, err);
        }
      }

    } catch (err) {
      console.error(`Failed to load project ${projectId}:`, err);
      showError(`Failed to load data for "${projectId}". Run the fetch script first: GITHUB_TOKEN=<token> node scripts/fetch-project-data.js`);
    }
  }

  function showError(message) {
    const main = document.getElementById('dashboardMain');
    main.innerHTML = `
      <div class="card">
        <div class="card-body">
          <div class="empty-state" style="color: var(--color-danger);">
            ${DashboardUtils.escapeHtml(message)}
          </div>
        </div>
      </div>
    `;
  }

  // Auto-init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { loadProject };
})();
