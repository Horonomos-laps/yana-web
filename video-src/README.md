# Website demo videos

Source for the four videos in `docs/videos/`. Each is a mock Yana Studio scene, not a
recording of the real app, and the terminal window carries a "MINH HOẠ" (illustration) tag.

| Scene | Video | Length |
| --- | --- | --- |
| `work` | `work-screen.mp4` | 12.2 s |
| `terminal` | `screen-terminal.mp4` | 10 s |
| `audit` | `screen-audit-scrub.mp4` | 6 s |
| `caps` | `screen-capabilities-scrub.mp4` | 9 s |

The file names, 1920 x 1246 size, 30 fps and lengths match what the pages expect, so the
HTML does not change when a video is re-rendered.

`scenes.html` draws each scene as a pure function of time, so a frame is identical every
time it is rendered. `capture.mjs` steps through the frames in Chrome over the DevTools
protocol and encodes them with ffmpeg. It needs no npm packages.

```bash
# 1. a static server on the repository root
python3 -m http.server 8766 &
# 2. Chrome with a debugging port
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --remote-debugging-port=9333 --user-data-dir=/tmp/yana-video-chrome about:blank &
# 3. stills to check the look, then the real render
node video-src/capture.mjs preview work 2 7.8 11
node video-src/capture.mjs render            # all four, or: render work audit
```

Needs Node 22 or newer (global `WebSocket` and `fetch`) and `ffmpeg`. To change what a
video shows, edit its scene in `scenes.html` and render again.
