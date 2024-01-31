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

npm login

npm install

npx gasket local
```

The app should now be accessible over https on port 8443 at:

```
https://local.gasket.dev-godaddy.com:8443
```

## Docker Build

```bash

docker build -t lighthouse-ui --build-arg NPM_TOKEN=[token] --build-arg AWS_ENV=[env].
```
