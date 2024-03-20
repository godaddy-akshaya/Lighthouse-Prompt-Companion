const mergeConfigFiles = require('@gasket/plugin-config/lib/merge-config-files');
const env = require('./.env');

const options = {
    config: {
        root: process.cwd(),
        env
    }
};

module.exports = mergeConfigFiles(options);