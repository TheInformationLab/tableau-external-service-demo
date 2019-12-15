var express = require('express');
var request = require("request");
var router = express.Router();
import CacheService from '../cache.js';

const apiKey = 'abcdefgh123456789' // set Darsky API key. Register here https://darksky.net/dev/register
const ttl = 60 * 60 * 1; // cache for 1 Hour
const cache = new CacheService(ttl); // Create a new cache service instance

const getRequest = (options, attribute) => new Promise((resolve, reject) => {
	request(options, function (error, response, body) {
		if (error) throw new Error(error);
			const resp = JSON.parse(body);
			console.log(resp);
			if (resp.daily && resp.daily.data && resp.daily.data[0] && resp.daily.data[0][attribute]) {
				resolve(resp.daily.data[0])
		} else {
				console.log('No Value');
				resolve(0);
		}
	});
});

const getForecast = (lat,lon,date,attribute) => new Promise((resolve, reject) => {

	const options = { method: 'GET',
	  url: `https://api.darksky.net/forecast/${apiKey}/${lat},${lon},${date}T12:00:00Z`,
	  qs: { exclude: 'currently,flags,minutely,hourly' }
	};
	const cacheKey = `${lat},${lon},${date}`
	cache.get(cacheKey, () => getRequest(options, attribute)).then((result) => {
		if (result === 0) {
			resolve(result);
		} else {
			resolve(result[attribute]);
		}

	});

});

/* GET home page. */
router.get('/info', function(req, res, next) {
	res.set('Content-Type', 'application/json');
  res.send({
		description: "",
		creation_time: "0",
		state_path: "",
		server_version: "0.8.7",
		name: "til",
		versions: {
			"v1": {
				features: {}
			}
		}
	});
});

router.post('/evaluate', function(req, res, next) {
	const requests = [];
	console.log(req.body);
	req.body.data._arg1.forEach((lat, i) => {
		if (i < 10) {
			requests.push(getForecast(lat,req.body.data._arg2[i],req.body.data._arg3[i],req.body.script));
		} else {
			requests.push(() => new Promise(resolve => resolve));
		}
	});
	Promise.all(requests)
		.then(values => {
			console.log(values);
			res.send(values);
		});
});

module.exports = router;
