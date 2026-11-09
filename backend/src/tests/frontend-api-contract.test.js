import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Frontend dan backend pernah memakai method/path berbeda (404 senyap di UI).
// Test ini memastikan setiap panggilan api.* di frontend punya route backend yang cocok.
const FRONTEND_SRC = fileURLToPath(new URL('../../../frontend/src/', import.meta.url));
const APP_FILE = fileURLToPath(new URL('../app.js', import.meta.url));

// Nama parameter path (`:id`) dan segmen dinamis (`${x}` / angka) disamakan agar bisa dibandingkan.
function normalize(url) {
  return url
    .replace(/\?.*$/, '')
    .replace(/\$\{[^}]+\}/g, ':param')
    .replace(/\/\d+(?=\/|$)/g, '/:param')
    .replace(/:[A-Za-z_]\w*/g, ':param')
    .replace(/\/$/, '');
}

async function collectBackendRoutes() {
  const appSource = fs.readFileSync(APP_FILE, 'utf8');
  const routeModules = new Map();
  for (const match of appSource.matchAll(
    /import\s+(\w+)\s+from\s+['"](\.\/modules\/[^'"]+)['"]/g
  )) {
    routeModules.set(match[1], match[2]);
  }

  const mounts = new Map();
  for (const match of appSource.matchAll(/app\.use\(\s*['"]([^'"]+)['"]\s*,\s*(\w+)/g)) {
    if (routeModules.has(match[2])) mounts.set(match[2], match[1]);
  }

  const routes = new Set();
  for (const [variable, mountPath] of mounts) {
    const modulePath = path.resolve(path.dirname(APP_FILE), routeModules.get(variable));
    const { default: router } = await import(modulePath);
    for (const layer of router.stack || []) {
      if (!layer.route) continue;
      const rawPaths = Array.isArray(layer.route.path) ? layer.route.path : [layer.route.path];
      for (const rawPath of rawPaths) {
        const routePath = rawPath === '/' ? '' : rawPath;
        for (const method of Object.keys(layer.route.methods)) {
          routes.add(`${method.toUpperCase()} ${normalize(mountPath + routePath)}`);
        }
      }
    }
  }
  return routes;
}

function collectFrontendCalls(dir = FRONTEND_SRC) {
  const calls = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      calls.push(...collectFrontendCalls(fullPath));
      continue;
    }
    if (!/\.(js|jsx)$/.test(entry.name) || /\.test\./.test(entry.name)) continue;
    const source = fs.readFileSync(fullPath, 'utf8');
    for (const match of source.matchAll(/api\.(get|post|put|patch|delete)\(\s*[`'"]([^`'"]+)/g)) {
      calls.push({
        key: `${match[1].toUpperCase()} ${normalize(`/api/v1${match[2]}`)}`,
        file: path.relative(FRONTEND_SRC, fullPath)
      });
    }
  }
  return calls;
}

describe('Kontrak API frontend dan backend', () => {
  it('setiap panggilan api.* di frontend memiliki route backend yang cocok', async () => {
    const backendRoutes = await collectBackendRoutes();
    const missing = collectFrontendCalls().filter((call) => !backendRoutes.has(call.key));

    expect(backendRoutes.size).toBeGreaterThan(50);
    expect(
      missing.map((call) => `${call.key} (${call.file})`),
      'Panggilan frontend tanpa route backend akan gagal 404 di UI'
    ).toEqual([]);
  });
});
