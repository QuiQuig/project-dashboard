/**
 * StatusOverview — renders metric cards and completion bar
 */
const StatusOverview = (() => {
  function render(meta) {
    const stats = meta.stats || {};
    document.getElementById('metricTotal').textContent = stats.total || 0;
    document.getElementById('metricDone').textContent = stats.done || 0;
    document.getElementById('metricInProgress').textContent = stats.inProgress || 0;
    document.getElementById('metricBlocked').textContent = stats.blocked || 0;

    const pct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
    document.getElementById('completionPct').textContent = pct + '%';
    document.getElementById('completionFill').style.width = pct + '%';
  }

  return { render };
})();
