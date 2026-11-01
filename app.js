import {playbackSequence, gridFor, drawFit, cropRect, cropHit, dragCrop, videoFrameCount, validUUID, scriptFor} from './core.mjs?v=20261101-preview';
const $ = id => document.getElementById(id);
const makeSlot = () => ({frames: [], crop: null, fps: 5, size: 1024, columns: 'auto', fit: 'stretch', direction: 'forward', uuid: '', count: 0, cols: 1, rows: 1});
const slots = {titre: makeSlot(), demo: makeSlot()};
let exporting = false;
let active = 'titre', media = null, mediaURL = null, busy = false, playing = true, previewIndex = 0, lastTime = 0, cropDrag = null;
const current = () => slots[active];
const selected = () => current().frames.filter(f => f.selected);
const message = text => $('status').textContent = text;
const settings = ['fps', 'size', 'columns', 'fit', 'direction'];
function lock(value) {
  busy = value;
  for (const el of document.querySelectorAll('.tabs button,#file,#extract,#sample,.extraction input')) el.disabled = value;
  $('extract').disabled = value;
  $('export').disabled = value || exporting || !current().count;
  $('crop-reset').disabled = value || !current().frames.length;
}
function releaseFrames(slot) {
  for (const frame of slot.frames) {frame.bitmap.close?.(); URL.revokeObjectURL(frame.url);}
  slot.frames = [];
}
function aspect(bitmap, crop) {const r = cropRect(bitmap, crop); return r.width / r.height;}
function updateScript() {
  for (const name of ['titre', 'demo']) slots[name].uuid = $('uuid-' + name).value.trim();
  const link = Number($('link').value), face = Number($('face').value);
  const integers = $('link').value !== '' && $('face').value !== '' && Number.isInteger(link) && link >= -4 && link <= 256 && Number.isInteger(face) && face >= -1 && face <= 8;
  const invalid = Object.values(slots).some(s => s.uuid && !validUUID(s.uuid));
  $('script-status').textContent = !integers ? 'Prim ou face invalide.' : invalid ? 'Un UUID est invalide : utilisez le format xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.' : Object.values(slots).some(s => s.count && !validUUID(s.uuid)) ? 'Ajoutez les UUID des textures importées pour inclure leurs fonctions.' : '';
  $('code').textContent = integers ? scriptFor(slots, link, face, $('script-mode').value === 'full') : '// Corrigez la prim et la face.';
  const ready = integers && Object.values(slots).some(s => s.count && validUUID(s.uuid));
  $('copy').disabled = $('download-script').disabled = !ready;
}
function update() {
  const s = current(), list = selected(); s.count = list.length;
  $('count').textContent = `${list.length} / ${s.frames.length} sélectionnées`;
  $('badge-' + active).textContent = list.length ? `${list.length} images` : 'À créer';
  $('preview-empty').hidden = !!list.length;
  $('export').disabled = busy || exporting || !list.length;
  const canvas = $('atlas'); canvas.width = canvas.height = s.size;
  const ctx = canvas.getContext('2d');
  try {
    const {cols, rows} = gridFor(list.length, list[0] ? aspect(list[0].bitmap, s.crop) : 1, s.columns);
    s.cols = cols; s.rows = rows;
    const w = s.size / cols, h = s.size / rows;
    list.forEach((f, i) => drawFit(ctx, f.bitmap, i % cols * w, Math.floor(i / cols) * h, w, h, s.fit, s.crop));
    $('metrics').textContent = list.length ? `${cols} colonnes × ${rows} lignes · ${w} × ${h} px / image\n${list.length} images · ${(list.length / s.fps).toFixed(2)} s par passage` : 'Sélectionnez des images pour calculer la grille.';
  } catch (e) {s.count = 0; $('metrics').textContent = e.message; $('export').disabled = true;}
  updateExportCard(); renderCrop(); updateScript();
  try {drawPreview(previewIndex);} catch { /* A temporarily invalid grid is explained above. */ }
}
function renderFrames() {
  const container = $('frames'); container.replaceChildren();
  if (!current().frames.length) {container.innerHTML = '<div class="empty"><span>▧</span>Vos images apparaîtront ici.<small>Cliquez sur une image pour l’inclure ou l’exclure.</small></div>'; return;}
  current().frames.forEach((frame, i) => {
    const button = document.createElement('button'), image = document.createElement('img'), caption = document.createElement('span');
    image.src = frame.url; image.alt = `Image ${i + 1}`; image.loading = 'lazy'; button.dataset.frameIndex=String(i);
    button.title = `Image ${i + 1} — ${frame.time.toFixed(2)} s`;
    const paint = () => {button.className = 'frame' + (frame.selected ? ' selected' : ''); button.setAttribute('aria-pressed', String(frame.selected)); caption.textContent = `${String(i + 1).padStart(3, '0')}  ${frame.selected ? '✓' : '−'}`;};
    paint(); button.append(image, caption);
    button.onclick = () => {if (busy) return; frame.selected = !frame.selected; paint(); update(); if(frame.selected){const sequence=playbackSequence(selected().length,current().direction);previewIndex=Math.max(0,sequence.indexOf(selected().indexOf(frame)));setPlaying(false);drawPreview(previewIndex);}};
    container.append(button);
  });
}
function drawPreview(index) {
  const s=current(),list=selected(),sequence=playbackSequence(list.length,s.direction),ctx=$('preview').getContext('2d');ctx.clearRect(0,0,512,512);
  const seek=$('preview-seek');seek.max=Math.max(0,sequence.length-1);seek.disabled=!list.length;
  $('preview-prev').disabled=$('preview-next').disabled=!list.length;
  if(!list.length){previewIndex=0;seek.value=0;$('preview-frame-number').textContent='Aucune image';$('preview-sequence-position').textContent='0 / 0';clearFrameHighlight();return;}
  previewIndex=Math.max(0,Math.min(sequence.length-1,Math.floor(index)||0));
  const n=sequence[previewIndex],frame=list[n],sourceIndex=s.frames.indexOf(frame);
  seek.value=previewIndex;seek.setAttribute('aria-valuetext','Image '+(sourceIndex+1)+' · position '+(previewIndex+1)+' sur '+sequence.length);
  $('preview-frame-number').textContent='Vignette n° '+(sourceIndex+1);
  $('preview-sequence-position').textContent=(previewIndex+1)+' / '+sequence.length;
  highlightFrame(sourceIndex);
  const grid=gridFor(list.length,aspect(list[0].bitmap,s.crop),s.columns);
  const ratio=s.fit==='stretch'?aspect(list[0].bitmap,s.crop):grid.rows/grid.cols;
  let w=512,h=512/ratio;if(h>512){h=512;w=512*ratio;}
  drawFit(ctx,frame.bitmap,(512-w)/2,(512-h)/2,w,h,s.fit,s.crop);
}
let highlightedFrame=null;
function clearFrameHighlight(){highlightedFrame?.classList.remove('current-frame');highlightedFrame?.removeAttribute('aria-current');highlightedFrame=null;}
function highlightFrame(sourceIndex){const button=$('frames').querySelector('[data-frame-index="'+sourceIndex+'"]');if(button===highlightedFrame)return;clearFrameHighlight();if(button){button.classList.add('current-frame');button.setAttribute('aria-current','true');highlightedFrame=button;}}
function setPlaying(value){playing=value;lastTime=performance.now();$('play').textContent=playing?'Ⅱ Pause':'▶ Lecture';$('play').setAttribute('aria-pressed',String(playing));}
function seekPreview(position){setPlaying(false);drawPreview(position);}
$('preview-seek').addEventListener('input',()=>seekPreview(Number($('preview-seek').value)));
$('preview-prev').onclick=()=>seekPreview(Math.max(0,previewIndex-1));
$('preview-next').onclick=()=>seekPreview(Math.min(playbackSequence(selected().length,current().direction).length-1,previewIndex+1));
$('thumbnail-size').addEventListener('input',()=>{const size=Math.min(240,Math.max(82,Number($('thumbnail-size').value)||112));$('frames').style.setProperty('--thumbnail-size',size+'px');$('thumbnail-size-value').textContent=size+' px';});
function animate(time) {
  if (playing && time - lastTime >= 1000 / current().fps) {try {const length=playbackSequence(selected().length,current().direction).length;drawPreview(length?(previewIndex+1)%length:0);} catch {} lastTime = time;}
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
for (const button of document.querySelectorAll('[data-slot]')) button.onclick = () => {
  if (busy || cropDrag) return; active = button.dataset.slot; previewIndex=0;
  for (const b of document.querySelectorAll('[data-slot]')) b.classList.toggle('active', b === button);
  for (const key of settings) $(key).value = current()[key];
  $('crop-frame').value = 0; renderFrames(); update();
};
for (const key of settings) $(key).addEventListener('change', () => {
  if (key === 'fps') current().fps = Math.max(.01, Math.min(60, Number($(key).value) || 5));
  else if (key === 'size') current().size = Number($(key).value) === 2048 ? 2048 : 1024;
  else current()[key] = $(key).value;
  $(key).value = current()[key]; update();
});
for (const id of ['all', 'none', 'alternate', 'invert']) $(id).onclick = () => {
  if (busy) return; current().frames.forEach((f, i) => f.selected = id === 'all' ? true : id === 'none' ? false : id === 'alternate' ? i % 2 === 0 : !f.selected);
  renderFrames(); update();
};
$('play').onclick=()=>setPlaying(!playing);

export function eventOnce(target, event, action, timeout = 20000) {
  return new Promise((resolve, reject) => {
    const ok = () => finish(), bad = () => finish(new Error('Impossible de décoder ce fichier. Essayez un MP4 H.264 ou un WebM.'));
    const timer = setTimeout(() => finish(new Error('Le média ne répond pas ou son format est incompatible.')), timeout);
    function finish(error) {clearTimeout(timer); target.removeEventListener(event, ok); target.removeEventListener('error', bad); error ? reject(error) : resolve();}
    target.addEventListener(event, ok, {once: true}); target.addEventListener('error', bad, {once: true});
    try {action();} catch (e) {finish(e);}
  });
}
async function loadFile(file) {
  if (!file || busy) return; lock(true); message('Chargement du fichier…');
  try {
    media?.decoder?.close(); media = null;
    const video = $('source'); video.pause(); video.hidden = true; video.removeAttribute('src'); video.load();
    if (mediaURL) {URL.revokeObjectURL(mediaURL); mediaURL = null;}
    $('filename').textContent = file.name;
    if (file.size > 250 * 1024 * 1024) throw new Error('Choisissez un fichier de moins de 250 Mo.');
    if (file.type === 'image/gif' || /\.gif$/i.test(file.name)) {
      if (!('ImageDecoder' in globalThis)) throw new Error('Pour les GIF, utilisez Chrome ou Edge récent, ou convertissez le GIF en MP4.');
      const decoder = new ImageDecoder({data: await file.arrayBuffer(), type: 'image/gif', preferAnimation: true});
      try {await decoder.tracks.ready; await decoder.completed; media = {type: 'gif', decoder, total: decoder.tracks.selectedTrack.frameCount};} catch (e) {decoder.close(); throw e;}
      message(`GIF chargé · ${media.total} images. Toutes ses images seront extraites (maximum 256).`);
    } else {
      mediaURL = URL.createObjectURL(file);
      await eventOnce(video, 'loadedmetadata', () => {video.src = mediaURL; video.load();});
      if (!Number.isFinite(video.duration) || video.duration <= 0 || !video.videoWidth) throw new Error('Durée vidéo illisible. Essayez un autre fichier.');
      media = {type: 'video', video}; video.hidden = false;
      message(`Vidéo chargée · ${video.duration.toFixed(2)} s · ${video.videoWidth} × ${video.videoHeight} px. Toute la vidéo sera utilisée.`);
    }
  } catch (e) {media = null; message(e.message);} finally {lock(false);}
}
$('file').onchange = event => {const file = event.target.files[0]; event.target.value = ''; loadFile(file);};
for (const name of ['dragenter', 'dragover']) $('drop').addEventListener(name, event => {event.preventDefault(); $('drop').classList.add('drag');});
for (const name of ['dragleave', 'drop']) $('drop').addEventListener(name, event => {event.preventDefault(); $('drop').classList.remove('drag');});
$('drop').addEventListener('drop', event => loadFile(event.dataTransfer.files[0]));
async function makeFrame(source, time) {
  const width = source.displayWidth || source.width, height = source.displayHeight || source.height;
  const scale = Math.min(1, 512 / width, 512 / height), canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * scale)); canvas.height = Math.max(1, Math.round(height * scale));
  canvas.getContext('2d').drawImage(source, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('La création d’une image a échoué.');
  const bitmap = await createImageBitmap(blob);
  return {bitmap, url: URL.createObjectURL(blob), time, selected: true};
}
$('extract').onclick = async () => {
  if (busy) return;
  if (!media) {message('Choisissez une vidéo ou un GIF pour lancer l’extraction.'); $('file').click(); return;}
  const sourceMedia = media, slot = current(), fresh = []; lock(true); $('progress').hidden = false; $('progress').value = 0;
  try {
    if (sourceMedia.type === 'video') {
      const video = sourceMedia.video, fps = Number($('extract-fps').value), count = videoFrameCount(video.duration, fps);
      video.pause();
      if (video.readyState < 2) await eventOnce(video, 'loadeddata', () => {});
      for (let i = 0; i < count; i++) {
        const t = Math.max(0, Math.min(i / fps, video.duration - .001));
        if (Math.abs(video.currentTime - t) > .00001) await eventOnce(video, 'seeked', () => video.currentTime = t);
        const bitmap = await createImageBitmap(video);
        try {fresh.push(await makeFrame(bitmap, t));} finally {bitmap.close();}
        $('progress').value = (i + 1) / count; message(`Extraction : ${i + 1} / ${count} images…`);
      }
    } else {
      const count = sourceMedia.total;
      if (count > 256) throw new Error('Ce GIF dépasse 256 images. Convertissez-le en vidéo pour réduire les FPS d’extraction.');
      let time = 0;
      for (let i = 0; i < count; i++) {
        const {image} = await sourceMedia.decoder.decode({frameIndex: i});
        try {fresh.push(await makeFrame(image, time)); time += (image.duration || 100000) / 1e6;} finally {image.close();}
        $('progress').value = (i + 1) / count;
      }
    }
    releaseFrames(slot); slot.frames = fresh; slot.crop = null; previewIndex=0; $('crop-frame').value = 0; renderFrames();
    message(`${fresh.length} images extraites. Cliquez sur les images à conserver et ajustez le crop.`);
  } catch (e) {for (const f of fresh) {f.bitmap.close(); URL.revokeObjectURL(f.url);} message(e.message);}
  finally {$('progress').hidden = true; lock(false); update();}
};
$('sample').onclick = async () => {
  if (busy) return; lock(true); const fresh = [];
  try {
    for (let i = 0; i < 16; i++) {
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = 512; const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#182638'; ctx.fillRect(0, 0, 512, 512); ctx.strokeStyle = '#a7f0ce'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(256, 256, 145, 0, Math.PI * 2); ctx.stroke();
      const a = i / 16 * Math.PI * 2, x = 256 + Math.cos(a) * 145, y = 256 + Math.sin(a) * 145;
      const glow = ctx.createRadialGradient(x, y, 0, x, y, 65); glow.addColorStop(0, '#baffde'); glow.addColorStop(1, '#a7f0ce00');
      ctx.fillStyle = glow; ctx.fillRect(0, 0, 512, 512); ctx.fillStyle = '#f2f5fc'; ctx.textAlign = 'center'; ctx.font = 'bold 42px system-ui'; ctx.fillText('FrameLab', 256, 270);
      fresh.push(await makeFrame(canvas, i / 10));
    }
    releaseFrames(current()); current().frames = fresh; current().crop = null; previewIndex=0; $('crop-frame').value = 0;
    renderFrames(); message('Exemple chargé : 16 images. Testez la sélection, le crop et les exports.');
  } catch (e) {for (const f of fresh) {f.bitmap.close(); URL.revokeObjectURL(f.url);} message(e.message);}
  finally {lock(false); update();}
};

