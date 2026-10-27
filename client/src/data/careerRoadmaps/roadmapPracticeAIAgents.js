// Local policy/state fixtures never execute model-supplied code or external actions.
const task=(topic,difficulty,slug,title,prompt,objective,requirements,cases,hints,explanation,solution,checks=null)=>({
    id:`ai-agents-${slug}-v1`,career:'AI Engineer',phase:'AI Agents',topic,title,difficulty,
    kind:checks===null?'written':'coding',language:checks===null?'Engineering review':'JavaScript',
    estimatedTime:difficulty==='Easy'?'20–30 minutes':difficulty==='Medium'?'35–55 minutes':'55–90 minutes',
    problemStatement:prompt,simplerProblem:objective,
    learningObjectives:[objective,'Verify boundary cases and distinguish local policy tests from live integration evidence.'],
    prerequisites:['JavaScript ES2022; no external packages or model credentials required','Trusted identity/configuration and inert local fixtures; no external side effects'],
    conceptsToReview:[topic,objective],requirements,
    examples:cases.map(([input,output])=>({input,output,explanation})),tests:cases.map(([input,expected],i)=>({name:`Acceptance case ${i+1}`,input,expected})),
    hints,approach:explanation,walkthrough:cases.map(([input,output])=>`${input} → ${output}`).join('\n')+'\n'+explanation,
    solutionCode:solution,solutionLines:[explanation,...hints],completionCriteria:requirements,
    starterCode:checks===null?'Decision, evidence, failure states, and acceptance criteria:\n':'// Implement the stated local contract.\n',
    commonMistakes:[],followUp:'Add an adversarial boundary case and describe which guarantees require an authoritative integration.',referenceChecks:checks
});
export const AI_AGENTS_PRACTICE=[
    task('Tool Calling','Easy','schema-descriptor','Describe a bounded read tool with a closed argument schema',
        'Return a provider-neutral JSON Schema descriptor for a lookup_status tool. Its argument object has exactly documentId (nonblank string by pattern) and includeHistory (boolean), both required, with additionalProperties=false. This describes an application contract; supported schema subsets must be checked in a real model adapter.',
        'Make tool capability and argument shape explicit before execution.',
        ['Use object properties, required, and additionalProperties fields with the correct types.','Document lookup_status as read-only; schema validation does not establish permission to access a document.'],
        [['Arguments {documentId:d1,includeHistory:false}','Structurally valid under the stated schema'],['Arguments include a tenantId override','Disallowed additional property']],
        ['A required field and a property definition serve different purposes.','Use a pattern requiring at least one nonwhitespace character.'],
        'A schema communicates the requested argument contract but is not itself an authorization mechanism or a guarantee that generated arguments conform. The executor must independently validate arguments and bind authenticated scope. This exercise returns data only, with no tool invocation.',
        String.raw`function statusToolDescriptor(){
  return {name:'lookup_status',description:'Read the status of an authorized document; no mutations.',parameters:{type:'object',properties:{documentId:{type:'string',minLength:1,pattern:'\\S'},includeHistory:{type:'boolean'}},required:['documentId','includeHistory'],additionalProperties:false}};
}`,
        String.raw`const d=statusToolDescriptor();assert.equal(d.parameters.additionalProperties,false);eq(d.parameters.required,['documentId','includeHistory']);assert.equal(d.parameters.properties.includeHistory.type,'boolean');assert.ok(new RegExp(d.parameters.properties.documentId.pattern).test('d1'));assert.equal(new RegExp(d.parameters.properties.documentId.pattern).test('   '),false);`),
    task('Tool Calling','Easy','enum-arguments','Validate a bounded agent lookup request without coercion',
        'Validate parsed tool arguments {itemId,view}, where itemId is a nonblank string of at most 80 UTF-16 code units and view is summary or history. Reject arrays, null, extra properties, inherited fields, and unsupported enum values. Return a fresh validated object without modifying input.',
        'Keep generated tool arguments within a deliberately narrow read capability.',
        ['Require both fields as own properties and allow exactly those keys.','Do not lowercase, trim into a different identifier, or coerce invalid values.'],
        [['{itemId:x,view:summary}','Copied validated arguments'],['{itemId:x,view:admin}','Rejected unsupported view']],
        ['Check exact keys before reading values.','A valid identifier still needs current resource authorization.'],
        'Tool arguments are untrusted even when an upstream model was asked for structured output. Closed enums and bounded strings reduce accidental capability expansion. This validator only establishes shape; the application must derive permissions from trusted identity and resource state.',
        String.raw`function lookupArguments(a){
  if(!a||typeof a!=='object'||Array.isArray(a)||Object.keys(a).length!==2||!['itemId','view'].every(k=>Object.hasOwn(a,k))||typeof a.itemId!=='string'||!a.itemId.trim()||a.itemId.length>80||!['summary','history'].includes(a.view))throw new Error('Invalid lookup arguments');
  return {itemId:a.itemId,view:a.view};
}`,
        String.raw`const a={itemId:'x',view:'summary'};eq(lookupArguments(a),a);assert.notEqual(lookupArguments(a),a);assert.throws(()=>lookupArguments({...a,tenantId:'other'}));assert.throws(()=>lookupArguments({itemId:'x',view:'admin'}));assert.throws(()=>lookupArguments(Object.create(a)));`),
    task('Tool Calling','Easy','bounded-observation','Reject oversized tool observations before model feedback',
        'Implement a tool-observation envelope from a nonblank callId and an already sanitized string result. Enforce a nonnegative UTF-8 byte limit using TextEncoder; return {callId,status:"ok",text} when it fits, otherwise {callId,status:"too_large"}. Do not truncate in the middle of a structured response or return the rejected content.',
        'Bound tool feedback in declared byte units rather than assuming characters equal bytes.',
        ['Measure the complete result string in UTF-8 bytes and accept exact equality.','Reject invalid inputs and preserve call identity on both outcomes.'],
        [['Text é at limit 2 bytes','Accepted'],['Same text at limit 1 byte','too_large without text']],
        ['Unicode code units and encoded bytes differ.','Byte limits are separate from the model’s token budget.'],
        'Tool results can overwhelm context or carry untrusted instructions. Bounded sanitized observations protect a protocol boundary, but content remains data rather than privileged authority. A live system also needs token-aware context accounting, secret redaction, and an explicit large-result retrieval policy.',
        String.raw`function boundedObservation(callId,text,maxBytes){
  if(typeof callId!=='string'||!callId.trim()||typeof text!=='string'||!Number.isSafeInteger(maxBytes)||maxBytes<0)throw new Error('Invalid observation');
  return new TextEncoder().encode(text).length<=maxBytes?{callId,status:'ok',text}:{callId,status:'too_large'};
}`,
        String.raw`eq(boundedObservation('c','é',2),{callId:'c',status:'ok',text:'é'});eq(boundedObservation('c','é',1),{callId:'c',status:'too_large'});assert.throws(()=>boundedObservation('','x',1));`),
    task('Tool Calling','Medium','retry-delay','Plan capped retry delays only for eligible read failures',
        'Implement a local retry policy for trusted read-tool errors. Timeout and unavailable are eligible; denied, invalid_arguments, and unknown categories are not. Given completed retry count, maximum retries, positive base/cap milliseconds, and supplied jitter fraction u in [0,1), return full-jitter delay u*min(cap,base*2^retries), or null when ineligible/exhausted. Writes are never retried by this helper.',
        'Separate transient failure classification from bounded retry scheduling.',
        ['Validate finite limits and nonnegative integer retry counts.','Return null for write effects even on timeout; ambiguous writes require reconciliation and idempotency.'],
        [['Read timeout, retries=1, base=100, cap=1000, u=0.5','Delay 100 milliseconds'],['Write timeout','null']],
        ['A timeout does not prove a side effect failed.','Injecting u makes schedule tests reproducible without real sleeps.'],
        'Exponential backoff with jitter spreads retries, but classification and budgets matter more than the formula. Authentication failures and invalid arguments need correction rather than repetition. This planner performs no timer or network action and does not guarantee backend retry safety.',
        String.raw`function readRetryDelay(effect,category,retries,maxRetries,base,cap,u){
  if(![retries,maxRetries].every(x=>Number.isSafeInteger(x)&&x>=0)||![base,cap,u].every(Number.isFinite)||base<=0||cap<=0||u<0||u>=1)throw new Error('Invalid retry policy');
  if(effect!=='read'||!['timeout','unavailable'].includes(category)||retries>=maxRetries)return null;
  return u*Math.min(cap,base*2**retries);
}`,
        String.raw`assert.equal(readRetryDelay('read','timeout',1,3,100,1000,0.5),100);assert.equal(readRetryDelay('write','timeout',0,3,100,1000,0.5),null);assert.equal(readRetryDelay('read','denied',0,3,100,1000,0.5),null);assert.equal(readRetryDelay('read','timeout',3,3,100,1000,0.5),null);`),
    task('Tool Calling','Medium','capability-intersection','Expose only tools allowed by both run scope and user grant',
        'Given a trusted registry of descriptors {name,effect}, a run-level allowed-name set, and an authenticated user grant set, return unique descriptors permitted by both sets. Unknown effects are configuration errors; duplicate registry names are rejected. An effect is read or write, and write tools are additionally disabled unless allowWrites=true.',
        'Limit agent-visible capabilities before argument and resource authorization.',
        ['Preserve registry order and return copied descriptors.','Do not treat visibility in the returned list as authorization for every possible resource.'],
        [['User grants search/delete, run permits search only','Expose search only'],['Both grant delete but allowWrites=false','Do not expose delete']],
        ['Intersect trusted constraints rather than unioning them.','Resource checks must still run at execution because permissions can change.'],
        'Capability exposure narrows what a model can propose but does not replace execution-time enforcement. Separate run policy, principal grants, effect classes, and resource scope to keep boundaries inspectable. Model text must never modify these trusted sets.',
        String.raw`function visibleTools(registry,runAllowed,userGrants,allowWrites){
  if(typeof allowWrites!=='boolean'||new Set(registry.map(r=>r.name)).size!==registry.length||!registry.every(r=>typeof r.name==='string'&&r.name.trim()&&['read','write'].includes(r.effect)))throw new Error('Invalid registry');
  return registry.filter(r=>runAllowed.has(r.name)&&userGrants.has(r.name)&&(r.effect==='read'||allowWrites)).map(r=>({...r}));
}`,
        String.raw`const r=[{name:'search',effect:'read'},{name:'delete',effect:'write'}];eq(visibleTools(r,new Set(['search']),new Set(['search','delete']),true),[{name:'search',effect:'read'}]);eq(visibleTools(r,new Set(['delete']),new Set(['delete']),false),[]);assert.throws(()=>visibleTools([r[0],r[0]],new Set(),new Set(),false));`),
    task('Tool Calling','Medium','result-lifecycle','Accept one matching result for a pending tool call',
        'Implement a pure transition for a tool call state {id,status}, where status is pending, succeeded, or failed. A result event contains callId and ok boolean. Only a matching pending call can transition; mismatched IDs and duplicate/late results throw. Return a new terminal state with only the corresponding status, without executing anything.',
        'Correlate asynchronous tool completion and prevent duplicate terminal transitions.',
        ['Require a nonblank stored call ID and boolean result flag.','Preserve the original state and reject contradictory later outcomes.'],
        [['Pending c1 receives ok=true for c1','Succeeded c1'],['Succeeded c1 receives a failure result','Rejected late result']],
        ['Check identity and current status before applying the result.','Network retries can deliver duplicate observations even if work executed once.'],
        'Tool state transitions need explicit correlation rather than assuming arrival order. This strict reducer rejects duplicates so a caller can log or reconcile them separately. A durable service must enforce the same transition atomically to handle concurrent deliveries.',
        String.raw`function settleCall(state,event){
  if(typeof state?.id!=='string'||!state.id.trim()||state.status!=='pending'||event?.callId!==state.id||typeof event.ok!=='boolean')throw new Error('Unexpected tool result');
  return {...state,status:event.ok?'succeeded':'failed'};
}`,
        String.raw`const s={id:'c1',status:'pending'};eq(settleCall(s,{callId:'c1',ok:true}),{id:'c1',status:'succeeded'});assert.equal(s.status,'pending');assert.throws(()=>settleCall(s,{callId:'c2',ok:true}));assert.throws(()=>settleCall({id:'c1',status:'succeeded'},{callId:'c1',ok:false}));`),
    task('Tool Calling','Hard','canonical-intent','Canonicalize validated JSON intent for idempotency binding',
        'Implement deterministic serialization for validated JSON-like tool arguments using recursively sorted object keys while preserving array order. Support null, strings, booleans, finite numbers, dense arrays, and plain data objects; reject undefined, sparse arrays, nonfinite numbers, cycles, and nonplain objects. Inputs are JSON-parsed data without accessors/proxies. A serialized fingerprint is not a signature or authorization proof.',
        'Bind an idempotency identity to an unambiguous validated argument representation.',
        ['Treat repeated references as legal when they do not form a cycle.','Do not reorder arrays or use ambiguous delimiter concatenation; reject depth above 32.'],
        [['{b:2,a:1} and {a:1,b:2}','Same canonical string'],['[1,2] versus [2,1]','Different strings']],
        ['Use an ancestor set for cycle detection, not a permanent seen set.','Sort keys before serializing each object’s key/value pairs.'],
        'Canonical intent binding helps detect conflicting reuse of an operation key, but durable atomic reservations and authorization are separate requirements. This is a scoped local JSON convention, not a claim to implement a standardized cryptographic canonicalization format.',
        String.raw`function canonicalIntent(value){
  const ancestors=new Set();
  function visit(v,depth){
    if(depth>32)throw new Error('Excess depth');if(v===null||typeof v==='string'||typeof v==='boolean')return JSON.stringify(v);
    if(typeof v==='number'){if(!Number.isFinite(v))throw new Error('Nonfinite');return JSON.stringify(v);}
    if(typeof v!=='object'||ancestors.has(v))throw new Error('Unsupported or cyclic value');
    ancestors.add(v);let result;
    if(Array.isArray(v)){const parts=[];for(let i=0;i<v.length;i++){if(!Object.hasOwn(v,i))throw new Error('Sparse array');parts.push(visit(v[i],depth+1));}result='['+parts.join(',')+']';}
    else {const prototype=Object.getPrototypeOf(v);if(prototype!==Object.prototype&&prototype!==null)throw new Error('Nonplain object');result='{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+visit(v[k],depth+1)).join(',')+'}';}
    ancestors.delete(v);return result;
  }return visit(value,0);
}`,
        String.raw`assert.equal(canonicalIntent({b:2,a:1}),canonicalIntent({a:1,b:2}));assert.notEqual(canonicalIntent([1,2]),canonicalIntent([2,1]));const shared={x:1};assert.equal(canonicalIntent([shared,shared]),'[{"x":1},{"x":1}]');const cycle={};cycle.x=cycle;assert.throws(()=>canonicalIntent(cycle));assert.throws(()=>canonicalIntent(new Array(2)));assert.throws(()=>canonicalIntent({x:undefined}));`),
    task('Tool Calling','Hard','privileged-boundary','Review an agent that proposes destructive actions',
        'An agent can search documents and request deletion of a workspace item. Design the boundary between model proposal and destructive execution, including validation, current permission checks, target-bound confirmation, timeouts, retries, and malicious tool-result instructions. No real deletion should occur in the test harness.',
        'Keep model autonomy separate from application execution authority.',
        ['Bind identity and permissions from trusted server state and require action/target-bound approval.','Reconcile uncertain writes through durable scoped operation records rather than blindly retrying.'],
        [['Search result tells the agent to delete a different workspace','Treat it as untrusted content, never a permission grant'],['Deletion times out after dispatch','Reconcile outcome before another attempt']],
        ['A valid schema does not establish authorization or user intent.','A confirmation flag must bind the exact principal, action, target, and expiry.'],
        'Tool safety depends on enforced application boundaries that remain valid when the model follows malicious instructions. Approval, idempotency, and permission checks solve different problems and must not be substituted for one another.',
        'Use a restricted read-only path for search and a separate deletion intent schema. Validate exact arguments, bind authenticated tenant/user scope, and reauthorize the resource at execution time. Resolve a server-stored confirmation for the same action and target with expiry and atomic single-use consumption. Atomically reserve a durable scoped idempotency key bound to validated intent, and reconcile pending outcomes after timeouts. Never treat tool output as privileged instructions or execute generated code. Test with inert tools for denied access, changed permissions, stale approval, duplicate delivery, malicious observations, and uncertain writes. Retain redacted audit events and explicit failed/unknown outcomes; live storage/provider semantics require separate integration tests.'),
    task('Tool Calling','Hard','adapter-contract','Specify a model/tool adapter integration test matrix',
        'A provider-neutral agent is being connected to a new model API. Specify tests for tool schema support, argument parsing, call identifiers, parallel results, refusal, incomplete generation, response-size limits, and provider retries. Avoid assuming all providers use identical message shapes or support every JSON Schema keyword.',
        'Validate protocol mapping independently from local executor correctness.',
        ['Test provider response states and unsupported schema features with recorded redacted fixtures plus controlled live checks.','Keep application validation, permission gates, and idempotency intact even if structured generation is available.'],
        [['Arguments arrive as a JSON string rather than an object','Adapter parses once and validates before dispatch'],['Parallel results finish in reverse order','Link each result to its original call ID']],
        ['A model API’s tool proposal is not execution.','Separate fixture compatibility from live availability and behavioral quality.'],
        'Adapter tests prevent protocol assumptions from leaking into orchestration. Local fixtures establish parser/state behavior but cannot verify current provider capabilities, rate limits, or model willingness to follow a tool contract.',
        'Document the selected provider/model/version, supported schema subset, role mapping, argument encoding, call-ID rules, terminal states, and usage accounting. Build redacted fixtures for valid calls, duplicate/missing IDs, malformed arguments, multiple calls, refusal, truncation, and transport failures. Assert that invalid or incomplete responses never reach execution and that result linkage survives reordering. Exercise bounded retries and cancellation with inert tools, including uncertain write outcomes. Run a separate permission-approved live smoke test without destructive capabilities, record model/version and observed limits, and report fixture versus live results honestly. Preserve server-side validation and authorization as independent gates.'),
    task('Agent Architecture','Easy','loop-transition','Represent an observe-decide-act cycle as explicit states',
        'Implement a pure transition for an agent state phase observe, decide, act, or done. Legal events are observation_received:observe→decide, tool_selected:decide→act, tool_completed:act→observe, and answer_selected:decide→done. Reject all other state/event pairs, including attempts to leave done.',
        'Model orchestration as enforced transitions rather than an unrestricted loop.',
        ['Return a new state while preserving unrelated state fields.','Reject unknown phases/events and do not execute a tool as a transition side effect.'],
        [['Observe plus observation_received','Decide'],['Done plus tool_selected','Rejected terminal-state transition']],
        ['Encode legal source and target phases in one transition table.','A transition describes control flow; an executor handles effects separately.'],
        'An explicit state machine makes allowed agent behavior inspectable. Distinguishing decision from action prevents a model response from directly causing an effect. This reducer covers normal flow only; failures, approvals, and budgets need additional guarded transitions.',
        String.raw`function loopTransition(state,event){
  const rules={observation_received:['observe','decide'],tool_selected:['decide','act'],tool_completed:['act','observe'],answer_selected:['decide','done']};
  if(!Object.hasOwn(rules,event)||state.phase!==rules[event][0])throw new Error('Illegal transition');return {...state,phase:rules[event][1]};
}`,
        String.raw`const s={phase:'observe',runId:'r'};eq(loopTransition(s,'observation_received'),{phase:'decide',runId:'r'});assert.equal(s.phase,'observe');assert.throws(()=>loopTransition({phase:'done'},'tool_selected'));assert.throws(()=>loopTransition(s,'constructor'));`),
    task('Agent Architecture','Easy','stop-priority','Apply deterministic stopping priorities before another step',
        'Implement a run guard from trusted cancellation flag, current monotonic time, deadline, used/max tool calls, and goalReached boolean. Priority is cancelled, then goal_reached, then deadline, then call_budget, otherwise continue. Time equality reaches the deadline. This guard runs before authorizing another effect; reaching a goal does not undo prior violations.',
        'Define stopping conditions and tie precedence explicitly.',
        ['Validate booleans, finite timestamps, and nonnegative safe integer call counts.','Return exactly one reason without changing run state.'],
        [['Goal reached exactly at deadline, not cancelled','goal_reached under the stated priority'],['No goal, used equals maximum','call_budget']],
        ['Choose precedence instead of relying on accidental if ordering.','Use one clock convention consistently for now and deadline.'],
        'Termination policies prevent runaway loops and make reports reproducible. A success event can coincide with resource exhaustion, so the policy must state which reason is reported. A guard is not a cancellation mechanism for an effect already in flight.',
        String.raw`function runGuard(cancelled,goalReached,now,deadline,used,max){
  if(typeof cancelled!=='boolean'||typeof goalReached!=='boolean'||![now,deadline].every(Number.isFinite)||![used,max].every(x=>Number.isSafeInteger(x)&&x>=0))throw new Error('Invalid run guard');
  if(cancelled)return 'cancelled';if(goalReached)return 'goal_reached';if(now>=deadline)return 'deadline';if(used>=max)return 'call_budget';return 'continue';
}`,
        String.raw`assert.equal(runGuard(false,true,10,10,2,2),'goal_reached');assert.equal(runGuard(false,false,1,10,2,2),'call_budget');assert.equal(runGuard(true,true,1,10,0,2),'cancelled');assert.equal(runGuard(false,false,1,10,0,2),'continue');`),
    task('Agent Architecture','Easy','registry-wiring','Reject tools without a validator when composing an executor',
        'Build an application-owned tool registry Map from descriptors {name,validate,execute}. Require unique nonblank names and callable validator/executor references. Return the Map without invoking either function. Model output may select a name but must never register new code through this path.',
        'Make validation part of every registered tool’s execution contract.',
        ['Reject duplicate names or missing functions instead of silently overwriting entries.','Keep composition separate from invocation, permissions, and argument parsing.'],
        [['One valid descriptor','Map contains its registered functions'],['Two descriptors share a name','Configuration rejected']],
        ['Map avoids prototype-name lookups and preserves explicit entries.','A callable executor without a validator is an incomplete registration.'],
        'Registry composition is a trusted application operation. Requiring validators improves wiring discipline but does not prove their correctness or authorize every call. A real executor must sequence validation, authorization, approval when needed, and bounded effect execution.',
        String.raw`function composeRegistry(descriptors){
  const registry=new Map();for(const d of descriptors){if(typeof d.name!=='string'||!d.name.trim()||registry.has(d.name)||typeof d.validate!=='function'||typeof d.execute!=='function')throw new Error('Incomplete tool registration');registry.set(d.name,{validate:d.validate,execute:d.execute});}return registry;
}`,
        String.raw`let calls=0;const d={name:'lookup',validate:x=>x,execute:()=>{calls++}};assert.equal(composeRegistry([d]).get('lookup').execute,d.execute);assert.equal(calls,0);assert.throws(()=>composeRegistry([d,d]));assert.throws(()=>composeRegistry([{name:'x',execute:()=>0}]));`),
    task('Agent Architecture','Medium','trace-replay','Replay a strictly ordered control-flow journal',
        'Replay an agent journal from initial phase observe, a trusted run ID, and events {runId,sequence,type}. Sequences start at one with no gaps. Legal event types are observed:observe→decide, proposed:decide→act, completed:act→observe, finished:decide→done. Reject cross-run, missing, duplicate, or illegal events. Replay must reconstruct control state without repeating effects.',
        'Separate event replay from reexecution and enforce journal ordering.',
        ['Return final phase and lastSequence, including an empty journal.','Reject events after done and never call an external handler during replay.'],
        [['observed,proposed,completed,observed,finished','Final done, lastSequence 5'],['Sequence jumps from 1 to 3','Rejected gap']],
        ['Validate sequence and run identity before applying a phase change.','Replaying a completed event must not rerun its original tool.'],
        'Event journals support recovery only when event identity, ordering, and transition semantics are explicit. Persisting an event is separate from committing an effect, so production systems need durable coordination around uncertain actions. This reference reconstructs control state only.',
        String.raw`function replayJournal(runId,events){
  let phase='observe',lastSequence=0;const rules={observed:['observe','decide'],proposed:['decide','act'],completed:['act','observe'],finished:['decide','done']};
  for(const e of events){if(e.runId!==runId||e.sequence!==lastSequence+1||!Object.hasOwn(rules,e.type)||rules[e.type][0]!==phase)throw new Error('Invalid journal');phase=rules[e.type][1];lastSequence=e.sequence;}return {phase,lastSequence};
}`,
        String.raw`const types=['observed','proposed','completed','observed','finished'];const events=types.map((type,i)=>({runId:'r',sequence:i+1,type}));eq(replayJournal('r',events),{phase:'done',lastSequence:5});assert.throws(()=>replayJournal('r',[events[0],{...events[1],sequence:3}]));assert.throws(()=>replayJournal('other',events));eq(replayJournal('r',[]),{phase:'observe',lastSequence:0});`),
    task('Agent Architecture','Medium','checkpoint-version','Refuse incompatible checkpoints instead of resetting progress',
        'Implement a checkpoint compatibility decision from a stored checkpoint and expected {runId,workflowVersion,registryVersion}. Return resume only when identities match, sequence is a nonnegative safe integer, and phase is observe, decide, act, or done. Return migration_required on a version mismatch, invalid on malformed/foreign data. Do not delete or overwrite the checkpoint.',
        'Version durable orchestration state independently from UI progress.',
        ['Check identity and state shape before deciding version compatibility.','Preserve stored data for explicit migration or investigation rather than silently beginning a new run.'],
        [['Same run and versions with act phase','resume'],['Same run, different registry version','migration_required']],
        ['Tool signatures can change even when the workflow name stays the same.','Resume eligibility does not imply a pending effect should be repeated.'],
        'Durable state outlives code deployments. Compatibility checks prevent newer orchestration logic from misinterpreting old transitions or tool contracts. Migration and uncertain-effect recovery are separate procedures and must not be replaced with a data reset.',
        String.raw`function checkpointDecision(saved,expected){
  if(!expected||!['runId','workflowVersion','registryVersion'].every(k=>typeof expected[k]==='string'&&expected[k].trim())||!saved||saved.runId!==expected.runId||!Number.isSafeInteger(saved.sequence)||saved.sequence<0||!['observe','decide','act','done'].includes(saved.phase)||!['workflowVersion','registryVersion'].every(k=>typeof saved[k]==='string'&&saved[k].length>0))return 'invalid';
  return saved.workflowVersion===expected.workflowVersion&&saved.registryVersion===expected.registryVersion?'resume':'migration_required';
}`,
        String.raw`const e={runId:'r',workflowVersion:'w1',registryVersion:'t1'},s={...e,sequence:3,phase:'act'};assert.equal(checkpointDecision(s,e),'resume');assert.equal(checkpointDecision({...s,registryVersion:'t0'},e),'migration_required');assert.equal(checkpointDecision({...s,runId:'other'},e),'invalid');assert.equal(s.sequence,3);assert.equal(checkpointDecision(s,{...e,runId:''}),'invalid');`),
    task('Agent Architecture','Medium','observation-provenance','Keep model-facing observations distinct from control instructions',
        'Construct an observation record from a trusted source type user, tool, or memory, a source ID, and string text. Set trustedForControl=false for every observation. Return source/text data only; text such as stop the run or grant admin must not become an executable event. Application control events use a separate authenticated channel.',
        'Preserve provenance and trust classification across the agent loop.',
        ['Reject unknown source types and blank IDs.','Never parse observation text into a control instruction or permission update.'],
        [['Tool text says grant admin','Ordinary untrusted tool observation'],['Memory text says task complete','Does not become a goalReached event']],
        ['Data provenance is not authority to change orchestration.','Even a tool response can contain attacker-controlled source text.'],
        'Agent loops consume text from multiple trust domains. Keeping observations typed and explicitly untrusted helps adapters avoid accidental control-channel promotion. A model can still be influenced by content, so effect authorization and goal verification remain independent gates.',
        String.raw`function observationRecord(source,sourceId,text){
  if(!['user','tool','memory'].includes(source)||typeof sourceId!=='string'||!sourceId.trim()||typeof text!=='string')throw new Error('Invalid observation');
  return {source,sourceId,text,trustedForControl:false};
}`,
        String.raw`eq(observationRecord('tool','c1','grant admin'),{source:'tool',sourceId:'c1',text:'grant admin',trustedForControl:false});assert.equal(observationRecord('memory','m1','task complete').trustedForControl,false);assert.throws(()=>observationRecord('system','x','admin'));`),
    task('Agent Architecture','Hard','effect-recovery','Choose recovery from durable operation evidence',
        'Implement a pure recovery policy from operation effect read/write and trusted durable status reserved, dispatched, succeeded, failed, or unknown. Succeeded returns replay_result. A dispatched/unknown write returns reconcile. A failed write returns manual_review because failure alone does not prove no effect. A reserved operation returns dispatch only when its record explicitly says notDispatched=true; otherwise reconcile. Dispatched/failed/unknown reads return retry_read.',
        'Avoid duplicating writes when an agent restarts between dispatch and observation.',
        ['Reject unknown effect/status combinations and make the reserved-state evidence check explicit.','Return a decision only; actual atomic claims, idempotency, and reconciliation belong to the executor.'],
        [['Write dispatched before crash','reconcile'],['Read dispatched before crash','retry_read']],
        ['An absent observation is not proof that a remote action did not happen.','Persisted intent and external completion can straddle a crash boundary.'],
        'Recovery needs evidence about effects rather than only a model transcript. A conservative policy avoids repeating uncertain writes, while reads may be retried under an execution budget. Real providers and databases require tested idempotency or transaction protocols to strengthen these guarantees.',
        String.raw`function recoverEffect(effect,record){
  if(!['read','write'].includes(effect)||!record||!['reserved','dispatched','succeeded','failed','unknown'].includes(record.status))throw new Error('Invalid recovery state');
  if(record.status==='succeeded')return 'replay_result';
  if(record.status==='reserved')return record.notDispatched===true?'dispatch':'reconcile';
  if(effect==='read')return 'retry_read';return record.status==='failed'?'manual_review':'reconcile';
}`,
        String.raw`assert.equal(recoverEffect('write',{status:'dispatched'}),'reconcile');assert.equal(recoverEffect('read',{status:'dispatched'}),'retry_read');assert.equal(recoverEffect('write',{status:'reserved',notDispatched:true}),'dispatch');assert.equal(recoverEffect('write',{status:'reserved'}),'reconcile');assert.equal(recoverEffect('write',{status:'failed'}),'manual_review');`),
    task('Agent Architecture','Hard','loop-design','Design a bounded agent loop with inspectable failure states',
        'Design an observe-decide-act architecture for a research assistant that reads sources and drafts an answer. Include input provenance, model terminal states, tool proposals, stopping conditions, cancellation, malformed responses, and uncertain execution. Do not require hidden chain-of-thought; log decisions and evidence sufficient for operational review.',
        'Define orchestration invariants before selecting an agent framework.',
        ['Separate model proposals from validated/authorized effects and verified goal completion.','Bound calls, tokens, time, observation sizes, and repairs; make failures visible instead of looping indefinitely.'],
        [['Model proposes an unknown tool','Reject under the registry contract and bounded repair policy'],['User cancels while a read is running','Stop scheduling new work and propagate supported cancellation; record late observations safely']],
        ['A final-sounding answer is not independent task-success evidence.','Cancellation does not automatically reverse an effect already committed.'],
        'An agent architecture is a control system around uncertain model outputs and external operations. Explicit states and guards make failure behavior testable. Framework abstractions cannot substitute for permission boundaries, durable effects, or a measurable success contract.',
        'Define typed run states, trusted control events, untrusted observations, and a versioned tool registry. At every step check cancellation/deadline/budgets, build bounded context, and map model responses into final/proposal/refusal/incomplete outcomes. Validate proposed tools and arguments, bind authenticated scope, enforce approval/effect policy, and persist operation identity before dispatch. Correlate bounded results to call IDs and resume through an explicit observation transition. Verify final claims/task completion against source evidence, allow abstention, and record redacted decision/effect summaries rather than private reasoning. Test every transition with inert tools, then separately test provider and persistence integration under retries and crashes.'),
    task('Agent Architecture','Hard','rollout-recovery','Plan a workflow upgrade while old runs remain active',
        'An agent deployment changes tool arguments and workflow state while some old runs are waiting for results. Design a rollout and recovery plan covering version-pinned runs, checkpoint migration, old tool-result delivery, cancellation, and rollback without deleting user work or blindly replaying effects.',
        'Treat active runs as versioned durable workflows rather than disposable prompts.',
        ['Pin workflow/registry versions and define explicit migration compatibility rules.','Preserve operation IDs and reconcile uncertain writes; test upgrades and rollback with in-flight events.'],
        [['Old result arrives after a registry upgrade','Route to its original run/version and validate the expected contract'],['New workflow cannot interpret an old checkpoint','Pause for migration/review rather than resetting it']],
        ['A code rollback does not undo external effects.','Migrate state and protocol expectations together.'],
        'Long-lived runs can cross software deployments, so versioning and recovery are part of the architecture. Compatibility needs operational evidence under in-flight events and failures. Silent resets lose progress and can repeat actions.',
        'Inventory active run versions, checkpoint schemas, registry contracts, pending operations, and provider call identities. Keep compatible old workers/adapters available or drain runs before switching. Gate migrations on versioned validators and dry-run fixtures; retain original snapshots and an audit trail. Route late results using run/call/version identity, reject duplicates, and reconcile uncertain effects through durable operation records. Canary new runs separately, monitor failures/budgets, and test cancellation plus rollback at each dispatch/commit boundary. Preserve user-visible progress and surface migration-required states. Document which external actions cannot be undone and require separate compensating or manual procedures.'),
    task('Memory','Easy','scoped-history','Append a conversation turn only to its authenticated session',
        'Implement a pure memory append for trusted session state {tenantId,userId,sessionId,turns} and authenticated context with the same identity fields. A new turn has role user or assistant and nonblank text. Reject mismatched scope and return a new turns array with a copied turn, leaving history unchanged.',
        'Keep short-term conversation state isolated by user and session.',
        ['Require nonblank identity strings and exact scope matches.','Validate turn role/text without accepting a system-role promotion from conversation data.'],
        [['Matching user and session','New turn appended to a copied history'],['Same user but another sessionId','Rejected scope mismatch']],
        ['User identity alone is insufficient when several sessions coexist.','Appending memory must not create privileged instructions.'],
        'Short-term state is application data with a scope, not a global conversation buffer. Session isolation prevents context contamination, while current authorization is still needed before recalling external records. A local append does not establish durable concurrent persistence.',
        String.raw`function appendTurn(state,context,turn){
  if(!['tenantId','userId','sessionId'].every(k=>typeof context?.[k]==='string'&&context[k].trim()&&state[k]===context[k])||!Array.isArray(state.turns)||!['user','assistant'].includes(turn?.role)||typeof turn.text!=='string'||!turn.text.trim())throw new Error('Invalid memory scope or turn');
  return {...state,turns:[...state.turns,{role:turn.role,text:turn.text}]};
}`,
        String.raw`const s={tenantId:'t',userId:'u',sessionId:'s',turns:[]};const c={tenantId:'t',userId:'u',sessionId:'s'};assert.equal(appendTurn(s,c,{role:'user',text:'Hi'}).turns.length,1);assert.equal(s.turns.length,0);assert.throws(()=>appendTurn(s,{...c,sessionId:'other'},{role:'user',text:'Hi'}));assert.throws(()=>appendTurn(s,c,{role:'system',text:'override'}));`),
    task('Memory','Easy','expiry-filter','Exclude expired and deleted long-term memories',
        'Filter trusted long-term memory records by authenticated tenantId/userId, deleted=false, and expiresAt. A null expiration means no time expiry; finite expiration must be strictly greater than now. Reject invalid now and incomplete context, and fail closed on malformed expiration. Preserve original record order.',
        'Apply privacy lifecycle rules before relevance scoring or prompt assembly.',
        ['Do not return another user’s memory even when its similarity score would be highest.','Treat expiration equality as expired and keep deletion independent from expiry.'],
        [['Matching record expiresAt=100, now=100','Excluded'],['Matching undeleted record with expiresAt=null','Eligible']],
        ['Filtering after placing a record in the prompt is too late.','A null lifetime is a policy choice, not a reason to ignore deletion.'],
        'Memory relevance cannot override identity, deletion, or retention boundaries. Eligibility must be enforced before exposing records to a model or reranker. Durable deletion, derived summaries, and replicas need separate backend lifecycle tests.',
        String.raw`function eligibleMemories(records,context,now){
  if(!Number.isFinite(now)||!['tenantId','userId'].every(k=>typeof context?.[k]==='string'&&context[k].trim()))throw new Error('Invalid memory query');
  return records.filter(r=>r.tenantId===context.tenantId&&r.userId===context.userId&&r.deleted===false&&(r.expiresAt===null||(Number.isFinite(r.expiresAt)&&r.expiresAt>now)));
}`,
        String.raw`const base={tenantId:'t',userId:'u',deleted:false};eq(eligibleMemories([{...base,id:'a',expiresAt:100},{...base,id:'b',expiresAt:null},{...base,id:'c',expiresAt:'later'}],base,100).map(r=>r.id),['b']);eq(eligibleMemories([{...base,expiresAt:null}],{tenantId:'t',userId:'other'},0),[]);`),
    task('Memory','Easy','profile-projection','Project only permitted preference fields into persistent memory',
        'Given an application-reviewed profile patch, return only own fields language and timezone when they are nonblank strings. Ignore all other keys, including secrets, raw transcripts, admin flags, and inherited properties. Do not infer consent or sensitive attributes; this local projection assumes consent and purpose checks already happened.',
        'Minimize persistent memory rather than saving every observed detail.',
        ['Use a fixed allowlist and copy primitive preference values only.','Reject invalid allowed-field values instead of converting them.'],
        [['Patch language=en plus apiKey=secret','Persist only language'],['Inherited timezone field','Do not persist it']],
        ['An allowlist is easier to audit than a growing secret-key denylist.','Data minimization complements consent and retention rather than replacing them.'],
        'Long-term memory should store only information needed for a declared purpose. A projection limits accidental persistence but does not detect secrets embedded inside an allowed string. Real intake needs validation, review/consent, access control, retention, and deletion policies.',
        String.raw`function preferenceMemory(patch){
  const out={};for(const key of ['language','timezone'])if(Object.hasOwn(patch,key)){if(typeof patch[key]!=='string'||!patch[key].trim())throw new Error('Invalid preference');out[key]=patch[key];}return out;
}`,
        String.raw`eq(preferenceMemory({language:'en',apiKey:'secret',admin:true}),{language:'en'});eq(preferenceMemory(Object.create({timezone:'UTC'})),{});assert.throws(()=>preferenceMemory({language:42}));`),
    task('Memory','Medium','relevance-decay','Combine relevance and recency under a declared memory policy',
        'Rank already authorized eligible memories {id,relevance,createdAt} using score=alpha*relevance+(1−alpha)*exp(−age/halfLife*ln(2)). Relevance is finite in [0,1], age=now−createdAt>=0, halfLife>0, alpha in [0,1]. Retain input order on exact ties and reject future timestamps. Time values and halfLife use the same units.',
        'Make memory selection preferences measurable instead of treating recency as truth.',
        ['Validate numeric policy inputs and each candidate’s range.','Return IDs/scores without changing stored memories or describing scores as calibrated correctness.'],
        [['Age equals halfLife','Recency component is 0.5'],['alpha=1','Order depends only on supplied relevance']],
        ['Half-life decay uses ln(2), not an arbitrary base.','Eligibility and permissions must be applied before ranking.'],
        'Relevance/recency scoring is a task-specific heuristic for selecting context. New memories can be wrong and old memories can remain useful. Tune the policy against held-out tasks and include retention/contradiction rules rather than assuming score order establishes factual authority.',
        String.raw`function rankMemories(records,now,halfLife,alpha){
  if(![now,halfLife,alpha].every(Number.isFinite)||halfLife<=0||alpha<0||alpha>1||!records.every(r=>Number.isFinite(r.relevance)&&r.relevance>=0&&r.relevance<=1&&Number.isFinite(r.createdAt)&&r.createdAt<=now))throw new Error('Invalid memory scoring');
  return records.map((r,index)=>({id:r.id,score:alpha*r.relevance+(1-alpha)*Math.exp(-(now-r.createdAt)/halfLife*Math.log(2)),index})).sort((a,b)=>b.score-a.score||a.index-b.index).map(({index,...r})=>r);
}`,
        String.raw`assert.ok(Math.abs(rankMemories([{id:'a',relevance:0,createdAt:0}],10,10,0)[0].score-0.5)<1e-12);eq(rankMemories([{id:'a',relevance:0.2,createdAt:10},{id:'b',relevance:0.9,createdAt:0}],10,10,1).map(r=>r.id),['b','a']);assert.throws(()=>rankMemories([{id:'x',relevance:1,createdAt:11}],10,10,0.5));`),
    task('Memory','Medium','summary-lineage','Validate source lineage for a generated memory summary',
        'A summary has nonblank text and a nonempty unique sourceTurnIds list. Validate that every referenced source turn exists in an authorized supplied turn set and predates or equals the summary’s sequence boundary. Reject unsupported IDs, duplicate references, and future source turns. This establishes lineage only, not semantic faithfulness.',
        'Keep summarized memory traceable to the conversation it compresses.',
        ['Validate a nonnegative integer summary boundary and all referenced source IDs.','Return a copied summary; do not accept a valid source ID as proof it supports every summary assertion.'],
        [['Summary cites existing turns 1 and 2 at boundary 2','Lineage accepted'],['Summary at boundary 2 cites turn 3','Rejected future lineage']],
        ['Source metadata supports auditing but cannot replace entailment review.','Summaries must retain uncertainty and corrections rather than inventing stable facts.'],
        'Summarization compresses information and can introduce omissions or false inferences. Lineage makes review and deletion propagation possible, while semantic support needs separate human or validated-judge evaluation. Source authorization must already have been enforced.',
        String.raw`function summaryLineage(summary,turns,boundary){
  if(!Number.isSafeInteger(boundary)||boundary<0||typeof summary?.text!=='string'||!summary.text.trim()||!Array.isArray(summary.sourceTurnIds)||!summary.sourceTurnIds.length||new Set(summary.sourceTurnIds).size!==summary.sourceTurnIds.length||new Set(turns.map(t=>t.id)).size!==turns.length)throw new Error('Invalid summary');
  const byId=new Map(turns.map(t=>[t.id,t]));for(const id of summary.sourceTurnIds){const t=byId.get(id);if(!t||!Number.isSafeInteger(t.sequence)||t.sequence<0||t.sequence>boundary)throw new Error('Invalid lineage');}return {text:summary.text,sourceTurnIds:[...summary.sourceTurnIds]};
}`,
        String.raw`const turns=[{id:'a',sequence:1},{id:'b',sequence:2},{id:'c',sequence:3}];eq(summaryLineage({text:'Summary',sourceTurnIds:['a','b']},turns,2),{text:'Summary',sourceTurnIds:['a','b']});assert.throws(()=>summaryLineage({text:'Summary',sourceTurnIds:['c']},turns,2));assert.throws(()=>summaryLineage({text:'Summary',sourceTurnIds:['missing']},turns,2));`),
    task('Memory','Medium','derived-invalidation','Invalidate summaries transitively after a source-memory deletion',
        'Given unique memory/summary records {id,dependsOn:[ids]} and deleted source IDs, return all affected IDs in original record order. A record is affected if directly deleted or if any transitive dependency is affected. Deleted IDs may refer to already removed source records. Handle dependency cycles without an infinite loop; do not erase unrelated records.',
        'Propagate privacy deletion across derived memory lineage.',
        ['Compute a fixed point over dependency links and reject duplicate record IDs.','Return an invalidation plan only; durable storage, backups, and model-provider retention require separate enforcement.'],
        [['Summary s depends on a; summary t depends on s; a deleted','Invalidate a if present, plus s and t'],['A cycle unrelated to any deleted source','Do not invalidate it merely because it is cyclic']],
        ['Initialize affected IDs from deletion requests before walking records.','Only add IDs; the finite set guarantees termination.'],
        'Deleting an original turn can leave its information in summaries or extracted memories. Lineage-based invalidation prevents ordinary retrieval of stale derivatives, but physical erasure and retention compliance are backend lifecycle concerns. Rebuilding a summary must use only remaining authorized sources.',
        String.raw`function invalidateDerived(records,deletedIds){
  if(new Set(records.map(r=>r.id)).size!==records.length||!records.every(r=>Array.isArray(r.dependsOn)))throw new Error('Invalid lineage graph');const affected=new Set(deletedIds);let changed=true;
  while(changed){changed=false;for(const r of records)if(!affected.has(r.id)&&r.dependsOn.some(id=>affected.has(id))){affected.add(r.id);changed=true;}}
  return records.filter(r=>affected.has(r.id)).map(r=>r.id);
}`,
        String.raw`const rows=[{id:'a',dependsOn:[]},{id:'s',dependsOn:['a']},{id:'t',dependsOn:['s']},{id:'other',dependsOn:[]}];eq(invalidateDerived(rows,['a']),['a','s','t']);eq(invalidateDerived([{id:'x',dependsOn:['y']},{id:'y',dependsOn:['x']}],['unrelated']),[]);`),
    task('Memory','Hard','optimistic-memory','Plan a version-checked memory update without lost writes',
        'Implement a pure optimistic-update proposal for trusted scoped memory state {version,items}. Given expectedVersion and a validated new item, return conflict when versions differ; otherwise return updated state with version+1 and a copied item array. Require safe nonnegative versions and reject a duplicate item ID. The backend must perform comparison and commit atomically.',
        'Explain why reading then writing state is insufficient for concurrent persistent memory.',
        ['Never mutate the stored state and never overwrite a conflicting version.','Reject version overflow and document that this local function alone is not concurrency control.'],
        [['Stored version 2, expected 1','Conflict with no update'],['Stored version 2, expected 2, new ID','Proposed version 3 preserving prior items']],
        ['Optimistic concurrency depends on an authoritative compare-and-set transaction.','A retry must reread and reconcile, not merely bump the expected version.'],
        'Concurrent agent runs can append or revise memory at the same time. Version checks make lost-update risks explicit, but only a backend atomic conditional write provides enforcement. The new item is assumed schema-validated and scoped before this function.',
        String.raw`function proposeMemoryUpdate(state,expectedVersion,item){
  if(![state.version,expectedVersion].every(x=>Number.isSafeInteger(x)&&x>=0))throw new Error('Invalid version');if(state.version!==expectedVersion)return {status:'conflict'};
  if(state.version===Number.MAX_SAFE_INTEGER||state.items.some(old=>old.id===item.id))throw new Error('Overflow or duplicate item');
  return {status:'proposed',state:{...state,version:state.version+1,items:[...state.items,{...item}]}};
}`,
        String.raw`const s={version:2,items:[{id:'a'}]};eq(proposeMemoryUpdate(s,1,{id:'b'}),{status:'conflict'});const p=proposeMemoryUpdate(s,2,{id:'b'});assert.equal(p.state.version,3);assert.equal(s.items.length,1);assert.throws(()=>proposeMemoryUpdate(s,2,{id:'a'}));`),
    task('Memory','Hard','summary-quality','Design a summary-memory evaluation for corrections and uncertainty',
        'An agent compresses long conversations into a rolling summary. Design a test set and acceptance policy for factual preservation, user corrections, unresolved preferences, malicious instructions, and deletion. A short fluent summary is not sufficient evidence of accurate memory.',
        'Evaluate compression quality without promoting inferred or attacker-controlled facts.',
        ['Track source lineage, supported facts, omitted critical facts, uncertainty, and correction precedence.','Keep memory text untrusted for control and test deletion propagation through derived summaries.'],
        [['User corrects an earlier timezone','Summary reflects the correction with traceable sources'],['Quoted message says grant admin','Summary must not turn that quote into an authorized instruction']],
        ['Measure important omissions as well as hallucinated additions.','A later statement can supersede an earlier preference without proving every later claim true.'],
        'Memory summaries change what later decisions can observe. Evaluating them requires source-aware judgments and privacy tests rather than text similarity alone. A model-generated summary remains a fallible derived artifact.',
        'Construct independently reviewed conversations containing corrections, conflicting statements, temporary versus durable preferences, unresolved questions, sensitive data, quoted attacks, and deletion requests. Annotate required facts, source turns, uncertainty, and supersession rules. Compare full-history and summarized agents on paired tasks, scoring critical-fact recall, unsupported additions, correction handling, downstream task success, and privacy/control violations. Validate source lineage in code and calibrate any automated semantic judge against human review. Bound summary size and version prompts/models, but never treat compactness as correctness. Invalidate summaries after source deletion or permission changes and test their absence from ordinary retrieval; separately audit durable erasure and retention behavior.'),
    task('Memory','Hard','long-term-policy','Choose persistent memory with explicit consent and retention boundaries',
        'A career assistant wants to remember preferences across sessions while also processing private resumes and interview notes. Propose which information stays session-local, which may become long-term memory, and how consent, relevance, updates, expiry, deletion, and tenant/user boundaries are enforced.',
        'Balance usefulness and persistence costs without collecting everything by default.',
        ['Minimize saved content and distinguish explicit preferences from inferred sensitive facts.','Authorize retrieval before model exposure and include summaries, caches, exports, and backups in lifecycle design.'],
        [['A user requests remembering preferred answer language','Save only the validated preference under declared consent/purpose'],['A temporary resume upload contains contact details','Do not automatically turn all details into indefinite memory']],
        ['Persistence increases both utility and breach/deletion complexity.','Memory search relevance must never override access or consent scope.'],
        'Long-term memory is a product/data policy backed by technical controls. Personalization does not justify indiscriminate retention or inferring sensitive characteristics. Local ranking tests cannot establish authenticated storage or deletion guarantees.',
        'Keep raw working context session-scoped by default. Define a small consented preference schema with provenance, purpose, owner, creation/update timestamps, and retention rules; require user review for uncertain extracted facts. Bind reads/writes to authenticated tenant and principal, encrypt and restrict storage, and apply expiry/deletion before semantic ranking. Offer inspect/correct/forget controls and invalidate derived summaries/caches through lineage. Document how backups, audit records, provider retention, and exports are handled. Evaluate personalization benefit and privacy failures on held-out tasks, test concurrent updates and identity isolation against the actual backend, and report mocked versus real persistence checks explicitly.'),
    task('Planning','Easy','ready-steps','Find pending steps whose dependencies succeeded',
        'Given unique plan steps {id,dependsOn,status}, return pending step IDs whose dependencies all have status succeeded. Allowed statuses are pending,running,succeeded,failed. Reject missing dependency IDs and duplicate step IDs; preserve plan order. A failed dependency must not be treated as merely finished and therefore satisfied.',
        'Express task decomposition through explicit prerequisite success.',
        ['Check dependency existence before determining readiness.','Do not select running/completed steps or execute any selected task.'],
        [['b depends on succeeded a','b is ready if pending'],['b depends on failed a','b is not ready']],
        ['Completion and success are different dependency predicates.','No dependencies means a pending step is initially ready.'],
        'Readiness is a scheduling predicate over declared dependencies, not a guarantee the plan achieves the user’s goal. Cycles and failed prerequisites can leave nothing ready, which needs diagnosis rather than an infinite wait. A separate validator or scheduler handles those cases.',
        String.raw`function readySteps(steps){
  const byId=new Map(steps.map(s=>[s.id,s]));if(byId.size!==steps.length||!steps.every(s=>Array.isArray(s.dependsOn)&&['pending','running','succeeded','failed'].includes(s.status)&&s.dependsOn.every(id=>byId.has(id))))throw new Error('Invalid plan');
  return steps.filter(s=>s.status==='pending'&&s.dependsOn.every(id=>byId.get(id).status==='succeeded')).map(s=>s.id);
}`,
        String.raw`eq(readySteps([{id:'a',dependsOn:[],status:'succeeded'},{id:'b',dependsOn:['a'],status:'pending'}]),['b']);eq(readySteps([{id:'a',dependsOn:[],status:'failed'},{id:'b',dependsOn:['a'],status:'pending'}]),[]);assert.throws(()=>readySteps([{id:'b',dependsOn:['missing'],status:'pending'}]));`),
    task('Planning','Easy','reserve-budget','Reserve several resource budgets before scheduling a step',
        'Implement a pure reservation for remaining budgets {calls,tokens,milliseconds} and a step estimate with the same keys. All counts are nonnegative safe integers. If any estimate exceeds its remaining resource return {status:"insufficient"}; otherwise return a new remaining-budget object after subtraction. Estimates are enforced upper limits for scheduling, not promises of actual model usage.',
        'Prevent a plan from borrowing silently across independent budget dimensions.',
        ['Validate each resource and reject negative/fractional values.','All dimensions must fit before any reservation is proposed; leave input objects unchanged.'],
        [['Remaining 2 calls,100 tokens,50 ms; estimate 1,30,20','Remaining 1,70,30'],['Only the token estimate exceeds remaining','Entire reservation rejected']],
        ['Check every dimension first, then subtract.','Execution needs metering and stop behavior when actual usage reaches a limit.'],
        'Budgets constrain planning decisions in separate units. Treating token, call, and time limits as interchangeable can permit runaway work. Local reservation arithmetic requires an authoritative shared ledger when multiple workers schedule concurrently.',
        String.raw`function reserveBudget(remaining,estimate){
  const keys=['calls','tokens','milliseconds'];if(!keys.every(k=>[remaining[k],estimate[k]].every(x=>Number.isSafeInteger(x)&&x>=0)))throw new Error('Invalid budget');
  if(keys.some(k=>estimate[k]>remaining[k]))return {status:'insufficient'};
  return {status:'reserved',remaining:Object.fromEntries(keys.map(k=>[k,remaining[k]-estimate[k]]))};
}`,
        String.raw`const r={calls:2,tokens:100,milliseconds:50};eq(reserveBudget(r,{calls:1,tokens:30,milliseconds:20}),{status:'reserved',remaining:{calls:1,tokens:70,milliseconds:30}});eq(reserveBudget(r,{calls:1,tokens:101,milliseconds:20}),{status:'insufficient'});assert.equal(r.calls,2);`),
    task('Planning','Easy','verified-completion','Require both mandatory steps and an independently verified goal',
        'Return a planning completion decision from validated steps {required:boolean,status} and trusted goalVerified boolean. Allowed statuses are pending,running,succeeded,failed. A required failure returns blocked. All required steps succeeded plus goalVerified returns done. All required steps succeeded without verification returns needs_verification; otherwise continue. Optional failures alone do not block completion.',
        'Separate finishing a checklist from satisfying the task’s acceptance criterion.',
        ['Validate booleans and statuses with explicit decision priority.','A model assertion of success is not the trusted verifier input.'],
        [['Required steps succeed, verifier false','needs_verification'],['Required success and optional failure, verifier true','done']],
        ['Optional work should not accidentally become mandatory.','An empty required set still needs independent goal verification.'],
        'A plan can be internally complete while missing the real user objective. External acceptance checks close that gap and make stopping criteria testable. The meaning and reliability of goal verification must be defined for the task, not inferred from fluent final text.',
        String.raw`function planCompletion(steps,goalVerified){
  if(typeof goalVerified!=='boolean'||!steps.every(s=>typeof s.required==='boolean'&&['pending','running','succeeded','failed'].includes(s.status)))throw new Error('Invalid completion state');
  const required=steps.filter(s=>s.required);if(required.some(s=>s.status==='failed'))return 'blocked';if(required.every(s=>s.status==='succeeded'))return goalVerified?'done':'needs_verification';return 'continue';
}`,
        String.raw`assert.equal(planCompletion([{required:true,status:'succeeded'}],false),'needs_verification');assert.equal(planCompletion([{required:true,status:'succeeded'},{required:false,status:'failed'}],true),'done');assert.equal(planCompletion([{required:true,status:'failed'}],true),'blocked');assert.equal(planCompletion([],false),'needs_verification');`),
    task('Planning','Medium','topological-order','Validate and order a decomposed dependency graph',
        'Return a deterministic topological order for plan steps {id,dependsOn}. Require unique nonblank IDs, unique dependency lists, existing dependency references, and no cycles. Among currently ready steps choose the earliest original plan position. Throw on a cyclic plan instead of returning a partial executable order.',
        'Validate dependencies before treating a generated plan as schedulable.',
        ['Reject missing references, self-cycles, duplicate IDs, and duplicate dependency edges.','Preserve input arrays; support an empty plan.'],
        [['b depends on a but is listed before a','Return a,b'],['a depends on b and b on a','Reject cycle']],
        ['Kahn’s algorithm repeatedly removes ready vertices.','If no remaining vertex is ready, the remaining graph has a cycle.'],
        'Dependency validation converts a proposed plan into an inspectable graph. A valid DAG only establishes ordering feasibility; it does not validate task semantics, permissions, or resource capacity. This small reference scans remaining steps and favors clarity over optimal graph-runtime complexity.',
        String.raw`function orderPlan(steps){
  const ids=new Set(steps.map(s=>s.id));if(ids.size!==steps.length||!steps.every(s=>typeof s.id==='string'&&s.id.trim()&&Array.isArray(s.dependsOn)&&new Set(s.dependsOn).size===s.dependsOn.length&&s.dependsOn.every(id=>ids.has(id))))throw new Error('Invalid dependency graph');
  const done=new Set(),order=[];while(order.length<steps.length){const next=steps.find(s=>!done.has(s.id)&&s.dependsOn.every(id=>done.has(id)));if(!next)throw new Error('Cyclic plan');done.add(next.id);order.push(next.id);}return order;
}`,
        String.raw`eq(orderPlan([{id:'b',dependsOn:['a']},{id:'a',dependsOn:[]}]),['a','b']);assert.throws(()=>orderPlan([{id:'a',dependsOn:['b']},{id:'b',dependsOn:['a']}]));assert.throws(()=>orderPlan([{id:'a',dependsOn:['missing']}]));eq(orderPlan([]),[]);`),
    task('Planning','Medium','replan-descendants','Invalidate dependent outputs without automatically replaying writes',
        'After a trusted failed/changed step ID, propose a revised state for that step and all transitive dependents. Each validated plan step has id,dependsOn,effect read/write,status,result. Affected reads become pending with result=null; affected writes become requires_review with result=null. Unaffected steps retain state. Reject an unknown changed ID and duplicate IDs.',
        'Replan stale dependencies while keeping side-effect recovery explicit.',
        ['Propagate through the full dependency graph, including already completed descendants.','Do not rerun an affected write or assume a prior result remains valid after an upstream change.'],
        [['a changes; read b depends on a; write c depends on b','a/b pending, c requires_review, all affected results cleared'],['Independent succeeded read d','Unchanged']],
        ['Replanning is not the same operation as retrying every step.','Already committed writes need reconciliation or compensation, not blind reexecution.'],
        'Dependency changes can invalidate cached outputs even when downstream work previously succeeded. A conservative revision plan separates recomputable reads from effects needing review. The code proposes states only; production must reconcile actual committed actions and version the accepted plan.',
        String.raw`function replanAfter(steps,changedId){
  const ids=new Set(steps.map(s=>s.id));if(ids.size!==steps.length||!ids.has(changedId)||!steps.every(s=>Array.isArray(s.dependsOn)&&s.dependsOn.every(id=>ids.has(id))&&['read','write'].includes(s.effect)))throw new Error('Invalid plan');
  const affected=new Set([changedId]);let changed=true;while(changed){changed=false;for(const s of steps)if(!affected.has(s.id)&&s.dependsOn.some(id=>affected.has(id))){affected.add(s.id);changed=true;}}
  return steps.map(s=>affected.has(s.id)?{...s,status:s.effect==='write'?'requires_review':'pending',result:null}:{...s});
}`,
        String.raw`const rows=[{id:'a',dependsOn:[],effect:'read',status:'failed',result:1},{id:'b',dependsOn:['a'],effect:'read',status:'succeeded',result:2},{id:'c',dependsOn:['b'],effect:'write',status:'succeeded',result:3},{id:'d',dependsOn:[],effect:'read',status:'succeeded',result:4}];const p=replanAfter(rows,'a');eq(p.map(s=>s.status),['pending','pending','requires_review','succeeded']);assert.equal(p[2].result,null);assert.equal(rows[2].result,3);`),
    task('Planning','Medium','critical-path','Calculate an ideal dependency critical path',
        'Given steps in valid topological order with unique IDs, dependencies, and finite nonnegative duration estimates, compute each earliest finish and the plan makespan assuming unlimited workers and no resource contention. Reject missing or forward dependencies. Explain why this lower-bound model is not a promised wall-clock completion time.',
        'Distinguish dependency latency from total summed work.',
        ['Earliest finish equals duration plus maximum predecessor finish, or duration for a root.','Return zero makespan for an empty plan and preserve estimated durations.'],
        [['Parallel roots a=3,b=5; c=2 depends on both','Makespan 7, not total work 10'],['b refers to a step appearing later','Reject non-topological input']],
        ['Independent roots overlap under the unlimited-worker assumption.','Real concurrency, rate limits, retries, and communication add constraints.'],
        'A critical-path estimate reveals the longest prerequisite chain under an idealized schedule. Total work measures resource demand but need not equal elapsed time. Duration uncertainty and shared resources require separate scheduling and observation.',
        String.raw`function criticalPath(steps){
  const finishes=new Map();let makespan=0;for(const s of steps){if(typeof s.id!=='string'||finishes.has(s.id)||!Number.isFinite(s.duration)||s.duration<0||!s.dependsOn.every(id=>finishes.has(id)))throw new Error('Invalid topological schedule');const start=s.dependsOn.reduce((max,id)=>Math.max(max,finishes.get(id)),0),finish=start+s.duration;if(!Number.isFinite(finish))throw new Error('Duration overflow');finishes.set(s.id,finish);makespan=Math.max(makespan,finish);}return {finishes:[...finishes].map(([id,finish])=>({id,finish})),makespan};
}`,
        String.raw`const p=criticalPath([{id:'a',dependsOn:[],duration:3},{id:'b',dependsOn:[],duration:5},{id:'c',dependsOn:['a','b'],duration:2}]);assert.equal(p.makespan,7);eq(p.finishes,[{id:'a',finish:3},{id:'b',finish:5},{id:'c',finish:7}]);assert.equal(criticalPath([]).makespan,0);assert.throws(()=>criticalPath([{id:'b',dependsOn:['a'],duration:1}]));`),
    task('Planning','Hard','ready-wave','Reserve a deterministic parallel wave under dependencies and shared cost',
        'Select a scheduling wave from validated plan steps {id,dependsOn,status,cost}, with unique IDs and existing dependency references. Only pending steps whose dependencies succeeded before this wave are eligible. In plan order choose steps fitting both positive worker count and nonnegative integer budget; skip an oversized step and continue. Do not make a newly selected predecessor satisfy a dependency within the same wave.',
        'Combine readiness, parallel capacity, and a shared cost reservation.',
        ['Validate nonnegative safe integer costs and supported statuses.','Return selected IDs and remaining budget; this greedy selection need not maximize task count or value.'],
        [['Root a selected; b depends on still-pending a','Do not select b in the same wave'],['First ready step costs 10, budget 3; next costs 2','Skip first, select second']],
        ['Evaluate readiness against the original state snapshot.','A coordinator must commit reservations atomically before dispatching workers.'],
        'Parallel scheduling must respect dependency completion and shared limits. Selecting work is only a proposal until a trusted coordinator reserves ownership and budget. Real task durations and cancellation can change resource availability, requiring feedback rather than static optimism.',
        String.raw`function scheduleWave(steps,workers,budget){
  const byId=new Map(steps.map(s=>[s.id,s]));if(byId.size!==steps.length||!Number.isSafeInteger(workers)||workers<1||!Number.isSafeInteger(budget)||budget<0||!steps.every(s=>Number.isSafeInteger(s.cost)&&s.cost>=0&&['pending','running','succeeded','failed'].includes(s.status)&&s.dependsOn.every(id=>byId.has(id))))throw new Error('Invalid scheduling state');
  const ids=[];let remaining=budget;for(const s of steps)if(ids.length<workers&&s.status==='pending'&&s.dependsOn.every(id=>byId.get(id).status==='succeeded')&&s.cost<=remaining){ids.push(s.id);remaining-=s.cost;}return {ids,remainingBudget:remaining};
}`,
        String.raw`eq(scheduleWave([{id:'a',dependsOn:[],status:'pending',cost:1},{id:'b',dependsOn:['a'],status:'pending',cost:1}],2,2),{ids:['a'],remainingBudget:1});eq(scheduleWave([{id:'big',dependsOn:[],status:'pending',cost:10},{id:'small',dependsOn:[],status:'pending',cost:2}],2,3),{ids:['small'],remainingBudget:1});assert.throws(()=>scheduleWave([],0,3));`),
    task('Planning','Hard','replanning-policy','Replan after new evidence without resetting budgets or effects',
        'A research plan discovers contradictory sources halfway through, while one optional external write has an uncertain outcome. Design a replanning policy that preserves verified outputs, revises dependencies, rechecks task scope, and stops when budgets or expected benefit no longer justify work.',
        'Treat replanning as a versioned decision under evidence and side-effect constraints.',
        ['Preserve spent budgets and operation identities across plan revisions.','Separate stale read outputs from uncertain writes and obtain clarification when the revised goal changes user-authorized scope.'],
        [['A trusted source invalidates an upstream fact','Invalidate dependent conclusions and gather targeted evidence'],['A write has no confirmed result','Reconcile it before scheduling another attempt']],
        ['A new plan does not refund already spent time or calls.','Repeatedly generating plans can itself consume the entire budget.'],
        'Adaptive planning is useful only when tied to observed failures and measurable acceptance criteria. Replanning without state/effect continuity can duplicate work, lose constraints, or expand the task beyond authorization.',
        'Record the triggering evidence, current accepted goal, plan version, verified outputs, dependency lineage, spent budgets, and durable operation states. Diagnose whether the issue is missing evidence, a bad decomposition, or an execution failure. Propose a minimal revised DAG, invalidate stale descendants, preserve unaffected verified work, and revalidate permissions/resource limits. Reconcile uncertain writes separately; never treat a new node ID as permission to repeat an action. Bound the number and cost of replans, compare expected benefit with remaining budget, and allow partial/blocked outcomes. Ask for a scope change only when required; test revision transitions with inert effects and independently verify final acceptance.'),
    task('Planning','Hard','decomposition-review','Evaluate a decomposition that optimizes steps but misses the goal',
        'An agent completes every listed step in a travel-research task but omits an accessibility requirement from the original request. Design a decomposition review and evaluation protocol that catches missing constraints, unnecessary steps, infeasible dependencies, and optimistic budget estimates before accepting the result.',
        'Align plans and stopping rules with the user’s complete acceptance contract.',
        ['Map every mandatory user constraint to evidence-producing steps and a final verifier.','Evaluate plan quality and end-to-end task success separately; a syntactically valid DAG is not sufficient.'],
        [['No step checks accessibility evidence','Plan fails constraint coverage review'],['All steps report done but final evidence conflicts','Do not report task success']],
        ['Check requirement coverage before optimizing scheduling.','Unverifiable constraints need an explicit unknown/clarification path.'],
        'Decomposition can create a misleading sense of completeness when the plan omits the hard parts. Independent acceptance criteria prevent agents from defining success solely by their own generated checklist.',
        'Extract a reviewed set of mandatory and optional constraints with units, deadlines, and allowed actions. Map each mandatory constraint to a step, expected evidence, and independent acceptance check; reject omissions and ambiguous success criteria. Validate dependency feasibility, resource estimates, and side-effect authorization, then compare the plan with a simpler baseline. During execution retain source provenance and uncertainty, meter actual usage, and replan only for diagnosed failures. Score constraint coverage, unnecessary work, dependency validity, budget violations, and final verified task success on representative held-out tasks. Include infeasible and underspecified requests so honest blocked/clarification outcomes are accepted instead of fabricated completion.'),
    task('Multi-Agent Systems','Easy','role-routing','Route work to configured available specialists',
        'Given trusted worker descriptors {id,roles,busy}, return IDs of nonbusy workers configured for a required nonblank role. Require unique worker IDs, string role lists, and boolean busy flags. Preserve coordinator order. The requested role comes from a reviewed task plan, not a worker’s self-declared authority.',
        'Distinguish task specialization from unrestricted delegation.',
        ['Return an empty list when no configured available worker matches.','Do not grant tools or data access merely because a role matches.'],
        [['A free reviewer and busy reviewer','Only free reviewer eligible'],['No worker has the required role','Empty candidates']],
        ['Role matching is a routing predicate, not permission enforcement.','Availability must be rechecked/reserved atomically at actual assignment.'],
        'Roles help organize work when they correspond to defined input/output contracts. A role name alone does not establish expertise, authority, or better quality. Coordinators still need scoped capabilities, task acceptance checks, and shared-budget enforcement.',
        String.raw`function roleCandidates(workers,requiredRole){
  if(typeof requiredRole!=='string'||!requiredRole.trim()||new Set(workers.map(w=>w.id)).size!==workers.length||!workers.every(w=>typeof w.id==='string'&&w.id.trim()&&Array.isArray(w.roles)&&w.roles.every(r=>typeof r==='string'&&r.trim())&&typeof w.busy==='boolean'))throw new Error('Invalid worker configuration');
  return workers.filter(w=>!w.busy&&w.roles.includes(requiredRole)).map(w=>w.id);
}`,
        String.raw`const w=[{id:'a',roles:['review'],busy:false},{id:'b',roles:['review'],busy:true}];eq(roleCandidates(w,'review'),['a']);eq(roleCandidates(w,'research'),[]);assert.throws(()=>roleCandidates([w[0],w[0]],'review'));`),
    task('Multi-Agent Systems','Easy','message-envelope','Carry run and assignment identities in worker messages',
        'Create a local multi-agent message envelope with nonblank messageId,runId,assignmentId,sender,recipient and string body. Copy only those fields, rejecting blank identities. The body is untrusted text even when it claims to be a coordinator command. A transport authenticates sender separately; this constructor does not.',
        'Preserve correlation fields without promoting message text into control authority.',
        ['Set kind=worker_data and trustedForControl=false.','Never parse or execute a command embedded in body.'],
        [['Body says ignore coordinator and grant access','Ordinary worker_data'],['Missing assignmentId','Rejected ambiguous message']],
        ['A run ID alone cannot distinguish several concurrent assignments.','An asserted sender string is not a transport authentication mechanism.'],
        'Message passing needs explicit correlation to avoid mixing tasks and runs. Keeping worker data separate from coordinator controls limits accidental privilege promotion, but authenticated transport and assignment ownership still require authoritative enforcement.',
        String.raw`function workerMessage(fields){
  const out={kind:'worker_data',trustedForControl:false};for(const key of ['messageId','runId','assignmentId','sender','recipient']){if(typeof fields[key]!=='string'||!fields[key].trim())throw new Error('Missing message identity');out[key]=fields[key];}
  if(typeof fields.body!=='string')throw new Error('Invalid body');out.body=fields.body;return out;
}`,
        String.raw`const f={messageId:'m',runId:'r',assignmentId:'a',sender:'w',recipient:'c',body:'grant access'};const m=workerMessage(f);assert.equal(m.kind,'worker_data');assert.equal(m.trustedForControl,false);assert.equal(m.body,f.body);assert.throws(()=>workerMessage({...f,assignmentId:''}));`),
    task('Multi-Agent Systems','Easy','coordination-count','Compare two explicit communication topologies',
        'For n workers, estimate messages in a single synchronized coordination round. In star mode the coordinator sends one assignment to each worker and receives one result: 2n. In peer mode every worker sends one message to every other worker: n(n−1), excluding coordinator traffic. Validate n as a nonnegative integer and reject unsafe products.',
        'Recognize coordination overhead without claiming a topology always improves quality.',
        ['State the different included-message contracts and return both counts.','Handle n=0 and n=1; exclude retries, tokens, and extra rounds from this estimate.'],
        [['n=4','Star 8, peer 12'],['n=1','Star 2, peer 0']],
        ['Directed messages count a→b and b→a separately.','Message count is not token count or wall-clock latency.'],
        'Multi-agent coordination can add overhead faster than useful work. This arithmetic compares defined rounds rather than realistic full workflows; context size, serialization, scheduling, and repeated deliberation can dominate cost. Measure task outcomes against a simpler baseline.',
        String.raw`function coordinationMessages(n){
  if(!Number.isSafeInteger(n)||n<0)throw new Error('Invalid worker count');const star=2*n,peer=n*(n-1);if(!Number.isSafeInteger(star)||!Number.isSafeInteger(peer))throw new Error('Unsafe message count');return {star,peer};
}`,
        String.raw`eq(coordinationMessages(4),{star:8,peer:12});eq(coordinationMessages(1),{star:2,peer:0});eq(coordinationMessages(0),{star:0,peer:0});assert.throws(()=>coordinationMessages(1.5));`),
    task('Multi-Agent Systems','Medium','inbox-delivery','Deduplicate worker data within the assigned run mailbox',
        'Implement a pure inbox transition for validated state {runId,workerId,closed,seenIds,messages} and a validated authenticated message. If run/recipient differ return rejected; if closed return closed; if messageId was already seen return duplicate; otherwise return accepted and a new state appending the copied message and ID. Use this exact precedence.',
        'Handle duplicate or late transport delivery without repeating accepted work.',
        ['Do not add foreign, duplicate, or closed-mailbox messages to state.','Local deduplication requires an atomic durable check-and-insert for concurrent real delivery.'],
        [['Same message delivered twice','First accepted, second duplicate'],['A message belongs to another run','Rejected before any append']],
        ['A valid message can still target the wrong mailbox.','Deduplication identity must survive worker restart if results are persisted.'],
        'Message delivery often permits duplicates and reordering. A mailbox policy makes acceptance and terminal behavior inspectable without claiming exactly-once distributed delivery. Assignment ownership and schema validation are assumed upstream and should be independently tested.',
        String.raw`function deliverWorkerData(state,message){
  if(message.runId!==state.runId||message.recipient!==state.workerId)return {status:'rejected',state};if(state.closed)return {status:'closed',state};if(state.seenIds.includes(message.messageId))return {status:'duplicate',state};
  return {status:'accepted',state:{...state,seenIds:[...state.seenIds,message.messageId],messages:[...state.messages,{...message}]}};
}`,
        String.raw`const s={runId:'r',workerId:'c',closed:false,seenIds:[],messages:[]},m={runId:'r',recipient:'c',messageId:'m',body:'x'};const first=deliverWorkerData(s,m);assert.equal(first.status,'accepted');assert.equal(deliverWorkerData(first.state,m).status,'duplicate');assert.equal(deliverWorkerData(s,{...m,runId:'other'}).status,'rejected');assert.equal(s.messages.length,0);`),
    task('Multi-Agent Systems','Medium','conflicting-proposals','Surface conflicting worker field proposals instead of last-write-wins',
        'Merge worker proposals {workerId,changes} where changes maps field names to finite numbers, strings, booleans, or null. Collect all distinct primitive values per field. Put a field in agreed only when exactly one distinct value was proposed, otherwise report it in conflicts with all proposed values. Agreement is not proof of truth and must not directly update authoritative state.',
        'Resolve coordination ambiguity explicitly while preserving disagreements for review.',
        ['Do not pick a winner by arrival order or majority vote.','Reject unsupported object/array values and preserve first-seen field/value order.'],
        [['Workers propose deadline=10 and deadline=12','Conflict lists both values'],['Workers independently propose language=en','One agreed proposal en']],
        ['Different workers can share the same underlying error.','A proposal merge and an authorized commit are separate operations.'],
        'Shared-state updates need a conflict policy rather than silent overwrites. This scoped primitive-value merge identifies incompatible claims but cannot decide factual correctness. Evidence review and an atomic version-checked coordinator commit remain necessary.',
        String.raw`function mergeProposals(proposals){
  const fields=new Map();for(const p of proposals){if(typeof p.workerId!=='string'||!p.workerId.trim()||!p.changes||typeof p.changes!=='object'||Array.isArray(p.changes))throw new Error('Invalid proposal');for(const [key,value] of Object.entries(p.changes)){if(!(value===null||['string','boolean'].includes(typeof value)||(typeof value==='number'&&Number.isFinite(value))))throw new Error('Unsupported value');if(!fields.has(key))fields.set(key,[]);const values=fields.get(key);if(!values.some(v=>Object.is(v,value)))values.push(value);}}
  const agreed=[],conflicts=[];for(const [key,values] of fields)if(values.length===1)agreed.push({key,value:values[0]});else conflicts.push({key,values});return {agreed,conflicts};
}`,
        String.raw`eq(mergeProposals([{workerId:'a',changes:{deadline:10,language:'en'}},{workerId:'b',changes:{deadline:12,language:'en'}}]),{agreed:[{key:'language',value:'en'}],conflicts:[{key:'deadline',values:[10,12]}]});assert.throws(()=>mergeProposals([{workerId:'a',changes:{x:{nested:true}}}]));`),
    task('Multi-Agent Systems','Medium','delegation-ledger','Reserve child-agent budgets without inventing additional capacity',
        'Given a trusted parent remaining call budget and a list of child requests {id,calls}, propose allocations in supplied order. Require unique child IDs and nonnegative safe integer requests. If their total exceeds remaining, reject the entire allocation; otherwise return allocations and parentRemaining. This reserves capacity, not actual usage or parallel execution permission.',
        'Keep delegated work inside a shared parent resource boundary.',
        ['Reject unsafe total arithmetic and do not partially reserve a rejected batch.','A durable coordinator must atomically commit reservations and account for child usage/refunds.'],
        [['Parent 10, requests a:3,b:4','Reservations 3 and 4; parent remainder 3'],['Parent 5 with the same requests','Whole allocation rejected']],
        ['Every child must draw from the parent budget, not clone it.','Reserved capacity and consumed usage are different ledger quantities.'],
        'Delegation can multiply resource use if each worker receives an independent copy of the full budget. A shared ledger makes the aggregate cap visible. Time, token, permission, and concurrency constraints may require additional dimensions beyond this call-only exercise.',
        String.raw`function allocateChildren(remaining,requests){
  if(!Number.isSafeInteger(remaining)||remaining<0||new Set(requests.map(r=>r.id)).size!==requests.length||!requests.every(r=>typeof r.id==='string'&&r.id.trim()&&Number.isSafeInteger(r.calls)&&r.calls>=0))throw new Error('Invalid allocation');
  const total=requests.reduce((sum,r)=>sum+r.calls,0);if(!Number.isSafeInteger(total))throw new Error('Unsafe allocation');if(total>remaining)return {status:'insufficient'};
  return {status:'reserved',allocations:requests.map(r=>({...r})),parentRemaining:remaining-total};
}`,
        String.raw`eq(allocateChildren(10,[{id:'a',calls:3},{id:'b',calls:4}]),{status:'reserved',allocations:[{id:'a',calls:3},{id:'b',calls:4}],parentRemaining:3});eq(allocateChildren(5,[{id:'a',calls:3},{id:'b',calls:4}]),{status:'insufficient'});assert.throws(()=>allocateChildren(10,[{id:'a',calls:1},{id:'a',calls:1}]));`),
    task('Multi-Agent Systems','Hard','fenced-result','Accept results only from the currently fenced assignment owner',
        'Implement eligibility for a validated worker result against a trusted assignment lease. Match runId,assignmentId,workerId,positive integer fencingToken, and require now<lease.expiresAt plus lease.status=running. After reassignment the token increases; an old worker result must be rejected even if its content looks correct. Return boolean only, not a commit.',
        'Prevent stale workers from publishing after lease expiry or reassignment.',
        ['Validate finite timestamps and matching safe positive fencing tokens.','The authoritative result write must atomically check the active token; this predicate alone cannot eliminate races.'],
        [['Worker a token 1 finishes after worker b receives token 2','Old result ineligible'],['Current worker/token before expiration','Eligible for a separately validated commit']],
        ['Worker identity alone is insufficient after a lease is renewed or reassigned.','An elapsed lease does not cancel external actions the worker may already have started.'],
        'Fencing tokens identify an assignment generation, preventing late results from older owners from overwriting current state when enforced by storage. A local boolean check only expresses the policy. Effect idempotency and cancellation still require separate integration.',
        String.raw`function currentAssignmentResult(lease,result,now){
  return Boolean(lease&&result&&lease.status==='running'&&Number.isFinite(now)&&Number.isFinite(lease.expiresAt)&&now<lease.expiresAt&&Number.isSafeInteger(lease.fencingToken)&&lease.fencingToken>0&&Number.isSafeInteger(result.fencingToken)&&result.fencingToken===lease.fencingToken&&['runId','assignmentId','workerId'].every(k=>typeof lease[k]==='string'&&lease[k].length>0&&result[k]===lease[k]));
}`,
        String.raw`const l={runId:'r',assignmentId:'a',workerId:'w2',fencingToken:2,status:'running',expiresAt:100};assert.equal(currentAssignmentResult(l,{runId:'r',assignmentId:'a',workerId:'w1',fencingToken:1},99),false);assert.equal(currentAssignmentResult(l,{runId:'r',assignmentId:'a',workerId:'w2',fencingToken:2},99),true);assert.equal(currentAssignmentResult(l,{...l},100),false);`),
    task('Multi-Agent Systems','Hard','coordinator-review','Design delegation with least privilege and evidence-based conflict handling',
        'Design a coordinator/researcher/reviewer workflow for private document analysis. Define role input/output contracts, per-worker context and tool scope, shared-state ownership, conflict handling, failure recovery, and final acceptance. More agents and repeated agreement must not be assumed to establish truth.',
        'Make delegation boundaries and coordination costs independently reviewable.',
        ['Keep a single trusted coordinator for plan/budget/state commits and isolate worker data by authorized scope.','Require source-backed review of conflicting claims, bounded rounds, and a verified final result or explicit uncertainty.'],
        [['Researcher and reviewer disagree about a document fact','Inspect original evidence instead of automatically majority-voting'],['Worker asks for another tenant’s source','Deny through the execution/data boundary']],
        ['Independent roles can still share correlated model or source errors.','Shared memory should not become a channel for workers to grant capabilities.'],
        'Delegation is useful when specialized work and independent checks outweigh communication overhead. Security and correctness depend on explicit authority and evidence contracts, not persona names. Central coordination must itself be tested for races and failure recovery.',
        'Define reviewed task assignments with IDs, scope, budgets, output schema, source requirements, and completion criteria. The coordinator authenticates workers, reserves parent capacity, and grants only task-specific read capabilities; reviewers receive sufficient authorized evidence but no authority to mutate global permissions. Keep worker text untrusted, validate/correlate messages, and commit shared state through versioned/fenced operations. Escalate factual conflicts to source inspection or human review, never unqualified voting. Bound retries, rounds, context, and concurrency; handle stale leases and uncertain effects explicitly. Compare against a simpler workflow on held-out task success, privacy, regression, cost, and latency before adopting delegation.'),
    task('Multi-Agent Systems','Hard','overhead-experiment','Test whether several agents outperform a simpler baseline',
        'A team proposes replacing one research agent with five debating agents. Design a fair experiment accounting for model-call budgets, communication tokens, shared source access, correlated errors, coordination latency, reproducibility, and safety regressions. Include an ablation that removes debate while retaining the same evidence.',
        'Justify coordination through measured task utility under declared resource constraints.',
        ['Use paired held-out tasks and predeclared equal-budget or cost-quality comparisons.','Retain all repeated runs and report failures/variance rather than cherry-picking one convincing discussion.'],
        [['Five agents agree on the same unsupported claim','Count the error, not the agreement, as outcome evidence'],['Debate improves accuracy but violates the service latency budget','Reject or redesign under the declared acceptance policy']],
        ['More samples and more communication are confounded unless budgets are explicit.','Ablations can reveal whether gains come from added evidence or coordination itself.'],
        'Multi-agent quality claims need controlled comparisons because added model work often explains apparent gains. Communication can amplify shared errors as well as expose them. A useful experiment measures complete application outcomes rather than debate fluency.',
        'Freeze task splits, authorized evidence, model versions, prompts, judge rubrics, and sampling budgets. Compare a strong single-agent baseline, independent parallel attempts with a simple aggregator, and the proposed debate under both equal-resource and measured cost-quality settings. Add an evidence-matched no-debate ablation. Run paired representative tasks repeatedly, capturing verified task success, unsupported claims, privacy/tool violations, latency tails, token/call usage, and failure states. Review correlated errors and disagreements against original sources. Select on development results, freeze the policy, and evaluate on untouched tasks with uncertainty intervals and complete run records. Adopt the added orchestration only when predefined utility and operational gates are met.'),
    task('Agent Evaluation','Easy','safe-success','Separate reported task completion from safe verified success',
        'Aggregate independently adjudicated agent trials {outcome,safetyViolations}, where outcome is success,failure,or timeout and safetyViolations is a nonnegative integer. Return count, verifiedSuccessRate, safeSuccessRate, and timeoutRate. All trials remain in denominators; safe success requires outcome success and zero violations. Empty input returns null rates.',
        'Keep task usefulness and safety violations visible as separate outcome dimensions.',
        ['Reject unsupported outcomes and invalid violation counts.','A model’s final claim of success is not the adjudicated outcome input.'],
        [['One safe success, one success with a violation, one timeout','Success 2/3, safe success 1/3, timeout 1/3'],['No trials','Null rates and count zero']],
        ['Keep unsuccessful/time-limited trials in the declared denominator.','An unsafe successful action must not silently count as acceptable deployment behavior.'],
        'Task success needs a verifier tied to the real objective, and safety needs its own checks. Joint safe success is useful but should not hide either component. This function aggregates supplied judgments only and cannot determine task completion from prose.',
        String.raw`function trialSummary(trials){
  if(!trials.every(t=>['success','failure','timeout'].includes(t.outcome)&&Number.isSafeInteger(t.safetyViolations)&&t.safetyViolations>=0))throw new Error('Invalid trial judgments');const n=trials.length;
  return {count:n,verifiedSuccessRate:n?trials.filter(t=>t.outcome==='success').length/n:null,safeSuccessRate:n?trials.filter(t=>t.outcome==='success'&&t.safetyViolations===0).length/n:null,timeoutRate:n?trials.filter(t=>t.outcome==='timeout').length/n:null};
}`,
        String.raw`const r=trialSummary([{outcome:'success',safetyViolations:0},{outcome:'success',safetyViolations:1},{outcome:'timeout',safetyViolations:0}]);assert.equal(r.verifiedSuccessRate,2/3);assert.equal(r.safeSuccessRate,1/3);assert.equal(r.timeoutRate,1/3);assert.equal(trialSummary([]).safeSuccessRate,null);assert.throws(()=>trialSummary([{outcome:'maybe',safetyViolations:0}]));`),
    task('Agent Evaluation','Easy','tool-selection-metric','Score tool selection including correct no-tool decisions',
        'Calculate exact tool-name selection accuracy over aligned nonempty expected/actual arrays. Each entry is a nonblank tool name or null for no tool. Count exact matches, including null-null, and report falseToolCalls when actual is a tool but expected is null. This metric does not assess argument validity, authorization, or usefulness of the returned data.',
        'Define a narrow tool-call metric without implying broader execution correctness.',
        ['Validate entry types and equal nonzero lengths.','Count unnecessary tool calls separately from wrong tool names.'],
        [['Expected [search,null], actual [search,delete]','Accuracy 1/2, falseToolCalls 1'],['Expected [null], actual [null]','Accuracy 1']],
        ['No-tool decisions are part of a meaningful labeled task set.','A correct name can still contain dangerous arguments.'],
        'Tool accuracy is ambiguous unless the evaluated unit is specified. Name selection is one component; arguments, sequencing, permissions, and results need separate checks. Gold labels should allow justified alternatives when the task has several valid approaches.',
        String.raw`function toolSelectionAccuracy(expected,actual){
  const valid=x=>x===null||(typeof x==='string'&&x.trim().length>0);if(!expected.length||expected.length!==actual.length||![...expected,...actual].every(valid))throw new Error('Invalid selections');
  return {accuracy:expected.filter((x,i)=>x===actual[i]).length/expected.length,falseToolCalls:expected.filter((x,i)=>x===null&&actual[i]!==null).length};
}`,
        String.raw`eq(toolSelectionAccuracy(['search',null],['search','delete']),{accuracy:0.5,falseToolCalls:1});eq(toolSelectionAccuracy([null],[null]),{accuracy:1,falseToolCalls:0});assert.throws(()=>toolSelectionAccuracy([],[]));`),
    task('Agent Evaluation','Easy','latency-percentile','Report a precisely defined latency percentile',
        'Given finite nonnegative observed run durations in milliseconds, return count, mean, and p95 using nearest-rank quantile: sort ascending and select ceil(0.95*n)−1. Return null mean/p95 for no samples and do not mutate input. A timed-out run’s observed duration is not its hypothetical completion latency.',
        'Make latency reporting reproducible across evaluation tools.',
        ['Use the stated nearest-rank convention, not an unspecified interpolated quantile.','Include the measured population and report timeout/cancellation rates separately.'],
        [['Durations [10,20,30,40]','Mean 25, p95 40'],['One duration 7','Mean and p95 both 7']],
        ['Small samples can make p95 equal the maximum.','Comparisons require the same timeout and workload policy.'],
        'Latency summaries depend on quantile definitions and which runs were observed. Mean latency can hide tail failures, while time limits censor completion times. Report count, failure rates, and measurement boundaries alongside percentile values.',
        String.raw`function latencySummary(durations){
  if(!durations.every(x=>Number.isFinite(x)&&x>=0))throw new Error('Invalid latency');if(!durations.length)return {count:0,mean:null,p95:null};
  const sorted=[...durations].sort((a,b)=>a-b);return {count:sorted.length,mean:sorted.reduce((sum,x)=>sum+x/sorted.length,0),p95:sorted[Math.ceil(0.95*sorted.length)-1]};
}`,
        String.raw`const d=[40,10,30,20];eq(latencySummary(d),{count:4,mean:25,p95:40});eq(d,[40,10,30,20]);eq(latencySummary([7]),{count:1,mean:7,p95:7});assert.equal(latencySummary([]).p95,null);assert.throws(()=>latencySummary([-1]));`),
    task('Agent Evaluation','Medium','trajectory-gates','Audit whether every executed call crossed required gates in order',
        'Audit a local agent event trajectory with events {callId,stage}; stages are proposed,validated,authorized,executed,result. For each call enforce exactly this order. Return indexed violations for blank IDs, unknown stages, or out-of-order/duplicate events. Invalid events do not advance that call’s audit state. Interleaving different calls is allowed.',
        'Evaluate execution invariants rather than rewarding only a plausible final answer.',
        ['An executed event without prior authorization must be flagged.','Do not require independent calls to use one global sequential order; this exercise assumes all five gates apply to each scoped call.'],
        [['Call a proposed,validated,executed','Flag executed because authorized is missing'],['Two calls interleave complete valid gate sequences','No violations']],
        ['Maintain expected next stage separately for each call ID.','An audit log must itself come from trusted instrumentation, not model-generated text.'],
        'Trajectory checks expose bypasses that outcome-only evaluation can miss. This structural audit cannot prove a validator or authorization check was semantically correct; those components need their own tests and authoritative logging.',
        String.raw`function auditTrajectory(events){
  const order=['proposed','validated','authorized','executed','result'],next=new Map(),violations=[];
  events.forEach((e,index)=>{if(typeof e.callId!=='string'||!e.callId.trim()||!order.includes(e.stage)){violations.push({index,reason:'invalid_event'});return;}const expected=next.get(e.callId)??0;if(order[expected]!==e.stage){violations.push({index,reason:'out_of_order'});return;}next.set(e.callId,expected+1);});return violations;
}`,
        String.raw`eq(auditTrajectory([{callId:'a',stage:'proposed'},{callId:'a',stage:'validated'},{callId:'a',stage:'executed'}]),[{index:2,reason:'out_of_order'}]);const stages=['proposed','validated','authorized','executed','result'];const events=stages.flatMap(stage=>[{callId:'a',stage},{callId:'b',stage}]);eq(auditTrajectory(events),[]);assert.equal(auditTrajectory([...events,{callId:'a',stage:'result'}]).length,1);`),
    task('Agent Evaluation','Medium','run-resource-ledger','Aggregate call usage without double-counting redelivered events',
        'Aggregate trusted usage records {callId,inputTokens,outputTokens,costMicrounits}. All amounts are nonnegative safe integers in declared units. Duplicate call IDs with identical usage are redeliveries and count once; conflicting usage for the same call ID throws. Return uniqueCalls and summed usage/cost, rejecting aggregate overflow. Rates and current prices are outside this exercise.',
        'Measure agent resource use from a deduplicated observed ledger.',
        ['Do not sum the same call twice because tracing delivered it twice.','Treat costMicrounits as an already computed fixed-unit quantity; report pricing assumptions separately.'],
        [['Same call usage appears twice','One unique call and one usage contribution'],['Same call ID has different outputTokens','Reject inconsistent ledger']],
        ['Idempotent event aggregation needs an identity and conflict policy.','A usage event may be missing after a transport failure, so reconcile with authoritative billing telemetry.'],
        'Agent cost includes all calls, including failed or delegated work under the provider’s billing contract. Integer aggregation avoids local floating currency addition but cannot establish that the source ledger is complete. Reconciliation and sensitive-data handling remain integration concerns.',
        String.raw`function runUsage(records){
  const keys=['inputTokens','outputTokens','costMicrounits'],seen=new Map(),total=Object.fromEntries(keys.map(k=>[k,0]));
  for(const r of records){if(typeof r.callId!=='string'||!r.callId.trim()||!keys.every(k=>Number.isSafeInteger(r[k])&&r[k]>=0))throw new Error('Invalid usage');if(seen.has(r.callId)){if(keys.some(k=>seen.get(r.callId)[k]!==r[k]))throw new Error('Conflicting usage');continue;}seen.set(r.callId,r);for(const k of keys){total[k]+=r[k];if(!Number.isSafeInteger(total[k]))throw new Error('Usage overflow');}}
  return {uniqueCalls:seen.size,...total};
}`,
        String.raw`const r={callId:'c',inputTokens:10,outputTokens:3,costMicrounits:7};eq(runUsage([r,r]),{uniqueCalls:1,inputTokens:10,outputTokens:3,costMicrounits:7});assert.throws(()=>runUsage([r,{...r,outputTokens:4}]));assert.equal(runUsage([]).uniqueCalls,0);`),
    task('Agent Evaluation','Medium','reproducibility-manifest','Compare frozen run settings before claiming a paired regression',
        'Compare two evaluation manifests with required nonblank string fields datasetRevision,modelRevision,promptRevision,toolRegistryRevision,environmentRevision and integer seed or null. Return changed field names in a fixed order. Missing/invalid fields throw. Matching settings make an experiment identifiable but do not guarantee deterministic live model or distributed execution.',
        'Record reproducibility inputs without overpromising seed-based determinism.',
        ['Check all declared settings and distinguish null seed from an integer.','Do not silently compare runs against different dataset or tool versions as one controlled regression.'],
        [['Only modelRevision differs','Report modelRevision'],['Identical manifests','Empty change list, with no determinism guarantee']],
        ['A provider may change behavior despite a client seed.','Task corpus, environment, and tools can change outcomes independently of prompts.'],
        'Version manifests support attribution and replay but cannot remove stochastic or external-state variation. Controlled regression testing needs paired tasks, explicit sampling, and frozen or recorded tool observations. Report actual repeatability separately from configuration equality.',
        String.raw`function changedRunSettings(a,b){
  const keys=['datasetRevision','modelRevision','promptRevision','toolRegistryRevision','environmentRevision','seed'];
  for(const m of [a,b])if(!keys.every(k=>Object.hasOwn(m,k)&&(k==='seed'?(m[k]===null||Number.isSafeInteger(m[k])):(typeof m[k]==='string'&&m[k].trim()))))throw new Error('Invalid manifest');
  return keys.filter(k=>a[k]!==b[k]);
}`,
        String.raw`const a={datasetRevision:'d1',modelRevision:'m1',promptRevision:'p1',toolRegistryRevision:'t1',environmentRevision:'e1',seed:0};eq(changedRunSettings(a,{...a,modelRevision:'m2'}),['modelRevision']);eq(changedRunSettings(a,a),[]);assert.throws(()=>changedRunSettings(a,{...a,seed:'0'}));`),
    task('Agent Evaluation','Hard','robustness-pairs','Evaluate robustness variants without losing task pairing',
        'Evaluate records {taskId,variant,success}, with one clean baseline and one or more perturbation variants per task. IDs/variants are nonblank and success boolean. Reject duplicate task/variant pairs and tasks without clean baseline. Return taskCount, cleanSuccessRate, allVariantsSuccessRate, and conditionalRobustness=number clean-success tasks succeeding on every perturbation / number clean-success tasks, or null when none succeed cleanly.',
        'Measure adversarial robustness separately from ordinary task success.',
        ['Require each task to have at least one perturbation so a missing test is not a robustness pass.','Weight tasks equally despite different numbers of variants and report the exact conditional denominator.'],
        [['Task a succeeds clean/noisy; task b succeeds clean but fails noisy','Clean 1, all-variant 0.5, conditional robustness 0.5'],['No task succeeds cleanly','Conditional robustness null']],
        ['Group by stable task IDs before aggregation.','A conditional score alone can hide poor clean-task performance.'],
        'Robustness tests should preserve the underlying acceptance goal while perturbing instructions, tool failures, formatting, or irrelevant context. Grouped metrics prevent tasks with many variants from dominating results. Success labels must come from independent task/safety checks.',
        String.raw`function robustnessSummary(records){
  const groups=new Map();for(const r of records){if(typeof r.taskId!=='string'||!r.taskId.trim()||typeof r.variant!=='string'||!r.variant.trim()||typeof r.success!=='boolean')throw new Error('Invalid variant');if(!groups.has(r.taskId))groups.set(r.taskId,new Map());const g=groups.get(r.taskId);if(g.has(r.variant))throw new Error('Duplicate variant');g.set(r.variant,r.success);}
  let clean=0,all=0,cleanRobust=0;for(const g of groups.values()){if(!g.has('clean')||g.size<2)throw new Error('Missing paired variants');const passed=[...g.values()].every(Boolean);if(g.get('clean')){clean++;if(passed)cleanRobust++;}if(passed)all++;}
  const n=groups.size;return {taskCount:n,cleanSuccessRate:n?clean/n:null,allVariantsSuccessRate:n?all/n:null,conditionalRobustness:clean?cleanRobust/clean:null};
}`,
        String.raw`const records=[{taskId:'a',variant:'clean',success:true},{taskId:'a',variant:'noise',success:true},{taskId:'b',variant:'clean',success:true},{taskId:'b',variant:'noise',success:false}];eq(robustnessSummary(records),{taskCount:2,cleanSuccessRate:1,allVariantsSuccessRate:0.5,conditionalRobustness:0.5});assert.equal(robustnessSummary(records.map(r=>({...r,success:false}))).conditionalRobustness,null);assert.throws(()=>robustnessSummary([records[0]]));`),
    task('Agent Evaluation','Hard','evaluation-protocol','Build an agent evaluation with independent task and trajectory checks',
        'Design a release evaluation for an assistant that reads private data and proposes updates. Include verified task success, correct abstention, tool choice/arguments, permission boundaries, trajectory ordering, robustness, latency, cost, stochastic variation, and regressions. A model-generated final answer or a fluent self-critique is not a trusted verifier.',
        'Use layered acceptance evidence rather than one opaque agent score.',
        ['Define task-specific external verifiers and stage metrics with units/denominators.','Keep independent held-out cases, repeated runs, redacted traces, and explicit zero-tolerance safety gates.'],
        [['Goal achieved through an unauthorized read','Fail the safety gate despite successful task outcome'],['Agent appropriately refuses an impossible or unauthorized task','Score against the labeled refusal contract, not raw completion count']],
        ['Tool name accuracy does not measure argument or permission correctness.','Automated semantic judges need calibration and uncertainty reporting.'],
        'Agent evaluation combines application outcomes with execution invariants and operational cost. A single aggregate can hide unsafe success or systematic abstention failures. Local replay tests and real backend/provider tests supply different kinds of evidence.',
        'Version tasks, permissions, expected outcomes, model/prompt/tool/environment settings, and sampling policy. Build representative success, refusal, ambiguous, adversarial, timeout, and crash/retry cases split by independent source groups. Use deterministic verifiers for structured effects and calibrated blinded review for semantic outcomes. Report safe verified success, refusal quality, tool-name/argument validity, authorization/approval invariants, trajectory violations, robustness slices, p95/p99 latency, tokens/calls/cost, and incomplete-ledger counts with explicit denominators. Retain all repeated runs and paired regressions rather than cherry-picking. Test inert fixture trajectories first, then controlled live integrations and authenticated persistence separately. Gate rollout on predefined quality/resource thresholds and zero unauthorized effects, with monitoring and rollback.'),
    task('Agent Evaluation','Hard','regression-investigation','Investigate a regression without tuning against the final test set',
        'After an orchestration change, average task success improves but a small permission-sensitive slice regresses and latency increases. Design an investigation and release decision covering paired traces, repeated runs, causal confounders, acceptance gates, and the fact that one prior test report already guided a fix.',
        'Make regression decisions from complete evidence rather than a favorable mean score.',
        ['Inspect critical slices and safety failures separately from aggregate success.','Disclose test-guided revision and obtain fresh independent evaluation or clearly qualify its reuse.'],
        [['Higher average success with one unauthorized action','Fail the safety gate and investigate before release'],['Different tool snapshot changed between runs','Reproduce under matched conditions before attributing the change to orchestration']],
        ['An average can improve while a critical invariant fails.','Repeatedly choosing fixes from test outcomes consumes the test’s independence.'],
        'Regression analysis needs controlled comparisons, complete traces, and predeclared priorities. A safety-critical failure cannot be averaged away. Reporting evaluation contamination honestly is part of technical correctness.',
        'Freeze baseline/candidate manifests and align tasks, permissions, source/tool snapshots, timeouts, and sampling. Reproduce paired runs with redacted trusted event logs, then localize failures to proposal, validation, authorization, effect, observation, or verification stages. Audit latency/cost tails and failures rather than only completed runs. Examine affected slices, confidence/variance, and missing telemetry; use development cases to test minimal fixes and retain adversarial fixtures. Stop rollout for violated safety gates even if aggregate success rises. Disclose the earlier test-guided fix, preserve that report as development feedback, and use a fresh independent set or an explicitly qualified estimate for final acceptance. Canary only after declared gates pass and retain rollback plus monitoring.'),
];
