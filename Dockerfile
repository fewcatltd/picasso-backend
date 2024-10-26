FROM node:22-alpine
RUN apk add --no-cache bash

RUN npm ci

COPY . .

EXPOSE 3000

CMD npm run production
