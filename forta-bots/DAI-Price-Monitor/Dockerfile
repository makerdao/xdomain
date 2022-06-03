# Build stage: compile Typescript to Javascript
FROM node:12-alpine AS builder
WORKDIR /app
COPY . .
RUN yarn
RUN yarn run build

# Final stage: copy compiled Javascript from previous stage and install production dependencies
FROM node:12-alpine
ENV NODE_ENV=production
# Uncomment the following line to enable agent logging
# LABEL "network.forta.settings.agent-logs.enable"="true"
WORKDIR /app
COPY --from=builder /app/dist ./src
COPY package.json ./
COPY yarn.lock ./
RUN yarn run --frozen-lockfile
CMD [ "yarn", "run", "start:prod" ] 