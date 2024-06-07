const bodyParser = require('body-parser');
/**
 * Introduce new middleware layers to the stack.
 *
 * @param {Gasket} gasket Reference to the gasket instance
 */
module.exports = function middleware(gasket) {
    return bodyParser.json(
        { limit: '150mb' });
};