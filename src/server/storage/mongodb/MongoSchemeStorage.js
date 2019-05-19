/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

const SchemeStorage     = require('../SchemeStorage.js');
const shortid           = require('shortid');
const _                 = require('lodash');
const config            = require('../../config.js');
const mongo             = require('./Mongo.js');

CURRENT_SCHEME_VERSION  = 1;

class MongoSchemeStorage extends SchemeStorage {
    constructor() {
        super();
    }

    _schemes() {
        return mongo.db().collection('schemes');
    }
    _tags() {
        return mongo.db().collection('tags');
    }
    _categories() {
        return mongo.db().collection('categories');
    }

    combineItemsText(items) {
        let text = '';
        _.forEach(items, item => {
            if (item.name) {
                text += '\n' + item.name;
            }
            if (item.description) {
                text += '\n' + item.description;
            }
            if (item.properties) {
                text += '\n' + item.properties;
            }
        });
        return text;
    }

    findSchemes(query) {
        var mongoQuery = {};
        if (query.hasOwnProperty('category')) {
            let categoryId = null;
            if (query.category != 0) {
                categoryId = query.category;
            }
            if (query.includeSubcategories) {
                mongoQuery['$or'] = [
                     {categoryId},
                     {'allSubCategoryIds': categoryId}
                ];
            } else {
                mongoQuery['categoryId'] = categoryId;
            }
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
            this._schemes().count(mongoQuery),
            this._schemes().find(mongoQuery).skip(offset).limit(limit).toArray()
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
        scheme.version = CURRENT_SCHEME_VERSION;

        var promise = Promise.resolve(null);
        if (scheme.categoryId) {
            promise = this._categories().findOne({id: scheme.categoryId}).then(category => {
                if (!category) {
                    throw new Error(`Category does not exist: ${scheme.categoryId}`);
                }
                return category;
            })
        }

        scheme.itemsText = this.combineItemsText(scheme.items);

        return promise.then(category => {
            if (category) {
                scheme.allSubCategoryIds = _.map(category.ancestors, a => a.id);
            } else {
                scheme.allSubCategoryIds = [];
            }
            return this._schemes().insertOne(scheme).then(result => {
                return scheme;
            });
        });
    }

    getScheme(schemeId) {
        return this._schemes().findOne({id: schemeId}).then(scheme => {
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
        return this._schemes().deleteOne({id: schemeId});
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

        scheme.itemsText = this.combineItemsText(scheme.items);
        scheme.version = CURRENT_SCHEME_VERSION;

        return this._schemes().updateOne({id: schemeId}, {$set: scheme});
    }

    getTags() {
        return this._tags().find({}).toArray().then(tags => {
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
            return this._tags().updateOne({
                name: tag
            }, {$set: {
                name: tag
            }}, {
                upsert: true
            });
        });
        return Promise.all(promises);
    }
}

module.exports = MongoSchemeStorage;
