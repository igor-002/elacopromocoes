FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/admin/package.json ./apps/admin/package.json
COPY packages/contracts/package.json ./packages/contracts/package.json

RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY tsconfig.base.json ./tsconfig.base.json
COPY packages/contracts ./packages/contracts
COPY apps/api ./apps/api

RUN npm run db:generate -w @radar/api \
    && npm run build -w @radar/contracts \
    && npm run build -w @radar/api

FROM node:22-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/package-lock.json* ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/contracts/package.json ./packages/contracts/package.json
COPY --from=build /app/packages/contracts/dist ./packages/contracts/dist
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/prisma ./apps/api/prisma

USER node
EXPOSE 3001

CMD ["npm", "run", "start", "-w", "@radar/api"]
