import test from 'node:test';
import assert from 'node:assert/strict';
import {APP_ZOOM_KEY,APP_ZOOM_EVENT,DEFAULT_APP_ZOOM,normalizeAppZoom,readAppZoom,applyAppZoom,saveAppZoom,initializeAppZoom,scaleZoomMediaQuery,synchronizeZoomMedia} from './appZoom.js';
const storage = initial => {const records=new Map(Object.entries(initial||{}));return{records,getItem:k=>records.get(k)??null,setItem:(k,v)=>records.set(k,v)};};
const document = () => ({documentElement:{dataset:{theme:'dark',eyeComfort:'on'},style:{values:new Map([['--surface','#121d30']]),setProperty(k,v){this.values.set(k,v);},removeProperty(k){this.values.delete(k);}}}});
const window = (width=1366) => {const win=new EventTarget();win.innerWidth=width;win.CSS={supports:()=>true};win.CustomEvent=CustomEvent;return win;};

test('missing, invalid and unsupported versions restore defaults',()=>{
 for(const value of [null,'broken','null','[]','false','123','{"zoom":125}','{"version":2,"zoom":125}'])assert.deepEqual(readAppZoom(storage({[APP_ZOOM_KEY]:value})),DEFAULT_APP_ZOOM);
 assert.deepEqual(readAppZoom({getItem(){throw Error('blocked');}}),DEFAULT_APP_ZOOM);
});
test('zoom is bounded and snapped to five-percent steps',()=>{
 assert.equal(normalizeAppZoom({version:1,zoom:10}).zoom,80);assert.equal(normalizeAppZoom({version:1,zoom:999}).zoom,150);assert.equal(normalizeAppZoom({version:1,zoom:126}).zoom,125);
 for(const zoom of [null,'125',NaN,Infinity])assert.equal(normalizeAppZoom({version:1,zoom}).zoom,100);
});
test('save and reset round-trip independently of auth, theme and eye comfort',()=>{
 const existing={'token':'fixture','ai-career-os-settings':'{"theme":"light"}','ai-career-os:eye-comfort:v1':'{"version":1,"intensity":85}'};
 const s=storage(existing),doc=document(),win=window();
 const events=[];win.addEventListener(APP_ZOOM_EVENT,e=>events.push(e.detail.zoom));
 assert.equal(saveAppZoom({version:1,zoom:125},s,doc,win).saved,true);assert.equal(readAppZoom(s).zoom,125);assert.equal(doc.documentElement.style.values.get('zoom'),'1.25');
 saveAppZoom(DEFAULT_APP_ZOOM,s,doc,win);assert.deepEqual(readAppZoom(s),DEFAULT_APP_ZOOM);assert.equal(doc.documentElement.style.values.has('zoom'),false);
 for(const [k,v] of Object.entries(existing))assert.equal(s.getItem(k),v);
 assert.equal(doc.documentElement.dataset.theme,'dark');assert.equal(doc.documentElement.dataset.eyeComfort,'on');assert.equal(doc.documentElement.style.values.get('--surface'),'#121d30');assert.deepEqual(events,[125,100]);
});
test('storage errors keep zoom usable for this visit and report failure',()=>{
 const doc=document(),result=saveAppZoom({version:1,zoom:150},{setItem(){throw Error('quota');}},doc,window());
 assert.equal(result.saved,false);assert.equal(doc.documentElement.style.values.get('zoom'),'1.5');
});
test('unsupported CSS zoom is reported without applying a broken transform fallback',()=>{
 const doc=document(),win=window();win.CSS.supports=()=>false;
 const result=applyAppZoom({version:1,zoom:150},doc,win);assert.equal(result.supported,false);assert.equal(doc.documentElement.dataset.appZoom,'off');assert.equal(doc.documentElement.style.values.has('zoom'),false);
});
test('effective viewport enables compact navigation and default restores original layout',()=>{
 const doc=document(),win=window(1100);
 applyAppZoom({version:1,zoom:150},doc,win);assert.equal(doc.documentElement.dataset.appZoomCompact,'true');assert.equal(doc.documentElement.dataset.appZoomReflow,'false');
 applyAppZoom(DEFAULT_APP_ZOOM,doc,win);assert.equal(doc.documentElement.dataset.appZoomCompact,'false');assert.equal(doc.documentElement.dataset.appZoomReflow,'false');
});

