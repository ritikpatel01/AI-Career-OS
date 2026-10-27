// Application contracts use inert fixtures; no live inference, storage, or deployment.
const task=(topic,difficulty,slug,title,prompt,objective,requirements,cases,hints,explanation,solution,checks=null)=>({
    id:`ai-apps-${slug}-v1`,career:'AI Engineer',phase:'AI Applications',topic,title,difficulty,
    kind:checks===null?'written':'coding',language:checks===null?'Engineering review':'JavaScript',
    estimatedTime:difficulty==='Easy'?'20–30 minutes':difficulty==='Medium'?'35–55 minutes':'55–90 minutes',
    problemStatement:prompt,simplerProblem:objective,
    learningObjectives:[objective,'Verify application boundary cases and identify guarantees requiring live integration tests.'],
    prerequisites:['JavaScript ES2022 and standard Web APIs; no external packages required','Trusted authenticated context and inert fixtures; no real user data or external actions'],
    conceptsToReview:[topic,objective],requirements,
    examples:cases.map(([input,output])=>({input,output,explanation})),tests:cases.map(([input,expected],i)=>({name:`Acceptance case ${i+1}`,input,expected})),
    hints,approach:explanation,walkthrough:cases.map(([input,output])=>`${input} → ${output}`).join('\n')+'\n'+explanation,
    solutionCode:solution,solutionLines:[explanation,...hints],completionCriteria:requirements,
    starterCode:checks===null?'Decision, evidence, failure states, and acceptance criteria:\n':'// Implement the stated application contract.\n',
    commonMistakes:[],followUp:'Add a failure case and specify which behavior requires an authenticated or live integration check.',referenceChecks:checks
});
export const AI_APPLICATIONS_PRACTICE=[
    task('AI Chatbot','Easy','chat-submission','Validate a user chat submission without accepting role overrides',
        'Validate an AI chatbot request body with exactly conversationId,requestId,text string fields. IDs must be nonblank and at most 100 code units; text must be nonblank and at most 4000 code units. Reject role, tenant, systemPrompt, and all other extra keys. Return a copied body; ownership must be checked from authenticated context separately.',
        'Keep user text distinct from application-owned prompt and identity settings.',
        ['Reject missing, inherited, nonstring, oversized, and extra fields.','Do not trim into a different stored identifier or accept client-selected privileged roles.'],
        [['Three valid fields','Independent validated body'],['Body adds role=system','Rejected']],
        ['Inspect exact own keys before reading values.','A valid conversation ID is not proof that the user owns it.'],
        'Chat endpoints need a narrow public request contract. User messages remain user data even when their text resembles instructions or JSON roles. Application prompts and authenticated scope belong to trusted server state, while token budgeting follows separately.',
        String.raw`function chatSubmission(body){
  const keys=['conversationId','requestId','text'];if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).length!==3||!keys.every(k=>Object.hasOwn(body,k)&&typeof body[k]==='string'&&body[k].trim()&&body[k].length<=(k==='text'?4000:100)))throw new Error('Invalid chat body');
  return Object.fromEntries(keys.map(k=>[k,body[k]]));
}`,
        String.raw`const b={conversationId:'c',requestId:'r',text:'Hi'};eq(chatSubmission(b),b);assert.notEqual(chatSubmission(b),b);assert.throws(()=>chatSubmission({...b,role:'system'}));assert.throws(()=>chatSubmission({...b,text:' '}));`),
    task('AI Chatbot','Easy','history-render','Build a scoped transcript view that labels incomplete answers',
        'Return display records from trusted stored chat rows after filtering by the authenticated conversation ID and user ID. Each eligible row is user/assistant with status complete,streaming,or failed and string text. Include a displayStatus so partial/failed assistant text is not silently presented as a completed answer. Return plain strings, not HTML.',
        'Separate conversation display state from completed model-history content.',
        ['Exclude other users/conversations before building the display projection.','Reject malformed eligible rows and preserve storage order without mutating them.'],
        [['Assistant row status failed with partial text','Display as failed, not complete'],['A row belongs to another user','Excluded']],
        ['Rendering a transcript and assembling a model prompt need different policies.','UI consumers should use escaped text rendering rather than raw HTML insertion.'],
        'A usable chatbot makes incomplete responses visible and keeps private conversations isolated. A plain display projection does not itself sanitize an HTML sink or authorize a database query. The real storage read must enforce the same authenticated boundary.',
        String.raw`function transcriptView(rows,userId,conversationId){
  if(![userId,conversationId].every(x=>typeof x==='string'&&x.trim()))throw new Error('Invalid scope');
  return rows.filter(r=>r.userId===userId&&r.conversationId===conversationId).map(r=>{if(!['user','assistant'].includes(r.role)||!['complete','streaming','failed'].includes(r.status)||typeof r.text!=='string')throw new Error('Invalid stored row');return {id:r.id,role:r.role,text:r.text,displayStatus:r.status};});
}`,
        String.raw`const rows=[{id:'a',userId:'u',conversationId:'c',role:'assistant',status:'failed',text:'partial'},{id:'b',userId:'other',conversationId:'c',role:'user',status:'complete',text:'private'}];eq(transcriptView(rows,'u','c'),[{id:'a',role:'assistant',text:'partial',displayStatus:'failed'}]);assert.equal(rows[0].status,'failed');`),
    task('AI Chatbot','Easy','stream-turn','Apply ordered deltas only to the active assistant request',
        'Implement a local AI chatbot delta reducer for state {requestId,nextSequence,status,text}. Accept only a matching request ID and exact sequence while status=streaming; delta text must be a string. Return a new state with appended text and nextSequence+1. Reject late responses from a previous request or deltas after completion.',
        'Prevent stale asynchronous responses from contaminating another chat turn.',
        ['Validate nonnegative safe sequence numbers and reject sequence overflow.','Never update a different request or modify the input state.'],
        [['Active r1 expects sequence 0, receives r1 delta 0','Append and expect sequence 1'],['A delayed r0 delta arrives','Rejected']],
        ['An active request key is more reliable than whichever bubble is last in the DOM.','Streaming text is not yet a verified final response.'],
        'Chat streaming is an application state machine around an asynchronous transport. Request identity and sequence guards make out-of-order behavior explicit. A real provider adapter must define framing, completion, cancellation, and reconnection semantics separately.',
        String.raw`function appendChatDelta(state,event){
  if(state.status!=='streaming'||event.requestId!==state.requestId||!Number.isSafeInteger(state.nextSequence)||state.nextSequence<0||state.nextSequence===Number.MAX_SAFE_INTEGER||event.sequence!==state.nextSequence||typeof event.text!=='string'||typeof state.text!=='string')throw new Error('Unexpected chat delta');
  return {...state,text:state.text+event.text,nextSequence:state.nextSequence+1};
}`,
        String.raw`const s={requestId:'r1',nextSequence:0,status:'streaming',text:''};eq(appendChatDelta(s,{requestId:'r1',sequence:0,text:'Hi'}),{...s,nextSequence:1,text:'Hi'});assert.equal(s.text,'');assert.throws(()=>appendChatDelta(s,{requestId:'r0',sequence:0,text:'stale'}));assert.throws(()=>appendChatDelta({...s,status:'complete'},{requestId:'r1',sequence:0,text:'late'}));`),
    task('AI Chatbot','Medium','ndjson-stream','Decode framed chat events across UTF-8 network boundaries',
        'Implement a local parser for the application’s own UTF-8 NDJSON stream, not an assumed provider protocol. Input is an array of Uint8Array network fragments; every nonblank JSON record must end with LF. Decode incrementally with fatal UTF-8 errors, parse complete lines only, ignore blank lines, and reject an unfinished final record. Enforce a supplied per-record UTF-16 code-unit limit before JSON parsing.',
        'Preserve Unicode and record framing when network chunks split arbitrary bytes.',
        ['Use TextDecoder streaming mode and flush it at the end.','Return parsed records in order without guessing or repairing truncated JSON.'],
        [['A multibyte é is split across network fragments','One correctly decoded record'],['Final record lacks LF','Rejected incomplete framing']],
        ['Network chunks are neither character nor JSON-record boundaries.','Real SSE or provider-specific streams need their own documented adapter.'],
        'Streaming applications must distinguish transport chunks from application frames. An incremental UTF-8 decoder handles split code points, while line buffering handles split JSON records. This fixture parser collects results for testing; production consumers should emit records incrementally and enforce connection-wide limits too.',
        String.raw`function parseChatNDJSON(chunks,maxRecordUnits){
  if(!Number.isSafeInteger(maxRecordUnits)||maxRecordUnits<1)throw new Error('Invalid record limit');const decoder=new TextDecoder('utf-8',{fatal:true}),records=[];let buffer='';
  function drain(){let end;while((end=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,end);buffer=buffer.slice(end+1);if(line.length>maxRecordUnits)throw new Error('Oversized record');if(line.trim())records.push(JSON.parse(line));}if(buffer.length>maxRecordUnits)throw new Error('Oversized partial record');}
  for(const bytes of chunks){buffer+=decoder.decode(bytes,{stream:true});drain();}buffer+=decoder.decode();drain();if(buffer.trim())throw new Error('Unfinished record');return records;
}`,
        String.raw`const bytes=new TextEncoder().encode('{"text":"é"}\n');const split=bytes.indexOf(0xc3)+1;eq(parseChatNDJSON([bytes.slice(0,split),bytes.slice(split)],100),[{text:'é'}]);assert.throws(()=>parseChatNDJSON([new TextEncoder().encode('{"x":1}')],100));assert.throws(()=>parseChatNDJSON([Uint8Array.from([0xff])],100));assert.throws(()=>parseChatNDJSON([bytes],2));`),
    task('AI Chatbot','Medium','context-history','Assemble model history from complete pairs under an exact counter',
        'Build chatbot model messages from an application-owned system instruction, complete historical user/assistant pairs, and a current user message. Ignore historical pairs not marked complete. Use a supplied exact whole-message token counter and input budget to retain the newest fitting suffix of complete pairs. Throw if system plus current message alone exceeds budget.',
        'Prevent partial/error responses and accidental token estimates from entering model context.',
        ['Keep both messages of every retained historical pair and preserve chronological order.','Do not feed failed streaming fragments back as authoritative completed assistant answers.'],
        [['One failed pair and two complete pairs','Only complete pairs are eligible'],['Mandatory messages exceed the input budget','Explicit overflow rather than silently dropping instructions']],
        ['The actual adapter must count role serialization and any configured tool definitions.','Budget output reserve before calculating the allowed input budget.'],
        'Application history can contain delivery and draft states that are unsuitable as model context. Exact counting belongs to the selected model adapter. Dropping old pairs can remove useful facts, so context policies need task-level evaluation beyond this packing contract.',
        String.raw`function chatModelHistory(instruction,pairs,current,inputBudget,count){
  if(!Number.isSafeInteger(inputBudget)||inputBudget<0)throw new Error('Invalid input budget');const base=[{role:'system',content:instruction}],latest={role:'user',content:current};
  const measure=messages=>{const n=count(messages);if(!Number.isSafeInteger(n)||n<0)throw new Error('Invalid tokenizer count');return n;};
  if(measure([...base,latest])>inputBudget)throw new Error('Mandatory context exceeds budget');const valid=pairs.filter(p=>p.status==='complete');
  for(let start=0;start<=valid.length;start++){const messages=[...base,...valid.slice(start).flatMap(p=>[{role:'user',content:p.user},{role:'assistant',content:p.assistant}]),latest];if(measure(messages)<=inputBudget)return messages;}throw new Error('No context fits');
}`,
        String.raw`const pairs=[{status:'complete',user:'old',assistant:'old answer'},{status:'failed',user:'bad',assistant:'partial'},{status:'complete',user:'new',assistant:'new answer'}];eq(chatModelHistory('s',pairs,'q',4,m=>m.length).map(m=>m.content),['s','new','new answer','q']);assert.throws(()=>chatModelHistory('s',[],'q',1,m=>m.length));`),
    task('AI Chatbot','Medium','retry-ui','Choose retry behavior from the server’s authoritative request status',
        'Implement a chatbot reconnect decision from server request status absent,running,complete,failed and whether the client has partial text. Absent means resubmit_same_request_id; running means reconnect_existing; complete means fetch_complete; failed means show_failure with preservePartial matching the boolean. Never create a new logical request merely because a stream connection dropped.',
        'Keep reconnection separate from duplicate generation and conversation writes.',
        ['Validate status/partial flag and return an explicit UI action.','Use the server’s authenticated status endpoint and idempotent request contract in a real integration.'],
        [['Stream dropped but server says running','Reconnect to the existing request'],['Server says complete though client has only a fragment','Fetch the persisted complete response']],
        ['A disconnected socket does not establish model failure.','Preserve visible partial text as partial rather than calling it a successful answer.'],
        'Application retry policy must coordinate user experience and server request identity. A fresh generation can duplicate history or charges if the original is still active. This pure mapper assumes reliable authenticated status and does not establish persistence or provider idempotency.',
        String.raw`function chatReconnect(status,hasPartial){
  if(typeof hasPartial!=='boolean'||!['absent','running','complete','failed'].includes(status))throw new Error('Invalid request state');
  const actions={absent:'resubmit_same_request_id',running:'reconnect_existing',complete:'fetch_complete',failed:'show_failure'};
  return {action:actions[status],preservePartial:status==='failed'?hasPartial:false};
}`,
        String.raw`eq(chatReconnect('running',true),{action:'reconnect_existing',preservePartial:false});eq(chatReconnect('complete',true),{action:'fetch_complete',preservePartial:false});eq(chatReconnect('failed',true),{action:'show_failure',preservePartial:true});assert.throws(()=>chatReconnect('unknown',false));`),
    task('AI Chatbot','Hard','stream-reconciliation','Reconcile acknowledged chat events after reconnection',
        'Given a client’s last applied sequence (−1 before any event) and a server-replayed sequence-sorted event list for one request, return only events after the acknowledgment. Require the replay to be strictly increasing with no duplicate sequences; new events must start at lastApplied+1 and be contiguous. Older acknowledged events may be omitted. Reject wrong request IDs and gaps instead of producing corrupted chat text.',
        'Make stream resumption testable without applying the same text twice.',
        ['Validate nonnegative safe event sequences and a safe acknowledgment >=−1.','Return copied unapplied events, preserving order; replay retention and atomic acknowledgments need a backend protocol.'],
        [['Client applied through 1, replay has 0,1,2,3','Apply only 2 and 3'],['Client applied through 1, first new event is 3','Reject missing event 2']],
        ['Deduplicating by text would incorrectly remove legitimate repeated words.','Event sequence identity is scoped to the request.'],
        'Reconnection requires explicit resume semantics. Sequence-based reconciliation avoids duplicate rendering and detects lost frames, but cannot supply events already discarded by the server. A live application needs retention/expiry and full-response recovery behavior.',
        String.raw`function reconcileChatEvents(requestId,lastApplied,events){
  if(!Number.isSafeInteger(lastApplied)||lastApplied< -1)throw new Error('Invalid acknowledgment');let prior=-1,next=lastApplied+1;const out=[];
  for(const e of events){if(e.requestId!==requestId||!Number.isSafeInteger(e.sequence)||e.sequence<0||e.sequence<=prior)throw new Error('Invalid replay');prior=e.sequence;if(e.sequence<=lastApplied)continue;if(e.sequence!==next)throw new Error('Replay gap');out.push({...e});next++;}return out;
}`,
        String.raw`const rows=[0,1,2,3].map(sequence=>({requestId:'r',sequence,text:'x'}));eq(reconcileChatEvents('r',1,rows).map(x=>x.sequence),[2,3]);assert.throws(()=>reconcileChatEvents('r',1,[rows[3]]));assert.throws(()=>reconcileChatEvents('other',1,rows));assert.throws(()=>reconcileChatEvents('r',1,[rows[2],rows[2]]));`),
    task('AI Chatbot','Hard','chat-quality','Evaluate a chatbot beyond a smooth streaming demo',
        'Design a release evaluation for a support chatbot covering multi-turn corrections, long history, unsupported questions, interrupted streams, unsafe content in retrieved text, and user/session isolation. Separate response quality from transport correctness and do not use a fluent demo as evidence of reliability.',
        'Measure complete conversational behavior and failure recovery under declared acceptance gates.',
        ['Use independent reviewed task outcomes for helpfulness, factual support, and appropriate abstention.','Test stream interruption/reconnect, cancellation, duplicate submission, and cross-user history boundaries with controlled fixtures and live checks separately.'],
        [['Chat corrects a prior user fact after a long conversation','Verify it uses the correction under the real context policy'],['Connection fails after partial text','UI shows partial/failure state and avoids duplicate logical turns']],
        ['Conversation quality needs multi-turn cases rather than unrelated single prompts.','A successful mocked stream cannot verify the live provider or database.'],
        'A chatbot integrates model behavior with request ownership, context management, and asynchronous delivery. Each layer can fail independently. Quality and privacy checks should gate release alongside latency and recovery metrics.',
        'Version model/prompt/context settings and create independent multi-turn cases with corrections, ambiguity, conflicting evidence, unsafe instructions, and unanswerable requests. Score verified task utility, factual support, abstention, tone, and consistency using reviewed rubrics; calibrate automated judges. Test transport and UI state with fragmented UTF-8, truncated frames, timeouts, duplicate submissions, stale responses, cancellation, and reconnect. Exercise authenticated session ownership and saved-history reload against the actual backend separately from mocks. Track first-token/full-response latency, tokens/cost, failures, and privacy violations with explicit populations. Freeze the policy on development results, evaluate held-out conversations, and retain monitoring/rollback.'),
    task('AI Chatbot','Hard','chat-persistence','Design durable conversation writes across model and network failures',
        'A chatbot must save each user turn once and preserve the final assistant answer across reloads while allowing partial stream display. Design a persistence protocol for duplicate submits, concurrent tabs, provider errors, reconnects, and cancelled requests without replacing existing user data or treating every partial fragment as complete history.',
        'Coordinate conversation ownership, request identity, and terminal state persistence.',
        ['Bind conversation/request identity to authenticated scope and use atomic uniqueness/state transitions.','Define partial versus complete storage and verify recovery with real authenticated save/reload tests.'],
        [['Two tabs submit the same request ID','One logical request/turn under the declared idempotency contract'],['Server completes after client disconnect','Persist terminal response so authorized reload can recover it']],
        ['A browser-local flag cannot enforce cross-process idempotency.','Model completion and delivery completion are distinct events.'],
        'Durable chat behavior requires server coordination around asynchronous inference. Local reducers and mock API tests are useful but cannot prove real database uniqueness, ownership, or crash recovery.',
        'Define authenticated conversation ownership and a request table keyed by owner/conversation/client request ID. Atomically record the user turn and reserved generation intent, then transition through running/complete/failed/cancelled with version checks. Keep partial stream buffers explicitly provisional and bound retention; only accepted terminal answers enter ordinary model history. Persist final content and usage before acknowledging durable completion, with a reconciliation path for uncertain provider outcomes. On reconnect return scoped request status and replay/full-response options; never blindly start a new generation. Test duplicate/concurrent submits, restart at each boundary, cancellation races, session isolation, and reload using the actual backend/database without resetting existing progress.'),
    task('RAG Application','Easy','ingestion-admission','Bind an ingestion request to server-issued document ownership',
        'Create an ingestion job from trusted authenticated {tenantId,userId}, a server-issued documentId, and upload metadata {name,size,type}. Admit only text/plain or application/pdf with positive safe integer size<=maxBytes. Return queued ownership metadata; ignore any client owner/path fields. MIME metadata is an admission hint, not proof of file content safety or successful extraction.',
        'Keep uploaded documents and asynchronous ingestion scoped to their authenticated owner.',
        ['Validate IDs, filename display text, size limit, and supported declared type.','Never derive a storage path or fetch an arbitrary URL from the client filename.'],
        [['Valid PDF metadata and trusted user u','Queued job owned by u'],['Oversized upload or unsupported declared type','Rejected before queueing']],
        ['Ownership comes from authenticated context rather than the request body.','Actual content validation, extraction, malware policy, and resource limits are separate integration steps.'],
        'A RAG ingestion endpoint must establish provenance before parsing and embedding. Admission checks do not make a document searchable or prove a parser supports it. Storage keys, byte validation, extraction timeouts, and publication belong to a controlled backend pipeline.',
        String.raw`function ingestionJob(context,documentId,file,maxBytes){
  if(![context?.tenantId,context?.userId,documentId].every(x=>typeof x==='string'&&x.trim())||!Number.isSafeInteger(maxBytes)||maxBytes<1||typeof file?.name!=='string'||!file.name.trim()||!Number.isSafeInteger(file.size)||file.size<1||file.size>maxBytes||!['text/plain','application/pdf'].includes(file.type))throw new Error('Upload rejected');
  return {tenantId:context.tenantId,userId:context.userId,documentId,name:file.name,size:file.size,type:file.type,status:'queued'};
}`,
        String.raw`const job=ingestionJob({tenantId:'t',userId:'u'},'d',{name:'notes.pdf',size:20,type:'application/pdf',userId:'attacker'},100);assert.equal(job.userId,'u');assert.equal(job.status,'queued');assert.throws(()=>ingestionJob({tenantId:'t',userId:'u'},'d',{name:'x',size:101,type:'text/plain'},100));`),
    task('RAG Application','Easy','citation-list','Build numbered citation labels from selected evidence',
        'Given an already authorized ordered context list with unique nonblank chunkId,documentId and nonblank title, return display citations numbered from one. Keep identifiers and titles as plain data, not HTML or generated external URLs. Reject duplicate chunk IDs so citation numbers are unambiguous.',
        'Connect a user-visible citation label to the exact supplied evidence chunk.',
        ['Preserve context order and use stable stored identifiers.','Do not infer source titles or links from model text.'],
        [['Two context chunks from the same document','Two distinct chunk citation labels'],['Two entries reuse one chunkId','Rejected ambiguity']],
        ['Document identity and chunk identity serve different purposes.','A valid label does not prove the cited text supports the generated claim.'],
        'Citations need an application-owned evidence map rather than free-form model links. Displaying stable IDs enables a separately authorized source viewer. Semantic support and source freshness require additional validation beyond label construction.',
        String.raw`function citationLabels(context){
  if(new Set(context.map(c=>c.chunkId)).size!==context.length||!context.every(c=>['chunkId','documentId','title'].every(k=>typeof c[k]==='string'&&c[k].trim())))throw new Error('Invalid citation map');
  return context.map((c,index)=>({number:index+1,chunkId:c.chunkId,documentId:c.documentId,title:c.title}));
}`,
        String.raw`eq(citationLabels([{chunkId:'c',documentId:'d',title:'Notes'}]),[{number:1,chunkId:'c',documentId:'d',title:'Notes'}]);assert.throws(()=>citationLabels([{chunkId:'c',documentId:'d',title:'A'},{chunkId:'c',documentId:'d',title:'B'}]));`),
    task('RAG Application','Easy','answer-state','Render supported and no-evidence responses as distinct states',
        'Map a validated RAG response into UI text using status supported or insufficient_evidence. Supported requires nonblank answer and a nonempty citation list. Insufficient evidence returns a fixed explanatory message and no citations. Reject unknown states and unsupported answers without citations; do not present a retrieval failure as a confident answer.',
        'Make abstention a normal application outcome instead of a broken empty panel.',
        ['Expose a plain-text answer and explicit status for consumers.','Do not treat citation presence as semantic proof; the upstream support check remains required.'],
        [['insufficient_evidence','Clear no-evidence message with empty citations'],['supported answer with no citations','Rejected contract violation']],
        ['No evidence and a transport error are different application states.','The UI should not fill missing evidence with invented claims.'],
        'A document-answer application needs a clear unsupported outcome. Schema and citation checks are necessary but insufficient for grounding; the application must evaluate whether cited context actually supports the answer and remains authorized.',
        String.raw`function ragAnswerView(result){
  if(result?.status==='insufficient_evidence')return {status:'insufficient_evidence',text:'The supplied documents do not provide enough evidence to answer.',citations:[]};
  if(result?.status!=='supported'||typeof result.answer!=='string'||!result.answer.trim()||!Array.isArray(result.citations)||!result.citations.length)throw new Error('Invalid RAG answer');
  return {status:'supported',text:result.answer,citations:[...result.citations]};
}`,
        String.raw`assert.equal(ragAnswerView({status:'insufficient_evidence'}).citations.length,0);assert.throws(()=>ragAnswerView({status:'supported',answer:'A',citations:[]}));assert.equal(ragAnswerView({status:'supported',answer:'A',citations:['c1']}).text,'A');`),
    task('RAG Application','Medium','publication-check','Keep a document unsearchable until the complete embedding manifest is ready',
        'Given expected unique chunk IDs and embedding rows {chunkId,spaceRevision,vector}, decide whether one document revision is ready to publish. Require at least one expected chunk, exactly one row per expected ID, matching spaceRevision, and dense finite vectors of configured positive dimension. Return false for partial, extra, duplicate, or invalid rows. This predicate does not perform the atomic publication.',
        'Prevent half-ingested documents from becoming visible to answers.',
        ['Validate complete ID coverage and every vector coordinate before readiness.','An empty extraction is not a successfully indexed document; route it to an explicit empty/error state.'],
        [['Two expected chunks but one embedded row','Not ready'],['All rows valid under one configured space revision','Ready for a separate versioned publish step']],
        ['Counting rows alone misses duplicate IDs and stale model versions.','The active revision pointer must switch only after readiness is checked under a consistent snapshot.'],
        'Ingestion spans parsing, chunking, embeddings, and storage, any of which can fail partially. A complete manifest guards the publication boundary. Real consistency and retry behavior require an authoritative revision protocol and live backend tests.',
        String.raw`function readyDocument(expected,rows,revision,dimension){
  if(!expected.length||!expected.every(id=>typeof id==='string'&&id.trim())||new Set(expected).size!==expected.length||!Number.isSafeInteger(dimension)||dimension<1||typeof revision!=='string'||!revision||rows.length!==expected.length)return false;
  const allowed=new Set(expected),seen=new Set();for(const row of rows){if(!allowed.has(row.chunkId)||seen.has(row.chunkId)||row.spaceRevision!==revision||!Array.isArray(row.vector)||row.vector.length!==dimension)return false;for(let i=0;i<dimension;i++)if(!Object.hasOwn(row.vector,i)||!Number.isFinite(row.vector[i]))return false;seen.add(row.chunkId);}return true;
}`,
        String.raw`const a={chunkId:'a',spaceRevision:'r',vector:[1,0]},b={chunkId:'b',spaceRevision:'r',vector:[0,1]};assert.equal(readyDocument(['a','b'],[a],'r',2),false);assert.equal(readyDocument(['a','b'],[b,a],'r',2),true);assert.equal(readyDocument(['a','b'],[a,a],'r',2),false);assert.equal(readyDocument([],[],'r',2),false);`),
    task('RAG Application','Medium','context-envelope','Assemble authorized evidence and its citation map under one token counter',
        'Build a RAG context JSON array from ranked rows {chunkId,tenantId,allowedUsers,text}. Filter by trusted tenant/user before serialization, deduplicate chunk IDs, and greedily include whole rows that fit a supplied exact token counter over the entire serialized array. Each serialized entry has citationId=chunkId and text. Never truncate text silently or include unauthorized rows in the counter input.',
        'Keep prompt context and citation identity synchronized at the application boundary.',
        ['Require a nonnegative integer token budget and valid counter outputs.','If even the empty-array envelope exceeds budget, throw; skip large authorized rows and continue to smaller ones.'],
        [['Unauthorized high-ranked chunk and one allowed chunk','Only allowed text enters serialized context'],['Large allowed row does not fit, later small one fits','Include the smaller whole row']],
        ['Counting independent chunks can miss wrapper/separator token costs.','JSON quoting preserves structure but does not neutralize prompt injection by itself.'],
        'Context assembly is where authorization, serialization, budget, and citations meet. A trusted exact counter must use the selected model’s tokenization rules. Treat source text as untrusted data and keep tool/control permissions outside generated content.',
        String.raw`function ragContext(rows,scope,budget,count){
  if(![scope?.tenantId,scope?.userId].every(x=>typeof x==='string'&&x.trim())||!Number.isSafeInteger(budget)||budget<0)throw new Error('Invalid context scope');
  const measure=text=>{const n=count(text);if(!Number.isSafeInteger(n)||n<0)throw new Error('Invalid token count');return n;};if(measure('[]')>budget)throw new Error('Envelope exceeds budget');
  const selected=[],seen=new Set();for(const row of rows){if(row.tenantId!==scope.tenantId||!row.allowedUsers.includes(scope.userId)||seen.has(row.chunkId))continue;seen.add(row.chunkId);const candidate=[...selected,{citationId:row.chunkId,text:row.text}];if(measure(JSON.stringify(candidate))<=budget)selected.push(candidate[candidate.length-1]);}return JSON.stringify(selected);
}`,
        String.raw`const rows=[{chunkId:'secret',tenantId:'other',allowedUsers:['u'],text:'private'},{chunkId:'a',tenantId:'t',allowedUsers:['u'],text:'A'}];const observed=[];const result=ragContext(rows,{tenantId:'t',userId:'u'},100,text=>{observed.push(text);return text.length});eq(JSON.parse(result),[{citationId:'a',text:'A'}]);assert.ok(observed.every(text=>!text.includes('private')));assert.throws(()=>ragContext([], {tenantId:'t',userId:'u'},1,text=>text.length));`),
    task('RAG Application','Medium','citation-refresh','Revalidate citation access and revision when opening a source',
        'Resolve a cited context chunk against current trusted document records before showing its source. Match tenant, require the authenticated user in allowedUsers, require deleted=false, and require document activeRevision equal the chunk revision. Return a source descriptor or a generic unavailable result. A citation generated earlier must not bypass a later permission revocation or source update.',
        'Treat citation viewing as a fresh authorized read rather than a permanent capability.',
        ['Do not expose whether an unavailable document exists in another tenant.','Use stored source identities/revisions rather than a model-generated URL.'],
        [['Permission was revoked after answer generation','Source unavailable'],['Same active revision and current access','Return source identity descriptor']],
        ['A stored answer can outlive the access state used to generate it.','Changed source revisions need an explicit old-version policy rather than silent substitution.'],
        'Citations are references, not authorization tokens. A source viewer must independently enforce current access and revision policy. This fixture chooses fail-closed when the active revision changes; archival access would require a separately authorized version-store design.',
        String.raw`function openCitation(chunk,documents,scope){
  if(!chunk||![scope?.tenantId,scope?.userId].every(x=>typeof x==='string'&&x.trim()))return {status:'unavailable'};
  const doc=documents.find(d=>d.id===chunk.documentId&&d.tenantId===scope.tenantId&&d.deleted===false&&d.allowedUsers.includes(scope.userId)&&d.activeRevision===chunk.revision);
  return doc?{status:'available',documentId:doc.id,revision:chunk.revision,chunkId:chunk.chunkId}:{status:'unavailable'};
}`,
        String.raw`const chunk={documentId:'d',revision:'r1',chunkId:'c'},doc={id:'d',tenantId:'t',deleted:false,allowedUsers:['u'],activeRevision:'r1'},scope={tenantId:'t',userId:'u'};assert.equal(openCitation(chunk,[doc],scope).status,'available');eq(openCitation(chunk,[{...doc,allowedUsers:[]}],scope),{status:'unavailable'});assert.equal(openCitation(chunk,[{...doc,activeRevision:'r2'}],scope).status,'unavailable');`),
    task('RAG Application','Hard','request-snapshot','Reject mixed document or embedding versions in an answer evidence snapshot',
        'Validate a RAG request snapshot containing unique selected chunk IDs. Every chunk must match the request’s configured embeddingSpace and match the trusted active revision for its tenant/document tuple. Scope all chunks to the authenticated tenant, with current allowedUsers containing the user. Return false for mismatches, duplicates, or missing revision entries. This is a consistent-snapshot predicate, not an atomic database transaction.',
        'Prevent an end-to-end answer from combining stale, incompatible, or unauthorized evidence.',
        ['Use an unambiguous tuple for active-revision lookup and fail closed on duplicate active entries.','Do not allow a query/index model mismatch merely because vector dimensions match.'],
        [['Two chunks from different revisions of the same document','Snapshot invalid'],['All chunks authorized under current revisions and one embedding space','Snapshot eligible']],
        ['Revision metadata must be read with a backend consistency policy.','Eligibility does not prove the final generated claims are supported.'],
        'RAG correctness spans ingestion and answering. A request-local evidence snapshot helps audit exactly which authorized versions supplied an answer, while transactional publication and revocation behavior need storage-level guarantees.',
        String.raw`function validEvidenceSnapshot(chunks,active,scope,space){
  if(![scope?.tenantId,scope?.userId,space].every(x=>typeof x==='string'&&x.trim())||new Set(chunks.map(c=>c.chunkId)).size!==chunks.length)return false;
  const versions=new Map(),key=x=>JSON.stringify([x.tenantId,x.documentId]);for(const row of active){if(versions.has(key(row)))return false;versions.set(key(row),row.revision);}
  return chunks.every(c=>c.tenantId===scope.tenantId&&c.allowedUsers.includes(scope.userId)&&c.embeddingSpace===space&&versions.has(key(c))&&versions.get(key(c))===c.revision);
}`,
        String.raw`const c={chunkId:'c',tenantId:'t',documentId:'d',revision:'r1',embeddingSpace:'s',allowedUsers:['u']},a={tenantId:'t',documentId:'d',revision:'r1'},scope={tenantId:'t',userId:'u'};assert.equal(validEvidenceSnapshot([c],[a],scope,'s'),true);assert.equal(validEvidenceSnapshot([c,{...c,chunkId:'other',revision:'r2'}],[a],scope,'s'),false);assert.equal(validEvidenceSnapshot([c],[a],scope,'different'),false);`),
    task('RAG Application','Hard','document-app-evaluation','Evaluate the document Q&A application across ingestion and answer stages',
        'Design an end-to-end evaluation from upload through source viewing for a private-document Q&A application. Include parser failures, empty documents, chunk boundaries, model compatibility, filtered retrieval, reranking, citation support, source changes, and no-evidence questions. Do not substitute a similarity score for answer correctness.',
        'Trace user-visible failures to the stage that produced them.',
        ['Use independent source/fact labels and stage-specific metrics with explicit denominator/missing-label policies.','Test current authenticated access, source updates/deletions, and partial ingestion in addition to semantic answer quality.'],
        [['Answer is supported but cites a source the user cannot access','Fail the access/citation gate'],['Relevant evidence exists but was omitted by retrieval','Classify as retrieval miss before changing the generator prompt']],
        ['Chunk-ID labels can break when the chunk strategy changes; source facts/spans are more stable.','Local vectors and mock parsers do not validate actual PDF extraction or search integration.'],
        'RAG application quality depends on every boundary from ingestion to viewing evidence. Measuring only fluent generated text hides broken source handling and authorization. The release protocol needs both semantic and deterministic integration checks.',
        'Freeze document revisions and independent source-group splits, then annotate answerability, required facts/spans, and acceptable citations. Test upload limits and real extractors separately, validate complete chunk/vector publication, and verify tenant/current-access filters in actual search. Measure geometric ANN loss separately from labeled evidence recall, ranked relevance, unique fact coverage, and context budgets. Review generated claims for support, answer relevance, uncertainty, and citation entailment. Exercise empty/corrupt uploads, updates, revoked access, deletion, stale citations, conflicting sources, and malicious document instructions. Report task/safety failures, latency, cost, and mock versus live results; select on development data and gate a monitored rollout on held-out application outcomes.'),
    task('RAG Application','Hard','document-lifecycle','Design document deletion and reindexing without stale answers or lost work',
        'A user replaces or deletes a document while ingestion and answer generation are running. Design lifecycle rules for queued jobs, active revisions, cached context, citations, and derived answers. Avoid exposing half-built revisions or returning revoked source data merely because it was cached earlier.',
        'Coordinate asynchronous document work with privacy and provenance boundaries.',
        ['Version ingestion jobs and publish complete revisions through an authoritative protocol.','Define revocation/deletion behavior for in-flight reads, caches, derived artifacts, and retained audit records.'],
        [['Old ingestion job finishes after a newer revision was published','Do not make the stale job active'],['Document is deleted before a citation is opened','Fresh source authorization returns unavailable']],
        ['A vector-store delete acknowledgment may not define every downstream cache guarantee.','Deleting a source can require invalidating summaries or answers derived from it.'],
        'Document lifecycle handling is an application consistency problem, not only a vector update. Privacy policy must define what happens to already delivered and stored answers versus newly requested access. Live guarantees require tests of the actual storage/cache/provider boundaries.',
        'Assign document/revision/job identities and compare the intended active generation before publication. Build new chunks/vectors out of view, validate completeness, then atomically publish or version-gate visibility; reject stale worker completion. On deletion/revocation stop new work, mark authoritative access state, cancel supported in-flight jobs, and invalidate ordinary context/source caches plus traceable derived artifacts. Reauthorize before exposing evidence or opening citations, and define historical-answer/redaction policy explicitly. Reconcile partial vector deletion and retries with durable manifests and retention rules for backups/audits. Test update/delete races, worker restart, stale cache reads, and authenticated source reload against actual services rather than claiming mock predicates establish consistency.'),
    task('AI Career Assistant','Easy','career-profile','Project only declared career-planning profile fields',
        'Build an AI career assistant input profile from a reviewed stored record. Keep goalRole as a nonblank string, skillIds as unique nonblank strings, and weeklyStudyMinutes as a positive integer. Exclude name, contact details, demographic fields, raw resume text, secrets, and all other keys. This projection assumes the user consented to this planning purpose.',
        'Minimize personal information passed into a recommendation model.',
        ['Validate allowed fields and copy the skill list.','Do not infer missing skills, identity attributes, or qualifications from excluded data.'],
        [['Profile includes email and goalRole','Only the planning fields are returned'],['Duplicate skill IDs','Reject instead of silently distorting the profile']],
        ['An explicit projection is easier to audit than a secret-key denylist.','Model input minimization does not replace storage access control or consent.'],
        'Personalization can use task-relevant goals and skills without copying an entire private profile into every prompt. Declared skill IDs are inputs, not proof of competence. A production system needs provenance, consent, retention, and correction controls.',
        String.raw`function careerPlanningProfile(record){
  if(typeof record.goalRole!=='string'||!record.goalRole.trim()||!Array.isArray(record.skillIds)||!record.skillIds.every(x=>typeof x==='string'&&x.trim())||new Set(record.skillIds).size!==record.skillIds.length||!Number.isSafeInteger(record.weeklyStudyMinutes)||record.weeklyStudyMinutes<1)throw new Error('Invalid planning profile');
  return {goalRole:record.goalRole,skillIds:[...record.skillIds],weeklyStudyMinutes:record.weeklyStudyMinutes};
}`,
        String.raw`const p={goalRole:'Backend Developer',skillIds:['js'],weeklyStudyMinutes:120,email:'private@example.test',apiKey:'secret'};eq(careerPlanningProfile(p),{goalRole:'Backend Developer',skillIds:['js'],weeklyStudyMinutes:120});assert.throws(()=>careerPlanningProfile({...p,skillIds:['js','js']}));`),
    task('AI Career Assistant','Easy','skills-gap','Distinguish unknown skill evidence from a measured skills gap',
        'Given a Map of assessed skill levels and required records {skillId,level}, report satisfied, gap, or needs_assessment. Levels are integers 0 through 5. A missing assessment is unknown, not level zero. For known gaps return required−current; otherwise gap=null. Require unique nonblank requirement IDs.',
        'Use evidence-aware skill comparisons instead of treating missing profile data as incompetence.',
        ['Validate required and assessed levels and preserve requirement order.','Do not claim a self-reported or assessed level guarantees job performance.'],
        [['Python assessed 2, required 4','gap with numeric gap 2'],['No Python assessment','needs_assessment and gap null']],
        ['Map.has distinguishes missing evidence from an actual zero assessment.','A level scale needs a documented rubric outside this arithmetic.'],
        'Skills-gap analysis is only as useful as its evidence and scale. Unknown information should prompt assessment or clarification rather than an unsupported negative recommendation. This exercise calculates against a supplied rubric, not an objective universal skill ranking.',
        String.raw`function skillGaps(assessed,required){
  const valid=n=>Number.isInteger(n)&&n>=0&&n<=5;if(new Set(required.map(r=>r.skillId)).size!==required.length||!required.every(r=>typeof r.skillId==='string'&&r.skillId.trim()&&valid(r.level))||![...assessed.values()].every(valid))throw new Error('Invalid skill scale');
  return required.map(r=>{if(!assessed.has(r.skillId))return {skillId:r.skillId,status:'needs_assessment',gap:null};const gap=Math.max(0,r.level-assessed.get(r.skillId));return {skillId:r.skillId,status:gap?'gap':'satisfied',gap:gap||null};});
}`,
        String.raw`eq(skillGaps(new Map([['python',2]]),[{skillId:'python',level:4},{skillId:'sql',level:3}]),[{skillId:'python',status:'gap',gap:2},{skillId:'sql',status:'needs_assessment',gap:null}]);assert.equal(skillGaps(new Map([['python',4]]),[{skillId:'python',level:4}])[0].status,'satisfied');`),
    task('AI Career Assistant','Easy','skill-taxonomy','Resolve profile skill aliases without inventing a canonical skill',
        'Normalize a supplied career skill label by trimming and lowercasing, then resolve it through a trusted alias Map. Return the canonical ID or null if unknown. Validate label and mapped canonical ID. Do not use substring matching that might merge Java with JavaScript, or infer equivalent expertise merely because labels look similar.',
        'Keep skill matching consistent with an explicitly versioned taxonomy.',
        ['Preserve unknown as null for review and keep exact alias lookup.','The alias Map is application-owned and versioned, not supplied by model output.'],
        [['Alias JS maps to javascript','Canonical javascript after normalization'],['Alias java is not in the Map','null rather than JavaScript']],
        ['Case normalization is a defined policy; semantic equivalence needs curated mappings.','An unknown label can be a legitimate skill absent from the taxonomy.'],
        'Taxonomy normalization prevents inconsistent profile and job vocabulary from producing arbitrary matches. Exact curated aliases reduce accidental merges, but mappings should preserve meaning and provenance. Skill identity does not establish proficiency or recency.',
        String.raw`function canonicalSkill(label,aliases){
  if(typeof label!=='string'||!label.trim())throw new Error('Invalid skill label');const key=label.trim().toLowerCase();if(!aliases.has(key))return null;const id=aliases.get(key);if(typeof id!=='string'||!id.trim())throw new Error('Invalid taxonomy entry');return id;
}`,
        String.raw`const aliases=new Map([['js','javascript'],['javascript','javascript']]);assert.equal(canonicalSkill(' JS ',aliases),'javascript');assert.equal(canonicalSkill('java',aliases),null);assert.throws(()=>canonicalSkill(' ',aliases));`),
    task('AI Career Assistant','Medium','study-selection','Select feasible study recommendations from reviewed gaps',
        'Build one study-session proposal from an ordered curated activity catalog {id,skillId,minutes,prerequisiteSkills}. Select activities only for confirmed gap skill IDs, when all prerequisite skills are in a trusted achieved set and the whole activity fits the remaining positive minute budget. Skip oversized/ineligible activities and preserve catalog order. Unknown skills go to assessment, not automatic remedial assignments.',
        'Translate a gap analysis into bounded recommendations without rewriting the source roadmap.',
        ['Validate unique activity IDs and positive integer durations.','Return selected IDs and usedMinutes; this greedy proposal is not an optimal curriculum or a guaranteed learning outcome.'],
        [['A gap activity needs an unachieved prerequisite','Skip until prerequisite is satisfied'],['A large activity does not fit but a later smaller one does','Select the smaller activity']],
        ['Separate the immutable activity catalog from a personalized session proposal.','Study time is a constraint, not proof of mastery after completion.'],
        'Personalized planning must respect prerequisites, known evidence gaps, and realistic capacity. A simple local selector can be tested deterministically, while recommendation quality needs learner outcomes and expert review. It does not alter the application’s actual roadmap order or progress keys.',
        String.raw`function studySession(catalog,gapSkills,achieved,budget){
  if(!Number.isSafeInteger(budget)||budget<1||new Set(catalog.map(a=>a.id)).size!==catalog.length||!catalog.every(a=>Number.isSafeInteger(a.minutes)&&a.minutes>0&&Array.isArray(a.prerequisiteSkills)))throw new Error('Invalid study catalog');
  const ids=[];let usedMinutes=0;for(const a of catalog)if(gapSkills.has(a.skillId)&&a.prerequisiteSkills.every(s=>achieved.has(s))&&a.minutes<=budget-usedMinutes){ids.push(a.id);usedMinutes+=a.minutes;}return {ids,usedMinutes};
}`,
        String.raw`const c=[{id:'blocked',skillId:'sql',minutes:10,prerequisiteSkills:['db-basics']},{id:'large',skillId:'sql',minutes:90,prerequisiteSkills:[]},{id:'small',skillId:'sql',minutes:20,prerequisiteSkills:[]}];eq(studySession(c,new Set(['sql']),new Set(),30),{ids:['small'],usedMinutes:20});assert.equal(c[0].id,'blocked');`),
    task('AI Career Assistant','Medium','job-coverage','Explain weighted job-skill coverage and missing evidence separately',
        'For a job’s unique requirements {skillId,minLevel,weight} and assessed skill Map, calculate weightedCoverage=sum(weights with assessed level>=minLevel)/sum(all weights). Weights are positive finite numbers and levels integers 0..5. Return matched, gaps, and unknown skill IDs separately; unknowns contribute no covered weight but are not labeled proven gaps. Empty requirements yield null coverage.',
        'Provide transparent skill-fit evidence rather than an unexplained employability score.',
        ['Validate all weights/levels and reject nonfinite aggregate weight.','Exclude personal/protected attributes from this calculation and avoid interpreting coverage as hiring probability.'],
        [['Skill a meets weight 2; skill b unknown weight 1','Coverage 2/3, b in unknown'],['Known skill below required level','It appears in gaps']],
        ['Weights need a reviewed job-requirement policy, not an invented model score.','Unknown profile evidence and actual unmet requirements have different meanings.'],
        'A coverage score can help explain a recommendation but is not a complete job match or employment decision. Job requirements may be ambiguous or stale, and evidence can be self-reported. Keep criteria transparent and allow corrections and alternative paths.',
        String.raw`function jobSkillCoverage(requirements,assessed){
  const level=n=>Number.isInteger(n)&&n>=0&&n<=5;if(new Set(requirements.map(r=>r.skillId)).size!==requirements.length||!requirements.every(r=>typeof r.skillId==='string'&&r.skillId.trim()&&level(r.minLevel)&&Number.isFinite(r.weight)&&r.weight>0)||![...assessed.values()].every(level))throw new Error('Invalid requirements');
  let total=0,covered=0;const matched=[],gaps=[],unknown=[];for(const r of requirements){total+=r.weight;if(!assessed.has(r.skillId))unknown.push(r.skillId);else if(assessed.get(r.skillId)>=r.minLevel){matched.push(r.skillId);covered+=r.weight;}else gaps.push(r.skillId);}if(!Number.isFinite(total))throw new Error('Weight overflow');return {weightedCoverage:total?covered/total:null,matched,gaps,unknown};
}`,
        String.raw`eq(jobSkillCoverage([{skillId:'a',minLevel:2,weight:2},{skillId:'b',minLevel:3,weight:1}],new Map([['a',2]])),{weightedCoverage:2/3,matched:['a'],gaps:[],unknown:['b']});assert.equal(jobSkillCoverage([],new Map()).weightedCoverage,null);eq(jobSkillCoverage([{skillId:'a',minLevel:3,weight:1}],new Map([['a',1]])).gaps,['a']);`),
    task('AI Career Assistant','Medium','recommendation-evidence','Build a recommendation explanation from validated profile facts',
        'Given a selected study activity {id,skillId}, a reviewed skill-gap record {skillId,status,gap}, and authorized profile fact IDs supporting that assessment, construct a structured explanation. Require matching skill ID, status gap with positive integer gap, and a nonempty unique source list. Do not produce claims about salary, guaranteed hiring, or inferred personality.',
        'Tie personalized advice to inspectable inputs and acknowledge its scope.',
        ['Require every supplied fact ID to be in the caller’s authorized fact allowlist.','Return activity/skill IDs, numeric gap, source IDs, and a fixed scoped rationale.'],
        [['Matching confirmed gap with authorized facts','Evidence-linked recommendation'],['Explanation cites an unknown fact ID','Rejected']],
        ['Traceability is stronger than a plausible but ungrounded paragraph.','Source existence does not establish the quality of the underlying assessment.'],
        'Recommendation explanations should let users inspect and correct the evidence driving personalization. This local contract validates linkage but does not prove the chosen activity is effective. Learning benefit and fairness need separate evaluation.',
        String.raw`function careerExplanation(activity,gap,factIds,allowedFacts){
  if(activity.skillId!==gap.skillId||gap.status!=='gap'||!Number.isSafeInteger(gap.gap)||gap.gap<1||!factIds.length||new Set(factIds).size!==factIds.length||!factIds.every(id=>allowedFacts.has(id)))throw new Error('Unsupported recommendation');
  return {activityId:activity.id,skillId:activity.skillId,gap:gap.gap,sourceFactIds:[...factIds],rationale:'This activity targets the reviewed skill gap; completion still requires an assessment.'};
}`,
        String.raw`const a={id:'study',skillId:'sql'},g={skillId:'sql',status:'gap',gap:2};assert.equal(careerExplanation(a,g,['f'],new Set(['f'])).gap,2);assert.throws(()=>careerExplanation(a,g,['missing'],new Set(['f'])));assert.throws(()=>careerExplanation(a,{...g,status:'needs_assessment'},['f'],new Set(['f'])));`),
    task('AI Career Assistant','Hard','stale-recommendation','Invalidate recommendations when their profile or catalog basis changes',
        'Return whether a saved career recommendation is current for an authenticated user and trusted current versions. Match tenantId,userId,profileRevision,skillsTaxonomyRevision,activityCatalogRevision,jobSnapshotRevision. Require finite expiry strictly after now. A missing/mismatched field returns false; do not silently relabel stale advice as freshly computed.',
        'Preserve provenance for personalized recommendations across profile and job updates.',
        ['Validate all expected identity/version strings and current time.','Recomputation is a separate authorized operation; this predicate does not modify saved progress or recommendations.'],
        [['User updates assessed skills after the recommendation','Old profileRevision invalidates it'],['All bases match but expiry equals now','Expired']],
        ['An answer can remain fluent after its factual basis changes.','Versioned provenance supports explaining why a recommendation needs refresh.'],
        'Personalized advice depends on mutable profile and catalog information. Version checks prevent stale results from being mistaken for current analysis, while a backend must still enforce consistent reads and authorized updates. Expiry and version invalidation solve different freshness risks.',
        String.raw`function currentRecommendation(saved,current,now){
  const keys=['tenantId','userId','profileRevision','skillsTaxonomyRevision','activityCatalogRevision','jobSnapshotRevision'];return Boolean(saved&&current&&Number.isFinite(now)&&Number.isFinite(saved.expiresAt)&&now<saved.expiresAt&&keys.every(k=>typeof current[k]==='string'&&current[k].trim()&&saved[k]===current[k]));
}`,
        String.raw`const c={tenantId:'t',userId:'u',profileRevision:'p1',skillsTaxonomyRevision:'s1',activityCatalogRevision:'a1',jobSnapshotRevision:'j1'},r={...c,expiresAt:100};assert.equal(currentRecommendation(r,c,99),true);assert.equal(currentRecommendation(r,{...c,profileRevision:'p2'},99),false);assert.equal(currentRecommendation(r,c,100),false);`),
    task('AI Career Assistant','Hard','career-quality','Evaluate recommendation usefulness without overstating career outcomes',
        'Design an evaluation for personalized study and job recommendations with varying profile completeness, goals, constraints, languages, and nontraditional experience. Distinguish known gaps from missing evidence, assess explanations, and check whether irrelevant identity cues change recommendations. Do not use hiring outcomes alone as a clean unbiased label.',
        'Measure recommendation quality and fairness under a transparent educational support contract.',
        ['Use reviewed skill/job criteria, realistic feasibility constraints, and independent task-level judgments.','Audit slices and controlled counterfactual identity cues while avoiding unsupported claims of universal fairness or guaranteed employment.'],
        [['Equivalent skill/goal evidence with only a name changed','Investigate unexplained recommendation differences'],['Sparse profile lacks a required assessment','Prefer clarification/assessment rather than a confident negative qualification claim']],
        ['Historical hiring data can reflect confounding and existing bias.','Study completion is not automatically demonstrated mastery or career success.'],
        'Career-assistance quality requires domain review and evidence-aware personalization. Transparent criteria and user correction channels improve accountability, but no single score proves fairness or long-term benefit.',
        'Define the product as support for user decision-making with explicit evidence sources and uncertainty. Freeze independent profiles, goals, time constraints, skill rubrics, and current job snapshots; include sparse, contradictory, and nontraditional evidence. Review gap correctness, activity prerequisite fit, feasibility, explanation support, job-criteria coverage, and appropriate clarification. Run controlled cue changes and language/profile-completeness slices, inspecting unjustified differences and data-quality causes. Calibrate expert/human judgments, permit corrections, and evaluate learner benefit prospectively where appropriate rather than promising hiring effects. Track privacy leakage, stale recommendations, and overconfident claims as release failures; select on development data and retain monitored rollback.'),
    task('AI Career Assistant','Hard','career-privacy','Design a privacy-aware profile-to-recommendation pipeline',
        'A career assistant ingests a resume, extracts skills, proposes a roadmap, and remembers preferences. Design a pipeline in which users can inspect/correct extracted claims, approve relevant persistence, delete sources and derived facts, and keep separate accounts isolated. Do not automatically retain every resume detail indefinitely.',
        'Connect personalization to consent, provenance, purpose, and deletion controls.',
        ['Separate raw uploads, extracted hypotheses, reviewed facts, and saved preferences.','Enforce scope before model input and test actual source/derived-data deletion plus authenticated reload separately from mocks.'],
        [['Extractor guesses a skill from an ambiguous phrase','Keep as unverified for review rather than an assessed fact'],['User deletes a resume that supplied a saved claim','Apply the declared lineage/retention policy to dependent facts and recommendations']],
        ['A model extraction is a hypothesis, not a verified qualification.','Data can survive in caches, summaries, exports, and provider retention unless lifecycle rules address it.'],
        'Privacy-aware personalization is a data lifecycle with explicit user controls. Minimizing prompt inputs and keeping lineage reduce accidental overcollection, while actual persistence and deletion guarantees must be established against authoritative services.',
        'Bind uploads and processing jobs to authenticated tenant/user identity, enforce byte/parser limits, and keep raw documents under a declared retention/access policy. Extract bounded structured hypotheses with source spans, validate them, and let users review/correct before treating them as planning evidence. Pass only purpose-relevant reviewed fields to recommendation generation, version its basis, and expose explanations/uncertainty. Save a narrow consented preference schema rather than raw transcripts by default. Implement inspect/export/correct/forget controls with source-to-derived lineage, cache invalidation, and documented backup/provider handling. Test concurrency, account isolation, revocation, authenticated save/reload, and deletion against real storage; report those separately from local fixture tests.'),
    task('AI Interviewer','Easy','question-selection','Select an eligible unseen interview question deterministically',
        'Given a trusted ordered question bank {id,topic,difficulty,enabled}, select the first enabled unseen question matching the requested topic and difficulty. Require unique nonblank IDs and known difficulty Easy,Medium,Hard. Return null when none qualifies rather than repeating a question or inventing one outside the bank.',
        'Separate a curated interview bank from model-generated follow-up content.',
        ['Use supplied asked IDs as a set and preserve bank order.','Do not infer interview difficulty or suitability from candidate identity fields.'],
        [['First matching question already asked, second unseen','Select the second'],['No unseen matching question','null']],
        ['Eligibility filters should be explicit and independently testable.','A bank label still needs domain review and difficulty calibration.'],
        'Deterministic question selection makes practice flow reproducible. It does not establish that two questions are psychometrically equivalent or that an interview score predicts job performance. Generated follow-ups need their own content and fairness checks.',
        String.raw`function interviewQuestion(bank,asked,topic,difficulty){
  if(!['Easy','Medium','Hard'].includes(difficulty)||new Set(bank.map(q=>q.id)).size!==bank.length||!bank.every(q=>typeof q.id==='string'&&q.id.trim()&&typeof q.enabled==='boolean'&&['Easy','Medium','Hard'].includes(q.difficulty)))throw new Error('Invalid question bank');
  const q=bank.find(q=>q.enabled&&!asked.has(q.id)&&q.topic===topic&&q.difficulty===difficulty);return q?{...q}:null;
}`,
        String.raw`const b=[{id:'a',topic:'sql',difficulty:'Easy',enabled:true},{id:'b',topic:'sql',difficulty:'Easy',enabled:true}];assert.equal(interviewQuestion(b,new Set(['a']),'sql','Easy').id,'b');assert.equal(interviewQuestion(b,new Set(['a','b']),'sql','Easy'),null);`),
    task('AI Interviewer','Easy','rubric-score','Aggregate a complete rubric without treating unscored as zero',
        'Compute a weighted practice-interview score from unique criteria {id,weight,score}. Weights are positive finite numbers; scores are integers 0 through 4 or null for not yet assessed. Return null when any criterion is unassessed or the rubric is empty. Otherwise return weighted average on the same 0..4 scale, not an invented hiring probability.',
        'Keep rubric completeness and score interpretation explicit.',
        ['Reject invalid weights/scores and duplicate IDs.','Use all criterion weights and reject aggregate weight overflow.'],
        [['Criteria score 4 weight 2 and score 1 weight 1','Weighted score 3'],['One criterion score null','Overall score null pending assessment']],
        ['Missing evidence and demonstrated zero performance are different states.','A numeric score depends on an anchored rubric and reviewer reliability.'],
        'Rubric aggregation is arithmetic over supplied judgments, not automatic semantic evaluation. Completeness checks prevent a partially scored interview from looking final. Criterion definitions, evidence, and calibration need separate review.',
        String.raw`function interviewRubric(criteria){
  if(new Set(criteria.map(c=>c.id)).size!==criteria.length||!criteria.every(c=>typeof c.id==='string'&&c.id.trim()&&Number.isFinite(c.weight)&&c.weight>0&&(c.score===null||(Number.isInteger(c.score)&&c.score>=0&&c.score<=4))))throw new Error('Invalid rubric');
  const total=criteria.reduce((sum,c)=>sum+c.weight,0);if(!Number.isFinite(total))throw new Error('Weight overflow');if(!criteria.length||criteria.some(c=>c.score===null))return null;return criteria.reduce((sum,c)=>sum+(c.weight/total)*c.score,0);
}`,
        String.raw`assert.equal(interviewRubric([{id:'a',weight:2,score:4},{id:'b',weight:1,score:1}]),3);assert.equal(interviewRubric([{id:'a',weight:1,score:null}]),null);assert.throws(()=>interviewRubric([{id:'a',weight:1,score:5}]));`),
    task('AI Interviewer','Easy','feedback-shape','Validate structured practice feedback without a hiring verdict',
        'Validate an interviewer feedback object with exactly strength,improvement,nextPractice fields, each a nonblank string bounded to 1000 code units. Return a copy and reject extra fields such as hireRecommendation or inferred protected traits. This structural validator does not detect every inappropriate statement inside otherwise allowed text.',
        'Make learning feedback actionable while bounding its application contract.',
        ['Reject arrays, null, missing fields, and unsupported keys.','Keep semantic fairness, evidence support, and relevance in a separate reviewed evaluation.'],
        [['Specific strength, improvement, next practice','Accepted learning feedback'],['Extra hireRecommendation field','Rejected contract expansion']],
        ['A bounded structure is not proof of unbiased language.','Feedback should cite response evidence and suggest achievable practice.'],
        'Practice feedback should help a learner understand what to improve rather than fabricate employment judgments. A closed schema limits accidental downstream use, but semantic review must still detect unsupported claims and inappropriate personal inferences.',
        String.raw`function practiceFeedback(value){
  const keys=['strength','improvement','nextPractice'];if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length!==3||!keys.every(k=>Object.hasOwn(value,k)&&typeof value[k]==='string'&&value[k].trim()&&value[k].length<=1000))throw new Error('Invalid feedback');return Object.fromEntries(keys.map(k=>[k,value[k]]));
}`,
        String.raw`const f={strength:'Uses examples.',improvement:'Explain index trade-offs.',nextPractice:'Compare two query plans.'};eq(practiceFeedback(f),f);assert.throws(()=>practiceFeedback({...f,hireRecommendation:true}));assert.throws(()=>practiceFeedback({...f,improvement:''}));`),
    task('AI Interviewer','Medium','blueprint-coverage','Prefer undercovered question topics within a reviewed blueprint',
        'Choose the next enabled unseen question from an ordered bank using trusted topic targets and asked question IDs. For eligible topics with positive target counts, minimize askedCount(topic)/targetCount(topic), ties by bank order. Questions stay at the requested difficulty. Reject unknown asked IDs and duplicate bank IDs; return null if no eligible question exists.',
        'Balance planned interview-topic coverage without using demographic cues.',
        ['Count asked questions from the actual bank, not arbitrary topic strings from model output.','This is a coverage heuristic, not a claim that adaptive scores are comparable across candidates.'],
        [['SQL has 1/2 coverage, networking 0/1','Prefer an unseen networking question'],['All eligible questions already asked','null']],
        ['Compute counts before ranking unseen questions.','Target weights and question difficulty need a reviewed blueprint.'],
        'A blueprint can prevent an interview from drifting toward one familiar topic. Coverage balancing is different from validated adaptive testing; comparisons require anchored rubrics and difficulty policy. The supplied bank and targets are trusted configuration.',
        String.raw`function blueprintQuestion(bank,asked,targets,difficulty){
  const byId=new Map(bank.map(q=>[q.id,q]));if(byId.size!==bank.length||![...asked].every(id=>byId.has(id))||![...targets.values()].every(n=>Number.isSafeInteger(n)&&n>0)||!['Easy','Medium','Hard'].includes(difficulty))throw new Error('Invalid blueprint');
  const counts=new Map();for(const id of asked){const topic=byId.get(id).topic;counts.set(topic,(counts.get(topic)??0)+1);}
  let best=null,bestRatio=Infinity;for(const q of bank)if(q.enabled&&!asked.has(q.id)&&q.difficulty===difficulty&&targets.has(q.topic)){const ratio=(counts.get(q.topic)??0)/targets.get(q.topic);if(ratio<bestRatio){best=q;bestRatio=ratio;}}return best?{...best}:null;
}`,
        String.raw`const b=[{id:'a',topic:'sql',enabled:true,difficulty:'Easy'},{id:'b',topic:'sql',enabled:true,difficulty:'Easy'},{id:'c',topic:'net',enabled:true,difficulty:'Easy'}];assert.equal(blueprintQuestion(b,new Set(['a']),new Map([['sql',2],['net',1]]),'Easy').id,'c');assert.equal(blueprintQuestion(b,new Set(['a','b','c']),new Map([['sql',2],['net',1]]),'Easy'),null);`),
    task('AI Interviewer','Medium','feedback-evidence','Bind positive rubric feedback to exact answer spans',
        'Validate supplied criterion annotations {criterionId,score,start,end} against an answer string and allowed criterion IDs. Scores are integers 0..4. Positive scores require nonempty half-open UTF-16 answer spans; score zero may use start=end=null. Return annotations with exact quoted text. Reject duplicate criteria, unknown IDs, and out-of-bounds spans; quoting does not itself establish semantic correctness.',
        'Make scoring evidence inspectable instead of allowing fabricated quotations.',
        ['Use answer.slice(start,end) rather than a model-provided quote string.','Require both offsets to be null together when zero has no evidence.'],
        [['Answer Use indexes, span [0,3)','Quote Use'],['Positive score with null offsets','Rejected missing evidence anchor']],
        ['Offset units must match the application’s stored answer representation.','A correct excerpt can still be interpreted incorrectly by a scorer.'],
        'Evidence anchors support consistent review and user correction of interview feedback. They prevent quotation fabrication at the structural boundary but cannot prove the rubric score follows from the answer. Human calibration and fairness evaluation remain necessary.',
        String.raw`function scoredEvidence(answer,annotations,allowed){
  if(typeof answer!=='string'||new Set(annotations.map(a=>a.criterionId)).size!==annotations.length)throw new Error('Invalid answer annotations');
  return annotations.map(a=>{if(!allowed.has(a.criterionId)||!Number.isInteger(a.score)||a.score<0||a.score>4)throw new Error('Invalid criterion');if(a.score===0&&a.start===null&&a.end===null)return {...a,quote:null};if(!Number.isSafeInteger(a.start)||!Number.isSafeInteger(a.end)||a.start<0||a.end<=a.start||a.end>answer.length)throw new Error('Invalid evidence span');return {...a,quote:answer.slice(a.start,a.end)};});
}`,
        String.raw`assert.equal(scoredEvidence('Use indexes',[{criterionId:'c',score:2,start:0,end:3}],new Set(['c']))[0].quote,'Use');assert.throws(()=>scoredEvidence('Answer',[{criterionId:'c',score:2,start:null,end:null}],new Set(['c'])));assert.equal(scoredEvidence('Answer',[{criterionId:'c',score:0,start:null,end:null}],new Set(['c']))[0].quote,null);`),
    task('AI Interviewer','Medium','interview-flow','Prevent stale answers and premature question advancement',
        'Implement a pure interview flow with trusted unique questionIds, current index, and stage question,answer_received,feedback,complete. A matching questionId event may submit an answer from question, accept validated feedback from answer_received, or advance from feedback. Advancing the last question sets complete. Reject wrong question IDs, unsupported transitions, and events after completion.',
        'Coordinate application conversation flow around validated feedback rather than racing asynchronous calls.',
        ['Validate the stored index and question list before every transition.','Only trusted feedback_ready events follow completed validation; do not infer them from candidate text.'],
        [['Answer for a previous question arrives','Rejected stale event'],['next event before feedback','Rejected early advancement']],
        ['Correlate each asynchronous response with its active question.','A completed session should not accidentally accept one more answer.'],
        'Interview flow combines question delivery, answer capture, evaluation, and learner feedback. Explicit transitions make out-of-order delivery and duplicate submissions visible. Persistence, idempotency, and authenticated session ownership need real service tests beyond this reducer.',
        String.raw`function interviewTransition(state,event){
  const ids=state.questionIds;if(!Array.isArray(ids)||!ids.length||new Set(ids).size!==ids.length||!Number.isSafeInteger(state.index)||state.index<0||state.index>=ids.length||event.questionId!==ids[state.index]||state.stage==='complete')throw new Error('Invalid interview event');
  if(state.stage==='question'&&event.type==='submit_answer')return {...state,stage:'answer_received'};
  if(state.stage==='answer_received'&&event.type==='feedback_ready')return {...state,stage:'feedback'};
  if(state.stage==='feedback'&&event.type==='next')return state.index===ids.length-1?{...state,stage:'complete'}:{...state,index:state.index+1,stage:'question'};
  throw new Error('Illegal interview transition');
}`,
        String.raw`const s={questionIds:['q1','q2'],index:0,stage:'question'};assert.throws(()=>interviewTransition(s,{questionId:'q1',type:'next'}));assert.throws(()=>interviewTransition(s,{questionId:'old',type:'submit_answer'}));const a=interviewTransition(s,{questionId:'q1',type:'submit_answer'}),f=interviewTransition(a,{questionId:'q1',type:'feedback_ready'});assert.equal(interviewTransition(f,{questionId:'q1',type:'next'}).index,1);assert.equal(interviewTransition({...s,index:1,stage:'feedback'},{questionId:'q2',type:'next'}).stage,'complete');`),
    task('AI Interviewer','Hard','scorer-calibration','Compare paired rubric ratings without hiding disagreement',
        'Given paired independent criterion ratings {itemId,human,model}, calculate mean absolute score difference, exact agreement, and withinOne agreement. Scores are integers 0..4, item IDs unique; empty input returns null metrics. Each item identifies the same answer/criterion/rubric revision. These descriptive metrics do not prove validity, fairness, or human infallibility.',
        'Quantify scorer consistency before relying on automated practice feedback.',
        ['Keep pairing by item identity and validate score ranges.','Report disagreement slices and rubric/label provenance separately rather than tuning against the final calibration holdout.'],
        [['Pairs (4,4),(1,3)','MAE 1, exact 0.5, withinOne 0.5'],['Empty ratings','Null metrics']],
        ['Exact agreement and tolerance-based agreement answer different questions.','Inspect systematic direction and criterion-specific errors beyond a mean.'],
        'Automated rubric scoring requires calibration against independently reviewed examples. Agreement can reveal instability but is not a complete measure of educational quality or bias. Human disagreement should trigger rubric review rather than assuming every mismatch is a model fault.',
        String.raw`function scorerAgreement(rows){
  const valid=n=>Number.isInteger(n)&&n>=0&&n<=4;if(new Set(rows.map(r=>r.itemId)).size!==rows.length||!rows.every(r=>typeof r.itemId==='string'&&r.itemId.trim()&&valid(r.human)&&valid(r.model)))throw new Error('Invalid paired ratings');
  const differences=rows.map(r=>Math.abs(r.human-r.model)),n=rows.length;return {count:n,meanAbsoluteDifference:n?differences.reduce((a,b)=>a+b,0)/n:null,exactAgreement:n?differences.filter(d=>d===0).length/n:null,withinOne:n?differences.filter(d=>d<=1).length/n:null};
}`,
        String.raw`eq(scorerAgreement([{itemId:'a',human:4,model:4},{itemId:'b',human:1,model:3}]),{count:2,meanAbsoluteDifference:1,exactAgreement:0.5,withinOne:0.5});assert.equal(scorerAgreement([]).exactAgreement,null);assert.throws(()=>scorerAgreement([{itemId:'a',human:5,model:4}]));`),
    task('AI Interviewer','Hard','interviewer-fairness','Evaluate consistent feedback across equivalent answers and irrelevant identity cues',
        'Design an AI practice-interviewer evaluation covering rubric consistency, equivalent technical answers, language/verbosity variation, accessibility, irrelevant demographic cues, and malicious instructions in candidate text. Do not equate identical scores on one example with a universal fairness guarantee.',
        'Measure response-evidence-based scoring and useful feedback under controlled variations.',
        ['Freeze anchored criteria and blinded independent ratings; compare paired equivalent-answer variants.','Inspect slices, disagreement, uncertainty, and unsupported personal inferences rather than relying on one average score.'],
        [['Same technical content with a different candidate name','Investigate unexplained scoring differences'],['Concise correct answer versus verbose incorrect answer','Rubric should reward demonstrated criteria, not verbosity alone']],
        ['Correctness, communication criteria, and language proficiency need distinct definitions.','An instruction embedded in the answer must not replace the scoring rubric.'],
        'Practice interviewers should support learning with consistent evidence-based feedback. Fairness and validity require domain-informed testing and uncertainty reporting; historical interviewer judgments can contain their own biases.',
        'Create reviewed question/rubric versions with clear score anchors and acceptable alternative answers. Collect independent blinded ratings and adjudicate disagreements on held-out examples. Construct paired variants preserving technical meaning while varying names, formatting, verbosity, language features, and irrelevant personal cues; include answer-embedded prompt injection and uncertain/partial responses. Measure criterion agreement, directional errors, feedback evidence support, actionable next steps, slice regressions, and inappropriate personal claims. Review accessibility and task relevance with domain experts; do not claim equal outcomes prove complete fairness. Select on development evidence, evaluate a frozen scorer separately, and provide correction/appeal plus monitoring rather than treating practice scores as hiring decisions.'),
    task('AI Interviewer','Hard','interview-recovery','Design a saved practice session that survives scorer and client failures',
        'A learner submits an answer while the scoring service times out and the browser reloads. Design authenticated persistence and recovery for selected questions, one logical answer submission, provisional scoring, rubric versions, feedback publication, and explicit failure/retry without losing prior session progress.',
        'Integrate interview flow with durable user-owned state and versioned feedback.',
        ['Bind session/question/submission identities to the authenticated learner and make writes idempotent.','Persist answer and evaluation states separately; publish only validated complete feedback under its rubric/model version.'],
        [['Duplicate submit after reload','Recover the same logical answer/evaluation rather than scoring twice blindly'],['Feedback is incomplete or schema-invalid','Keep the answer saved and expose a recoverable evaluation failure']],
        ['A scoring timeout does not mean the learner’s answer should be discarded.','Reusing feedback across changed rubric versions needs an explicit compatibility policy.'],
        'A robust interviewer separates durable learner work from fallible automated evaluation. Pure state-machine tests cannot verify authenticated writes, concurrency, or provider retries. Those require real backend/database checks with controlled failure injection.',
        'Store a versioned session blueprint and question order under learner ownership. Atomically save each answer with a unique session/question/submission key and a pending evaluation intent. Track scoring attempts and provider outcomes independently, validate rubric/evidence/feedback before a terminal publish, and preserve failed/provisional status without advancing the question early. On reload return scoped answer and evaluation state; retries reconcile existing intent before creating new work. Reject stale feedback for another question/submission/version and retain reviewable provenance. Test concurrent submits, restart/timeout boundaries, unauthorized session access, final-question completion, and authenticated save/reload against actual services; distinguish those results from inert fixtures.'),
    task('AI Agent','Easy','public-run-view','Expose verified application run status without leaking internal traces',
        'Project a trusted agent application run into a public response containing only runId,status,message. Internal states queued,running,awaiting_approval,failed,unknown map to fixed user messages. A completed run is public complete only if goalVerified=true; otherwise public needs_review. Never return hidden reasoning, raw tool arguments, credentials, or internal exception details.',
        'Integrate orchestration state with an honest minimal user-facing status contract.',
        ['Validate run identity and supported states.','Do not call a run successful merely because the model produced a final answer.'],
        [['Internal completed but goalVerified=false','Public needs_review'],['Internal failure with private stack trace','Fixed failure message only']],
        ['The public API should have an explicit projection, not serialize the entire run object.','Verified completion is a backend acceptance result, not user/model text.'],
        'Application status must distinguish working, waiting, failure, and uncertain outcome. A safe projection minimizes accidental leakage while keeping recovery visible. Real authorization of the status endpoint is separate from projection.',
        String.raw`function publicAgentRun(run){
  const labels={queued:'Waiting to start.',running:'Work is in progress.',awaiting_approval:'Your confirmation is required.',failed:'The task could not be completed.',unknown:'The outcome needs reconciliation.',complete:'The task completed its checks.',needs_review:'The result needs review.'};
  if(typeof run?.id!=='string'||!run.id.trim()||!['queued','running','awaiting_approval','failed','unknown','completed'].includes(run.status))throw new Error('Invalid run');const status=run.status==='completed'?(run.goalVerified===true?'complete':'needs_review'):run.status;return {runId:run.id,status,message:labels[status]};
}`,
        String.raw`assert.equal(publicAgentRun({id:'r',status:'completed',goalVerified:false}).status,'needs_review');const v=publicAgentRun({id:'r',status:'failed',stack:'secret'});eq(Object.keys(v),['runId','status','message']);assert.equal(JSON.stringify(v).includes('secret'),false);`),
    task('AI Agent','Easy','task-documents','Validate a bounded document task against authorized source IDs',
        'Validate an agent application request {requestId,documentIds,instruction} with exact keys. Request ID and instruction are nonblank strings bounded to 100 and 2000 code units; documentIds is one through five unique nonblank IDs, each in a server-owned authorized set. Do not accept model/client tool names, arbitrary URLs, or tenant overrides in the request body.',
        'Constrain a user task to application-approved resources before orchestration.',
        ['Reject unknown/duplicate document IDs and extra request fields.','An accepted instruction remains untrusted user text; it cannot expand tools or permissions.'],
        [['All selected documents authorized','Copied task request'],['One selected document belongs to another user','Reject the whole request']],
        ['Validate resource scope before sending source text to a model.','The backend must reauthorize mutable permissions when effects occur.'],
        'Application task admission narrows the agent’s workspace to a declared product capability. It does not guarantee the instruction is harmless or the answer correct. Execution-time authorization and bounded orchestration remain independent safeguards.',
        String.raw`function documentAgentTask(body,authorizedIds){
  const keys=['requestId','documentIds','instruction'];if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).length!==3||!keys.every(k=>Object.hasOwn(body,k))||typeof body.requestId!=='string'||!body.requestId.trim()||body.requestId.length>100||typeof body.instruction!=='string'||!body.instruction.trim()||body.instruction.length>2000||!Array.isArray(body.documentIds)||body.documentIds.length<1||body.documentIds.length>5||new Set(body.documentIds).size!==body.documentIds.length||!body.documentIds.every(id=>typeof id==='string'&&id.trim()&&authorizedIds.has(id)))throw new Error('Invalid task');return {requestId:body.requestId,documentIds:[...body.documentIds],instruction:body.instruction};
}`,
        String.raw`const b={requestId:'r',documentIds:['d'],instruction:'Summarize'};eq(documentAgentTask(b,new Set(['d'])),b);assert.throws(()=>documentAgentTask({...b,documentIds:['d','private']},new Set(['d'])));assert.throws(()=>documentAgentTask({...b,tool:'delete'},new Set(['d'])));`),
    task('AI Agent','Easy','artifact-access','Return only a ready owned artifact from a completed task',
        'Resolve an application artifact descriptor from trusted records using artifactId,runId and authenticated tenant/user scope. Require status ready and runStatus verified_complete; otherwise return unavailable. Return only artifactId,runId,displayName,mediaType, never a storage key, provider URL, or internal trace. Actual download access must be enforced separately.',
        'Keep generated deliverables scoped and distinct from provisional model output.',
        ['Match both run and owner, not artifact ID alone.','Do not expose whether a foreign artifact exists.'],
        [['Ready artifact from this user’s verified run','Public descriptor'],['Provisional artifact or another owner','unavailable']],
        ['A generated file reference is not a public bearer capability.','Any later download route must check access again.'],
        'Agent applications often produce artifacts that outlive a run. Their visibility requires ownership and completion checks independent of model claims. Avoid passing internal storage locations directly to clients without a deliberate authorized delivery protocol.',
        String.raw`function agentArtifact(records,artifactId,runId,scope){
  if(![artifactId,runId,scope?.tenantId,scope?.userId].every(x=>typeof x==='string'&&x.trim()))return {status:'unavailable'};
  const a=records.find(a=>a.id===artifactId&&a.runId===runId&&a.tenantId===scope.tenantId&&a.userId===scope.userId&&a.status==='ready'&&a.runStatus==='verified_complete');
  return a?{status:'available',artifactId:a.id,runId:a.runId,displayName:a.displayName,mediaType:a.mediaType}:{status:'unavailable'};
}`,
        String.raw`const a={id:'a',runId:'r',tenantId:'t',userId:'u',status:'ready',runStatus:'verified_complete',displayName:'Summary',mediaType:'text/plain',storageKey:'private'};const v=agentArtifact([a],'a','r',{tenantId:'t',userId:'u'});assert.equal(v.status,'available');assert.equal(Object.hasOwn(v,'storageKey'),false);assert.equal(agentArtifact([a],'a','r',{tenantId:'t',userId:'other'}).status,'unavailable');`),
    task('AI Agent','Medium','status-polling','Ignore stale application polls without reopening terminal runs',
        'Reconcile a server run-status response with client state {runId,version,status}. Version is a nonnegative integer; supported statuses queued,running,awaiting_approval,completed,failed,unknown. Reject another run ID. Ignore lower versions. Equal version must have equal status; conflicting equal versions throw. Completed/failed runs cannot change status at a higher version under this product contract.',
        'Prevent out-of-order polling responses from regressing the application UI.',
        ['Return a new state only for accepted newer responses and preserve the old one on ignore.','Retries after a terminal run must use the product’s separate new-attempt contract, not silently reopen it.'],
        [['Client version 3, incoming version 2','Ignore old response'],['Client completed, incoming newer running','Reject invalid terminal regression']],
        ['Network completion order does not imply data freshness.','Unknown is not the same as failure or safe-to-retry.'],
        'Run-state UIs need monotonic reconciliation when polling and streaming coexist. Terminal-state rules are application contracts and must match backend transitions. These local checks do not enforce authenticated state or provider-side cancellation.',
        String.raw`function reconcileRunPoll(current,incoming){
  const statuses=['queued','running','awaiting_approval','completed','failed','unknown'];if(current.runId!==incoming.runId||![current,incoming].every(s=>Number.isSafeInteger(s.version)&&s.version>=0&&statuses.includes(s.status)))throw new Error('Invalid run poll');
  if(incoming.version<current.version)return {action:'ignore',state:current};if(incoming.version===current.version){if(incoming.status!==current.status)throw new Error('Version conflict');return {action:'ignore',state:current};}
  if(['completed','failed'].includes(current.status)&&incoming.status!==current.status)throw new Error('Terminal regression');return {action:'replace',state:{...incoming}};
}`,
        String.raw`const c={runId:'r',version:3,status:'completed'};assert.equal(reconcileRunPoll(c,{runId:'r',version:2,status:'running'}).action,'ignore');assert.throws(()=>reconcileRunPoll(c,{runId:'r',version:4,status:'running'}));assert.throws(()=>reconcileRunPoll(c,{runId:'r',version:3,status:'failed'}));assert.equal(reconcileRunPoll(c,{runId:'r',version:4,status:'completed'}).action,'replace');`),
    task('AI Agent','Medium','approval-display','Build a confirmation submission from a current server-owned preview',
        'Given a trusted server preview {intentId,version,action,targetLabel,expiresAt} and current time, return plain display data plus a confirmation payload containing only intentId and expectedVersion. Require action archive_document and an unexpired positive integer version. Never submit executable arguments copied from a model-written explanation; the server resolves the bound intent.',
        'Connect human confirmation UI to the exact stored operation version.',
        ['Validate nonblank identity/target label and finite times with now<expiresAt.','The preview is not proof of approval or permission; server validation and atomic consumption remain required.'],
        [['Current archive preview','Submit only stored intent ID and version'],['Expired preview','Reject and require a refreshed preview']],
        ['A friendly description must not become the authoritative execution arguments.','The user should see the exact target/action before confirming.'],
        'Application confirmations need a stable intent binding rather than an unstructured yes message. A minimal payload avoids letting the client substitute targets. The server must reauthorize, compare the intent version, and enforce one-time approval/effect handling.',
        String.raw`function archiveConfirmation(preview,now){
  if(![preview?.intentId,preview?.targetLabel].every(x=>typeof x==='string'&&x.trim())||preview.action!=='archive_document'||!Number.isSafeInteger(preview.version)||preview.version<1||!Number.isFinite(now)||!Number.isFinite(preview.expiresAt)||now>=preview.expiresAt)throw new Error('Invalid or stale preview');
  return {display:{action:preview.action,targetLabel:preview.targetLabel},payload:{intentId:preview.intentId,expectedVersion:preview.version}};
}`,
        String.raw`const p={intentId:'i',version:2,action:'archive_document',targetLabel:'Notes',expiresAt:100,modelArguments:{target:'other'}};eq(archiveConfirmation(p,99).payload,{intentId:'i',expectedVersion:2});assert.throws(()=>archiveConfirmation(p,100));assert.throws(()=>archiveConfirmation({...p,action:'delete_account'},99));`),
    task('AI Agent','Medium','recovery-action','Offer a safe user-facing recovery action after an application failure',
        'Map trusted execution outcome verified_complete,read_failed,write_uncertain,validation_failed,permission_denied into a UI recovery action. Only read_failed offers retry_existing; write_uncertain offers check_status; validation_failed offers revise_request; permission_denied offers contact_owner; complete offers view_result. Do not label uncertainty as a failure that can safely be repeated.',
        'Translate executor outcomes into bounded application recovery choices.',
        ['Return fixed messages/actions without reflecting internal errors or secrets.','The server must authorize each requested recovery and enforce its original operation identity.'],
        [['Uncertain archive write','Check status rather than Repeat action'],['Read-only transient failure','Retry the existing request under a backend retry budget']],
        ['A retry button is part of the effect protocol, not merely UI decoration.','Scope and permission may change before the user presses it.'],
        'Agent applications need recovery behavior users can understand without exposing internal traces. The UI must not encourage duplicate effects after a timeout. This mapper is a product contract and requires integration with authoritative executor state.',
        String.raw`function agentRecovery(outcome){
  const actions={verified_complete:['view_result','The verified result is available.'],read_failed:['retry_existing','The read failed; a bounded retry may be requested.'],write_uncertain:['check_status','The action outcome needs reconciliation.'],validation_failed:['revise_request','Please revise the request.'],permission_denied:['contact_owner','The requested access is not available.']};
  if(!Object.hasOwn(actions,outcome))throw new Error('Unknown outcome');return {action:actions[outcome][0],message:actions[outcome][1]};
}`,
        String.raw`assert.equal(agentRecovery('write_uncertain').action,'check_status');assert.equal(agentRecovery('read_failed').action,'retry_existing');assert.equal(agentRecovery('verified_complete').action,'view_result');assert.throws(()=>agentRecovery('constructor'));`),
    task('AI Agent','Hard','delivery-gate','Publish a deliverable only after application-level completion gates pass',
        'Decide whether a trusted agent run may publish a user-visible deliverable. Require run owner matches authenticated scope, run.status=completed, acceptanceVerified=true, no safety violations, every required operation succeeded, and every artifact ready under the same run ID. Otherwise return hold with explicit category owner_mismatch,incomplete,verification,safety,operations,artifacts in that priority.',
        'Integrate orchestration, acceptance, effect outcomes, and artifact readiness at final delivery.',
        ['Validate authenticated scope before inspecting deliverable content.','A model final answer alone cannot satisfy these gates; this pure decision does not commit publication atomically.'],
        [['Run says completed but an operation remains unknown','Hold for operations'],['All verified gates pass','Eligible to publish']],
        ['Goal verification and successful side effects are different checks.','The storage publication must recheck the current run version and access state.'],
        'End-to-end agent delivery requires more than a terminal orchestration phase. Explicit gates keep partial or unsafe work from being displayed as a verified result. A live system must enforce these predicates under a consistent snapshot with an authoritative commit.',
        String.raw`function deliverableGate(run,scope){
  if(![scope?.tenantId,scope?.userId].every(x=>typeof x==='string'&&x.trim())||run.tenantId!==scope.tenantId||run.userId!==scope.userId)return {status:'hold',reason:'owner_mismatch'};
  if(run.status!=='completed')return {status:'hold',reason:'incomplete'};if(run.acceptanceVerified!==true)return {status:'hold',reason:'verification'};if(run.safetyViolations!==0)return {status:'hold',reason:'safety'};
  if(!Array.isArray(run.operations)||run.operations.some(o=>o.required&&o.status!=='succeeded'))return {status:'hold',reason:'operations'};
  if(!Array.isArray(run.artifacts)||run.artifacts.some(a=>a.runId!==run.id||a.status!=='ready'))return {status:'hold',reason:'artifacts'};return {status:'publish'};
}`,
        String.raw`const r={id:'r',tenantId:'t',userId:'u',status:'completed',acceptanceVerified:true,safetyViolations:0,operations:[{required:true,status:'unknown'}],artifacts:[{runId:'r',status:'ready'}]},s={tenantId:'t',userId:'u'};eq(deliverableGate(r,s),{status:'hold',reason:'operations'});eq(deliverableGate({...r,operations:[{required:true,status:'succeeded'}]},s),{status:'publish'});assert.equal(deliverableGate(r,{...s,userId:'other'}).reason,'owner_mismatch');`),
    task('AI Agent','Hard','application-acceptance','Evaluate an agent application from task submission to user-visible outcome',
        'Design a release test for a document-workflow agent application, focusing on API admission, authenticated resources, progress UI, confirmation, delivery, cancellation, retries, and recovery. Reuse the executor’s unit contracts rather than rewriting its agent-loop algorithms. Include human-understandable partial/blocked states and verified end-to-end outcomes.',
        'Evaluate application integration beyond isolated orchestration correctness.',
        ['Trace one logical request through UI/API/jobs/effects/artifacts with stable scoped identities.','Test user-visible correctness and privacy under concurrent requests, stale polls, and uncertain effects.'],
        [['A backend succeeds but the UI shows another run’s artifact','Application failure despite executor success'],['Cancellation races with a committed action','Report the actual outcome; do not falsely promise reversal']],
        ['End-to-end tests should target boundaries that unit tests cannot prove.','An ordinary status page must not expose raw reasoning or privileged tool inputs.'],
        'Application integration can fail even when the underlying agent runtime passes unit tests. Stable identities, authenticated state, honest UI outcomes, and final-delivery gates bridge that gap. Mocked workflows and real effect/storage tests must be reported separately.',
        'Build representative tasks with independent acceptance and safety criteria. Exercise the real public request schema, ownership filters, durable request uniqueness, job execution, approval preview/version binding, operation reconciliation, and artifact delivery. Inject disconnects, duplicate submissions, stale polling, scorer/model errors, permission revocation, cancellation, and restarts at commit boundaries. Verify the UI never mixes runs, presents partial text as verified completion, or offers blind write retries. Measure safe task success, useful partial outcomes, privacy violations, latency, and observed cost. Use inert adapters for broad deterministic coverage, then controlled authenticated/live integrations for the boundaries they cannot establish. Gate a canary rollout on predefined application outcomes and retain rollback.'),
    task('AI Agent','Hard','support-reconciliation','Design operational support for a stuck or uncertain user run',
        'A user reports that an agent task is stuck after a deployment and may have archived a document. Design a support/reconciliation workflow that preserves evidence, avoids duplicate effects, protects private data, and communicates verified versus unknown state. Do not reset the user’s run merely to clear the UI.',
        'Recover application work from authoritative evidence rather than model guesses.',
        ['Correlate request/run/operation/version IDs through redacted trusted telemetry and durable records.','Reauthorize support access, reconcile uncertain effects, and preserve user progress before any replay/migration.'],
        [['Provider outcome is unknown but operation may have committed','Check authoritative operation/resource state before another attempt'],['Checkpoint version is incompatible','Surface migration/review, retain original state, and avoid silent restart']],
        ['A missing log line is not proof of a failed action.','Support tools need their own access and audit boundaries.'],
        'Operational recovery is part of an agent application’s reliability contract. It must distinguish model, orchestration, storage, delivery, and external-effect failures. Resetting state can erase evidence and repeat side effects.',
        'Authenticate and authorize the support actor, scope the investigation to the affected user/run, and collect redacted event IDs, software versions, checkpoints, request states, and operation ledger entries. Determine whether work is queued, leased, running, terminal but undelivered, version-incompatible, or effect-uncertain. Reconcile the actual resource/provider outcome using durable identity and documented guarantees; replay only safe recorded observations or idempotent operations under policy. Preserve original snapshots and audit any migration/manual resolution. Present verified result, clear failure, or honest unknown/partial status to the user, with no secret leakage or false cancellation/reversal promises. Add the discovered boundary case to regression fixtures and separately retest authenticated recovery against the real backend.'),
    task('Deployment','Easy','server-config','Validate server configuration without returning secret values',
        'Read an environment-like object for an AI application server. Require a nonblank MODEL_API_KEY, an integer PORT string 1..65535, and MODEL_BASE_URL parsed as an HTTPS URL with no embedded username/password, query, or fragment. Return only public validated port/base URL and secretConfigured=true. Do not log or return the key; this is deployment-owned configuration, not a user-supplied URL fetcher.',
        'Fail startup on malformed configuration while keeping credentials server-side.',
        ['Reject partial numeric ports, missing keys, and non-HTTPS URLs.','A URL syntax check is not a network allowlist or SSRF defense for untrusted input.'],
        [['Valid deployment config','Sanitized public configuration only'],['PORT=3000junk or base URL embeds credentials','Startup validation fails']],
        ['Use a complete numeric-string check before conversion.','Secret presence can be reported without copying its value into diagnostics.'],
        'Configuration validation catches deterministic startup errors before requests arrive. Secrets belong in a restricted server environment/secret manager, never a frontend build or ordinary log. Connectivity, credential validity, rotation, and egress policy need real integration checks.',
        String.raw`function serverConfig(env){
  if(typeof env.MODEL_API_KEY!=='string'||!env.MODEL_API_KEY.trim()||typeof env.PORT!=='string'||!/^\d+$/.test(env.PORT))throw new Error('Invalid server configuration');const port=Number(env.PORT);if(!Number.isInteger(port)||port<1||port>65535)throw new Error('Invalid server configuration');
  let base;try{base=new URL(env.MODEL_BASE_URL);}catch{throw new Error('Invalid server configuration');}if(base.protocol!=='https:'||base.username||base.password||base.search||base.hash)throw new Error('Invalid server configuration');return {port,baseURL:base.toString(),secretConfigured:true};
}`,
        String.raw`const c=serverConfig({MODEL_API_KEY:'private',PORT:'3000',MODEL_BASE_URL:'https://model.example.test/v1'});assert.equal(c.port,3000);assert.equal(JSON.stringify(c).includes('private'),false);assert.throws(()=>serverConfig({MODEL_API_KEY:'x',PORT:'3000junk',MODEL_BASE_URL:'https://model.example.test'}));assert.throws(()=>serverConfig({MODEL_API_KEY:'x',PORT:'3000',MODEL_BASE_URL:'https://u:p@model.example.test'}));`),
    task('Deployment','Easy','api-body-boundary','Validate an AI request’s raw JSON transport boundary',
        'Parse an AI application request from raw Uint8Array bytes and a Content-Type string. Require application/json with optional parameters, a positive integer maxBytes, and byteLength<=maxBytes. Decode UTF-8 fatally and require a nonnull nonarray JSON object. Do not claim this transport parser validates endpoint-specific fields or authentication.',
        'Enforce byte, encoding, and JSON shape limits before application validation.',
        ['Reject unsupported media types, malformed UTF-8, oversized bodies, arrays, and null.','Parse the entire body; never eval generated or submitted content.'],
        [['application/json; charset=utf-8 with object bytes','Parsed object'],['A short-looking multibyte string exceeds byte cap','Rejected by actual byteLength']],
        ['Content length headers can be absent or wrong; bound bytes while receiving in production too.','JSON syntax is only one validation layer.'],
        'API deployment boundaries need resource limits before downstream model calls. This helper checks an already buffered fixture; a real HTTP server must cap streaming body accumulation as well. Authentication, rate limits, schema validation, and permission checks remain independent.',
        String.raw`function parseAIRequest(bytes,contentType,maxBytes){
  if(!(bytes instanceof Uint8Array)||typeof contentType!=='string'||contentType.split(';')[0].trim().toLowerCase()!=='application/json'||!Number.isSafeInteger(maxBytes)||maxBytes<1||bytes.byteLength>maxBytes)throw new Error('Invalid request transport');
  const value=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Expected JSON object');return value;
}`,
        String.raw`const bytes=new TextEncoder().encode('{"text":"é"}');eq(parseAIRequest(bytes,'application/json; charset=utf-8',100),{text:'é'});assert.throws(()=>parseAIRequest(bytes,'text/plain',100));assert.throws(()=>parseAIRequest(bytes,'application/json',2));assert.throws(()=>parseAIRequest(new TextEncoder().encode('[]'),'application/json',100));`),
    task('Deployment','Easy','log-projection','Emit bounded operational metadata instead of prompts or secrets',
        'Project a trusted request telemetry event into requestId,route,statusCode,latencyMs,inputTokens,outputTokens only. Request ID is a server-issued alphanumeric/underscore/hyphen string up to 64 characters; route is a fixed route template from an allowlist, not a raw URL with query parameters. Validate finite nonnegative metrics and exclude prompt,answer,headers,API keys, and user contact fields.',
        'Make structured observability useful without indiscriminate content logging.',
        ['Use an explicit field projection and allowlisted route template.','Reject malformed metrics and do not claim a projection replaces log access/retention policy.'],
        [['Event includes Authorization and prompt text','Neither appears in output'],['Raw URL with an email query parameter instead of a route template','Rejected']],
        ['Redaction by copying everything then removing known secret keys is fragile.','Even metadata can be sensitive when joined with other systems.'],
        'Operational logs need correlation and resource data, not unrestricted conversation contents. A narrow projection reduces accidental leakage while preserving latency/error analysis. Protect storage, access, retention, and request-ID provenance separately.',
        String.raw`function operationalLog(event,allowedRoutes){
  if(typeof event.requestId!=='string'||!/^[A-Za-z0-9_-]{1,64}$/.test(event.requestId)||!allowedRoutes.has(event.route)||!Number.isInteger(event.statusCode)||event.statusCode<100||event.statusCode>599||!Number.isFinite(event.latencyMs)||event.latencyMs<0||![event.inputTokens,event.outputTokens].every(x=>Number.isSafeInteger(x)&&x>=0))throw new Error('Invalid telemetry');
  const keys=['requestId','route','statusCode','latencyMs','inputTokens','outputTokens'];return Object.fromEntries(keys.map(k=>[k,event[k]]));
}`,
        String.raw`const e={requestId:'r_1',route:'/api/chat',statusCode:200,latencyMs:12,inputTokens:10,outputTokens:5,prompt:'private',Authorization:'secret'};const out=operationalLog(e,new Set(['/api/chat']));assert.equal(Object.hasOwn(out,'prompt'),false);assert.equal(Object.hasOwn(out,'Authorization'),false);assert.throws(()=>operationalLog({...e,route:'/api/chat?email=private'},new Set(['/api/chat'])));`),
    task('Deployment','Medium','token-bucket','Plan one authenticated rate-limit decision with a token bucket',
        'Implement a pure token-bucket transition from trusted state {tokens,updatedAt}, positive integer capacity, positive refillPerSecond, and now in milliseconds. Refill by elapsedSeconds*rate up to capacity; consume one token when available. Otherwise return allowed=false and ceil((1−available)/rate) retryAfterSeconds. Reject backward time or invalid stored tokens. Keys must be scoped by authenticated principal in a real service.',
        'Define rate-limit arithmetic without pretending local state protects a distributed deployment.',
        ['Return new state and keep fractional tokens for future refills.','The backend must atomically read/update shared state and bound key/cardinality/retention.'],
        [['Empty bucket, refill 1/sec, elapsed 0.5 sec','Denied, 0.5 tokens, retry after 1 sec'],['Same initial bucket with elapsed 1 sec','Allowed and consumes the new token']],
        ['Convert milliseconds to seconds before applying the refill rate.','Per-instance memory is not a global multi-replica limit.'],
        'Rate limiting helps control abuse and resource use but does not substitute for authentication or cost/concurrency budgets. A token-bucket formula is only one policy; real enforcement needs atomic shared storage, trusted identity/proxy configuration, and measured failure behavior.',
        String.raw`function rateLimitStep(state,capacity,refillPerSecond,now){
  if(!Number.isSafeInteger(capacity)||capacity<1||![state.tokens,state.updatedAt,refillPerSecond,now].every(Number.isFinite)||state.tokens<0||state.tokens>capacity||refillPerSecond<=0||now<state.updatedAt)throw new Error('Invalid token bucket');
  const available=Math.min(capacity,state.tokens+(now-state.updatedAt)/1000*refillPerSecond),allowed=available>=1;
  return {allowed,retryAfterSeconds:allowed?0:Math.ceil((1-available)/refillPerSecond),state:{tokens:allowed?available-1:available,updatedAt:now}};
}`,
        String.raw`eq(rateLimitStep({tokens:0,updatedAt:0},2,1,500),{allowed:false,retryAfterSeconds:1,state:{tokens:0.5,updatedAt:500}});assert.equal(rateLimitStep({tokens:0,updatedAt:0},2,1,1000).allowed,true);assert.throws(()=>rateLimitStep({tokens:1,updatedAt:100},2,1,99));`),
    task('Deployment','Medium','health-boundaries','Separate process liveness from dependency readiness',
        'Create a health response from trusted boolean flags configValid,databaseReady,queueReady,providerReady. The local liveness endpoint reports process responding with status 200; readiness is 200 only when all required flags are true, otherwise 503. Return only ok or not_ready without secrets, URLs, provider responses, or stack traces.',
        'Make health checks reflect routing readiness without claiming semantic model quality.',
        ['Reject missing/nonboolean flags.','Do not perform a paid model generation inside this pure health function or every frequent liveness probe.'],
        [['Database unavailable while process responds','Liveness 200, readiness 503'],['All required dependencies ready','Readiness 200']],
        ['Restarting a healthy process may not fix a provider outage.','Readiness and deployment acceptance answer different questions.'],
        'Health probes guide process management and traffic routing. Required-dependency policy is application-specific; this exercise declares all four flags mandatory. Readiness does not verify task correctness, authorized persistence, or current model behavior.',
        String.raw`function applicationHealth(flags){
  const keys=['configValid','databaseReady','queueReady','providerReady'];if(!keys.every(k=>typeof flags[k]==='boolean'))throw new Error('Invalid health snapshot');const ready=keys.every(k=>flags[k]);
  return {liveness:{status:200,body:'ok'},readiness:{status:ready?200:503,body:ready?'ok':'not_ready'}};
}`,
        String.raw`const all={configValid:true,databaseReady:true,queueReady:true,providerReady:true};assert.equal(applicationHealth(all).readiness.status,200);const bad=applicationHealth({...all,databaseReady:false});assert.equal(bad.liveness.status,200);assert.equal(bad.readiness.status,503);assert.throws(()=>applicationHealth({...all,providerReady:'yes'}));`),
    task('Deployment','Medium','load-admission','Reject excess active work before opening another model stream',
        'Plan AI request admission from trusted counts activeRuns,queuedRuns and positive integer maxActive,maxQueued. If an active slot is available return start; otherwise if queue capacity is available return enqueue; otherwise return reject_busy. Counts are nonnegative safe integers. This reserves no real slot: concurrent instances need an atomic shared admission mechanism.',
        'Bound concurrency and queue growth separately from request-rate limits.',
        ['Do not enqueue when queue count equals its maximum.','No provider request should start before actual admission/ownership is committed.'],
        [['active=maxActive, queued=maxQueued−1','enqueue'],['Both capacities exhausted','reject_busy']],
        ['A user can respect a rate limit yet keep many long streams active.','A queue cap needs timeout, cancellation, and ownership policies too.'],
        'AI requests can hold connections and backend resources for a long time. Concurrency and bounded queues protect capacity differently from per-time rate limits. Production must measure actual active work, reclaim crashed leases safely, and avoid unbounded retries.',
        String.raw`function aiAdmission(activeRuns,queuedRuns,maxActive,maxQueued){
  if(![activeRuns,queuedRuns,maxActive,maxQueued].every(Number.isSafeInteger)||activeRuns<0||queuedRuns<0||maxActive<1||maxQueued<1)throw new Error('Invalid admission counts');
  if(activeRuns<maxActive)return 'start';if(queuedRuns<maxQueued)return 'enqueue';return 'reject_busy';
}`,
        String.raw`assert.equal(aiAdmission(2,3,2,4),'enqueue');assert.equal(aiAdmission(2,4,2,4),'reject_busy');assert.equal(aiAdmission(1,4,2,4),'start');assert.throws(()=>aiAdmission(-1,0,2,4));`),
    task('Deployment','Hard','release-gates','Gate an AI release on quality, safety, latency, and observed cost',
        'Evaluate a trusted completed release report with caseCount,verifiedSuccessRate,unauthorizedEffects,p95LatencyMs,meanCostMicrounits and limits minCases,minSuccess,maxP95LatencyMs,maxMeanCostMicrounits. Return accepted only if sample count and every threshold pass and unauthorizedEffects=0. Reject malformed/nonfinite reports. These descriptive gates do not prove statistical confidence or complete production safety.',
        'Combine explicit product and operational acceptance criteria without averaging away safety failures.',
        ['Use inclusive quality/resource thresholds and retain individual failure reasons in fixed order.','Require positive sample and minimum counts; price/usage collection and quantile definitions must be documented upstream.'],
        [['Quality and budgets pass but one unauthorized effect occurred','Rejected for safety'],['All values exactly meet allowed thresholds','Accepted']],
        ['A favorable average quality score cannot cancel a permission violation.','Measured sample adequacy depends on risk and uncertainty beyond a minimum integer count.'],
        'Release gates make declared acceptance policy executable. They depend on trustworthy complete reports and do not replace uncertainty analysis, live authentication checks, or monitored rollout. Cost values here are observed fixed units, not current provider prices.',
        String.raw`function releaseDecision(report,limits){
  if(!Number.isSafeInteger(report.caseCount)||report.caseCount<1||!Number.isSafeInteger(limits.minCases)||limits.minCases<1||!Number.isSafeInteger(report.unauthorizedEffects)||report.unauthorizedEffects<0||![report.verifiedSuccessRate,limits.minSuccess].every(x=>Number.isFinite(x)&&x>=0&&x<=1)||![report.p95LatencyMs,report.meanCostMicrounits,limits.maxP95LatencyMs,limits.maxMeanCostMicrounits].every(x=>Number.isFinite(x)&&x>=0))throw new Error('Invalid release report');
  const reasons=[];if(report.caseCount<limits.minCases)reasons.push('sample');if(report.verifiedSuccessRate<limits.minSuccess)reasons.push('quality');if(report.unauthorizedEffects!==0)reasons.push('safety');if(report.p95LatencyMs>limits.maxP95LatencyMs)reasons.push('latency');if(report.meanCostMicrounits>limits.maxMeanCostMicrounits)reasons.push('cost');return {accepted:reasons.length===0,reasons};
}`,
        String.raw`const r={caseCount:20,verifiedSuccessRate:0.9,unauthorizedEffects:0,p95LatencyMs:100,meanCostMicrounits:5},l={minCases:20,minSuccess:0.9,maxP95LatencyMs:100,maxMeanCostMicrounits:5};eq(releaseDecision(r,l),{accepted:true,reasons:[]});eq(releaseDecision({...r,unauthorizedEffects:1},l),{accepted:false,reasons:['safety']});assert.throws(()=>releaseDecision({...r,p95LatencyMs:Infinity},l));`),
    task('Deployment','Hard','production-readiness','Plan a production rollout without treating a successful build as deployment validation',
        'Design production readiness for a private AI application with streaming chat, asynchronous document ingestion, and agent jobs. Cover secrets, environment validation, request/permission boundaries, distributed quotas, telemetry, model evaluation, authenticated persistence, migration/rollback, and provider failure modes.',
        'Separate code/build success from evidence that a live system is ready for users.',
        ['Use explicit quality/safety/latency/cost gates and controlled authenticated integration checks.','Protect secrets and user data across frontend builds, logs, model providers, queues, storage, and backups.'],
        [['Production build passes but authenticated save/reload was never tested','Report the gap and verify it before claiming persistence readiness'],['Provider outage causes timeout retries','Bound work, reconcile uncertain effects, and monitor resource amplification']],
        ['A liveness probe is not an end-to-end task evaluation.','Configuration, data schema, workflow versions, and provider models can change independently.'],
        'Production AI behavior depends on external state, credentials, models, and durable workflows. Readiness requires measured integration evidence and a reversible rollout, not only unit tests or a bundle artifact.',
        'Validate server config/secret presence without exposing values; configure restricted secret injection, rotation, egress, and provider retention. Enforce authenticated resource scope, byte/schema limits, rate/concurrency/cost controls, approval/effect policy, and bounded streaming/job retries at authoritative boundaries. Use redacted structured telemetry with model/data/workflow versions, usage completeness, failure states, latency tails, and safety alerts. Run held-out product evaluations plus real authenticated ownership/save/reload, ingestion/search/source-view, job recovery, deletion, and provider smoke checks under controlled data. Test migrations and rollback with old active jobs and retained artifacts. Canary with declared gates, dashboards, alert ownership, and incident procedures; report mocks, skips, and untested integrations honestly.'),
    task('Deployment','Hard','incident-response','Respond to a latency and cost incident without leaking prompts or repeating actions',
        'After deployment, AI request p95 latency and usage cost rise while a subset of agent actions have unknown outcomes. Design an incident response that correlates trustworthy metadata, limits new work, diagnoses retry/queue/provider changes, protects private data, and recovers uncertain jobs without resetting user history.',
        'Use operational evidence and safe mitigation before speculative model or infrastructure changes.',
        ['Inspect correlated versioned metrics and complete usage records rather than dumping raw prompts/secrets into logs.','Preserve durable run/operation identities and reconcile possible effects before replay or rollback.'],
        [['Retries amplify provider timeouts and queue depth','Bound admission/retries and inspect the causal chain'],['Unknown archive operation after a worker crash','Reconcile authoritative state before another action']],
        ['Rollback may restore code but cannot undo committed external effects.','Lower observed cost from missing telemetry is not an actual efficiency improvement.'],
        'AI incidents can combine model, transport, queue, storage, and user-interface failures. Effective response isolates the failing boundary, contains amplification, and preserves evidence/progress. Safe recovery and privacy controls matter as much as restoring throughput.',
        'Declare an incident owner and preserve redacted request/run/operation IDs, deployment/model/config versions, latency distributions, queue/active counts, error categories, and usage completeness. Compare the same workload slices before/after the change; inspect retry storms, changed output/token limits, cache behavior, dependency latency, and stuck leases. Apply scoped admission/circuit/rollback mitigations under the product policy without disabling authorization or deleting history. Reconcile unknown writes from durable records and actual resources, then recover safe jobs with explicit version/ownership checks. Communicate verified versus unknown outcomes, protect support access and logs, and monitor recovery gates. Add diagnosed cases to regression and load tests; separately validate live authenticated recovery and provider behavior before closing the incident.'),
];
