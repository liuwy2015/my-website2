import {
    bmapWidth,
    bmapHeight,
    minZoom,
    maxZoom,
    cropCategoryMap,
    cropDisplayNames,
    colorScales,
    countryCoords
} from './constants.js';

// Define the new color scheme
const regionColors = {
    'Asia': '#012D01',            // Darkest green
    'Northern America': '#104908', // Dark green
    'Europe': '#2D6514',          // Medium dark green
    'South America': '#7C9D39',   // Light olive green
    'Africa': '#528124',          // Medium green
    'Oceania': '#AAB952'          // Light sage green
};

// Add debugging
console.log('Main.js loaded');

// Add error handling for data loading
window.addEventListener('DOMContentLoaded', (event) => {
    console.log('DOM fully loaded');
    initYearSelect();
    loadData();
});

// Add tooltip for map
const mapTooltip = d3.select("body")
    .append("div")
    .attr("class", "map-tooltip")
    .style("position", "absolute")
    .style("background", "rgba(0, 0, 0, 0.8)")
    .style("color", "white")
    .style("padding", "10px")
    .style("border-radius", "5px")
    .style("pointer-events", "none")
    .style("opacity", 0)
    .style("font-size", "12px")
    .style("z-index", "1000");

// Add title and description
const titleContainer = d3.select("#map")
    .insert("div", ":first-child")
    .style("text-align", "left")
    .style("margin-bottom", "20px")
    .style("font-family", "'Raleway', sans-serif");

titleContainer.append("h2")
    .text("PRODUCTION PATTERNS")
    .style("font-size", "24px")
    .style("font-weight", "700")
    .style("margin-bottom", "15px")
    .style("margin-top", "40px")
    .style("letter-spacing", "0.05em")
    .style("text-transform", "uppercase")
    .style("color", "rgb(37, 60, 41)");

const descriptionContainer = titleContainer.append("div")
    .style("font-size", "14px")
    .style("line-height", "1.6")
    .style("color", "rgb(37, 60, 41)");

descriptionContainer.append("p")
    .text("This bubble map visualizes cereal crop production—total cereals, rice (milled), and coarse grains—by country from 1961 to 2007. Each bubble represents a country's production volume in million tonnes, with larger bubbles indicating higher production. The color intensity also helps identify major production centers and regions with limited output.")
    .style("margin-bottom", "15px");

descriptionContainer.append("p")
    .text("By combining this bubble map with continental-level data below, you can observe how cereal production patterns evolve over time and across different continents. This interactive visualization offers an intuitive way to pinpoint high-yield regions, low-output areas, and potential food security risk zones.")
    .style("margin-bottom", "15px");

descriptionContainer.append("p")
    .text("Asia consistently dominates global cereal production, followed by North America and Europe. While Africa and South America contribute smaller shares, they reveal unique regional patterns and opportunities for agricultural development.");

// Add controls container
const controlsContainer = d3.select("#map")
    .append("div")
    .style("margin-top", "20px")
    .style("margin-bottom", "20px")
    .style("display", "flex")
    .style("align-items", "center")
    .style("gap", "20px");

// Add year selector
const yearSelectContainer = controlsContainer.append("div")
    .style("display", "flex")
    .style("align-items", "center")
    .style("gap", "10px");

yearSelectContainer.append("label")
    .attr("for", "year-select")
    .text("Year:")
    .style("color", "rgb(37, 60, 41)")
    .style("font-weight", "500")
    .style("font-size", "16px");

yearSelectContainer.append("select")
    .attr("id", "year-select")
    .style("padding", "8px 15px")
    .style("border", "1px solid rgba(37, 60, 41, 0.2)")
    .style("border-radius", "4px")
    .style("background", "rgba(255, 255, 255, 0.9)")
    .style("color", "rgb(37, 60, 41)")
    .style("font-family", "'Raleway', sans-serif")
    .style("font-size", "16px")
    .style("cursor", "pointer")
    .style("min-width", "100px");

// Add crop type selection buttons
const buttonContainer = controlsContainer
    .append("div")
    .attr("class", "crop-buttons")
    .style("display", "flex")
    .style("gap", "15px")
    .style("margin-left", "20px");

// Initialize with cereals_total
let currentCropType = 'cereals_total';
let currentYear = 2007; // Set default year

