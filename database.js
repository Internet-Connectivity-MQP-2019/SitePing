const MaxMind = require('@maxmind/geoip2-node').Reader;
const XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
const MongoClient = require('mongodb').MongoClient;
const url = "mongodb+srv://" + process.env.DB_USER + ":" + process.env.DB_PASS + "@faviconmap-j8xwi.mongodb.net/FaviconMap?retryWrites=true&w=majority&authSource=admin";
module.exports = function () {
	const client = new MongoClient(url, {useNewUrlParser: true, useUnifiedTopology: true});

	function DB() {
		return new Promise(resolve => {
			if (client.isConnected()) resolve(client.db('FaviconMap'));
			else client.connect().then(() => resolve(client.db('FaviconMap')));
		})
	}

	DB().then(db => db.collection('pings'));

	function PingsCollection() {
		return new Promise((resolve) => DB().then(db => resolve(db.collection('pings'))))
	}

	function reverseGeocode(latitude, longitude) {
		return new Promise((resolve, reject) => {
			let request = new XMLHttpRequest();
			request.onreadystatechange = () => {
				// console.log('readyStatechange:  ' + request.readyState);
			};
			request.onload = () => {
				if (request.status >= 200 && request.status < 400) {
					let data = JSON.parse(request.responseText);
					if (data['QueryStatusCode'] !== 'Success') reject("(" + new Date() + ") Reverse Geocode lookup failed: " + data['ErrorMessage']);
					let address = data['StreetAddresses'][0];
					resolve({
						city: address['City'],
						state: address['State'],
						latitude: parseFloat(latitude),     // End user function expects latitude and longitude to be included (since maxmind provides in other scenario)
						longitude: parseFloat(longitude),
						country: 'US'
					})
				} else reject("Reverse Geocode lookup failed with API status code " + request.status + ": " + request.responseText);
			};

			let url = 'https://geoservices.tamu.edu/Services/ReverseGeocoding/WebService/v04_01/Rest/?' +
				'apiKey=efda2ed783e748239c3406235a586f43&' +
				'version=4.1&' +
				'lat=' + latitude + '&' +
				'lon=' + longitude + '&' +
				'notStore=true&' +
				'format=json';
			request.open('GET', url, true);
			request.responseType = 'json';
			request.send()
		})
	}

	function maxMindLookup(ip) {
		return new Promise((resolve, reject) => {
			MaxMind.open('GeoIP2-City.mmdb').then(reader => {
				let data = reader.city(ip);
				if (!ip) reject("MaxMind lookup failed! No IP for data[0]");
				resolve({
					latitude: data.location.latitude,
					longitude: data.location.longitude,
					city: data.city.names.en,
					state: data.subdivisions[0].isoCode,
					country: data.country.isoCode
				});
			}).catch(error => reject("MaxMind lookup failed! " + error))
		})
	}

	function getLocation(data) {
		return new Promise((resolve) => {
			let onWifi = (data.connectionInfo !== undefined && data.connectionInfo.type === 'wifi');
			if ((data.isMobile && onWifi) || !data.isMobile)
				maxMindLookup(data.ip).then(location => resolve(location));
			else if (data.isMobile && !onWifi && data.latitude && data.longitude)
				reverseGeocode(data.latitude, data.longitude).then(location => resolve(location));
			else resolve({latitude: 0, longitude: 0, city: "null", state: "null", country: "null"});
		});
	}

	return {
		locationLookup: function (data) {
			return new Promise(resolve => resolve(getLocation(data[0])))
		},
		// Data: [{ favicon: 'Yahoo',
		//     rtt: 657,
		//     latitude: '42.28',
		//     longitude: '-71.80',
		//     connectionInfo: { effectiveType: '4g', rtt: 50, downlink: 5.2, type: 'wifi', downlinkMax '6.66'},
		//     ip: '::1',
		//     isMobile: false }]
		insertPings: function (data) {
			return new Promise((resolve, reject) => {
				getLocation(data[0]).then(location => {
					for (let i = 0; i < data.length; i++) {
						data[i].latitude = location.latitude;
						data[i].longitude = location.longitude;
						data[i].city = location.city;
						data[i].state = location.state;
						data[i].country = location.country;
					}
					PingsCollection().then(col => col.insertMany(data).then(resolve));
				}).catch(error => reject("(" + new Date() + ") Error getting GeoIP info: " + error));
			});
		},
		// returns [{favicon: "facebook.com", avg_rtt: 1.1, city: "Boston", latitude: "0.0", longitude: "0.0"}]
		getData: function () {
			return new Promise(resolve => PingsCollection().then(col =>
				col.aggregate([{
					$match: {
						country: "US",
						latitude: {$exists: true, $ne: null},
						longitude: {$exists: true, $ne: null},
						state: {$exists: true, $ne: null}
					}
				}, {
					$group: {
						"_id": {"city": {$toLower: {$ifNull: ["$alt_city", "$city"]}}, "state": {$ifNull: ["$alt_state", "$state"]}, "isMobile": "$isMobile"},
						count: {$sum: 1},
						latitude: {$avg: {$ifNull: ["$alt_latitude", "$latitude"]}},
						longitude: {$avg: {$ifNull: ["$alt_longitude", "$longitude"]}},
						avg_rtt: {$avg: "$rtt"},
					}
				}])
					.toArray((err, res) => {
						console.log(err);
						res.forEach(d => {
							d.city = d._id.city;
							d.isMobile = d._id.isMobile;
							d.latitude = parseFloat(d.latitude);
							d.longitude = parseFloat(d.longitude);
						});
						resolve(res);
					})
			));
		},
		getTopCities: function (numTop) {
			return new Promise(resolve => PingsCollection().then(col =>
				col.aggregate([
					{
						$match: {
							country: "US",
							latitude: {$exists: true, $ne: null},
							longitude: {$exists: true, $ne: null},
							city: {$exists: true, $nin: [null, ""]},
							state: {$exists: true, $ne: null}
						}
					},
					{
						$group:
							{
								_id: {state: "$state", city: {$toLower: "$city"}, ip: "$ip"},
								total: {$sum: 1}
							}
					},
					{
						$group:
							{
								_id: {state: "$_id.state", city: "$_id.city"},
								count: {$sum: 1}
							}
					},
					{$sort: {count: -1}},
					{$limit: numTop}
				]).toArray((err, res) => {
					resolve(res);
				})
			));
		},
		getTopStates: function (numTop) {
			return new Promise(resolve => PingsCollection().then(col =>
				col.aggregate([
					{
						$match: {
							country: "US",
							latitude: {$exists: true, $ne: null},
							longitude: {$exists: true, $ne: null},
							state: {$exists: true, $nin: [null, '']}
						}
					},
					{
						$group:
							{
								_id: {state: "$state", ip: "$ip"},
								total: {$sum: 1}
							}
					},
					{
						$group:
							{
								_id: {state: "$_id.state"},
								count: {$sum: 1}
							}
					},
					{$sort: {count: -1}},
					{$limit: numTop}
				]).toArray((err, res) => {
					resolve(res);
				})
			));
		}
	};
};
