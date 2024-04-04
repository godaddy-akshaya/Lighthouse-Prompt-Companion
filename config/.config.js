const mergeConfigFiles = require('@gasket/plugin-config/lib/merge-config-files');
const env = require('./.env');

const options = {
    config: {
        root: process.cwd(),
        env
    }
};
console.log('Options:', options);
module.exports = mergeConfigFiles(options);