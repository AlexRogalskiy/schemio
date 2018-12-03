const schemeStorage = require('../storage/storageProvider.js').provideStorage();
const _             = require('lodash');


const ApiSchemes = {
    getScheme(req, res) {
        var schemeId = req.params.schemeId;
        schemeStorage.getScheme(schemeId).then(scheme => {
            res.json(scheme);
        }).catch( err => {
            res.status(404);
            res.json({error: 'Not found'});
        });
    },

    createScheme(req, res) {
        schemeStorage.createScheme(req.body).then(scheme => {
            res.json(scheme);
        }).catch( err => {
            res.status(500);
            res.json({error: 'Error creating scheme'});
        });
    },

    saveScheme(req, res) {
        var schemeId = req.params.schemeId;
        var requestScheme = ApiSchemes.sanitizeScheme(req.body);
        schemeStorage.saveScheme(schemeId, requestScheme).then(scheme => {
            res.json(scheme);
        }).catch( err => {
            res.status(500);
            res.json({error: `Error saving scheme ${schemeId}`});
        });
    },

    findSchemes(req, res) {
        schemeStorage.findSchemes({
            offset: req.query.offset || 0
        }).then(searchResult => {
            res.json(searchResult);
        }).catch( err => {
            res.status(500);
            res.json({error: 'Could not find schemes'});
        });
    },

    sanitizeScheme(scheme) {
        if (scheme.items) {
            _.forEach(scheme.items, item => {
                if (item.hasOwnProperty('meta')) {
                    delete item['meta'];
                }
            });
        }
        return scheme;
    }

}

module.exports = ApiSchemes;
