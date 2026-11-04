# Remote bookings

The online booking page, hosted outside the practice's network. This is a proof
of concept: it lists the available appointments and nothing else, and doesn't
ask for a booking code yet.

The app holds no database credentials. It joins the tailnet and gets the times
from the web server (the `webServer` project on the practice server), which also
supplies them to dental:

```
patient -> this app (container host) -> tailnet -> web server :4443 -> MySQL
```

## Run locally

Copy `.env.example` to `.env`, then run `deno task dev`. The machine needs to be
on the tailnet already. The page is at `http://localhost:3035`.

## Deploy

`Dockerfile` builds the image, and `start.sh` joins the tailnet and starts the
app. Set these on the host:

| Variable            | Value                                              |
| ------------------- | -------------------------------------------------- |
| `TAILSCALE_AUTHKEY` | An ephemeral auth key tagged `tag:remote-bookings` |
| `WEBSERVER_URL`     | `https://server-sdc.pirate-grouse.ts.net:4443`     |

`GET /health` answers without touching the tailnet, for the host's health check.

## Tailnet access

This app faces the public internet, so limit what its node can reach. In the
tailnet policy, declare the tag and allow it only the web server's port:

```json
{
  "tagOwners": { "tag:remote-bookings": ["autogroup:admin"] },
  "hosts": { "server-sdc": "<the server's tailnet IP>" },
  "grants": [
    {
      "src": ["tag:remote-bookings"],
      "dst": ["server-sdc"],
      "ip": ["tcp:4443"]
    }
  ]
}
```

The web server doesn't authenticate its routes, so this limits the node to the
port, not to the appointment routes.
