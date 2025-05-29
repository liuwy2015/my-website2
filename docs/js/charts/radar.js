let radarCharts = {};

// 添加文本换行函数
function wrapText(text, maxWidth = 15) {
    const words = text.split(' ');
    let lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        if (currentLine.length + word.length + 1 <= maxWidth) {
            currentLine += ' ' + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines.join('\n');
}

// 添加自定义插件来控制刻度值位置
const tickPositionPlugin = {
    id: 'tickPosition',
    beforeDraw: (chart) => {
        const ctx = chart.ctx;
        const scale = chart.scales.r;
        const centerX = scale.xCenter;
        const centerY = scale.yCenter;
        const radius = scale.drawingArea;

        // 在Water Use Efficiency和Land Use之间绘制刻度值
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '7px Arial';
        ctx.fillStyle = '#333';

        const steps = scale.ticks.length;
        const stepSize = radius / steps;

        for (let i = 1; i <= steps; i++) {
            const value = scale.ticks[i - 1].value;
            const formattedValue = Number(value).toFixed(1);
            const currentRadius = stepSize * i;
            // 调整角度：原来是 -60 + 45，现在改为 -60 + 25 (逆时针旋转20度)
            const angle = (-60 + 25) * Math.PI / 180;
            const x = centerX + Math.cos(angle) * currentRadius;
            const y = centerY + Math.sin(angle) * currentRadius;
            
            ctx.fillText(formattedValue, x, y);
        }
        ctx.restore();
    }
};

// 添加区域描述
const regionDescriptions = {
    'Africa': "Africa's high land use and cropland stability highlight the agricultural sector's economic significance and reliance on stable farmland. However, very low fertilizer intensity reflects limited input use, which can cap yield potential and challenge food security.",
    
    'Asia': "Asia's relatively high water use efficiency reflects strong irrigation practices and resource adaptation in many countries. However, limited cropland stability and agro-economic advancement highlight challenges with farmland resilience and economic modernization.",
    
    'Europe': "Europe's high cropland stability and fertilizer intensity align with its advanced, mechanized agricultural systems. The balance across other indicators matches Europe's approach to controlled, high-yield farming supported by strong infrastructure.",
    
    'North America': "North America's consistently high scores confirm its industrialized, technology-driven agriculture. While ensuring productivity, these intensive practices also come with environmental pressures and resource sustainability concerns.",
    
    'Oceania': "Oceania's high land use and water efficiency scores align with its extensive farming resources and efficient practices. The generally balanced profile reflects a region focused on adaptability and sustainable resource use.",
    
    'South America': "South America shows strong cropland stability and land use—fitting its vast natural resources and agricultural capacity. Lower economic and water efficiency scores point to challenges in supporting systems and infrastructure."
};

// 添加鼠标交互处理函数
function setupHoverInteraction() {
    const radarItems = document.querySelectorAll('.radar-item');
    
    radarItems.forEach((item, index) => {
        const canvas = item.querySelector('canvas');
        const chart = Chart.getChart(canvas);
        const region = item.querySelector('.chart-title').textContent;

        // 创建描述元素
        const descriptionEl = document.createElement('div');
        descriptionEl.className = 'radar-description';
        // 根据索引判断是左侧还是右侧的雷达图
        descriptionEl.classList.add(index % 2 === 0 ? 'description-right' : 'description-left');
        descriptionEl.textContent = regionDescriptions[region];
        descriptionEl.style.color = '#FFFFFF';
        item.appendChild(descriptionEl);

        // 检查点是否在圆形区域内
        function isPointInCircle(x, y, chart) {
            const scale = chart.scales.r;
            const centerX = scale.xCenter;
            const centerY = scale.yCenter;
            const radius = scale.drawingArea * 2;

            const distance = Math.sqrt(
                Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
            );

            return distance <= radius;
        }

        // 更新图表样式
        function updateChartStyle(chart, isHovered) {
            const dataset = chart.data.datasets[0];
            if (isHovered) {
                dataset.pointBackgroundColor = '#fedc97';
                dataset.pointBorderColor = '#fff';
                dataset.pointHoverBackgroundColor = '#fedc97';
                dataset.pointHoverBorderColor = '#fff';
            } else {
                dataset.pointBackgroundColor = '#7c9885';
                dataset.pointBorderColor = '#fff';
                dataset.pointHoverBackgroundColor = '#fff';
                dataset.pointHoverBorderColor = '#7c9885';
            }
            chart.update('none');
        }

        // 鼠标移动事件处理
        function handleMouseMove(e) {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            if (isPointInCircle(x, y, chart)) {
                if (!item.classList.contains('hover')) {
                    item.classList.add('hover');
                    updateChartStyle(chart, true);
                    radarItems.forEach(otherItem => {
                        if (otherItem !== item) {
                            otherItem.classList.add('dimmed');
                        }
                    });
                }
            } else {
                if (item.classList.contains('hover')) {
                    item.classList.remove('hover');
                    updateChartStyle(chart, false);
                    radarItems.forEach(otherItem => {
                        otherItem.classList.remove('dimmed');
                    });
                }
            }
        }

        // 鼠标离开容器事件处理
        function handleMouseLeave() {
            item.classList.remove('hover');
            updateChartStyle(chart, false);
            radarItems.forEach(otherItem => {
                otherItem.classList.remove('dimmed');
            });
        }

        item.addEventListener('mousemove', handleMouseMove);
        item.addEventListener('mouseleave', handleMouseLeave);
    });
}

async function loadData() {
    try {
        const response = await fetch('data/main_effect_scores.json');
        const data = await response.json();
        return transformData(data);
    } catch (error) {
        console.error('Error loading data:', error);
        return null;
    }
}

function transformData(data) {
    const dimensionMapping = {
        'Agriculture, forestry, and fishing, value added (% of GDP)': 'Agro-Economic Advancement',
        'Agricultural water withdrawal as % of total renewable water resources': 'Water Use Efficiency',
        'Agricultural land (% of land area)': 'Land Use',
        'Permanent cropland (% of land area)': 'Cropland Stability',
        'Fertilizer consumption (kilograms per hectare of arable land)': 'Fertilizer Intensity'
    };

    // Define the desired order of dimensions
    const orderedDimensions = [
        'Agro-Economic Advancement',
        'Water Use Efficiency',
        'Land Use',
        'Cropland Stability',
        'Fertilizer Intensity'
    ];

    const transformedData = {};
    
    for (const [region, values] of Object.entries(data)) {
        transformedData[region] = {};
        // First, transform the names
        for (const [oldKey, value] of Object.entries(values)) {
            const newKey = dimensionMapping[oldKey] || oldKey;
            transformedData[region][newKey] = value;
        }
        
        // Then, create a new object with the correct order
        const orderedData = {};
        orderedDimensions.forEach(dim => {
            orderedData[dim] = transformedData[region][dim];
        });
        transformedData[region] = orderedData;
    }
    
    return transformedData;
}

function getScaleConfig(region) {
    const scaleConfigs = {
        'Africa': {
            max: 1.75,
            steps: [0.25, 0.50, 0.75, 1.00, 1.25, 1.50, 1.75]
        },
        'Asia': {
            max: 1.2,
            steps: [0.2, 0.4, 0.6, 0.8, 1.0, 1.2]
        },
        'Europe': {
            max: 3.5,
            steps: [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5]
        },
        'North America': {
            max: 35,
            steps: [5, 10, 15, 20, 25, 30, 35]
        },
        'Oceania': {
            max: 7,
            steps: [1, 2, 3, 4, 5, 6, 7]
        },
        'South America': {
            max: 3.0,
            steps: [0.5, 1.0, 1.5, 2.0, 2.5, 3.0]
        }
    };
    return scaleConfigs[region];
}

function createRadarChart(data, region) {
    const ctx = document.getElementById(`radarChart-${region.replace(/\s+/g, '')}`).getContext('2d');
    const regionData = data[region];
    
    // Set canvas background to transparent
    ctx.canvas.style.backgroundColor = 'transparent';
    
    // 处理标签文本换行
    const labels = Object.keys(regionData).map(label => wrapText(label));
    const values = Object.values(regionData);
    const scaleConfig = getScaleConfig(region);

    if (radarCharts[region]) {
        radarCharts[region].destroy();
    }

    radarCharts[region] = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                label: region,
                data: values,
                backgroundColor: 'rgba(37, 60, 41, 0.2)',
                borderColor: 'rgb(37, 60, 41)',
                pointBackgroundColor: '#7c9885',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fedc97',
                pointHoverBorderColor: '#fff',
                borderWidth: 2,
                pointRadius: 5,  // 增大点的大小
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 1,
            layout: {
                padding: {
                    top: 15,
                    bottom: 15,
                    left: 15,
                    right: 15
                }
            },
            scales: {
                r: {
                    backgroundColor: 'transparent',
                    angleLines: {
                        display: true,
                        color: 'rgba(37, 60, 41, 0.2)',
                        lineWidth: 1
                    },
                    grid: {
                        color: 'rgba(37, 60, 41, 0.2)',
                        circular: true,
                        lineWidth: 1
                    },
                    beginAtZero: true,
                    suggestedMax: scaleConfig.max,
                    ticks: {
                        stepSize: scaleConfig.steps[1] - scaleConfig.steps[0],
                        font: {
                            size: 11,
                            family: 'Raleway'
                        },
                        backdropColor: 'transparent',
                        color: 'rgb(37, 60, 41)',
                        count: 8,
                        display: false,
                        callback: function(value) {
                            return Number(value).toFixed(2);
                        }
                    },
                    pointLabels: {
                        font: {
                            size: 14,
                            family: 'Raleway',
                            weight: '600'
                        },
                        padding: 15,
                        color: 'rgb(37, 60, 41)',
                        callback: function(value) {
                            return value.split('\n');
                        },
                        backdropColor: 'transparent',
                        backdropPadding: 0
                    },
                    startAngle: -60
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: false
                },
                tickPosition: true,
                tooltip: {
                    enabled: false,
                    backgroundColor: 'transparent',
                    titleColor: 'rgb(37, 60, 41)',
                    bodyColor: 'rgb(37, 60, 41)',
                    displayColors: false,
                    padding: 0
                }
            }
        },
        plugins: [
            tickPositionPlugin,
            {
                id: 'pointLabels',
                afterDatasetDraw: (chart) => {
                    const item = chart.canvas.closest('.radar-item');
                    if (!item?.classList.contains('hover')) return;

                    const ctx = chart.ctx;
                    const dataset = chart.data.datasets[0];
                    const meta = chart.getDatasetMeta(0);

                    ctx.save();
                    ctx.font = '600 12px Raleway';
                    ctx.fillStyle = 'rgb(37, 60, 41)';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'bottom';

                    meta.data.forEach((point, index) => {
                        const value = dataset.data[index];
                        const { x, y } = point.getCenterPoint();
                        const dimensionName = chart.data.labels[index];
                        
                        // 计算偏移方向
                        const angle = point.angle;
                        let offset = 20;
                        let xOffset, yOffset;

                        // 为特定维度自定义偏移量
                        if (dimensionName.includes('Water Use Efficiency')) {
                            xOffset = Math.cos(angle) * offset - 45;
                            yOffset = Math.sin(angle) * offset + 60;
                        } else if (dimensionName.includes('Land Use')) {
                            xOffset = Math.cos(angle) * offset;
                            yOffset = Math.sin(angle) * offset + 20;
                        } else {
                            xOffset = Math.cos(angle) * offset;
                            yOffset = Math.sin(angle) * offset;
                        }
                        
                        // 直接绘制文本，不添加背景
                        ctx.fillStyle = 'rgb(37, 60, 41)';
                        ctx.fillText(
                            value.toFixed(2),
                            x + xOffset,
                            y + yOffset
                        );
                    });
                    ctx.restore();
                }
            }
        ]
    });
}

async function initialize() {
    const data = await loadData();
    if (!data) return;

    const regions = ['Africa', 'Asia', 'Europe', 'North America', 'Oceania', 'South America'];
    regions.forEach(region => {
        createRadarChart(data, region);
    });

    // 初始化完所有图表后设置交互
    setupHoverInteraction();
}

// Initialize the charts when the page loads
document.addEventListener('DOMContentLoaded', initialize); 