function renderCrop() {
  const s = current(), canvas = $('crop-canvas');
  $('crop-controls').hidden = !s.frames.length; $('crop-empty').hidden = !!s.frames.length; $('crop-reset').disabled = busy || !s.frames.length;
  if (!s.frames.length) return;
  const slider = $('crop-frame'); slider.max = s.frames.length - 1; slider.value = Math.min(Number(slider.value), s.frames.length - 1);
  const image = s.frames[Number(slider.value)].bitmap; canvas.width = image.width; canvas.height = image.height;
  const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0); const r = cropRect(image, s.crop);
  ctx.fillStyle = 'rgba(4,8,18,.62)'; ctx.beginPath(); ctx.rect(0, 0, image.width, image.height); ctx.rect(r.x, r.y, r.width, r.height); ctx.fill('evenodd');
  ctx.strokeStyle = '#a7f0ce'; ctx.lineWidth = Math.max(1, image.width / 250); ctx.strokeRect(r.x, r.y, r.width, r.height);
  if (s.crop) {
    const bounds = canvas.getBoundingClientRect(), hx = 8 * canvas.width / (bounds.width || canvas.width), hy = 8 * canvas.height / (bounds.height || canvas.height);
    ctx.fillStyle = '#a7f0ce';
    for (const [x, y] of [[r.x, r.y], [r.x + r.width / 2, r.y], [r.x + r.width, r.y], [r.x, r.y + r.height / 2], [r.x + r.width, r.y + r.height / 2], [r.x, r.y + r.height], [r.x + r.width / 2, r.y + r.height], [r.x + r.width, r.y + r.height]]) ctx.fillRect(x - hx / 2, y - hy / 2, hx, hy);
  }
  const crop = s.crop || {x: 0, y: 0, width: 1, height: 1};
  for (const key of ['x', 'y', 'width', 'height']) $('crop-' + key).value = Number((crop[key] * 100).toFixed(1));
  $('crop-info').textContent = s.crop ? `Zone conservée : ${Math.round(r.width)} × ${Math.round(r.height)} px. Appliquée à toute l’animation et au PNG.` : 'Image entière. Aucun rognage.';
}
function cropPoint(event) {
  const r = $('crop-canvas').getBoundingClientRect();
  return {x: Math.max(0, Math.min(1, (event.clientX - r.left) / r.width)), y: Math.max(0, Math.min(1, (event.clientY - r.top) / r.height))};
}
function cropMode(event) {const r = $('crop-canvas').getBoundingClientRect(), hit = event.pointerType === 'touch' ? 18 : 10; return cropHit(current().crop, cropPoint(event), {x: hit / r.width, y: hit / r.height});}
function cropCursor(mode) {return {draw: 'crosshair', move: 'move', n: 'ns-resize', s: 'ns-resize', e: 'ew-resize', w: 'ew-resize', nw: 'nwse-resize', se: 'nwse-resize', ne: 'nesw-resize', sw: 'nesw-resize'}[mode];}
function moveCrop(event) {
  if (!cropDrag || event.pointerId !== cropDrag.id) return;
  const p = cropPoint(event);
  if (!cropDrag.moved && Math.abs(p.x - cropDrag.start.x) < .002 && Math.abs(p.y - cropDrag.start.y) < .002) return;
  cropDrag.moved = true; current().crop = dragCrop(cropDrag.previous, cropDrag.start, p, cropDrag.mode);
  renderCrop(); try {drawPreview(previewIndex);} catch {}
}
$('crop-canvas').addEventListener('pointerdown', event => {
  if (busy || event.button !== 0 || !current().frames.length) return; event.preventDefault();
  cropDrag = {id: event.pointerId, start: cropPoint(event), previous: current().crop ? {...current().crop} : null, mode: cropMode(event), moved: false};
  $('crop-canvas').style.cursor = cropCursor(cropDrag.mode); $('crop-canvas').setPointerCapture(event.pointerId);
});
$('crop-canvas').addEventListener('pointermove', event => {if (cropDrag) moveCrop(event); else if (!busy) $('crop-canvas').style.cursor = cropCursor(cropMode(event));});
$('crop-canvas').addEventListener('pointerup', event => {
  if (!cropDrag || event.pointerId !== cropDrag.id) return; moveCrop(event); cropDrag = null;
  if ($('crop-canvas').hasPointerCapture(event.pointerId)) $('crop-canvas').releasePointerCapture(event.pointerId); update();
});
function cancelCrop() {if (!cropDrag) return; current().crop = cropDrag.previous; cropDrag = null; update();}
$('crop-canvas').addEventListener('pointercancel', cancelCrop); $('crop-canvas').addEventListener('lostpointercapture', cancelCrop);
$('crop-reset').onclick = () => {if (busy) return; current().crop = null; update();};
$('crop-frame').oninput = renderCrop;
for (const key of ['x', 'y', 'width', 'height']) $('crop-' + key).addEventListener('change', () => {
  if (busy || !current().frames.length) return;
  const crop = {}; for (const k of ['x', 'y', 'width', 'height']) crop[k] = Number($('crop-' + k).value) / 100;
  const image = current().frames[0].bitmap, r = cropRect(image, crop);
  current().crop = {x: r.x / image.width, y: r.y / image.height, width: r.width / image.width, height: r.height / image.height}; update();
});
function download(blob, name) {const a = document.createElement('a'), url = URL.createObjectURL(blob); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 10000);}
function updateExportCard() {
  const s=current(),ready=!!s.count;
  $('export-name').textContent='Animation '+(active==='titre'?'Titre':'Démo');
  $('export-heading').textContent=ready?'Prête pour Second Life':'Votre prochaine texture';
  $('export-state').textContent=ready?'Prête à exporter':'En attente';
  $('export-state').classList.toggle('ready',ready);
  $('export-resolution').textContent=s.size+' × '+s.size+' px';
  $('export-button-info').textContent='PNG · '+s.size+' × '+s.size;
  $('export-frames').textContent=ready?String(s.count):'—';
  $('export-grid').textContent=ready?s.cols+' × '+s.rows:'—';
  $('export-cell').textContent=ready?s.size/s.cols+' × '+s.size/s.rows:'—';
  $('export-duration').textContent=ready?(s.count/s.fps).toLocaleString('fr-FR',{maximumFractionDigits:2})+' s':'—';
  $('export-hint').textContent=ready?s.cols+' colonnes · '+s.rows+' lignes · '+s.fps.toLocaleString('fr-FR')+' FPS':$('metrics').textContent;
  $('export-empty').hidden=ready;$('export-feedback').textContent='';
  const ctx=$('export-thumbnail').getContext('2d');ctx.clearRect(0,0,240,240);if(ready)ctx.drawImage($('atlas'),0,0,240,240);
}
$('export').onclick = () => {
  if(busy||exporting||!current().count)return;
  const s=current(),name=`framelab-${active}-${s.size}-${s.cols}x${s.rows}-${s.count}frames.png`;
  exporting=true;$('export').disabled=true;$('export-feedback').textContent='Préparation du PNG…';
  const finish=blob=>{
    exporting=false;$('export').disabled=busy||!current().count;
    if(!blob){$('export-feedback').textContent='Export impossible. Réessayez.';return;}
    download(blob,name);
    const size=blob.size>=1048576?(blob.size/1048576).toLocaleString('fr-FR',{maximumFractionDigits:2})+' Mo':Math.max(1,Math.round(blob.size/1024))+' Ko';
    $('export-feedback').textContent='Téléchargement lancé · '+size;
  };
  try{$('atlas').toBlob(finish,'image/png');}catch{finish(null);}
};
for (const id of ['uuid-titre', 'uuid-demo', 'link', 'face', 'script-mode']) $(id).addEventListener('input', updateScript);
$('copy').onclick = async () => {try {await navigator.clipboard.writeText($('code').textContent); $('script-status').textContent = 'Code copié.';} catch {$('script-status').textContent = 'Copie indisponible. Sélectionnez le code ou téléchargez le fichier .lsl.';}};
$('download-script').onclick = () => download(new Blob([$('code').textContent], {type: 'text/plain;charset=utf-8'}), 'framelab.lsl');
lock(false); update();
