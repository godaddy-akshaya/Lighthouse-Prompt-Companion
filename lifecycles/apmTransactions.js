// /lifecycles/apm-transaction.js

module.exports = (transaction, { req }) => {
  console.log('Apm transaction lifecycle');
  transaction.setLabel('language', req.headers['accept-language']);
};
