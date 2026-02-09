# BASE
FROM node:22 AS base

WORKDIR /usr

# BUILDER
FROM base AS builder

WORKDIR /usr

COPY package*.json ./
RUN npm i && \
    npm cache clean --force

COPY . .

RUN npx prisma generate
RUN npm run build

# RUNNER
FROM base AS runner

WORKDIR /usr

COPY --from=builder /usr/dist ./dist
COPY --from=builder /usr/package*.json ./

RUN npm i --omit-dev

EXPOSE 3000

CMD ["npx", "tsx", "./dist/main.js"]