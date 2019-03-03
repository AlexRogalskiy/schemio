const SchemeStorage     = require('../SchemeStorage.js');
const MongoClient       = require('mongodb').MongoClient;
const shortid           = require('shortid');
const _                 = require('lodash');


const mongodbUrl = 'mongodb://localhost:27017';
// Database Name
const dbName = 'myproject';
const poolSize = 10;




class MongoSchemeStorage extends SchemeStorage {
    constructor() {
        super();
        this.db = null;
        MongoClient.connect(mongodbUrl, {
            poolSize: poolSize
        }).then(client => {
            this.db = client.db(dbName);
            this._inSchemes().createIndex({name: "text", description: "text"});
        }).catch(err => {
            console.error(err);
            process.exit(1);
        });
    }

    _inSchemes() {
        return this.db.collection('schemes');
    }
    _inTags() {
        return this.db.collection('tags');
    }
    _categories() {
        return this.db.collection('categories');
    }

    findSchemes(query) {
        var mongoQuery = {};
        if (query.hasOwnProperty('category')) {
            var categoryId = null;
            if (query.category != 0) {
                categoryId = query.category;
            }
            mongoQuery['categoryId'] = categoryId;
        }
        if (query.query && query.query.length > 0) {
            mongoQuery['$text'] = {'$search': query.query};
        }


        var offset = 0;
        if (query.offset) {
            offset = query.offset;
        }
        var limit = 10;

        return Promise.all([
            this._inSchemes().count(mongoQuery),
            this._inSchemes().find(mongoQuery).skip(offset).limit(limit).toArray()
        ]).then(values => {
            var count = values[0];
            var schemes = values[1];
            return {
                results: _.map(schemes, scheme => {
                    return {
                        "id": scheme.id,
                        "name": scheme.name,
                        "description": scheme.description,
                        "tags": scheme.tags,
                        "modifiedDate": scheme.modifiedDate
                    };
                }),
                total: count,
                resultsPerPage: limit,
                offset: 0
            };
        });
    }

    createScheme(scheme) {
        scheme.id = shortid.generate();

        var promise = Promise.resolve(null);
        if (scheme.categoryId) {
            promise = this._categories().findOne({id: scheme.categoryId}).then(category => {
                if (!category) {
                    throw new Error(`Category does not exist: ${scheme.categoryId}`);
                }
                return category;
            })
        }

        return promise.then(category => {
            if (category) {
                scheme.allSubCategoryIds = _.map(category.ancestors, a => a.id);
            } else {
                scheme.allSubCategoryIds = [];
            }
            return this._inSchemes().insertOne(scheme).then(result => {
                return scheme;
            });
        });
    }

    getScheme(schemeId) {
        return this._inSchemes().findOne({id: schemeId}).then(scheme => {
            if (scheme) {
                return {
                    id: scheme.id,
                    name: scheme.name,
                    description: scheme.description,
                    tags: scheme.tags,
                    modifiedDate: scheme.modifiedDate,
                    categoryId: scheme.categoryId,
                    items: scheme.items
                };
            } else {
                return null;
            }
        });
    }

    deleteScheme(schemeId) {
        return this._inSchemes().deleteOne({id: schemeId});
    }

    saveScheme(schemeId, scheme) {
        if (scheme.tags) {
            var tags = [].concat(scheme.tags);
            _.forEach(scheme.items, item => {
                if (item.tags) {
                    tags = tags.concat(item.tags);
                }
            });
        }
        this.saveTags(tags);
        return this._inSchemes().updateOne({id: schemeId}, {$set: scheme});
    }

    getTags() {
        return this._inTags().find({}).toArray().then(tags => {
            if (tags && tags.length > 0) {
                return _.map(tags, tag => tag.name);
            } else {
                return [];
            }
        });
    }

    saveTags(tags) {
        var uniqTags = _.uniq(tags);

        var promises = _.map(uniqTags, tag => {
            return this._inTags().updateOne({
                name: tag
            }, {
                name: tag
            }, {
                upsert: true
            });
        });
        return Promise.all(promises);
    }
}

module.exports = MongoSchemeStorage;
