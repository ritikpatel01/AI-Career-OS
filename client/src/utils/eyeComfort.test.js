import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DEFAULT_EYE_COMFORT, EYE_COMFORT_KEY, EYE_COMFORT_EVENT, normalizeEyeComfort, readEyeComfort, eyeComfortTokens, applyEyeComfort, saveEyeComfort, initializeEyeComfort } from './eyeComfort.js';

const memoryStorage = (initial = {}) => {
    const records = new Map(Object.entries(initial));
    return { getItem: key => records.get(key) ?? null, setItem: (key, value) => records.set(key, value), records };
};
const fakeDocument = theme => {
    const element = () => ({ dataset: {}, style: { values: new Map(), setProperty(k,v) {this.values.set(k,v);}, removeProperty(k) {this.values.delete(k);} } });
    const documentElement = element(); documentElement.dataset.theme = theme;
    return { documentElement, body: element() };
};
const preferences = extra => ({ ...DEFAULT_EYE_COMFORT, ...extra });
const luminance = hex => hex.slice(1).match(/../g).map(v => parseInt(v,16)/255).map(v => v <= .04045 ? v/12.92 : ((v+.055)/1.055)**2.4).reduce((sum,v,i) => sum + v * [.2126,.7152,.0722][i],0);
const contrast = (a,b) => { const x=luminance(a),y=luminance(b); return (Math.max(x,y)+.05)/(Math.min(x,y)+.05); };

