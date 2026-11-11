# Remote bookings

The online booking page, hosted outside the practice's network. A patient opens
it with their booking code, chooses a time and reserves it, or asks to hear about
times that aren't offered yet. It's the patient side of dental's `/bookings`
route, without the staff simulation or the patient's name and recall details.

The web server checks each code and does the reserving, and returns only times,
so this app never receives patient details.

The app holds no database credentials. It joins the tailnet and does everything
through the web server (the `webServer` project on the practice server), which
also supplies dental's times:

```
patient -> this app (container host) -> tailnet -> web server :4444 -> MySQL
```

## Run locally

Copy `.env.example` to `.env`, then run `deno task dev`. The machine needs to be
on the tailnet already. The page is at `http://localhost:3035`.

## Deploy

`Dockerfile` builds the image, and `start.sh` joins the tailnet and starts the
app. Set these on the host:

| Variable            | Value                                                       |
| ------------------- | ----------------------------------------------------------- |
| `TAILSCALE_AUTHKEY` | A reusable, ephemeral auth key tagged `tag:remote-bookings` |
| `WEBSERVER_URL`     | `https://server-sdc.pirate-grouse.ts.net:4444`              |

`GET /health` answers without touching the tailnet, for the host's health check.

The image installs from `deno.lock`. Run `deno task lock` after changing a
dependency, including after a tinytools release moves the pin.

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
      "ip": ["tcp:4444"]
    }
  ]
}
```

That port serves only the routes that check a booking code. The web server's
main port, 4443, doesn't authenticate its routes, so this app must never be
allowed to reach it.
