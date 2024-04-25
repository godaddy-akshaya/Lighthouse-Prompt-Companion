const bodyParser = require('body-parser');
const checkAdGroup = require('../lib/check-ad-group');
const { loggerErrorMiddleware, loggerMiddleware } = require('../lib/middleware/logging');
module.exports = async function express(gasket, app) {
  console.log('Lifecycle:express');
  app.use(checkAdGroup);
  app.use(bodyParser.raw({ limit: 2000000 }));
  app.use(bodyParser.json({ limit: 2000000 }));
  app.use(bodyParser.urlencoded({ limit: 2000000, extended: true }));
  app.use(loggerMiddleware);
  app.use(loggerErrorMiddleware);
  return app;
};
