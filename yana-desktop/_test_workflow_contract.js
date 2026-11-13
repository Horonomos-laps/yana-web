'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const workflow = fs
  .readFileSync(path.join(__dirname, '..', '..', '.github', 'workflows', 'desktop.yml'), 'utf8')
  .replace(/\r\n?/g, '\n');
assert.match(workflow, /^permissions:\n  contents: read$/m);
assert.strictEqual((workflow.match(/tools\/yana-desktop\/dist\/\*\.deb/g) || []).length, 2);
assert.strictEqual((workflow.match(/tools\/yana-desktop\/dist\/latest-mac\.yml/g) || []).length, 2);
assert.strictEqual((workflow.match(/tools\/yana-desktop\/dist\/\*\.dmg\.blockmap/g) || []).length, 2);
assert.match(workflow, /node-version: '24'/);
assert.match(workflow, /run: npm test/);
assert.match(workflow, /^  publish:\n[\s\S]*?    needs: build/m);
assert.match(workflow, /assemble-release\.js/);
assert.match(workflow, /contents: write/);
// The release action must be pinned to a full commit SHA with a version comment. The version number is
// not fixed here: it moves with every action bump and a hard-coded one broke this test (v3.0.2 vs v3.0.3).
assert.match(workflow, /softprops\/action-gh-release@[0-9a-f]{40} # v\d+\.\d+\.\d+ \(node24\)/);

console.log('Desktop workflow contract tests passed: 10');
