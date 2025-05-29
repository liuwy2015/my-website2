const svg = d3.select("#racing-bar-chart");
    // 左侧和右侧留白进一步加大
    const margin = { top: 20, right: 300, bottom: 40, left: 200 };
    const width = +svg.attr("width") - margin.left - margin.right;
    const height = +svg.attr("height") - margin.top - margin.bottom;
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const intervalDuration = 2000;  // 每个时间点的持续时间
    const transitionDuration = 1000;  // 过渡动画的持续时间
    const categorySelect = document.getElementById('category-select');

    // 定义颜色映射
    const rankColors = {
        1: '#fedc97',  // 1st place (lightest)
        2: '#d0c288',  // 2nd place
        3: '#b5b682',  // 3rd place
        4: '#9daa7a',  // 4th place
        5: '#7c9885',  // 5th place
        6: '#4b7b73',  // 6th place
        7: '#28666e',  // 7th place
        8: '#1b5d6b',  // 8th place
        9: '#075075',  // 9th place
        10: '#033f63'  // 10th place (darkest)
    };

    // 添加类别名称映射
    const categoryDisplayNames = {
        'cereals_rice_milled_eqv': 'Rice (Milled)',
        'cereals_total': 'Total Cereals',
        'coarse_grain_total': 'Coarse Grains'
    };

    let data, years, yearIndex = 0, intervalId;
    let prevYearData = null;  // 存储上一个时间点的数据

    d3.csv('data/Map1.csv', d => ({
      country: d.country_or_area,
      year: +d.year,
      unit: d.unit,
      value: +d.value / 1000000, // 转换为百万吨
      category: d.category,
      code: d.country_code
    })).then(fetched => {
      data = fetched;
      const categories = Array.from(new Set(data.map(d => d.category))).sort();
      
      // 使用映射的显示名称填充选择器
      categories.forEach(cat => {
          const option = document.createElement('option');
          option.value = cat;
          option.textContent = categoryDisplayNames[cat] || cat;
          categorySelect.appendChild(option);
      });

      categorySelect.value = categories[0];
      categorySelect.addEventListener('change', resetAndRender);
      resetAndRender();
    });

    function resetAndRender() {
      if (intervalId) clearInterval(intervalId);
      years = Array.from(new Set(data.map(d => d.year))).sort((a, b) => a - b);
      yearIndex = 0;
      prevYearData = null;  // 重置上一帧数据
      drawYear();
      startAnimation();
    }

    function startAnimation() {
      intervalId = setInterval(() => {
        yearIndex = (yearIndex + 1) % years.length;
        drawYear();
      }, intervalDuration);
    }

    function drawYear() {
      const cat = categorySelect.value;
      const year = years[yearIndex];

      // 获取当前年份的数据并排序
      const yearData = data.filter(d => d.category === cat && d.value > 0 && d.year === year)
        .sort((a, b) => b.value - a.value)
        .slice(0, 10)
        .map((d, i) => ({...d, rank: i + 1})); // 添加排名

      // 如果是第一帧，初始化图表
      if (!prevYearData) {
        g.selectAll('*').remove();
        initializeChart(yearData);
      }

      // 更新比例尺
      const x = d3.scaleLinear()
        .domain([0, d3.max(yearData, d => d.value)])
        .range([0, width]);

      const y = d3.scaleBand()
        .domain(yearData.map(d => d.country))
        .range([0, height])
        .padding(0.1);

      // 更新x轴
      const xAxis = d3.axisTop(x)
        .ticks(12)  // 设置大约12个刻度，这样每25个单位一条线
        .tickSize(-height)
        .tickFormat(d => d.toFixed(1));
        
      g.select('.x-axis')
        .transition()
        .duration(transitionDuration)
        .call(xAxis)
        .call(g => {
          g.selectAll('.tick line')
            .attr('stroke', '#e0e0e0')  // 淡灰色的网格线
            .attr('stroke-opacity', 0.5);  // 设置透明度使线条更淡
          g.selectAll('.tick text')
            .attr('fill', '#333');
          g.select('.domain').remove();  // 移除轴线
        });

      // 添加或更新 "M Tonnes" 标签
      let xLabel = g.select('.x-axis-label');
      if (xLabel.empty()) {
        xLabel = g.append('text')
          .attr('class', 'x-axis-label')
          .attr('text-anchor', 'end')
          .attr('fill', '#666')
          .attr('font-size', '12px');
      }
      xLabel
        .attr('x', width)
        .attr('y', -25)
        .text('M Tonnes');

      // 更新条形
      const bars = g.selectAll('.bar')
        .data(yearData, d => d.country);

      // 新增的条形 - 从左侧开始，逐渐展开到目标宽度
      const barsEnter = bars.enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', 0)
        .attr('width', 0)  // 初始宽度为0
        .attr('y', d => y(d.country))
        .attr('height', y.bandwidth())
        .attr('fill', d => rankColors[d.rank]);

      // 更新现有的条形
      const barsMerge = barsEnter.merge(bars)
        .transition()
        .duration(transitionDuration)
        .attr('y', d => y(d.country))
        .attr('width', d => x(d.value))
        .attr('fill', d => rankColors[d.rank]);

      // 移除不再需要的条形 - 向左收缩
      bars.exit()
        .transition()
        .duration(transitionDuration)
        .attr('width', 0)
        .remove();

      // 更新数值标签
      const labels = g.selectAll('.label')
        .data(yearData, d => d.country);

      // 新增标签 - 从条形起点开始
      const labelsEnter = labels.enter()
        .append('text')
        .attr('class', 'label')
        .attr('dy', '0.35em')
        .attr('fill', d => d.rank > 5 ? '#ffffff' : '#333')  // 排名大于5的使用白色标签
        .attr('x', 0)
        .attr('y', d => y(d.country) + y.bandwidth() / 2)
        .attr('text-anchor', 'end')
        .style('opacity', 0)
        .text(d => '0.0');

      // 更新所有标签
      const labelsMerge = labelsEnter.merge(labels)
        .transition()
        .duration(transitionDuration)
        .attr('y', d => y(d.country) + y.bandwidth() / 2)
        .attr('x', d => Math.max(x(d.value) - 5, 5))
        .attr('fill', d => d.rank > 5 ? '#ffffff' : '#333')  // 排名大于5的使用白色标签
        .style('opacity', 1)
        .tween('text', function(d) {
          const node = this;
          const oldValue = node.textContent ? parseFloat(node.textContent) : 0;
          const interpolate = d3.interpolate(oldValue, d.value);
          return function(t) {
            node.textContent = interpolate(t).toFixed(1);
          };
        });

      // 移除标签 - 向左淡出
      labels.exit()
        .transition()
        .duration(transitionDuration)
        .attr('x', 0)
        .style('opacity', 0)
        .remove();

      // 更新国家名称
      const names = g.selectAll('.name')
        .data(yearData, d => d.country);

      // 新增国家名称 - 从条形末端淡入
      const namesEnter = names.enter()
        .append('text')
        .attr('class', 'name')
        .attr('dy', '0.35em')
        .attr('fill', '#333')
        .attr('x', d => x(d.value) + 5)
        .attr('y', d => y(d.country) + y.bandwidth() / 2)
        .attr('text-anchor', 'start')
        .style('opacity', 0)
        .text(d => d.country);

      // 更新所有国家名称
      const namesMerge = namesEnter.merge(names)
        .transition()
        .duration(transitionDuration)
        .attr('y', d => y(d.country) + y.bandwidth() / 2)
        .attr('x', d => x(d.value) + 5)
        .style('opacity', 1);

      // 移除国家名称 - 淡出
      names.exit()
        .transition()
        .duration(transitionDuration)
        .style('opacity', 0)
        .remove();

      // 更新年份显示
      const yearText = g.selectAll('.year')
        .data([year]);

      yearText.enter()
        .append('text')
        .attr('class', 'year')
        .merge(yearText)
        .attr('x', width)
        .attr('y', height - 10)
        .attr('text-anchor', 'end')
        .attr('font-size', '48px')
        .attr('fill', '#333')
        .text(year);

      // 保存当前数据用于下一帧
      prevYearData = yearData;
    }

    function initializeChart(yearData) {
      // 创建x轴
      const x = d3.scaleLinear()
        .domain([0, d3.max(yearData, d => d.value)])
        .range([0, width]);

      const xAxis = d3.axisTop(x)
        .ticks(12)  // 设置大约12个刻度，这样每25个单位一条线
        .tickSize(-height);
        
      g.append('g')
        .attr('class', 'x-axis')
        .call(xAxis)
        .call(g => {
          g.selectAll('.tick line')
            .attr('stroke', '#e0e0e0')  // 淡灰色的网格线
            .attr('stroke-opacity', 0.5);  // 设置透明度使线条更淡
          g.selectAll('.tick text')
            .attr('fill', '#333');
          g.select('.domain').remove();  // 移除轴线
        });
    }

    // 初始化选择器
    function initializeSelectors() {
        // 移除 element 选择器相关代码
        const categorySelect = document.getElementById('category-select');
        
        // 填充类别选择器
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = cropDisplayNames[category] || category;
            categorySelect.appendChild(option);
        });

        // 添加事件监听器
        categorySelect.addEventListener('change', updateVisualization);
    }

    // 更新可视化
    function updateVisualization() {
        const selectedCategory = document.getElementById('category-select').value;
        // 使用选定的类别更新图表
        updateChart(selectedCategory);
    }

    // 在更新柱状图时使用颜色
    function updateBars(data) {
        // ... existing code ...

        // 更新柱子
        const bars = svg.selectAll('.bar')
            .data(data, d => d.name);

        // 退出的柱子
        bars.exit()
            .transition()
            .duration(tickDuration)
            .ease(d3.easeLinear)
            .attr('width', 0)
            .remove();

        // 新增的柱子
        const barsEnter = bars.enter()
            .append('g')
            .attr('class', 'bar')
            .attr('transform', d => `translate(0,${y(top_n + 1)})`);

        barsEnter.append('rect')
            .attr('class', 'bar-rect')
            .attr('x', x(0) + 1)
            .attr('width', d => x(d.value) - x(0))
            .attr('height', y(1) - y(0) - barPadding)
            .style('fill', d => rankColors[d.rank] || rankColors[10]);

        // ... rest of the code ...

        // 更新现有的柱子
        const bars_update = bars.merge(barsEnter);
        bars_update.transition()
            .duration(tickDuration)
            .ease(d3.easeLinear)
            .attr('transform', d => `translate(0,${y(d.rank)})`);

        bars_update.select('.bar-rect')
            .transition()
            .duration(tickDuration)
            .ease(d3.easeLinear)
            .attr('width', d => x(d.value) - x(0))
            .style('fill', d => rankColors[d.rank] || rankColors[10]);

        // ... rest of the code ...
    }