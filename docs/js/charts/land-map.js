import {
    bmapWidth,
    bmapHeight,
    minZoom,
    maxZoom,
    greenRegionColors
} from './constants.js';

let currentLandType = 'agricultural';
let currentYear = 2020;
let landData;
let landYears;
let currentYearIndex = 0;
let animationInterval;
const animationDuration = 1500; // 每个时间点的持续时间
const transitionDuration = 1000; // 颜色过渡的持续时间

// Add tooltip for map
const landMapTooltip = d3.select("body")
    .append("div")
    .attr("class", "land-map-tooltip")
    .style("position", "absolute")
    .style("background", "rgba(0, 0, 0, 0.8)")
    .style("color", "white")
    .style("padding", "10px")
    .style("border-radius", "5px")
    .style("pointer-events", "none")
    .style("opacity", 0)
    .style("font-size", "12px")
    .style("z-index", "1000");

// Create SVG for land map
const landMapSvg = d3.select("#land-map").append("svg")
    .attr("width", bmapWidth)
    .attr("height", bmapHeight)
    .style("background-color", "transparent");

const gLandMap = landMapSvg.append("g");

const projection = d3.geoMercator()
    .scale(120)
    .translate([bmapWidth / 2, bmapHeight / 2 + 80]);

const path = d3.geoPath().projection(projection);

// Add zoom behavior
const zoom = d3.zoom()
    .scaleExtent([minZoom, maxZoom])
    .on("zoom", function (event) {
        gLandMap.attr("transform", event.transform);
    });

landMapSvg.call(zoom);

landMapSvg.on("wheel", function(event) {
    const transform = d3.zoomTransform(landMapSvg.node());
    if ((transform.k <= minZoom && event.deltaY > 0) || (transform.k >= maxZoom && event.deltaY < 0)) {
        event.preventDefault();
    }
});

// Add land type selection buttons
const buttonContainer = d3.select(".land-buttons");

const landTypes = [
    { id: 'agricultural', name: 'Agricultural Land', color: '#8B4513' },
    { id: 'fertilizer', name: 'Fertilizer Usage', color: '#2E8B57' },
    { id: 'water', name: 'Water Use Efficiency', color: '#0288D1' }
];

landTypes.forEach(type => {
    buttonContainer.append("button")
        .text(type.name)
        .attr("data-type", type.id)
        .classed("land-type-btn", true)
        .on("click", function() {
            // 移除其他按钮的活动状态
            buttonContainer.selectAll("button")
                .classed("active", false)
                .style("background", "transparent")
                .style("color", "#8d6e63");
            
            // 设置当前按钮的活动状态
            d3.select(this)
                .classed("active", true)
                .style("background", "rgba(141, 110, 99, 0.1)")
                .style("color", "#8d6e63");
            
            // 更新当前类型
            currentLandType = type.id;
            
            // 立即加载新数据
            loadLandData();
            
            // 如果动画正在运行，重新开始动画
            if (animationInterval) {
                clearInterval(animationInterval);
                startAnimation(type.id);
            }
        });
});

// Initialize year select
function initLandYearSelect() {
    const yearSelect = document.querySelector('.land-year-select');
    if (!yearSelect) return;

    // 创建时间轴容器
    const timelineContainer = document.createElement('div');
    timelineContainer.className = 'timeline-container';
    
    // 创建时间轴
    const timeline = document.createElement('div');
    timeline.className = 'timeline';
    timeline.style.display = 'grid';
    timeline.style.gridTemplateColumns = 'repeat(13, 1fr)';
    timeline.style.width = '100%';
    timeline.style.padding = '0 20px';
    
    // 生成5年间隔的年份标记 (1960-2020)
    for (let year = 1960; year <= 2020; year += 5) {
        const yearMark = document.createElement('div');
        yearMark.className = 'year-mark';
        yearMark.setAttribute('data-year', year);
        yearMark.style.justifySelf = 'center';
        yearMark.innerHTML = `<span class="year-label">${year}</span>`;
        
        // 添加点击事件
        yearMark.addEventListener('click', function() {
            // 停止任何正在进行的动画
            if (animationInterval) {
                clearInterval(animationInterval);
            }
            
            // 更新当前年份
            currentYear = year;
            
            // 确保 landYears 数组已初始化
            if (!landYears || landYears.length === 0) {
                landYears = Array.from(
                    {length: Math.floor((2020-1960)/5) + 1}, 
                    (_, i) => (1960 + i * 5).toString()
                );
            }
            
            // 更新当前年份索引
            currentYearIndex = landYears.findIndex(y => +y === year);
            
            // 更新时间轴高亮
            updateTimelineHighlight(year);
            
            // 获取当前选中的数据类型
            const activeButton = document.querySelector('.land-type-btn.active');
            if (activeButton) {
                currentLandType = activeButton.getAttribute('data-type');
            }
            
            // 加载并更新地图数据
            loadLandData();
        });
        
        timeline.appendChild(yearMark);
    }
    
    timelineContainer.appendChild(timeline);
    yearSelect.parentNode.replaceChild(timelineContainer, yearSelect);
}

