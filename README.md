<p align="center">
  <img src="logo.png" alt="Yana" width="96">
</p>

<h1 align="center">Yana Web</h1>

<h3 align="center">Your Yana, in a browser. Served from your own machine.</h3>

<p align="center">
  The website and the local web app of the Yana ecosystem:<br>
  chat, missions and an encrypted key vault, with no sign-up and no bundled keys.
</p>

<p align="center">
  <a href="https://github.com/Horonomos-laps/yana-web/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/Horonomos-laps/yana-web/ci.yml?branch=main&label=CI&style=flat" alt="CI" height="20"></a>
  <img src="https://img.shields.io/badge/node-%E2%89%A518-339933?style=flat&logo=node.js" alt="Node 18 or newer" height="20">
  <img src="https://img.shields.io/badge/keys-AES--256--GCM-7d6aa8?style=flat" alt="Keys encrypted with AES-256-GCM" height="20">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-Apache--2.0-2563eb?style=flat" alt="Apache 2.0 license" height="20"></a>
</p>

<p align="center">
  <a href="https://github.com/Horonomos-laps/Yana-AI"><img src="https://img.shields.io/badge/Yana--AI-runtime_and_rules-475569?style=flat" alt="Yana-AI" height="20"></a>
  <img src="https://img.shields.io/badge/yana--web-you_are_here-8b5cf6?style=flat" alt="yana-web, this repository" height="20">
  <a href="https://github.com/Horonomos-laps/Yana-studio"><img src="https://img.shields.io/badge/Yana--studio-desktop_apps-475569?style=flat" alt="Yana-studio" height="20"></a>
</p>

<p align="center">
  <a href="#what-is-in-this-repository">Contents</a> ·
  <a href="#run-the-web-app">Run</a> ·
  <a href="#screens">Screens</a> ·
  <a href="#security">Security</a> ·
  <a href="#robot-bridge">Robot bridge</a> ·
  <a href="https://yana.vutam.link">Website</a>
</p>

<p align="center">
  <sub>
    <a href="https://github.com/Horonomos-laps/Yana-AI/blob/main/CODE_OF_CONDUCT.md">Code of conduct</a> ·
    <a href="https://github.com/Horonomos-laps/Yana-AI/blob/main/CONTRIBUTING.md">Contributing</a> ·
    <a href="LICENSE">Apache-2.0 license</a> ·
    <a href="https://github.com/Horonomos-laps/Yana-AI/blob/main/SECURITY.md">Security policy</a>
  </sub>
</p>

<br>

<table>
  <tr>
    <td align="center" width="25%"><h3>9</h3><sub>screens, all reading<br>real data</sub></td>
    <td align="center" width="25%"><h3>6</h3><sub>model providers<br>bring your own key</sub></td>
    <td align="center" width="25%"><h3>AES-256-GCM</h3><sub>provider keys<br>encrypted at rest</sub></td>
    <td align="center" width="25%"><h3>127.0.0.1</h3><sub>default bind,<br>loopback only</sub></td>
  </tr>
</table>

## The Yana ecosystem

