import gasket from '../../../gasket.js';
/**
 *
 * @param req
 * @param res
 */
export default async function handler(req, res) {
  const checkAuth = gasket.actions.getCheckAuth(req);
  const auth = await checkAuth(req.query);
  res.json(auth);
}
