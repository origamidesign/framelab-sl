export function videoFrameCount(duration,fps) {
  if(!Number.isFinite(duration)||duration<=0)throw new Error('Durée vidéo invalide.');
  if(!Number.isFinite(fps)||fps<.01||fps>60)throw new Error('Choisissez des FPS entre 0,01 et 60.');
  const count=Math.ceil(duration*fps);
  if(count>256){
    const recommended=Math.floor(256/duration*100)/100;
    throw new Error(`${count} images pour la vidéo entière. Limite : 256 images. ${recommended>=.01?`Choisissez au maximum ${recommended.toLocaleString('fr-FR')} FPS.`:'Cette vidéo est trop longue pour cette limite.'}`);
  }
  return count;
}
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
export function cropHit(crop,point,tolerance={x:.02,y:.02}) {
  if(!crop)return 'draw';
  const right=crop.x+crop.width,bottom=crop.y+crop.height;
  const nearX=point.x>=crop.x-tolerance.x&&point.x<=right+tolerance.x;
  const nearY=point.y>=crop.y-tolerance.y&&point.y<=bottom+tolerance.y;
  if(!nearX||!nearY)return 'draw';
  const horizontal=Math.abs(point.x-crop.x)<=tolerance.x?'w':Math.abs(point.x-right)<=tolerance.x?'e':'';
  const vertical=Math.abs(point.y-crop.y)<=tolerance.y?'n':Math.abs(point.y-bottom)<=tolerance.y?'s':'';
  if(horizontal||vertical)return vertical+horizontal;
  return point.x>=crop.x&&point.x<=right&&point.y>=crop.y&&point.y<=bottom?'move':'draw';
}
export function dragCrop(crop,start,point,mode) {
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  const dx=point.x-start.x,dy=point.y-start.y;
  if(mode==='draw'){
    const x=clamp(Math.min(start.x,point.x),0,.99),y=clamp(Math.min(start.y,point.y),0,.99);
    return {x,y,width:clamp(Math.abs(dx),.01,1-x),height:clamp(Math.abs(dy),.01,1-y)};
  }
  if(mode==='move')return {...crop,x:clamp(crop.x+dx,0,1-crop.width),y:clamp(crop.y+dy,0,1-crop.height)};
  let left=crop.x,top=crop.y,right=left+crop.width,bottom=top+crop.height;
  if(mode.includes('w'))left=clamp(left+dx,0,right-.01);
  if(mode.includes('e'))right=clamp(right+dx,left+.01,1);
  if(mode.includes('n'))top=clamp(top+dy,0,bottom-.01);
  if(mode.includes('s'))bottom=clamp(bottom+dy,top+.01,1);
  return {x:left,y:top,width:right-left,height:bottom-top};
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
  if(fit==='stretch'){
    ctx.drawImage(image,source.x,source.y,iw,ih,x,y,w,h);
    return;
  }
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
