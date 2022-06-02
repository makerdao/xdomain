FROM node:12-alpine AS builder
WORKDIR /app
COPY . .
RUN yarn
RUN yarn run build

FROM node:12-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=builder /app/dist ./src
COPY package.json ./
COPY yarn.lock ./
RUN yarn run --frozen-lockfile
CMD [ "yarn", "run", "start:prod" ]