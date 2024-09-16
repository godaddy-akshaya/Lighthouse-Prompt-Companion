const { createLogger, transports } = require('winston');
const env = require('../../config/.env');
const loggerMiddleware = async (req, res, next) => {
    const logger = createLogger({
        transports: [new transports.Console()],
    });

    const entry = {
        '@timestamp': new Date().getUTCFullYear(),
        'label': { 'app': 'lighthouse', 'environment': env },
        'tags': ['application', 'web'],
        'message': {
            method: req.method,
            url: req.originalUrl || req?.url,
            base: req.baseUrl,
            path: req.path,
            user: req.headers['weblogin'],
        },
        'cloud': {
            'account': {
                name: 'lighthouse-ui',
            }
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
    if (err) {
        const entry = {
            '@timestamp': new Date().getUTCFullYear(),
            'label': { 'app': 'lighthouse', 'environment': env },
            'tags': ['application', 'web'],
            'message': {
                method: req.method,
                url: req.originalUrl || req?.url,
                base: req.baseUrl,
                path: req.path,
                user: req.headers['weblogin'],
                error: err.message,
            },
            'cloud': {
                'account': {
                    name: 'lighthouse-ui',
                }
            }
        }

        console.log(err);
        console.log(entry);
        logger.error(entry);
    }

    next();
};

module.exports = { loggerMiddleware, loggerErrorMiddleware, noCache };

