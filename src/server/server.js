const express               = require('express');
const path                  = require('path');
const bodyParser            = require('body-parser');
const jsonBodyParser        = bodyParser.json();
const apiSchemes            = require('./api/apiSchemes.js');


const app = express();

app.use(express.static('public'))


var cwd = process.cwd();

app.get('/api/schemes/:schemeId', [jsonBodyParser], apiSchemes.getScheme);

app.get('*', function (req, res) {
    res.sendFile(`${cwd}/public/index.html`)
})

var port = process.env.PORT || 4010;
app.set('port', port);
var server = app.listen(port, () => {
    console.log('Listening on port ' + port);
});
