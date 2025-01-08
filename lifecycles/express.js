const checkAdGroup = require('../lib/middleware/check-ad-group');
const { loggerErrorMiddleware, loggerMiddleware } = require('../lib/middleware/logging');
module.exports = async function express(gasket, app) {
  app.use(checkAdGroup);
  app.use(loggerMiddleware);
  app.use(loggerErrorMiddleware);
  app.get('/healthcheck', (req, res) => {
    res.send({ 'health': 'ok' });
  });
  return app;
};
