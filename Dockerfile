# Create base image which can be cached for prolonged periods, pending changes to package-lock.json
FROM 764525110978.dkr.ecr.us-west-2.amazonaws.com/alpine-node:20.6.1-alpine-3.18
USER root
# LABEL type="fd-base"

RUN apk add --no-cache bash openssl
RUN npm install -g npm@10.4.0
# create a user that can run the application
# and define the maximum open files at 65k
RUN ulimit -n 65536 && \
    addgroup -g 9999 app && \
    adduser -D  -G app -s /bin/false -u 9999 app


RUN mkdir -p /app
RUN chown app:app /app
WORKDIR /app

# Swich to application user
USER app

# Copy minimal set of files needed to install dependencies to ensure cacheability
COPY --chown=app:app package.json /app
COPY --chown=app:app package-lock.json /app
# Make sure we have the .npmrc file with the token 
COPY --chown=app:app .npmrc /app/.npmrc



# # Install all dependencies as we still need to build the application.
RUN npm ci

# # Shrink image size by removing install cache
RUN npm cache clean --force

# Generate self-signed certificate used by the Gasket (see plugins/deploy-plugin.js)
# RUN openssl genrsa -des3 -out /app/server.origKey -passout pass:server 1024
# RUN openssl req -new -key /app/server.origKey -out /app/server.csr -subj "/C=US/ST=Arizona/L=Mesa/O=Go Daddy/OU=Cloud Platform/CN=*.lighthouse-ui.gdcorp.tools/emailAddress=mswaagman@godaddy.com" -passin pass:server
# RUN openssl rsa -in /app/server.origKey -out /app/server.key -passin pass:server
# RUN openssl x509 -req -days 3650 -in /app/server.csr -signkey /app/server.key -out /app/server.crt
# RUN rm /app/server.origKey

# # Remove .npmrc file that was added for install steps
RUN rm /app/.npmrc

ENV HOME=/app

# Next.js defaults to production build, use `AWS_ENV` to specify runtime environment per https://github.com/vercel/next.js/discussions/25764
ARG AWS_ENV=development
ENV AWS_ENV=${AWS_ENV}

# create a user that can run the application
# and define the maximum open files at 65k
# RUN ulimit -n 65536 && \
#     addgroup -g 9999 app && \
#     adduser -D  -G app -s /bin/false -u 9999 app

WORKDIR /app

# # Set file ownership to app as user:group
RUN chown app:app /app

# Copy application files + core package
COPY --chown=app:app ./components ./components
COPY --chown=app:app ./lib ./lib
# COPY --chown=app:app ./providers ./providers
COPY --chown=app:app ./pages ./pages
COPY --chown=app:app ./public ./public
# COPY --chown=app:app ./plugins ./plugins
# COPY --chown=app:app ./utils ./utils
COPY --chown=app:app ./redux ./redux
COPY --chown=app:app ./styles ./styles
COPY --chown=app:app ./gasket.config.js ./gasket.config.js
COPY --chown=app:app ./manifest.xml ./manifest.xml
# COPY --chown=app:app ./tsconfig.json ./tsconfig.json
# COPY --chown=app:app ./bin/server ./bin/server

# # Switch to application user and build the application
USER app:app
RUN npm run local --env=${AWS_ENV}

EXPOSE 8081
EXPOSE 8443

# ENV NEXT_TELEMETRY_DISABLED 1

ENTRYPOINT [ "/app" ]