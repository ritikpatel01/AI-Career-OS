// Compiled-route/chunk regression audit. API responses and auth state are isolated fixtures.
// Run with UI_AUDIT_PREVIEW_DIR pointing to a production build using http://localhost:5000/api.
import {spawn} from 'node:child_process';
import {mkdtemp,rm,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {setTimeout as delay} from 'node:timers/promises';
const root=fileURLToPath(new URL('../../',import.meta.url)).replace(/\/$/,'');
const profile=await mkdtemp('/tmp/ui-polish-chrome-');
assert.ok(process.env.UI_AUDIT_PREVIEW_DIR,'Set UI_AUDIT_PREVIEW_DIR to the compiled build directory');
const viteArgs=['preview','--outDir',process.env.UI_AUDIT_PREVIEW_DIR];
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
 let delayed=null,delaySkills=false,failDocuments=false;
 const requested=[],failed=[],httpErrors=[];const requestURLs=new Map();
 ws.addEventListener('message',({data})=>{
  const message=JSON.parse(data),p=message.params;
  if(message.method==='Network.requestWillBeSent'){requestURLs.set(p.requestId,p.request.url);if(p.type==='Script')requested.push(p.request.url);}
  if(message.method==='Network.loadingFailed')failed.push({url:requestURLs.get(p.requestId),reason:p.errorText});
  if(message.method==='Network.responseReceived'&&p.response.status>=400)httpErrors.push({url:p.response.url,status:p.response.status});
  if(message.method!=='Fetch.requestPaused')return;
  if(p.request.url.includes('/api/')){call('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'application/json'},{name:'Access-Control-Allow-Origin',value:'http://127.0.0.1:5197'},{name:'Access-Control-Allow-Headers',value:'authorization,content-type'},{name:'Access-Control-Allow-Methods',value:'GET,POST,PUT,DELETE,OPTIONS'}],body:Buffer.from(JSON.stringify({success:true,data:[]})).toString('base64')});return;}
  if(delaySkills&&p.request.url.includes('/Skills-')){delayed=p.requestId;return;}
  if(failDocuments&&p.request.url.includes('/Documents-')){failDocuments=false;call('Fetch.failRequest',{requestId:p.requestId,errorReason:'Failed'});return;}
  call('Fetch.continueRequest',{requestId:p.requestId});
 });
 await call('Network.enable');await call('Network.setCacheDisabled',{cacheDisabled:true});
 await call('Fetch.enable',{patterns:[{urlPattern:'http://localhost:5000/api/*'},{urlPattern:'http://127.0.0.1:5197/assets/*.js'}]});
 await call('Page.enable');await call('Page.bringToFront');
 await call('Page.addScriptToEvaluateOnNewDocument',{source:`if(!sessionStorage.getItem('bundle-audit-unauth')){localStorage.setItem('token','browser-fixture-only');localStorage.setItem('user',JSON.stringify({_id:'browser-fixture',email:'fixture@example.test',name:'Browser fixture',role:'admin'}));}else{localStorage.removeItem('token');localStorage.removeItem('user');}const originalFetch=window.fetch.bind(window);window.__auditRequests=[];window.fetch=(url,options)=>{if(!String(url).includes('localhost:5000/api'))return originalFetch(url,options);window.__auditRequests.push(String(url));return Promise.resolve(new Response(JSON.stringify(String(url).includes('/auth/')?{success:false,message:'Audit rejection'}:{success:true,data:[]}),{status:String(url).includes('/auth/')?400:200,headers:{'Content-Type':'application/json'}}));};`});
 const evaluate=async expression=>{const result=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(result.exceptionDetails)throw Error(JSON.stringify(result.exceptionDetails));return result.result.value;};
 await call('Runtime.enable');
 const errors=[],consoleErrors=[];ws.addEventListener('message',({data})=>{const m=JSON.parse(data);if(m.method==='Runtime.consoleAPICalled'&&m.params.type==='error')consoleErrors.push(m.params.args.map(a=>a.value||a.description||a.type).join(' '));if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);});

 const waitFor=async(expression)=>{for(let i=0;i<160;i++){if(await evaluate(expression))return;await delay(50);}throw Error('Timed out: '+expression);};
 const navigate=async(path)=>{await call('Page.navigate',{url:'http://127.0.0.1:5197'+path});await waitFor("Boolean(document.querySelector('h1,h2'))&&!document.querySelector('.route-feedback[role=status]')");};
 await navigate('/');
 assert.ok(!requested.some(url=>/\/(Roadmap|Documents|Activities|Settings)-/.test(url)),'Landing fetched deferred features');
 const initialScripts=[...requested];
 const routes=['/login','/register','/forgot-password','/reset-password','/dashboard','/profile','/projects','/resume','/roadmap','/skills','/dsa','/interview','/jobs','/notifications','/github','/knowledge','/progress','/activities','/documents','/settings','/admin/users','/admin/evidence','/admin/data'];
 for(const route of routes){await navigate(route);assert.equal(await evaluate('location.pathname'),route);assert.equal(await evaluate("Boolean(document.querySelector('.route-feedback[role=alert]'))"),false,route);await call('Page.reload');await waitFor("Boolean(document.querySelector('h1,h2'))&&!document.querySelector('.route-feedback[role=status]')");assert.equal(await evaluate('location.pathname'),route);}
 assert.equal(errors.length,0,JSON.stringify(errors));assert.equal(consoleErrors.length,0,JSON.stringify(consoleErrors));
 // Authentication redirect still takes place before protected content renders.
 await evaluate("sessionStorage.setItem('bundle-audit-unauth','1')");await navigate('/roadmap');await waitFor("location.pathname==='/login'&&Boolean(document.querySelector('#login-email'))");assert.equal(await evaluate("Boolean(document.querySelector('.app-main'))"),false);
 await evaluate("sessionStorage.removeItem('bundle-audit-unauth')");await navigate('/dashboard');
 // Hold a real production chunk request while checking that the existing shell survives.
 delaySkills=true;await evaluate("window.__originalSidebar=document.querySelector('.sidebar');document.querySelector('a[href=\"/skills\"]').click()");
 for(let i=0;i<100&&!delayed;i++)await delay(50);assert.ok(delayed,'Skills chunk was not requested');
 await waitFor("Boolean(document.querySelector('.app-main .route-feedback[role=status], .dashboard-page'))");
 assert.equal(await evaluate("window.__originalSidebar===document.querySelector('.sidebar')"),true);
 delaySkills=false;await call('Fetch.continueRequest',{requestId:delayed});await waitFor("Boolean(document.querySelector('.skills-page'))&&!document.querySelector('.route-feedback[role=status]')");
 // React Router transitions may retain the previous page during navigation.
 // A direct load has no previous page, so it must show the Suspense status.
 delayed=null;delaySkills=true;await call('Page.navigate',{url:'http://127.0.0.1:5197/skills'});
 for(let i=0;i<100&&!delayed;i++)await delay(50);assert.ok(delayed);
 await waitFor("Boolean(document.querySelector('.app-main .route-feedback[role=status]'))");assert.equal(await evaluate("Boolean(document.querySelector('.sidebar'))"),true);
 delaySkills=false;await call('Fetch.continueRequest',{requestId:delayed});await waitFor("Boolean(document.querySelector('.skills-page'))&&!document.querySelector('.route-feedback[role=status]')");
 // A failed chunk must produce a recoverable message, not a blank application.
 await navigate('/dashboard');failDocuments=true;await evaluate("document.querySelector('a[href=\"/documents\"]').click()");await waitFor("Boolean(document.querySelector('.app-main .route-feedback[role=alert]'))");assert.equal(await evaluate("Boolean(document.querySelector('.sidebar'))"),true);
 await evaluate("document.querySelector('a[href=\"/dashboard\"]').click()");await waitFor("Boolean(document.querySelector('.dashboard-page'))&&!document.querySelector('.route-feedback[role=alert]')");
 await evaluate("document.querySelector('a[href=\"/documents\"]').click()");await waitFor("Boolean(document.querySelector('.route-feedback[role=alert] button'))");
 await evaluate("document.querySelector('.route-feedback[role=alert] button').click()");await waitFor("Boolean(document.querySelector('.documents-page'))&&!document.querySelector('.route-feedback[role=alert]')");
 assert.ok(errors.every(message=>message.includes('dynamically imported module')),JSON.stringify(errors));
 assert.ok(consoleErrors.every(message=>message.includes('dynamically imported module')||message.includes('Page failed to load:')),JSON.stringify(consoleErrors));
 assert.ok(failed.every(item=>item.url?.includes('/Documents-')),JSON.stringify(failed));assert.equal(httpErrors.length,0,JSON.stringify(httpErrors));
 const report={productionPreview:true,mockedAPI:true,initialScripts,routesIncludingLanding:routes.length+1,directNavigationAndRefresh:true,unauthenticatedRedirect:true,delayedChunkKeepsShell:true,directLoadShowsSuspense:true,failedChunkShowsError:true,navigationAfterError:true,reloadRecovers:true,expectedFailedChunks:failed,unexpectedHTTPErrors:httpErrors,expectedReactErrors:consoleErrors.length,unexpectedRuntimeExceptions:errors.filter(message=>!message.includes('dynamically imported module'))};
 console.log(JSON.stringify(report,null,2));if(process.env.UI_AUDIT_RESULT)await writeFile(process.env.UI_AUDIT_RESULT,JSON.stringify(report,null,2));
}finally{if(ws)ws.close();if(chrome){chrome.kill('SIGTERM');await once(chrome,'exit').catch(()=>{});}vite.kill('SIGTERM');await rm(profile,{recursive:true,force:true,maxRetries:10,retryDelay:200});}
