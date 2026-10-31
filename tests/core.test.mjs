import {test} from 'node:test';
import assert from 'node:assert/strict';
import {gridFor, cropRect, cropHit, dragCrop, drawFit, videoFrameCount, validUUID, scriptFor} from '../core.mjs';
test('16 images carrées donnent une grille 4 × 4', () => assert.deepEqual(gridFor(16), {cols: 4, rows: 4}));
test('les grilles automatiques contiennent toutes les images et divisent les textures', () => {
  for (let n = 1; n <= 256; n++) for (const aspect of [.5, 1, 2]) {
    const {cols, rows} = gridFor(n, aspect);
    assert.ok(cols * rows >= n); assert.equal(1024 % cols, 0); assert.equal(2048 % rows, 0);
  }
});
test('grille manuelle et dépassement', () => {assert.deepEqual(gridFor(17, 1, '4'), {cols: 4, rows: 8}); assert.throws(() => gridFor(256, 1, '1'));});
test('la vidéo entière est échantillonnée aux FPS choisis', () => {
  assert.equal(videoFrameCount(12, 10), 120); assert.equal(videoFrameCount(3.25, 10), 33); assert.equal(videoFrameCount(120, .5), 60);
});
test('la limite recommande les FPS sans tronquer la durée', () => {
  assert.throws(() => videoFrameCount(30, 10), /8,53 FPS/); assert.equal(videoFrameCount(30, 8.53), 256);
  for (const fps of [NaN, Infinity, 0, 61]) assert.throws(() => videoFrameCount(30, fps));
});
test('le crop normalisé conserve la même zone quelle que soit la taille', () => {
  const c = {x: .25, y: .1, width: .5, height: .6};
  assert.deepEqual(cropRect({width: 1000, height: 500}, c), {x: 250, y: 50, width: 500, height: 300});
  assert.deepEqual(cropRect({width: 500, height: 250}, c), {x: 125, y: 25, width: 250, height: 150});
});
test('le crop reste dans les limites, même avec une saisie invalide', () => {
  const r = cropRect({width: 100, height: 100}, {x: 2, y: -1, width: 2, height: -1});
  assert.equal(r.x, 99); assert.equal(r.y, 0); assert.ok(r.width > 0 && r.x + r.width <= 100); assert.ok(r.height > 0 && r.y + r.height <= 100);
});
test('intérieur, extérieur, quatre bords et quatre coins', () => {
  const c = {x: .2, y: .2, width: .6, height: .6};
  for (const [x, y, mode] of [[.5,.5,'move'],[0,0,'draw'],[.2,.5,'w'],[.8,.5,'e'],[.5,.2,'n'],[.5,.8,'s'],[.2,.2,'nw'],[.8,.2,'ne'],[.2,.8,'sw'],[.8,.8,'se']]) assert.equal(cropHit(c, {x, y}), mode);
  assert.equal(cropHit(null, {x: .5, y: .5}), 'draw');
});
test('déplacement bloqué aux limites et dimensions conservées', () => {
  const c = {x: .2, y: .2, width: .5, height: .4};
  assert.deepEqual(dragCrop(c, {x: .3, y: .3}, {x: 1, y: 1}, 'move'), {x: .5, y: .6, width: .5, height: .4});
  assert.deepEqual(dragCrop(c, {x: .3, y: .3}, {x: 0, y: 0}, 'move'), {x: 0, y: 0, width: .5, height: .4});
  assert.equal(c.x, .2);
});
test('chaque bord et coin conserve le bord opposé et une taille positive', () => {
  const c = {x: .2, y: .2, width: .5, height: .4};
  for (const mode of ['n','s','e','w','nw','ne','sw','se']) {
    const r = dragCrop(c, {x: .5, y: .5}, {x: .6, y: .6}, mode);
    if (!mode.includes('w')) assert.equal(r.x, c.x);
    if (!mode.includes('n')) assert.equal(r.y, c.y);
    if (!mode.includes('e')) assert.ok(Math.abs(r.x + r.width - .7) < 1e-10);
    if (!mode.includes('s')) assert.ok(Math.abs(r.y + r.height - .6) < 1e-10);
    for (const p of [{x: -10, y: -10}, {x: 10, y: 10}]) {
      const b = dragCrop(c, {x: .5, y: .5}, p, mode);
      assert.ok(b.x >= 0 && b.y >= 0 && b.x + b.width <= 1 + 1e-10 && b.y + b.height <= 1 + 1e-10);
      assert.ok(b.width >= .01 - 1e-10 && b.height >= .01 - 1e-10);
    }
  }
});
test('dessiner le cadre dans les deux sens donne la même zone', () => {
  assert.deepEqual(dragCrop(null, {x: .2, y: .2}, {x: .8, y: .8}, 'draw'), dragCrop(null, {x: .8, y: .8}, {x: .2, y: .2}, 'draw'));
});
test('le mode SL remplit la case sans marges et sans couper le crop', () => {
  let args; const ctx = {drawImage(...a) {args = a;}}, image = {width: 640, height: 480};
  drawFit(ctx, image, 512, 1024, 512, 512, 'stretch'); assert.deepEqual(args, [image, 0, 0, 640, 480, 512, 1024, 512, 512]);
  drawFit(ctx, image, 0, 0, 256, 256, 'stretch', {x: .25, y: .25, width: .5, height: .5}); assert.deepEqual(args, [image, 160, 120, 320, 240, 0, 0, 256, 256]);
});
test('le mode image entière conserve les proportions', () => {
  let args; const ctx = {save(){}, beginPath(){}, rect(){}, clip(){}, restore(){}, drawImage(...a){args = a;}}, image = {width: 1000, height: 500};
  drawFit(ctx, image, 0, 0, 200, 200, 'contain'); assert.deepEqual(args, [image, 0, 0, 1000, 500, 0, 50, 200, 100]);
});
test('le script contient les deux fonctions et les bons paramètres', () => {
  const base = {uuid: '63df675a-85fb-36df-079f-779dd8331c42', count: 16, cols: 4, rows: 4, fps: 5, direction: 'forward'};
  const code = scriptFor({titre: base, demo: {...base, fps: 4, direction: 'pingpong'}}, 2, 2);
  assert.match(code, /ftitre\(\)/); assert.match(code, /fdemo\(\)/); assert.match(code, /2, 4, 4, 0, 16, 5\.00/); assert.match(code, /PING_PONG/); assert.match(code, /touch_start/);
});
test('les UUID invalides sont exclus ; une animation seule démarre correctement', () => {
  assert.equal(validUUID('invalide'), false); assert.match(scriptFor({titre: {uuid: 'bad', count: 1}}, 2, 2), /^\/\//);
  const base = {uuid: '8bb4886f-873c-935f-9bbe-4f60408f2dd3', count: 3, cols: 2, rows: 2, fps: 4};
  const full = scriptFor({demo: base}, -4, -1); assert.match(full, /state_entry\(\)/); assert.match(full, /fdemo\(\)/); assert.doesNotMatch(full, /ftitre/);
  assert.doesNotMatch(scriptFor({demo: base}, 2, 2, false), /default/);
});
