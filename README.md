# prompt-ui

Prompt UI 

## Local Setup

To support https with SSO for local development, first update your hosts file 
to include:

```
127.0.0.1  local.gasket.dev-godaddy.com
```

Now start up the app.

```bash
cd prompt-ui

npm install

npx gasket local
```

The app should now be accessible over https on port 8443 at:

```
https://local.gasket.dev-godaddy.com:8443
```
