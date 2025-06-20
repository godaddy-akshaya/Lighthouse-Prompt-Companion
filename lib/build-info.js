/* eslint-disable no-process-env */

const BUILD_INFO = {
  sha: process.env.BUILT_SHORT_SHA || "(unknown)",
  branch: process.env.BUILT_BRANCH || "(unknown)",
  built_at: process.env.BUILT_AT || "(unknown)",
  environment: process.env.GASKET_ENV || process.env.NODE_ENV || "unspecified",
  region: process.env.AWS_REGION || "(none)",
  process_start: new Date().toISOString(),
  service: process.env.npm_package_name || "lighthouse-ui",
  version: process.env.npm_package_version || "(unknown)",
};

export { BUILD_INFO };
