# syntax=docker/dockerfile:1
# Portable image: builds the static site and serves it with Caddy (automatic HTTPS).
# Not needed on a host that already runs a web server — see deploy/deploy-vm.sh.

# ---------- build ----------
FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# ---------- serve ----------
FROM caddy:2-alpine
COPY --from=build /app/out /srv/tuvi
COPY Caddyfile.docker /etc/caddy/Caddyfile
EXPOSE 80 443
