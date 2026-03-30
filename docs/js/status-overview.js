/**
 * StatusOverview — renders metric cards with click-to-expand issue lists
 */
const StatusOverview = (() => {
  let allIssues = [];

  function issueMatchesCard(issue, cardType) {
    switch (cardType) {
      case 'total': return true;
      case 'done': return issue.status === 'Done' || issue.state === 'CLOSED';
      case 'in-progress': return issue.status === 'In Progress';
      case 'blocked': return issue.status === 'Blocked';
      default: return false;
    }
  }

  function statusBadgeClass(status) {
    const map = { 'Done': 'badge-done', 'In Progress': 'badge-in-progress', 'Todo': 'badge-todo', 'Blocked': 'badge-blocked', 'Backlog': 'badge-backlog' };
    return map[status] || 'badge-todo';
  }

  function showPopover(card, cardType) {
    // Close any existing popover
    closePopover();

    const matching = allIssues.filter(i => issueMatchesCard(i, cardType));
    if (matching.length === 0) return;

    const popover = document.createElement('div');
    popover.className = 'metric-popover';
    popover.id = 'metricPopover';

    const label = { 'total': 'All Items', 'done': 'Done', 'in-progress': 'In Progress', 'blocked': 'Blocked' }[cardType];

    popover.innerHTML = `
      <div class="metric-popover-header">
        <span>${DashboardUtils.escapeHtml(label)} (${matching.length})</span>
        <button class="metric-popover-close" aria-label="Close">&times;</button>
      </div>
      <div class="metric-popover-list">
        ${matching.map(i => `
          <a class="metric-popover-item" href="${i.url}" target="_blank" rel="noopener">
            <span class="metric-popover-number">#${i.number}</span>
            <span class="metric-popover-title">${DashboardUtils.escapeHtml(i.title)}</span>
            <span class="badge ${statusBadgeClass(i.status)}">${DashboardUtils.escapeHtml(i.status || i.state)}</span>
          </a>
        `).join('')}
      </div>
    `;

    card.style.position = 'relative';
    card.appendChild(popover);

    popover.querySelector('.metric-popover-close').addEventListener('click', (e) => {
      e.stopPropagation();
      closePopover();
    });

    // Close on outside click
    setTimeout(() => {
      document.addEventListener('click', onOutsideClick);
    }, 0);
  }

  function onOutsideClick(e) {
    const popover = document.getElementById('metricPopover');
    if (popover && !popover.contains(e.target) && !e.target.closest('.metric-card')) {
      closePopover();
    }
  }

  function closePopover() {
    const existing = document.getElementById('metricPopover');
    if (existing) existing.remove();
    document.removeEventListener('click', onOutsideClick);
  }

  function render(meta, issues) {
    allIssues = issues || [];
    const stats = meta.stats || {};

    document.getElementById('metricTotal').textContent = stats.total || 0;
    document.getElementById('metricDone').textContent = stats.done || 0;
    document.getElementById('metricInProgress').textContent = stats.inProgress || 0;
    document.getElementById('metricBlocked').textContent = stats.blocked || 0;

    const pct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
    document.getElementById('completionPct').textContent = pct + '%';
    document.getElementById('completionFill').style.width = pct + '%';

    // Bind click handlers
    document.querySelectorAll('.metric-card').forEach(card => {
      card.style.cursor = 'pointer';
      // Remove old listeners by cloning
      const newCard = card.cloneNode(true);
      card.parentNode.replaceChild(newCard, card);

      const cardType = newCard.classList.contains('total') ? 'total'
        : newCard.classList.contains('done') ? 'done'
        : newCard.classList.contains('in-progress') ? 'in-progress'
        : newCard.classList.contains('blocked') ? 'blocked' : null;

      if (cardType) {
        newCard.addEventListener('click', (e) => {
          e.stopPropagation();
          const active = document.getElementById('metricPopover');
          if (active && active.parentNode === newCard) {
            closePopover();
          } else {
            showPopover(newCard, cardType);
          }
        });
      }
    });
  }

  return { render };
})();
