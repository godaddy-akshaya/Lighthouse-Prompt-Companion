// lifecycles/express.js

// module.exports = {
//     timing: {
//       after: ['auth'] // handle AFTER checkAuth has been add by auth-plugin
//     },
//     handler: function express(gasket, app) {
//       app.get('/api/secrets', async (req, res) => {
//         try {
//           const { valid, reason } = await req.checkAuth({realm: 'jomax', risk: 'medium', groups: ['SCUI-MASTER']})
//           if (valid) {
//             // Authenticated: continue
//             res.send('Secret content')
//           } else {
//             // Unauthenticated: exit
//             res.status(401).send(reason)
//           }
//         } catch(err) {
//           // Unauthenticated: exit
//           res.status(401).send()
//         }
//       });
//     }
//   }