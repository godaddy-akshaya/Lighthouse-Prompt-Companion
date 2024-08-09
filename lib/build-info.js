exports.BUILD_INFO = {
  sha: process.env.BUILT_SHORT_SHA || '(unknown)',
  branch: process.env.BUILT_BRANCH || '(unknown)',
  built_at: process.env.BUILT_AT || '(unknown)',
  environment: process.env.GASKET_ENV || process.env.NODE_ENV || 'unspecified',
  region: process.env.AWS_REGION || '(none)',
  process_start: Date.now()
};

try {
  const packageJson = require('../package.json');
  this.BUILD_INFO.service = packageJson.name;
  this.BUILD_INFO.version = packageJson.version;
} catch (e) {
  console.log(
    `unable to load package.json to fetch service name and version: ${e}`
  );
  this.BUILD_INFO.service = '(unknown)';
  this.BUILD_INFO.version = '(unknown)';
}



