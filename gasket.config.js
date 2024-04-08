const isCI = process.env.CI === 'true';
const env = require('./config/.env');
const logPrefix = 'config:gasket';


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
// The last element is the name of the api endpoint
// The api configuration and metat data is stored in the config object
// Each request will go through the proxy and the proxy will use the api configuration to make the request
const getLastElementInUrl = (url) => {
  const parts = url.split('/');
  return parts.pop();
}
const getUrlForProxy = (req) => {
  console.log('req', req.url);
  Object.keys(req).forEach(key => console.log(key));
  const id = getLastElementInUrl(req.url);
  //  return req.config?.api[id]?.url || `https://4f4y1xez75.execute-api.us-west-2.amazonaws.com/dev`;
  const { url } = req.config?.api[id] || {};
  // logger.info(`${logPrefix}: Using url ${url} for proxy`);
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
      '@godaddy/gasket-plugin-auth',
      '@godaddy/gasket-plugin-proxy'
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
  },
  proxy: {
    proxies: {
      getSecureData: {
        url: '/aws/secure-data',
        // targetUrl: ({ req }) => getUrlForProxy(req),
        targetUrl: 'https://4f4y1xez75.execute-api.us-west-2.amazonaws.com/dev',
        requestTransform: ({ req }) => request => ({
          ...request,
          headers: {
            Authorization: 'sso-jwt ' + req.cookies['auth_jomax']
          }
        })
      },
      getSecureDataExtra: {
        url: '/aws/secure-data/:id',
        targetUrl: ({ req }) => getUrlForProxy(req),
        requestTransform: ({ req }) => request => ({
          ...request,
          headers: {
            Authorization: 'sso-jwt ' + req.cookies['auth_jomax']
          }
        })
      }
    }
  }
};
