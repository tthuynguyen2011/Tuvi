# Tử Vi Đẩu Số & Thái Ất Thần Kinh

Live: https://tuvi.cheetah.vn — Tử Vi at `/`, Thái Ất (gieo quẻ hỏi việc & Nhân Mệnh) at `/thai-at`.

| Folder | What it is |
|---|---|
| [`web/`](web/) | **The web app** — Next.js + Tailwind CSS. The Tử Vi engine is TypeScript and runs entirely in the browser; the build is a static site. |
| [`tuvi-app/`](tuvi-app/) | The original Python engines (Tử Vi + Thái Ất) + local server. Kept as the **reference implementation**: the TypeScript ports in `web/src/lib/tuvi` and `web/src/lib/thaiat` are tested against it. |
| [`deploy/`](deploy/) | Deployment: `deploy-vm.sh` (GCP VM with Caddy) and a portable `docker-compose.yml`. |

## Develop

```bash
cd web
pnpm install
pnpm dev            # http://localhost:3000
```

## Test

```bash
cd web
pnpm test           # regenerates golden fixtures from the Python engine, then runs the parity suite
pnpm lint && pnpm typecheck
```

`pnpm test` runs `scripts/gen_golden.py`, which feeds the Python engines 400 random Tử Vi births,
3,000 lunar-calendar conversions, 600 Thái Ất divinations (all Kế modes, topics, stances, urgencies)
and 400 Nhân Mệnh charts, and requires the TypeScript ports to reproduce every output **exactly**.

**When the Python engine changes** (e.g. a new commit to `tuvi-app/`): port the change to the matching
`.ts` file, run `python3 web/scripts/gen_constants.py` if tables/texts changed, then `pnpm test` until green.

The star-meaning tables in `web/src/lib/tuvi/data.ts` are generated from the Python source:
`python3 web/scripts/gen_constants.py`.

## Deploy

**Google Cloud VM that already runs Caddy** (current production setup):

```bash
DOMAIN=tuvi.example.com ./deploy/deploy-vm.sh      # VM=yoday-vm ZONE=asia-northeast1-a by default
```

Builds `web/out/`, uploads it to `/var/www/tuvi/releases/<timestamp>`, switches the
`/var/www/tuvi/current` symlink atomically and, on the first run, adds a site block for `$DOMAIN`
to `/etc/caddy/Caddyfile` (backed up, validated, then reloaded). Caddy obtains and renews the free
Let's Encrypt certificate itself. Point the subdomain's DNS **A record** to the VM's IP first.

Rollback: `sudo ln -sfn /var/www/tuvi/releases/<older> /var/www/tuvi/current` on the VM.

**Any fresh server with Docker** (ports 80/443 free):

```bash
cd deploy && DOMAIN=tuvi.example.com docker compose up -d --build
```

## Original local tool

`python tuvi-app/app.py` (or double-click `Chạy_Tử_Vi.bat` on Windows) still works and serves the
old UI on http://127.0.0.1:8765.
