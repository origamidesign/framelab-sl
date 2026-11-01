import {test} from 'node:test';
import assert from 'node:assert/strict';
import {playbackSequence} from '../core.mjs';

test('la barre suit les lectures normale, inversée et aller-retour',()=>{
  assert.deepEqual(playbackSequence(4),[0,1,2,3]);
  assert.deepEqual(playbackSequence(4,'reverse'),[3,2,1,0]);
  assert.deepEqual(playbackSequence(4,'pingpong'),[0,1,2,3,2,1]);
  assert.deepEqual(playbackSequence(1,'pingpong'),[0]);
  assert.deepEqual(playbackSequence(0,'reverse'),[]);
});

test('navigation, numéros source, exclusions et taille des vignettes',async()=>{
  class Element extends EventTarget {
    value='';dataset={};style={setProperty:(key,value)=>this.style[key]=value};children=[];attributes={};disabled=false;textContent='';width=512;height=512;
    classList={toggle(){},add(){},remove(){}};
    setAttribute(k,v){this.attributes[k]=v;}removeAttribute(k){delete this.attributes[k];}
    append(...children){this.children.push(...children);}replaceChildren(...children){this.children=children;}
    querySelector(selector){const n=selector.match(/data-frame-index="(\d+)"/);return n?this.children.find(c=>c.dataset.frameIndex===n[1]):null;}
    getBoundingClientRect(){return {width:512,height:512,left:0,top:0};}
    getContext(){return {clearRect(){},drawImage:(...args)=>{this.lastDraw=args;},fillRect(){},strokeRect(){},fillText(){},beginPath(){},rect(){},arc(){},clip(){},fill(){},stroke(){},save(){},restore(){},createRadialGradient(){return {addColorStop(){}};}};}
    toBlob(callback){callback(new Blob(['png'],{type:'image/png'}));}
  }
  const elements=new Map(),get=id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id);};
  const video=get('source');video.duration=3;video.videoWidth=1920;video.readyState=4;video.pause=()=>{};
  let videoTime=0;Object.defineProperty(video,'currentTime',{get:()=>videoTime,set:value=>{videoTime=value;queueMicrotask(()=>video.dispatchEvent(new Event('seeked')));}});
  video.load=()=>{if(video.src)queueMicrotask(()=>video.dispatchEvent(new Event('loadedmetadata')));};
  const titre=new Element(),demo=new Element();titre.dataset.slot='titre';demo.dataset.slot='demo';
  get('link').value='2';get('face').value='2';get('script-mode').value='full';get('crop-frame').value='0';
  globalThis.document={getElementById:get,createElement:()=>new Element(),querySelectorAll:selector=>selector==='[data-slot]'?[titre,demo]:[]};
  globalThis.requestAnimationFrame=()=>0;
  globalThis.createImageBitmap=async()=>({width:512,height:512,close(){}});
  try{
    await import('../app.js?preview-tests');
    assert.equal(get('preview-seek').disabled,true);
    await get('sample').onclick();
    assert.equal(get('frames').children.length,16);
    assert.equal(get('preview-frame-number').textContent,'Vignette n° 1');
    assert.equal(Number(get('preview-seek').max),15);
    get('preview-seek').value='8';get('preview-seek').dispatchEvent(new Event('input'));
    assert.equal(get('preview-frame-number').textContent,'Vignette n° 9');
    assert.equal(get('play').textContent,'▶ Lecture');
    get('preview-prev').onclick();assert.equal(get('preview-frame-number').textContent,'Vignette n° 8');
    get('alternate').onclick(); // Selected original frames: 1, 3, 5, …, 15.
    get('preview-seek').value='1';get('preview-seek').dispatchEvent(new Event('input'));
    assert.equal(get('preview-frame-number').textContent,'Vignette n° 3');
    assert.equal(get('preview-sequence-position').textContent,'2 / 8');
    get('direction').value='reverse';get('direction').dispatchEvent(new Event('change'));
    get('preview-seek').value='0';get('preview-seek').dispatchEvent(new Event('input'));
    assert.equal(get('preview-frame-number').textContent,'Vignette n° 15');
    get('thumbnail-size').value='200';get('thumbnail-size').dispatchEvent(new Event('input'));
    assert.equal(get('frames').style['--thumbnail-size'],'200px');
    assert.equal(get('thumbnail-size-value').textContent,'200 px');
    demo.onclick();assert.equal(get('preview-seek').disabled,true);
    titre.onclick();assert.equal(get('preview-seek').disabled,false);
    get('none').onclick();assert.equal(get('preview-frame-number').textContent,'Aucune image');
    assert.equal(get('preview-next').disabled,true);
    // The crop survives all regeneration paths and remains independent between slots.
    for(const [key,value] of Object.entries({x:10,y:20,width:30,height:40}))get('crop-'+key).value=String(value);
    get('crop-width').dispatchEvent(new Event('change'));
    const assertCrop=()=>{
      for(const [key,value] of Object.entries({x:10,y:20,width:30,height:40}))assert.equal(Number(get('crop-'+key).value),value,'crop '+key);
      const thumbnail=get('frames').children[0].children[0];
      for(const [i,value] of [51.2,102.4,153.6,204.8].entries())assert.ok(Math.abs(thumbnail.lastDraw[i+1]-value)<1e-8,'la vignette prélève uniquement le crop');
    };
    assertCrop();
    get('fps').value='12';get('fps').dispatchEvent(new Event('change'));assertCrop();
    get('size').value='2048';get('size').dispatchEvent(new Event('change'));assertCrop();
    await get('sample').onclick();assertCrop();
    get('file').files=[new Blob(['video'],{type:'video/mp4'})];get('file').onchange({target:get('file')});
    await new Promise(resolve=>setImmediate(resolve));
    get('extract-fps').value='2';await get('extract').onclick();
    assert.equal(get('frames').children.length,6);assertCrop();
    get('extract-fps').value='4';await get('extract').onclick();
    assert.equal(get('frames').children.length,12);assertCrop();
    demo.onclick();await get('sample').onclick();assert.equal(Number(get('crop-width').value),100);
    get('crop-reset').onclick();titre.onclick();assertCrop();
    get('crop-reset').onclick();assert.equal(Number(get('crop-width').value),100);assert.equal(Number(get('crop-x').value),0);
    assert.deepEqual(get('frames').children[0].children[0].lastDraw.slice(1,5),[0,0,512,512]);
  }finally{delete globalThis.document;delete globalThis.requestAnimationFrame;delete globalThis.createImageBitmap;}
});
