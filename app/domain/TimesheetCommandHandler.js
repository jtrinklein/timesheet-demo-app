var Timesheet = require('./Timesheet');
var TimesheetOperation = require('./TimesheetOperation');
var util = require('util');
var async = require('async');
var log = require('./../lib/log');
var uuid = require('node-uuid');

var TimesheetCommandHandler = (function () {

    function TimesheetCommandHandler(eventstore) {
        this.eventstore = eventstore;
    }

    TimesheetCommandHandler.prototype.handleCommand = function (command, done) {
        var _this = this;
        async.waterfall([
            function (callback) {
                var op = new TimesheetOperation();
                op.command = command;
                _this.createTimesheetInstance(op, callback);
            },
            function (operation, callback) {
                _this.loadEventHistory(operation, callback);
            },
            function (operation, callback) {
                _this.applyCommand(operation, callback);
            }
        ], done);
    };

    TimesheetCommandHandler.prototype.createTimesheetInstance = function (operation, callback) {
        var command = operation.command;
        var timesheetId = command.id;
        if (!timesheetId) {
            command.id = timesheetId = uuid.v4();
            log.log('NEW TIMESHEET');
        }
        else {
            log.log('EXISTING TIMESHEET');
        }
        log.log('Timesheet ID', timesheetId);
        operation.timesheet = Timesheet.create(timesheetId);
        callback(null, operation);
    };

    TimesheetCommandHandler.prototype.loadEventHistory = function (operation, callback) {
        var timesheet = operation.timesheet;
        operation.event = timesheet.toEvent(operation.command);
        log.log('Load Events Stream ID', timesheet.id);
        this.eventstore.getEventStream(timesheet.id, function (err, evtStream) {
            operation.eventStream = evtStream;
            callback(err, operation);
        });
    };

    TimesheetCommandHandler.prototype.applyCommand = function (op, callback) {
        var evt = op.event, evtStream = op.eventStream, timesheet = op.timesheet, command = op.command;
        //log.log('Applying existing events ' + evtStream.events.length)
        timesheet.loadFromHistory(evtStream.events);
        //log.logFormat('Applying new event %j', evt);
        timesheet[command.command](evt, function (err, uncommitted) {
            if (err) {
                callback(err, timesheet);
            }
            else {
                evtStream.addEvents(uncommitted);
                evtStream.commit(function (er, eventStream) {
                    callback(er, timesheet);
                });
            }
        });
    };

    return TimesheetCommandHandler;
})();
module.exports = TimesheetCommandHandler;
