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
    getContext(){return {clearRect(){},drawImage(){},fillRect(){},strokeRect(){},fillText(){},beginPath(){},rect(){},arc(){},clip(){},fill(){},stroke(){},save(){},restore(){},createRadialGradient(){return {addColorStop(){}};}};}
    toBlob(callback){callback(new Blob(['png'],{type:'image/png'}));}
  }
  const elements=new Map(),get=id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id);};
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
  }finally{delete globalThis.document;delete globalThis.requestAnimationFrame;delete globalThis.createImageBitmap;}
});
