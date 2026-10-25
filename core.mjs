export function gridFor(count, aspect = 1, requested = 'auto') {
  if (!count) return {cols:1,rows:1};
  const powers=[1,2,4,8,16,32,64,128];
  let best=null;
  for(const cols of requested==='auto'?powers:[Number(requested)]) {
    const rows=powers.find(r=>r*cols>=count); if(!rows) continue;
    const distortion=Math.abs(Math.log((rows/cols)/aspect));
    const score=distortion+0.35*Math.log(cols*rows/count);
    if(!best||score<best.score) best={cols,rows,score};
  }
  if(!best) throw new Error('Cette grille ne peut pas contenir toutes les images. Augmentez le nombre de colonnes.');
  return {cols:best.cols,rows:best.rows};
}
export function cropRect(image,crop) {
  const width=image.width,height=image.height;
  if(!crop) return {x:0,y:0,width,height};
  const x=Math.max(0,Math.min(.99,Number(crop.x)||0));
  const y=Math.max(0,Math.min(.99,Number(crop.y)||0));
  return {x:x*width,y:y*height,width:Math.max(.01,Math.min(1-x,Number(crop.width)||1))*width,height:Math.max(.01,Math.min(1-y,Number(crop.height)||1))*height};
}
export function drawFit(ctx,image,x,y,w,h,fit='contain',crop=null) {
  const source=cropRect(image,crop),iw=source.width,ih=source.height;
  const scale=fit==='cover'?Math.max(w/iw,h/ih):Math.min(w/iw,h/ih);
  ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();
  ctx.drawImage(image,source.x,source.y,iw,ih,x+(w-iw*scale)/2,y+(h-ih*scale)/2,iw*scale,ih*scale);ctx.restore();
}
export const validUUID=value=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
export function scriptFor(slots,link,face,full=true) {
  const ready=Object.entries(slots).filter(([,s])=>s.count&&validUUID(s.uuid));
  const functions=ready.map(([name,s])=>`f${name}()\n{\n    llSetLinkTexture(${link}, "${s.uuid}", ${face});\n    llSetLinkTextureAnim(${link}, ANIM_ON | LOOP${s.direction==='reverse'?' | REVERSE':s.direction==='pingpong'?' | PING_PONG':''}, ${face}, ${s.cols}, ${s.rows}, 0, ${s.count}, ${s.fps.toFixed(1)});\n}`).join('\n\n');
  if(!ready.length) return '// Créez une animation et renseignez son UUID pour générer le script.';
  if(!full)return functions;
  return `// FrameLab — Texture animée pour Second Life\n${ready.length>1?'integer demoActive = FALSE;\n\n':''}${functions}\n\ndefault\n{\n    state_entry()\n    {\n        f${ready[0][0]}();\n    }${ready.length>1?'\n\n    touch_start(integer total_number)\n    {\n        demoActive = !demoActive;\n        if (demoActive) fdemo();\n        else ftitre();\n    }':''}\n}\n`;
}
