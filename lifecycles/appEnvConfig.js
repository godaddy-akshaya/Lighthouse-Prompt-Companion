const logPrefix = 'lifecycle:appEnvConfig';

module.exports = async function (gasket, config) {
    const { logger } = gasket;
    if (config.env === 'local') {
        logger.debug(`${logPrefix}: Using local environment configuration`);
        return config;
    }

    logger.debug(`${logPrefix}: Using environment configuration for NODE_ENV=${process.env.NODE_ENV}`);

    return config;
}