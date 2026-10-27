// Isolated Chrome regression audit. All API responses are mocked; this does not test real authentication.
import {spawn} from 'node:child_process';
import {mkdtemp,rm,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {setTimeout as delay} from 'node:timers/promises';
const root=fileURLToPath(new URL('../../',import.meta.url)).replace(/\/$/,'');
const profile=await mkdtemp('/tmp/ui-polish-chrome-');
const viteArgs=process.env.UI_AUDIT_PREVIEW_DIR?['preview','--outDir',process.env.UI_AUDIT_PREVIEW_DIR]:[];
const vite=spawn(process.execPath,[root+'/client/node_modules/vite/bin/vite.js',...viteArgs,'--host','127.0.0.1','--port','5197','--strictPort'],{cwd:root+'/client',stdio:['ignore','pipe','pipe'],env:{...process.env,VITE_API_URL:'http://localhost:5000/api'}});
const viteErrors=[];vite.stderr.on('data',chunk=>viteErrors.push(String(chunk)));
let chrome,ws;
try {
 for(let i=0;i<50;i++){try{await fetch('http://127.0.0.1:5197');break;}catch{await delay(100);}}
 chrome=spawn('/usr/bin/google-chrome',['--headless','--no-sandbox','--disable-gpu','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'],{stdio:['ignore','ignore','pipe']});
 const endpoint=await new Promise((resolve,reject)=>{let output='';chrome.stderr.on('data',d=>{output+=d;const m=output.match(/DevTools listening on (ws:\/\/\S+)/);if(m)resolve(m[1]);});chrome.once('exit',()=>reject(Error('Chrome exited')));setTimeout(()=>reject(Error('Chrome startup timeout')),15000).unref();});
 ws=new WebSocket(endpoint);await once(ws,'open');let id=0;const pending=new Map();
 ws.addEventListener('message',({data})=>{const msg=JSON.parse(data);if(pending.has(msg.id)){const {resolve,reject}=pending.get(msg.id);pending.delete(msg.id);msg.error?reject(Error(JSON.stringify(msg.error))):resolve(msg.result);}});
 const send=(method,params={},sessionId)=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params,...(sessionId?{sessionId}:{})}));});
 const {targetId}=await send('Target.createTarget',{url:'about:blank'});const {sessionId}=await send('Target.attachToTarget',{targetId,flatten:true});
 const call=(m,p)=>send(m,p,sessionId);
 // Intercept XHR as well as fetch; the Activities service uses Axios/XHR.
 ws.addEventListener('message',({data})=>{const message=JSON.parse(data);if(message.method==='Fetch.requestPaused')call('Fetch.fulfillRequest',{requestId:message.params.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'application/json'},{name:'Access-Control-Allow-Origin',value:'http://127.0.0.1:5197'},{name:'Access-Control-Allow-Headers',value:'authorization,content-type'},{name:'Access-Control-Allow-Methods',value:'GET,POST,PUT,DELETE,OPTIONS'}],body:Buffer.from(JSON.stringify({success:true,data:[]})).toString('base64')}).catch(error=>{throw error;});});
 await call('Fetch.enable',{patterns:[{urlPattern:'http://localhost:5000/api/*'}]});
 await call('Page.enable');await call('Page.bringToFront');
 await call('Page.addScriptToEvaluateOnNewDocument',{source:`localStorage.setItem('token','browser-fixture-only');localStorage.setItem('user',JSON.stringify({_id:'browser-fixture',email:'fixture@example.test',name:'Browser fixture'}));const originalFetch=window.fetch.bind(window);window.__auditRequests=[];window.fetch=(url,options)=>{if(!String(url).includes('localhost:5000/api'))return originalFetch(url,options);window.__auditRequests.push(String(url));return Promise.resolve(new Response(JSON.stringify(String(url).includes('/auth/')?{success:false,message:'Audit rejection'}:{success:true,data:[]}),{status:String(url).includes('/auth/')?400:200,headers:{'Content-Type':'application/json'}}));};`});
 await call('Page.navigate',{url:'http://127.0.0.1:5197/roadmap'});
 const evaluate=async expression=>{const result=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(result.exceptionDetails)throw Error(JSON.stringify(result.exceptionDetails));return result.result.value;};
 for(let i=0;i<100;i++){if(await evaluate(`Boolean(document.querySelector('.career-selector:not(:disabled)'))`))break;await delay(100);}
 await call('Runtime.enable');
 const errors=[],consoleErrors=[];ws.addEventListener('message',({data})=>{const m=JSON.parse(data);if(m.method==='Runtime.consoleAPICalled'&&m.params.type==='error')consoleErrors.push(m.params.args.map(a=>a.value||a.description||a.type).join(' '));if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);});

 const waitFor=async(expression)=>{for(let i=0;i<100;i++){if(await evaluate(expression))return;await delay(50);}throw Error('Timed out: '+expression);};
 const navigate=async(path)=>{await call('Page.navigate',{url:'http://127.0.0.1:5197'+path});await waitFor("Boolean(document.querySelector('.app-main')||document.querySelector('.login-page'))");await waitFor("!document.querySelector('.route-feedback[role=status]')");await delay(250);};
 const snapshot=async(name)=>{if(!process.env.UI_AUDIT_SCREENSHOTS)return;const {data}=await call('Page.captureScreenshot',{format:'png'});await writeFile(process.env.UI_AUDIT_SCREENSHOTS+'/'+name+'.png',Buffer.from(data,'base64'));};
 const observations=[];
 for(const width of [1440,768,390]){
  await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
  for(const path of ['/dashboard','/roadmap','/settings','/profile']){
   await navigate(path);
   if(path==='/settings')assert.equal(await evaluate("getComputedStyle(document.querySelector('.settings-main')).marginLeft==='0px'&&document.querySelectorAll('main').length===1"),true,'Settings must not inherit the global main/sidebar offset');
   const result=await evaluate(`({width:innerWidth,path:location.pathname,overflow:document.documentElement.scrollWidth>innerWidth,main:!!document.querySelector('.app-main'),unlabelled:[...document.querySelectorAll('input:not([type=hidden]),select,textarea')].filter(e=>!e.labels?.length&&!e.getAttribute('aria-label')&&!e.getAttribute('aria-labelledby')).length,theme:document.documentElement.dataset.theme})`);
   assert.equal(result.overflow,false,JSON.stringify(result));assert.equal(result.main,true);assert.equal(result.unlabelled,0,JSON.stringify(result));assert.equal(result.theme,'dark');observations.push(result);await snapshot(width+path.replaceAll('/','-'));
  }
 }
 // Notes, resources and solving workspace remain available on small screens.
 await navigate('/roadmap');await waitFor("Boolean(document.querySelector('.career-selector:not(:disabled)'))");
 for(const tab of ['resources','notes','practice']){
  await evaluate(`[...document.querySelectorAll('.detail-tabs button')].find(b=>b.textContent.trim()===${JSON.stringify(tab)}).click()`);await delay(100);
  assert.equal(await evaluate("document.documentElement.scrollWidth<=innerWidth"),true,tab);
 }
 assert.equal(await evaluate("Boolean(document.querySelector('.practice-workspace'))"),true);await snapshot('390-practice');
 await navigate('/profile');
 // Exercise the actual browser Tab key, rather than dispatching a synthetic event.
 await evaluate("document.querySelector('.mobile-menu-toggle').click()");await waitFor("document.querySelector('#career-sidebar').contains(document.activeElement)");
 assert.equal(await evaluate("document.querySelector('#career-sidebar').contains(document.activeElement)"),true);
 assert.equal(await evaluate("document.querySelector('.app-main').inert"),true);
 for(let i=0;i<25;i++){
  await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
  assert.equal(await evaluate("document.querySelector('#career-sidebar').contains(document.activeElement)||document.activeElement.matches('.mobile-menu-toggle')"),true);
 }
 await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await delay(100);
 assert.equal(await evaluate("document.activeElement.matches('.mobile-menu-toggle')&&!document.querySelector('.app-main').inert"),true);
 await evaluate("document.querySelector('.mobile-menu-toggle').click()");await delay(50);await evaluate("document.querySelector('.sidebar a[href=\"/roadmap\"]').click()");await delay(300);
 assert.equal(await evaluate("location.pathname==='/roadmap'&&document.querySelector('.sidebar a[aria-current=page]').getAttribute('href')==='/roadmap'&&document.querySelector('.mobile-menu-toggle').getAttribute('aria-expanded')==='false'"),true);
 // Every main sidebar route resolves with the shared shell, including direct-load/refresh.
 await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 const routes=await evaluate("[...document.querySelectorAll('.sidebar-link')].map(a=>a.getAttribute('href'))");
 for(const path of routes){await navigate(path);assert.equal(await evaluate("Boolean(document.querySelector('.app-main'))"),true,path);}
 await navigate('/settings');
 for(const label of ['Appearance','Notifications','AI preferences','Security','Account','Profile']){
  await evaluate(`[...document.querySelectorAll('.settings-nav-item')].find(b=>b.textContent.includes(${JSON.stringify(label)})).click()`);await delay(50);
  assert.equal(await evaluate("[...document.querySelectorAll('.settings-main input,.settings-main select,.settings-main textarea')].filter(e=>!e.labels?.length&&!e.getAttribute('aria-label')).length"),0,label);
 }
 await evaluate("Storage.prototype.__auditSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new DOMException('Audit quota','QuotaExceededError')};document.querySelector('.settings-main form').requestSubmit()");await delay(100);
 assert.equal(await evaluate("Boolean(document.querySelector('.settings-feedback.is-error[role=alert]'))"),true);
 await evaluate("Storage.prototype.setItem=Storage.prototype.__auditSetItem;document.querySelector('.settings-main form').requestSubmit()");await delay(100);
 assert.equal(await evaluate("Boolean(document.querySelector('.settings-feedback:not(.is-error)[role=status]'))"),true);
 await evaluate("[...document.querySelectorAll('.settings-nav-item')].find(b=>b.textContent.includes('Security')).click()");await delay(50);
 assert.equal(await evaluate("document.querySelector('a.settings-primary-button').getAttribute('href')"),'/forgot-password');
 await evaluate("document.querySelector('a.settings-primary-button').click()");await delay(100);
 await evaluate(`(()=>{const el=document.querySelector('input[type=email]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,'fixture@example.test');el.dispatchEvent(new Event('input',{bubbles:true}));})()`);await delay(50);await evaluate("document.querySelector('form').requestSubmit()");await delay(100);
 // Mock the verification exchange to check all three existing recovery endpoints without sending mail.
 await evaluate(`window.fetch=(url)=>{window.__auditRequests.push(String(url));return Promise.resolve(new Response(JSON.stringify({success:true,data:{resetToken:'fixture-reset-token'}}),{headers:{'Content-Type':'application/json'}}));};document.querySelector('form').requestSubmit()`);await waitFor("Boolean(document.querySelector('#reset-code'))");
 await evaluate(`(()=>{const el=document.querySelector('#reset-code');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,'123456');el.dispatchEvent(new Event('input',{bubbles:true}));})()`);await delay(50);await evaluate("document.querySelector('form').requestSubmit()");await waitFor("location.pathname==='/reset-password'&&document.querySelectorAll('input[type=password]').length===2");
 await evaluate(`(()=>{for(const el of document.querySelectorAll('input[type=password]')){Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,'Fixture-Password-123!');el.dispatchEvent(new Event('input',{bubbles:true}));}})()`);await delay(50);await evaluate("document.querySelector('form').requestSubmit()");await delay(100);
 const requests=await evaluate('window.__auditRequests');assert.ok(requests.includes('http://localhost:5000/api/auth/verify-reset-code'));assert.ok(requests.includes('http://localhost:5000/api/auth/reset-password'));assert.ok(requests.includes('http://localhost:5000/api/auth/forgot-password'));assert.ok(!requests.some(url=>url.includes('/api/api/')));
 await navigate('/settings');await evaluate(`localStorage.setItem('ai-career-os-settings',JSON.stringify({theme:'light'}))`);await navigate('/settings');assert.equal(await evaluate("document.documentElement.dataset.theme"),'light');
 assert.equal(errors.length,0,JSON.stringify(errors));
 assert.equal(consoleErrors.filter(message=>!message.includes('Unable to save settings:')).length,0,JSON.stringify(consoleErrors));
 const unexpectedViteErrors=viteErrors.filter(message=>!message.includes('Unable to save settings: QuotaExceededError: Audit quota'));
 assert.equal(unexpectedViteErrors.length,0,JSON.stringify(unexpectedViteErrors));
 const report={mockedAPI:true,observations,routesChecked:routes.length,mobileKeyboardContainment:true,escapeFocusRestoration:true,menuClosesAfterNavigation:true,settingsLabelsAndTheme:true,storageFailureAndRecovery:true,passwordRecoveryURLs:true,notesResourcesPractice:true,savedLightThemePreserved:true,expectedConsoleErrors:consoleErrors.length,unexpectedViteErrors,browserExceptions:errors};
 console.log(JSON.stringify(report,null,2));
 if(process.env.UI_AUDIT_RESULT)await writeFile(process.env.UI_AUDIT_RESULT,JSON.stringify(report,null,2));
}finally{if(ws)ws.close();if(chrome){chrome.kill('SIGTERM');await once(chrome,'exit').catch(()=>{});}vite.kill('SIGTERM');await rm(profile,{recursive:true,force:true,maxRetries:10,retryDelay:200});}
