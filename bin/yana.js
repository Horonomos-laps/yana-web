#!/usr/bin/env node
'use strict';
// Open browser automatically after server starts
const { execSync } = require('child_process');
const http = require('http');

// Forward to server.js — it exports the http.Server instance
const server = require('../server.js');

// Wait for server to be listening, then open browser
server.on('listening', () => {
  const { port } = server.address();
  const url = `http://localhost:${port}`;
  try {
    const cmd = process.platform === 'darwin' ? `open ${url}`
              : process.platform === 'win32'  ? `start ${url}`
              : `xdg-open ${url}`;
    execSync(cmd, { stdio: 'ignore' });
  } catch (_) {}
});
