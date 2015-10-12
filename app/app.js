var express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    mustache = require('mustache-express'),
    MongoData = require('./lib/MongoData'),
    endpoints = require('./lib/endpoints'),
    eventstoreInitializer = require('./lib/eventstoreInitializer'),
    log = require('./lib/log');

app.use('/static', express.static('.'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.engine('html', mustache());

var mongoUrl = 'mongodb://' + (process.env.MONGO_PORT_27017_TCP_ADDR || 'localhost') + ':' + (process.env.MONGO_PORT_27017_TCP_PORT || '27017') + '/timesheets';
var mongoData = new MongoData(mongoUrl)
endpoints.register(app, mongoData);

eventstoreInitializer.init();

app.listen(8123, function () { log.log('server ok. listening on port 8123'); });
