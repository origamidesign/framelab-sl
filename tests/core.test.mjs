import {test} from 'node:test';
import assert from 'node:assert/strict';
import {gridFor,scriptFor,validUUID} from '../core.mjs';
test('16 images carrées donnent une grille 4 × 4',()=>assert.deepEqual(gridFor(16),{cols:4,rows:4}));
test('toutes les grilles auto ont assez de cases et divisent 1024 et 2048',()=>{for(let n=1;n<=256;n++)for(const aspect of [.5,1,2]){const {cols,rows}=gridFor(n,aspect);assert.ok(cols*rows>=n);assert.equal(1024%cols,0);assert.equal(2048%rows,0);}});
test('colonnes manuelles et dépassement',()=>{assert.deepEqual(gridFor(17,1,'4'),{cols:4,rows:8});assert.throws(()=>gridFor(256,1,'1'));});
test('le script contient les paramètres des deux animations',()=>{const uuid='63df675a-85fb-36df-079f-779dd8331c42';const base={uuid,count:16,cols:4,rows:4,fps:5,direction:'forward'};const code=scriptFor({titre:base,demo:{...base,fps:4,direction:'pingpong'}},2,2);assert.match(code,/ftitre\(\)/);assert.match(code,/fdemo\(\)/);assert.match(code,/2, 4, 4, 0, 16, 5\.0/);assert.match(code,/PING_PONG/);assert.match(code,/touch_start/);});
test('UUID invalide exclu et fonction seule sans état default',()=>{assert.equal(validUUID('invalide'),false);assert.match(scriptFor({titre:{uuid:'bad',count:1}},2,2),/^\/\//);const code=scriptFor({demo:{uuid:'8bb4886f-873c-935f-9bbe-4f60408f2dd3',count:3,cols:2,rows:2,fps:4}},2,2,false);assert.match(code,/fdemo/);assert.doesNotMatch(code,/default/);});
