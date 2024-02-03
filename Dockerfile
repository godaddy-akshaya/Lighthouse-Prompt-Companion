# Golden container - only the best
FROM 764525110978.dkr.ecr.us-west-2.amazonaws.com/alpine-node:20.6.1-alpine-3.18

# Configure all the permission 
WORKDIR /app
USER root
RUN chown -R worker /app
USER worker

# Copy minimal set of files needed to install dependencies to ensure cacheability
COPY package.json /app
COPY package-lock.json /app

# Need to login to NPM 
ARG NPM_AUTH_TOKEN
RUN test -n "$NPM_AUTH_TOKEN"
ENV NPM_AUTH_TOKEN=$NPM_AUTH_TOKEN
RUN echo "//gdartifactory1.jfrog.io/artifactory/api/npm/node-virt/:_auth=${NPM_AUTH_TOKEN}" > /app/.npmrc

RUN npm ci --omit=dev

# Copy application files + core package
COPY --chown=worker ./components ./components
COPY --chown=worker ./lib ./lib
COPY --chown=worker ./middleware ./middleware
COPY --chown=worker ./pages ./pages
COPY --chown=worker ./public ./public
COPY --chown=worker ./redux ./redux
COPY --chown=worker ./styles ./styles
COPY --chown=worker ./gasket.config.js ./gasket.config.js
COPY --chown=worker ./manifest.xml ./manifest.xml

CMD ["npm", "run", "local"]

EXPOSE 8443
