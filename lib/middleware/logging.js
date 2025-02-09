/* eslint-disable */
const { createLogger, transports, format } = require('winston');
const env = require('../../config/.env');

// Create a global logger instance
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [new transports.Console()]
});

const loggerMiddleware = (req, res, next) => {
  logger.info({
    '@timestamp': new Date().toISOString(), // Optional: timestamp is also handled by format.timestamp()
    label: { app: 'lighthouse', environment: env },
    tags: ['application', 'web'],
    message: {
      method: req.method,
      url: req.originalUrl || req.url,
      base: req.baseUrl,
      path: req.path,
      user: req.headers.weblogin
    },
    cloud: {
      account: {
        name: 'lighthouse-ui'
      }
    }
  });

  next();
};

const noCache = (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
};

const loggerErrorMiddleware = (err, req, res, next) => {
  logger.error({
    '@timestamp': new Date().toISOString(),
    label: { app: 'lighthouse', environment: env },
    tags: ['application', 'web'],
    message: {
      method: req.method,
      url: req.originalUrl || req.url,
      base: req.baseUrl,
      path: req.path,
      user: req.headers.weblogin,
      error: err.message
    },
    cloud: {
      account: {
        name: 'lighthouse-ui'
      }
    }
  });

  // Propagate the error to the next error handler
  next(err);
};

module.exports = { loggerMiddleware, loggerErrorMiddleware, noCache };