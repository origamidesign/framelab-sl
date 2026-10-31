import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readdir, readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const root = new URL('../', import.meta.url);
test('aucun modèle 3D n’est présent dans les fichiers du projet', async () => {
  async function walk(dir) {
    for (const entry of await readdir(dir, {withFileTypes: true})) {
      if (entry.name === '.git' || entry.name === 'node_modules') continue;
      assert.doesNotMatch(entry.name, /\.(glb|gltf|fbx|blend|dae|obj|stl|3ds)$/i);
      if (entry.isDirectory()) await walk(new URL(entry.name + '/', dir));
    }
  }
  await walk(root);
});
test('le nouvel historique Git ne contient pas le modèle', () => {
  const objects = execFileSync('git', ['rev-list', '--objects', '--all'], {cwd: root, encoding: 'utf8'});
  assert.doesNotMatch(objects, /\.(glb|gltf|fbx|blend|dae|obj|stl|3ds)(?:\r?\n|$)/i);
});
test('la page n’inclut plus de module ou de panneau de prévisualisation 3D', async () => {
  const html = await readFile(new URL('index.html', root), 'utf8');
  const app = await readFile(new URL('app.js', root), 'utf8');
  assert.doesNotMatch(html + app, /arcade-viewer|arcade-host|three\.module|vendor\//);
});
