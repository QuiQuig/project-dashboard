/**
 * DashboardUtils — shared utility functions
 */
const DashboardUtils = (() => {
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  return { escapeHtml };
})();
