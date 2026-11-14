// Renders the scenes in video-src/scenes.html to docs/videos/*.mp4.
// Needs: Chrome with --remote-debugging-port, a static server on the repo root, and ffmpeg.
//   node video-src/capture.mjs preview work 0.5 5 9     -> PNG stills in a temp folder
//   node video-src/capture.mjs render [scene ...]       -> mp4 files in docs/videos
import { mkdirSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const DEBUG_PORT = Number(process.env.DEBUG_PORT || 9333);
const PAGE_URL = process.env.PAGE_URL || 'http://127.0.0.1:8766/video-src/scenes.html';
const WIDTH = 1920, HEIGHT = 1246, FPS = 30, JPEG_QUALITY = 92;
const OUT_DIR = fileURLToPath(new URL('../docs/videos/', import.meta.url));
const VIDEOS = {
  work: { file: 'work-screen', seconds: 12.2 },
  terminal: { file: 'screen-terminal', seconds: 10 },
  audit: { file: 'screen-audit-scrub', seconds: 6 },
  caps: { file: 'screen-capabilities-scrub', seconds: 9 },
};

async function connect() {
  const target = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?about:blank`, { method: 'PUT' })).json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  let nextId = 1;
  const pending = new Map();
  ws.onmessage = event => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, msg => (msg.error ? reject(new Error(`${method}: ${msg.error.message}`)) : resolve(msg.result)));
    ws.send(JSON.stringify({ id, method, params }));
  });
  return { send, close: () => ws.close() };
}

async function openPage(cdp) {
  await cdp.send('Page.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: WIDTH, height: HEIGHT, deviceScaleFactor: 1, mobile: false });
  await cdp.send('Page.navigate', { url: PAGE_URL });
  for (let i = 0; i < 50; i++) {
    const { result } = await cdp.send('Runtime.evaluate', { expression: 'document.readyState === "complete" && typeof loadScene === "function"', returnByValue: true });
    if (result.value) return;
    await new Promise(r => setTimeout(r, 100));
  }
  throw new Error(`Page did not load: ${PAGE_URL}`);
}

async function frame(cdp, t, format) {
  await cdp.send('Runtime.evaluate', { expression: `renderAt(${t})` });
  const shot = await cdp.send('Page.captureScreenshot', format === 'png' ? { format: 'png' } : { format: 'jpeg', quality: JPEG_QUALITY });
  return Buffer.from(shot.data, 'base64');
}

async function main() {
  const [mode, ...args] = process.argv.slice(2);
  const cdp = await connect();
  await openPage(cdp);
  const work = join(tmpdir(), 'yana-video-frames');
  if (mode === 'preview') {
    const [scene, ...times] = args;
    await cdp.send('Runtime.evaluate', { expression: `loadScene(${JSON.stringify(scene)})` });
    mkdirSync(work, { recursive: true });
    for (const t of times) {
      const path = join(work, `${scene}-${t}.png`);
      writeFileSync(path, await frame(cdp, Number(t), 'png'));
      console.log(path);
    }
  } else if (mode === 'render') {
    const names = args.length ? args : Object.keys(VIDEOS);
    for (const name of names) {
      const { file, seconds } = VIDEOS[name];
      const dir = join(work, name);
      rmSync(dir, { recursive: true, force: true });
      mkdirSync(dir, { recursive: true });
      await cdp.send('Runtime.evaluate', { expression: `loadScene(${JSON.stringify(name)})` });
      const total = Math.round(seconds * FPS);
      for (let i = 0; i < total; i++) writeFileSync(join(dir, `${String(i).padStart(4, '0')}.jpg`), await frame(cdp, i / FPS, 'jpeg'));
      const out = join(OUT_DIR, `${file}.mp4`);
      const run = spawnSync('ffmpeg', ['-v', 'error', '-y', '-framerate', String(FPS), '-i', join(dir, '%04d.jpg'),
        '-vf', 'scale=in_range=pc:out_range=tv,format=yuv420p', '-color_range', 'tv',
        '-c:v', 'libx264', '-preset', 'slow', '-crf', '24', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { stdio: 'inherit' });
      if (run.status !== 0 || !existsSync(out)) throw new Error(`ffmpeg failed for ${name}`);
      console.log(`${name}: ${total} frames -> ${out}`);
    }
  } else {
    console.log('usage: capture.mjs preview <scene> <t...> | render [scene...]');
  }
  cdp.close();
}

main().catch(error => { console.error(error); process.exit(1); });