test('existing responsive queries follow effective width/height without touching motion or pointer queries',()=>{
 assert.equal(scaleZoomMediaQuery('(max-width: 768px) and (hover: hover)',1.5),'(max-width: 1152px) and (hover: hover)');
 assert.equal(scaleZoomMediaQuery('(min-width: 48rem) and (height >= 500px)',1.25),'(min-width: 60rem) and (height >= 625px)');
 assert.equal(scaleZoomMediaQuery('(600px >= width), (max-height: 40em)',.8),'(480px >= width), (max-height: 32em)');
 assert.equal(scaleZoomMediaQuery('(prefers-reduced-motion: reduce) and (pointer: fine)',1.5),'(prefers-reduced-motion: reduce) and (pointer: fine)');
});
test('repeated zoom does not compound root scale or stylesheet breakpoints and reset restores originals',()=>{
 const media={mediaText:'(max-width: 768px)'};
 const doc=document();doc.styleSheets=[{cssRules:[{cssRules:[{media,cssRules:[]}]}]}];
 for(const zoom of [125,150,150,80,125]){
  applyAppZoom({version:1,zoom},doc,window());assert.equal(doc.documentElement.style.values.get('zoom'),String(zoom/100));assert.equal(media.mediaText,`(max-width: ${768*zoom/100}px)`);
 }
 applyAppZoom(DEFAULT_APP_ZOOM,doc,window());assert.equal(media.mediaText,'(max-width: 768px)');assert.equal(doc.documentElement.style.values.has('zoom'),false);
});
test('new route styles receive zoom-aware breakpoints and inaccessible third-party styles are skipped',()=>{
 const doc=document(),foreign={get cssRules(){const error=Error('cross-origin');error.name='SecurityError';throw error;}};
 doc.styleSheets=[foreign,{cssRules:[]}];synchronizeZoomMedia(doc,1.5);
 const media={mediaText:'(max-width: 900px)'};doc.styleSheets[1].cssRules.push({media});
 synchronizeZoomMedia(doc,1.5);assert.equal(media.mediaText,'(max-width: 1350px)');
 synchronizeZoomMedia(doc,1);assert.equal(media.mediaText,'(max-width: 900px)');
});
test('style injection observer applies the current zoom to lazy page CSS and disconnects',t=>{
 const s=storage({[APP_ZOOM_KEY]:'{"version":1,"zoom":150}'}),descriptor=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
 Object.defineProperty(globalThis,'localStorage',{configurable:true,value:s});t.after(()=>{if(descriptor)Object.defineProperty(globalThis,'localStorage',descriptor);else delete globalThis.localStorage;});
 let observer;const win=window();win.MutationObserver=class{constructor(callback){this.callback=callback;observer=this;}observe(){}disconnect(){this.disconnected=true;}};
 const doc=document();doc.head={};doc.styleSheets=[{cssRules:[]}];const stop=initializeAppZoom(win,doc);t.after(stop);
 const media={mediaText:'(max-width: 700px)'};doc.styleSheets[0].cssRules.push({media});observer.callback();assert.equal(media.mediaText,'(max-width: 1050px)');
 stop();assert.equal(observer.disconnected,true);
});
test('initialization restores zoom without writes, tracks resize and cross-tab reset, and cleans up',t=>{
 const s=storage({[APP_ZOOM_KEY]:'{"version":1,"zoom":125}'}),descriptor=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
 Object.defineProperty(globalThis,'localStorage',{configurable:true,value:s});t.after(()=>{if(descriptor)Object.defineProperty(globalThis,'localStorage',descriptor);else delete globalThis.localStorage;});
 const doc=document(),win=window(1366);let writes=0;const setter=s.setItem;s.setItem=(...args)=>{writes++;setter(...args);};
 const stop=initializeAppZoom(win,doc);t.after(stop);assert.equal(doc.documentElement.style.values.get('zoom'),'1.25');assert.equal(writes,0);
 win.innerWidth=800;win.dispatchEvent(new Event('resize'));assert.equal(doc.documentElement.dataset.appZoomCompact,'true');
 const event=new Event('storage');event.key=APP_ZOOM_KEY;s.records.delete(APP_ZOOM_KEY);win.dispatchEvent(event);assert.equal(doc.documentElement.dataset.appZoom,'off');assert.equal(writes,0);
 stop();win.innerWidth=400;win.dispatchEvent(new Event('resize'));assert.equal(doc.documentElement.dataset.appZoomCompact,'false');
});
test('all allowed choices leave theme and comfort tokens untouched',()=>{
 const doc=document();for(let zoom=80;zoom<=150;zoom+=5){applyAppZoom({version:1,zoom},doc,window());assert.equal(doc.documentElement.dataset.theme,'dark');assert.equal(doc.documentElement.style.values.get('--surface'),'#121d30');assert.equal(doc.documentElement.dataset.eyeComfort,'on');}
});


test('landing and login retain original scale and media rules while workspace zoom resumes',()=>{
 const doc=document(),win=window();
 const media={media:{mediaText:'(max-width: 768px)'}};
 doc.styleSheets=[{cssRules:[media]}];
 win.location={pathname:'/settings'};
 for(const zoom of [125,150]){
  const prefs={version:1,zoom};
  applyAppZoom(prefs,doc,win);
  assert.equal(doc.documentElement.style.values.get('zoom'),String(zoom/100));
  for(const pathname of ['/', '/login']){
  win.location.pathname=pathname;
  const result=applyAppZoom(prefs,doc,win);
  assert.equal(result.preferences.zoom,zoom);
  assert.equal(doc.documentElement.style.values.has('zoom'),false);
  assert.equal(doc.documentElement.dataset.appZoomCompact,'false');
  assert.equal(media.media.mediaText,'(max-width: 768px)');
  }
  win.location.pathname='/dashboard';
  applyAppZoom(prefs,doc,win);
  assert.equal(doc.documentElement.style.values.get('zoom'),String(zoom/100));
  assert.equal(media.media.mediaText,`(max-width: ${768*zoom/100}px)`);
 }
});
