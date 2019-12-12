import * as d3Base from 'd3';
import {group} from 'd3-array';
import * as topojson from 'topojson';
import domains from './domain_list'
import socket from './index';
import {quantile} from "d3";

const d3 = Object.assign(d3Base, {group});
let svg = null;
let projection = null;
let data = [];
let displayMobile = false;
let mapHeight;

// data = [{favicon: '', avg: 0.0}]
let bar_initialized = false;
//Set size of svg element and chart
const width = 500,
    height = domains.length * 20,
    categoryIndent = 4 * 15 + 5,
    defaultBarWidth = 2000;
let y = null;
let x = null;
let bar_svg = null;

const prettifyCity = city => {
    return city.replace(/\b\w/g, function(l){ return l.toUpperCase() })   // Replace first letters of all words with uppercase letters. \b finds the boundary characters (first letters) of all words found by \w
               .replace(/\B\w/g, function(l){ return l.toLowerCase() });
};

const initializeBar = function () {
    bar_initialized = true;
    //Set up scales
    x = d3.scaleLinear()
        .domain([0, defaultBarWidth])
        .range([0, width]);
    y = d3.scaleBand()
        .range([0, height]).round([0.1, 0]);

    //Create SVG element
    d3.select("#bar_chart").selectAll("svg").remove();
    bar_svg = d3.select("#bar_chart").append("svg")
        .attr("width", width)
        .attr("height", height + chartHeader)
        .append("g");


    bar_svg.append('text')
        .attr("class", "chart-header")
        .attr("dominant-baseline", "hanging")
        .attr("text-anchor", "middle")
        .attr("font-size", 18)
        .attr("font-weight", "bold")
        .attr("fill", "#0367A6")
        .attr("y", 5)
        .attr("x", width / 2)
        .text("Rolling Average of Locally Collected Data (ms)");

    bar_svg.append('text')
        .attr("class", "chart-header")
        .attr("dominant-baseline", "hanging")
        .attr("text-anchor", "middle")
        .attr("font-size", 16)
        .attr("fill", "#0367A6")
        .attr("y", 30)
        .attr("x", width / 2)
        .text("(Page Alexa Rank)");
};

const displayBar = function (raw_data) {
    const data = [];

    for (let [key, value] of Object.entries(raw_data)) {
        data.push({key: key, value: value.avg, max: value.max});
    }

    y.domain(data.sort(function(a, b) {
        if(isFinite(b.value-a.value)) {
            return b.value-a.value;
        } else {
            return isFinite(a.value) ? -1 : 1;
        }
    }).map(function (d) {
        return d.key;
    }));

    const barMax = d3.max(data, function (e) {
        return e.value; //max
    });
    x.domain([0, barMax]);

    /////////
    //ENTER//
    /////////

    //Bind new data to chart rows

    //Create chart row and move to below the bottom of the chart
    const chartRow = bar_svg.selectAll("g.chartRow")
        .data(data, function (d) {
            return d.key
        });
    const newRow = chartRow
        .enter()
        .append("g")
        .attr("class", "chartRow")
        .attr("transform", "translate(0," + height + chartHeader + ")");

    //Add rectangles
    newRow.insert("rect")
        .attr("class", "bar")
        .attr("x", 0)
        .attr("opacity", 0)
        .attr("id", (d,i) => `barChartRect_${i}`)
        .attr("height", y.bandwidth())
        .attr("width", function (d) {
            return x(d.value);
        });

    //Add value labels
    newRow.append("text")
        .attr("class", "label")
        .attr("fill", "#fff")
        .attr("y", y.bandwidth() / 2)
        .attr("x", 0)
        .attr("opacity", 1)
        .attr("dy", ".35em")
        .attr("dx", "0.5em")
        .text(d => d.value);

    //Add Headlines
    newRow.append("text")
        .attr("class", "category")
        .attr("text-overflow", "ellipsis")
        .attr("fill", "#0367A5")
        .attr("y", y.bandwidth() / 2)
        .attr("x", categoryIndent)
        .attr("opacity", 0)
        .attr("dy", ".35em")
        .attr("dx", "0.5em")
        .text(function (d) {
            return d.key
        });

    newRow.append("clipPath")
        .attr("id", (d,i) => `clipPath_${i}`)
        .append("use")
        .attr("xlink:href", (d,i) => `#barChartRect_${i}`);

    //Add Headlines, but white this time
    newRow.append("text")
        .attr("class", "category")
        .attr("text-overflow", "ellipsis")
        .attr("fill", "#fff")
        .attr("y", y.bandwidth() / 2)
        .attr("x", categoryIndent)
        .attr("opacity", 1)
        .attr("dy", ".35em")
        .attr("dx", "0.5em")
        .style("clip-path", (d, i) => `url("#clipPath_${i}")`)
        .text(function (d) {
            return d.key
        });

    chartRow.select(".bar").transition()
        .duration(300)
        .attr("width", function (d) {
            return x(d.value);
        })
        .attr("opacity", 1);

    //Update data labels
    chartRow.select(".label").transition()
        .duration(300)
        .attr("opacity", 1)
        .tween("text", function (d) {
            +this.textContent.replace(/,/g, '');
            return () => {
                this.textContent = isNaN(Math.round(d.value)) ? "-" : Math.round(d.value);
            };
        });

    //Fade in categories
    chartRow.select(".category").transition()
        .duration(300)
        .attr("opacity", 1);


    ////////
    //EXIT//
    ////////

    //Fade out and remove exit elements
    chartRow.exit().transition()
        .style("opacity", "0")
        .attr("transform", "translate(0," + height + ")")
        .remove();

    chartRow.transition()
        .duration(900)
        .attr("transform", function (d) {
            return "translate(0," + (y(d.key) + chartHeader) + ")";
        });
};

