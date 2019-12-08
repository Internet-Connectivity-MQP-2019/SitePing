"use strict";

import data_display from "./data_display";
import domains from "./domain_list";
import socket from "./index";

let stopped = true;

const rollingNumber = 20;
const backToBackCount = 2;

const userLocation = {latitude: undefined, longitude: undefined};
let locationRequestInProgress = false;

let mturk = false;
let mturkCounter = 0;
const mturkMinimum = 150;
let mturkTokenProvided = false;

/**
 * Shuffles array in place.
 * @param {Array} a items An array containing the items.
 */
function shuffle(a) {
	let j, x, i;
	for (i = a.length - 1; i > 0; i--) {
		j = Math.floor(Math.random() * (i + 1));
		x = a[i];
		a[i] = a[j];
		a[j] = x;
	}
	return a;
}

const localData = {};
const runCycle = async function () {
	const newData = [];

	/**
	 * Creates and loads an image element by url.
	 * @param  {String} url
	 * @return {Promise} promise that resolves to an image element or
	 *                   fails to an Error.
	 */
	function request_image(url) {
		return new Promise(function (resolve, reject) {
			const img = new Image(32, 32);
			img.onload = function () {
				resolve(img);
			};
			img.onerror = function () {
				reject(url + " is bad.");
			};
			if (url.indexOf("?") !== -1) {
				img.src = url + '&nocache=' + Math.floor((1 + Math.random()) * 0x10000).toString(16);
			} else {
				img.src = url + '?nocache=' + Math.floor((1 + Math.random()) * 0x10000).toString(16);
			}
		});
	}

	/**
	 * Pings a url.
	 * @param  {String} url
	 * @return {Promise} promise that resolves to a ping (ms, float).
	 */
	function ping(url) {
		return new Promise(function (resolve, reject) {
			const start = (new Date()).getTime();
			const response = function () {
				let delta = ((new Date()).getTime() - start);
				resolve(delta);
			};
			request_image(url).then(response).catch(reason => reject(reason));
		});
	}

	console.log("Running cycle");
	const local_domains = shuffle(domains)
	for (let i = 0; i < local_domains.length; i += 1) {
		if (stopped) break;

		const domain = local_domains[i];

		for (let c = 0; c < backToBackCount; c += 1) {
			await ping(domain.domain)
				.then(pingTime => {
					const displayName = domain.name.split("-")[0];
					localData[`${displayName} (${domain.rank})`].push(pingTime);

					while (localData[`${displayName} (${domain.rank})`].length > rollingNumber) {
						localData[`${displayName} (${domain.rank})`].shift();
					}

					newData.push({favicon: domain.name, rtt: pingTime, backToBackId: c});
				})
				.catch(console.log);
		}
	}

	newData.forEach(d => {
		d.latitude = userLocation.latitude;
		d.longitude = userLocation.longitude;
		const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
		if (connection) {
			d.connectionInfo = {
				type: connection.type,
				effectiveType: connection.effectiveType,
				rtt: connection.rtt,
				downlink: connection.downlink,
				downlinkMax: connection.downlinkMax
			};
		}
	});

	return newData;
};

const sum = (data, start) => {
	return data + start;
};

const aggregateLocalData = () => {
	const data = {};

	Object.keys(localData).forEach(key => {
		data[key] = {avg: localData[key].reduce(sum, 0) / localData[key].length};
	});

	return data;
};

const stopCollection = function () {
	stopped = true;
	console.log("Collection stop");
	document.querySelector("#start_collection_button_modal").disabled = false;
	document.querySelector("#stop_collection_button").disabled = true;
};

const startCollection = async function () {
	if (stopped) {
		document.querySelector("#start_collection_button_modal").disabled = true;
		document.querySelector("#stop_collection_button").disabled = false;
		stopped = false;
		console.log("Collection start");

		geoLocate();

		while (!stopped) {
			let newData = await runCycle();

			socket.emit('submitNewData', newData);

			if (mturk) {
				mturkCounter += newData.length;
				if (mturkCounter > mturkMinimum && !mturkTokenProvided) {
					socket.emit('getTurkToken', {count: mturkCounter});
				}
			}

			data_display.displayBar(aggregateLocalData());
		}
	}
};

const geoLocate = function() {
	if (!locationRequestInProgress && (userLocation.latitude === undefined || userLocation.longitude === undefined)) {
		locationRequestInProgress = true;
		navigator.geolocation.getCurrentPosition(position => {
			userLocation.latitude = position.coords.latitude.toFixed(2);
			userLocation.longitude = position.coords.longitude.toFixed(2);
			locationRequestInProgress = false;
		});
	}
};

const selectText = (element) => {
	const text = document.querySelector(element);

	if (document.body.createTextRange) { // ms
		const range = document.body.createTextRange();
		range.moveToElementText(text);
		range.select();
	} else if (window.getSelection) { // moz, opera, webkit
		const selection = window.getSelection();
		const range = document.createRange();
		range.selectNodeContents(text);
		selection.removeAllRanges();
		selection.addRange(range);
	}
};

// Enter point
let runningBeforeUnblur = false;
document.body.onload = () => {
	window.onblur = () => {
		runningBeforeUnblur = stopped === false;
		stopCollection();
	};

	window.onfocus = () => {
		data_display.displayBar(aggregateLocalData());
		if (runningBeforeUnblur) {
			startCollection().then();
		}
	};

	if (window.location.search.indexOf("mturk") > -1) {
		mturk = true;
		document.querySelector('#mturk-div').style.display = "block";
	}

	const startCollectionButton = document.querySelector("#start_collection_button");
	const stopCollectionButton = document.querySelector("#stop_collection_button");

	if (startCollectionButton !== undefined && startCollectionButton !== null) {
		startCollectionButton.disabled = false;
		startCollectionButton.onclick = startCollection;
	}

	if (stopCollectionButton !== undefined && stopCollectionButton !== null) {
		stopCollectionButton.disabled = true;
		stopCollectionButton.onclick = stopCollection;
	}

	for (let i = 0; i < domains.length; i++) {
		const d = domains[i];
		const displayName = d.name.split("-")[0];
		localData[`${displayName} (${d.rank})`] = [];
	}

	socket.on('sendData', data_display.updateMapData);
	socket.on('sendTopCities', data_display.updateTopCitiesByIP);
	socket.on('sendTopStates', data_display.updateTopStatesByIP);

	socket.on('sendTurkToken', data => {
		document.querySelector("#mturk-token").innerHTML = data;
		document.querySelector("#mturk-token").style.display = "block";
		selectText("#mturk-token");
		mturkTokenProvided = true;
	});

	const zero_bar = {};
	domains.forEach(d => zero_bar[`${d.name.split("-")[0]} (${d.rank})`] = {avg: NaN, max: NaN});

	data_display.initializeBar();
	data_display.displayBar(zero_bar);
	data_display.displayBar(zero_bar); // Note: bar chart has an issue where it doesn't display first call
	data_display.setupMap(800, 500);
};
