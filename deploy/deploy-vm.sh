#!/usr/bin/env bash
# Deploy the Tử Vi static site to a Google Cloud VM that already runs Caddy.
#
#   DOMAIN=tuvi.example.com ./deploy/deploy-vm.sh
#
# Optional env: VM (default yoday-vm), ZONE (default asia-northeast1-a), SKIP_BUILD=1.
#
# What it does:
#   1. builds the static site locally (web/out)
#   2. uploads it to /var/www/tuvi/releases/<timestamp> and atomically switches
#      the /var/www/tuvi/current symlink (keeps the last 5 releases for rollback)
#   3. first run only: appends a site block for $DOMAIN to /etc/caddy/Caddyfile,
#      validates the config and reloads Caddy (restoring the backup if invalid).
#      Caddy then obtains and renews a free Let's Encrypt certificate itself.
set -euo pipefail

DOMAIN="${DOMAIN:?Set DOMAIN, e.g. DOMAIN=tuvi.example.com}"
VM="${VM:-yoday-vm}"
ZONE="${ZONE:-asia-northeast1-a}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RELEASE="$(date +%Y%m%d-%H%M%S)"

if [[ "${SKIP_BUILD:-0}" != "1" ]]; then
  echo "==> Building static site"
  (cd "$ROOT/web" && pnpm install --frozen-lockfile && pnpm build)
fi
[[ -f "$ROOT/web/out/index.html" ]] || { echo "web/out/index.html missing — build failed?" >&2; exit 1; }

TARBALL="$(mktemp -t tuvi-XXXXXX.tar.gz)"
trap 'rm -f "$TARBALL"' EXIT
tar -C "$ROOT/web/out" -czf "$TARBALL" .

echo "==> Uploading release $RELEASE to $VM"
gcloud compute scp --zone "$ZONE" "$TARBALL" "$VM:/tmp/tuvi-$RELEASE.tar.gz"

echo "==> Installing on $VM"
gcloud compute ssh "$VM" --zone "$ZONE" --command "sudo bash -s -- '$DOMAIN' '$RELEASE'" <<'REMOTE'
set -euo pipefail
DOMAIN="$1"; RELEASE="$2"
BASE=/var/www/tuvi
CADDYFILE=/etc/caddy/Caddyfile

mkdir -p "$BASE/releases/$RELEASE"
tar -xzf "/tmp/tuvi-$RELEASE.tar.gz" -C "$BASE/releases/$RELEASE"
rm -f "/tmp/tuvi-$RELEASE.tar.gz"
chmod -R a+rX "$BASE"
ln -sfn "$BASE/releases/$RELEASE" "$BASE/current.tmp" && mv -T "$BASE/current.tmp" "$BASE/current"
# keep the 5 most recent releases
ls -1dt "$BASE"/releases/* | tail -n +6 | xargs -r rm -rf
echo "    current -> $(readlink "$BASE/current")"

MARK="# >>> tuvi-app $DOMAIN"
if ! grep -qF "$MARK" "$CADDYFILE"; then
  echo "    adding Caddy site block for $DOMAIN"
  BACKUP="$CADDYFILE.bak-$RELEASE-tuvi"
  cp -a "$CADDYFILE" "$BACKUP"
  cat >> "$CADDYFILE" <<EOF

$MARK (managed by Tuvi deploy/deploy-vm.sh)
$DOMAIN {
	root * $BASE/current
	encode zstd gzip
	header {
		X-Content-Type-Options nosniff
		X-Frame-Options DENY
		Referrer-Policy strict-origin-when-cross-origin
		Permissions-Policy "camera=(), microphone=(), geolocation=()"
		Strict-Transport-Security "max-age=31536000"
		-Server
	}
	@static path /_next/static/*
	header @static Cache-Control "public, max-age=31536000, immutable"
	@html not path /_next/static/*
	header @html Cache-Control "no-cache"
	try_files {path} {path}.html {path}/index.html
	file_server
	handle_errors {
		rewrite * /404.html
		file_server
	}
}
# <<< tuvi-app $DOMAIN
EOF
  if caddy validate --config "$CADDYFILE" --adapter caddyfile >/tmp/tuvi-caddy-validate.log 2>&1; then
    systemctl reload caddy
    echo "    Caddy reloaded (backup: $BACKUP)"
  else
    cp -a "$BACKUP" "$CADDYFILE"
    echo "!!! Caddy config invalid — restored backup. Details:" >&2
    tail -20 /tmp/tuvi-caddy-validate.log >&2
    exit 1
  fi
else
  echo "    Caddy site block already present — files swapped, no reload needed"
fi
REMOTE

echo "==> Checking https://$DOMAIN"
for i in $(seq 1 20); do
  code="$(curl -s -o /dev/null -w '%{http_code}' "https://$DOMAIN/" || true)"
  [[ "$code" == "200" ]] && { echo "    https://$DOMAIN is live (HTTP 200)"; exit 0; }
  sleep 3
done
echo "!!! https://$DOMAIN did not return 200 yet (last: $code). Check that the DNS A record points to the VM and see: sudo journalctl -u caddy -n 50" >&2
exit 1
