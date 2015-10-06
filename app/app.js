
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
    console.log('connecting to rabbitmq');
    return Q.ninvoke(amqp, 'connect', url)
}
function createMQChannel(connection) {
    console.log('creating rabbitmq channel');
    return Q.ninvoke(connection, 'createChannel');
}
function handleTimesheetsMessage(message) {
    try {
        var dataStr =new Buffer( message.content).toString();
        console.log('msg handler: ' + dataStr);
        var msg = JSON.parse(dataStr);
        console.log('handling timesheets message: ' + msg.type);
        if(msg.type === 'ADD_ITEM') {
            var msgData = JSON.parse(msg.data);
            var userId = msgData.userId;
            var item = msgData.item;
            addItemToUserData(userId, item);
        }
    } catch (err) {
        console.error(err);
    }
}
var mqChannel;
connectMQ('amqp://guest:guest@rabbit')
    .fail(function(err) {
        console.log('rabbitmq error: ' + err);
    })
    .then(createMQChannel)
    .fail(function(err) {
        console.log('rabbitmq error: ' + err);
    })
    .then(function(ch){
        console.log('verify/create rabbitmq "timesheets" exchange');
        mqChannel = ch;
        ch.assertExchange('timesheets', 'fanout', {durable: false});
        return Q.ninvoke(ch, 'assertQueue', '', {exclusive: true});
    })
    .fail(function(err) {
        console.log('rabbitmq error: ' + err);
    })
    .then(function(queue) {
        console.log('register timesheets message handler');
        mqChannel.bindQueue(queue.queue, 'timesheets', '');
        mqChannel.consume(queue.queue, handleTimesheetsMessage, {noAck: true});
    })
    .fail(function(err) {
        console.log('rabbitmq error: ' + err);
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
    console.log('item: ' + util.inspect(item));
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
        // replacer function ensures we dont hit json stringify nest limit
        var msgString = JSON.stringify(msg, function(k,v){return v;});
        console.log('sending message:');
        console.log(msgString);
        mqChannel.publish('timesheets', '', new Buffer(msgString));
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
