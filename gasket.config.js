const isCI = process.env.CI === true;
const env = require('./config/.env');
const logPrefix = 'config:gasket';
const bodyParser = require('body-parser');

const localProdHttpConfig = {
  hostname: 'local-prd.c3.int.gdcorp.tools',
  http: false,
  https: {
    root: 'certs',
    key: 'local-prd.c3.int.gdcorp.tools.key',
    cert: [
      'local-prd.c3.int.gdcorp.tools.crt'
    ]
  }
}

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
  const { info_accountName } = JSON.parse(req.cookies['info_jomax']) || 'unknown';
  console.log(`${logPrefix}: Requested by ${info_accountName} ${id} - ${url} `);
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
      '@godaddy/gasket-plugin-proxy',
      '@gasket/plugin-express',
    ]
  },
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
    localprod: {
      ...localProdHttpConfig
    }
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
    host: ['dev-gdcorp.tools', 'dev-godaddy.com'],
    appName: 'lighthouse-ui',
    basePath: '',
    realm: 'jomax',
    groups: [
      'SCUI-CARE-SERVICES',
      'SCUI-MARKETING',
      'SCUI-COMMERCE',
      'SCUI-PARTNERS',
      'SCUI-MARKETING',
      'SCUI-MASTER',
      'SCUI-USI',
      'SCUI-CORPORATE',
      'SCUI-GDII',
      'SCUI-DRI',
      'SCUI-GDII-CHINA',
      'SCUI-GDII-GERMANY',
      'SCUI-GDII-INDIA',
      'SCUI-GDII-AU',
      'SCUI-GDII-UK',
      'SCUI-GDII-ROW',
      'SCUI-GDII-US',
      'SCUI-GDII-CA',
      'SCUI-GDII-EMEA',
      'SCUI-GDII-OVERALL'
    ]
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
          // options: {
          //   ...request.options
          // },
          // body: {
          //   ...request.body
          // }
        })
      }
    }
  }
}
