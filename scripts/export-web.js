const { spawnSync } = require('child_process');

const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const result = spawnSync(command, ['expo', 'export', '-p', 'web'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: {
    ...process.env,
    EXPO_BASE_URL: '/MigrosRotaApp',
  },
});

if (result.error) {
  console.error(result.error.message);
}

process.exit(result.status ?? 1);
