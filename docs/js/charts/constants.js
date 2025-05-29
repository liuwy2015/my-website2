// Map dimensions and zoom settings
export const bmapWidth = 1100;
export const bmapHeight = 500;
export const minZoom = 0.5;
export const maxZoom = 10;

// Tooltip styles
export const tooltipStyles = {
    position: "absolute",
    background: "rgba(121, 58, 31, 0.8)",
    color: "rgba(121, 58, 31, 0.8)",
    padding: "10px",
    borderRadius: "5px",
    pointerEvents: "none",
    opacity: 0,
    fontSize: "12px",
    zIndex: "1000"
};

// Crop type mappings
export const cropCategoryMap = {
    cereals_total: 'cereals_total',
    cereals_rice_milled_eqv: 'cereals_rice_milled_eqv',
    coarse_grain_total: 'coarse_grain_total'
};

export const cropDisplayNames = {
    cereals_total: 'Total Cereals',
    cereals_rice_milled_eqv: 'Rice (Milled)',
    coarse_grain_total: 'Coarse Grains'
};

// Color scales for different crops
export const colorScales = {
    cereals_total: d3.scaleSequential(d3.interpolateOranges).domain([0, 1]),
    cereals_rice_milled_eqv: d3.scaleSequential(d3.interpolatePurples).domain([0, 1]),
    coarse_grain_total: d3.scaleSequential(d3.interpolateGreens).domain([0, 1])
};


// Green color palette for regions
export const greenRegionColors = {
    'Africa': "rgb(156, 255, 156)",
    'Asia': "rgb(111, 252, 111)",
    'Europe': "rgb(62, 186, 62)",
    'Americas': "rgb(28, 160, 28)",
    'South America': "rgb(47, 99, 47)",
    'Oceania': "rgb(16, 97, 16)"
};

// Country coordinates
export const countryCoords = {
    "China": [104.1954, 35.8617],
    "India": [78.9629, 20.5937],
    "United States": [-95.7129, 37.0902],
    "Brazil": [-51.9253, -14.2351],
    "Russia": [105.3188, 61.5240],
    "France": [2.2137, 46.2276],
    "Argentina": [-63.6167, -38.4161],
    "Ukraine": [31.1656, 48.3794],
    "Canada": [-106.3468, 56.1304],
    "Australia": [133.7751, -25.2744],
    "Turkey": [35.2433, 38.9637],
    "Nigeria": [8.6753, 9.0820],
    "Egypt": [30.8025, 26.8206],
    "Mexico": [-102.5528, 23.6345],
    "Indonesia": [113.9213, -0.7893],
    "Pakistan": [69.3451, 30.3753],
    "Bangladesh": [90.3563, 23.6850],
    "Vietnam": [108.2772, 14.0583],
    "Thailand": [100.9925, 15.8700],
    "Myanmar": [95.9560, 21.9162],
    "Iran": [53.6880, 32.4279],
    "Kazakhstan": [66.9237, 48.0196],
    "Poland": [19.1343, 51.9194],
    "Romania": [24.9668, 45.9432],
    "Germany": [10.4515, 51.1657],
    "Hungary": [19.5033, 47.1625],
    "Italy": [12.5674, 41.8719],
    "Spain": [3.7492, 40.4637],
    "United Kingdom": [-3.4360, 55.3781],
    "South Africa": [22.9375, -30.5595],
    "Morocco": [-7.0926, 31.7917],
    "Ethiopia": [40.4897, 9.1450],
    "Kenya": [37.9062, -0.0236],
    "Tanzania": [34.8888, -6.3690],
    "Uganda": [32.2903, 1.3733],
    "Mali": [-3.9962, 17.5707],
    "Burkina Faso": [-2.1832, 12.2383],
    "Ghana": [-1.0232, 7.9465],
    "Madagascar": [46.8691, -18.7669],
    "Cameroon": [12.3547, 7.3697],
    "Niger": [8.0817, 17.6078],
    "Chad": [18.7322, 15.4542],
    "Sudan": [30.2176, 12.8628],
    "Malawi": [34.3015, -13.2543],
    "Mozambique": [35.5296, -18.9655],
    "Zambia": [27.8546, -13.1339],
    "Zimbabwe": [29.1549, -19.0154],
    "Angola": [17.8739, -11.2027],
    "Peru": [-75.0152, -9.1900],
    "Colombia": [-74.2973, 4.5709],
    "Venezuela": [-66.5897, 6.4238],
    "Ecuador": [-78.1834, -1.8312],
    "Bolivia": [-63.5887, -16.2902],
    "Paraguay": [-58.4438, -23.4425],
    "Uruguay": [-55.7658, -32.5228],
    "Chile": [-71.5430, -35.6751],
    "Japan": [138.2529, 36.2048],
    "South Korea": [127.7669, 35.9078],
    "North Korea": [127.5101, 40.3399],
    "Philippines": [121.7740, 12.8797],
    "Malaysia": [101.9758, 4.2105],
    "Nepal": [84.1240, 28.3949],
    "Afghanistan": [67.7090, 33.9391],
    "Iraq": [43.6793, 33.2232],
    "Syria": [38.9968, 34.8021],
    "Jordan": [36.2384, 30.5852],
    "Israel": [34.8516, 32.1775],
    "Lebanon": [35.8623, 33.8547],
    "Serbia": [21.0059, 44.0165],
    "Croatia": [15.2000, 45.1000],
    "Bulgaria": [25.4858, 42.7339],
    "Greece": [21.8243, 39.0742],
    "Albania": [20.1683, 41.1533],
    "North Macedonia": [21.7453, 41.6086],
    "Bosnia and Herzegovina": [17.6791, 43.9159],
    "Slovenia": [14.9955, 46.1512],
    "Slovakia": [19.6990, 48.6690],
    "Czech Republic": [15.4730, 49.8175],
    "Austria": [14.5501, 47.5162],
    "Switzerland": [8.2275, 46.8182],
    "Belgium": [4.4699, 50.5039],
    "Netherlands": [5.2913, 52.1326],
    "Denmark": [9.5018, 55.6761],
    "Sweden": [18.6435, 60.1282],
    "Norway": [8.4689, 60.4720],
    "Finland": [25.7482, 61.9241],
    "Estonia": [25.0136, 58.5953],
    "Latvia": [24.6032, 56.8796],
    "Lithuania": [23.8813, 55.1694],
    "Belarus": [27.9534, 53.7098],
    "Moldova": [28.3699, 47.4116],
    "Georgia": [43.3569, 42.3154],
    "Armenia": [45.0382, 40.0691],
    "Azerbaijan": [47.5769, 40.1431],
    "Uzbekistan": [64.5853, 41.3775],
    "Turkmenistan": [59.5563, 38.9697],
    "Tajikistan": [71.2761, 38.8610],
    "Kyrgyzstan": [74.7661, 41.2044],
    "Mongolia": [103.8467, 46.8625],
    "Cambodia": [104.9910, 12.5657],
    "Laos": [102.4955, 19.8563],
    "Sri Lanka": [80.7718, 7.8731],
    "Maldives": [73.2207, 3.2028],
    "Bhutan": [90.4336, 27.5142],
    "Papua New Guinea": [143.9555, -6.3149],
    "Fiji": [179.4144, -16.5781],
    "Solomon Islands": [160.1562, -9.6457],
    "Vanuatu": [166.9592, -15.3767],
    "New Caledonia": [165.6180, -20.9043],
    "Samoa": [-172.1046, -13.7590],
    "Tonga": [-175.1982, -21.1789],
    "New Zealand": [174.8860, -40.9006]
}; 