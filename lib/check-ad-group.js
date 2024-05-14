async function adGroupCheckMiddleware(req, res, next) {
    const { valid, details } = await req.checkAuth({
        realm: 'jomax',
        risk: 'medium',
        groups: ['lighthouse-ui-devs', 'lighthouse-ui-group']
    });
    // Check if authenticated and user is part of the group
    if (!valid) {
        console.log('User does not have access to this page.', details);
    }
    if (details) {
        console.log(details);
    }

    next();
};

module.exports = adGroupCheckMiddleware;
