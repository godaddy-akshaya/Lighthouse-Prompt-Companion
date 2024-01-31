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
    [DEV_PRIVATE, '.lighthouse.dev-gdcorp.tools'],
    [DEVELOPMENT, 'platform.frontdoor.dev-gdcorp.tools'],
    [PRODUCTION, 'platform.frontdoor.int.gdcorp.tools']
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
const FDC_EXECUTION_IAM_ROLES = new Map([
    [DEV_PRIVATE, 'arn:aws:iam::372581112254:role/frontdoorpro-custom-fd-platform'],
    [DEVELOPMENT, 'arn:aws:iam::663162811906:role/frontdoorpro-custom-fd-platform'],
    [PRODUCTION, 'arn:aws:iam::195266620747:role/frontdoorpro-custom-fd-platform']
]);

module.exports = {
    API,
    HOSTNAMES,
    REGION,
    FDC_EXECUTION_IAM_ROLES,
    ENVS: { LOCAL, DEV_PRIVATE, DEVELOPMENT, PRODUCTION }
};