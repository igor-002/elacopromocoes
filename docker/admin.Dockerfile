FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/admin/package.json ./apps/admin/package.json
COPY packages/contracts/package.json ./packages/contracts/package.json

RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY tsconfig.base.json ./tsconfig.base.json
COPY packages/contracts ./packages/contracts
COPY apps/admin ./apps/admin

RUN npm run build -w @radar/contracts \
    && npm run build -w @radar/admin

FROM caddy:2.10-alpine AS runtime

COPY docker/Caddy.admin /etc/caddy/Caddyfile
COPY --from=build /app/apps/admin/dist /srv

EXPOSE 80