| Repository | Role |
| --- | --- |
| **[Yana-AI](https://github.com/Horonomos-laps/Yana-AI)** | Runtime `yana-rt`, governance rules and hooks, CLI, agents and skills |
| **yana-web** (this repo) | The website at yana.vutam.link, and a local web app |
| **[Yana-studio](https://github.com/Horonomos-laps/Yana-studio)** | Desktop apps: native macOS app, Yana Studio, Yana IDE |

This repository does two jobs. It is the **public website**, and it is a **local web
app** that lets you chat with a model, plan missions and browse agents, skills and
memory from a browser. The web app reads its agents, skills and manifest from a
Yana-AI checkout, so it needs one next to it (see [Run](#run-the-web-app)).

```text
You  →  yana-web  →  Yana-AI core (router, safety, context)  →  Model
```

## What is in this repository

| Path | What it is |
| --- | --- |
| `server.js`, `lib/`, `auth.js`, `crypto-store.js`, `missions.js`, `memory.js` | The local web app server |
| `desktop-src/` | The web app UI source. Vite builds it to `desktop/` |
| `robot.js`, `tts-sidecar/` | Voice bridge for an ESP32 robot, and the local text-to-speech service |
| `site/` | Astro site. `npm run build` writes to `docs-dist/`, which is git-ignored |
| `docs/` | The static website: HTML, CSS, JS and assets. Markdown documentation stays in Yana-AI |
| `worker.js`, `wrangler.jsonc`, `vercel.json` | Hosting configuration for Cloudflare Workers and Vercel |
| `yana-desktop/` | Electron shell that bundles this server. Its packaging config reads paths that exist only in Yana-AI, so build it there for now |
| `_test_*.js`, `tests/` | Tests. CI runs every root `_test_*.js` file and the Astro build |

Some files, for example `desktop-old/`, are kept from the earlier snapshot of this
repository and have not been removed.

### Where the website is served from

The `docs/` folder is deployed by two Git integrations, both pointed at this
repository's `main` branch: Vercel (project `yana-ai-docs`, root directory `docs`) and
a Cloudflare Worker (`wrangler.jsonc`, `assets.directory` is `docs`). Download and
update pages read release data from the Yana-studio repository.

## Run the web app

You need Node 18 or newer and a Yana-AI checkout.

```bash
git clone https://github.com/Horonomos-laps/Yana-AI.git ../Yana-AI
export YANA_ROOT_DIR="$(cd ../Yana-AI && pwd)"   # where the server finds core/ and MANIFEST.json

npm ci
npm start                       # builds the UI, then serves http://127.0.0.1:8081
PORT=3000 npm start             # custom port
HOST=0.0.0.0 npm start          # expose beyond loopback (containers only)
```

`npm start` runs `build:desktop` first. The UI is served from `desktop/`, so a plain
`node server.js` works only if that build already exists from an earlier run.

The server has few runtime dependencies (`react`, `ws`, `marked`, `dompurify`, the
xterm packages, `opusscript` and the Qdrant client). It needs an API key from you for
any model you want to use; there is no sign-up and no key is bundled.

## Screens

Every screen reads real data from the server. None of them shows placeholder numbers.

| Screen | Source |
| --- | --- |
| Welcome | First-run intro, then a link to the login |
| Login | Create a password on first run (scrypt hash), then an HttpOnly session cookie. Vietnamese and English |
| Dashboard | `/api/status` (manifest), `/api/dashboard` (L1 memory, audit log, uptime) |
| Chat | Server-sent events to 6 providers, provider picker, route classification, history that survives reloads |
| Missions | `/api/missions`: file-backed create, update, delete, and a "Plan with Yana" task breakdown |
| Agent Space | `/api/agents`: agents read from the frontmatter in `core/agents/` |
| Memory Garden | `/api/memories`: L1 atomic facts with confidence and freshness |
| Skills | `/api/skills`: on-disk counts grouped by import pack |
| Providers | Encrypted vault status, live model lists from `/api/models`, usage from `/api/usage` |

**Providers:** Anthropic, OpenAI, Gemini, Groq, DeepSeek and OpenRouter. Vision works
where the provider allows it. Live model lists are available for Groq and OpenRouter.

## Security

- **Login gate** (`auth.js`): one user, password stored as a scrypt hash with a random salt in `.yana/auth.json` (mode 600). Session tokens are 256-bit, in an HttpOnly SameSite=Lax cookie. Login is limited to 5 attempts per 15 minutes per IP. Every page and API except `/health`, `/login.html` and `/api/auth/*` needs a session.
- **Key vault** (`crypto-store.js`): provider keys are encrypted at rest with AES-256-GCM. The master key is a non-extractable WebCrypto `CryptoKey` in IndexedDB, and `localStorage` only holds ciphertext.
- **Server defaults:** binds to `127.0.0.1`, rate-limits POST requests to 60 per minute per IP, sends CSP and security headers, serves static files with path-traversal checks, and never puts an API key in a URL.

An XSS bug in the page could still call the vault's decrypt function. The vault
protects storage dumps, backups and sync, not a compromised page.

## API

```text
GET  /health             GET  /api/status         GET  /api/dashboard
GET  /api/agents         GET  /api/memories       GET  /api/skills
GET  /api/usage          GET  /api/missions       POST /api/missions
POST /api/missions/update  POST /api/missions/delete
POST /api/models         POST /api/route          POST /api/chat
POST /api/index          GET  /api/auth/status    POST /api/auth/setup
POST /api/auth/login     POST /api/auth/logout
```

## Robot bridge

`robot.js` lets an ESP32 device that speaks the XiaoZhi / yana-robot WebSocket
protocol use this server as its voice backend. Point the device's server URL at
`wss://<this-host>/robot/ws`. No firmware change is needed.

Status: only the WebSocket handshake and the MCP `initialize` / `tools/list` exchange
are covered by tests (`_test_robot.js`). The speech-to-text, chat and text-to-speech
pipeline has not been verified on real hardware.

<details>
<summary><b>How it works, environment variables and the local TTS service</b></summary>

- The device connects and sends `hello`. The server replies `hello` and, if the device advertises `features.mcp`, opens an MCP session as the client. The device is the MCP server and owns the tools.
- Speech recognition and chat both use `YANA_ROBOT_LLM_PROVIDER` (default `groq`) through the same provider table as `/api/chat` (`lib/providers.js`). Groq's transcription endpoint reuses the chat key.
- Text-to-speech defaults to the VieNeu-TTS v3 Turbo sidecar in `tts-sidecar/`. Its 48 kHz float audio is converted to 24 kHz mono PCM16, Opus-encoded and sent in 60 ms packets. VieNeu speaks Vietnamese and English only; set `YANA_ROBOT_TTS_PROVIDER=openai` for other languages such as Korean.
- Tool calls the model decides to make become MCP `tools/call` requests to the device, for example `self.wheelbot.move_forward`. The tool list is in the robot firmware's board README.

| Variable | Purpose |
| --- | --- |
| `YANA_ROBOT_DEVICE_TOKEN` | Bearer token the device sends in the `Authorization` header. Leave unset only for local testing. |
| `YANA_ROBOT_LLM_API_KEY` | API key for `YANA_ROBOT_LLM_PROVIDER`, used for chat and transcription. |
| `YANA_ROBOT_LLM_PROVIDER` | Key into the provider table. Default `groq`. |
| `YANA_ROBOT_LLM_MODEL` | Overrides the provider's default chat model. |
| `YANA_ROBOT_ASR_MODEL` | Groq transcription model. Default `whisper-large-v3-turbo`. |
| `YANA_ROBOT_WS_PATH` | WebSocket path. Default `/robot/ws`. |
| `YANA_ROBOT_TTS_PROVIDER` | `vieneu` (default, local, Vietnamese and English) or `openai` (cloud, multilingual). |
| `YANA_ROBOT_TTS_API_KEY` | API key for OpenAI TTS. Falls back to `YANA_ROBOT_LLM_API_KEY`. |
| `YANA_ROBOT_TTS_OPENAI_MODEL` | OpenAI TTS model. Default `gpt-4o-mini-tts`. |
| `YANA_ROBOT_TTS_OPENAI_VOICE` | OpenAI TTS voice. Default `alloy`. |
| `YANA_ROBOT_TTS_PACKET_INTERVAL_MS` | Delay between Opus packets. Default `55`, to avoid overflowing the firmware's 1.2 s decode queue. |

**Local VieNeu-TTS v3 setup.** It needs Python 3.10 to 3.13 and uses a torch-free ONNX backend.

```sh
cd tts-sidecar
python3.13 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
./run.sh
```

The first synthesis downloads the model. `GET http://127.0.0.1:7861/health` stays light
and reports whether it has loaded.

| Variable | Default | Purpose |
| --- | --- | --- |
| `VIENEU_SIDECAR_PORT` | `7861` | Local sidecar port |
| `VIENEU_VOICE` | `Phạm Tuyên` | Preset voice when a request omits `voice` |
| `VIENEU_BACKEND` | `onnx` | Low-latency CPU streaming backend |
| `VIENEU_PRECISION` | `int8` | Fast ONNX precision. Use `fp32` for the best quality |
| `VIENEU_THREADS` | `0` | ONNX worker threads. `0` lets VieNeu choose |

`POST /tts` returns a 24 kHz WAV for desktop and mobile. `POST /tts/stream` returns
24 kHz mono PCM16 for the robot bridge.

**Testing locally.** Run `npm start`, then point the device at
`ws://<your-LAN-IP>:8081/robot/ws`. It is the same protocol without TLS.

</details>

## More

[Yana-AI](https://github.com/Horonomos-laps/Yana-AI) · [Yana-studio](https://github.com/Horonomos-laps/Yana-studio) · [yana.vutam.link](https://yana.vutam.link) · [Apache 2.0](LICENSE)
