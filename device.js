"use strict";

const Tp = require('thingpedia');
var FeedParser = require('feedparser');
var request = require('request');

const rss_urls = {'nyt' : 'http://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml',
		  'nytimes' : 'http://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml',
		  'newyorktimes' : 'http://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml',
                  'cnn' : 'http://rss.cnn.com/rss/cnn_topstories.rss',
                  'cnnnews' : 'http://rss.cnn.com/rss/cnn_topstories.rss',
                  'cablenewsnetwork' : 'http://rss.cnn.com/rss/cnn_topstories.rss',
                  'bbc' : 'http://feeds.bbci.co.uk/news/rss.xml',
                  'bbcnews' : 'http://feeds.bbci.co.uk/news/rss.xml',
                  'britishbroadcastingcorporation' : 'http://feeds.bbci.co.uk/news/rss.xml',
		  'abc' : 'https://abcnews.go.com/abcnews/topstories',
		  'abcnews' : 'https://abcnews.go.com/abcnews/topstories',
		  'americanbroadcastingcompany' : 'https://abcnews.go.com/abcnews/topstories',
		  'businessinsider' : 'http://feeds2.feedburner.com/businessinsider',
		  'fortune' : 'http://fortune.com/feed/',
		  'fortunenews' : 'http://fortune.com/feed/',
		  'huffington' : 'https://www.huffingtonpost.com/section/front-page/feed',
		  'huffingtonpost' : 'https://www.huffingtonpost.com/section/front-page/feed',
		  'mashable' : 'http://feeds.mashable.com/Mashable',
		  'mashablenews' : 'http://feeds.mashable.com/Mashable'
};

module.exports = class newsfeedDevice extends Tp.BaseDevice {
    constructor(engine, state) {
        super(engine, state);

        this.uniqueId = 'jfez.newsfeed';
        this.name = 'Newsfeed Summaries';
        this.description = 'A summarized newsfeed for you!';
    }

    splitMultiString(string) {
        console.log('news sources string is ' + string);
        string = string.toString().toLowerCase();
	string = string.replace(' the ', '');
        // string can be split by the word comma or actual ','
        string = string.replace(new RegExp(' comma ', 'g'), ',');
	string = string.replace(/\s/g, '');
        let sources = string.split(',');
        return sources;
    }

    sourcesToURLs(sourceList) {
        if (sourceList.length == 0) // use New York Times as default
            return [rss_urls['nyt']];
        let urls = [];
        for (let i = 0; i < sourceList.length; i++) {
            if (!rss_urls.hasOwnProperty(sourceList[i]))
                throw new Error(`News source ${sourceList[i]} not recognized. Please try again.`);
            urls.push(rss_urls[sourceList[i]]);
        }
        return urls;   
    }

    get_get_news({sources}) {
        let sourceList = this.splitMultiString(sources);
        console.log('News sources to pull from are ' + JSON.stringify(sourceList));
        let urls = this.sourcesToURLs(sourceList);
        console.log('urls are ' + JSON.stringify(urls));
        var articles = [];
	var feedparser = new FeedParser();
        for (let i = 0; i < urls.length; i++) {
	    var req = request(urls[i]);
	    req.on('error', function (error) {
		console.log('Request error: ' + JSON.stringify(error));
	    });

	    req.on('response', function (res) {
		var stream = this;

		if (res.statusCode !== 200) {
		    this.emit('error', new Error('Bad status code'));
		} else {
		    stream.pipe(feedparser);
		}
	    });

	    feedparser.on('error', function (error) {
		console.log('Feedparser error: ' + JSON.stringify(error));
	    });

	    feedparser.on('readable', function () {
		var stream = this;
		var meta = this.meta;
		var item;

		for (let i = 0; i < 5; i++) {
		    item = stream.read();
		    if (item == null) { break; }
		    articles.push(item);
		}
	    });
        }
        return articles;
    }
}
