async function adGroupCheckMiddleware(req, res, next) {
    const { valid, details } = await req.checkAuth({
        realm: 'jomax',
        risk: 'medium',
        groups: [`${process.env.AD_GROUPS}`]
    });
    console.log(details.accountName, 'is a member of lighthouse-ui-devs:', valid);
    if (!valid) {
        // Redirect user to no access page
        console.log('No access for user:', details?.accountName);
        res.send('Sorry you do not have access to this dev page.');
        return;
    }
    next();
};

module.exports = adGroupCheckMiddleware;
