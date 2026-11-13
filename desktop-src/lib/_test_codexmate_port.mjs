import assert from 'node:assert';
import { DEFAULT_CODEXMATE_PORT, parseCodexmatePort, readCodexmatePort } from './codexmate-port.mjs';

// Valid ports, including the edges of the range and surrounding spaces.
assert.strictEqual(parseCodexmatePort('8080'), '8080');
assert.strictEqual(parseCodexmatePort(' 3000 '), '3000');
assert.strictEqual(parseCodexmatePort('1'), '1');
assert.strictEqual(parseCodexmatePort('65535'), '65535');
assert.strictEqual(parseCodexmatePort('0080'), '80');
assert.strictEqual(parseCodexmatePort(8080), '8080');

// Out of range.
assert.strictEqual(parseCodexmatePort('0'), null);
assert.strictEqual(parseCodexmatePort('65536'), null);
assert.strictEqual(parseCodexmatePort('999999'), null);

// Empty and missing input.
assert.strictEqual(parseCodexmatePort(''), null);
assert.strictEqual(parseCodexmatePort('   '), null);
assert.strictEqual(parseCodexmatePort(null), null);
assert.strictEqual(parseCodexmatePort(undefined), null);

// The inputs that matter: they change the host of the URL or the copied shell command.
assert.strictEqual(parseCodexmatePort('80@evil.example'), null);
assert.strictEqual(parseCodexmatePort('80/../x'), null);
assert.strictEqual(parseCodexmatePort('80:90'), null);
assert.strictEqual(parseCodexmatePort('80; rm -rf /'), null);
assert.strictEqual(parseCodexmatePort('80 && id'), null);
assert.strictEqual(parseCodexmatePort('8080\n'), '8080');
assert.strictEqual(parseCodexmatePort('80\n80'), null);
assert.strictEqual(parseCodexmatePort('-1'), null);
assert.strictEqual(parseCodexmatePort('8.5'), null);
assert.strictEqual(parseCodexmatePort('0x50'), null);
assert.strictEqual(parseCodexmatePort('٨٠'), null);
assert.strictEqual(parseCodexmatePort('A'.repeat(65536)), null);

// Reading back from storage: a tampered value falls back to the default, a good one is kept.
assert.strictEqual(readCodexmatePort('80@evil.example'), DEFAULT_CODEXMATE_PORT);
assert.strictEqual(readCodexmatePort(null), DEFAULT_CODEXMATE_PORT);
assert.strictEqual(readCodexmatePort('3000'), '3000');

console.log('codexmate-port tests passed: 28');
