var util = require('util');
module.exports = {
    log: function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        console.log();
        console.log(args);
    },
    verbose: function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        //console.log(args);
    },
    error: function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        console.log();
        console.error(args);
    },
    logFormat: function (msg) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        console.log();
        console.log(util.format(msg, args));
    },
    errorFormat: function (msg) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        console.log();
        console.error(util.format(msg, args));
    }
};
