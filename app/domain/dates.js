var moment = require('moment');
var sunday = moment().utc().startOf('week');
// These dates should all be at midnight UTC
var dates = {
    sunday: sunday.toDate(),
    monday: sunday.add(1, 'day').toDate(),
    tuesday: sunday.add(2, 'day').toDate(),
    wednesday: sunday.add(3, 'day').toDate(),
    thursday: sunday.add(4, 'day').toDate(),
    friday: sunday.add(5, 'day').toDate(),
    saturday: sunday.add(6, 'day').toDate()
};
module.exports = dates;
