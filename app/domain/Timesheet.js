var uuid = require('node-uuid');
var Task = require('./Task');
var util = require('util');
var log = require('./../lib/log');
var commands = {
    createTimesheet: 'createTimesheet',
    addTask: 'addTask'
};
var events = {
    timesheetCreated: 'timesheetCreated',
    taskAdded: 'taskAdded'
};
var Timesheet = (function () {

    function Timesheet(id) {
        this.id = id;
        this.tasks = [];
        this.uncomittedEvents = [];
    }

    Timesheet.create = function (id) {
        return new Timesheet(id);
    };

    Timesheet.prototype.addTask = function (evt, callback) {
        this.apply(evt);
        callback(null, this.uncomittedEvents);
    };

    Timesheet.prototype.createTimesheet = function (evt, callback) {
        this.apply(evt);
        callback(null, this.uncomittedEvents);
    };

    Timesheet.prototype.loadFromHistory = function (history) {
        log.log('loading from history: ', history.length);
        for (var i = 0, len = history.length; i < len; i++) {
            var e = history[i].payload;
            e.fromHistory = true;
            this.apply(e);
        }
    };

    Timesheet.prototype.toEvent = function (cmd) {
        var cmdName = cmd.command;
        log.log('Command ', cmd.command);
        var event = null;
        switch (cmdName) {
            case commands.createTimesheet:
                {
                    var timesheetId = cmd.id;
                    var payload = cmd.payload;
                    payload.id = timesheetId;
                    event = {
                        event: events.timesheetCreated,
                        fromHistory: false,
                        time: Date.now(),
                        payload: payload
                    };
                }
                break;
            case commands.addTask:
                {
                    var payload = cmd.payload;
                    payload.id = this.id;
                    event = {
                        event: events.taskAdded,
                        fromHistory: false,
                        time: Date.now(),
                        payload: payload
                    };
                }
                break;
            default: {
                throw new Error('Timesheet: No command named ' + cmdName);
            }
        }
        return event;
    };

    Timesheet.prototype.timesheetCreated = function (evt) {
        var payload = evt.payload;
        this.id = payload.id;
        this._id = payload.id;
        this.start = payload.start;
        this.end = payload.end;
        this.userId = payload.userId;
        // Not applying tasks as this would make it more difficult to communicate changes via messaging.
    };

    Timesheet.prototype.taskAdded = function (evt) {
        this.tasks.push(evt.payload.task);
    };

    Timesheet.prototype.apply = function (evt) {
        try {
            var eventFn = this[evt.event];
            if (!util.isFunction(eventFn)) {
                log.error('Timesheet.apply, no function with name ' + evt.event);
            }
            eventFn.call(this, evt);
            if (!evt.fromHistory) {
                this.uncomittedEvents.push(evt);
            }
        }
        catch (e) {
            log.error('apply failed', e);
        }
    };

    return Timesheet;
})();
module.exports = Timesheet;
