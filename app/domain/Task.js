var uuid = require('node-uuid'),
    log = require('../lib/log');

var Task = (function () {

    function Task(id, name) {
        this.id = id;
        this.name = name;
    }

    Task.createNew = function (name) {
        return new Task(uuid.v4(), name);
    };

    return Task;
})();
module.exports = Task;
