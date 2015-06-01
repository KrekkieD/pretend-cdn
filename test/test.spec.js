'use strict';

var $http = require('http');
var $q = require('q');

var app;

describe ('pretend-cdn', function () {

	it ('should start the server', startServer);

	multiple(4, function (i) {

		it('should match a funky regex', function expectExcluded (done) {

			var start = new Date().getTime();
			doRequest('/?exclude')
				.then(function () {

					expect(new Date().getTime() - start).toBeLessThan(2100);
					expect(new Date().getTime() - start).toBeGreaterThan(1900);

					done();

				});

		});

	});

	multiple(4, function (i) {

		it('should fetch all excluded requests from server', function expectExcluded (done) {

			var start = new Date().getTime();
			doRequest('/exclude')
				.then(function () {

					expect(new Date().getTime() - start).toBeLessThan(2100);
					expect(new Date().getTime() - start).toBeGreaterThan(1900);

					done();

				});

		});

	});

	multiple(15, function (j) {
		it('should hit CDN cache', function expectCdnCaches (done) {

			var start = new Date().getTime();

			doRequest('/cdn')
				.then(function () {

					if (j % 6) {
						expect(new Date().getTime() - start).toBeLessThan(200);
						expect(new Date().getTime() - start).toBeGreaterThan(0);
					}
					else {
						expect(new Date().getTime() - start).toBeLessThan(2100);
						expect(new Date().getTime() - start).toBeGreaterThan(1900);
					}

					done();
				});

		});
	});

	multiple(15, function (j) {
		it ('should hit permanent cache', function expectPermanentCaches (done) {

			var start = new Date().getTime();
			doRequest('/permanent')
				.then(function () {

					if (j > 0) {
						expect(new Date().getTime() - start).toBeLessThan(200);
						expect(new Date().getTime() - start).toBeGreaterThan(0);
					}
					else {
						expect(new Date().getTime() - start).toBeLessThan(2100);
						expect(new Date().getTime() - start).toBeGreaterThan(1900);
					}

					done();
				});

		});

	});

	multiple(64, function (j) {
		it('should hit short cache', function expectShortCaches (done) {

			var start = new Date().getTime();
			doRequest('/short')
				.then(function () {

					// every 31st call hits source
					if (j % 31) {
						expect(new Date().getTime() - start).toBeLessThan(200);
						expect(new Date().getTime() - start).toBeGreaterThan(0);
					}
					else {
						expect(new Date().getTime() - start).toBeLessThan(2100);
						expect(new Date().getTime() - start).toBeGreaterThan(1900);
					}

					done();
				});

		});
	});

	multiple(1450, function (j) {
		it('should hit long cache', function expectLongCaches (done) {

			var start = new Date().getTime();
			doRequest('/long')
				.then(function () {

					// every 1441st call hits source
					if (j % 1441) {
						expect(new Date().getTime() - start).toBeLessThan(200);
						expect(new Date().getTime() - start).toBeGreaterThan(0);
					}
					else {
						expect(new Date().getTime() - start).toBeLessThan(2100);
						expect(new Date().getTime() - start).toBeGreaterThan(1900);
					}

					done();
				});

		});
	});

	multiple(15, function (j) {
		it ('should handle piped responses from express.static too', function expectExpressPipedCaches (done) {

			var start = new Date().getTime();
			doRequest('/test/cdn-settings.json')
				.then(function () {

					if (j > 0) {
						expect(new Date().getTime() - start).toBeLessThan(200);
						expect(new Date().getTime() - start).toBeGreaterThan(0);
					}
					else {
						expect(new Date().getTime() - start).toBeLessThan(2100);
						expect(new Date().getTime() - start).toBeGreaterThan(1900);
					}

					done();
				});

		});
	});

	multiple(15, function (j) {
		it ('should handle piped responses from serveStatic too', function expectServeStaticPipedCaches (done) {

			var start = new Date().getTime();
			doRequest('/cdn-settings.json')
				.then(function () {

					if (j > 0) {
						expect(new Date().getTime() - start).toBeLessThan(200);
						expect(new Date().getTime() - start).toBeGreaterThan(0);
					}
					else {
						expect(new Date().getTime() - start).toBeLessThan(2100);
						expect(new Date().getTime() - start).toBeGreaterThan(1900);
					}

					done();
				});

		});
	});

	it ('should kill the server', stopServer);



	function startServer (done) {

		app = require(__dirname + '/index')(done);

	}

	function stopServer () {

		app.close();

	}

});


function multiple (iMax, fn) {

	for (var i = 0; i < iMax; i++) {

		fn(i);

	}

}

function doRequest (path) {

	var deferred = $q.defer();

	var reqObj = {
		hostname: 'localhost',
		port: 8888,
		method: 'GET',
		path: path
	};

	// perform a few requests
	var req = $http.request(reqObj, function (res) {

		var buffer = [];

		res.on('data', function (chunk) {
			buffer.push(chunk);
		});

		res.on('end', function () {

			if (!buffer.length) {
				deferred.resolve('');
			}
			else {
				deferred.resolve(JSON.parse(Buffer.concat(buffer).toString()));
			}

		});

	});

	// send
	req.end();

	return deferred.promise;

}