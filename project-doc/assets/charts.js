(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim() || '#00f0ff';
  var accent2 = style.getPropertyValue('--accent2').trim() || '#ff006e';
  var ink = style.getPropertyValue('--ink').trim() || '#ffffff';
  var muted = style.getPropertyValue('--muted').trim() || 'rgba(255,255,255,0.55)';
  var rule = style.getPropertyValue('--rule').trim() || 'rgba(255,255,255,0.1)';
  var bg2 = style.getPropertyValue('--bg2').trim() || '#12121a';

  // --- Chart: Category Distribution ---
  var chart1 = echarts.init(document.getElementById('chart-category'), null, { renderer: 'svg' });
  chart1.setOption({
    animation: false,
    tooltip: { trigger: 'item', appendToBody: true },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      textStyle: { color: muted }
    },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['40%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 8,
        borderColor: bg2,
        borderWidth: 2
      },
      label: { show: false },
      emphasis: {
        label: { show: true, fontSize: 16, fontWeight: 'bold', color: ink }
      },
      data: [
        { value: 25, name: '乐高搭建', itemStyle: { color: '#ffbe0b' } },
        { value: 20, name: '机器人', itemStyle: { color: '#00f0ff' } },
        { value: 25, name: 'Scratch', itemStyle: { color: '#ff006e' } },
        { value: 20, name: 'Python', itemStyle: { color: '#06ffa5' } },
        { value: 20, name: 'Arduino', itemStyle: { color: '#0096ff' } },
        { value: 10, name: '竞赛获奖', itemStyle: { color: '#ff6400' } }
      ]
    }]
  });
  window.addEventListener('resize', function() { chart1.resize(); });

  // --- Chart: Monthly Growth ---
  var chart2 = echarts.init(document.getElementById('chart-growth'), null, { renderer: 'svg' });
  chart2.setOption({
    animation: false,
    tooltip: { trigger: 'axis', appendToBody: true },
    grid: { left: '8%', right: '5%', bottom: '12%', top: '10%' },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月'],
      axisLine: { lineStyle: { color: rule } },
      axisLabel: { color: muted }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: rule } },
      axisLabel: { color: muted }
    },
    series: [{
      name: '作品数量',
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: { color: accent, width: 3 },
      itemStyle: { color: accent, borderColor: bg2, borderWidth: 2 },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: accent + '40' },
            { offset: 1, color: accent + '05' }
          ]
        }
      },
      data: [45, 62, 78, 95, 108, 120]
    }]
  });
  window.addEventListener('resize', function() { chart2.resize(); });
})();
