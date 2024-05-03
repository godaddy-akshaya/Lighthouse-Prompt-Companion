# Golden container - only the best
FROM 764525110978.dkr.ecr.us-west-2.amazonaws.com/alpine-node:20-alpine-3.18

ARG NPM_AUTH_TOKEN
ARG NODE_ENV
USER root

RUN apk add bash

# Configure all the permission 
WORKDIR /app

RUN npm install --global @gasket/cli
# RUN adduser -D worker

RUN chown -R worker /app
USER worker

# Copy minimal set of files needed to install dependencies to ensure cacheability
COPY --chown=worker package.json /app
COPY --chown=worker package-lock.json /app
COPY --chown=worker .npmrc.template /app

RUN cat /app/.npmrc.template | sed "s/{{NPM_AUTH_TOKEN}}/${NPM_AUTH_TOKEN}/g"  > /app/.npmrc
RUN cat /app/.npmrc


RUN ls -l

RUN echo "Starting up the installation"
RUN npm install --force

# Copy application files + core package
COPY --chown=worker ./.eslintrc.js /app/.eslintrc.js
COPY --chown=worker ./.babelrc /app/.babelrc
COPY --chown=worker ./.stylelintrc /app/.stylelintrc
COPY --chown=worker ./components /app/components
COPY --chown=worker ./lib /app/lib
COPY --chown=worker ./lifecycles /app/lifecycles
COPY --chown=worker ./config /app/config
COPY --chown=worker ./pages /app/pages
COPY --chown=worker ./public /app/public
COPY --chown=worker ./redux /app/redux
COPY --chown=worker ./styles /app/styles
COPY --chown=worker ./gasket.config.js /app/gasket.config.js
COPY --chown=worker ./next.config.js /app/next.config.js
COPY --chown=worker ./manifest.xml /app/manifest.xml

RUN ls -l

RUN gasket build --env $NODE_ENV


CMD ["gasket", "start", "--env", $NODE_ENV]
EXPOSE 8080





