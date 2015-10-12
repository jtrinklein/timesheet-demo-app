//var amqp = require('amqplib/callback_api'),
//    Q = require('q');
//
//function connectMQ(url) {
//    console.log('connecting to rabbitmq');
//    return Q.ninvoke(amqp, 'connect', url)
//}
//
//function createMQChannel(connection) {
//    console.log('creating rabbitmq channel');
//    return Q.ninvoke(connection, 'createChannel');
//}
//function handleTimesheetsMessage(message) {
//    var msg = JSON.parse(message);
//    console.log('handling timesheets message: ' + msg.type);
//    if(msg.type === 'ADD_ITEM') {
//        var userId = msg.userId;
//        var item = msg.item;
//        addItemToUserData(userId, item);
//    }
//}
//
//function addItemToUserData(userId, item) {
//    console.log('adding item for ' + userId);
//    return getUserData(userId).then(function(u){
//        u.items.push(item);
//        return getCollection()
//            .then(function(c) {
//                return Q.ninvoke(c, 'update', {firstName: u.firstName}, u, {upsert: true});
//            });
//    });
//}
//
//function getUserData(userId) {
//    return getCollection().then(function(c) {
//        console.log('got collection');
//        return Q.ninvoke(c.find({firstName: userId}), 'toArray');
//    }).fail(function(err) {
//        if(err) {
//            console.log('error: ' + err);
//        }
//    }).then(function(matches) {
//        var u = (matches || [])[0];
//        return u || {firstName: userId, items: []};
//    });
//}
//
//var mqChannel;
//connectMQ('amqp://guest:guest@rabbit')
//    .fail(function(err) {
//        console.log('rabbitmq error: ' + err);
//    })
//    .then(createMQChannel)
//    .fail(function(err) {
//        console.log('rabbitmq error: ' + err);
//    })
//    .then(function(ch){
//        console.log('verify/create rabbitmq "timesheets" exchange');
//        mqChannel = ch;
//        ch.assertExchange('timesheets', 'fanout', {durable: false});
//        return Q.ninvoke(ch, 'assertQueue', '', {exclusive: true});
//    })
//    .fail(function(err) {
//        console.log('rabbitmq error: ' + err);
//    })
//    .then(function(queue) {
//        console.log('register timesheets message handler');
//        mqChannel.bindQueue(queue.queue, 'timesheets', '');
//        mqChannel.consume(queue.queue, handleTimesheetsMessage, {noAck: true});
//    })
//    .fail(function(err) {
//        console.log('rabbitmq error: ' + err);
//    });