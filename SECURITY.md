# Security Policy — yana-web · Chính sách bảo mật

> **[Tiếng Việt bên dưới / Vietnamese below](#tiếng-việt)**

## Supported versions

Only the latest `main` of this repository, and the website that is deployed from it, are supported.
`package.json` is at version 0.1.0 and there are no tagged releases to maintain separately. This is a solo-maintained project.

## Reporting a vulnerability

**Do not open a public GitHub Issue for a security problem.**

- **GitHub Security Advisories**: Security tab of this repository, then *Report a vulnerability*.
- **Email**: the address in the [Yana-AI security policy](https://github.com/Horonomos-laps/Yana-AI/blob/main/SECURITY.md), with `yana-web SECURITY` in the subject.

Include what you found, the steps to reproduce, and what an attacker gains.
We aim to acknowledge a report within 48 hours and to patch critical issues within 7 days, the same targets as the Yana-AI policy.

## Scope

| Type | Example |
|---|---|
| Authentication bypass | Reaching a gated page or `/api/*` route without a session, weakening the login rate limit, or a predictable session token |
| Key vault | Plaintext provider keys in localStorage, a key in a URL or log, or a way to export the non-extractable master key |
| Path traversal | A static-file request that reads outside the served directory (`static-path.js`) |
| Injection and XSS | Model output or tool results that run as script in the page, or reach a shell |
| SSRF | A route that fetches a user-supplied URL and reaches a private or metadata address |
| Robot bridge | A device or client that can use `/robot/ws` without authorization, or inject tool calls |
| OAuth connectors | Token leakage or a wrong redirect in the Google, GitHub, Slack, Notion, Figma or Canva flows |
| Website and hosting | A change that would serve or leak something it should not through `worker.js`, `wrangler.jsonc` or `vercel.json` |

Out of scope: flaws in model providers, issues that need `HOST=0.0.0.0` on an unprotected network (that mode is for containers only), a machine that is already compromised, and `yana-rt` itself (report to
[Yana-AI](https://github.com/Horonomos-laps/Yana-AI/blob/main/SECURITY.md)).

## Disclosure

We follow coordinated disclosure: we credit reporters unless they ask not to, avoid public detail until a fix or mitigation exists, and do not pursue good-faith research that follows this policy.

---

## Tiếng Việt

Chỉ nhánh `main` mới nhất và website triển khai từ đó được hỗ trợ. **Không mở issue công khai cho lỗ hổng bảo mật.** Báo riêng qua GitHub Security Advisories của repo này, hoặc email ghi trong [chính sách bảo mật của Yana-AI](https://github.com/Horonomos-laps/Yana-AI/blob/main/SECURITY.md) với tiêu đề có `yana-web SECURITY`. Chúng tôi cố gắng xác nhận trong 48 giờ và vá lỗi nghiêm trọng trong 7 ngày.

**Trong phạm vi:** vượt qua đăng nhập, lộ key trong vault/URL/log, path traversal, XSS và injection, SSRF, robot bridge, OAuth connector, cấu hình hosting của website. **Ngoài phạm vi:** lỗi ở provider, chế độ `HOST=0.0.0.0` trên mạng không bảo vệ, máy đã bị xâm nhập, `yana-rt` (báo ở Yana-AI).
