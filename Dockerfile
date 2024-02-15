# Golden container - only the best
FROM 764525110978.dkr.ecr.us-west-2.amazonaws.com/alpine-node:20-alpine-3.18

#FROM node:20-alpine3.18
# Configure all the permission 
WORKDIR /app
USER root
RUN npm install --global @gasket/cli
# RUN adduser -D worker

RUN chown -R worker /app
USER worker

# Copy minimal set of files needed to install dependencies to ensure cacheability
COPY package.json /app
COPY package-lock.json /app


# Need to login to NPM 
ARG NPM_AUTH_TOKEN
ENV NPM_AUTH_TOKEN=$NPM_AUTH_TOKEN
RUN test -n "${NPM_AUTH_TOKEN}" || (echo 'NPM AUTH TOKEN is not set' && exit 1)
RUN echo "//artifactory.secureserver.net/artifactory/api/npm/node-virt/:_authToken=${NPM_AUTH_TOKEN}" > /app/.npmrc

#RUN echo $(npm whoami)


RUN echo "Starting up the installation"
RUN npm i

# Copy application files + core package
COPY --chown=worker ./.eslintrc.js /app.eslintrc.js
COPY --chown=worker ./.stylelintrc /app/.stylelintrc
COPY --chown=worker ./components /app/components
COPY --chown=worker ./lib /app/lib
COPY --chown=worker ./pages /app/pages
COPY --chown=worker ./public /app/public
COPY --chown=worker ./redux /app/redux
COPY --chown=worker ./styles /app/styles
COPY --chown=worker ./gasket.config.js /app/gasket.config.js
COPY --chown=worker ./manifest.xml /app/manifest.xml

RUN ls -l

RUN gasket build --env development
ENV NODE_ENV=development

CMD ["gasket", "start", "--env", "development"]
EXPOSE 8080





