# CLAUDE.md — slack-support-integration

Slack equivalent of the laravel/nuxt/react/wp/ios/android support
integrations. Self-hosted Bolt app: `/support` opens a Block Kit modal
that posts a ticket to a Ubiquilife Support backend.

## Layout

- `manifest.yml` — Slack app manifest (slash command + interactivity)
- `src/server.js` — Bolt + ExpressReceiver, slash + view handlers
- `src/client.js` — `SupportClient` against the external API
- `package.json` — Node 18+, single dep `@slack/bolt`

## Mandatory rules

- Bearer key + Slack signing secret stay on the server. Never log them.
- Block Kit text fields are 75/200/5000 char-limited; truncate
  defensively.
- Static-select option list capped at 100 by Slack — slice before
  building the modal.
- Snake_case wire format; camelCase JS.
- Match the API shape of the other support-integration repos so a
  ticket from Slack looks identical to one from React/iOS/etc.
