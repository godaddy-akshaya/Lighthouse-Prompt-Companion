const { createLogger, transports } = require('winston');
const env = require('../../config/.env');
const { create } = require('lodash');
const loggerMiddleware = async (req, res, next) => {
    // const { valid, reason } = await req.checkAuth({ realm: 'jomax', risk: 'medium' });
    const logger = createLogger({
        transports: [new transports.Console()],
    });
    const log = createLogger({
        transports: [new transports.File({
            filename: 'status-api.log',
            level: 'info'
        })]
    })

    log.info(req);
    const entry = {
        '@timestamp': new Date().getUTCFullYear(),
        'label': { 'app': 'lighthouse', 'environment': env },
        'tags': ['security', 'application', 'web'],
        'message': {
            method: req.method,
            url: req.originalUrl,
            user: req.headers['weblogin'],
        }
    }
    logger.info(entry);

    next();
};
const noCache = (req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    next();
};
const loggerErrorMiddleware = (err, req, res, next) => {
    const logger = createLogger({
        transports: [new transports.Console()],
    });
    logger.error(err.message, err);
    next();
};

module.exports = { loggerMiddleware, loggerErrorMiddleware, noCache };

