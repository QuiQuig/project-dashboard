/**
 * BurndownChart — ECharts line chart: ideal vs actual burndown
 */
const BurndownChart = (() => {
  let chart = null;

  function computeBurndown(issues) {
    // Find the date range from issues
    const allDates = issues
      .filter(i => i.createdAt)
      .map(i => new Date(i.createdAt));

    if (allDates.length === 0) return null;

    const startDate = new Date(Math.min(...allDates));
    const endDate = new Date(); // today
    const totalItems = issues.length;

    // Build daily closure counts
    const closedByDate = {};
    for (const issue of issues) {
      if (issue.closedAt) {
        const d = issue.closedAt.slice(0, 10);
        closedByDate[d] = (closedByDate[d] || 0) + 1;
      }
    }

    // Generate date series
    const dates = [];
    const idealLine = [];
    const actualLine = [];
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    let remaining = totalItems;

    for (let i = 0; i <= totalDays; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      dates.push(dateStr);

      // Ideal: linear from total to 0
      idealLine.push(Math.max(0, Math.round(totalItems - (totalItems * i / totalDays))));

      // Actual: subtract closures
      if (closedByDate[dateStr]) {
        remaining -= closedByDate[dateStr];
      }
      actualLine.push(remaining);
    }

    return { dates, idealLine, actualLine };
  }

  function render(issues) {
    const container = document.getElementById('burndownChart');
    const data = computeBurndown(issues);

    if (!data) {
      container.innerHTML = '<div class="empty-state">No burndown data available</div>';
      return;
    }

    if (chart) chart.dispose();
    chart = echarts.init(container);

    chart.setOption({
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
      },
      legend: {
        data: ['Ideal', 'Actual'],
        textStyle: { fontFamily: 'Segoe UI, sans-serif' },
      },
      grid: {
        left: 40,
        right: 20,
        bottom: 40,
        top: 40,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: data.dates,
        axisLabel: {
          rotate: 45,
          formatter: (v) => v.slice(5), // MM-DD
          fontFamily: 'Segoe UI, sans-serif',
          fontSize: 11,
        },
      },
      yAxis: {
        type: 'value',
        name: 'Remaining',
        nameTextStyle: { fontFamily: 'Segoe UI, sans-serif' },
      },
      series: [
        {
          name: 'Ideal',
          type: 'line',
          data: data.idealLine,
          lineStyle: { type: 'dashed', color: '#C8C6C4' },
          itemStyle: { color: '#C8C6C4' },
          symbol: 'none',
        },
        {
          name: 'Actual',
          type: 'line',
          data: data.actualLine,
          lineStyle: { color: '#6264A7', width: 2 },
          itemStyle: { color: '#6264A7' },
          areaStyle: { color: 'rgba(98, 100, 167, 0.08)' },
          symbol: 'none',
          smooth: true,
        },
      ],
    });

    window.addEventListener('resize', () => chart && chart.resize());
  }

  return { render };
})();
