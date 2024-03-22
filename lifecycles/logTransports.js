const { transports } = require('winston');

module.exports = function () {
    return [
        new transports.Console(),
        new transports.File({
            filename: 'errors.log',
            level: 'warning'
        })
    ];
};