// Initialize year dropdown
function initYearSelect() {
    const yearSelect = document.getElementById('year-select');
    if (!yearSelect) return;

    // Generate year options from 1961 to 2007
    for (let year = 1961; year <= 2007; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    }

    // Set default value
    yearSelect.value = currentYear;

    // Add change event listener
    yearSelect.addEventListener('change', function() {
        currentYear = parseInt(this.value);
        loadData(); // Reload data with new year
    });
}

// Create buttons with consistent styling
Object.entries(cropDisplayNames).forEach(([key, displayName]) => {
    buttonContainer.append("button")
        .text(displayName)
        .attr("class", "crop-button")
        .classed("selected", key === currentCropType)
        .style("padding", "8px 20px")
        .style("border", "none")
        .style("border-radius", "4px")
        .style("background-color", key === currentCropType ? "rgb(37, 60, 41)" : "rgba(37, 60, 41, 0.1)")
        .style("color", key === currentCropType ? "#ffffff" : "rgb(37, 60, 41)")
        .style("cursor", "pointer")
        .style("font-family", "'Raleway', sans-serif")
        .style("font-size", "16px")
        .style("font-weight", "500")
        .style("transition", "all 0.3s ease")
        .on("mouseover", function() {
            if (!d3.select(this).classed("selected")) {
                d3.select(this)
                    .style("background-color", "rgba(37, 60, 41, 0.2)");
            }
        })
        .on("mouseout", function() {
            if (!d3.select(this).classed("selected")) {
                d3.select(this)
                    .style("background-color", "rgba(37, 60, 41, 0.1)");
            }
        })
        .on("click", function() {
            // Update selected state for all buttons
            buttonContainer.selectAll(".crop-button")
                .classed("selected", false)
                .style("background-color", "rgba(37, 60, 41, 0.1)")
                .style("color", "rgb(37, 60, 41)");

            // Update selected button
            d3.select(this)
                .classed("selected", true)
                .style("background-color", "rgb(37, 60, 41)")
                .style("color", "#ffffff");

            currentCropType = key;
            loadData();
        });
});

const bmapSvg = d3.select("#map").append("svg")
    .attr("width", bmapWidth)
    .attr("height", bmapHeight)
    .style("background-color", "transparent");

const gBmap = bmapSvg.append("g");

const projection = d3.geoMercator()
    .scale(120)
    .translate([bmapWidth / 2, bmapHeight / 2 + 80]);

const path = d3.geoPath().projection(projection);

// Create size scale for circles - using linear scale instead of sqrt
let sizeScale = d3.scaleLinear()
    .domain([0, 1])
    .range([3, 30]); // Initial domain and range

const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

const zoom = d3.zoom()
    .scaleExtent([minZoom, maxZoom])
    .on("zoom", function (event) {
        gBmap.attr("transform", event.transform);
        // Update circle positions and sizes during zoom
        gBmap.selectAll("circle")
            .attr("cx", d => projection(d.coords)[0])
            .attr("cy", d => projection(d.coords)[1])
            .attr("r", d => sizeScale(d.value) / event.transform.k);
        gBmap.selectAll(".country").style("stroke-width", `${1 / event.transform.k}px`);
    });

bmapSvg.call(zoom);

bmapSvg.on("wheel", function(event) {
    const transform = d3.zoomTransform(bmapSvg.node());
    if ((transform.k <= minZoom && event.deltaY > 0) || (transform.k >= maxZoom && event.deltaY < 0)) {
        event.preventDefault();
    }
});

