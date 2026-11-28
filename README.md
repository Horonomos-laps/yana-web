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
  <img src="https://img.shields.io/badge/node-%E2%89%A522.12-339933?style=flat&logo=node.js" alt="Node 22.12 or newer" height="20">
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
    <td align="center" width="25%"><h3>13</h3><sub>sections in<br>the sidebar</sub></td>
    <td align="center" width="25%"><h3>18</h3><sub>model providers,<br>cloud and local</sub></td>
    <td align="center" width="25%"><h3>AES-256-GCM</h3><sub>provider keys<br>encrypted at rest</sub></td>
    <td align="center" width="25%"><h3>127.0.0.1</h3><sub>default bind,<br>loopback only</sub></td>
  </tr>
</table>

<!-- IMAGE: hero, the web app chat screen -->

## Run the web app

You need Node 22.12 or newer and a checkout of Yana-AI, where the server reads agents,
skills and the manifest.

```bash
git clone https://github.com/Horonomos-laps/yana-web.git
git clone https://github.com/Horonomos-laps/Yana-AI.git
export YANA_ROOT_DIR="$PWD/Yana-AI"

cd yana-web
npm ci
npm start          # builds the interface, then serves http://127.0.0.1:8081
```

Use `PORT=3000 npm start` for another port. `HOST=0.0.0.0` exposes the server beyond your
own machine and is meant for containers.

There is no sign-up and no bundled key. Add your own key for a cloud provider, or point
the app at a model running locally.

## Screens

| Area | Screens |
| --- | --- |
| Work | Chat, Projects, Files, Tasks, Git, Terminal, Activity |
| Setup | Models, Devices, Remote & Tools, Agents, Commands, Permissions, Settings |

The interface is available in Vietnamese, English, Korean and Chinese.

Cloud and local providers are defined in [`lib/providers.js`](lib/providers.js), which is
the list to trust. Local options include Ollama, LM Studio, TurboFieldfare and AirLLM.

## Security

- The server binds to `127.0.0.1` unless you set `HOST`.
- One user. The password is stored as a scrypt hash, and the session cookie is `HttpOnly` and `SameSite=Strict`.
- Login attempts are limited to 5 per 15 minutes, and POST requests to 60 per minute, per address.
- Provider keys in the browser are encrypted with AES-256-GCM.

Encryption protects stored data. A script injected into the page could still ask the
browser to decrypt it. Report problems through [SECURITY.md](SECURITY.md).

## What is in this repository

| Path | What it holds |
| --- | --- |
| `server.js`, `lib/`, `shared/` | The web app server and shared code |
| `desktop-src/` | The interface source. Vite builds it to `desktop/` |
| `docs/` | The public website. Vercel and a Cloudflare Worker deploy this folder from `main` |
| `site/` | An Astro site that builds to `docs-dist/` |
| `robot.js`, `tts-sidecar/` | Voice bridge for an ESP32 robot. See [ROBOT.md](ROBOT.md) |
| `mobile/`, `video-src/` | Mobile and video sources |
| `yana-desktop/` | A retired Electron shell. It is not released |
| `_test_*`, `tests/` | Tests run by CI |

## Robot bridge

An ESP32 robot can use this server as its voice backend. Setup, variables and what has
been tested are in [ROBOT.md](ROBOT.md).

## The Yana ecosystem

| Repository | Role |
| --- | --- |
| **[Yana-AI](https://github.com/Horonomos-laps/Yana-AI)** | The runtime `yana-rt`, governance rules and hooks, the CLI, agents and skills |
| **yana-web** (this repository) | The website, and a web app you run on your own machine |
| **[Yana-studio](https://github.com/Horonomos-laps/Yana-studio)** | The macOS app and Yana Studio |

---

[Contributing](CONTRIBUTING.md) · [Security](SECURITY.md) · [Code of conduct](CODE_OF_CONDUCT.md) · [Apache 2.0](LICENSE)
