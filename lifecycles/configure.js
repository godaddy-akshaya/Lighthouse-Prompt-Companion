const { createCertificate } = require("@godaddy/quickcert");

module.exports = async function (gasket, config) {
  console.log('configuring server');
  console.log(process.env.ECS_TLS);
  if (process.env.ECS_TLS) {
    const { cert, key } = await createCertificate();
    config.https = { port: 8443, cert, key };
  }

  return config;
};