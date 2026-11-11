'use strict';

// Unit tests for lib/skills.js: indexing a skills directory, matching a task to a skill,
// and loading a skill prompt. Uses a temporary directory so it needs no Yana-AI checkout.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createSkills } = require('./lib/skills');

const PROMPT_LIMIT_BYTES = 8 * 1024; // lib/skills.js caps a loaded prompt at 8 KB
const OVER_LIMIT_BYTES = PROMPT_LIMIT_BYTES + 500;

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

function makeSkillsDir(skills) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'yana-skills-'));
  for (const [name, content] of Object.entries(skills)) {
    const skillDir = path.join(dir, name);
    fs.mkdirSync(skillDir);
    if (content !== null) fs.writeFileSync(path.join(skillDir, 'SKILL.md'), content);
  }
  return dir;
}

const frontmatter = (description, body = 'Body text.') => `---\nname: x\ndescription: ${description}\n---\n${body}`;

test('counts only directories and ignores stray files', () => {
  const dir = makeSkillsDir({ alpha: frontmatter('first'), beta: frontmatter('second') });
  fs.writeFileSync(path.join(dir, 'README.md'), 'not a skill');
  assert.strictEqual(createSkills({ skillsDir: dir }).skillCount(), 2);
});

test('no directory configured gives an empty index and no match', () => {
  const skills = createSkills();
  assert.strictEqual(skills.skillCount(), 0);
  assert.strictEqual(skills.findBestSkill('anything at all'), null);
});

test('a missing directory does not throw and indexes nothing', () => {
  const skills = createSkills({ skillsDir: path.join(os.tmpdir(), 'yana-no-such-dir-xyz') });
  assert.strictEqual(skills.skillCount(), 0);
});

test('a whole-word match on the folder name wins', () => {
  const dir = makeSkillsDir({
    'authentication-patterns': frontmatter('login flows'),
    'database-migrations': frontmatter('schema changes'),
  });
  assert.strictEqual(createSkills({ skillsDir: dir }).findBestSkill('review the authentication flow'), 'authentication-patterns');
});

test('a description word finds a skill whose name does not contain it', () => {
  const dir = makeSkillsDir({ 'ops-guide': frontmatter('deploy kubernetes clusters safely'), 'css-tips': frontmatter('styling') });
  assert.strictEqual(createSkills({ skillsDir: dir }).findBestSkill('kubernetes'), 'ops-guide');
});

test('a block-scalar description is parsed across indented lines', () => {
  const raw = '---\nname: x\ndescription: >\n  folded text about\n  terraform modules\n---\nBody';
  const dir = makeSkillsDir({ 'infra-notes': raw, 'other-notes': frontmatter('unrelated') });
  assert.strictEqual(createSkills({ skillsDir: dir }).findBestSkill('terraform'), 'infra-notes');
});

test('a short token does not match by substring inside a longer name', () => {
  const dir = makeSkillsDir({ 'contract-review': frontmatter('legal') });
  assert.strictEqual(createSkills({ skillsDir: dir }).findBestSkill('tra'), null);
});

test('a task with no usable token matches nothing', () => {
  const dir = makeSkillsDir({ alpha: frontmatter('first') });
  assert.strictEqual(createSkills({ skillsDir: dir }).findBestSkill('a b'), null);
});

test('a task that matches no skill returns null', () => {
  const dir = makeSkillsDir({ alpha: frontmatter('first') });
  assert.strictEqual(createSkills({ skillsDir: dir }).findBestSkill('zzzzzz qqqqqq'), null);
});

test('skill names are matched case-insensitively', () => {
  const dir = makeSkillsDir({ 'Mixed-Case-Skill': frontmatter('demo', 'Hello body') });
  const skills = createSkills({ skillsDir: dir });
  assert.strictEqual(skills.loadSkillPrompt('mixed-case-skill'), 'Hello body');
});

test('loadSkillPrompt removes the frontmatter', () => {
  const dir = makeSkillsDir({ alpha: frontmatter('first', 'Only the body remains.') });
  assert.strictEqual(createSkills({ skillsDir: dir }).loadSkillPrompt('alpha'), 'Only the body remains.');
});

test('loadSkillPrompt returns null for an unknown skill', () => {
  const dir = makeSkillsDir({ alpha: frontmatter('first') });
  assert.strictEqual(createSkills({ skillsDir: dir }).loadSkillPrompt('missing'), null);
});

test('a skill folder without SKILL.md is indexed but has no prompt', () => {
  const dir = makeSkillsDir({ 'empty-skill': null });
  const skills = createSkills({ skillsDir: dir });
  assert.strictEqual(skills.skillCount(), 1);
  assert.strictEqual(skills.loadSkillPrompt('empty-skill'), null);
});

test('a prompt over the limit is cut and marked as truncated', () => {
  const dir = makeSkillsDir({ big: frontmatter('large', 'x'.repeat(OVER_LIMIT_BYTES)) });
  const prompt = createSkills({ skillsDir: dir }).loadSkillPrompt('big');
  assert.ok(prompt.endsWith('[...skill truncated at 8 KB]'), 'truncation marker missing');
  assert.ok(Buffer.byteLength(prompt, 'utf8') < OVER_LIMIT_BYTES, 'prompt was not shortened');
});

if (failures) {
  console.error(`\n${failures} test(s) failed`);
  process.exit(1);
}
console.log('\nAll skills.js tests passed.');