const chartHeader = 60;
const scaleFooter = 10;
const setupMap = function (width, height) {
    const scaleLength = 400;
    mapHeight = height + scaleFooter;
    projection = d3.geoAlbersUsa()
        .translate([width / 2, height / 2 + chartHeader])
        .scale([1000]);

    let path = d3.geoPath()
        .projection(projection);

    svg = d3.select("#map_div")
        .append("svg")
        .attr("width", width)
        .attr("height", height + chartHeader);

    let constGradient = d3.scaleSequential(d3.interpolateOrRd)
    //.range(["#fff", "#BF303C"])
        .domain([0, scaleLength]);

    svg.append('text')
        .attr("class", "chart-header")
        .attr("dominant-baseline", "hanging")
        .attr("text-anchor", "middle")
        .attr("font-size", 18)
        .attr("font-weight", "bold")
        .attr("fill", "#0367A6")
        .attr("y", 5)
        .attr("x", width / 2)
        .text("Country-wide Data Aggregated by City");

    svg.append('text')
        .attr("class", "chart-header")
        .attr("dominant-baseline", "hanging")
        .attr("text-anchor", "middle")
        .attr("font-size", 16)
        .attr("fill", "#0367A6")
        .attr("y", 30)
        .attr("x", width / 2)
        .text("Use the buttons below to select between data from devices on mobile or non-mobile networks");

    svg.append('text')
        .attr("id", "selected_favicon_display")
        .attr("dominant-baseline", "hanging")
        .attr("text-anchor", "middle")
        .attr("y", 25 + chartHeader)
        .attr("x", width / 2)
        .text(displayMobile ? "Mobile Data" : "Non-Mobile Data");


    d3.json("us-named.topojson").then(us => {
        const counties = topojson.feature(us, us.objects.counties);
        svg.selectAll("path")
            .data(counties.features)
            .enter()
            .append("path")
            .attr("d", path)
            .style("fill", "#0367A6");

        svg.append("path")
            .datum(topojson.mesh(us, us.objects.states, (a, b) => a !== b))
            .attr("fill", "none")
            .attr("stroke", "white")
            .attr("stroke-linejoin", "round")
            .attr("d", path);

        socket.emit('getData');
        socket.emit('getData');
        socket.emit('getTopCities');
        socket.emit('getTopStates');

    });

    let bars = svg.selectAll(".bars")
        .data(d3.range(0, scaleLength), d => d);
    bars.exit().remove();
    bars.enter()
        .append("rect")
        .attr("class", "bars")
        .attr("x", function (d, i) {
            return i + 60;
        })
        .attr("y", mapHeight - 20 + chartHeader)
        .attr("height", 20)
        .attr("width", 1)
        .style("fill", function (d) {
            return constGradient(d);
        });

    svg.append('text')
        .attr("id", "maxScaleLabel")
        .attr("class", "scaleLabel")
        .attr("y", mapHeight - scaleFooter + chartHeader)
        .attr("x", scaleLength + 70)
        .style('fill', '#0367A5')
        .text("");

    svg.append('text')
        .attr("id", "minScaleLabel")
        .attr("class", "scaleLabel")
        .attr("y", mapHeight - scaleFooter + chartHeader)
        .attr("x", 0)
        .style('fill', '#0367A5')
        .text("0ms");

    document.querySelector("#view_mobile").onclick = () => {setMobile(true)};
    document.querySelector("#view_non_mobile").onclick = () => {setMobile(false)};
};

