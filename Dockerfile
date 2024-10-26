FROM node:22-alpine
RUN apk add --no-cache bash

WORKDIR /build
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 3000

CMD npm run start