// Function to load and process land data
function loadLandData() {
    console.log('Loading data for year:', currentYear, 'type:', currentLandType);
    
    d3.csv("data/Map3.csv").then(data => {
        // 过滤当前年份的数据
        const yearData = data.filter(d => +d.year === +currentYear);
        console.log('Filtered data for year:', yearData);
        
        // 处理数据
        const continentData = {};
        const continents = ['Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania'];
        
        let minValue = Infinity;
        let maxValue = -Infinity;
        
        continents.forEach(continent => {
            const continentInfo = yearData.find(d => d.Country === continent);
            if (continentInfo) {
                let value;
                switch(currentLandType) {
                    case 'agricultural':
                        value = +continentInfo['Agricultural land (% of land area)'];
                        break;
                    case 'fertilizer':
                        value = +continentInfo['Fertilizer consumption (kilograms per hectare of arable land)'];
                        break;
                    case 'water':
                        value = +continentInfo['Agricultural water withdrawal as % of total renewable water resources'];
                        break;
                }
                
                if (!isNaN(value)) {
                    continentData[continent] = value;
                    minValue = Math.min(minValue, value);
                    maxValue = Math.max(maxValue, value);
                }
            }
        });

        console.log('Processed data:', continentData);
        console.log('Value range:', minValue, maxValue);

        // 根据不同的数据类型设置颜色范围
        let colorRange;
        let adjustedDomain;
        
        switch(currentLandType) {
            case 'agricultural':
                colorRange = ['#FFFDE7', '#8B4513'];
                adjustedDomain = [Math.max(0, minValue * 0.8), Math.min(100, maxValue * 1.2)];
                break;
            case 'fertilizer':
                colorRange = ['#E8F5E9', '#1B5E20'];
                adjustedDomain = [Math.max(1, minValue), maxValue];
                break;
            case 'water':
                colorRange = ['#E3F2FD', '#01579B'];
                adjustedDomain = [0, Math.max(maxValue, 100)];
                break;
            default:
                colorRange = ['#e8f5e9', '#2E8B57'];
                adjustedDomain = [minValue, maxValue];
        }

        console.log('Color settings:', {colorRange, adjustedDomain, type: currentLandType});

        // 创建颜色比例尺
        const colorScale = currentLandType === 'fertilizer' 
            ? d3.scaleLog().domain(adjustedDomain).range(colorRange).clamp(true)
            : d3.scaleLinear().domain(adjustedDomain).range(colorRange).clamp(true);

        // 更新地图颜色
        gLandMap.selectAll(".country")
            .transition()
            .duration(transitionDuration)
            .style("fill", d => {
                const continent = getContinent(d.id);
                if (continent && continentData[continent] !== undefined) {
                    const value = continentData[continent];
                    return value === 0 ? colorRange[0] : colorScale(Math.max(currentLandType === 'fertilizer' ? 1 : 0, value));
                }
                return "#f0f0f0";
            });

        // 更新工具提示
        gLandMap.selectAll(".country")
            .on("mouseover", function(event, d) {
                const continent = getContinent(d.id);
                if (continent && continentData[continent] !== undefined) {
                    const value = continentData[continent];
                    const unit = currentLandType === 'fertilizer' ? ' kg/ha' : '%';
                    
                    landMapTooltip.transition()
                        .duration(200)
                        .style("opacity", .9);
                    landMapTooltip.html(`
                        <div style="font-weight: bold; margin-bottom: 5px;">${continent}</div>
                        <div>${getLandTypeLabel(currentLandType)}: ${value.toFixed(1)}${unit}</div>
                        <div>Year: ${currentYear}</div>
                    `)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 28) + "px");
                }
            })
            .on("mouseout", function() {
                landMapTooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });
            
        // 更新图例
        updateLegend(maxValue, colorScale, colorRange);
    }).catch(error => {
        console.error('Error loading data:', error);
    });
}

