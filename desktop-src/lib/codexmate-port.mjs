// A Codexmate port is digits only. The port is spliced into "http://127.0.0.1:" + port and into a
// copyable "CODEXMATE_PORT=... codexmate run" command, so anything else is dangerous: "80@evil.example"
// makes evil.example the real host of the URL (127.0.0.1:80 becomes the user info), and a value with a
// space or ";" changes the copied command.

export const DEFAULT_CODEXMATE_PORT = '8080';

// Returns the port as a canonical string ("8080"), or null when it is not a whole number from 1 to 65535.
export function parseCodexmatePort(value) {
  const text = String(value == null ? '' : value).trim();
  if (!/^\d{1,5}$/.test(text)) return null;
  const number = Number(text);
  return number >= 1 && number <= 65535 ? String(number) : null;
}

// For a value read back from storage: an invalid or missing one falls back to the default.
export function readCodexmatePort(raw) {
  return parseCodexmatePort(raw) || DEFAULT_CODEXMATE_PORT;
}
