# Yana

Self-hosted AI workspace. One command to run.

## Quick start

```bash
npx yana
```

Opens at `http://localhost:8081`. Add your API key in **System → Providers**, start chatting.

## Features

- **Multi-provider** — Claude, OpenAI, Gemini, Groq, DeepSeek, OpenRouter, Ollama
- **Encrypted keys** — API keys stored with AES-256-GCM, never sent anywhere except the provider you choose
- **Memory** — Yana remembers context across conversations
- **Missions** — break goals into tracked tasks
- **Mobile + Desktop UI** — auto-detects device, separate optimised shells
- **Self-hosted** — runs on your machine, your data stays local

## Install globally

```bash
npm install -g yana-web
yana
```

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `8081` | Server port |
| `HOST` | `127.0.0.1` | Bind address (`0.0.0.0` for Docker/remote) |
| `YANA_DATA_DIR` | `~/.yana` | Where auth, memory and missions are stored |
| `YANA_ROOT` | `process.cwd()` | Optional: path to a YAMTAM engine checkout for skill routing |

## Docker

```bash
docker run -p 8081:8081 -e HOST=0.0.0.0 -v ~/.yana:/root/.yana ghcr.io/phamlongh230-lgtm/yana-web
```

## License

MIT
