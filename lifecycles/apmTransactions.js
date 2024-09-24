// /lifecycles/apm-transaction.js

module.exports = (gasket, transaction, { req, res }) => {
    console.log('Apm transaction lifecycle');
    transaction.setLabel('language', req.headers['accept-language']);
}