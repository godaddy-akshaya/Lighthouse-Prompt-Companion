const fetch = require('@gasket/fetch');

module.exports = {
    name: 'example',
    hooks: {
        middleware: function (gasket) {
            function proxy(uri, req) {
                return async function (params) {
                    // Use params here to build the correct url/body
                    const url = 'https://api.endpoint.base.url' + uri;
                    const response = await fetch(url, {
                        headers: {
                            cookie: req.get('cookie')
                        }
                    });
                    return response.json();
                };
            }

            return function (req, res, next) {
                req.getEndPointExample1 = proxy('/endpoint1/', req);
                req.getEndPointExample2 = proxy('/endpoint2/', req);
                next();
            };
        },
        express: function (gasket, app) {
            app.get('/endpoint1', async function (req, res) {
                const { query, params } = req;
                const data = await req.getEndPointExample1({ query, params });
                res.send(data);
            });
            app.get('/endpoint2', async function (req, res) {
                const data = await req.getEndPointExample2();
                res.send(data);
            });
        }
    }
};