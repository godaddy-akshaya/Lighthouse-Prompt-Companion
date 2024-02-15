const path = require('path');

module.exports = {
  http: 8080,
  plugins: {
    presets: [
      '@godaddy/webapp'
    ],
    add: [
      '@gasket/mocha',
      '@gasket/fetch',
      '@gasket/plugin-config'
    ]
  },
  helmet: {
    contentSecurityPolicy: false
  },
  environments: {
    local: {
      hostname: 'local.gasket.dev-gdcorp.tools',
      endpoints: {
        api: 'https://gheg0jyux8.execute-api.us-west-2.amazonaws.com/dev'
      },
      http: 80,
      https: 443,
    },
    development: {
      hostname: 'localhost',
      http: 8080,
      https: 8443,
      api: {
        url: 'https://lighthouse.c3.int.dev-gdcorp.tools/scorecard-mgmt',
      },
    },
    production: {
      https: {
        root: path.join(__dirname, 'certs'),
        key: '*.c3.int.dev-gdcorp.tools.key',
        cert: ['*.c3.int.dev-gdcorp.tools.crt']
      },
      hostname: 'lighthouse.c3.int.dev-gdcorp.tools',

      plugins: {
        remove: []
      }
    }
  },
  presentationCentral: {
    params: {
      app: 'lighthouse-ui',
      header: 'internal-sidebar',
      uxcore: '2301',
      theme: 'godaddy-antares'
    }
  }
};
