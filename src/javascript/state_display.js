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
let map4 = null;

const map1_column = "mean";
const map2_column = "median";
const map3_column = "min";
const map4_column = "max";

const stateLookup = {
	AZ: 'Arizona',
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
	WY: 'Wyoming'
};

const state_data = {};
d3.csv('state_data.csv').then(data => {
	data.forEach(d => {
		state_data[d['state']] = d;
	});

	// Once data is loaded, display the maps.
	createMaps();
	updateMaps();
});

// Gradient for maps one and three
// TODO: make gradient automatically update
const scaledGradient1 = d3.scaleSequential(d3.interpolateOrRd)
	.domain([60,250]);

const scaledGradient2 = d3.scaleSequential(d3.interpolateOrRd)
	.domain([60,250]);

const scaledGradient3 = d3.scaleSequential(d3.interpolateOrRd)
	.domain([0, 60]);

const scaledGradient4 = d3.scaleSequential(d3.interpolateOrRd)
	.domain([900, 6000]);

const createMaps = function() {
	console.log("Setting up map");
	map1 = state_map.default.createStateMap('#map_div_1', width, height, 650, '#7f7f7f');
	map2 = state_map.default.createStateMap('#map_div_2', width, height, 650, '#7f7f7f');
	map3 = state_map.default.createStateMap('#map_div_3', width, height, 650, '#7f7f7f');
	map4 = state_map.default.createStateMap('#map_div_4', width, height, 650, '#7f7f7f');
};

const updateMaps = function() {
	console.log("updating map");
	const map1_state_dictionary = {};
	for (let [key, value] of Object.entries(state_data)) {
		if (key in stateLookup) {
			map1_state_dictionary[key] = parseFloat(value[map1_column]);
		} else console.log(key + " does not exist")
	}

	// Map two is the difference between the columns for one and three
	const map2_state_dictionary = {};
	for (let [key, value] of Object.entries(state_data)) {
		if(key in stateLookup) {
			map2_state_dictionary[key] = parseFloat(value[map2_column]);
		} else console.log(key + " does not exist")
	}

	const map3_state_dictionary = {};
	for (let [key, value] of Object.entries(state_data)) {
		if(key in stateLookup) {
			map3_state_dictionary[key] = parseFloat(value[map3_column]);
		} else console.log(key + " does not exist")
	}

	const map4_state_dictionary = {};
	for (let [key, value] of Object.entries(state_data)) {
		if(key in stateLookup) {
			map4_state_dictionary[key] = parseFloat(value[map4_column]);
		} else console.log(key + " does not exist")
	}

	state_map.default.updateStateMap('#map_div_1', map1, scaledGradient1, map1_state_dictionary);
	state_map.default.updateStateMap('#map_div_2', map2, scaledGradient2, map2_state_dictionary);
	state_map.default.updateStateMap('#map_div_3', map3, scaledGradient3, map3_state_dictionary);
	state_map.default.updateStateMap('#map_div_4', map4, scaledGradient4, map4_state_dictionary);
};
