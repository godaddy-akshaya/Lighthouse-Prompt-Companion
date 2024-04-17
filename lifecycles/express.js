
const bodyParser = require('body-parser');

module.exports = async function express(gasket, app) {
  console.log('Lifecycle: express');
  app.use(bodyParser.raw({ limit: 2000000 }));
  app.use(bodyParser.json({ limit: 2000000 }));
  app.use(bodyParser.urlencoded({ limit: 2000000, extended: true }));
  //// app.use(loggerMiddleware);
  // app.use(loggerErrorMiddleware);
  return (app);
};
