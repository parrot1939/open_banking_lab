FROM node:22-bookworm-slim
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY src ./src
USER node
EXPOSE 3000
CMD ["node", "src/main.mjs"]
