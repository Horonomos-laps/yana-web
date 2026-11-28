# Robot bridge

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
