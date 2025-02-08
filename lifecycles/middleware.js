const bodyParser = require('body-parser');
const cors = require('cors');
module.exports = function middleware() {
  return bodyParser.json(
    { limit: '150mb' });
};
