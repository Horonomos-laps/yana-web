// The figures in the README header must match the source they describe.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { PROVIDERS } = require('./lib/providers');

const read = (file) => fs.readFileSync(path.join(__dirname, file), 'utf8');
const readme = read('README.md');

function figure(label) {
  const match = readme.match(new RegExp(`<h3>(\\d+)</h3><sub>${label}`));
  assert.ok(match, `README header has no figure labelled "${label}"`);
  return Number(match[1]);
}

assert.strictEqual(figure('model providers'), Object.keys(PROVIDERS).length, 'provider count');

const sidebar = read('desktop-src/new-app/sidebar.jsx');
const sections = sidebar.match(/\{ id: '[a-z-]+', icon:/g) || [];
assert.strictEqual(figure('sections in'), sections.length, 'sidebar section count');

const minimumNode = JSON.parse(read('package.json')).engines.node.replace('>=', '');
assert.ok(readme.includes(`node-%E2%89%A5${minimumNode}-`), `Node badge should say ${minimumNode}`);
assert.ok(readme.includes(`Node ${minimumNode} or newer`), `Node text should say ${minimumNode}`);

console.log('readme facts: all checks passed');
