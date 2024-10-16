# Clips

Self-hosted video game clips website using Bun, bun:sqlite, & FFmpeg.

**Work-in-progress**

## Production Quick start:

1. Build a Docker image with the provided Dockerfile
2. Setup a Discord OAuth app at https://discord.com/developers/applications
3. Include the following env variables when deploying your Docker app: DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, DISCORD_REDIRECT_URI
4. Pull your Discord User ID by enabling Developer Mode on Discord and right clicking your profile picture
5. Supply your Discord User ID in the DISCORD_ADMINS & DISCORD_WHITELIST env variables
6. Modify STORAGE_PATH and DATABASE env variables for platform storage in Docker volumes
7. Expose the container server port (default: 3000) to a reverse proxy

## Environmental variables:

| Name                  | Description                                            | Default                                       |
| -------------------   | ------------------------------------------------------ | --------------------------------------------- |
| DISCORD_CLIENT_ID     | Discord OAuth client id                                |                                               |
| DISCORD_CLIENT_SECRET | Discord OAuth client secret                            |                                               |
| DISCORD_REDIRECT_URI  | Discord OAuth redirect uri                             |                                               |
| DISCORD_WHITELIST     | Comma-separated list of Discord user id's for signups  |                                               |
| DISCORD_ADMINS        | Comma-separated list of site admins by Discord user id |                                               |
| STORAGE_PATH          | Storage path for uploads                               | ./storage                                     |
| DATABASE              | SQLite storage path                                    | clips.sqlite                                  |
| GATEWAY_HOSTNAME      | HTTP server hostname                                   | 0.0.0.0                                       |
| GATEWAY_PORT          | HTTP server port                                       | 3000                                          |
| GATEWAY_ENV           | Environment                                            | prod with `bun start`, dev with `bun dev`     |
| GATEWAY_DEBUG         | console.debug output                                   | false                                         |
| GATEWAY_CACHE_TTL     | Cache-Control max age                                  | 3600                                          |
| GATEWAY_JSON_ERRORS   | Whether to output errors in JSON responses             | true                                          |

## To install dependencies:

```bash
bun i
```

## To generate a route:

```bash
bun gen {name}

bun gen test
# or
bun gen test.ts
# 📝 pages/test.ts created.
```

The new route will automatically open in Visual Studio Code.

## To run a development server:

```bash
bun dev
```

## To run a production server:

```bash
bun start
```

This project was created with [Bun](https://bun.sh), a fast all-in-one JavaScript runtime.
