/* eslint-disable */
const { md, pki } = require('node-forge');

/**
 * Generates a new private key and a self-signed TLS certificate.
 * The certificate and private key can be used to secure an HTTPS
 * server, although the certificate will not be publicly trusted because it is
 * self-signed. This works because AWS load balancers don't require HTTPS
 * backends to have publicly trusted certificates. The ALB is responsible for
 * terminating TLS traffic with a publicly trusted certificate.
 *
 * @param {number} expiryInDays The number of days the certificate should be valid for
 * @returns {{cert: string, key: string}} Strings containing a TLS certificate
 * and private key
 */
exports.generateCertAndKey = async (expiryInDays = 3650) => {
  // Create RSA public/private keys for signing
  const keys = pki.rsa.generateKeyPair(2048);

  // Build a TLS certificate
  const cert = pki.createCertificate();
  cert.validity.notAfter = new Date(
    Date.now() + expiryInDays * 24 * 60 * 60 * 1000
  );
  cert.publicKey = keys.publicKey;

  // Use the private key to generate a SHA-256 signature of the certificate
  cert.sign(keys.privateKey, md.sha256.create());

  // Convert to pem
  return {
    cert: pki.certificateToPem(cert),
    key: pki.privateKeyToPem(keys.privateKey)
  };
};