// Helper function to get continent for a country
function getContinent(countryCode) {
    const continentMap = {
        'Asia' : [4, 51, 31, 48, 50, 64, 96, 116, 156, 196, 268, 356, 360, 364, 368, 376, 392, 400, 398, 414, 417, 418, 422, 458, 462, 496, 104, 524, 408, 512, 586, 275, 608, 634, 682, 702, 410, 144, 760, 158, 762, 764, 626, 792, 795, 784, 860, 704, 887],
        'Europe' : [8, 20, 40, 112, 56, 70, 100, 191, 203, 208, 233, 246, 250, 276, 300, 348, 352, 372, 380, 428, 438, 440, 442, 807, 470, 498, 492, 499, 528, 578, 616, 620, 642, 643, 674, 688, 703, 705, 724, 752, 756, 804, 826, 336],
        'North America' : [28, 44, 52, 84, 124, 188, 192, 212, 214, 222, 308, 320, 332, 340, 388, 484, 558, 591, 659, 662, 670, 780, 840],
        'South America' : [32, 68, 76, 152, 170, 218, 238, 254, 328, 600, 604, 740, 858, 862],
        'Africa' : [12, 24, 72, 854, 108, 120, 132, 140, 148, 174, 178, 180, 262, 818, 226, 232, 231, 266, 270, 288, 324, 624, 384, 404, 426, 430, 434, 450, 454, 466, 478, 480, 508, 516, 562, 566, 646, 678, 686, 690, 694, 706, 710, 728, 729, 748, 834, 768, 788, 800, 894, 716],
        'Oceania' : [36, 242, 296, 584, 583, 520, 554, 585, 598, 882, 90, 776, 798, 548]
 };

    for (const [continent, codes] of Object.entries(continentMap)) {
        if (codes.includes(+countryCode)) {
            return continent;
        }
    }
    return null;
}

// Load world map and create visualization
d3.json("https://unpkg.com/world-atlas@1.1.4/world/110m.json").then(world => {
    const countries = topojson.feature(world, world.objects.countries).features;

    gLandMap.selectAll(".country")
        .data(countries)
        .enter().append("path")
        .attr("class", "country")
        .attr("d", path)
        .style("fill", "#e8f5e9")
        .style("stroke", "#fff")
        .style("stroke-width", "0.5px");

    // 设置年份数据 (1960-2020, 5年间隔)
    landYears = Array.from({length: Math.floor((2020-1960)/5) + 1}, (_, i) => (1960 + i * 5).toString());
    currentYear = landYears[0];
    currentYearIndex = 0;

    // 初始化年份选择器
    initLandYearSelect();
    
    // 自动选中 Fertilizer Usage 并开始动画
    const fertilizerButton = buttonContainer.selectAll("button")
        .filter(function() {
            return d3.select(this).text() === "Fertilizer Usage";
        });

    if (!fertilizerButton.empty()) {
        // 设置按钮样式
        buttonContainer.selectAll("button")
            .style("background", "transparent")
            .style("color", "#8d6e63");
            
        fertilizerButton
            .style("background", "rgba(141, 110, 99, 0.1)")
            .style("color", "#8d6e63");

        // 设置当前类型并开始动画
        currentLandType = 'fertilizer';
        startAnimation('fertilizer');
    }
});

function startAnimation(category) {
    // 清除现有动画
    if (animationInterval) {
        clearInterval(animationInterval);
    }
    
    // 确保有数据
    if (!landYears || landYears.length === 0) {
        landYears = Array.from({length: Math.floor((2020-1960)/5) + 1}, (_, i) => (1960 + i * 5).toString());
    }
    
    // 更新年份显示
    updateYearDisplay();
    
    // 更新地图
    loadLandData();
    
    // 开始动画循环
    animationInterval = setInterval(() => {
        currentYearIndex = (currentYearIndex + 1) % landYears.length;
        currentYear = landYears[currentYearIndex];
        updateYearDisplay();
        loadLandData();
    }, animationDuration);
}

function updateYearDisplay() {
    const currentYear = landYears[currentYearIndex];
    updateTimelineHighlight(currentYear);
}

function updateMap(category, year) {
    // 获取当前年份和类别的数据
    const yearData = landData.filter(d => d.year === year && d.category === category);
    
    // 更新颜色比例尺的域
    const maxValue = d3.max(yearData, d => +d.value) || 100;
    colorScale.domain([0, maxValue]);
    
    // 更新地图颜色
    gLandMap.selectAll(".country")
        .transition()
        .duration(transitionDuration)
        .attr("fill", function(d) {
            const countryData = yearData.find(item => item.country_or_area === d.properties.name);
            return countryData ? colorScale(+countryData.value) : "#f0f0f0";
        });
        
    // 更新图例
    updateLegend(maxValue, colorScale, colorRange);
        
    // 更新工具提示
    gLandMap.selectAll(".country")
        .on("mouseover", function(event, d) {
            const countryData = yearData.find(item => item.country_or_area === d.properties.name);
            if (countryData) {
                landMapTooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                landMapTooltip.html(`
                    <strong>${d.properties.name}</strong><br/>
                    ${category}: ${(+countryData.value).toFixed(1)}%<br/>
                    Year: ${year}
                `)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            }
        })
        .on("mouseout", function() {
            landMapTooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });
}

