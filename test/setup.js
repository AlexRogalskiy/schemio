const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const dom = new JSDOM(``, {
    url: 'http://localhost',
    referrer: 'http://localhost',
    contentType: "text/html",
    includeNodeLocations: true,
    storageQuota: 10000000
});


global.window = dom.window;
global.document = dom.window.document;

global.performance = {
    now() {
        return new Date().getTime() * 1000;
    }
};