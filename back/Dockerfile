FROM node:20 AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci && npm cache clean --force

COPY . .

RUN npx prisma generate
RUN npm run build

FROM node:20 AS production

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production && npm cache clean --force

RUN npx prisma generate

COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=1000:1000 /app/dist ./dist

RUN mkdir -p /app/uploads && chown 1000:1000 /app/uploads
RUN chown -R 1000:1000 /app

USER 1000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

CMD ["node", "dist/main"] 