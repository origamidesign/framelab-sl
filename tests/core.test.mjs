import {test} from 'node:test';
import assert from 'node:assert/strict';
import {gridFor,scriptFor,validUUID,cropRect,cropHit,dragCrop,drawFit,videoFrameCount} from '../core.mjs';
test('le crop distingue intérieur, extérieur, les quatre bords et les quatre coins',()=>{
 const crop={x:.2,y:.2,width:.6,height:.6};
 for(const [x,y,mode] of [[.5,.5,'move'],[0,0,'draw'],[.2,.5,'w'],[.8,.5,'e'],[.5,.2,'n'],[.5,.8,'s'],[.2,.2,'nw'],[.8,.2,'ne'],[.2,.8,'sw'],[.8,.8,'se']])assert.equal(cropHit(crop,{x,y}),mode);
 assert.equal(cropHit(null,{x:.5,y:.5}),'draw');
});
test('déplacer le crop conserve sa taille et bloque aux limites',()=>{
 const crop={x:.2,y:.2,width:.5,height:.4};
 assert.deepEqual(dragCrop(crop,{x:.3,y:.3},{x:1,y:1},'move'),{x:.5,y:.6,width:.5,height:.4});
 assert.deepEqual(dragCrop(crop,{x:.3,y:.3},{x:0,y:0},'move'),{x:0,y:0,width:.5,height:.4});
 assert.equal(crop.x,.2);
});
test('redimensionner chaque bord ou coin garde le bord opposé et une taille positive',()=>{
 const crop={x:.2,y:.2,width:.5,height:.4};
 for(const mode of ['n','s','e','w','nw','ne','sw','se']){
  const r=dragCrop(crop,{x:.5,y:.5},{x:.6,y:.6},mode);
  if(!mode.includes('w'))assert.equal(r.x,crop.x);
  if(!mode.includes('n'))assert.equal(r.y,crop.y);
  if(!mode.includes('e'))assert.ok(Math.abs(r.x+r.width-.7)<1e-10);
  if(!mode.includes('s'))assert.ok(Math.abs(r.y+r.height-.6)<1e-10);
  for(const point of [{x:-10,y:-10},{x:10,y:10}]){
   const b=dragCrop(crop,{x:.5,y:.5},point,mode);
   assert.ok(b.x>=0&&b.y>=0&&b.x+b.width<=1+1e-10&&b.y+b.height<=1+1e-10);
   assert.ok(b.width>=.01-1e-10&&b.height>=.01-1e-10);
  }
 }
});
test('un nouveau cadre peut être dessiné dans les deux sens',()=>{
 const a=dragCrop(null,{x:.2,y:.2},{x:.8,y:.8},'draw');
 assert.deepEqual(dragCrop(null,{x:.8,y:.8},{x:.2,y:.2},'draw'),a);
});
test('la vidéo entière est échantillonnée aux FPS choisis',()=>{
 assert.equal(videoFrameCount(12,10),120);
 assert.equal(videoFrameCount(3.25,10),33);
 assert.equal(videoFrameCount(120,.5),60);
});
test('un dépassement demande de réduire les FPS sans tronquer la vidéo',()=>{
 assert.throws(()=>videoFrameCount(30,10),/8,53 FPS/);
 assert.equal(videoFrameCount(30,8.53),256);
 for(const fps of [NaN,Infinity,0,61])assert.throws(()=>videoFrameCount(30,fps));
});
test('le crop normalisé conserve la même zone sur des images de tailles différentes',()=>{
 const crop={x:.25,y:.1,width:.5,height:.6};
 assert.deepEqual(cropRect({width:1000,height:500},crop),{x:250,y:50,width:500,height:300});
 assert.deepEqual(cropRect({width:500,height:250},crop),{x:125,y:25,width:250,height:150});
});
test('le crop reste dans les limites de l’image',()=>{
 const r=cropRect({width:100,height:100},{x:2,y:-1,width:2,height:-1});
 assert.equal(r.x,99);assert.equal(r.y,0);assert.ok(r.width>0&&r.x+r.width<=100);assert.ok(r.height>0&&r.y+r.height<=100);
});
test('le rendu prélève la zone rognée puis conserve ses proportions',()=>{
 let args;const ctx={save(){},beginPath(){},rect(){},clip(){},restore(){},drawImage(...a){args=a;}};
 const image={width:1000,height:500};drawFit(ctx,image,0,0,200,200,'contain',{x:.25,y:0,width:.5,height:1});
 assert.deepEqual(args,[image,250,0,500,500,0,0,200,200]);
 drawFit(ctx,image,0,0,200,200,'contain');
 assert.deepEqual(args,[image,0,0,1000,500,0,50,200,100]);
});
test('16 images carrées donnent une grille 4 × 4',()=>assert.deepEqual(gridFor(16),{cols:4,rows:4}));
test('toutes les grilles auto ont assez de cases et divisent 1024 et 2048',()=>{for(let n=1;n<=256;n++)for(const aspect of [.5,1,2]){const {cols,rows}=gridFor(n,aspect);assert.ok(cols*rows>=n);assert.equal(1024%cols,0);assert.equal(2048%rows,0);}});
test('colonnes manuelles et dépassement',()=>{assert.deepEqual(gridFor(17,1,'4'),{cols:4,rows:8});assert.throws(()=>gridFor(256,1,'1'));});
test('le script contient les paramètres des deux animations',()=>{const uuid='63df675a-85fb-36df-079f-779dd8331c42';const base={uuid,count:16,cols:4,rows:4,fps:5,direction:'forward'};const code=scriptFor({titre:base,demo:{...base,fps:4,direction:'pingpong'}},2,2);assert.match(code,/ftitre\(\)/);assert.match(code,/fdemo\(\)/);assert.match(code,/2, 4, 4, 0, 16, 5\.0/);assert.match(code,/PING_PONG/);assert.match(code,/touch_start/);});
test('UUID invalide exclu et fonction seule sans état default',()=>{assert.equal(validUUID('invalide'),false);assert.match(scriptFor({titre:{uuid:'bad',count:1}},2,2),/^\/\//);const code=scriptFor({demo:{uuid:'8bb4886f-873c-935f-9bbe-4f60408f2dd3',count:3,cols:2,rows:2,fps:4}},2,2,false);assert.match(code,/fdemo/);assert.doesNotMatch(code,/default/);});
