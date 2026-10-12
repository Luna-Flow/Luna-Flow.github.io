import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const generator = fileURLToPath(new URL('../../ecosystem-graph.mjs', import.meta.url));
const fixture = fileURLToPath(new URL('./fixtures/ecosystem/', import.meta.url));
function run(t, change = () => {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ecosystem-test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.cpSync(fixture, root, { recursive: true });
  change(root);
  const output = path.join(root, 'graph.dot');
  const result = spawnSync(process.execPath, [generator, root, output], {
    encoding: 'utf8', env: { ...process.env, LUNAFLOW_REPO_MANIFEST: path.join(root, 'repositories.json'), LUNAFLOW_PROJECT_SYNC: path.join(root, 'project-sync.json') },
  });
  return { ...result, dot: fs.existsSync(output) ? fs.readFileSync(output, 'utf8') : '' };
}
test('ecosystem DOT separates name/version with a DOT newline and labels behind edges', (t) => {
  const result = run(t);
  assert.equal(result.status, 0, result.stderr);
  assert.ok(result.dot.includes('"base" [label="base\\n0.5.0"]'));
  assert.ok(!result.dot.includes('base\\\\n'));
  assert.match(result.dot, /cluster_Base/);
  assert.match(result.dot, /style="dashed", label="0.4.0 \(main 0.5.0\)"/);
  assert.doesNotMatch(result.dot, /filled|fillcolor="white"/);
});
test('ecosystem fails on missing checkout', (t) => {
  const result = run(t, (root) => fs.rmSync(path.join(root, 'base'), { recursive: true }));
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Missing repository checkout: base/);
});
test('ecosystem warns about repositories without modules or versions', (t) => {
  const result = run(t, (root) => {
    fs.rmSync(path.join(root, 'base', 'moon.mod'));
    fs.writeFileSync(path.join(root, 'consumer', 'moon.mod'), 'name = "Luna-Flow/consumer"');
  });
  assert.equal(result.status, 0);
  assert.match(result.stderr, /base: no moon.mod/);
  assert.match(result.stderr, /consumer: no version/);
});

test('ecosystem escapes node names without escaping the label separator twice', (t) => {
  const name = 'base"quoted\\name';
  const result = run(t, (root) => {
    fs.renameSync(path.join(root, 'base'), path.join(root, name));
    fs.writeFileSync(path.join(root, 'repositories.json'), JSON.stringify({ repositories: [name] }));
  });
  assert.equal(result.status, 0, result.stderr);
  assert.ok(result.dot.includes('label="base\\"quoted\\\\name\\n0.5.0"'));
});
