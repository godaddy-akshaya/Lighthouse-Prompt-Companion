const bodyParser = require('body-parser');

module.exports = function middleware() {
  return bodyParser.json(
    { limit: '150mb' });
};
