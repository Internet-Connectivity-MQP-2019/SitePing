import * as d3Base from 'd3';
import {group} from 'd3-array';
import * as topojson from 'topojson';
import domains from './domain_list'
import socket from './index';
import {quantile} from "d3";

const d3 = Object.assign(d3Base, {group});
let cityMapSvg = null;
let stateMapSvg = null;
let mapHeaderSvg = null;
let mapFooterSvg = null;
let projection = null;
let path = null;
let data = [];
let displayMobile = false;
let stateView = false;
let mapHeight;
let mapWidth;


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

const chartHeader = 110;
const scaleFooter = 20;
const setupMap = function (width, height) {


    const scaleLength = 400;
    mapHeight = height;
    mapWidth = width
    projection = d3.geoAlbersUsa()
        .translate([width / 2, height / 2])
        .scale([1000]);

    path = d3.geoPath()
        .projection(projection);

    cityMapSvg = d3.select("#map_div_by_city")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    stateMapSvg = d3.select("#map_div_by_state")
        .append("svg")
        .attr("width", width)
        .attr("height", height);


    mapHeaderSvg = d3.select("#map_header_div")
        .append("svg")
        .attr("width", width)
        .attr("height", chartHeader);

    mapFooterSvg = d3.select("#map_footer_div")
        .append("svg")
        .attr("width", width)
        .attr("height", scaleFooter);


    let constGradient = d3.scaleSequential(d3.interpolateOrRd)
    //.range(["#fff", "#BF303C"])
        .domain([0, scaleLength]);

    mapHeaderSvg.append('text')
        .attr("id", "map_display_type")
        .attr("class", "chart-header")
        .attr("dominant-baseline", "hanging")
        .attr("text-anchor", "middle")
        .attr("font-size", 18)
        .attr("font-weight", "bold")
        .attr("fill", "#0367A6")
        .attr("y", 5)
        .attr("x", width / 2)
        .text("Country-wide Data Aggregated by " + (stateView ? "State" : "City"));

    mapHeaderSvg.append('text')
        .attr("class", "chart-header")
        .attr("dominant-baseline", "hanging")
        .attr("text-anchor", "middle")
        .attr("font-size", 16)
        .attr("fill", "#0367A6")
        .attr("y", 30)
        .attr("x", width / 2)
        .text("Use the buttons below to select between data from devices on mobile or non-mobile networks");

    mapHeaderSvg.append('text')
        .attr("id", "selected_favicon_display")
        .attr("dominant-baseline", "hanging")
        .attr("text-anchor", "middle")
        .attr("y", chartHeader - 50)
        .attr("x", width / 2)
        .text(displayMobile ? "Mobile Data" : "Non-Mobile Data");

    setupCityMap()

    socket.emit('getData');
    socket.emit('getData');
    socket.emit('getTopCities');
    socket.emit('getTopStates');

    let bars = mapFooterSvg.selectAll(".bars")
        .data(d3.range(0, scaleLength), d => d);
    bars.exit().remove();
    bars.enter()
        .append("rect")
        .attr("class", "bars")
        .attr("x", function (d, i) {
            return i + 60;
        })
        .attr("y", scaleFooter/2)
        .attr("height", 20)
        .attr("width", 1)
        .style("fill", function (d) {
            return constGradient(d);
        });

    mapFooterSvg.append('text')
        .attr("id", "maxScaleLabel")
        .attr("class", "scaleLabel")
        .attr("y", scaleFooter/2+10)
        .attr("x", scaleLength + 70)
        .style('fill', '#0367A5')
        .text("");

    mapFooterSvg.append('text')
        .attr("id", "minScaleLabel")
        .attr("class", "scaleLabel")
        .attr("y", scaleFooter/2+10)
        .attr("x", 0)
        .style('fill', '#0367A5')
        .text("0ms");

    document.querySelector("#view_mobile").onclick = () => {setMobile(true)};
    document.querySelector("#view_non_mobile").onclick = () => {setMobile(false)};

    document.querySelector("#view_by_state").onclick = () => {setStateView(true)};
    document.querySelector("#view_by_city").onclick = () => {setStateView(false)};

    if(stateView === true){
        document.getElementById("map_div_by_state").hidden = false;
        document.getElementById("map_div_by_city").hidden = true;
    }
    else {
        document.getElementById("map_div_by_state").hidden = true;
        document.getElementById("map_div_by_city").hidden = false;
    }

};

