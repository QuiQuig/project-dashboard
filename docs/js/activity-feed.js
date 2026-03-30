/**
 * ActivityFeed — renders recent events timeline
 */
const ActivityFeed = (() => {
  const iconMap = {
    commit: { cls: 'commit', label: 'C' },
    closed: { cls: 'closed', label: '&#10003;' },
    reopened: { cls: 'opened', label: '&#8634;' },
    opened: { cls: 'opened', label: '+' },
    labeled: { cls: 'labeled', label: 'L' },
    assigned: { cls: 'assigned', label: 'A' },
  };

  function getIcon(item) {
    if (item.type === 'commit') return iconMap.commit;
    return iconMap[item.event] || { cls: 'default', label: '?' };
  }

  function formatTime(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 14) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  }

  function describeEvent(item) {
    if (item.type === 'commit') {
      return `<strong>${DashboardUtils.escapeHtml(item.author || 'Unknown')}</strong> committed: ${DashboardUtils.escapeHtml(item.message)}`;
    }
    const actor = item.actor ? `<strong>${DashboardUtils.escapeHtml(item.actor)}</strong>` : 'Someone';
    const issue = item.issue ? ` #${item.issue.number} ${DashboardUtils.escapeHtml(item.issue.title)}` : '';
    return `${actor} ${DashboardUtils.escapeHtml(item.event || 'updated')}${issue}`;
  }

  function render(activity) {
    const container = document.getElementById('activityFeed');

    if (!activity || activity.length === 0) {
      container.innerHTML = '<div class="empty-state">No recent activity</div>';
      return;
    }

    container.innerHTML = activity.slice(0, 30).map(item => {
      const icon = getIcon(item);
      return `
        <div class="activity-item">
          <div class="activity-icon ${icon.cls}">${icon.label}</div>
          <div class="activity-content">
            <div class="activity-text">${describeEvent(item)}</div>
          </div>
          <div class="activity-time">${formatTime(item.createdAt)}</div>
        </div>
      `;
    }).join('');
  }

  return { render };
})();
