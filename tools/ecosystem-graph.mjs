import fs from 'node:fs';
import path from 'node:path';

const workspace = path.resolve(process.argv[2] ?? process.env.LUNAFLOW_REPO_ROOT ?? path.join(process.cwd(), '..'));
const output = path.resolve(process.argv[3] ?? path.join(workspace, 'ecosystem-dependencies.dot'));
const manifestPath = process.env.LUNAFLOW_REPO_MANIFEST ?? path.join(workspace, 'repositories.json');
const syncPath = process.env.LUNAFLOW_PROJECT_SYNC ?? path.join(workspace, 'project-sync.json');

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const sync = JSON.parse(fs.readFileSync(syncPath, 'utf8'));
const layers = sync.layer?.repos ?? {};
const layerOrder = ['Base', 'L0', 'L1', 'L2', 'L3', 'Independent', 'Infra'];
const repos = new Map();

function parseVersion(text) {
  return text.match(/^\s*version\s*=\s*["']([^"']+)["']/m)?.[1] ?? 'unreleased';
}
function versionParts(version) {
  const match = version.match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
  return match ? match.slice(1).map(Number) : [];
}
function compareVersions(left, right) {
  const a = versionParts(left); const b = versionParts(right);
  for (let i = 0; i < 3; i += 1) if ((a[i] ?? 0) !== (b[i] ?? 0)) return (a[i] ?? 0) - (b[i] ?? 0);
  return 0;
}
function dotEscape(value) {
  return String(value)
    .replaceAll('\\', '\\\\')
    .replaceAll('"', '\\"')
    .replaceAll('\n', '\\n');
}
function quote(value) { return `"${dotEscape(value)}"`; }

for (const name of manifest.repositories) {
  if (!fs.existsSync(path.join(workspace, name))) throw new Error(`Missing repository checkout: ${name}`);
  const file = path.join(workspace, name, 'moon.mod');
  if (!fs.existsSync(file)) {
    console.warn(`warning: ${name}: no moon.mod; omitted from ecosystem graph`);
    continue;
  }
  const text = fs.readFileSync(file, 'utf8');
  if (parseVersion(text) === 'unreleased') console.warn(`warning: ${name}: no version; labelled unreleased`);
  const deps = [...text.matchAll(/["'](Luna-Flow\/[^@"']+)@([^"']+)["']/g)]
    .map(([, dependency, version]) => ({ name: dependency.slice('Luna-Flow/'.length), version }));
  repos.set(name, { name, version: parseVersion(text), layer: layers[name] ?? 'Independent', deps });
}

const lines = ['digraph ecosystem {', '  graph [bgcolor="transparent", fontname="sans-serif", ranksep=1.0, nodesep=0.35];', '  node [shape=box, style="rounded", fontname="sans-serif", color="black"];', '  edge [fontname="sans-serif", color="black"];'];
for (const layer of layerOrder) {
  const members = [...repos.values()].filter((repo) => repo.layer === layer);
  if (!members.length) continue;
  const cluster = `cluster_${layer.replace(/[^A-Za-z0-9]/g, '_')}`;
  lines.push(`  subgraph ${cluster} {`, `    label=${quote(layer)};`, '    rank=same;');
  for (const repo of members) lines.push(`    ${JSON.stringify(repo.name)} [label="${dotEscape(repo.name)}\\n${dotEscape(repo.version)}"];`);
  lines.push('  }');
}
for (const repo of repos.values()) for (const dep of repo.deps) {
  const target = repos.get(dep.name); if (!target) continue;
  const behind = target.version !== 'unreleased' && compareVersions(dep.version, target.version) < 0;
  const attrs = behind ? `, color="#dc5050", fontcolor="#dc5050", style="dashed", label=${quote(`${dep.version} (main ${target.version})`)}` : `, label=${quote(dep.version)}`;
  lines.push(`  ${JSON.stringify(repo.name)} -> ${JSON.stringify(target.name)} [${attrs.slice(2)}];`);
}
lines.push('}');
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${lines.join('\n')}\n`);
console.log(`Wrote ${repos.size} repositories and ${lines.filter((line) => line.includes(' -> ')).length} dependency edges to ${output}`);
