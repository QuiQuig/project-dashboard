/**
 * PhaseProgress — renders progress bars per phase
 */
const PhaseProgress = (() => {
  function render(meta) {
    const container = document.getElementById('phaseProgress');
    const phases = meta.phases || {};
    const entries = Object.entries(phases).sort((a, b) => a[0].localeCompare(b[0]));

    if (entries.length === 0) {
      container.innerHTML = '<div class="empty-state">No phase data available</div>';
      return;
    }

    container.innerHTML = entries.map(([name, data]) => {
      const pct = data.total > 0 ? Math.round((data.done / data.total) * 100) : 0;
      return `
        <div class="phase-item">
          <div class="phase-header">
            <span class="phase-name">${DashboardUtils.escapeHtml(name)}</span>
            <span class="phase-count">${data.done}/${data.total} (${pct}%)</span>
          </div>
          <div class="phase-bar">
            <div class="phase-bar-fill" style="width: ${pct}%"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  return { render };
})();
