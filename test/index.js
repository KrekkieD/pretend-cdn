'use strict';

var $fs = require('fs');

var $express = require('express');

var $serveStatic = require('serve-static');

var $pretendCdn = require('../index');



var app = $express();

app.use($pretendCdn(JSON.parse(
	$fs.readFileSync(__dirname + '/cdn-settings.json').toString()
)));

app.use($express.static('.'));
app.use($serveStatic('./test'));

app.use(function (req, res) {

	res.end(JSON.stringify({
		path: req.url,
		generationTime: new Date().getTime()
	}));

});


module.exports = function (cb) {

	return app.listen(8888, cb);

};
