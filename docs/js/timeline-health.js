/**
 * TimelineHealth — computes and renders the health banner
 */
const TimelineHealth = (() => {
  function assess(issues) {
    const now = new Date();
    let overdue = 0;
    let atRiskCount = 0;
    let activeWithDates = 0;

    for (const issue of issues) {
      if (issue.status === 'Done' || issue.state === 'CLOSED') continue;
      if (!issue.estimatedEnd) continue;

      activeWithDates++;
      const estimatedEnd = new Date(issue.estimatedEnd);
      const daysUntilDue = (estimatedEnd - now) / (1000 * 60 * 60 * 24);

      if (daysUntilDue < 0) {
        overdue++;
      } else if (daysUntilDue < 7) {
        atRiskCount++;
      }
    }

    if (activeWithDates === 0) return { status: 'on-track', message: 'No timeline data available' };

    const overdueRatio = overdue / activeWithDates;
    if (overdueRatio > 0.3 || overdue >= 3) {
      return { status: 'behind', message: `Behind Schedule — ${overdue} item${overdue !== 1 ? 's' : ''} overdue` };
    }
    if (overdueRatio > 0 || atRiskCount >= 2) {
      return { status: 'at-risk', message: `At Risk — ${overdue} overdue, ${atRiskCount} due within 7 days` };
    }
    return { status: 'on-track', message: 'On Track — all items within schedule' };
  }

  function render(issues) {
    const { status, message } = assess(issues);
    const banner = document.querySelector('#timelineHealth .health-banner');
    banner.className = `health-banner ${status}`;
    banner.querySelector('.health-text').textContent = message;
  }

  return { render };
})();
