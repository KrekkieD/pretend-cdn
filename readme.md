# pretend-cdn

## Installation

```npm install pretend-cdn```

## Usage

```
var $express = require('express'); 

var $pretendCdn = require('pretend-cdn');

// create server
var app = $express();

// hook up pretend-cdn as middleware
var options = {};
app.use($pretendCdn(options));

// continue serving as usual
app.use($express.static('.'));

app.listen(8000);

```

## Options (configuration)

```
{
	// show output in console?
	log: false, // default: true
	delays: {
		// delay before returning cached request from CDN
		cdn: 30, // default: 100
		
		// delay before returning uncached request from source
		source: 2000 // default: 2000
	},
	
	// create a profile if you have a specific cache setting
	profiles: {
		
		// custom profile, caches 300 requests on url
		custom: 300,
		
		// default profiles
		// (request count could be seen as minutes of cache validity):
		exclude: 0, // don't cache, ever
		permanent: -1, // cache permanently after first fetch
		cdn: 5, // cache 5 requests after first fetch
		short: 30, // cache 30 requests after first fetch
		long: 1440 // cache 1440 requests after first fetch
		
	},
	
	// key : value
	// key is a regular expression and value the desired profile
	// value is the key of the profiles object
	// key is matched against: req.method + ':' + req.path (i.e. GET:/home)
	paths: {
		'^GET:/home': 'exclude', // use 'exclude' profile for urls starting with /home
		'^GET:.*?cdn$': 'cdn', // use 'cdn' profile for urls ending on '?cdn'
		'^GET:/custom': 'custom' // use 'custom' profile
	}
	
}
```

## Profile strategy

Some predefined profiles have been added to help with caching strategies:

`exclude` - don't cache, is private or always needs fresh version

`permanent` - cache indefinitely, will never change on server

`cdn` - short caching on CDN for reduced latency and server hits

`short` - short caching, i.e. refresh every 30 minutes

`long` - long caching, i.e. refresh daily