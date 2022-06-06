FROM node:16
WORKDIR /usr/src/app
EXPOSE 8080

COPY package.json yarn.lock ./
COPY prisma ./prisma
COPY eth-sdk ./eth-sdk
RUN yarn --no-progress --non-interactive --frozen-lockfile

COPY . . 

CMD ["yarn", "start"]