// Add these region mapping objects at the top of the file
const regionCountryMap = {
    'Europe': ['Albania', 'Andorra', 'Austria', 'Belarus', 'Belgium', 'Bosnia and Herzegovina', 'Bulgaria', 'Croatia', 'Czech Republic', 'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece', 'Hungary', 'Iceland', 'Ireland', 'Italy', 'Latvia', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Malta', 'Moldova', 'Monaco', 'Montenegro', 'Netherlands', 'North Macedonia', 'Norway', 'Poland', 'Portugal', 'Romania', 'Russia', 'San Marino', 'Serbia', 'Slovakia', 'Slovenia', 'Spain', 'Sweden', 'Switzerland', 'Ukraine', 'United Kingdom', 'Vatican City'],
    'Asia': ['Afghanistan', 'Armenia', 'Azerbaijan', 'Bahrain', 'Bangladesh', 'Bhutan', 'Brunei', 'Cambodia', 'China', 'Cyprus', 'Georgia', 'India', 'Indonesia', 'Iran', 'Iraq', 'Israel', 'Japan', 'Jordan', 'Kazakhstan', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Lebanon', 'Malaysia', 'Maldives', 'Mongolia', 'Myanmar', 'Nepal', 'North Korea', 'Oman', 'Pakistan', 'Palestine', 'Philippines', 'Qatar', 'Saudi Arabia', 'Singapore', 'South Korea', 'Sri Lanka', 'Syria', 'Taiwan', 'Tajikistan', 'Thailand', 'Timor-Leste', 'Turkey', 'Turkmenistan', 'United Arab Emirates', 'Uzbekistan', 'Vietnam', 'Yemen'],
    'Africa': [
        'Algeria', 'Angola', 'Benin', 'Botswana', 'Burkina Faso', 'Burundi', 
        'Cameroon', 'Cape Verde', 'Central African Republic', 'Chad', 'Comoros', 
        'Republic of the Congo', 'Democratic Republic of the Congo', 'Djibouti', 
        'Egypt', 'Equatorial Guinea', 'Eritrea', 'Ethiopia', 'Gabon', 'Gambia', 
        'Ghana', 'Guinea', 'Guinea-Bissau', 'Ivory Coast', 'Kenya', 'Lesotho', 
        'Liberia', 'Libya', 'Madagascar', 'Malawi', 'Mali', 'Mauritania', 
        'Mauritius', 'Morocco', 'Mozambique', 'Namibia', 'Niger', 'Nigeria', 
        'Rwanda', 'Sao Tome and Principe', 'Senegal', 'Seychelles', 'Sierra Leone', 
        'Somalia', 'South Africa', 'South Sudan', 'Sudan', 'Eswatini', 'Tanzania', 
        'Togo', 'Tunisia', 'Uganda', 'Western Sahara', 'Zambia', 'Zimbabwe'
    ],
    'Northern America': ['Canada', 'United States', 'Mexico'],
    'South America': ['Argentina', 'Bolivia', 'Brazil', 'Chile', 'Colombia', 'Ecuador', 'Guyana', 'Paraguay', 'Peru', 'Suriname', 'Uruguay', 'Venezuela'],
    'Oceania': ['Australia', 'Fiji', 'Kiribati', 'Marshall Islands', 'Micronesia', 'Nauru', 'New Zealand', 'Palau', 'Papua New Guinea', 'Samoa', 'Solomon Islands', 'Tonga', 'Tuvalu', 'Vanuatu']
};

// In the loadData function, store the initial opacity scale globally
let opacityScale;

// Add error handling for data loading
function loadData() {
    console.log('Loading data...');
    console.log('Current crop type:', currentCropType);
    console.log('Current year:', currentYear);

    // Clear existing charts
    d3.select("#bar-chart").selectAll("*").remove();
    d3.select("#area-chart").selectAll("*").remove();
    gBmap.selectAll("circle").remove();
    gBmap.selectAll("path").remove();

    // Load world map data first
    d3.json("data/countries-110m.json").then(worldData => {
        console.log('World map data loaded');

        // Then load production data
        return d3.csv("data/Map1.csv").then(data => {
            console.log('Production data loaded');
        // Filter data for current crop type and year
        data = data.filter(d => d.category === currentCropType && +d.year === currentYear);
        
        // Process CSV data
        data.forEach(d => {
            d.value = +d.value;
            d.year = +d.year;
            d.country_code = +d.country_code;
            if (countryCoords[d.country_or_area]) {
                d.coords = countryCoords[d.country_or_area];
            }
        });

            console.log('Processed data:', data);

        // Get data for each country for the map
        const circleData = data.filter(d => d.coords);
            console.log('Circle data:', circleData);

            // Draw the map
            const countries = topojson.feature(worldData, worldData.objects.countries);
            gBmap.selectAll("path")
                .data(countries.features)
                .enter()
                .append("path")
                .attr("class", "country")
                .attr("d", path)
                .attr("data-name", d => d.properties.name)
                .style("fill", "#f0f0f0")
                .style("stroke", "#999")
                .style("stroke-width", "0.5px");

        // Calculate max value for color scale and size scale
        const maxValue = d3.max(circleData, d => d.value);
        colorScales[currentCropType].domain([0, maxValue]);

        // Update size scale domain
        sizeScale.domain([0, maxValue]);

            // Create opacity scale and store it globally
            opacityScale = d3.scaleLinear()
            .domain([0, maxValue])
            .range([0.5, 1]);

        // Create circles
        const circles = gBmap.selectAll("circle")
            .data(circleData)
            .enter()
            .append("circle")
            .attr("cx", d => projection(d.coords)[0])
            .attr("cy", d => projection(d.coords)[1])
            .attr("r", d => sizeScale(d.value))
                .style("fill", "rgb(37, 60, 41)")
            .style("opacity", d => opacityScale(d.value))
                .attr("data-original-opacity", d => opacityScale(d.value))
            .style("cursor", "pointer")
            .on("mouseover", function(event, d) {
                    handleCircleMouseOver(event, d, this, circles);
            })
            .on("mouseout", function(event, d) {
                    handleCircleMouseOut(this, circles);
                });

            // Load Map2.csv for regional data
            return d3.csv("data/Map2.csv").then(regionalData => {
                console.log('Regional data loaded');
                
                // Filter regional data for current crop type
                regionalData = regionalData.filter(d => d.category === currentCropType);
                regionalData.forEach(d => {
                d.value = +d.value;
                d.year = +d.year;
            });

                console.log('Processed regional data:', regionalData);

            // Process data for bar chart
                const regions = ['Africa', 'Asia', 'Europe', 'Northern America', 'South America', 'Oceania'];
                const currentYearData = regionalData.filter(d => 
                    regions.includes(d.country_or_area) && d.year === currentYear
                );
            
            // Calculate total production for each region
            const regionData = currentYearData.map(d => ({
                region: d.country_or_area,
                production: d.value
            }));
            
            // Sort by production
            regionData.sort((a, b) => b.production - a.production);
                console.log('Region data for bar chart:', regionData);

                // Create bar chart
            createStackedBarChart(regionData, circles);

                // Process data for area chart
                const groupedData = d3.group(regionalData.filter(d => regions.includes(d.country_or_area)), d => d.country_or_area);
            const processedData = [];
            groupedData.forEach((values, region) => {
                const sortedValues = values.sort((a, b) => a.year - b.year);
                processedData.push({
                    region: region,
                    values: sortedValues
                });
            });

                console.log('Processed data for area chart:', processedData);

                // Create area chart
                createStackedAreaChart(processedData, circles);
            });
        });
    }).catch(error => {
        console.error('Error loading data:', error);
    });
}

function createStackedBarChart(data, circles) {
    console.log('Creating bar chart with data:', data);
    console.log('Region colors:', regionColors);
    
    const margin = {top: 10, right: 0, bottom: 0, left: 70};
    const width = bmapWidth - margin.left - margin.right;
    const height = 60;

    // Clear existing content
    d3.select("#bar-chart").selectAll("svg").remove();

    // Create SVG
    const svg = d3.select("#bar-chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Sort data by production value (descending)
    data.sort((a, b) => b.production - a.production);

    // Debug log
    console.log('Sorted data:', data);

    // Calculate total production and convert to millions
    const totalProduction = d3.sum(data, d => d.production) / 1000000;

    // Calculate cumulative positions for each region
    let cumulative = 0;
    data.forEach(d => {
        d.start = cumulative;
        d.productionInMillions = d.production / 1000000;
        d.proportion = d.productionInMillions / totalProduction;
        cumulative += d.proportion;
        console.log(`Region: ${d.region}, Start: ${d.start}, Proportion: ${d.proportion}`); // Debug log
    });

    // Create scales
    const x = d3.scaleLinear()
        .range([0, width])
        .domain([0, 1]);

    // Create segment groups that will contain both rectangle and labels
    const segmentGroups = svg.selectAll(".segment-group")
        .data(data)
        .enter()
        .append("g")
        .attr("class", d => `segment-group segment-group-${d.region.replace(/\s+/g, '-')}`)
        .style("cursor", "pointer")
        .on("mouseover", function(event, d) {
            highlightRegion(d.region);
        })
        .on("mouseout", function() {
            resetHighlight();
        });

    // Add rectangles to groups
    segmentGroups.append("rect")
        .attr("class", d => `segment segment-${d.region.replace(/\s+/g, '-')}`)
        .attr("x", d => x(d.start))
        .attr("y", 0)
        .attr("width", d => x(d.proportion))
        .attr("height", height)
        .attr("fill", d => regionColors[d.region])
        .style("opacity", 0.8);

    // Add labels to groups
    segmentGroups.each(function(d) {
        const group = d3.select(this);
        const xPos = x(d.start + d.proportion/2);
        const yPos = height/2;

        // Add region name
        group.append("text")
            .attr("class", "region-name")
            .attr("x", xPos)
            .attr("y", yPos)
            .attr("dy", "-0.2em")
            .attr("text-anchor", "middle")
            .style("fill", "#ffffff")
            .style("font-size", "12px")
        .style("font-weight", "bold")
        .style("pointer-events", "none")
            .text(d.region);

        // Add value
        group.append("text")
            .attr("class", "value-label")
            .attr("x", xPos)
            .attr("y", yPos)
            .attr("dy", "1em")
            .attr("text-anchor", "middle")
            .style("fill", "#ffffff")
            .style("font-size", "12px")
        .style("pointer-events", "none")
            .text(Math.round(d.productionInMillions));
    });

    // Debug log
    console.log('Bar chart creation completed');
}

function createStackedAreaChart(data, circles) {
    console.log('Creating area chart with data:', data);
    console.log('Region colors:', regionColors);
    
    const margin = {top: 10, right: 0, bottom: 40, left: 70};
    const width = bmapWidth - margin.left - margin.right;
    const height = 200;

    // Clear any existing content
    d3.select("#area-chart").selectAll("*").remove();

    const svg = d3.select("#area-chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .style("background", "transparent")
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Calculate total production for each region to determine order
    const regionTotals = data.map(region => ({
        region: region.region,
        total: d3.sum(region.values, v => v.value)
    }));
    
    // Sort regions by total production (descending)
    regionTotals.sort((a, b) => b.total - a.total);
    let orderedRegions = regionTotals.map(r => r.region);

    // Debug log
    console.log('Ordered regions:', orderedRegions);

    // Process data for stacking
    const years = Array.from(new Set(data[0].values.map(d => d.year))).sort();
    const stackData = years.map(year => {
        const yearData = { year: new Date(year, 0, 1) };
        orderedRegions.forEach(region => {
            const regionData = data.find(d => d.region === region);
            const value = regionData.values.find(v => v.year === year);
            yearData[region] = value ? value.value / 1000000 : 0;
        });
        return yearData;
    });

    // Debug log
    console.log('Stack data:', stackData);

    // Create stack generator with ordered keys
    const stack = d3.stack()
        .keys(orderedRegions)
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetNone);

    const series = stack(stackData);

    // Debug log
    console.log('Stack series:', series);

    // Create scales
    const x = d3.scaleTime()
        .domain(d3.extent(stackData, d => d.year))
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(series, d => d3.max(d, d => d[1]))])
        .nice()
        .range([height, 0]);

    // Create area generator with smooth curves
    const area = d3.area()
        .x(d => x(d.data.year))
        .y0(d => y(d[0]))
        .y1(d => y(d[1]))
        .curve(d3.curveMonotoneX);

    // Add grid lines
    svg.append("g")
        .attr("class", "grid")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x)
            .ticks(10)
            .tickSize(-height)
            .tickFormat("")
        )
        .style("stroke", "rgba(37, 60, 41, 0.1)")
        .style("stroke-dasharray", "2,2");

    svg.append("g")
        .attr("class", "grid")
        .call(d3.axisLeft(y)
            .ticks(5)
            .tickSize(-width)
            .tickFormat("")
        )
        .style("stroke", "rgba(37, 60, 41, 0.1)")
        .style("stroke-dasharray", "2,2");

    // Add areas for each region with new colors
    const areas = svg.selectAll(".area")
        .data(series)
        .enter()
        .append("path")
        .attr("class", d => `area area-${d.key.replace(/\s+/g, '-')}`)
        .attr("d", area)
        .style("fill", d => {
            console.log('Region:', d.key, 'Color:', regionColors[d.key]); // Debug color assignment
            return regionColors[d.key];
        })
        .style("opacity", 0.8)
        .style("cursor", "pointer")
        .on("mouseover", function(event, d) {
            highlightRegion(d.key);
        })
        .on("mouseout", function() {
            resetHighlight();
        });

    // Add axes with custom styling
    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x)
            .ticks(10)
            .tickFormat(d3.timeFormat("%Y")))
        .selectAll("text")
        .style("text-anchor", "end")
        .style("fill", "rgb(37, 60, 41)")
        .style("font-size", "12px")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-45)");

    svg.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(y)
            .ticks(5)
            .tickFormat(d => `${d.toFixed(0)}M`))
        .selectAll("text")
        .style("fill", "rgb(37, 60, 41)")
        .style("font-size", "12px");

    // Style the axis lines
    svg.selectAll(".domain")
        .style("stroke", "rgba(37, 60, 41, 0.2)")
        .style("stroke-width", "1px");

    svg.selectAll(".tick line")
        .style("stroke", "rgba(37, 60, 41, 0.1)")
        .style("stroke-width", "1px");

    // Debug log
    console.log('Area chart creation completed');
}

