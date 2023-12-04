FROM node:18-alpine


RUN apk add --no-cache python3 make g++ rust cargo

# set working directory
WORKDIR /app

COPY package.json package-lock.json*  ./
COPY . .

ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED 1
# Install dependencies
RUN npm install @next/swc-linux-x64-musl
RUN npm i

EXPOSE 8443

CMD [ "npm", "run", "local" ]

