import { makeGasket } from '@gasket/core';
import pluginNextJs from '@gasket/plugin-nextjs';
import pluginWebpack from '@gasket/plugin-webpack';
import pluginWinston from '@gasket/plugin-winston';
import pluginAuth from '@godaddy/gasket-plugin-auth';
import pluginVisitor from '@godaddy/gasket-plugin-visitor';
import pluginLogger from '@gasket/plugin-logger';
import pluginDevCerts from '@godaddy/gasket-plugin-dev-certs';
import pluginData from '@gasket/plugin-data';
import pluginProxy from '@godaddy/gasket-plugin-proxy';
import pluginUxp from '@godaddy/gasket-plugin-uxp';
import pluginSelfCerts from '@godaddy/gasket-plugin-self-certs';
import pluginHttpsProxy from '@gasket/plugin-https-proxy';
import pluginExpress from '@gasket/plugin-express';
import gasketData from './gasket-data.js';


export default makeGasket({
  plugins: [
    pluginSelfCerts,
    pluginHttpsProxy,
    pluginLogger,
    pluginWinston,
    pluginWebpack,
    pluginAuth,
    pluginProxy,
    pluginVisitor,
    pluginDevCerts,
    pluginData,
    pluginUxp,
    pluginNextJs,
    pluginExpress
  ],
  httpsProxy: {
    protocol: 'https',
    port: 8443,
    xfwd: true,
    ws: true,
    target: {
      host: 'localhost',
      port: 3000
    }
  },
  presentationCentral: {
    params: {
      app: 'lighthouse-ui',
      market: 'en-us',
      theme: 'godaddy-antares', 
      manifest: 'internal-sidebar',
      realm: 'jomax',
      uxcore: 2400
    }
  },
  uxp: {
    externals: false
  },
  nextConfig: {
    async rewrites() {
      return [
        {
          source: '/healthcheck',
          destination: '/api/healthcheck'
        }
      ];
    }
  },
  data: gasketData
});