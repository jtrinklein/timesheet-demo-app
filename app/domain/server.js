//var restify = require('restify');
var Task = require('./Task');
var TimesheetCommandHandler = require('./TimesheetCommandHandler');
var dates = require('./dates');
var util = require('util');
var async = require('async');
var eventstore = require('eventstore');
var assert = require('assert');
var log = require('./../lib/log');

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
//var url = 'mongodb://localhost:27017/timesheets';
es.init(function (err) {
    if (err) {
        log.error('ERROR during eventstore.init()', err);
    }
    var commandHandler = new TimesheetCommandHandler(es);
    async.waterfall([
        function (callback) {
            var command = {
                command: 'createTimesheet',
                payload: {
                    start: dates.sunday,
                    end: dates.saturday,
                    userId: 'bob'
                }
            };
            commandHandler.handleCommand(command, function (err, timesheet) {
                assert.ifError(err);
                callback(err, timesheet);
            });
        },
        function (timesheet, callback) {
            var task = Task.createNew('Event sourcing FTW!');
            var command = {
                id: timesheet.id,
                command: 'addTask',
                payload: {
                    task: task
                }
            };
            commandHandler.handleCommand(command, function (err, timesheet) {
                assert.ifError(err);
                callback(err, timesheet);
            });
        }
    ], function (err, result) {
        assert.ifError(err);
        log.log('SERVER: exiting. Final state:', result);
        process.exit();
    });
});
