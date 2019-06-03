const Tp = require('thingpedia');
const FeedParser = require('feedparser');
const Http = require('thingpedia-api/lib/helpers/http');

const rss_urls = {nyt : 'http://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml',
                  cnn : 'http://rss.cnn.com/rss/cnn_topstories.rss',
                  bbc : 'http://feeds.bbci.co.uk/news/rss.xml'};

module.exports = class newsfeedDevice extends Tp.BaseDevice {
    constructor(engine, state) {
        super(engine, state);

        this.uniqueId = 'com.jfez.newsfeed';
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

    sourcesToURLs(sources) {
        if (sources.length == 0) // use New York Times as default
            return {rss_urls.nyt};
        let urls = [];
        for (let i = 0; i < sources.length; i++) {
            if (!rss_urls.hasOwnProperty(sources[i]))
                throw new Error(`News source ${sources[i]} not recognized. Please try again.`);
            urls.push(sources[i]);
        }
        return urls;   
    }

    get_get_news({sources}) {
        let sourceList = this.splitMultiString(sources);
        console.log('News sources to pull from are ' + JSON.stringify(sourceList));
        let urls = this.sourcesToURLs(sourceList);
        console.log('urls are ' + JSON.stringify(urls));
        let numSources = urls.length;
        news = [];
        for (let i = 0; i < numSources; i++) {
            news.push(Http.getStream(urls[i], null).then((stream) => {
                return new Promise((resolve, reject) => {
                    const parser = new FeedParser({ feedurl: urls[i] });
                    parser.on('error', reject);

                    const toEmit = [];
                    parser.on('data', (entry) => {
                        toEmit.push({
                            guid: entry.guid,
                            title: entry.title,
                            description: entry.description,
                            link: entry.link,
                            updated_time: new Date(entry.date),
                            categories: entry.categories
                        });
                    });
                    parser.on('end', () => resolve(toEmit));
                    stream.pipe(parser);
                });
            }).then((toEmit) => {
                toEmit.sort((a, b) => (+b.updated_time) - (+a.updated_time));
                return toEmit;
            });)
        }
        return news;
    }
}