const setMobile = function(m) {
    displayMobile = m;
    updateMap();
    updateMap();
    document.querySelector("#selected_favicon_display").innerHTML = displayMobile ? "Mobile Data" : "Non-Mobile Data";
};

const updateRTTLeaderBoards = () => {
    const top_mobile = data.filter(d => d.isMobile === true && d.city !== "").sort((a, b) => a.avg_rtt - b.avg_rtt).splice(0, 5);
    const top_non_mobile = data.filter(d => d.isMobile === false && d.city !== "").sort((a, b) => a.avg_rtt - b.avg_rtt).splice(0, 5);
    const worst_mobile = data.filter(d => d.isMobile === true && d.city !== "").sort((a, b) => b.avg_rtt - a.avg_rtt).splice(0, 5);
    const worst_non_mobile = data.filter(d => d.isMobile === false && d.city !== "").sort((a, b) => b.avg_rtt - a.avg_rtt).splice(0, 5);

    const mobileLeaderboard = document.querySelector("#cityMobileRTTLeaderboard");
    mobileLeaderboard.innerHTML = "";
    top_mobile.forEach(item => {
        const city = prettifyCity(item["city"])
        mobileLeaderboard.innerHTML += `<li>${city}, ${item["_id"]["state"]} (${Math.round(item["avg_rtt"])} ms)</li>`
    });

    const nonMobileLeaderboard = document.querySelector("#cityNonMobileRTTLeaderboard");
    nonMobileLeaderboard.innerHTML = "";
    top_non_mobile.forEach(item => {
        const city = prettifyCity(item["city"])
        nonMobileLeaderboard.innerHTML += `<li>${city}, ${item["_id"]["state"]} (${Math.round(item["avg_rtt"])} ms)</li>`
    });
    const mobileLoserboard = document.querySelector("#cityMobileRTTLoserboard");
    mobileLoserboard.innerHTML = "";
    worst_mobile.forEach(item => {
        const city = prettifyCity(item["city"])
        mobileLoserboard.innerHTML += `<li>${city}, ${item["_id"]["state"]} (${Math.round(item["avg_rtt"])} ms)</li>`
    });

    const nonMobileLoserboard = document.querySelector("#cityNonMobileRTTLoserboard");
    nonMobileLoserboard.innerHTML = "";
    worst_non_mobile.forEach(item => {
        const city = prettifyCity(item["city"])
        nonMobileLoserboard.innerHTML += `<li>${city}, ${item["_id"]["state"]} (${Math.round(item["avg_rtt"])} ms)</li>`
    });
};

