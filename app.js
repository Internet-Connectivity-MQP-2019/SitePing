const express = require('express');
const bodyParser = require('body-parser');
const compression = require('compression');
const fs = require('fs');
const unzip = require("unzip");

fs.createReadStream('GeoIP2-City.zip').pipe(unzip.Extract({ path: '.' }));

const app = express();

app.use(bodyParser.json());
app.use(compression());
app.use(express.static('dist'));

// Setup socket.io
const http = require('http').createServer(app);
const io = require('socket.io')(http, {'transports': ['websocket', 'polling']});
require('./socket.js')(io);

const listener = http.listen(process.env.PORT, function() {
	console.log('(' + new Date() + ') Your app is running. Go to http://localhost:' + listener.address().port + '/index.html');
});
