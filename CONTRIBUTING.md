# Contributing to yana-web · Đóng góp cho yana-web

> **[Tiếng Việt bên dưới / Vietnamese below](#tiếng-việt)**

This repository holds the website (yana.vutam.link) and the local web app of the Yana ecosystem. The runtime (`yana-rt`), rules,
hooks, agents and skills live in [Yana-AI](https://github.com/Horonomos-laps/Yana-AI); read its
[CONTRIBUTING.md](https://github.com/Horonomos-laps/Yana-AI/blob/main/CONTRIBUTING.md) for anything about those. The desktop apps are in
[Yana-studio](https://github.com/Horonomos-laps/Yana-studio).
Everyone taking part follows the [Code of Conduct](CODE_OF_CONDUCT.md). Security problems go to [SECURITY.md](SECURITY.md), never to a public issue.

## What is in this repository

| Path | What it is |
|---|---|
| `server.js`, `auth.js` and the other `.js` modules at the root, `lib/`, `shared/` | The local web server and its modules |
| `desktop-src/` | React UI source, built by Vite into `desktop/` (`npm run build:desktop`) |
| `site/` | The public website (Astro). Also `docs/`, `worker.js`, `wrangler.jsonc`, `vercel.json` for hosting |
| `_test_*.js`, `_test_*.mjs` | Tests for the server (plain Node scripts) |
| `tests/` | Website tests (Python standard library) |
| `yana-desktop/` | The desktop wrapper that bundles this server |
| `mobile/`, `tts-sidecar/`, `robot.js` | Mobile client, the TTS sidecar, and the ESP32 robot bridge (see the README) |

## Principles

1. **Real data only.** Each screen reads a real source. No sample numbers.
2. **Secrets are encrypted at rest and never in URLs.** Provider keys use the vault (AES-256-GCM, non-extractable WebCrypto key in IndexedDB); localStorage holds ciphertext only. See
   [rule 66](https://github.com/Horonomos-laps/Yana-AI/blob/main/.claude/rules/66-client-secret-encryption-law.md) in Yana-AI.
3. **Loopback by default.** The server binds `127.0.0.1`; `HOST=0.0.0.0` is for containers only.
4. **Everything except `/health`, `/login.html` and `/api/auth/*` sits behind the login gate.** A new route is gated unless the PR explains why not.

## Run the web app

CI uses Node 24. `package.json` requires Node 22.12 or newer.

```bash
git clone https://github.com/Horonomos-laps/yana-web.git
cd yana-web
npm ci
npm start                 # builds desktop/ with Vite, then node server.js → http://127.0.0.1:8081
PORT=3000 npm start       # another port
```

## Before you open a PR

CI (`ci.yml`) runs every `_test_*` file at the root, the Python website tests, the Astro site build and `npm audit` on production dependencies. Run the same locally and paste the output:

```bash
for f in _test_*.js _test_*.mjs; do timeout 120 node "$f" || echo "FAILED: $f"; done
python3 -m unittest discover -s tests -p "test_*.py" -v
(cd site && npm ci --ignore-scripts && npm run build)     # when you touched the website
npm audit --omit=dev --package-lock-only
```

`website-numbers.yml` checks the counts shown on the website against Yana-AI (it checks Yana-AI out and runs its `check_counts.py`). If it fails, the fix is described in that workflow's header.

## What we accept

| Type | Welcome? | Notes |
|---|---|---|
| Bug fix | ✅ | Add or extend a `_test_*.js` that fails before the fix |
| New provider adapter or connector | ✅ | Needs an adapter test and a review of key and OAuth handling |
| New screen backed by a real endpoint | ✅ | Real data; Vietnamese and English strings |
| Sample data to fill a screen | ❌ | Show an honest empty state |
| API key in a URL, query string, localStorage or log | ❌ | Rejected at PR stage |
| Real credentials in tests or fixtures | ❌ | Use fakes |
| Weakening auth, rate limits, CSP or the static-path check | Discuss first | Open an Issue titled `design-proposal: ...` |
| Changes to `vercel.json`, `wrangler.jsonc`, `worker.js` or domain setup | Discuss first | They decide what the live site serves |

Discuss first when a change touches 5+ files across modules, changes the HTTP API shape, or changes what is stored under `.yana/`.

## Security checklist for server changes

```
□ New route is behind the login gate (or the PR explains why not)
□ POST endpoints are rate limited
□ Input validated; no path built from user input without the static-path check
□ No keys in URLs; logs contain no request bodies with apiKey fields
□ Security headers and CSP unchanged, or the change is explained
□ A fetch of a user-supplied URL blocks private ranges and unchecked redirects
```

## UI

No hardcoded hex colors; use the existing tokens. Every interactive screen needs loading, empty and error states, in Vietnamese and English. A file over 300 lines or a function over 50 lines needs a reason in the PR.

## Commits and PRs

```
type(scope): short description        types: feat, fix, chore, docs, refactor, test, perf
fix(web): reject encoded dot-dot segments in static path serving
```

One topic per PR, from the latest `main`. Several people or agents at once: one branch per git worktree.

```
□ Output of the checks above pasted (not "should pass")
□ npm start builds and the page loads, for UI changes
□ No secrets, no keys in URLs, nothing sensitive in logs or fixtures
□ No hardcoded hex colors
```

## License

Contributions are licensed under Apache-2.0, the license of this repository. Keep attribution for adapted code.

---

## Tiếng Việt

Repo này chứa website (yana.vutam.link) và web app chạy cục bộ. Runtime, rule, hook, agent, skill nằm ở [Yana-AI](https://github.com/Horonomos-laps/Yana-AI); app desktop ở [Yana-studio](https://github.com/Horonomos-laps/Yana-studio). Mọi người tham gia tuân theo [Quy tắc ứng xử](CODE_OF_CONDUCT.md); lỗ hổng bảo mật gửi theo [SECURITY.md](SECURITY.md), không mở issue công khai.

**Nguyên tắc:** chỉ dùng dữ liệu thật; mã hoá key khi lưu và không đưa key vào URL; server chỉ bind loopback; mọi route ngoài `/health`, `/login.html`, `/api/auth/*` nằm sau cổng đăng nhập.

**Chạy thử:** `npm ci` rồi `npm start` (CI dùng Node 24, `package.json` yêu cầu Node 22.12 trở lên).

**Trước khi mở PR:** chạy mọi file `_test_*`, test Python của website, build site Astro nếu sửa website, và `npm audit` như trong phần tiếng Anh; dán output vào PR. CI chạy đúng các bước này.

**Chấp nhận:** sửa lỗi kèm test; adapter/connector mới kèm test; màn hình mới dùng endpoint thật. **Không chấp nhận:** dữ liệu mẫu, key trong URL/localStorage/log, credential thật trong test. Làm yếu auth, rate limit, CSP; đổi `vercel.json`, `wrangler.jsonc`, `worker.js`; hoặc thay đổi chạm 5+ file thì thảo luận trước.

Commit theo `type(scope): mô tả ngắn`, mỗi PR một chủ đề. Đóng góp được cấp phép Apache-2.0, giấy phép của repo này.
