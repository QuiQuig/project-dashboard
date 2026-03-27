/**
 * GanttChart — ECharts horizontal bar chart: estimated vs actual timelines (compact)
 */
const GanttChart = (() => {
  let chart = null;

  function render(issues) {
    const container = document.getElementById("ganttChart");

    // Filter issues that have at least estimated dates
    const ganttIssues = issues.filter(
      (i) => i.estimatedStart && i.estimatedEnd,
    );

    if (ganttIssues.length === 0) {
      container.innerHTML =
        '<div class="empty-state">No timeline data available — add Estimated Start/End dates to project items</div>';
      return;
    }

    // Sort by estimated start
    ganttIssues.sort(
      (a, b) => new Date(a.estimatedStart) - new Date(b.estimatedStart),
    );

    if (chart) chart.dispose();

    // Compact: 26px per row
    const rowHeight = 25;
    const chartHeight = Math.max(200, ganttIssues.length * rowHeight + 60);
    chart = echarts.init(container, null, { height: chartHeight });

    // Find date range
    const allDates = ganttIssues
      .flatMap((i) =>
        [i.estimatedStart, i.estimatedEnd, i.actualStart, i.actualEnd].filter(
          Boolean,
        ),
      )
      .map((d) => new Date(d).getTime());

    const minDate = Math.min(...allDates);
    const maxDate = Math.max(...allDates, Date.now());

    const categories = ganttIssues.map((i) =>
      `#${i.number} ${i.title}`.slice(0, 35),
    );

    // Build data series
    const estimatedData = ganttIssues.map((issue, idx) => ({
      name: "Estimated",
      value: [
        idx,
        new Date(issue.estimatedStart).getTime(),
        new Date(issue.estimatedEnd).getTime(),
      ],
      itemStyle: {
        color: "rgba(98, 100, 167, 0.25)",
        borderColor: "#6264A7",
        borderWidth: 1,
      },
    }));

    const actualData = ganttIssues
      .map((issue, idx) => {
        if (!issue.actualStart) return null;
        const end = issue.actualEnd
          ? new Date(issue.actualEnd).getTime()
          : Date.now();
        return {
          name: "Actual",
          value: [idx, new Date(issue.actualStart).getTime(), end],
          itemStyle: { color: "#6264A7" },
        };
      })
      .filter(Boolean);

    function renderItem(params, api) {
      const catIdx = api.value(0);
      const startTime = api.coord([api.value(1), catIdx]);
      const endTime = api.coord([api.value(2), catIdx]);
      const barHeight = api.size([0, 1])[1] * 0.38;

      const isActual = params.seriesIndex === 1;
      const yOffset = isActual ? barHeight * 0.05 : -(barHeight * 0.05);

      return {
        type: "rect",
        shape: {
          x: startTime[0],
          y: startTime[1] - barHeight / 2 + yOffset,
          width: Math.max(endTime[0] - startTime[0], 2),
          height: barHeight,
          r: 2,
        },
        style: api.style(),
      };
    }

    chart.setOption({
      tooltip: {
        formatter: (params) => {
          const start = new Date(params.value[1]).toLocaleDateString();
          const end = new Date(params.value[2]).toLocaleDateString();
          return `<strong>${params.name}</strong><br/>${start} — ${end}`;
        },
      },
      grid: {
        left: 180,
        right: 20,
        top: 10,
        bottom: 25,
      },
      xAxis: {
        type: "time",
        min: minDate,
        max: maxDate + 86400000,
        axisLabel: {
          fontFamily: "Segoe UI, sans-serif",
          fontSize: 15,
        },
        splitLine: { show: true, lineStyle: { color: "#F0F0F0" } },
      },
      yAxis: {
        type: "category",
        data: categories,
        inverse: true,
        axisLabel: {
          fontFamily: "Segoe UI, sans-serif",
          fontSize: 15,
          width: 165,
          overflow: "truncate",
        },
        axisTick: { show: false },
        splitLine: { show: false },
      },
      series: [
        {
          name: "Estimated",
          type: "custom",
          renderItem,
          encode: { x: [1, 2], y: 0 },
          data: estimatedData,
        },
        {
          name: "Actual",
          type: "custom",
          renderItem,
          encode: { x: [1, 2], y: 0 },
          data: actualData,
        },
        {
          type: "line",
          markLine: {
            silent: true,
            symbol: "none",
            data: [
              {
                xAxis: Date.now(),
                lineStyle: { color: "#D13438", type: "dashed", width: 1 },
                label: { formatter: "Today", fontSize: 9, color: "#D13438" },
              },
            ],
          },
          data: [],
        },
      ],
    });

    window.addEventListener("resize", () => chart && chart.resize());
  }

  return { render };
})();
