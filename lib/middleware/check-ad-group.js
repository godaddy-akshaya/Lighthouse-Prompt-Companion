async function adGroupCheckMiddleware(req, res, next) {
  try {
    const { valid } = await req.checkAuth({
      realm: 'jomax',
      risk: 'medium'
    });

    if (valid) {
      console.log('User is part of the group');
      const validGroups = await req.checkAuth({
        realm: 'jomax',
        risk: 'medium',
        groups: req.config.groups
      })
      if (validGroups.valid) {
        return next();
      } else {

        console.log('User is authenticated but does not have access');
        // Redirect the user to the no-access page in your public folder.
        return res.redirect('no-access.html');
      }
    }
    const { host, app } = req.config.auth;
    return res.redirect(`https://${host}/logout?realm=jomax&app=${app}&path=`);
  } catch (error) {
    return next(error);
  }
}

module.exports = adGroupCheckMiddleware;