const { createCertificate } = require('@godaddy/quickcert');

module.exports = async function (gasket, config) {
  if (process.env.ECS_TLS) {
    const { cert, key } = await createCertificate(gasket.config.hostname);
    config.https = { port: 8443, cert, key };
  }
  return config;
};
