FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=development
ENV PORT=4000

EXPOSE 4000

CMD ["node", "src/app.js"]