function updateLegend(maxValue, colorScale, colorRange) {
    const legend = d3.select(".legend");
    if (legend.empty()) {
        addLegend(colorScale, colorRange);
        return;
    }

    // 更新渐变
    const linearGradient = d3.select("#land-color-gradient");
    linearGradient.selectAll("stop")
        .data([0, maxValue])
        .transition()
        .duration(transitionDuration)
        .attr("stop-color", (d, i) => colorRange[i]);

    // 更新图例刻度
    const legendScale = d3.scaleLinear()
        .domain([0, maxValue])
        .range([0, 200]);

    const unit = currentLandType === 'fertilizer' ? ' kg/ha' : '%';
    const legendAxis = d3.axisBottom(legendScale)
        .ticks(5)
        .tickFormat(d => d.toFixed(1) + unit);

    legend.select("g")
        .transition()
        .duration(transitionDuration)
        .call(legendAxis);
        
    // 更新图例标题
    legend.select(".legend-title")
        .text(getLandTypeLabel(currentLandType));
}

// 修改 updateTimelineHighlight 函数，移除自动滚动
function updateTimelineHighlight(currentYear) {
    // 移除所有高亮
    document.querySelectorAll('.year-mark').forEach(mark => {
        mark.classList.remove('active');
    });
    
    // 添加当前年份的高亮
    const currentMark = document.querySelector(`.year-mark[data-year="${currentYear}"]`);
    if (currentMark) {
        currentMark.classList.add('active');
    }
}

// 添加图例
function addLegend(colorScale, colorRange) {
    const legend = gLandMap.append("g")
        .attr("class", "legend")
        .attr("transform", "translate(20,550)");

    // 创建渐变
    const defs = gLandMap.append("defs");
    const linearGradient = defs.append("linearGradient")
        .attr("id", "land-color-gradient")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "0%");

    // 添加渐变停止点
    linearGradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", colorScale(0));

    linearGradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", colorScale(100));

    // 添加渐变矩形
    legend.append("rect")
        .attr("class", "legend-gradient")
        .attr("width", 200)
        .attr("height", 20)
        .style("fill", "url(#land-color-gradient)");

    // 添加图例标题
    legend.append("text")
        .attr("class", "legend-title")
        .attr("x", 0)
        .attr("y", -5)
        .text(getLandTypeLabel(currentLandType));

    // 添加刻度标签
    const legendScale = d3.scaleLinear()
        .domain([0, 100])
        .range([0, 200]);

    const legendAxis = d3.axisBottom(legendScale)
        .ticks(5)
        .tickFormat(d => d + "%");

    legend.append("g")
        .attr("transform", "translate(0,20)")
        .call(legendAxis);
}

// 添加辅助函数获取土地类型标签
function getLandTypeLabel(type) {
    switch(type) {
        case 'agricultural':
            return 'Agricultural Land';
        case 'fertilizer':
            return 'Fertilizer Usage';
        case 'water':
            return 'Water Use Efficiency';
        default:
            return type;
    }
}

// 在初始化地图后调用添加图例
Promise.all([
    d3.json("https://unpkg.com/world-atlas@1.1.4/world/110m.json"),
    d3.csv("data/Map3.csv")
]).then(([world, data]) => {
    landData = data;
    
    // ... 现有的初始化代码 ...
    
    // 添加图例
    addLegend();
    
    // 自动选中 Fertilizer Usage 并开始动画
    const fertilizerButton = buttonContainer.selectAll("button")
        .filter(function() {
            return d3.select(this).text() === "Fertilizer Usage";
        });

    if (!fertilizerButton.empty()) {
        // 设置按钮样式
        buttonContainer.selectAll("button")
            .style("background", "transparent")
            .style("color", "#8d6e63");
            
        fertilizerButton
            .style("background", "rgba(141, 110, 99, 0.1)")
            .style("color", "#8d6e63");

        // 设置当前类型并开始动画
        currentLandType = 'fertilizer';
        startAnimation('fertilizer');
    }
}); 