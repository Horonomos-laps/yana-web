// Tests docs/assets/release-facts.js: the app facts shown on the download page come from one release.
'use strict';

const assert = require('node:assert');
const { appFacts } = require('./docs/assets/release-facts.js');

const BASE = 'https://github.com/Horonomos-laps/Yana-studio/releases';
const SHA = 'a'.repeat(64);

function asset(tag, name, extra = {}) {
  return { name, size: 474865728, digest: `sha256:${SHA}`, browser_download_url: `${BASE}/download/${tag}/${name}`, ...extra };
}

function release(version, extra = {}) {
  const tag = `app-v${version}`;
  return {
    tag_name: tag,
    published_at: '2026-11-11T15:25:30Z',
    assets: [asset(tag, `Yana-${version}.dmg`), asset(tag, `Yana-${version}.zip`)],
    ...extra,
  };
}

// Empty and malformed input
assert.strictEqual(appFacts([]), null);
assert.strictEqual(appFacts(null), null);
assert.strictEqual(appFacts({ message: 'API rate limit exceeded' }), null);
assert.strictEqual(appFacts([{}]), null);

// Every field follows the same release
const facts = appFacts([release('1.1.0'), release('1.0.0')]);
assert.deepStrictEqual(facts, {
  version: '1.1.0',
  publishedAt: '2026-11-11T15:25:30Z',
  dmgUrl: `${BASE}/download/app-v1.1.0/Yana-1.1.0.dmg`,
  zipUrl: `${BASE}/download/app-v1.1.0/Yana-1.1.0.zip`,
  notesUrl: `${BASE}/tag/app-v1.1.0`,
  size: '475 MB',
  sha256: SHA,
});

// Drafts, pre-releases, foreign tags and releases without a .dmg are skipped
const skipped = [
  release('9.0.0', { draft: true }),
  release('8.0.0', { prerelease: true }),
  { tag_name: 'v7.0.0', assets: [] },
  release('6.0.0', { assets: [] }),
  release('1.0.0'),
];
assert.strictEqual(appFacts(skipped).version, '1.0.0');

// A download URL outside this repository is never offered
const foreign = release('2.0.0', { assets: [asset('app-v2.0.0', 'x.dmg', { browser_download_url: 'https://example.com/x.dmg' })] });
assert.strictEqual(appFacts([foreign]), null);

// Missing or malformed digest and missing zip give empty values, not the old ones
const bare = release('1.2.0', { assets: [asset('app-v1.2.0', 'Yana.dmg', { digest: 'sha256:<script>' })] });
assert.strictEqual(appFacts([bare]).sha256, '');
assert.strictEqual(appFacts([bare]).zipUrl, '');

// Over-long and traversal-like tags do not match
assert.strictEqual(appFacts([release('1.0.0/../..')]), null);
assert.strictEqual(appFacts([{ tag_name: 'app-v' + '1'.repeat(65536), assets: [] }]), null);

process.stdout.write('release facts: all checks passed\n');
