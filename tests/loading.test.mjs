import {test} from 'node:test';
import assert from 'node:assert/strict';
test('le bouton ouvre le fichier, se réactive après import et après erreur', async () => {
  class Element extends EventTarget {
    value = ''; disabled = false; hidden = false; textContent = ''; files = []; clicks = 0; children = [];
    classList = {toggle(){}, add(){}, remove(){}};
    click(){this.clicks++;} pause(){} removeAttribute(){delete this.src;} setAttribute(){}
    getContext(){return {clearRect(){}};}
  }
  const elements = new Map(), get = id => {if (!elements.has(id)) elements.set(id, new Element()); return elements.get(id);};
  const video = get('source'); video.duration = 12; video.videoWidth = 1920;
  video.load = function(){if (this.src) queueMicrotask(() => this.dispatchEvent(new Event('loadedmetadata')));};
  get('link').value = '2'; get('face').value = '2'; get('script-mode').value = 'full';
  globalThis.document = {getElementById: get, querySelectorAll: () => []}; globalThis.requestAnimationFrame = () => 0;
  try {
    await import('../app.js?test');
    assert.equal(get('extract').disabled, false); await get('extract').onclick(); assert.equal(get('file').clicks, 1);
    get('file').files = [new Blob(['video'], {type: 'video/mp4'})]; get('file').onchange({target: get('file')});
    assert.equal(get('extract').disabled, true); await new Promise(resolve => setImmediate(resolve));
    assert.equal(get('extract').disabled, false); assert.match(get('status').textContent, /Vidéo chargée/);
    get('file').files = [{name: 'too-large.mp4', size: 251 * 1024 * 1024}]; get('file').onchange({target: get('file')});
    assert.equal(get('extract').disabled, false); assert.match(get('status').textContent, /250 Mo/);
    await get('extract').onclick(); assert.equal(get('file').clicks, 2);
  } finally {delete globalThis.document; delete globalThis.requestAnimationFrame;}
});