// data = [{favicon: "facebook.com", avg_rtt: 1.1, city: "Boston", latitude: "0.0", longitude: "0.0"}]
const updateMap = function () {

    updateRTTLeaderBoards();

    let div = d3.select("body")
        .append("div")
        .attr('class', "tooltip")
        .style("opacity", 0);

    const filtered = data.filter(d => d.isMobile === displayMobile);

    const maxValue = d3.max(filtered, d => d.avg_rtt);
    const minValue = d3.min(filtered, d => d.avg_rtt);

    let values = [];
    for (let i = 0; i < filtered.length; i++) {
        values.push(filtered[i].avg_rtt);
    }

    values = values.sort((a, b) => a - b);

    const q1 = d3.quantile(values, 0.25);
    const q2 = d3.quantile(values, 0.50);
    const q3 = d3.quantile(values, 0.75);
    const iqr = q3 - q1;

    const quantileFiltered = filtered.filter(d => d.avg_rtt <= (q2 + (iqr * 1.5))  && d.avg_rtt >= (q2 - (iqr * 1.5)));

    const scaleMin = Math.max(Math.round(d3.min(quantileFiltered, d => d.avg_rtt)), 0, Math.round(minValue));
    const scaleMax = Math.min(Math.round(d3.max(quantileFiltered, d => d.avg_rtt)), Math.round(maxValue));

    let scaledGradient = d3.scaleSequential(d3.interpolateOrRd)
    //.range(["#fff", "#BF303C"])
        .domain([scaleMin, scaleMax]);


    const mapPoint = svg.selectAll("circle").data(filtered);
    mapPoint.exit().remove();
    mapPoint.enter()
        .append("circle")
        .style("opacity", .7)
        .on("mouseover", d => {
            div.transition()
                .duration(200)
                .style("opacity", .9);
            const city = (d.city === undefined || d.city === null || d.city === "") ?
				"<span style='font-style:italic'>No City</span>" : prettifyCity(d.city);
            div.html(city + "<br>" + Math.round(d.avg_rtt) + " ms")
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px")
                .style("font-size", "15px")
        })
        .on("mouseout", () => {
            div.transition()
                .duration(200)
                .style("opacity", 0)
        });

    mapPoint.transition().duration(0)
        .attr("cx", function (d) {
            return projection([d.longitude, d.latitude])[0]
        })
        .attr("cy", function (d) {
            return projection([d.longitude, d.latitude])[1]
        })
        .attr("r", 7)
        .style("fill", function (d) {
            return scaledGradient(d.avg_rtt)
        });

    if (maxValue !== undefined) {
        document.querySelector("#minScaleLabel").textContent = `≤${scaleMin}ms`;
        document.querySelector("#maxScaleLabel").textContent = "≥" + Math.round(scaleMax) + "ms";
    }


};

const updateMapData = function (newData) {
    data = newData;
    updateMap();
    updateMap();
};

// Given a list of rankings, put them into the ordered list under the map
const updateTopCitiesByIP = function (rankings) {
    const leaderboard = document.querySelector("#cityIPLeaderboard");
    leaderboard.innerHTML = "";
    rankings.forEach(item => {
        const city = prettifyCity(item["_id"]["city"])
        leaderboard.innerHTML += `<li>${city}, ${item["_id"]["state"]} (${item["count"]})</li>`
    });
};

const stateLookup = { AZ: 'Arizona',
    AL: 'Alabama',
    AK: 'Alaska',
    AR: 'Arkansas',
    CA: 'California',
    CO: 'Colorado',
    CT: 'Connecticut',
    DC: 'District of Columbia',
    DE: 'Delaware',
    FL: 'Florida',
    GA: 'Georgia',
    HI: 'Hawaii',
    ID: 'Idaho',
    IL: 'Illinois',
    IN: 'Indiana',
    IA: 'Iowa',
    KS: 'Kansas',
    KY: 'Kentucky',
    LA: 'Louisiana',
    ME: 'Maine',
    MD: 'Maryland',
    MA: 'Massachusetts',
    MI: 'Michigan',
    MN: 'Minnesota',
    MS: 'Mississippi',
    MO: 'Missouri',
    MT: 'Montana',
    NE: 'Nebraska',
    NV: 'Nevada',
    NH: 'New Hampshire',
    NJ: 'New Jersey',
    NM: 'New Mexico',
    NY: 'New York',
    NC: 'North Carolina',
    ND: 'North Dakota',
    OH: 'Ohio',
    OK: 'Oklahoma',
    OR: 'Oregon',
    PA: 'Pennsylvania',
    RI: 'Rhode Island',
    SC: 'South Carolina',
    SD: 'South Dakota',
    TN: 'Tennessee',
    TX: 'Texas',
    UT: 'Utah',
    VT: 'Vermont',
    VA: 'Virginia',
    WA: 'Washington',
    WV: 'West Virginia',
    WI: 'Wisconsin',
    WY: 'Wyoming' };

const updateTopStatesByIP = function (rankings) {
    const leaderboard = document.querySelector("#stateIPLeaderboard");
    leaderboard.innerHTML = "";
    rankings.forEach(item => {
        leaderboard.innerHTML += `<li>${stateLookup[item["_id"]["state"]]} (${item["count"]})</li>`
    });
};

export default {displayBar, updateMap, initializeBar, updateMapData, setupMap, updateTopCitiesByIP, updateTopStatesByIP}
