const SchemeStorage     = require('./SchemeStorage.js');
const fs                = require('fs-extra');
const shortid           = require('shortid');
const _                 = require('lodash');


class LocalSchemeStorage extends SchemeStorage {
    constructor() {
        super();
        this.storagePath = process.env.LOCAL_SCHEME_STORAGE_PATH || 'local-storage';
        console.log('Local scheme storage: ' + this.storagePath);

        if (process.env.LOCAL_SCHEME_STORAGE_PATH) {
            setInterval(() => {
                this.runReindexJob()
            }, 1000);
        }

        this.schemeQueueForIndex = [];
        this.isReindexing = false;
        this.indices = {
            tags: [],
            schemes: []
        };

        this.initializeStorage();
    }

    initializeStorage() {
        Promise.all([fs.ensureDir(`${this.storagePath}/index`), fs.ensureDir(`${this.storagePath}/schemes`)]).then(() => {
            return fs.readJson(`${this.storagePath}/index/schemes.json`).then(schemes => {
                this.indices.schemes = schemes;
            }).catch(err => {
                this.indices.schemes = [];
            });
        }).then(() => {
            return fs.readJson(`${this.storagePath}/index/tags.json`).then(tags => {
                this.indices.tags = tags;
            }).catch(err => {
                this.indices.tags = [];
            });
        }).catch(err => {
            console.error(`Issues with storage: ${this.storagePath}`, err);
            process.exit(1);
        });
    }

    getScheme(schemeId) {
        return fs.readJson(`${this.storagePath}/schemes/${schemeId}.json`);
    }

    createScheme(scheme) {
        scheme.id = shortid.generate();
        return fs.writeJson(`${this.storagePath}/schemes/${scheme.id}.json`, scheme).then(() => {
            this.addSchemeToIndexQueue(scheme.id, scheme);
            return scheme;
        });
    }

    saveScheme(schemeId, scheme) {
        var path = `${this.storagePath}/schemes/${schemeId}.json`;
        return fs.pathExists(path).then(exists => {
            if (exists) {
                return fs.writeJson(path, scheme).then(() => {
                    this.addSchemeToIndexQueue(schemeId, scheme);
                    return scheme;
                });
            } else {
                throw new Error('Scheme was not created previously');
            }
        });
    }

    findSchemes(searchQuery) {
        var resultsPerPage = 25;

        var foundItems = _.filter(this.indices.schemes, scheme => {
            //TODO implement search query handling
            return true;
        });

        return Promise.resolve({
            results: foundItems.slice(searchQuery.offset, searchQuery.offset + resultsPerPage),
            total: foundItems.length,
            resultsPerPage: resultsPerPage,
            offset: searchQuery.offset
        });
    }


    runReindexJob() {
        if (!this.isReindexing) {
            this.isReindexing = true;
            try {
                if (this.schemeQueueForIndex.length > 0) {
                    this.reindex();
                }
            } catch(err) {
                console.error('Error during reindexing', err);
            }

            this.isReindexing = false;
        }
    }


    reindex() {
        console.log('Reindexing schemes: ' + this.schemeQueueForIndex.length);
        var counter = 0;
        while(this.schemeQueueForIndex.length > 0 && counter < 50) {
            var scheme = this.schemeQueueForIndex.shift();
            this.reindexScheme(scheme.schemeId, scheme.scheme);
            this.reindexTags(scheme.scheme.tags);
            counter += 1;
        }

        this.indices.schemes.sort((a,b) => a.name > b.name ? 1: -1);

        fs.writeJson(`${this.storagePath}/index/schemes.json`, this.indices.schemes);
        fs.writeJson(`${this.storagePath}/index/tags.json`, this.indices.tags);
    }

    reindexScheme(schemeId, scheme) {
        var schemeInIndex = _.find(this.indices.schemes, s => s.schemeId === schemeId);
        if (!schemeInIndex) {
            this.indices.schemes.push({
                schemeId: schemeId,
                name: scheme.name,
                tags: scheme.tags
            });
        } else {
            schemeInIndex.name = scheme.name;
            schemeInIndex.tags = scheme.tags;
        }

        //TODO optimize tags reindexing
        _.forEach(scheme.items, item => {
            this.reindexTags(item.tags);
        });
    }

    reindexTags(tags) {
        if (tags && tags.length > 0) {
            _.forEach(tags, tag => {
                if (_.indexOf(this.indices.tags, tag) < 0) {
                    this.indices.tags.push(tag);
                }
            });
        }
    }

    addSchemeToIndexQueue(schemeId, scheme) {
        try {
            if (!_.find(this.schemeQueueForIndex, scheme => scheme.schemeId === schemeId)) {
                this.schemeQueueForIndex.push({
                    schemeId: schemeId,
                    scheme: scheme
                });
            }
        } catch(ex) {
        }
    }
}

module.exports = LocalSchemeStorage;
