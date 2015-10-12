var _ = require('lodash'),
    Q = require('q'),
    util = require('util'),
    log = require('../lib/log'),
    TimesheetCommandHandler = require('../domain/TimesheetCommandHandler');

var registerEndpoints = (function() {
    var _mongoData;

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
        log.log('adding item for', userId);
        return getUserData(userId).then(function(u){
            u.items.push(item);
            return _mongoData.getCollection('timesheets')
                .then(function(c) {
                    return Q.ninvoke(c, 'update', {firstName: u.firstName}, u, {upsert: true});
                });
        });
    }

    function getUserData(userId) {
        return _mongoData.getCollection('timesheets')
            .then(function(c) {
                log.log('got collection. c:', c);
                return Q.ninvoke(c.find({firstName: userId}), 'toArray');
            }).fail(function(err) {
                if(err) {
                    log.log('getUserData:', err);
                }
            }).then(function(matches) {
                var u = (matches || [])[0];
                return u || {firstName: userId, items: []};
            });
    }

    function registerEndpoints(app, mongoData) {

        _mongoData = mongoData;

        app.get('/ts/:user', function (req, res) {
            var user = req.params.user;
            getUserData(user)
                .then(createArrayIndexerForProperties(['items']))
                .then(function (data) {
                    log.log('rendering timesheet');
                    log.log('data:', util.inspect(data));
                    res.render('timesheet.html', data);
                });
        });

        app.get('/tsdump', function (req, res) {
            _mongoData.getCollection('timesheets')
                .then(function (c) {
                    return Q.ninvoke(c.find(), 'toArray');
                })
                .then(function (d) {
                    res.send(JSON.stringify(d));
                    res.end();
                })
                .fail(function (e) {
                    res.send(util.inspect(e));
                    res.end();
                });
        });

        app.get('/messenger', function (req, res) {
            var data = {
                types: ['ADD_ITEM', 'UPDATE_ITEM']
            };
            res.render('messenger.html', data)
        });

        app.post('/messenger', function (req, res) {

            var msg = req.body;
            if (mqChannel) {
                mqChannel.publish('timesheets', '', new Buffer(JSON.stringify(msg)));
            }
            res.redirect('/messenger');
        });

        app.post('/ts/:user/items', function (req, res) {
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

            log.log('posted item', item);

            addItemToUserData(uId, item)
                .then(function (u) {
                    log.log('done adding item');
                    res.send("OK");
                    res.end();
                });
        });
    }

    return registerEndpoints;
})();
module.exports.register = registerEndpoints;