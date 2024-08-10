const { BUILD_INFO } = require('./lib/build-info');

// This should be loaded *before* any of the other gasket/nextjs/etc stuff
require('elastic-apm-node').start({
  serviceName: BUILD_INFO.service,
  environment: BUILD_INFO.environment,
  serviceVersion: BUILD_INFO.sha,
  ignoreUrls: ['/healthcheck', '/favicon.ico']
});

// eslint-disable-next-line no-console
console.log(
  `Loaded instrumentation for buildinfo: ${JSON.stringify(BUILD_INFO)}`
);
