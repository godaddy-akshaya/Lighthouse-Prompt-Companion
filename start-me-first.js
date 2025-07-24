import { BUILD_INFO } from "./lib/build-info.js";
import apm from "elastic-apm-node";
import { config } from "dotenv";
config();

// // This should be loaded *before* any of the other gasket/nextjs/etc stuff
apm.start({
  serviceName: BUILD_INFO.service,
  environment: BUILD_INFO.environment,
  serviceVersion: BUILD_INFO.sha,
  serverUrl: process.env.ELASTIC_APM_SERVER_URL,
  secretToken: process.env.ELASTIC_APM_SECRET_TOKEN,
  ignoreUrls: ["/healthcheck", "/favicon.ico"],
});

// eslint-disable-next-line no-console
console.log(
  `Loaded instrumentation for buildinfo: ${JSON.stringify(BUILD_INFO)}`
);
