'use strict';

var $extend = require('extend');

module.exports = new PretendCdn();


function PretendCdn () {

	var DEFAULTS = {
		log: true,
		delays: {
			cdn: 100,
			source: 2000
		},
		profiles: {
			exclude: 0,
			permanent: -1,
			cdn: 5,
			short: 30,
			long: 1440
		}
	};

	var cdnSettings = {};

	var cdnCache = {};

	var self = this;

	self.setConfig = setConfig;
	self.imitateCdn = imitateCdn;
	self.log = logger;


	return self.setConfig;


	function logger () {

		if (cdnSettings.log !== false) {
			console.log.apply(null, Array.prototype.slice.call(arguments));
		}

	}

	function setConfig (config) {

		$extend(cdnSettings, DEFAULTS, config);

		// sanitize config
		cdnSettings.delays.cdn = cdnSettings.delays.cdn || DEFAULTS.delays.cdn;
		cdnSettings.delays.source = cdnSettings.delays.source || DEFAULTS.delays.source;

		cdnSettings.paths = cdnSettings.paths || {};
		cdnSettings.profiles = cdnSettings.profiles || {};

		return self.imitateCdn;

	}


	function imitateCdn (req, res, next) {

		// track if the response was handled
		var responseHandled = false;

		if (cdnSettings !== null &&
			typeof cdnSettings === 'object') {

			var pathToMatch = req.method + ':' + req.url;

			// check to see if current URL has a cache setting
			Object.keys(cdnSettings.paths).forEach(function (urlRegex) {

				// abort if response was already processed
				if (responseHandled) { return; }

				var urlExp = new RegExp(urlRegex);

				// if matched, perform caching strategy
				if (urlExp.test(pathToMatch)) {

					self.log('\nReceived CDN configured request: ' + pathToMatch);
					self.log('\tMatch on key "' + urlRegex + '"');

					responseHandled = true;

					var availableCache = cdnCache[pathToMatch];

					// first see if the cached version is available, if so, serve that
					if (typeof availableCache !== 'undefined') {

						self.log('\tResponding from CDN with delay of ' + cdnSettings.delays.cdn);

						// all good, respond from cache
						res.writeHead(
							cdnCache[pathToMatch].statusCode,
							cdnCache[pathToMatch].headers
						);

						// save to string so we can clear the object if required
						var responseBody = cdnCache[pathToMatch].body;
						setTimeout(function () {
							res.end(responseBody);
						}, cdnSettings.delays.cdn);

						// handle remaining request count
						if (availableCache.requestsLeft !== -1) {
							availableCache.requestsLeft = Math.max(0, availableCache.requestsLeft  - 1);
						}
						if (availableCache.requestsLeft === 0) {
							self.log('\tCache expired, next request will be fetched from source server');
							// remove from cache
							delete cdnCache[pathToMatch];
						}
						else {
							self.log('\tResponses left: ' + availableCache.requestsLeft);
						}

					}
					else {

						self.log('\tNo cache present, returning from source server with delay of: ' + cdnSettings.delays.source);

						res.on('pipe', function (readable) {

							readable.on('readable', function () {

								var readingChunk;
								while (null !== (readingChunk = readable.read())) {
									res.write(readingChunk);
								}
								res.end();

							});

						});

						var buffer = [];
						var org = res.write;
						res.write = function (str) {

							buffer.push(str);
							org.apply(res, [str]);

						};

						// otherwise bind to the response object to create the cache
						res.on('finish', function () {

							var profile = cdnSettings.paths[urlRegex];
							var requestsLeft = parseInt(cdnSettings.profiles[profile], 10) || 0;

							if (requestsLeft) {

								// stuff it in the cache
								cdnCache[pathToMatch] = {
									requestsLeft: requestsLeft,
									cachingStrategy: profile,
									statusCode: res.statusCode,
									headers: res._headers,
									body: Buffer.concat(buffer).toString()
								};
							}

						});

						// make sure the request continues through the original handler
						setTimeout(function () {
							self.log('\tDelay complete, continuing..');
							next();
						}, cdnSettings.delays.source);

					}

				}

			});

		}

		if (!responseHandled) {
			next();
		}

	}

}
