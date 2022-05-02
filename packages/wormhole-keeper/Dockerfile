FROM node:16
WORKDIR /usr/src/app

COPY package.json yarn.lock ./
RUN yarn --no-progress --non-interactive --frozen-lockfile

COPY . .

ENTRYPOINT [ "yarn", "start" ]

