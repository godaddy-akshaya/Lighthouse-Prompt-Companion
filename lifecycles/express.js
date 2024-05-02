const bodyParser = require('body-parser');
const checkAdGroup = require('../lib/check-ad-group');
const { loggerErrorMiddleware, loggerMiddleware } = require('../lib/middleware/logging');
module.exports = async function express(gasket, app) {
  console.log('Lifecycle:express');
  app.use(checkAdGroup);
  app.use(loggerMiddleware);
  app.use(loggerErrorMiddleware);
  return app;
};
