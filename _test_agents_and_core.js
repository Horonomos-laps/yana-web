'use strict';

// Unit tests for lib/agents.js (system prompt loading) and lib/core.js (wiring from a root directory).
// A temporary directory stands in for a Yana-AI checkout, so the test needs no core/ in this repository.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createAgents } = require('./lib/agents');
const { createCore } = require('./lib/core');

const PROMPT_LIMIT_BYTES = 8 * 1024; // lib/agents.js caps a system prompt at 8 KB
const OVER_LIMIT_BYTES = PROMPT_LIMIT_BYTES + 1000;
const TRUNCATION_MARKER = '[...system prompt truncated at 8 KB...]';

let failures = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`PASS  ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL  ${name}\n      ${error.message}`);
  }
}

function makeAgentsDir(agents) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'yana-agents-'));
  for (const [name, content] of Object.entries(agents)) fs.writeFileSync(path.join(dir, `${name}.md`), content);
  return dir;
}

const withFrontmatter = body => `---\nname: x\n---\n${body}`;
const GENERIC = createAgents().loadSystemPrompt([]);

test('without a directory the generic prompt is used', () => {
  assert.ok(GENERIC.includes('Yana'), 'generic prompt should introduce Yana');
  assert.strictEqual(createAgents().loadSystemPrompt(['planner']), GENERIC);
});

test('a suggested agent is loaded without its frontmatter', () => {
  const dir = makeAgentsDir({ planner: withFrontmatter('You plan work.') });
  assert.strictEqual(createAgents({ agentsDir: dir }).loadSystemPrompt(['planner']), 'You plan work.');
});

test('the first suggested agent that exists wins', () => {
  const dir = makeAgentsDir({ second: withFrontmatter('Second body.') });
  assert.strictEqual(createAgents({ agentsDir: dir }).loadSystemPrompt(['missing', 'second']), 'Second body.');
});

test('an agent with an empty body falls through to the next one', () => {
  const dir = makeAgentsDir({ blank: withFrontmatter(''), real: withFrontmatter('Real body.') });
  assert.strictEqual(createAgents({ agentsDir: dir }).loadSystemPrompt(['blank', 'real']), 'Real body.');
});

test('a name that tries to leave the directory is refused', () => {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'yana-agents-parent-'));
  fs.writeFileSync(path.join(parent, 'secret.md'), 'outside the agents directory');
  const agentsDir = path.join(parent, 'agents');
  fs.mkdirSync(agentsDir);
  const prompt = createAgents({ agentsDir }).loadSystemPrompt(['../secret', '..\\secret', 'a/b']);
  assert.strictEqual(prompt, GENERIC);
});

test('entries that are not strings are skipped', () => {
  const dir = makeAgentsDir({ planner: withFrontmatter('You plan work.') });
  assert.strictEqual(createAgents({ agentsDir: dir }).loadSystemPrompt([null, 42, {}, 'planner']), 'You plan work.');
});

test('a suggestion that is not an array gives the generic prompt', () => {
  const dir = makeAgentsDir({ planner: withFrontmatter('You plan work.') });
  const agents = createAgents({ agentsDir: dir });
  assert.strictEqual(agents.loadSystemPrompt('planner'), GENERIC);
  assert.strictEqual(agents.loadSystemPrompt(undefined), GENERIC);
});

test('a prompt over the limit is cut and ends with the marker', () => {
  const dir = makeAgentsDir({ big: withFrontmatter('y'.repeat(OVER_LIMIT_BYTES)) });
  const prompt = createAgents({ agentsDir: dir }).loadSystemPrompt(['big']);
  assert.ok(prompt.endsWith(TRUNCATION_MARKER), 'marker missing');
  assert.ok(Buffer.byteLength(prompt, 'utf8') <= PROMPT_LIMIT_BYTES, 'prompt exceeds the limit');
});

function makeRoot({ skills = [], agents = {} } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'yana-root-'));
  fs.mkdirSync(path.join(root, 'core', 'skills'), { recursive: true });
  fs.mkdirSync(path.join(root, 'core', 'agents'), { recursive: true });
  for (const name of skills) fs.mkdirSync(path.join(root, 'core', 'skills', name));
  for (const [name, body] of Object.entries(agents)) fs.writeFileSync(path.join(root, 'core', 'agents', `${name}.md`), body);
  return root;
}

test('createCore reads skills and agents from core/ under the root', () => {
  const root = makeRoot({ skills: ['alpha', 'beta'], agents: { planner: withFrontmatter('Planner prompt.') } });
  const core = createCore({ rootDir: root });
  assert.strictEqual(core.skillCount(), 2);
  assert.strictEqual(core.loadSystemPrompt(['planner']), 'Planner prompt.');
});

test('createCore finds no skills when the root has no core/ (the case /health reports as 503)', () => {
  const empty = fs.mkdtempSync(path.join(os.tmpdir(), 'yana-empty-root-'));
  assert.strictEqual(createCore({ rootDir: empty }).skillCount(), 0);
  assert.strictEqual(createCore({ rootDir: path.join(empty, 'does-not-exist') }).skillCount(), 0);
});

test('explicit skillsDir and agentsDir override the root', () => {
  const root = makeRoot({ skills: ['from-root'] });
  const elsewhere = fs.mkdtempSync(path.join(os.tmpdir(), 'yana-skills-elsewhere-'));
  fs.mkdirSync(path.join(elsewhere, 'one'));
  fs.mkdirSync(path.join(elsewhere, 'two'));
  fs.mkdirSync(path.join(elsewhere, 'three'));
  assert.strictEqual(createCore({ rootDir: root, skillsDir: elsewhere }).skillCount(), 3);
});

test('createCore exposes the functions the server calls', () => {
  const core = createCore({ rootDir: makeRoot() });
  for (const name of ['classify', 'matchSkills', 'route', 'loadSystemPrompt', 'findBestSkill', 'loadSkillPrompt', 'skillCount']) {
    assert.strictEqual(typeof core[name], 'function', `${name} is missing`);
  }
});

if (failures) {
  console.error(`\n${failures} test(s) failed`);
  process.exit(1);
}
console.log('\nAll agents.js and core.js tests passed.');
