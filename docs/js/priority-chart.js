/**
 * PriorityChart — ECharts donut chart by priority
 */
const PriorityChart = (() => {
  let chart = null;

  const colorMap = {
    'Urgent': '#D13438',
    'High': '#FF8C00',
    'Medium': '#FFB900',
    'Low': '#107C10',
    'None': '#8A8886',
  };

  function render(meta) {
    const container = document.getElementById('priorityChart');
    const priorities = meta.priorities || {};
    const entries = Object.entries(priorities);

    if (entries.length === 0) {
      container.innerHTML = '<div class="empty-state">No priority data</div>';
      return;
    }

    if (chart) chart.dispose();
    chart = echarts.init(container);

    const data = entries.map(([name, value]) => ({
      name,
      value,
      itemStyle: { color: colorMap[name] || '#8A8886' },
    }));

    chart.setOption({
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)',
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center',
        textStyle: {
          fontFamily: 'Segoe UI, sans-serif',
          fontSize: 12,
        },
      },
      series: [{
        type: 'pie',
        radius: ['45%', '75%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        label: { show: false },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
          },
        },
        data,
      }],
    });

    window.addEventListener('resize', () => chart && chart.resize());
  }

  return { render };
})();
