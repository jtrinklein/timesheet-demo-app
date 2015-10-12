var Q = require('q'),
    client = require('mongodb').MongoClient,
    log = require('./log');

var MongoData = (function() {

    function connect(mongoUrl) {
        log.log('connecting to mongo:',  mongoUrl);

        return Q.ninvoke(client, 'connect', mongoUrl)
            .then(function(db) {
                log.log('connected to mongo db');
                return db;
            })
            .fail(function(err) {
                log.log('mongo error:', err);
            });
    }

    function MongoData(mongoUrl) {
        this.mongoUrl = mongoUrl;
        this.collections = [];
    }

    MongoData.prototype.getCollection = function getCollection(name) {
        var col = this.collections[name];

        log.log('getCollection', name, 'which', (col ? 'EXISTS' : 'DOES NOT EXIST'));

        if (!col) {
            return connect(this.mongoUrl)
                .then(function(db) {
                    log.log('mongo db', db);
                    return db.collections[name] = db.collection(name);
                })
                .fail(function(err) {
                    log.log('getCollection error:', err);

                });
        } else {
            return Q.resolve(col);
        }
    };

    return MongoData;
})();
module.exports = MongoData;