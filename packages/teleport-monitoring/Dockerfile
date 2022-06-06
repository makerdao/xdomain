FROM node:16
WORKDIR /usr/src/app
EXPOSE 8080

COPY package.json yarn.lock ./
RUN yarn --no-progress --non-interactive --frozen-lockfile --ignore-scripts

COPY . .

RUN yarn eth-sdk

# will timeout after 10 minutes
ENTRYPOINT ["yarn", "start"]