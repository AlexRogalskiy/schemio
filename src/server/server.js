/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

const express               = require('express');
const path                  = require('path');
const bodyParser            = require('body-parser');
const cookieParser          = require('cookie-parser');
const middleware            = require('./middleware.js');
const apiUser               = require('./api/apiUser.js');
const apiProjects           = require('./api/apiProjects.js');
const apiSchemes            = require('./api/apiSchemes.js');
const apiCategories         = require('./api/apiCategories.js');
const apiImages             = require('./api/apiImages.js');
const apiArt                = require('./api/apiArt.js');
const session               = require('express-session');
const mongo                 = require('./storage/mongodb/Mongo.js');
const MongoStore            = require('connect-mongo')(session);
const config                = require('./config.js');
const jsonBodyParser        = bodyParser.json({limit: config.api.payloadSize, extended: true});
const mongoMigrate          = require('./storage/mongodb/migrations/migrate.js').migrate;

const app = express();

app.use(session({
    secret: config.session.secret,
    store: new MongoStore({
        url: `${config.mongodb.url}/${config.mongodb.dbName}`,
        ttl: config.mongodb.sessionStore.ttl
    })
}));

app.use(cookieParser());
app.use(express.static('public'));
app.use('/v1', [jsonBodyParser, middleware.api]);


app.get('/v1/user', [middleware.auth], apiUser.getCurrentUser);
app.post('/v1/login', apiUser.login);
app.get('/user/logout', apiUser.logout);

app.post('/v1/projects', [middleware.auth], apiProjects.createProject);
app.get('/v1/projects', apiProjects.findProjects);

app.get('/v1/projects/:projectId/schemes',              [middleware.projectReadPermission], apiSchemes.findSchemes);
app.get('/v1/projects/:projectId/schemes/:schemeId',    [middleware.projectReadPermission], apiSchemes.getScheme);
app.delete('/v1/projects/:projectId/schemes/:schemeId', [middleware.projectWritePermission], apiSchemes.deleteScheme);
app.post('/v1/projects/:projectId/schemes',             [middleware.projectWritePermission], apiSchemes.createScheme);
app.put('/v1/projects/:projectId/schemes/:schemeId',    [middleware.projectWritePermission], apiSchemes.saveScheme);

app.get('/v1/projects/:projectId/tags',  apiSchemes.getTags);

app.post('/v1/projects/:projectId/art', [middleware.auth], apiArt.createArt);
app.get('/v1/projects/:projectId/art', apiArt.getArt);

app.post('/projects/:projectId/images', [middleware.auth], apiImages.uploadImage);
app.get('/projects/:projectId/images/:fileName', apiImages.getImage);

app.post('/v1/projects/:projectId/scheme-thumnbails/:schemeId', apiImages.uploadSchemeThumbnail);

app.get('/v1/projects/:projectId/category-tree',                [middleware.projectReadPermission], apiCategories.getCategoryTree);
app.get('/v1/projects/:projectId/categories',                   [middleware.projectReadPermission], apiCategories.getRootCategory);
app.get('/v1/projects/:projectId/categories/:categoryId',       [middleware.projectReadPermission], apiCategories.getCategory);
app.post('/v1/projects/:projectId/categories',                  [middleware.projectWritePermission],  apiCategories.createCategory);
app.delete('/v1/projects/:projectId/categories/:categoryId',    [middleware.projectWritePermission],  apiCategories.deleteCategory);
app.put('/v1/projects/:projectId/category-structure',           [middleware.projectWritePermission],  apiCategories.ensureCategoryStructure);


const cwd = process.cwd();
app.get('*', function (req, res) {
    res.sendFile(`${cwd}/public/index.html`)
})

app.set('port', config.serverPort);


mongo.connectDb().then(() => {
    return mongoMigrate().catch(err => {
        console.error('Could not execute mongo migrations', err);
        process.exit(1);
    });
}).then(() => {
    app.listen(config.serverPort, () => {
        console.log('Listening on port ' + config.serverPort);
    });
}).catch(err => {
    console.error('Could not connect to Mongodb', err);
    process.exit(1);
});
