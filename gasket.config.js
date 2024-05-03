const isCI = process.env.CI === true;
const env = require('./config/.env');
const logPrefix = 'config:gasket';
const { transports } = require('winston');




const localHttpsConfig = {
  hostname: 'local.c3.int.dev-gdcorp.tools',
  http: false,
  https: {
    root: 'certs',
    key: 'local.c3.int.dev-gdcorp.tools.key',
    cert: [
      'local.c3.int.dev-gdcorp.tools.crt'
    ]
  },
  winston: {
    level: 'debug'
  }
};
// The last element is the name of the api endpoint
// The api configuration and metat data is stored in the config object
// Each request will go through the proxy and the proxy will use the api configuration to make the request
const getLastElementInUrl = (url) => {
  const parts = url.split('/');
  let last = parts.pop();
  // remove any query parameters
  if (last.includes('?')) {
    last = last.split('?')[0];
  }
  return last;
}
const getUrlForProxy = (req) => {
  const id = getLastElementInUrl(req.url);
  const { url } = req.config?.api[id] || '';
  return url;
}
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
      '@gasket/plugin-log',
      '@godaddy/gasket-plugin-auth',
      // '@godaddy/gasket-plugin-security-auth-logging',
      // '@godaddy/gasket-plugin-security-logger',
      '@godaddy/gasket-plugin-healthcheck',
      '@godaddy/gasket-plugin-proxy',
      '@gasket/plugin-express',
    ]
  },
  log: {
    prefix: 'lighthouse'
  },
  winston: {
    level: ['info'],
    transports: [
      new transports.File({
        filename: 'error.log',
        level: 'error'
      }),
      new transports.File({
        filename: 'combined.log',
        level: 'info'
      })
    ]
  },
  // securityLogger: {
  //   aws: {
  //     accountId: '722577363440',
  //     accountName: 'gd-aws-usa-gpd-ckpgluecatal-dev-private'
  //   },
  //   serviceFullName: 'lighthouse-ui-logger'
  // },
  helmet: {
    contentSecurityPolicy: false
  },
  environments: {
    local: {
      ...localHttpsConfig
    },
    development: isCI
      ? localHttpsConfig
      : {},
  },
  presentationCentral: {
    params: {
      app: 'lighthouse-ui',
      header: 'internal-sidebar',
      uxcore: '2301',
      market: 'en-us',
      theme: 'godaddy-antares'
    }
  },
  api: {
    bodyParser: {
      sizeLimit: '100mb',
    },
  },
  auth: {
    appName: 'lighthouse-ui',
    basePath: '/',
    realm: 'jomax',
    groups: ['lighthouse-ui-devs', 'lighthouse-ui-group'],
  },
  proxy: {
    proxies: {
      getSecureData: {
        url: '/aws/secure-data/:id',
        targetUrl: ({ req }) => getUrlForProxy(req),
        requestTransform: ({ req }) => request => ({
          ...request,
          headers: {
            ...request.headers,
            Authorization: 'sso-jwt ' + req.cookies['auth_jomax']
          },
          options: {
            ...request.options
          }
        })
      },
      getPostData: {
        url: '/aws/post-data/:id',
        method: 'POST',
        targetUrl: ({ req }) => getUrlForProxy(req),
        requestTransform: ({ req }) => request => ({
          ...request,
          headers: {
            ...request.headers,
            Authorization: 'sso-jwt ' + req.cookies['auth_jomax']
          },
        })
      }
    }
  }
}
