const { createLogger, transports } = require('winston');
const env = require('../../config/.env');
const loggerMiddleware = async (req, res, next) => {
    console.log(process.env.GASKET_ENV);
    const { valid, reason } = await req.checkAuth({ realm: 'jomax', risk: 'medium' });
    const logger = createLogger({
        transports: [new transports.Console()],
    });
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
    logger.log(entry);
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
    logger.error(err);
    res.status(500).send(`Something went wrong! ${err.message} ${err.stack}`);
};

module.exports = { loggerMiddleware, loggerErrorMiddleware, noCache };

