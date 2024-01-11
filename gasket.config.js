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
    ]
  },
  helmet: {
    contentSecurityPolicy: false
  },
  environments: {
    local: {
      hostname: 'local.gasket.dev-gdcorp.tools',
      https: 443,
    },
    development: {
      hostname: 'lighthouse.c3.int.dev-gdcorp.tools',
      https: 443,
    },
    production: {
      https: {
        root: path.join(__dirname, 'certs'),
        key: 'prompt-ui.c3.int.dev-gdcorp.tools.key',
        cert: ['prompt-ui.c3.int.dev-gdcorp.tools.crt']
      },
      hostname: 'prompt-ui.c3.int.dev-gdcorp.tools',

      plugins: {
        remove: []
      }
    }
  },
  presentationCentral: {
    params: {
      app: 'prompt-ui',
      header: 'internal-sidebar',
      uxcore: '2301',
      theme: 'godaddy-antares'
    }
  }
};
