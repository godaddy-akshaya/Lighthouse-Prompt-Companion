async function adGroupCheckMiddleware(req, res, next) {
  try {
    const { valid } = await req.checkAuth({
      realm: 'jomax',
      risk: 'medium',
      groups: ['lighthouse-ui-devs', 'lighthouse-ui-group']
    });

    if (valid) {
      console.log('User is part of the group');
      return next();
    }

    console.log('User is authenticated but does not have access');
    // Redirect the user to the no-access page in your public folder.
    return res.redirect('/no-access.html');
  } catch (error) {
    return next(error);
  }
}

module.exports = adGroupCheckMiddleware;