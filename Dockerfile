ARG DENO_VERSION=2.9.8

FROM denoland/deno:debian-${DENO_VERSION}

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# The tailnet client. Static binaries, so they run on this image as they are.
COPY --from=docker.io/tailscale/tailscale:stable /usr/local/bin/tailscaled /usr/local/bin/tailscaled
COPY --from=docker.io/tailscale/tailscale:stable /usr/local/bin/tailscale /usr/local/bin/tailscale

WORKDIR /app
COPY . .
RUN chmod +x start.sh && deno task build

EXPOSE 8000
ENV PORT=8000
CMD ["/app/start.sh"]
