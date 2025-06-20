# Golden container - only the best
FROM 764525110978.dkr.ecr.us-west-2.amazonaws.com/alpine-node:22.13.0-alpine-3.20-arm AS builder

USER root
ENV NEXT_TELEMETRY_DISABLED=1
# Ensure the worker user and group exist
WORKDIR /app

RUN apk upgrade
RUN apk add --update --no-cache bash

# Just the bits we need for npm ci
COPY package*.json .npmrc .npmrc.auth ./

# Copy minimal set of files needed to install dependencies to ensure cacheabilit

# Just the credentials, we use the project-level .npmrc for registry and other settings
RUN cp .npmrc.auth $HOME/.npmrc

RUN --mount=type=secret,id=npm_token,dst=./.npm_token,uid=1000 export ARTIFACTORY_RO_TOKEN=$(cat .npm_token) \
  && npm install 

# Copy everything - unneeded stuff gets filtered out in the `app-prod-filter` docker target
COPY . .

FROM builder AS app-prod-preparer

RUN NODE_ENV=production npm run build

RUN --mount=type=secret,id=npm_token,dst=./.npm_token,uid=1000 export ARTIFACTORY_RO_TOKEN=$(cat .npm_token) \
  && npm prune --production

FROM 764525110978.dkr.ecr.us-west-2.amazonaws.com/alpine-node:22.13.0-alpine-3.20-arm AS app-prod-filter



WORKDIR /app
COPY --from=app-prod-preparer /app/server.js ./
COPY --from=app-prod-preparer /app/package.json /app/gasket.js /app/gasket-data.js /app/start-me-first.js ./
COPY --from=app-prod-preparer /app/node_modules ./node_modules
COPY --from=app-prod-preparer /app/config ./config
COPY --from=app-prod-preparer /app/hooks ./hooks
COPY --from=app-prod-preparer /app/.next ./.next
COPY --from=app-prod-preparer /app/lib ./lib
COPY --from=app-prod-preparer /app/redux ./redux
COPY --from=app-prod-preparer /app/public ./public

RUN ls -la /app

FROM 764525110978.dkr.ecr.us-west-2.amazonaws.com/alpine-node:22.13.0-alpine-3.20-arm AS app

COPY --from=app-prod-filter --chown=worker:worker /app /app

USER worker
WORKDIR /app

ENV ECS_TLS=1
EXPOSE 8443
CMD ["npm", "run", "start"]