// Update the highlightRegion function
function highlightRegion(region) {
    // Highlight area chart
    d3.selectAll(`.area`).transition().duration(200)
        .style("opacity", d => d.key === region ? 1 : 0.1)
        .style("filter", d => d.key === region ? "brightness(1.2)" : "none");

    // Highlight bar chart segments
    d3.selectAll(`.segment`).transition().duration(200)
        .style("opacity", d => d.region === region ? 1 : 0.1)
        .style("filter", d => d.region === region ? "brightness(1.2)" : "none");

    // Highlight value labels
    d3.selectAll(`.value-label`).transition().duration(200)
        .style("opacity", d => d.region === region ? 1 : 0.1);

    // Highlight region labels
    d3.selectAll(`.region-label`).transition().duration(200)
        .style("opacity", d => d.region === region ? 1 : 0.1);

    // Keep map countries unchanged
    d3.selectAll(".country").transition().duration(200)
        .style("opacity", 1)
        .style("filter", "none")
        .style("fill", "#f0f0f0")
        .style("stroke", "#999")
        .style("stroke-width", "0.5px");

    // Only highlight circles (bubbles) on the map for the selected region
    d3.selectAll("circle").transition().duration(200)
        .style("opacity", function(d) {
            const originalOpacity = this.getAttribute("data-original-opacity");
            if (regionCountryMap[region] && regionCountryMap[region].includes(d.country_or_area)) {
                return Math.min(1, parseFloat(originalOpacity) * 1.2); // Increase opacity but cap at 1
            }
            return 0.1;
        })
        .style("filter", function(d) {
            if (regionCountryMap[region] && regionCountryMap[region].includes(d.country_or_area)) {
                return "brightness(1.2) saturate(1.2)"; // Add more vibrancy to highlighted bubbles
            }
            return "none";
        })
        .style("fill", function(d) {
            if (regionCountryMap[region] && regionCountryMap[region].includes(d.country_or_area)) {
                return "rgb(37, 60, 41)"; // Highlight color for selected region's bubbles
            }
            return "rgb(37, 60, 41)"; // Default color for non-highlighted bubbles
        });
}

