# pretend-cdn

Put theory into practice! Sort of. Pretend-cdn helps you with experiencing your CDN cache setup in an easy-to-configure way. 

Experience slow hits that go through to your main server, see how blazingly fast your CDN responses are, and notice how file updates on your server are not immediately reflected on CDN. All on your local setup.

Pretend-cdn works by setting a url-based configuration to determine how many CDN servings a response should get. You're not bound to time and expiry headers, but instead use request count (or cache hits) to imitate cache expiry.

## Example use case

You provide translations to your frontend app using a request on `/i18n.json`. The contents of the file may change at any given time, as your copy writer works round the clock and is never happy. 

A request to your server and rendering the file takes up to 2 seconds per hit, people are not happy. Setting cache expiry headers improves page load times but still requires every visitor to hit the server for every first request -- the page that needs to load fastest. You decide to cache the file on CDN.

Your theory is that a 5 minute cache would be ideal, the copy writer has a short wait and most requests can hit the CDN instead of the server. You configure Pretend-cdn to serve 5 cached requests for every request forwarded to the main server:

```
{
	"paths": {
		"^GET:/i18n.json$": "cdn"
	}
}
```
When you first open the file in your browser you notice it's slow and takes about two seconds for it to be served. It has fetched the file from the server. But then you refresh, and again, and again -- it's fast, coming from CDN. 

You make a change in your translations, and refresh. Nothing happens, the response is fast, but your change is not shown. The old version is still being served from the CDN. Another two refreshes, still nothing new. Once more, it's slow again, the 5 'minutes' have expired, a new version is being fetched from the server, and your changes? They're there. Blazingly fast, with another 5 refreshes to spare.

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

- `exclude` - source hits only  
	don't cache, is private or always needs fresh version.  
- `permanent` - 1 source hit, followed by solely CDN hits  
	cache indefinitely, assumed to never change on server.
- `cdn` - 1 source hit before serving 5 CDN hits  
	short caching on CDN for reduced latency and server hits.
- `short` - 1 source hit before serving 30 CDN hits  
	short caching, i.e. refresh every 30 minutes
- `long` - 1 source hit before serving 1440 CDN hits  
	long caching, i.e. refresh daily

## Potential Roadmap

- add cache headers to response for browser caching?
- read cache headers in original response?
