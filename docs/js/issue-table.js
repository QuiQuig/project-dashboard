/**
 * IssueTable — sortable, filterable table of issues
 */
const IssueTable = (() => {
  let allIssues = [];
  let sortField = 'number';
  let sortAsc = true;

  function statusBadge(status) {
    if (!status) return '';
    const cls = {
      'Done': 'badge-done',
      'In Progress': 'badge-in-progress',
      'Todo': 'badge-todo',
      'Blocked': 'badge-blocked',
      'Backlog': 'badge-backlog',
    }[status] || 'badge-todo';
    return `<span class="badge ${cls}">${escapeHtml(status)}</span>`;
  }

  function priorityBadge(priority) {
    if (!priority) return '';
    const cls = {
      'Urgent': 'badge-urgent',
      'High': 'badge-high',
      'Medium': 'badge-medium',
      'Low': 'badge-low',
    }[priority] || '';
    return `<span class="badge ${cls}">${escapeHtml(priority)}</span>`;
  }

  function getValue(issue, field) {
    switch (field) {
      case 'number': return issue.number || 0;
      case 'title': return (issue.title || '').toLowerCase();
      case 'status': return issue.status || '';
      case 'priority': return issue.priority || '';
      case 'phase': return issue.phase || '';
      case 'assignees': return (issue.assignees || []).map(a => a.login).join(', ');
      default: return '';
    }
  }

  function sortIssues(issues) {
    return [...issues].sort((a, b) => {
      let va = getValue(a, sortField);
      let vb = getValue(b, sortField);
      if (typeof va === 'number' && typeof vb === 'number') {
        return sortAsc ? va - vb : vb - va;
      }
      va = String(va);
      vb = String(vb);
      return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
    });
  }

  function filterIssues(issues) {
    const statusFilter = document.getElementById('filterStatus').value;
    const priorityFilter = document.getElementById('filterPriority').value;

    return issues.filter(i => {
      if (statusFilter && i.status !== statusFilter) return false;
      if (priorityFilter && i.priority !== priorityFilter) return false;
      return true;
    });
  }

  function renderRows() {
    const filtered = filterIssues(allIssues);
    const sorted = sortIssues(filtered);
    const tbody = document.getElementById('issueTableBody');

    if (sorted.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No issues match filters</td></tr>';
      return;
    }

    tbody.innerHTML = sorted.map(issue => `
      <tr>
        <td><a href="${issue.url}" target="_blank" rel="noopener">#${issue.number}</a></td>
        <td>${escapeHtml(issue.title)}</td>
        <td>${statusBadge(issue.status)}</td>
        <td>${priorityBadge(issue.priority)}</td>
        <td>${escapeHtml(issue.phase || '—')}</td>
        <td>${(issue.assignees || []).map(a => escapeHtml(a.login)).join(', ') || '—'}</td>
      </tr>
    `).join('');
  }

  function populateFilters(issues) {
    const statuses = [...new Set(issues.map(i => i.status).filter(Boolean))].sort();
    const priorities = [...new Set(issues.map(i => i.priority).filter(Boolean))].sort();

    const statusSelect = document.getElementById('filterStatus');
    statusSelect.innerHTML = '<option value="">All Statuses</option>' +
      statuses.map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('');

    const prioritySelect = document.getElementById('filterPriority');
    prioritySelect.innerHTML = '<option value="">All Priorities</option>' +
      priorities.map(p => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join('');
  }

  function initSort() {
    document.querySelectorAll('#issueTable th[data-sort]').forEach(th => {
      th.addEventListener('click', () => {
        const field = th.dataset.sort;
        if (sortField === field) {
          sortAsc = !sortAsc;
        } else {
          sortField = field;
          sortAsc = true;
        }
        // Update sort indicators
        document.querySelectorAll('#issueTable th').forEach(h => h.classList.remove('sorted'));
        th.classList.add('sorted');
        th.querySelector('.sort-icon').innerHTML = sortAsc ? '&#9650;' : '&#9660;';
        renderRows();
      });
    });
  }

  function render(issues) {
    allIssues = issues;
    populateFilters(issues);
    renderRows();

    // Bind filter change
    document.getElementById('filterStatus').addEventListener('change', renderRows);
    document.getElementById('filterPriority').addEventListener('change', renderRows);
    initSort();
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  return { render };
})();
