/**
 * GanttChart — ECharts horizontal bar chart: estimated vs actual timelines
 */
const GanttChart = (() => {
  let chart = null;

  function render(issues) {
    const container = document.getElementById('ganttChart');

    // Filter issues that have at least estimated dates
    const ganttIssues = issues.filter(i => i.estimatedStart && i.estimatedEnd);

    if (ganttIssues.length === 0) {
      container.innerHTML = '<div class="empty-state">No timeline data available — add Estimated Start/End dates to project items</div>';
      return;
    }

    // Sort by estimated start
    ganttIssues.sort((a, b) => new Date(a.estimatedStart) - new Date(b.estimatedStart));

    if (chart) chart.dispose();
    chart = echarts.init(container, null, {
      height: Math.max(300, ganttIssues.length * 40 + 80),
    });

    // Find date range
    const allDates = ganttIssues.flatMap(i => [
      i.estimatedStart, i.estimatedEnd,
      i.actualStart, i.actualEnd,
    ].filter(Boolean)).map(d => new Date(d).getTime());

    const minDate = Math.min(...allDates);
    const maxDate = Math.max(...allDates, Date.now());

    const categories = ganttIssues.map(i => `#${i.number} ${i.title}`.slice(0, 40));

    // Build data series
    const estimatedData = ganttIssues.map((issue, idx) => ({
      name: 'Estimated',
      value: [idx, new Date(issue.estimatedStart).getTime(), new Date(issue.estimatedEnd).getTime()],
      itemStyle: { color: 'rgba(98, 100, 167, 0.3)', borderColor: '#6264A7', borderWidth: 1 },
    }));

    const actualData = ganttIssues
      .map((issue, idx) => {
        if (!issue.actualStart) return null;
        const end = issue.actualEnd ? new Date(issue.actualEnd).getTime() : Date.now();
        return {
          name: 'Actual',
          value: [idx, new Date(issue.actualStart).getTime(), end],
          itemStyle: { color: '#6264A7' },
        };
      })
      .filter(Boolean);

    function renderItem(params, api) {
      const catIdx = api.value(0);
      const startTime = api.coord([api.value(1), catIdx]);
      const endTime = api.coord([api.value(2), catIdx]);
      const barHeight = api.size([0, 1])[1] * 0.35;

      const isActual = params.seriesIndex === 1;
      const yOffset = isActual ? barHeight * 0.05 : -(barHeight * 0.05);

      return {
        type: 'rect',
        shape: {
          x: startTime[0],
          y: startTime[1] - barHeight / 2 + yOffset,
          width: Math.max(endTime[0] - startTime[0], 2),
          height: barHeight,
        },
        style: api.style(),
      };
    }

    // Today marker
    const todayLine = Date.now();

    chart.setOption({
      tooltip: {
        formatter: (params) => {
          const start = new Date(params.value[1]).toLocaleDateString();
          const end = new Date(params.value[2]).toLocaleDateString();
          return `${params.name}<br/>${start} — ${end}`;
        },
      },
      grid: {
        left: 200,
        right: 30,
        top: 20,
        bottom: 30,
      },
      xAxis: {
        type: 'time',
        min: minDate,
        max: maxDate + 86400000,
        axisLabel: {
          fontFamily: 'Segoe UI, sans-serif',
          fontSize: 11,
        },
      },
      yAxis: {
        type: 'category',
        data: categories,
        inverse: true,
        axisLabel: {
          fontFamily: 'Segoe UI, sans-serif',
          fontSize: 11,
          width: 180,
          overflow: 'truncate',
        },
      },
      series: [
        {
          name: 'Estimated',
          type: 'custom',
          renderItem,
          encode: { x: [1, 2], y: 0 },
          data: estimatedData,
        },
        {
          name: 'Actual',
          type: 'custom',
          renderItem,
          encode: { x: [1, 2], y: 0 },
          data: actualData,
        },
      ],
      markLine: {
        silent: true,
        data: [{
          xAxis: todayLine,
          lineStyle: { color: '#D13438', type: 'dashed', width: 1 },
          label: { formatter: 'Today', fontSize: 10 },
        }],
      },
    });

    window.addEventListener('resize', () => chart && chart.resize());
  }

  return { render };
})();
