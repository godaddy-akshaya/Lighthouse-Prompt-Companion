const isCI = process.env.CI === 'true';
const env = require('./config/.env');

const localHttpsConfig = {
  hostname: 'local.c3.int.dev-gdcorp.tools',
  http: false,
  https: {
    root: 'certs',
    key: 'local.c3.int.dev-gdcorp.tools.key',
    cert: [
      'local.c3.int.dev-gdcorp.tools.crt'
    ]
  }
};
module.exports = {
  env,
  http: 8080,
  hostname: 'localhost',
  plugins: {
    presets: [
      '@godaddy/webapp'
    ],
    add: [
      '@gasket/fetch',
      '@gasket/plugin-config',
      '@godaddy/gasket-plugin-auth'
    ]
  },
  helmet: {
    contentSecurityPolicy: false
  },
  environments: {
    local: {
      ...localHttpsConfig,
    },
    development: isCI
      ? localHttpsConfig
      : {}
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
