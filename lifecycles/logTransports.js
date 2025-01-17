const { transports } = require('winston');

module.exports = function () {
  return [
    new transports.Console()
  ];
};
