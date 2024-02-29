const path = require('path');

module.exports = {
  plugins: {
    presets: [
      '@godaddy/webapp'
    ],
    add: [
      '@gasket/fetch',
      '@gasket/plugin-config'
    ]
  },
  helmet: {
    contentSecurityPolicy: false
  },
  environments: {
    local: {
      hostname: 'local.gasket.dev-godaddy.com',
      http: 8080,
      https: {
        port: 8443,
        // root: path.join(__dirname, 'certs'),
        // key: 'local.c3.int.dev-gdcorp.tools.key',
        // cert: 'local.c3.int.dev-gdcorp.tools.crt'
      },
      endpoints: {
        api: 'https://gheg0jyux8.execute-api.us-west-2.amazonaws.com/dev'
      },
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
