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
      `<option value="${p.id}">${escapeHtml(p.displayName)}</option>`
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

      // Render all components
      StatusOverview.render(meta);
      TimelineHealth.render(issues);
      PhaseProgress.render(meta);
      ActivityFeed.render(activity);
      IssueTable.render(issues);
      PriorityChart.render(meta);
      BurndownChart.render(issues);
      GanttChart.render(issues);

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
            ${escapeHtml(message)}
          </div>
        </div>
      </div>
    `;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  // Auto-init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { loadProject };
})();