// Update the resetHighlight function
function resetHighlight() {
    // Reset area chart
    d3.selectAll(`.area`).transition().duration(200)
        .style("opacity", 0.8)
        .style("filter", "none");

    // Reset bar chart segments
    d3.selectAll(`.segment`).transition().duration(200)
        .style("opacity", 0.8)
        .style("filter", "none");

    // Reset value labels
    d3.selectAll(`.value-label`).transition().duration(200)
        .style("opacity", 1);

    // Reset region labels
    d3.selectAll(`.region-label`).transition().duration(200)
        .style("opacity", 1);

    // Keep map countries in their default state
    d3.selectAll(".country")
        .style("opacity", 1)
        .style("filter", "none")
        .style("fill", "#f0f0f0")
        .style("stroke", "#999")
        .style("stroke-width", "0.5px");

    // Reset map circles to their original state
    d3.selectAll("circle").transition().duration(200)
        .style("opacity", function() {
            return this.getAttribute("data-original-opacity");
        })
        .style("filter", "none")
        .style("fill", "rgb(37, 60, 41)");
}

// Add these functions before loadData
function handleCircleMouseOver(event, d, circle, circles) {
    // Show tooltip
    mapTooltip.transition()
        .duration(200)
        .style("opacity", .9);
    mapTooltip.html(`
        <div style="font-weight: bold; margin-bottom: 5px;">${d.country_or_area}</div>
        <div>Crop: ${cropDisplayNames[currentCropType]}</div>
        <div>Production: ${(d.value / 1000000).toFixed(1)}M tonnes</div>
        <div>Year: ${d.year}</div>
    `)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");

    // Highlight this circle
    d3.select(circle)
        .transition()
        .duration(200)
        .style("opacity", 1)
        .style("fill", "#4CAF50");

    // Dim other circles
    circles.filter(c => c !== d)
        .transition()
        .duration(200)
        .style("opacity", 0.3);
}

function handleCircleMouseOut(circle, circles) {
    // Hide tooltip
    mapTooltip.transition()
        .duration(500)
        .style("opacity", 0);

    // Restore all circles
    circles.transition()
        .duration(200)
        .style("opacity", d => opacityScale(d.value))
        .style("fill", "rgb(37, 60, 41)");
}