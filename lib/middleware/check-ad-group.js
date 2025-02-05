


async function adGroupCheckMiddleware(req, res, next) {
  const { valid } = await req.checkAuth({
    realm: 'jomax',
    risk: 'medium',
    groups: ['lighthouse-ui-devs', 'lighthouse-ui-group']
  });
  if (valid) {
    console.log('User is part of the group');
    next();
  } else {
    console.log('NO ACCESS for User');
    res.status(403).send('Forbidden');
  }
}

module.exports = adGroupCheckMiddleware;
