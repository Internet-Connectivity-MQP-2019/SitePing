import * as d3Base from 'd3';
import {group} from 'd3-array';
import * as topojson from 'topojson';

const d3 = Object.assign(d3Base, {group});

let us_named_topojson = null;
d3.json("us-named.topojson").then(us => {
	us_named_topojson = topojson.feature(us, us.objects.states);
});


// Initialize a state map. The div_id must include a '#'. The map will be drawn with defaultColor for each state.
// Use updateStateMap to update the colors.
const createStateMap = (div_id, width, height, scale, defaultColor) => {
	const div = document.querySelector(div_id);

	// Initialize the projection and path based on the user's parameters
	const projection = d3.geoAlbersUsa()
		.translate([width / 2, height / 2])
		.scale([scale]);

	const path = d3.geoPath()
		.projection(projection);

	// Store information about this map in the div
	div.dataset.map_width = width;
	div.dataset.map_height = height;
	div.dataset.map_scale = scale;
	div.dataset.default_color = defaultColor;

	// Create the SVG
	const svg = d3.select(div_id)
		.append("svg")
		.attr("width", width)
		.attr("height", height);

	// Allow initialization of the state data
	while (us_named_topojson === null) {}

	// Draw the map with the default color
	svg.selectAll("path")
		.data(us_named_topojson.features)
		.enter()
		.append("path")
		.attr("d", path)
		.style("fill", div.dataset.default_color);

	return svg;
};

// Again, div_id must be a valid div id with a '#'. The svg is the value returned by createStateMap.
// Color gradient is used to get colors.
// State dictionary is a map from state code ('AZ', 'CO', ...) OR state name to a value that is passed into the gradient
const updateStateMap = (div_id, svg, colorGradient, stateDictionary) => {
	const div = document.querySelector(div_id);

	// Retrieve stored constants
	const width = parseInt(div.dataset.map_width);
	const height = parseInt(div.dataset.map_height);
	const scale = parseInt(div.dataset.map_scale);
	const default_color = div.dataset.default_color;

	// Recreate the projection and path used for this map
	const projection = d3.geoAlbersUsa()
		.translate([width / 2, height / 2])
		.scale([scale]);

	const path = d3.geoPath()
		.projection(projection);

	// Remove elements
	svg.selectAll("path").remove();

	// Redraw elements
	svg.selectAll("path")
		.data(us_named_topojson.features)
		.enter()
		.append("path")
		.attr("d", path)
		.style("fill", function (d) {
			if (d.properties.code in stateDictionary || d.properties.name in stateDictionary) {
				const stateAverage = d.properties.code in stateDictionary ?
					parseFloat(stateDictionary[d.properties.code]) :
					parseFloat(stateDictionary[d.properties.name]);

				if (stateAverage !== undefined && ! isNaN(stateAverage) && stateAverage !== null) {
					return colorGradient(stateAverage);
				}
			}

			// Couldn't get a value for some reason, fall back to default
			return default_color;
		});
};


export default {createStateMap, updateStateMap}