const setStateView = function(s) {
    stateView = s;
    if(stateView === true){
        document.getElementById("map_div_by_state").hidden = false;
        document.getElementById("map_div_by_city").hidden = true;
    }
    else {
        document.getElementById("map_div_by_state").hidden = true;
        document.getElementById("map_div_by_city").hidden = false;
    }
    //updateMap();
    document.querySelector("#map_display_type").innerHTML =
        "Country-wide Data Aggregated by " + (stateView ? "State" : "City");
    updateMap();
};
const setMobile = function(m) {
    displayMobile = m;
    updateMap();
    //updateMap();
    document.querySelector("#selected_favicon_display").innerHTML =
        displayMobile ? "Mobile Data" : "Non-Mobile Data";
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

const makeScaleGradient =  function (data) {

    const maxValue = d3.max(data, d => d.avg_rtt);
    const minValue = d3.min(data, d => d.avg_rtt);

    let values = [];
    for (let i = 0; i < data.length; i++) {
        values.push(data[i].avg_rtt);
    }

    values = values.sort((a, b) => a - b);

    const q1 = d3.quantile(values, 0.25);
    const q2 = d3.quantile(values, 0.50);
    const q3 = d3.quantile(values, 0.75);
    const iqr = q3 - q1;

    const quantileFiltered = data.filter(d => d.avg_rtt <= (q2 + (iqr * 1.5))  && d.avg_rtt >= (q2 - (iqr * 1.5)));

    const scaleMin = Math.max(Math.round(d3.min(quantileFiltered, d => d.avg_rtt)), 0, Math.round(minValue));
    const scaleMax = Math.min(Math.round(d3.max(quantileFiltered, d => d.avg_rtt)), Math.round(maxValue));

    let scaledGradient = d3.scaleSequential(d3.interpolateOrRd)
    //.range(["#fff", "#BF303C"])
        .domain([scaleMin, scaleMax]);

    if (maxValue !== undefined) {
        document.querySelector("#minScaleLabel").textContent = `≤${scaleMin}ms`;
        document.querySelector("#maxScaleLabel").textContent = "≥" + Math.round(scaleMax) + "ms";
    }

    return scaledGradient;

}

const updateMap = function(){
    updateRTTLeaderBoards();

    let div = d3.select("body")
        .append("div")
        .attr('class', "tooltip")
        .style("opacity", 0);

    const filteredMobile = data.filter(d => d.isMobile === displayMobile);


    if(stateView == true){

        let rawDataDict = {}
        let stateData = []
        let finalStateDataDict = {}
        for (let i = 0; i < filteredMobile.length; i++) {
            if(rawDataDict[filteredMobile[i]._id.state] == undefined){
                rawDataDict[filteredMobile[i]._id.state] = [];
            }
            rawDataDict[filteredMobile[i]._id.state].push(filteredMobile[i].avg_rtt);
        }

        let min = 1000
        let max = 0
        Object.keys(rawDataDict).forEach(stateName => {
            let sum = 0;
            let count = 0;
            let currentData = rawDataDict[stateName]

            for (let i = 0; i < currentData.length; i++){
                sum = sum + currentData[i];
                count ++;
            };
            const stateAvg = sum/count;

            if(stateAvg < min) min = stateAvg;
            if(stateAvg > max) max = stateAvg;
            stateData.push({"avg_rtt": stateAvg, "state_name": stateLookup[stateName]})
            finalStateDataDict[stateLookup[stateName]]= stateAvg
        })

        let scaledGradient = makeScaleGradient(stateData)

        updatesStateMap(div, finalStateDataDict, scaledGradient)
    }
    else {
        let scaledGradient = makeScaleGradient(data);
        updatesCityMap(div, filteredMobile, scaledGradient)


    }

}

const updatesStateMap = function (div, stateData, scaledGradient) {

    stateMapSvg.selectAll("path").remove()
    stateMapSvg.selectAll("circle").remove();

    d3.json("us-named.topojson").then(us => {
        const counties = topojson.feature(us, us.objects.counties);
        const states = topojson.feature(us, us.objects.states);
        stateMapSvg.selectAll("path")
            .data(states.features)
            .enter()
            .append("path")
            .attr("d", path)
            .style("fill", function(d) {
                //console.log(d.properties.name)
                let stateName = d.properties.name
                if(Object.keys(stateData).includes(stateName))
                    return scaledGradient(stateData[d.properties.name])
                return "#7f7f7f"
            }).on("mouseover", d => {
            div.transition()
                .duration(200)
                .style("opacity", .9);
            const state = d.properties.name
            let rttString = "No Data"
            let stateName = d.properties.name
            if(Object.keys(stateData).includes(stateName))
                rttString = Math.round(stateData[d.properties.name]) +" ms"
            div.html(state + "<br>" + rttString)
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px")
                .style("font-size", "15px")
        })
            .on("mouseout", () => {
                div.transition()
                    .duration(200)
                    .style("opacity", 0)
            });


        stateMapSvg.append("path")
            .datum(topojson.mesh(us, us.objects.states, (a, b) => a !== b))
            .attr("fill", "none")
            .attr("stroke", "white")
            .attr("stroke-linejoin", "round")
            .attr("d", path)

    });


}

const setupCityMap = function () {
    //mapSvg.selectAll("circle").remove();

    d3.json("us-named.topojson").then(us => {
        const counties = topojson.feature(us, us.objects.counties);
        cityMapSvg.selectAll("path")
            .data(counties.features)
            .enter()
            .insert("path")
            .attr("d", path)
            .style("fill", function(d) {
                return "#0367A6"
            });


        cityMapSvg.insert("path")
            .datum(topojson.mesh(us, us.objects.states, (a, b) => a !== b))
            .attr("fill", "none")
            .attr("stroke", "white")
            .attr("stroke-linejoin", "round")
            .attr("d", path)

    });
}

// data = [{favicon: "facebook.com", avg_rtt: 1.1, city: "Boston", latitude: "0.0", longitude: "0.0"}]
const updatesCityMap = function (div, filtered, scaledGradient) {
    const mapPoint = cityMapSvg.selectAll("circle").data(filtered);
    //mapPoint.exit().remove();
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


};

const updateMapData = function (newData) {
    data = newData;
    //updateMap();
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
