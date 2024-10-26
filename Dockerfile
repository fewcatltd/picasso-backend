FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 3000

RUN ls -la
CMD ["npm", "run", "production"]
