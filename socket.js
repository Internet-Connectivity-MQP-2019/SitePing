const mobile_detect = require('mobile-detect');
const jwt = require('jsonwebtoken');

const numTopCities = 5;
const numTopStates = 5;
module.exports = function (io) {
	let userCount = 0;

	let fullDataSendPending = false;
	let topCitiesStatesSendPending = false;
	const fullDataMaxFrequency = 1000; // 1 second
	const topCitiesStatesMaxFrequency = 3000; // 3 seconds
	const update = function() {
		if (!fullDataSendPending) {
			fullDataSendPending = true;
			setTimeout(() => {
				db.getData().then((data) => io.emit('sendData', data));
				fullDataSendPending = false;
			}, fullDataMaxFrequency);
		}

		if (!topCitiesStatesSendPending) {
			topCitiesStatesSendPending = true;
			setTimeout(() => {
				db.getTopCities(numTopCities).then((data) => io.emit('sendTopCities', data));
				db.getTopStates(numTopStates).then((data) => io.emit('sendTopStates', data));
				topCitiesStatesSendPending = false;
			}, topCitiesStatesMaxFrequency);
		}
	};

	const db = require('./database')(update);

	const updateUserCount = function() {
		io.emit('sendUserCount', userCount); // Emits to everyone
	};

	const getUserCount = function(socket) {
		socket.emit('sendUserCount', userCount); // Emits to just the requester
	};

	io.on('connection', function (socket) {
		userCount++;
		updateUserCount();

		socket.on('disconnect', function () {
			userCount--;
			updateUserCount();
		});

		socket.on('getUserCount', () => getUserCount(socket));

		socket.on('getConnectionInfo', () => {
			const clientIpAddress = (socket.request.headers['x-forwarded-for'] || socket.request.connection.remoteAddress).split(", ")[0];
			socket.emit('sendConnectionInfo', clientIpAddress);
		});

		socket.on('submitNewData', data => {
			const clientIpAddress = (socket.request.headers['x-forwarded-for'] || socket.request.connection.remoteAddress).split(", ")[0];
			const user_agent = socket.request.headers["user-agent"];
			const md = new mobile_detect(user_agent);
			data.forEach(d => {d.ip = clientIpAddress; d.isMobile = !(md.mobile() === undefined || md.mobile() === null)});

			db.insertPings(data).then(update);
		});

		socket.on('getData', () => db.getData().then(data => socket.emit('sendData', data)));

		socket.on('getTopCities', () => db.getTopCities(numTopCities).then(data => socket.emit('sendTopCities', data)));
		socket.on('getTopStates', () => db.getTopStates(numTopStates).then(data => socket.emit('sendTopStates', data)));

		socket.on('getTurkToken', (data) => {
			const token = jwt.sign({
				count: data.count
			}, process.env.JWT_SECRET, { expiresIn: '7d'});
			socket.emit('sendTurkToken', token);
		});
	});
};
