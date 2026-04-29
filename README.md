# Ubiqui Support — Slack app

`/support` slash command that opens a Block Kit modal and creates a
ticket in a Ubiquilife Support backend. Drop it into your team's
Slack and the support flow lives where the conversation already is.

## Install

1. **Create the Slack app**
   - Visit https://api.slack.com/apps → **Create New App** → **From manifest**
   - Paste `manifest.yml`, replacing `YOUR-PUBLIC-HOST` with the
     domain you'll deploy this server to.
   - Install to your workspace.

2. **Run the server**
   ```bash
   npm install
   SLACK_SIGNING_SECRET=xxx \
   SLACK_BOT_TOKEN=xoxb-xxx \
   SUPPORT_API_URL=https://support.ubiqui.life/external-api \
   SUPPORT_API_KEY=xxx \
   SUPPORT_APP_NAME="Acme Slack" \
   npm start
   ```

3. **Expose it.** The Slack URLs in `manifest.yml` need to be public.
   Use Cloudflare Tunnel, ngrok, or deploy behind your normal proxy.

## Usage

In any Slack channel:

```
/support
/support The dashboard isn't loading
```

The bot opens a modal with title, description, and (if your Support
instance has them) category + priority pickers. On submit, the ticket
posts to the external API and the bot DMs the user a confirmation.

## Env vars

| | |
|---|---|
| `SLACK_SIGNING_SECRET` | From the Slack app config |
| `SLACK_BOT_TOKEN` | `xoxb-…` from the Slack app's OAuth section |
| `SUPPORT_API_URL` | `https://support.ubiqui.life/external-api` |
| `SUPPORT_API_KEY` | Bearer token from the Support app |
| `SUPPORT_APP_NAME` | Reported as `source_app` (default `Slack`) |
| `SUPPORT_IDENTIME_USER_ID` | Optional cross-platform user id |
| `PORT` | Listening port (default 3000) |

## License

MIT.
