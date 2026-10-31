import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const envModule = new URL('../config/env.js', import.meta.url).href;

function loadEnvironment(nodeEnv) {
  return spawnSync(
    process.execPath,
    ['--input-type=module', '-e', `import { env } from '${envModule}'; process.stdout.write(env.jwtSecret);`],
    {
      encoding: 'utf8',
      env: { ...process.env, NODE_ENV: nodeEnv, JWT_SECRET: '', VITEST: '' }
    }
  );
}

describe('Konfigurasi secret JWT', () => {
  it('menghasilkan secret acak ketika development lokal tidak mengatur JWT_SECRET', () => {
    const result = loadEnvironment('development');

    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/^[a-f0-9]{64}$/);
  });

  it('gagal start pada environment selain development dan test tanpa JWT_SECRET', () => {
    const result = loadEnvironment('staging');

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('JWT_SECRET wajib disetel');
  });
});
