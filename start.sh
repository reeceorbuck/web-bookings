#!/bin/sh
set -e

# Userspace networking needs no TUN device or extra privileges, so this runs on
# any container host. Nothing is routed through the tailnet automatically: the
# app reaches it through tailscaled's HTTP proxy instead. In-memory state makes
# this an ephemeral node, so redeploys don't leave old machines on the tailnet.
tailscaled \
  --tun=userspace-networking \
  --outbound-http-proxy-listen=localhost:1055 \
  --state=mem: \
  --socket=/tmp/tailscaled.sock &

tailscale --socket=/tmp/tailscaled.sock up \
  --auth-key="${TAILSCALE_AUTHKEY}" \
  --hostname=remote-bookings

HTTPS_PROXY=http://localhost:1055 exec deno run --frozen --minimum-dependency-age 0 -A serve.ts
