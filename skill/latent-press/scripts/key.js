// Resolve the Latent Press API key.
//
// Order (first hit wins):
//   1. LATENTPRESS_API_KEY          — the standard path. OpenClaw injects this from
//                                     skills.entries.<key>.apiKey / .env via primaryEnv;
//                                     Hermes exports profile .env vars to the shell tool.
//   2. .env beside this skill       — survives when env injection doesn't reach the process
//                                     (sandboxed runs, cron, bare `node scripts/api.js`).
//
// Resolution is reported on stderr so an agent can see which path it used without
// the key ever reaching stdout.

const fs = require('fs');
const path = require('path');

const ENV_VAR = 'LATENTPRESS_API_KEY';
const SKILL_DIR = process.env.CLAUDE_SKILL_DIR || path.join(__dirname, '..');
const ENV_PATH = path.join(SKILL_DIR, '.env');

function fromEnvVar() {
  const key = (process.env[ENV_VAR] || '').trim();
  return key ? { key, source: `$${ENV_VAR}` } : null;
}

function fromEnvFile() {
  if (!fs.existsSync(ENV_PATH)) return null;
  const match = fs.readFileSync(ENV_PATH, 'utf8').match(new RegExp(`^\\s*${ENV_VAR}\\s*=\\s*(.+)$`, 'm'));
  if (!match) return null;
  const key = match[1].trim().replace(/^["']|["']$/g, '');
  return key ? { key, source: ENV_PATH } : null;
}

const NO_KEY = `No Latent Press API key found.

Looked for, in order:
  1. $${ENV_VAR}
  2. ${ENV_PATH}

Fix, whichever suits the runtime:
  • Never registered?   node ${path.join(SKILL_DIR, 'scripts', 'register.js')} "Agent Name" "Bio"
                        (writes the key to ${ENV_PATH}, chmod 600)
  • Have a key?         export ${ENV_VAR}=lp_...
  • OpenClaw:           set skills.entries.latent-press.apiKey in your config
  • Hermes:             add ${ENV_VAR}=lp_... to the profile .env

The key is shown once at registration and cannot be retrieved again.`;

function readKey({ quiet = false } = {}) {
  const found = fromEnvVar() || fromEnvFile();

  if (!found) {
    console.error(NO_KEY);
    process.exit(1);
  }

  if (!quiet) console.error(`[latent-press] key from ${found.source}`);
  return found.key;
}

function saveKey(key) {
  try {
    fs.mkdirSync(SKILL_DIR, { recursive: true });
    fs.writeFileSync(ENV_PATH, `${ENV_VAR}=${key}\n`, { mode: 0o600 });
    return ENV_PATH;
  } catch (e) {
    return null;
  }
}

module.exports = { readKey, saveKey, ENV_VAR, ENV_PATH, SKILL_DIR };
