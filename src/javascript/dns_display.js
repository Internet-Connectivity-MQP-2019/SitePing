import "@babel/polyfill"

import * as d3Base from 'd3';
import {group} from 'd3-array';
import * as state_map from './state_map';

const d3 = Object.assign(d3Base, {group});

const width = 500;
const height = 300;

let map1 = null;
let map2 = null;
let map3 = null;

const dns_data = {};
d3.csv('results_aggregate_median_aggregate_mean.csv').then(data => {
	data.forEach(d => {
		dns_data[d['recursive_state']] = d;
	});

	// Once data is loaded, display the maps.
	createMaps();
	updateMaps();
});

// Gradient for maps one and three
// TODO: make gradient automatically update
const scaledGradient = d3.scaleSequential(d3.interpolateOrRd)
	.domain([30, 100]);
// Gradient for map two
const scaledGradient2 = d3.scaleSequential(d3.interpolateRdBu)
	.domain([-20, 20]);

const createMaps = () => {
	map1 = state_map.default.createStateMap('#map_div_1', width, height, 650, '#7f7f7f');
	map2 = state_map.default.createStateMap('#map_div_2', width, height, 650, '#7f7f7f');
	map3 = state_map.default.createStateMap('#map_div_3', width, height, 650, '#7f7f7f');
};

const updateMaps = function() {
	const map1_column = document.querySelector("#map_select_1").value;
	const map3_column = document.querySelector("#map_select_3").value;

	const map1_state_dictionary = {};
	for (let [key, value] of Object.entries(dns_data)) {
		map1_state_dictionary[key] = parseFloat(value[map1_column]);
	}

	// Map two is the difference between the columns for one and three
	const map2_state_dictionary = {};
	for (let [key, value] of Object.entries(dns_data)) {
		map2_state_dictionary[key] = parseFloat(value[map3_column]) - parseFloat(value[map1_column]);
	}

	const map3_state_dictionary = {};
	for (let [key, value] of Object.entries(dns_data)) {
		map3_state_dictionary[key] = parseFloat(value[map3_column]);
	}

	state_map.default.updateStateMap('#map_div_1', map1, scaledGradient, map1_state_dictionary);
	state_map.default.updateStateMap('#map_div_2', map2, scaledGradient2, map2_state_dictionary);
	state_map.default.updateStateMap('#map_div_3', map3, scaledGradient, map3_state_dictionary);
};

document.querySelector("#map_select_1").onchange = updateMaps;
document.querySelector("#map_select_3").onchange = updateMaps;

