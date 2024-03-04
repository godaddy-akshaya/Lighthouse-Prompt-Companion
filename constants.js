/** ⛔️ This file should never be imported from a Next.JS page, content will be exposed in client-side bundles! ⛔️ */

/**
 * @type {string} Environments EFD-UI is deployed in.
 */
const LOCAL = 'local';
const DEV_PRIVATE = 'dev-private';
const DEVELOPMENT = 'development';
const PRODUCTION = 'production';

const API = '/api/v1';
const HOSTNAMES = new Map([
    [DEV_PRIVATE, 'lighthouse.c3.int.dev-gdcorp.tools'],
    [DEVELOPMENT, 'lighthouse.c3.int.dev-gdcorp.tools'],
    [PRODUCTION, 'lighthouse.c3.int.gdcorp.tools']
]);

/**
 * @type {string} Region EFD-UI is currently deployed to
 */
const REGION = 'us-west-2';

/**
 * Platform IAM:Role arn references for each environment. These typically map to the same account/env.
 * However our CICD account has no deployments/services and will resolve to development.
 * @type {Map<string, string>}
 */


module.exports = {
    API,
    HOSTNAMES,
    REGION,
    ENVS: { LOCAL, DEV_PRIVATE, DEVELOPMENT, PRODUCTION }
};