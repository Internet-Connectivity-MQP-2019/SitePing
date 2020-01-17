import "@babel/polyfill"

import * as d3Base from 'd3';
import {group} from 'd3-array';
import * as topojson from 'topojson';

const d3 = Object.assign(d3Base, {group});

const width = 500;
const height = 300;

const mapSvg1 = d3.select("#map_div_1")
	.append("svg")
	.attr("width", width)
	.attr("height", height);

const mapSvg2 = d3.select("#map_div_2")
	.append("svg")
	.attr("width", width)
	.attr("height", height);

const mapSvg3 = d3.select("#map_div_3")
	.append("svg")
	.attr("width", width)
	.attr("height", height);

const projection = d3.geoAlbersUsa()
	.translate([width / 2, height / 2])
	.scale([650]);

const path = d3.geoPath()
	.projection(projection);

let states = null;
const dns_data = {};
d3.json("us-named.topojson").then(us => {
	states = topojson.feature(us, us.objects.states);

	mapSvg1.selectAll("path")
		.data(states.features)
		.enter()
		.append("path")
		.attr("d", path)
		.style("fill", function (d) {
			return '#7f7f7f';
		});
	mapSvg2.selectAll("path")
		.data(states.features)
		.enter()
		.append("path")
		.attr("d", path)
		.style("fill", function (d) {
			return '#7f7f7f';
		});
	mapSvg3.selectAll("path")
		.data(states.features)
		.enter()
		.append("path")
		.attr("d", path)
		.style("fill", function (d) {
			return '#7f7f7f';
		});

	d3.csv('results_aggregate_median_aggregate_mean.csv').then(data => {
		data.forEach(d => {
			dns_data[d['recursive_state']] = d;
		});

		updateMap();
	});
});

let scaledGradient = d3.scaleSequential(d3.interpolateOrRd)
	.domain([30, 100]);
let scaledGradient2 = d3.scaleSequential(d3.interpolateRdBu)
	.domain([-20, 20]);

const updateMap = function() {
		const map1_column = document.querySelector("#map_select_1").value;
		const map3_column = document.querySelector("#map_select_3").value;
		mapSvg1.selectAll("path").remove();
		mapSvg1.selectAll("path")
			.data(states.features)
			.enter()
			.append("path")
			.attr("d", path)
			.style("fill", function (d) {
				if (d.properties.code in dns_data) {
					const stateAverage = parseFloat(dns_data[d.properties.code][map1_column]);
					if (stateAverage === undefined || isNaN(stateAverage) || stateAverage === null) {
						return '#7f7f7f'
					}
					return scaledGradient(stateAverage);
				}

				return '#7f7f7f';
			});
	mapSvg3.selectAll("path").remove();
	mapSvg3.selectAll("path")
		.data(states.features)
		.enter()
		.append("path")
		.attr("d", path)
		.style("fill", function (d) {
			if (d.properties.code in dns_data) {
				const stateAverage = parseFloat(dns_data[d.properties.code][map3_column]);
				if (stateAverage === undefined || isNaN(stateAverage) || stateAverage === null) {
					return '#7f7f7f'
				}
				return scaledGradient(stateAverage);
			}

			return '#7f7f7f';
		});
	mapSvg2.selectAll("path").remove();
	mapSvg2.selectAll("path")
		.data(states.features)
		.enter()
		.append("path")
		.attr("d", path)
		.style("fill", function (d) {
			if (d.properties.code in dns_data) {
				const stateAverage = parseFloat(dns_data[d.properties.code][map3_column]) - parseFloat(dns_data[d.properties.code][map1_column]);
				if (stateAverage === undefined || isNaN(stateAverage) || stateAverage === null) {
					return '#7f7f7f'
				}
				return scaledGradient2(stateAverage);
			}

			return '#7f7f7f';
		});
};

document.querySelector("#map_select_1").onchange = updateMap;
document.querySelector("#map_select_3").onchange = updateMap;