test('missing, malformed, legacy, future and non-object preferences fall back safely', () => {
    for (const raw of [null,'{broken','null','[]','true','0','"dark"','{"intensity":80}','{"version":2,"intensity":90}']) {
        assert.deepEqual(readEyeComfort(memoryStorage({ [EYE_COMFORT_KEY]:raw })), DEFAULT_EYE_COMFORT);
    }
    assert.deepEqual(readEyeComfort({getItem(){throw Error('storage blocked');}}), DEFAULT_EYE_COMFORT);
});
test('normalization clamps finite numbers and rejects invalid contrast and booleans', () => {
    assert.deepEqual(normalizeEyeComfort(preferences({intensity:999,contrast:'invalid',reducedEffects:'true'})), preferences({intensity:120}));
    assert.equal(normalizeEyeComfort(preferences({intensity:-9})).intensity,80);
    for(const intensity of [NaN,Infinity,'90',null]) assert.equal(normalizeEyeComfort(preferences({intensity})).intensity,100);
});
test('saving persists only the versioned feature key and round-trips all options', () => {
    const storage=memoryStorage({'ai-career-os-settings':'{"theme":"light","name":"legacy"}','token':'fixture'});
    const next=preferences({intensity:87,contrast:'soft',reducedEffects:true});
    const result=saveEyeComfort(next,storage,fakeDocument('light'));
    assert.equal(result.saved,true); assert.deepEqual(readEyeComfort(storage),next);
    assert.equal(storage.getItem('ai-career-os-settings'),'{"theme":"light","name":"legacy"}'); assert.equal(storage.getItem('token'),'fixture');
});
test('storage failure still applies preference for this visit and reports failure', () => {
    const doc=fakeDocument('dark');
    const result=saveEyeComfort(preferences({contrast:'high'}),{setItem(){throw Error('quota');}},doc);
    assert.equal(result.saved,false); assert.equal(doc.documentElement.dataset.comfortContrast,'high');
    assert.equal(doc.body.style.values.get('--text-primary'),'#ffffff');
});
test('standard/high/soft mode switches update both roots and reset removes all overrides', () => {
    const doc=fakeDocument('dark');
    for(const mode of ['high','soft','standard']) {
        applyEyeComfort(preferences({contrast:mode,intensity:90}),doc);
        assert.equal(doc.documentElement.dataset.comfortContrast,mode);
        assert.equal(doc.body.style.values.get('--surface'),doc.documentElement.style.values.get('--surface'));
    }
    applyEyeComfort(DEFAULT_EYE_COMFORT,doc);
    assert.equal(doc.documentElement.dataset.eyeComfort,'off'); assert.equal(doc.body.style.values.size,0); assert.equal(doc.documentElement.style.values.size,0);
    assert.equal(doc.documentElement.dataset.theme,'dark');
});
test('all slider steps and contrast modes keep text >=4.5:1; high contrast improves body text', () => {
    for(const theme of ['light','dark']) for(let intensity=80;intensity<=120;intensity++) {
        const standard=eyeComfortTokens(preferences({intensity}),theme);
        const high=eyeComfortTokens(preferences({intensity,contrast:'high'}),theme);
        assert.ok(contrast(high['--text-primary'],high['--surface']) > contrast(standard['--text-primary'],standard['--surface']));
        assert.ok(contrast(high['--border-color'],high['--surface'])>=3);
        for(const mode of ['standard','high','soft']) {
            const tokens=eyeComfortTokens(preferences({intensity,contrast:mode}),theme);
            for(const text of ['--text-primary','--text-secondary','--text-muted']) for(const surface of ['--app-bg','--surface','--surface-muted','--surface-hover']) {
                assert.ok(contrast(tokens[text],tokens[surface])>=4.5,`${theme}/${intensity}/${mode}/${text}/${surface}`);
            }
            assert.ok(contrast(tokens['--comfort-button-text'],tokens['--comfort-button-bg'])>=4.5);
            assert.ok(contrast(tokens['--focus-color'],tokens['--surface'])>=3);
        }
    }
});
test('initialization restores before render, survives navigation, follows theme and cross-tab changes', t => {
    const storage=memoryStorage({[EYE_COMFORT_KEY]:JSON.stringify(preferences({contrast:'high',intensity:92}))});
    const originalStorage=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
    Object.defineProperty(globalThis,'localStorage',{configurable:true,value:storage});
    t.after(()=>{if(originalStorage)Object.defineProperty(globalThis,'localStorage',originalStorage);else delete globalThis.localStorage;});
    let observer;
    class Observer {constructor(callback){this.callback=callback;observer=this;} observe(_node,options){assert.deepEqual(options.attributeFilter,['data-theme']);} disconnect(){this.disconnected=true;}}
    const win=new EventTarget(); win.MutationObserver=Observer; win.localStorage=storage;
    const doc=fakeDocument('dark'); const events=[]; win.addEventListener(EYE_COMFORT_EVENT,event=>events.push(event.detail));
    const stop=initializeEyeComfort(win,doc); t.after(stop);
    assert.equal(doc.documentElement.dataset.comfortContrast,'high');
    const dark=doc.body.style.values.get('--surface');
    for(const path of ['/dashboard','/roadmap','/documents','/jobs','/profile']) { win.location={pathname:path}; assert.equal(doc.body.style.values.get('--surface'),dark); }
    doc.documentElement.dataset.theme='light'; observer.callback(); assert.notEqual(doc.body.style.values.get('--surface'),dark);
    storage.setItem(EYE_COMFORT_KEY,JSON.stringify(preferences({contrast:'soft'})));
    const event=new Event('storage'); Object.assign(event,{key:EYE_COMFORT_KEY,storageArea:storage}); win.dispatchEvent(event);
    assert.equal(doc.documentElement.dataset.comfortContrast,'soft'); assert.equal(events.at(-1).contrast,'soft');
    storage.records.delete(EYE_COMFORT_KEY); win.dispatchEvent(event); assert.equal(doc.documentElement.dataset.eyeComfort,'off');
    stop(); assert.equal(observer.disconnected,true);
});
test('global stylesheet covers major routes and never uses an application opacity/filter', () => {
    const css=readFileSync(new URL('../styles/eyeComfort.css',import.meta.url),'utf8');
    for(const page of ['dashboard','roadmap','documents','profile','jobs','settings','skills','dsa','interview','github','projects','resume','progress','activities','notifications','login','auth']) assert.ok(css.includes('.'+page+'-page'),page);
    assert.ok(css.includes('.kb-page')); assert.ok(css.includes('.ac-page'));
    assert.ok(!/(?:^|[;{])\s*filter\s*:/m.test(css));
    for (const match of css.matchAll(/(?:^|[;{])\s*opacity\s*:\s*([^;}]+)/gm)) assert.equal(match[1].trim(),'1');
});

test('reset persists defaults without changing the existing theme or legacy settings', () => {
    const doc=fakeDocument('light');
    const storage=memoryStorage({'ai-career-os-settings':'{"theme":"light"}'});
    saveEyeComfort(preferences({intensity:80,contrast:'high',reducedEffects:true}),storage,doc);
    saveEyeComfort(DEFAULT_EYE_COMFORT,storage,doc);
    assert.deepEqual(readEyeComfort(storage),DEFAULT_EYE_COMFORT);
    assert.equal(doc.documentElement.dataset.eyeComfort,'off');
    assert.equal(doc.documentElement.dataset.theme,'light');
    assert.equal(storage.getItem('ai-career-os-settings'),'{"theme":"light"}');
});
