var log = require('./log');

var init = (function() {
    var es = require('eventstore')({
        type: 'mongodb',
        host: 'localhost',
        port: 27017,
        dbName: 'eventstore',
        eventsCollectionName: 'events',
        snapshotsCollectionName: 'snapshots',
        transactionsCollectionName: 'transactions',
        timeout: 10000 // optional
    });

    var eventPublisher = {
        publish: function (event) {
            log.logFormat('publish event %j', event);
        }
    };

    es.useEventPublisher(eventPublisher.publish);

    es.on('connect', function () {
        log.log('storage connected');
    });

    es.on('disconnect', function () {
        log.log('connection to storage is gone');
    });

    return function() {
        es.init(function (err) {
            if (err) {
                log.error('ERROR during eventstore.init()', err);
            }
        });
    }
})();
module.exports.init = init;