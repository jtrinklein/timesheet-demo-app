
var express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    mustache = require('mustache-express'),
    amqp = require('amqplib/callback_api'),
    _ = require('lodash'),
    Q = require('q'),
    fs = require('fs'),
    client = require('mongodb').MongoClient,
    util = require('util');

function connectMQ(url) {
    return Q.ninvoke(amqp, 'connect', url)
}
function createMQChannel(connection) {
    return Q.ninvoke(connection, 'createChannel');
}
function handleTimesheetsMessage(message) {
    var msg = JSON.parse(message);
    if(msg.type === 'ADD_ITEM') {
        var userId = msg.userId;
        var item = msg.item;
        addItemToUserData(userId, item);
    }
}
var mqChannel;
connectMQ('amqp://rabbitmq')
    .then(createMQChannel)
    .then(function(ch){
        mqChannel = ch;
        ch.assertExchange('timesheets', 'fanout', {durable: false});
        return Q.ninvoke(ch, 'assertQueue', '', {exclusive: true});
    })
    .then(function(queue) {
        mqChannel.bindQueue(queue.queue, 'timesheets', '');
        mqChannel.consume(queue.queue, handleTimesheetsMessage, {noAck: true});
    });
var mongoUrl = 'mongodb://' + (process.env.MONGO_PORT_27017_TCP_ADDR || 'localhost') + ':' + (process.env.MONGO_PORT_27017_TCP_PORT || '27017') + '/timesheets';

var col;
function connect(mongoUrl) {
    console.log('connecting to mongo: ' + mongoUrl);
    return Q.ninvoke(client, 'connect', mongoUrl)
        .then(function(db) {
            console.log('connected to mongo db');
            col = db.collection('timesheets');
            return col;
        })
        .fail(function(err) { console.log('mongo error: ' + err);});
}

function getCollection() {
    return col ? Q.resolve(col) : connect(mongoUrl);
}
function getUserData(userId) {
    return getCollection().then(function(c) {
        console.log('got collection');
        return Q.ninvoke(c.find({firstName: userId}), 'toArray');
    }).fail(function(err) {
        if(err) {
            console.log('error: ' + err);
        }
    }).then(function(matches) {
        var u = (matches || [])[0];
        return u || {firstName: userId, items: []};
    });
}
function createIndexProperty(item, index) {
    return _.defaults(item, {_index: index});
}
function createArrayIndexerForProperties(keys) {
    return function(data) {
        _.forEach(keys, function(k) {
            if(_.isArray(data[k])) {
                data[k] = _.map(data[k], createIndexProperty);
            }
        });
        return data;
    };
}
function addItemToUserData(userId, item) {
    console.log('adding item for ' + userId);
    return getUserData(userId).then(function(u){
        u.items.push(item);
        return getCollection()
            .then(function(c) {
                return Q.ninvoke(c, 'update', {firstName: u.firstName}, u, {upsert: true});
            });
    });
}

app.use('/static', express.static('.'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.engine('html', mustache());

app.get('/ts/:user', function(req,res) {
    var user = req.params.user;
    getUserData(user)
        .then(createArrayIndexerForProperties(['items']))
        .then(function(data) {
            console.log('rendering timesheet');
            console.log('data: ' + util.inspect(data));
            res.render('timesheet.html', data);
        });
});
app.get('/tsdump', function(req,res) {
    getCollection()
        .then(function(c) {
            return Q.ninvoke(c.find(), 'toArray');
        })
        .then(function(d) {
            res.send(JSON.stringify(d));
            res.end();
        })
        .fail(function(e) {
            res.send(util.inspect(e));
            res.end();
        });
});
app.get('/messenger', function(req,res){
    var data = {
        types: ['ADD_ITEM','UPDATE_ITEM']
    };
    res.render('messenger.html', data)
})
app.post('/messenger', function(req,res){

    var msg = req.body;
    if(mqChannel) {
        mqChannel.publish('timesheets', '', new Buffer(JSON.stringify(msg)));
    }
    res.redirect('/messenger');
});

app.post('/ts/:user/items', function(req,res){
    var uId = req.params.user;
    var item = {
        title: req.body.title,
        work: {
            actual: req.body.actualWork,
            allocated: req.body.allocatedWork,
            scheduled: req.body.scheduledWork
        },
        project: req.body.project,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        description: req.body.description
    };
    addItemToUserData(uId, item)
        .then(function(u) {
            console.log('done adding item');
            res.send("OK");
            res.end();
        });
});

app.listen(8123, function () { console.log('server ok'); });