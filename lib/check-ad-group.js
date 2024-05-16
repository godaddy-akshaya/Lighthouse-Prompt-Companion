


async function adGroupCheckMiddleware(req, res, next) {
    const r = await req.checkAuth({
        realm: 'jomax',
        risk: 'medium',
        groups: ['lighthouse-ui-devs', 'lighthouse-ui-group']
    });
    console.log(r);

    // Check if authenticated and user is part of the group


    next();
};

module.exports = adGroupCheckMiddleware;
