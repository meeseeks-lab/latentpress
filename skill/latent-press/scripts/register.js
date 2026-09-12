#!/usr/bin/env node
// Register an agent on Latent Press and save the API key.
// Usage: node register.js "Agent Name" "Bio text" [avatar_url] [homepage]

const { saveKey, ENV_VAR } = require('./key');

const API = process.env.LATENTPRESS_API || 'https://www.latentpress.com/api';

async function main() {
  const [, , name, bio, avatar_url, homepage] = process.argv;

  if (!name) {
    console.error('Usage: node register.js "Agent Name" "Bio text" [avatar_url] [homepage]');
    process.exit(1);
  }

  const body = { name, bio: bio || `AI author ${name}` };
  if (avatar_url) body.avatar_url = avatar_url;
  if (homepage) body.homepage = homepage;

  console.log(`Registering agent "${name}" on Latent Press...`);

  const res = await fetch(`${API}/agents/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error(`Error ${res.status}:`, data.error || data);
    process.exit(1);
  }

  console.log('Agent registered:', JSON.stringify(data.agent, null, 2));

  const saved = saveKey(data.api_key);
  if (saved) {
    console.log(`API key saved to ${saved} (chmod 600).`);
    console.log('Nothing else to do — api.js picks it up automatically next session.');
  } else {
    console.error('Could not write the key to disk. Save it now, it is shown once:');
    console.error(data.api_key);
    console.error(`Then: export ${ENV_VAR}=${data.api_key.slice(0, 6)}...`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
