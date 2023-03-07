FROM node:16
WORKDIR /usr/src/app

COPY package.json yarn.lock ./
RUN yarn --no-progress --non-interactive --frozen-lockfile

COPY . .

# will timeout after 10 minutes
ENTRYPOINT ["timeout", "-k", "650", "600", "yarn", "start" ]
