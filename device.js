"use strict";

const Tp = require('thingpedia');

const rss_urls = {'nyt' : 'http://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml',
                  'cnn' : 'http://rss.cnn.com/rss/cnn_topstories.rss',
                  'bbc' : 'http://feeds.bbci.co.uk/news/rss.xml'};

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
        // string can be split by the word comma or actual ','
        string = string.replace(new RegExp(' comma ', 'g'), ',');
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
        let news = [];
        for (let i = 0; i < urls.length; i++) {
            let curr = Tp.Helpers.Rss.get(urls[i]).slice(0, 3);
            console.log('curr array: ' + JSON.stringify(curr));
            news.push(curr);
            console.log('news array to return: ' + JSON.stringify(news));
        }
        return news;
    }
}
