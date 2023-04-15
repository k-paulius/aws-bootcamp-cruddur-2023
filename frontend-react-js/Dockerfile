#
# Build Image
#
FROM node:latest AS build

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install

#
# Production Image
#
# pin base image to a minor version for stability
FROM node:16.20-bullseye-slim

ENV NODE_ENV=development
ENV PORT=3000

# use non-root user; node Docker image comes with node users
USER node
WORKDIR /usr/src/app

COPY --chown=node:node --from=build /usr/src/app/node_modules /usr/src/app/node_modules
COPY --chown=node:node . /usr/src/app

EXPOSE ${PORT}
CMD ["npm", "start"]