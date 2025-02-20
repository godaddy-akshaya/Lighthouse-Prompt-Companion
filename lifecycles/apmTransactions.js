// /lifecycles/apm-transaction.js

module.exports = (transaction, { req }) => {
  console.log('****** APM LIFECYCLE TRANSACTION *****');
  transaction.setLabel('language', req.headers['accept-language']);
};
