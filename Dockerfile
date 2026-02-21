# Stage 1: build
FROM node:24-slim AS build

RUN corepack enable && corepack prepare pnpm@9.14.2 --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps ./apps
COPY packages ./packages

RUN pnpm install --frozen-lockfile
RUN pnpm --filter web run build

# Stage 2: runtime
FROM node:24-slim AS runtime

RUN corepack enable && corepack prepare pnpm@9.14.2 --activate
WORKDIR /app

COPY --from=build /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/.npmrc ./
COPY --from=build /app/apps ./apps
COPY --from=build /app/packages ./packages
COPY --from=build /app/node_modules ./node_modules

ENV NODE_ENV=production
EXPOSE 3000

CMD ["pnpm", "--filter", "api", "run", "start"]
