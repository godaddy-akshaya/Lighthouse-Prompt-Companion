const logPrefix = 'lifecycle:appEnvConfig';

module.exports = async function (gasket, config) {
    console.log('config environment', config.env);
    if (config.env === 'local') {
        return config;
    }
    const { logger } = gasket;
    logger.debug(`${logPrefix}: Using environment configuration for NODE_ENV=${process.env.NODE_ENV}`);

    return config;
}