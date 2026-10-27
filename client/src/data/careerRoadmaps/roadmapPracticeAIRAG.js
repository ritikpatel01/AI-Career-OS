// Exact local fixtures validate mechanics, not a live vector database or model.
const task=(topic,difficulty,slug,title,prompt,objective,requirements,cases,hints,explanation,solution,checks=null)=>({
    id:`ai-rag-${slug}-v1`,career:'AI Engineer',phase:'RAG',topic,title,difficulty,
    kind:checks===null?'written':'coding',language:checks===null?'Engineering review':'JavaScript',
    estimatedTime:difficulty==='Easy'?'20–30 minutes':difficulty==='Medium'?'35–55 minutes':'55–90 minutes',
    problemStatement:prompt,simplerProblem:objective,
    learningObjectives:[objective,'Verify the stated boundary cases and separate local checks from integration evidence.'],
    prerequisites:['JavaScript ES2022 and JSON; no external packages required','Synthetic vectors and supplied relevance labels; no live model or database required'],
    conceptsToReview:[topic,objective],requirements,
    examples:cases.map(([input,output])=>({input,output,explanation})),tests:cases.map(([input,expected],i)=>({name:`Acceptance case ${i+1}`,input,expected})),
    hints,approach:explanation,walkthrough:cases.map(([input,output])=>`${input} → ${output}`).join('\n')+'\n'+explanation,
    solutionCode:solution,solutionLines:[explanation,...hints],completionCriteria:requirements,
    starterCode:checks===null?'Decision, evidence, failure cases, and acceptance criteria:\n':'// Implement the named local contract.\n',
    commonMistakes:[],followUp:'Specify an additional adversarial or boundary case and the integration evidence needed before deployment.',referenceChecks:checks
});
export const AI_RAG_PRACTICE=[
    task('Vector Databases','Easy','point-record','Validate a vector point and its metadata identity',
        'Validate a vector-database ingestion record with a nonblank string id, finite dense vector of configured positive dimension, and payload containing nonblank tenantId, documentId, and revision strings. Return an independent copy of the vector and payload. This exercise does not connect to a database or establish authorization.',
        'Keep numeric vectors associated with source and version metadata.',
        ['Reject sparse, nonfinite, or wrong-width vectors and missing identity fields.','Copy the declared primitive metadata and vector so later caller mutation cannot alter the validated record.'],
        [['id c1, vector [1,0], complete identity payload','Independent validated record'],['Vector width differs from configured dimension','Reject before ingestion']],
        ['Check every coordinate explicitly because Array.every skips holes.','Source revision is part of provenance, not just a display label.'],
        'A vector point needs stable identity and sufficient source metadata to resolve evidence. Shape validation catches ingestion defects but cannot prove embedding compatibility or user permission. A production adapter must also enforce collection configuration and authoritative access scope.',
        String.raw`function vectorPoint(record,dimension){
  if(!Number.isSafeInteger(dimension)||dimension<1||!record||typeof record.id!=='string'||!record.id.trim()||!Array.isArray(record.vector)||record.vector.length!==dimension)throw new Error('Invalid point');
  for(let i=0;i<dimension;i++)if(!Object.hasOwn(record.vector,i)||!Number.isFinite(record.vector[i]))throw new Error('Invalid coordinate');
  const payload={};for(const key of ['tenantId','documentId','revision']){if(typeof record.payload?.[key]!=='string'||!record.payload[key].trim())throw new Error('Missing metadata');payload[key]=record.payload[key];}
  return {id:record.id,vector:[...record.vector],payload};
}`,
        String.raw`const input={id:'c1',vector:[1,0],payload:{tenantId:'t',documentId:'d',revision:'r'}};const point=vectorPoint(input,2);eq(point,input);input.vector[0]=9;assert.equal(point.vector[0],1);assert.throws(()=>vectorPoint(input,3));assert.throws(()=>vectorPoint({...input,vector:new Array(2)},2));`),
    task('Vector Databases','Easy','metric-direction','Sort results according to the configured metric direction',
        'A neutral vector-store adapter receives unique result records {id,score}. Sort finite scores descending for cosine or dot similarity and ascending for squared_l2 distance. Reject unknown metrics and preserve original order for exact ties. Do not infer whether a larger score is better from a field name alone.',
        'Distinguish similarity ordering from distance ordering.',
        ['Validate finite scores and a known metric name.','Return a new sorted array without modifying input order.'],
        [['Scores a:0.2,b:0.9, cosine','b then a'],['The same scores, squared_l2','a then b']],
        ['A distance measures separation, so lower is better.','Backend score transformations must be handled at the adapter boundary.'],
        'Vector databases expose different score conventions, sometimes transforming raw distances. A local adapter must state its contract rather than assuming universal score polarity. Similarity values do not by themselves establish answer relevance or authorization.',
        String.raw`function orderVectorResults(results,metric){
  if(!['cosine','dot','squared_l2'].includes(metric)||!results.every(r=>Number.isFinite(r.score)))throw new Error('Invalid metric or score');
  const direction=metric==='squared_l2'?1:-1;
  return results.map((r,index)=>({...r,index})).sort((a,b)=>direction*(a.score-b.score)||a.index-b.index).map(({index,...r})=>r);
}`,
        String.raw`const rows=[{id:'a',score:0.2},{id:'b',score:0.9}];eq(orderVectorResults(rows,'cosine').map(r=>r.id),['b','a']);eq(orderVectorResults(rows,'squared_l2').map(r=>r.id),['a','b']);assert.equal(rows[0].id,'a');assert.throws(()=>orderVectorResults(rows,'unknown'));`),
    task('Vector Databases','Easy','storage-estimate','Estimate raw vector storage separately from index overhead',
        'Estimate raw vector bytes from nonnegative point count, positive dimension, and bytes per coordinate restricted to 2,4,8. Return rawBytes and binary GiB using 2^30 bytes. Reject unsafe integer products. Explain that payloads, IDs, replicas, allocator overhead, and ANN indexes are not included.',
        'Use explicit units and avoid treating raw tensor size as database capacity.',
        ['Validate dimensions, representation width, and safe integer multiplication.','Return zero for zero points and report binary GiB rather than decimal GB.'],
        [['1,000 points × 768 dimensions × 4 bytes','3,072,000 raw bytes'],['Zero points','Zero bytes and zero GiB']],
        ['Multiply point count, dimensions, and bytes per coordinate.','Compression and index memory require measured backend-specific estimates.'],
        'Raw vector storage is a lower-level arithmetic estimate, not a complete capacity plan. Database memory can include graph edges, payload indexes, working sets, and replicas. Measure actual collections under representative indexing and query settings before sizing production.',
        String.raw`function rawVectorStorage(points,dimension,bytesPerCoordinate){
  if(!Number.isSafeInteger(points)||points<0||!Number.isSafeInteger(dimension)||dimension<1||![2,4,8].includes(bytesPerCoordinate))throw new Error('Invalid representation');
  const rawBytes=points*dimension*bytesPerCoordinate;if(!Number.isSafeInteger(rawBytes))throw new Error('Unsafe byte count');return {rawBytes,GiB:rawBytes/2**30};
}`,
        String.raw`assert.equal(rawVectorStorage(1000,768,4).rawBytes,3072000);eq(rawVectorStorage(0,768,4),{rawBytes:0,GiB:0});assert.throws(()=>rawVectorStorage(Number.MAX_SAFE_INTEGER,768,4));`),
    task('Vector Databases','Medium','filtered-exact','Apply tenant and visibility filters before exact scoring',
        'Implement a small exact dot-product vector search over finite compatible unit-vector records. Use authenticated tenantId and userId from trusted context. Eligible records match the tenant, have deleted=false, and list the user in allowedUsers. Filter before scoring, return top k IDs/scores, and preserve input order on ties. This is an in-memory policy reference, not ANN software.',
        'Integrate metadata authorization into the vector search boundary.',
        ['Require nonblank authenticated context and nonnegative integer k.','Never expose unauthorized candidates to a scorer, reranker, or generator.'],
        [['Unauthorized vector scores 1, authorized vector scores 0.5, k=1','Only the authorized result is scored and returned'],['No eligible points','Empty array']],
        ['Finding a global top-k and filtering later can both underfill and leak candidates.','The production backend must enforce equivalent scope in its actual query path.'],
        'Metadata filters are part of retrieval correctness and access control. An exact scan makes the reference policy inspectable, but production ANN filtering behavior and recall require integration tests. Model-supplied tenant arguments cannot override authenticated server context.',
        String.raw`function filteredVectorSearch(points,query,context,k){
  if(!context||![context.tenantId,context.userId].every(x=>typeof x==='string'&&x.trim())||!Number.isSafeInteger(k)||k<0)throw new Error('Invalid scope or k');
  return points.filter(p=>p.tenantId===context.tenantId&&p.deleted===false&&p.allowedUsers.includes(context.userId)).map((p,index)=>({id:p.id,score:p.vector.reduce((s,x,j)=>s+x*query[j],0),index})).sort((a,b)=>b.score-a.score||a.index-b.index).slice(0,k).map(({index,...r})=>r);
}`,
        String.raw`const points=[{id:'private',tenantId:'other',deleted:false,allowedUsers:['u'],vector:[1,0]},{id:'ok',tenantId:'t',deleted:false,allowedUsers:['u'],vector:[0.5,Math.sqrt(0.75)]}];eq(filteredVectorSearch(points,[1,0],{tenantId:'t',userId:'u'},1),[{id:'ok',score:0.5}]);eq(filteredVectorSearch(points,[1,0],{tenantId:'t',userId:'x'},1),[]);`),
    task('Vector Databases','Medium','revision-plan','Plan point deletions when a document gets shorter',
        'A document revision replaces chunk IDs c1,c2,c3 with c1,c2. Given unique old and new chunk-ID arrays, return upsertIds for all new IDs and deleteIds for old IDs absent from the new revision. Reject duplicates and blank IDs. This is a plan only; the authoritative document update must coordinate revision visibility.',
        'Remove stale chunk points rather than leaving old evidence searchable.',
        ['Preserve input order in upsert and deletion plans.','Include shared IDs in upserts because content or metadata may have changed.'],
        [['Old [c1,c2,c3], new [c1,c2]','Upsert c1,c2 and delete c3'],['New revision has no chunks','Delete all old IDs']],
        ['A same-ID point can still need new vector and revision metadata.','Separate planning from an atomic or version-gated publication protocol.'],
        'Document updates need both new content and removal of obsolete points. A delete plan alone does not establish read consistency during a multi-step update. Production publication should make a complete revision visible under the backend’s supported consistency guarantees.',
        String.raw`function revisionPlan(oldIds,newIds){
  for(const ids of [oldIds,newIds])if(!Array.isArray(ids)||!ids.every(x=>typeof x==='string'&&x.trim())||new Set(ids).size!==ids.length)throw new Error('Invalid IDs');
  const keep=new Set(newIds);return {upsertIds:[...newIds],deleteIds:oldIds.filter(id=>!keep.has(id))};
}`,
        String.raw`eq(revisionPlan(['c1','c2','c3'],['c1','c2']),{upsertIds:['c1','c2'],deleteIds:['c3']});eq(revisionPlan(['c1'],[]),{upsertIds:[],deleteIds:['c1']});assert.throws(()=>revisionPlan([],['x','x']));`),
    task('Vector Databases','Medium','ann-recall','Measure ANN neighbor recall against a filtered exact baseline',
        'Given unique ordered exact neighbor IDs and approximate neighbor IDs for the same query, corpus snapshot, filter, and metric, calculate neighborRecallAtK as intersection of their first k sets divided by min(k,exact.length). Require positive integer k and return null if exact has no eligible neighbors. Approximate duplicates cannot increase the numerator.',
        'Measure index approximation independently of semantic evidence relevance.',
        ['Validate exact IDs are unique and keep k slicing before approximate deduplication.','Do not call geometric neighbor recall an answer-quality or evidence-relevance metric.'],
        [['Exact [a,b,c], approximate [b,x,a], k=2','Recall 1/2'],['Exact has no eligible points','null']],
        ['The denominator is the available exact top-k set, not approximate result count.','A matched neighbor can still be semantically irrelevant to the question.'],
        'ANN recall compares approximate search to an exact geometric oracle under identical conditions. It diagnoses index/search approximation, whereas relevance labels measure whether neighbors supply useful evidence. Changing filters or snapshots invalidates a paired comparison.',
        String.raw`function neighborRecall(exact,approximate,k){
  if(!Number.isSafeInteger(k)||k<1||new Set(exact).size!==exact.length)throw new Error('Invalid oracle or k');
  const expected=new Set(exact.slice(0,k));if(!expected.size)return null;
  const found=new Set(approximate.slice(0,k));return [...expected].filter(id=>found.has(id)).length/expected.size;
}`,
        String.raw`assert.equal(neighborRecall(['a','b','c'],['b','x','a'],2),0.5);assert.equal(neighborRecall([],[],3),null);assert.equal(neighborRecall(['a','b'],['a','a'],2),0.5);assert.throws(()=>neighborRecall(['a','a'],[],2));`),
    task('Vector Databases','Hard','revision-visibility','Publish only the active complete revision per tenant and document',
        'Implement a pure visibility filter for vector points using trusted active-revision records. Scope active revisions by the tuple (tenantId,documentId), reject duplicate active entries, and show only points whose revision matches and deleted=false. A document without an active revision is invisible. Do not mutate data or claim this helper atomically publishes database writes.',
        'Prevent mixed revisions from entering search during reindexing.',
        ['Use an unambiguous tuple key rather than delimiter concatenation.','Require active revision matching before scoring and retain isolation for equal document IDs across tenants.'],
        [['Old r1 and new r2 points; active is r2','Only r2 points visible'],['Tenant A and B share document ID d but have different active revisions','Each uses its own tuple mapping']],
        ['Build all new points before switching the active-revision pointer.','Readers must obtain a consistent publication view under the actual storage protocol.'],
        'Revision-gated visibility can hide partial rebuilds until a complete set is published. It requires a coordinated write/pointer protocol and garbage collection, not merely an in-memory predicate. The application must separately apply current user authorization.',
        String.raw`function visibleRevisions(points,active){
  const key=v=>JSON.stringify([v.tenantId,v.documentId]),versions=new Map();
  for(const a of active){if(versions.has(key(a)))throw new Error('Ambiguous active revision');versions.set(key(a),a.revision);}
  return points.filter(p=>p.deleted===false&&versions.has(key(p))&&versions.get(key(p))===p.revision);
}`,
        String.raw`const points=[{id:'old',tenantId:'a',documentId:'d',revision:'r1',deleted:false},{id:'new',tenantId:'a',documentId:'d',revision:'r2',deleted:false},{id:'other',tenantId:'b',documentId:'d',revision:'r1',deleted:false}];const active=[{tenantId:'a',documentId:'d',revision:'r2'}];eq(visibleRevisions(points,active).map(p=>p.id),['new']);assert.throws(()=>visibleRevisions(points,[...active,...active]));`),
    task('Vector Databases','Hard','shard-topk','Merge exact per-shard results into a global top-k',
        'Merge per-shard scored results for a disjointly partitioned vector collection. Assume each shard applies the same metadata filters/metric/snapshot and returns its exact local top k, with larger scores better. Return global top k using ID string order to break ties. Reject duplicate IDs across shards, which violate the partition contract.',
        'Explain the conditions under which local top-k sets suffice for exact global top-k.',
        ['Require nonnegative integer k and finite scores; do not silently deduplicate conflicting replicas.','State that approximate local results or inconsistent tie policies can invalidate exactness.'],
        [['Shard A a:0.9,b:0.7; shard B c:0.8,d:0.6; k=2','a then c'],['Same ID appears on two shards','Reject partition-contract violation']],
        ['A point outside a shard’s local top k cannot outrank global top k under consistent ordering.','The ID tie rule must also be used when shards choose their local top k.'],
        'Distributed top-k reasoning depends on disjoint ownership and consistent ordering/filtering. Approximate search can lose candidates before the merge, while replicas require a separate version-aware reconciliation policy. This reference merges supplied small result arrays and does not simulate network failures.',
        String.raw`function mergeShardResults(shards,k){
  if(!Number.isSafeInteger(k)||k<0)throw new Error('Invalid k');const seen=new Set(),all=[];
  for(const shard of shards)for(const row of shard){if(typeof row.id!=='string'||!row.id||seen.has(row.id)||!Number.isFinite(row.score))throw new Error('Invalid shard result');seen.add(row.id);all.push({...row});}
  return all.sort((a,b)=>b.score-a.score||(a.id<b.id?-1:a.id>b.id?1:0)).slice(0,k);
}`,
        String.raw`eq(mergeShardResults([[{id:'a',score:0.9},{id:'b',score:0.7}],[{id:'c',score:0.8}]],2).map(x=>x.id),['a','c']);assert.throws(()=>mergeShardResults([[{id:'a',score:1}],[{id:'a',score:1}]],1));eq(mergeShardResults([],0),[]);`),
    task('Vector Databases','Hard','index-scaling','Plan an index benchmark with selective tenant filters and updates',
        'A vector collection is growing while tenants have very different sizes and documents change hourly. Design an index/scaling benchmark comparing exact and approximate search under realistic metadata filters. Include recall, tail latency, memory, update visibility, deletion correctness, and failure recovery without assuming every backend exposes the same index controls.',
        'Choose database configuration from workload evidence rather than index-name folklore.',
        ['Compare approximate results to exact filtered neighbors on the same corpus snapshot and query set.','Test selective filters, churn, skewed tenants, read-after-update behavior, and recovery under explicit acceptance thresholds.'],
        [['Unfiltered latency is fast but strict-filter recall drops','Benchmark and tune the filtered workload rather than accepting the aggregate'],['Deletion is acknowledged but old evidence remains visible','Treat it as a consistency/access correctness failure']],
        ['Separate geometric ANN recall from labeled evidence relevance.','Raw vector bytes exclude graph, payload index, replicas, and working-memory overhead.'],
        'Index quality is a workload trade-off among search accuracy, latency, memory, and mutation behavior. Vendor-specific knobs and consistency semantics must be measured rather than copied as unsupported library assumptions. Access-control filters are mandatory, not a performance option.',
        'Freeze representative snapshots, compatible embeddings, query sets, and authorization filters. Establish exact filtered top-k oracles, then vary supported index/search settings and payload indexes while tracking neighbor recall, p50/p95/p99 latency, throughput, memory, and ingestion cost. Slice by tenant size, filter selectivity, language, and update rate. Verify insert/update/delete visibility against documented read/write guarantees, including revocation and stale replicas. Exercise restart, partial rebuild, and revision rollback; avoid publishing incomplete versions. Choose settings against declared service and correctness thresholds, then canary with monitoring. This review supplies a benchmark protocol; it does not claim a live backend was tested.'),
    task('Chunking','Easy','token-windows','Split token IDs with bounded overlap and guaranteed progress',
        'Implement token-ID windows for one RAG document with positive integer size and integer overlap satisfying 0<=overlap<size. Return {start,end,tokens} with half-open token offsets. Stop after the first window reaching the document end, avoiding a redundant overlap-only tail. Token IDs are supplied by a real tokenizer upstream; fixtures test indexing only.',
        'Apply overlap in explicit token units without infinite loops or redundant tails.',
        ['Advance by size−overlap and copy each token slice.','Return an empty array for no tokens and reject overlap>=size.'],
        [['Tokens [0,1,2,3,4,5,6], size 4, overlap 1','Spans [0,4) and [3,7)'],['Three tokens, size 4','One span [0,3)']],
        ['Check for end-of-document before advancing again.','A token offset is not a JavaScript character offset.'],
        'Token windows give a predictable input-size bound but can break semantic units. Overlap repeats evidence and increases embedding/storage costs, so it needs measured justification. The supplied token IDs do not imply a universal tokenizer or character-to-token ratio.',
        String.raw`function tokenWindows(tokens,size,overlap){
  if(!Number.isSafeInteger(size)||size<1||!Number.isSafeInteger(overlap)||overlap<0||overlap>=size)throw new Error('Invalid chunk geometry');
  const chunks=[];for(let start=0;start<tokens.length;start+=size-overlap){const end=Math.min(start+size,tokens.length);chunks.push({start,end,tokens:tokens.slice(start,end)});if(end===tokens.length)break;}return chunks;
}`,
        String.raw`eq(tokenWindows([0,1,2,3,4,5,6],4,1).map(x=>[x.start,x.end]),[[0,4],[3,7]]);eq(tokenWindows([],4,1),[]);assert.equal(tokenWindows([1,2,3],4,1).length,1);assert.throws(()=>tokenWindows([1],4,4));`),
    task('Chunking','Easy','document-boundaries','Pack whole blocks without crossing document boundaries',
        'Pack ordered source blocks {documentId,tokens} into chunks up to a positive token capacity. A block is indivisible; throw if it exceeds capacity. Never combine blocks from different document IDs, even when room remains. Skip empty blocks and return copied token arrays. Tokens are already encoded; no separator tokens are inserted in this local contract.',
        'Respect document identity independently of remaining chunk capacity.',
        ['Flush on document change or capacity overflow and preserve source order.','Reject oversized atomic blocks instead of silently truncating source evidence.'],
        [['Block A:[1,2], B:[3], capacity 4','Separate document chunks'],['Blocks A:[1], A:[2,3], capacity 3','One A chunk [1,2,3]']],
        ['Current document identity is part of packing state.','If real serialization adds headings or separators, count those tokens in its adapter.'],
        'Document boundaries prevent unrelated sources from sharing a citation unit. Atomic blocks preserve local semantics at the cost of unused capacity. An oversized block requires an explicit secondary splitting policy rather than unnoticed truncation.',
        String.raw`function packDocumentBlocks(blocks,capacity){
  if(!Number.isSafeInteger(capacity)||capacity<1)throw new Error('Invalid capacity');const result=[];let current=null;
  for(const block of blocks){if(block.tokens.length>capacity)throw new Error('Oversized atomic block');if(!block.tokens.length)continue;
    if(!current||current.documentId!==block.documentId||current.tokens.length+block.tokens.length>capacity){current={documentId:block.documentId,tokens:[]};result.push(current);}current.tokens.push(...block.tokens);}
  return result;
}`,
        String.raw`eq(packDocumentBlocks([{documentId:'A',tokens:[1,2]},{documentId:'B',tokens:[3]}],4),[{documentId:'A',tokens:[1,2]},{documentId:'B',tokens:[3]}]);eq(packDocumentBlocks([{documentId:'A',tokens:[1]},{documentId:'A',tokens:[2,3]}],3)[0].tokens,[1,2,3]);assert.throws(()=>packDocumentBlocks([{documentId:'A',tokens:[1,2]}],1));`),
    task('Chunking','Medium','heading-budget','Reserve a section heading inside each chunk’s token budget',
        'Implement section chunking with a fixed heading-token prefix repeated on every chunk. Given body tokens, total capacity, and body overlap, allocate bodySize=capacity−heading.length; require positive bodySize and 0<=overlap<bodySize. Return body spans plus combined heading/body token arrays, stopping after covering the body. Empty body yields no chunks.',
        'Include repeated contextual metadata in chunk size accounting.',
        ['Do not let heading tokens push a chunk above total capacity.','Keep offsets relative to the original body, not the repeated prefix.'],
        [['Heading [9], body [0,1,2,3,4], capacity 4, overlap 1','Body spans [0,3),[2,5); combined lengths 4 each'],['Heading consumes the entire capacity','Reject no room for body']],
        ['Subtract heading overhead before choosing the window stride.','Repeated heading context and body overlap consume different parts of the budget.'],
        'Section headings can improve interpretation of short passages, but their repeated tokens consume capacity and may bias matching. Preserve original source offsets separately from injected context so citations still resolve to authentic source spans.',
        String.raw`function sectionChunks(heading,body,capacity,overlap){
  const size=capacity-heading.length;if(!Number.isSafeInteger(capacity)||capacity<1||size<1||!Number.isSafeInteger(overlap)||overlap<0||overlap>=size)throw new Error('Invalid section budget');
  const result=[];for(let start=0;start<body.length;start+=size-overlap){const end=Math.min(start+size,body.length);result.push({start,end,tokens:[...heading,...body.slice(start,end)]});if(end===body.length)break;}return result;
}`,
        String.raw`const chunks=sectionChunks([9],[0,1,2,3,4],4,1);eq(chunks.map(x=>[x.start,x.end]),[[0,3],[2,5]]);assert.ok(chunks.every(x=>x.tokens.length<=4&&x.tokens[0]===9));assert.throws(()=>sectionChunks([9],[1],1,0));`),
    task('Chunking','Hard','span-audit','Audit source coverage and repeated-token workload',
        'Given document token length N and half-open source chunk spans [start,end), calculate coveredTokens (union length), repeatedTokens (sum of span lengths minus union), and uncoveredTokens (N−union). Validate integer bounds 0<=start<end<=N. Input spans may be unordered or nested; do not sum overlaps pairwise because triple overlaps would be miscounted.',
        'Quantify coverage gaps and overlap cost using an interval union.',
        ['Sort a copy and merge intervals in O(m log m) for m spans.','Return all-zero counts for N=0 with no spans and reject out-of-document offsets.'],
        [['N=10, spans [0,6),[4,9)','Covered 9, repeated 2, uncovered 1'],['N=5, spans [0,5),[1,4),[2,3)','Covered 5, repeated 4, uncovered 0']],
        ['Track a merged running end rather than enumerating every token position.','Repeated workload counts all extra occurrences, not just positions repeated at least once.'],
        'A union audit exposes gaps and redundant embedding/context tokens independently of semantic retrieval quality. Nested and triple-overlapping spans require a union calculation rather than pairwise subtraction. Heading tokens added outside source spans need separate overhead accounting.',
        String.raw`function chunkCoverage(n,spans){
  if(!Number.isSafeInteger(n)||n<0||!spans.every(([a,b])=>Number.isSafeInteger(a)&&Number.isSafeInteger(b)&&0<=a&&a<b&&b<=n))throw new Error('Invalid source spans');
  const sorted=spans.map(x=>[...x]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]);let covered=0,end=0,total=0;
  for(const [a,b] of sorted){total+=b-a;covered+=Math.max(0,b-Math.max(a,end));end=Math.max(end,b);}
  return {coveredTokens:covered,repeatedTokens:total-covered,uncoveredTokens:n-covered};
}`,
        String.raw`eq(chunkCoverage(10,[[4,9],[0,6]]),{coveredTokens:9,repeatedTokens:2,uncoveredTokens:1});eq(chunkCoverage(5,[[0,5],[1,4],[2,3]]),{coveredTokens:5,repeatedTokens:4,uncoveredTokens:0});eq(chunkCoverage(0,[]),{coveredTokens:0,repeatedTokens:0,uncoveredTokens:0});assert.throws(()=>chunkCoverage(4,[[0,5]]));`),
    task('Chunking','Hard','strategy-study','Compare chunk strategies without rewarding overlap duplicates',
        'Design a RAG chunking experiment comparing fixed token windows, section-aware splitting, and different overlap sizes. Evaluate factual lookup, cross-paragraph reasoning, tables, and unanswerable cases while holding document snapshots, embedding model, retrieval settings, and generator policy fixed where possible.',
        'Choose chunk geometry from evidence coverage, answer utility, and cost.',
        ['Define ground truth at source-span or fact level so overlapping duplicate chunks do not inflate recall.','Measure answer support, missed evidence, token/storage overhead, latency, and slice regressions on held-out documents.'],
        [['Large overlap returns three chunks covering the same fact','Count that evidence fact once, not as three recovered facts'],['A table row loses its column heading','Test heading-aware serialization or table-preserving blocks with provenance']],
        ['Chunk IDs change between strategies, so they are a poor shared gold-label unit.','Source-span labels can be mapped onto each chunking configuration.'],
        'Chunking changes both candidate units and information density. A fair comparison anchors labels in original evidence and measures end-to-end consequences rather than merely counting returned chunks. Added overlap or headings must be included in resource budgets.',
        'Freeze source revisions and split evaluation by independent documents/entities before tuning. Annotate required facts/source spans, including multispan and unanswerable questions. Render each strategy with its actual tokenizer, headings, table handling, overlap, and provenance map; validate capacity and coverage audits. Use compatible embeddings and comparable retrieval/reranking/context budgets. Report unique fact/span recall, relevant-context density, supported-answer quality, abstention, p95 latency, embedded tokens, and storage by slice. Select settings on development data and evaluate the frozen choice on held-out documents. Review examples where duplicate overlap crowds out distinct evidence, and retain versioned rollback artifacts.'),
    task('Embeddings','Easy','space-contract','Check query and passage embedding-space compatibility',
        'Implement a compatibility check for trusted query and passage embedding descriptors. Require equal nonblank spaceId, revision, metric, and positive integer dimension. Require role=query for the query descriptor and role=document for the passage descriptor. Different query/document encoder identities are allowed when the same spaceId explicitly identifies a supported paired model contract.',
        'Check coordinate-space compatibility without assuming every encoder is symmetric.',
        ['Return false for missing/malformed descriptors or mismatched configuration.','Allow role-specific encoders only through a documented shared space contract, not merely equal dimensions.'],
        [['Matching paired space metadata with query/document roles','true'],['Same dimension but a different space revision','false']],
        ['Equal vector width does not imply comparable coordinates.','Some embedding models specify distinct query and passage input processing.'],
        'RAG queries and documents must inhabit a compatible learned space under the chosen scoring convention. Asymmetric encoders can be valid when trained as a pair; an application-owned contract records that fact. Descriptor equality alone cannot certify an incorrectly configured external adapter.',
        String.raw`function compatibleSpace(query,document){
  const valid=v=>v&&['spaceId','revision','metric'].every(k=>typeof v[k]==='string'&&v[k].trim())&&['cosine','dot','squared_l2'].includes(v.metric)&&Number.isSafeInteger(v.dimension)&&v.dimension>0;
  return Boolean(valid(query)&&valid(document)&&query.role==='query'&&document.role==='document'&&['spaceId','revision','metric','dimension'].every(k=>query[k]===document[k]));
}`,
        String.raw`const q={spaceId:'paired',revision:'r1',metric:'cosine',dimension:3,role:'query'};const d={...q,role:'document'};assert.equal(compatibleSpace(q,d),true);assert.equal(compatibleSpace(q,{...d,revision:'r2'}),false);assert.equal(compatibleSpace(q,{...d,spaceId:'other'}),false);`),
    task('Embeddings','Easy','role-format','Apply model-specific query and passage prefixes deliberately',
        'Implement embedding-input formatting using a supplied trusted format object with separate queryPrefix and documentPrefix strings. Accept a query or document role and string text, return prefix+text exactly, and reject unknown roles. Prefix values in the fixtures are illustrative and must not be presented as requirements of every embedding model.',
        'Keep role-specific embedding preprocessing aligned with the selected model recipe.',
        ['Do not trim, lowercase, or add separators beyond the supplied prefix.','Validate both configured prefixes as strings and preserve text verbatim.'],
        [['Configured query prefix q: , role query, text cache','q: cache'],['Document prefix empty, text with leading spaces','Exact original text']],
        ['Input formatting is part of the versioned embedding configuration.','Do not apply a query prefix to stored passages just because they use the same API endpoint.'],
        'Some models require role instructions or prefixes, while others do not. A trusted adapter should implement the actual selected model’s recipe and include its version in cache/index identity. This local formatter verifies wiring without calling a model or claiming semantic quality.',
        String.raw`function formatEmbeddingInput(text,role,format){
  if(typeof text!=='string'||!['query','document'].includes(role)||typeof format?.queryPrefix!=='string'||typeof format?.documentPrefix!=='string')throw new Error('Invalid embedding format');
  return format[role==='query'?'queryPrefix':'documentPrefix']+text;
}`,
        String.raw`assert.equal(formatEmbeddingInput('cache','query',{queryPrefix:'q: ',documentPrefix:''}),'q: cache');assert.equal(formatEmbeddingInput('  text','document',{queryPrefix:'q: ',documentPrefix:''}),'  text');assert.throws(()=>formatEmbeddingInput('x','system',{queryPrefix:'',documentPrefix:''}));`),
    task('Embeddings','Medium','invalidation-plan','Separate re-embedding from metadata-only refreshes',
        'Given desired RAG chunk descriptors and a map of existing stored descriptors keyed by chunk ID, plan reembeddingIds versus metadataOnlyIds. Re-embed when missing or when trusted contentHash, spaceId, embeddingRevision, or preprocessVersion differs. A changed sourceRevision alone requires metadata refresh, not a new vector. Assume descriptors are validated and content hashes come from the application.',
        'Invalidate cached vectors according to actual embedding inputs and configuration.',
        ['Prioritize re-embedding over metadata-only updates when both changed.','Return desired IDs in input order and leave deletion of removed chunks to a separate revision plan.'],
        [['Same content/model, changed sourceRevision','metadataOnlyIds contains the chunk'],['Changed contentHash and sourceRevision','Only reembeddingIds contains it']],
        ['Source provenance can change while text stays byte-identical.','A stored model name without a revision/preprocessing identity is insufficient for reuse.'],
        'Re-embedding every metadata update wastes resources, while missing a model/content change corrupts compatibility. Separate the vector fingerprint from provenance versioning. A real writer must still coordinate vector publication, permission changes, and deletion visibility.',
        String.raw`function embeddingRefreshPlan(desired,existing){
  const reembeddingIds=[],metadataOnlyIds=[];
  for(const d of desired){const old=existing.get(d.id);if(!old||['contentHash','spaceId','embeddingRevision','preprocessVersion'].some(k=>old[k]!==d[k]))reembeddingIds.push(d.id);else if(old.sourceRevision!==d.sourceRevision)metadataOnlyIds.push(d.id);}
  return {reembeddingIds,metadataOnlyIds};
}`,
        String.raw`const old={id:'c',contentHash:'h',spaceId:'s',embeddingRevision:'e',preprocessVersion:'p',sourceRevision:'r1'};const store=new Map([['c',old]]);eq(embeddingRefreshPlan([{...old,sourceRevision:'r2'}],store),{reembeddingIds:[],metadataOnlyIds:['c']});eq(embeddingRefreshPlan([{...old,contentHash:'new',sourceRevision:'r2'}],store),{reembeddingIds:['c'],metadataOnlyIds:[]});assert.equal(old.contentHash,'h');`),
    task('Embeddings','Medium','unit-metric-identity','Verify cosine and squared-distance equivalence for unit vectors',
        'For finite nonempty same-width unit embeddings, return dot similarity and squared Euclidean distance, validating squared norms within 1e-9 of one. Demonstrate squaredDistance approximately equals 2−2*dot. Reject nonunit vectors instead of applying this identity to arbitrary magnitudes.',
        'Use metric equivalences only when normalization assumptions hold.',
        ['Compute distance from coordinate differences and dot directly.','Validate shapes, finite coordinates, and unit norms rather than silently normalizing inputs.'],
        [['[1,0] and [0,1]','Dot 0, squared distance 2'],['[2,0] and [1,0]','Reject nonunit input']],
        ['Expand ||a−b||² as ||a||²+||b||²−2a·b.','Matching rankings under this identity do not imply a backend uses the same score transformation.'],
        'For unit vectors, maximizing cosine/dot and minimizing squared Euclidean distance produce equivalent rankings. The equivalence fails for unnormalized vectors with differing norms. Recording normalization and metric configuration prevents accidental score mixing in a RAG index.',
        String.raw`function unitMetrics(a,b){
  if(!Array.isArray(a)||!Array.isArray(b)||!a.length||a.length!==b.length||![...a,...b].every(Number.isFinite))throw new Error('Invalid vectors');
  const squaredNorm=v=>v.reduce((sum,x)=>sum+x*x,0);if(Math.abs(squaredNorm(a)-1)>1e-9||Math.abs(squaredNorm(b)-1)>1e-9)throw new Error('Nonunit vectors');
  return {dot:a.reduce((s,x,i)=>s+x*b[i],0),squaredDistance:a.reduce((s,x,i)=>s+(x-b[i])**2,0)};
}`,
        String.raw`eq(unitMetrics([1,0],[0,1]),{dot:0,squaredDistance:2});const r=unitMetrics([Math.SQRT1_2,Math.SQRT1_2],[1,0]);assert.ok(Math.abs(r.squaredDistance-(2-2*r.dot))<1e-12);assert.throws(()=>unitMetrics([2,0],[1,0]));`),
    task('Embeddings','Hard','batch-budget','Plan embedding requests under per-input and per-request limits',
        'Pack ordered RAG chunks {id,tokenCount} into embedding requests with positive integer maxInputTokens, maxRequestTokens, and maxItems. Counts already include model-specific formatting. Reject a single input exceeding either token cap; do not silently truncate evidence. Preserve each chunk once and limit both summed tokens and item count per request.',
        'Make embedding ingestion batches obey explicit service limits without losing association.',
        ['Validate unique nonblank IDs, positive integer counts, and valid limits before returning a plan.','Use ordered greedy packing; do not claim it minimizes request count or represents every provider’s limits.'],
        [['Counts [3,3,2], request cap 5, item cap 2','Requests [first] and [second,third]'],['Single count exceeds per-input cap','Throw with no executable request plan']],
        ['Both a token cap and an item cap can bind a batch.','Validation must finish before a caller starts issuing planned requests.'],
        'Embedding APIs can impose distinct input and batch limits; their actual values belong in a maintained adapter. Batch planning should never silently discard source content. Retries must preserve IDs and validated responses before versioned index publication.',
        String.raw`function embeddingBatches(chunks,limits){
  if(!['maxInputTokens','maxRequestTokens','maxItems'].every(k=>Number.isSafeInteger(limits[k])&&limits[k]>0))throw new Error('Invalid limits');const ids=new Set();
  for(const c of chunks){if(typeof c.id!=='string'||!c.id.trim()||ids.has(c.id)||!Number.isSafeInteger(c.tokenCount)||c.tokenCount<1||c.tokenCount>limits.maxInputTokens||c.tokenCount>limits.maxRequestTokens)throw new Error('Invalid chunk');ids.add(c.id);}
  const batches=[];let batch=[],tokens=0;for(const c of chunks){if(batch.length&&(batch.length===limits.maxItems||tokens+c.tokenCount>limits.maxRequestTokens)){batches.push(batch);batch=[];tokens=0;}batch.push(c.id);tokens+=c.tokenCount;}if(batch.length)batches.push(batch);return batches;
}`,
        String.raw`const limits={maxInputTokens:4,maxRequestTokens:5,maxItems:2};eq(embeddingBatches([{id:'a',tokenCount:3},{id:'b',tokenCount:3},{id:'c',tokenCount:2}],limits),[['a'],['b','c']]);assert.throws(()=>embeddingBatches([{id:'a',tokenCount:5}],limits));eq(embeddingBatches([],limits),[]);`),
    task('Embeddings','Hard','embedding-quality','Evaluate a new query-passage encoder on the actual evidence task',
        'A multilingual RAG application considers replacing its embedding model with one advertised as better on a general benchmark. Design a controlled query-passage evaluation covering exact identifiers, paraphrases, short questions, long passages, language slices, and authorized corpus subsets. Do not assume equal dimension means compatible vectors.',
        'Select an embedding model from task relevance, operational constraints, and migration safety.',
        ['Re-embed both query and passage sides under the new model’s documented role formatting and pooling recipe.','Evaluate held-out labeled evidence metrics, latency, cost, limits, and slice regressions under matched retrieval budgets.'],
        [['New model improves average relevance but loses exact product-code questions','Inspect sparse/hybrid support and gate the affected slice'],['Only queries are re-embedded against old passage vectors','Reject the incompatible-space experiment']],
        ['Keep source evidence labels fixed while changing representation.','Separate representation quality from ANN approximation and generator behavior.'],
        'Embedding quality is conditional on domain, language, query style, and downstream budgets. A controlled exact-search comparison isolates representation effects before adding ANN and reranking. Model migration requires compatible versioned indexes and rollback, not only API replacement.',
        'Freeze authorized source snapshots and source-level relevance labels; split by independent documents/entities and preserve a held-out set. Build separate old/new passage embeddings with each model’s actual query/document instructions, token limits, pooling, normalization, and version metadata. Compare exact filtered search first using recall@k, reciprocal rank, and evidence diversity under equal candidate budgets; then measure ANN loss separately. Slice by language, identifiers, long inputs, and unanswerable requests, and assess latency/usage. Evaluate the full answer pipeline only after representation checks. Publish a complete versioned index through canary routing, keep query/index versions paired, and preserve rollback plus privacy retention controls.'),
    task('Retrieval','Easy','sparse-dot','Score sparse lexical vectors with an explicit dot product',
        'Implement sparse retrieval scoring from query and document Maps of token→nonnegative finite weight. Return the sum of queryWeight*documentWeight for shared tokens, treating absent tokens as zero. This is supplied-vector dot scoring, not a claimed BM25 implementation or semantic understanding.',
        'Distinguish sparse lexical overlap from dense learned similarity.',
        ['Validate weights on both maps and sum shared coordinates only.','Return zero for no overlap or an empty query without mutating either map.'],
        [['Query cache:2, miss:1; document cache:3, hit:4','Score 6'],['No common token keys','Score 0']],
        ['Missing sparse coordinates are zeros.','Lexical tokenization, stemming, and weighting are separate upstream policies.'],
        'Sparse vectors attach explicit weights to vocabulary terms, making exact identifiers useful signals. Their dot product is a retrieval score under a stated weighting scheme, not a probability of relevance. Dense embeddings can capture different relationships and need separate calibration or rank fusion.',
        String.raw`function sparseScore(query,document){
  for(const map of [query,document])for(const weight of map.values())if(!Number.isFinite(weight)||weight<0)throw new Error('Invalid sparse weight');
  let score=0;for(const [token,weight] of query)score+=weight*(document.get(token)??0);return score;
}`,
        String.raw`assert.equal(sparseScore(new Map([['cache',2],['miss',1]]),new Map([['cache',3],['hit',4]])),6);assert.equal(sparseScore(new Map([['a',1]]),new Map([['b',2]])),0);assert.throws(()=>sparseScore(new Map([['a',-1]]),new Map()));`),
    task('Retrieval','Easy','unique-topk','Deduplicate ranked chunk IDs before filling a retrieval budget',
        'Given an already relevance-ranked authorized candidate list {chunkId,score}, select the first k unique chunk IDs at or above a supplied finite score threshold. Preserve the earliest occurrence, including its score; duplicate candidates must not consume separate result slots. Require nonnegative integer k and finite candidate scores.',
        'Separate candidate slots from unique evidence units.',
        ['Deduplicate before applying the result count limit.','Return copied records and permit k=0 or no eligible matches.'],
        [['Candidates a:0.9,a:0.8,b:0.7, k=2, threshold 0.5','a:0.9 and b:0.7'],['Threshold above every score','Empty results']],
        ['Keep a seen-ID set while traversing ranking order.','This policy does not identify semantic duplicates with different chunk IDs.'],
        'Repeated candidates can arise when merging multiple retrieval paths. Exact-ID deduplication prevents them from crowding out distinct evidence, but overlapping source spans still need a separate diversity policy. A threshold is model/task specific and must not be copied across incompatible scorers.',
        String.raw`function uniqueRetrieval(candidates,k,threshold){
  if(!Number.isSafeInteger(k)||k<0||!Number.isFinite(threshold)||!candidates.every(c=>typeof c.chunkId==='string'&&c.chunkId&&Number.isFinite(c.score)))throw new Error('Invalid candidates');
  const seen=new Set(),out=[];for(const c of candidates){if(out.length===k)break;if(c.score>=threshold&&!seen.has(c.chunkId)){seen.add(c.chunkId);out.push({...c});}}return out;
}`,
        String.raw`eq(uniqueRetrieval([{chunkId:'a',score:0.9},{chunkId:'a',score:0.8},{chunkId:'b',score:0.7}],2,0.5),[{chunkId:'a',score:0.9},{chunkId:'b',score:0.7}]);eq(uniqueRetrieval([{chunkId:'a',score:0.1}],2,0.5),[]);eq(uniqueRetrieval([],0,0),[]);`),
    task('Retrieval','Medium','bm25-term','Calculate one BM25 term contribution with explicit normalization',
        'Implement a BM25 term contribution using supplied corpus size N, document frequency df, term frequency tf, document token length dl, average document length avgdl, k1>0, and b in [0,1]. Use IDF=ln(1+(N−df+0.5)/(df+0.5)) and TF weight=tf*(k1+1)/(tf+k1*(1−b+b*dl/avgdl)). Return zero for tf=0.',
        'Trace lexical score components without treating BM25 as an opaque library call.',
        ['Validate integer corpus/frequency/length counts, df<=N, tf<=dl, positive avgdl, and valid k1/b.','When tf>0 require df>0; corpus statistics must refer to the chosen scoring corpus rather than another index.'],
        [['N=3,df=1,tf=2,dl=100,avgdl=100,k1=1.2,b=0.75','ln(1+2.5/1.5)*4.4/3.2'],['tf=0','Zero term contribution']],
        ['The IDF formula uses a natural logarithm and the supplied smoothing convention.','At dl=avgdl, length normalization reduces to one.'],
        'BM25 combines term rarity with saturating frequency and document-length normalization. Formula variants exist, so this exercise states one complete convention. Summing unique query-term contributions forms one possible query score; access filtering and candidate generation remain independent requirements.',
        String.raw`function bm25Term(N,df,tf,dl,avgdl,k1=1.2,b=0.75){
  if(![N,df,tf,dl].every(Number.isSafeInteger)||N<1||df<0||df>N||tf<0||dl<0||tf>dl||(tf>0&&df===0)||!Number.isFinite(avgdl)||avgdl<=0||!Number.isFinite(k1)||k1<=0||!Number.isFinite(b)||b<0||b>1)throw new Error('Invalid BM25 statistics');
  if(tf===0)return 0;return Math.log(1+(N-df+0.5)/(df+0.5))*tf*(k1+1)/(tf+k1*(1-b+b*dl/avgdl));
}`,
        String.raw`assert.ok(Math.abs(bm25Term(3,1,2,100,100)-Math.log(1+2.5/1.5)*4.4/3.2)<1e-12);assert.equal(bm25Term(3,1,0,10,100),0);assert.throws(()=>bm25Term(3,4,1,10,100));assert.throws(()=>bm25Term(3,0,1,10,100));`),
    task('Retrieval','Medium','hybrid-rrf','Fuse dense and sparse ranks without mixing raw score scales',
        'Implement reciprocal rank fusion for ranked ID lists from authorized dense and sparse retrieval. Each list must contain unique nonblank IDs. For every ID sum 1/(c+rank), with one-based ranks and positive integer c; missing IDs contribute zero. Sort descending fused score, breaking ties by first encounter across input lists.',
        'Combine heterogeneous retrieval signals using a fully defined rank-fusion formula.',
        ['Reject duplicates within one ranked list, but combine the same ID across different lists.','Keep rank one-based and do not interpret fused scores as calibrated probabilities.'],
        [['Lists [a,b] and [b,c], c=1','b scores 1/3+1/2 and ranks first'],['A list repeats a twice','Reject invalid ranking']],
        ['Rank fusion avoids directly adding incomparable dense and lexical scores.','The rank constant changes how strongly early positions dominate.'],
        'RRF combines ordered evidence from retrieval methods without requiring their numeric scores to share a scale. It still depends on each candidate window and rank constant, which should be selected on development relevance data. Fusion cannot recover evidence absent from every input list.',
        String.raw`function reciprocalRankFusion(lists,c){
  if(!Number.isSafeInteger(c)||c<1)throw new Error('Invalid rank constant');const scores=new Map();let order=0;
  for(const list of lists){if(new Set(list).size!==list.length||!list.every(id=>typeof id==='string'&&id.trim()))throw new Error('Invalid ranked IDs');list.forEach((id,i)=>{if(!scores.has(id))scores.set(id,{id,score:0,order:order++});scores.get(id).score+=1/(c+i+1);});}
  return [...scores.values()].sort((a,b)=>b.score-a.score||a.order-b.order).map(({order,...row})=>row);
}`,
        String.raw`const rows=reciprocalRankFusion([['a','b'],['b','c']],1);assert.equal(rows[0].id,'b');assert.ok(Math.abs(rows[0].score-5/6)<1e-12);assert.throws(()=>reciprocalRankFusion([['a','a']],60));eq(reciprocalRankFusion([],60),[]);`),
    task('Retrieval','Hard','mmr-diversity','Select diverse evidence with a stated MMR objective',
        'Implement greedy maximal marginal relevance over unique candidates with finite relevance and a supplied finite symmetric similarity matrix. For each next candidate maximize lambda*relevance−(1−lambda)*maxSimilarityToSelected. With nothing selected the penalty is zero; exact ties keep input order. Require lambda in [0,1] and nonnegative integer k.',
        'Trade query relevance against redundant evidence under an explicit selection rule.',
        ['Apply the supplied matrix by original candidate index and do not mutate inputs.','Return up to k IDs; assume relevance/similarity scales are deliberately comparable and authorization already applied.'],
        [['a relevance 1, b 0.9, c 0.8; similarity(a,b)=1, similarity(a,c)=0; lambda=0.5,k=2','a then c'],['k=0','Empty selection']],
        ['The diversity penalty depends on the current selected set.','No selected items means no redundancy penalty, not similarity to an arbitrary zero vector.'],
        'MMR can prevent overlapping evidence from dominating context, but its relevance/diversity scales and lambda need evaluation. It is a greedy heuristic rather than an optimal evidence-coverage solver. Strong diversity can discard closely related facts needed for one answer.',
        String.raw`function diverseEvidence(candidates,similarity,k,lambda){
  const n=candidates.length;if(!Number.isSafeInteger(k)||k<0||!Number.isFinite(lambda)||lambda<0||lambda>1||new Set(candidates.map(c=>c.id)).size!==n||!candidates.every(c=>Number.isFinite(c.relevance))||similarity.length!==n||!similarity.every(r=>r.length===n&&r.every(Number.isFinite)))throw new Error('Invalid MMR inputs');
  for(let i=0;i<n;i++)for(let j=0;j<n;j++)if(similarity[i][j]!==similarity[j][i])throw new Error('Asymmetric similarity');
  const selected=[],remaining=new Set(candidates.map((_,i)=>i));while(selected.length<k&&remaining.size){let best=null,bestScore=-Infinity;for(const i of remaining){const penalty=selected.length?Math.max(...selected.map(j=>similarity[i][j])):0;const score=lambda*candidates[i].relevance-(1-lambda)*penalty;if(best===null||score>bestScore){best=i;bestScore=score;}}selected.push(best);remaining.delete(best);}return selected.map(i=>candidates[i].id);
}`,
        String.raw`const c=[{id:'a',relevance:1},{id:'b',relevance:0.9},{id:'c',relevance:0.8}],s=[[1,1,0],[1,1,0],[0,0,1]];eq(diverseEvidence(c,s,2,0.5),['a','c']);eq(diverseEvidence(c,s,0,0.5),[]);assert.throws(()=>diverseEvidence(c,s,2,2));`),
    task('Retrieval','Hard','interval-context-budget','Pack evidence under a budget while suppressing near-identical spans',
        'Given authorized ranked evidence records {id,documentId,revision,start,end,tokens}, greedily select whole records under an integer token budget. Skip a candidate if its source-span intersection-over-union with any already selected record of the same document revision is at least a supplied threshold in (0,1]. Otherwise include it if it fits; skipped large records do not stop later smaller ones.',
        'Combine context capacity and source-overlap control without silently truncating evidence.',
        ['Use half-open valid source spans and positive integer serialized token costs, including citation wrappers.','Calculate IoU=intersection/(spanLengthA+spanLengthB−intersection); never compare offsets across different source revisions.'],
        [['First span [0,10), second [1,11) of same revision, threshold 0.8','Second skipped because IoU=9/11'],['High-ranked candidate is too large but a later candidate fits','Continue and include the later one']],
        ['Source overlap differs from cosine similarity and exact-ID duplication.','Budget accounting must include the actual serialized context representation.'],
        'Context selection is a constrained evidence policy rather than simple top-k slicing. Span IoU can suppress near-duplicate windows while preserving distinct revisions or documents, but it can also discard useful nuance. This greedy algorithm is deterministic, not an optimal knapsack solution.',
        String.raw`function contextBudget(rows,budget,maxIoU){
  if(!Number.isSafeInteger(budget)||budget<0||!Number.isFinite(maxIoU)||maxIoU<=0||maxIoU>1||!rows.every(r=>Number.isSafeInteger(r.start)&&Number.isSafeInteger(r.end)&&r.start>=0&&r.end>r.start&&Number.isSafeInteger(r.tokens)&&r.tokens>0))throw new Error('Invalid context contract');
  const selected=[];let used=0;for(const row of rows){const duplicate=selected.some(old=>{if(old.documentId!==row.documentId||old.revision!==row.revision)return false;const intersection=Math.max(0,Math.min(old.end,row.end)-Math.max(old.start,row.start));return intersection/((old.end-old.start)+(row.end-row.start)-intersection)>=maxIoU;});if(!duplicate&&row.tokens<=budget-used){selected.push({...row});used+=row.tokens;}}return {ids:selected.map(r=>r.id),usedTokens:used};
}`,
        String.raw`const a={id:'a',documentId:'d',revision:'r',start:0,end:10,tokens:3};const b={...a,id:'b',start:1,end:11};const c={...a,id:'c',documentId:'other',tokens:2};eq(contextBudget([a,b,c],5,0.8),{ids:['a','c'],usedTokens:5});eq(contextBudget([{...a,tokens:10},c],2,0.8),{ids:['c'],usedTokens:2});`),
    task('Reranking','Easy','score-correlation','Associate reranker scores with candidate IDs',
        'Reorder a supplied authorized retrieval candidate list using reranker response rows {id,score}, potentially arriving out of order. Require unique candidate IDs and exactly one finite score for every candidate, with no unknown IDs. Return candidates with rerankScore sorted descending, retaining retrieval order on ties.',
        'Keep relevance scores linked to the passage that was actually scored.',
        ['Reject missing, duplicate, and unknown score IDs before producing a ranking.','Do not sort by response arrival order or mutate original candidates.'],
        [['Candidates [a,b], scores b:0.9,a:0.1','b then a with their associated scores'],['Only a has a score','Reject incomplete result set']],
        ['Build an ID→score map and check complete coverage.','A valid score attached to the wrong passage silently corrupts the result.'],
        'Reranking evaluates query-candidate pairs but still requires accurate response association. Scores are model-specific ordering signals, not calibrated relevance probabilities. This exercise consumes supplied numeric fixtures and does not claim a real cross-encoder was executed.',
        String.raw`function applyReranker(candidates,scores){
  const ids=new Set(candidates.map(c=>c.id)),byId=new Map();if(ids.size!==candidates.length||scores.length!==candidates.length)throw new Error('Invalid score coverage');
  for(const row of scores){if(!ids.has(row.id)||byId.has(row.id)||!Number.isFinite(row.score))throw new Error('Invalid reranker row');byId.set(row.id,row.score);}
  return candidates.map((c,index)=>({...c,rerankScore:byId.get(c.id),index})).sort((a,b)=>b.rerankScore-a.rerankScore||a.index-b.index).map(({index,...c})=>c);
}`,
        String.raw`eq(applyReranker([{id:'a'},{id:'b'}],[{id:'b',score:0.9},{id:'a',score:0.1}]),[{id:'b',rerankScore:0.9},{id:'a',rerankScore:0.1}]);assert.throws(()=>applyReranker([{id:'a'},{id:'b'}],[{id:'a',score:1}]));assert.throws(()=>applyReranker([{id:'a'}],[{id:'x',score:1}]));`),
    task('Reranking','Easy','candidate-ceiling','Measure the evidence ceiling before reranking',
        'Given candidate chunk IDs and a gold set of relevant chunk IDs, return relevantInCandidates, relevantTotal, and candidateRecall. Deduplicate both lists, and return null recall when no gold relevance labels exist. Explain why a reranker cannot recover an omitted relevant chunk without a new retrieval step.',
        'Separate candidate-generation misses from ordering mistakes.',
        ['Count unique relevant IDs present anywhere in the candidate set.','Do not treat missing gold labels as proven unanswerability or as recall zero.'],
        [['Candidates [a,a,x], gold [a,b]','One of two relevant chunks present; recall 0.5'],['Empty gold list','Recall null']],
        ['Candidate recall is an upper bound for a reorder-only downstream stage.','A top-n final answer context can retain fewer relevant items than the full candidate set.'],
        'Reranking can improve order only among supplied candidates. Measuring candidate recall localizes upstream omissions before tuning the scoring model. Gold labels must be sufficiently complete and scoped to the same corpus/filter snapshot for the ceiling to be meaningful.',
        String.raw`function rerankCeiling(candidateIds,goldIds){
  const candidates=new Set(candidateIds),gold=new Set(goldIds);const relevantInCandidates=[...gold].filter(id=>candidates.has(id)).length;
  return {relevantInCandidates,relevantTotal:gold.size,candidateRecall:gold.size?relevantInCandidates/gold.size:null};
}`,
        String.raw`eq(rerankCeiling(['a','a','x'],['a','b']),{relevantInCandidates:1,relevantTotal:2,candidateRecall:0.5});eq(rerankCeiling(['a'],[]),{relevantInCandidates:0,relevantTotal:0,candidateRecall:null});`),
    task('Reranking','Medium','graded-ndcg','Compare reranked lists using a defined graded nDCG',
        'Implement nDCG@k for unique ranked candidate IDs and supplied nonnegative integer relevance grades in a Map; absent IDs have grade zero. Define gain=2^grade−1, discount=log2(rank+1) for one-based ranks, and ideal ranking from all supplied grades. Require positive integer k and grades 0 through 10. Return null when ideal DCG is zero.',
        'Measure graded relevance near the top rather than comparing arbitrary model scores.',
        ['Reject duplicate ranked IDs and invalid grades.','Normalize by the best possible top-k arrangement of the supplied gold grades.'],
        [['Grades a:3,b:1; ranking [a,b], k=2','nDCG 1'],['Same grades, ranking [b,a]','nDCG below 1']],
        ['The first rank discount is log2(2)=1.','Gold grades define the ideal; model scores do not.'],
        'nDCG rewards placing highly relevant evidence early while accounting for graded relevance. Its value depends on the gain convention and completeness of judged items. This implementation explicitly returns undefined-as-null for zero ideal gain rather than a misleading zero.',
        String.raw`function ndcg(rankedIds,grades,k){
  if(!Number.isSafeInteger(k)||k<1||new Set(rankedIds).size!==rankedIds.length||![...grades.values()].every(g=>Number.isInteger(g)&&g>=0&&g<=10))throw new Error('Invalid graded ranking');
  const dcg=values=>values.slice(0,k).reduce((sum,g,i)=>sum+(2**g-1)/Math.log2(i+2),0);
  const ideal=dcg([...grades.values()].sort((a,b)=>b-a));return ideal?dcg(rankedIds.map(id=>grades.get(id)??0))/ideal:null;
}`,
        String.raw`const grades=new Map([['a',3],['b',1]]);assert.equal(ndcg(['a','b'],grades,2),1);assert.ok(ndcg(['b','a'],grades,2)<1);assert.equal(ndcg(['x'],new Map(),2),null);assert.throws(()=>ndcg(['a','a'],grades,2));`),
    task('Reranking','Medium','latency-budget','Cap reranking candidates under a declared latency model',
        'Plan a reranking candidate count using a deliberately simplified serial latency estimate: fixed pipeline milliseconds plus rerank setup milliseconds plus n*perPairMilliseconds. Given a total deadline and available candidate count, return the largest n that fits, or zero to bypass reranking if even one pair cannot fit. Treat estimates as estimates, not a p95 guarantee.',
        'Make candidate-depth and latency trade-offs explicit before invoking a scorer.',
        ['Validate nonnegative finite times, positive per-pair time, and integer available count.','If bypassing, omit setup cost and report estimated total as the fixed pipeline time.'],
        [['Deadline 100, fixed 50, setup 10, per-pair 8, available 20','n=5, estimated total 100'],['Deadline 60 with the same other values','n=0, estimated total 50']],
        ['Solve the linear inequality before clipping by available candidates.','Real batch/GPU latency is often nonlinear and must be profiled separately.'],
        'Increasing rerank depth can improve candidate coverage but consumes latency and cost. A simple model supports an inspectable planning exercise, while real service decisions need measured batch-size, token-length, concurrency, and tail-latency behavior. A bypass policy should be evaluated for quality regressions.',
        String.raw`function rerankBudget(deadline,fixed,setup,perPair,available){
  if(![deadline,fixed,setup,perPair].every(Number.isFinite)||Math.min(deadline,fixed,setup)<0||perPair<=0||!Number.isSafeInteger(available)||available<0)throw new Error('Invalid latency model');
  const count=Math.min(available,Math.max(0,Math.floor((deadline-fixed-setup)/perPair)));
  return {count,estimatedMilliseconds:fixed+(count?setup+count*perPair:0),fixedFits:fixed<=deadline};
}`,
        String.raw`eq(rerankBudget(100,50,10,8,20),{count:5,estimatedMilliseconds:100,fixedFits:true});eq(rerankBudget(60,50,10,8,20),{count:0,estimatedMilliseconds:50,fixedFits:true});assert.equal(rerankBudget(40,50,10,8,20).fixedFits,false);`),
    task('Reranking','Hard','atomic-fallback','Accept a complete rerank pass or fall back without score mixing',
        'Implement a local reranking publication policy for unique authorized original candidate IDs and a scorer envelope. Accept only status=complete, the requested modelVersion, and exactly one finite score per candidate ID. Otherwise return the original retrieval order with reason fallback. Do not combine partial reranker scores with unrelated retrieval scores; limit the final list to k.',
        'Handle partial failures and version mismatches as explicit ranking states.',
        ['Validate nonnegative integer k and unique original IDs.','On a valid complete pass sort by reranker score with original order breaking ties; malformed/partial passes use the complete original order.'],
        [['A timeout returns scores only for a subset','Fallback to retrieval order'],['Complete valid pass from expected scorer version','Use the reranked order']],
        ['Partially scored candidates have no comparable shared score scale.','Production cancellation, deadlines, and authorization refresh are separate orchestration concerns.'],
        'A whole-pass fallback prevents unknown score mixtures after a reranking failure. The original candidates must already be authorized and safe to use. This pure function tests publication policy only and does not simulate live service timing or retries.',
        String.raw`function publishRerank(original,envelope,version,k){
  if(!Number.isSafeInteger(k)||k<0||new Set(original).size!==original.length)throw new Error('Invalid original ranking');
  const fallback=()=>({reason:'fallback',ids:original.slice(0,k)}),scores=new Map();
  if(envelope?.status!=='complete'||envelope.modelVersion!==version||!Array.isArray(envelope.scores)||envelope.scores.length!==original.length)return fallback();
  const allowed=new Set(original);for(const row of envelope.scores){if(!row||!allowed.has(row.id)||scores.has(row.id)||!Number.isFinite(row.score))return fallback();scores.set(row.id,row.score);}
  return {reason:'reranked',ids:original.map((id,index)=>({id,index})).sort((a,b)=>scores.get(b.id)-scores.get(a.id)||a.index-b.index).slice(0,k).map(r=>r.id)};
}`,
        String.raw`eq(publishRerank(['a','b'],{status:'timeout',scores:[{id:'b',score:9}]},'r1',2),{reason:'fallback',ids:['a','b']});eq(publishRerank(['a','b'],{status:'complete',modelVersion:'r1',scores:[{id:'a',score:1},{id:'b',score:2}]},'r1',1),{reason:'reranked',ids:['b']});assert.equal(publishRerank(['a'],{status:'complete',modelVersion:'r2',scores:[{id:'a',score:1}]},'r1',1).reason,'fallback');`),
    task('Reranking','Hard','cross-encoder-study','Evaluate a cross-encoder without hiding candidate or truncation failures',
        'Design a comparison of retrieval-only and cross-encoder-reranked RAG contexts. Include candidate depth, query/passage pair token limits, language/domain slices, permission filtering, and latency under load. A cross-encoder score is not automatically a calibrated relevance probability.',
        'Choose reranking policy from relevance improvements and operational constraints.',
        ['Keep candidate-generation snapshots and relevance judgments fixed when isolating reranker quality.','Measure candidate recall separately from final nDCG/MRR, supported-answer quality, truncation rates, and tail latency.'],
        [['Relevant chunk is absent from candidates','Count an upstream retrieval miss, not a reranker ordering failure'],['The decisive clause is truncated out of the pair input','Record the serialization failure and revise the context policy']],
        ['Reranking cannot recover a passage it never receives.','Evaluate the actual fallback path as well as successful scorer calls.'],
        'Cross-encoders can use joint query-passage interactions but add cost and pair-length constraints. A fair test separates candidate availability from scoring quality and accounts for truncation. Permission-filtered candidates must remain authorized before they reach an external scorer.',
        'Freeze authorized candidate sets from a declared retrieval depth and annotate graded relevance on independent queries. Version the cross-encoder, pair template, tokenization, max lengths, truncation strategy, and score direction. Compare retrieval-only and reranked order using candidate recall, nDCG@k, MRR, evidence diversity, and end-to-end supported answers. Slice by domain/language/length and inspect decisive clauses lost to truncation. Profile batch sizes, concurrency, p95/p99 latency, timeouts, and cost; test whole-pass fallback without mixing score scales. Select candidate depth and final context size on development data, then evaluate a frozen configuration on held-out queries with privacy-approved external integrations.'),
    task('RAG Evaluation','Easy','context-set-metrics','Calculate set-based evidence precision and recall',
        'Given retrieved chunk IDs and gold relevant chunk IDs for one RAG question, calculate setPrecision=unique relevant retrieved/unique retrieved and setRecall=unique relevant retrieved/unique gold. Deduplicate both lists. Return null for an empty denominator separately for each metric. These are unordered set metrics, not a library-specific ranked Context Precision score.',
        'Measure evidence selection with explicit duplicate and empty-set conventions.',
        ['Return hit count plus both distinct-set sizes so denominators are auditable.','Treat an empty gold set as no recall label under this contract, not automatic proof that the question is unanswerable.'],
        [['Retrieved [a,x,x], gold [a,b]','One hit, precision 1/2, recall 1/2'],['No retrieved IDs, gold [a]','Precision null, recall 0']],
        ['Convert to sets before counting hits.','Precision and recall use different denominators.'],
        'Evidence precision describes selected-context purity and recall describes coverage of labeled evidence. Labels and source snapshot must match the retrieval unit. Empty denominators need explicit policies, and these unordered ratios do not reward placing relevant chunks earlier.',
        String.raw`function contextSetMetrics(retrievedIds,goldIds){
  const retrieved=new Set(retrievedIds),gold=new Set(goldIds),hits=[...retrieved].filter(id=>gold.has(id)).length;
  return {hits,retrievedCount:retrieved.size,goldCount:gold.size,setPrecision:retrieved.size?hits/retrieved.size:null,setRecall:gold.size?hits/gold.size:null};
}`,
        String.raw`eq(contextSetMetrics(['a','x','x'],['a','b']),{hits:1,retrievedCount:2,goldCount:2,setPrecision:0.5,setRecall:0.5});const empty=contextSetMetrics([],['a']);assert.equal(empty.setPrecision,null);assert.equal(empty.setRecall,0);assert.equal(contextSetMetrics(['a'],[]).setRecall,null);`),
    task('RAG Evaluation','Easy','claim-support','Compute faithfulness only from completed claim-support judgments',
        'Aggregate externally reviewed atomic answer-claim labels supported, unsupported, or unjudged. Return their counts and faithfulness=supported/total only when all claims are judged and total>0; otherwise return null. A supported claim is entailed by supplied context, which does not prove the context itself is factually correct or that the answer addresses the question.',
        'Keep missing support judgments distinct from unsupported or correct answers.',
        ['Reject unknown labels and do not silently drop unjudged claims.','Return null for no claims rather than declaring an empty answer perfectly faithful.'],
        [['Labels supported,supported,unsupported','Faithfulness 2/3'],['Labels supported,unjudged','Faithfulness null pending judgment']],
        ['The input labels come from a reviewer or separately validated judge.','Faithfulness and external factual correctness are distinct dimensions.'],
        'Claim-support fractions quantify grounding only under a defined claim decomposition and judgment procedure. This local aggregation does not infer semantic entailment from text or simulate an LLM judge. Separate coverage, answer relevance, and truth checks remain necessary.',
        String.raw`function claimSupport(labels){
  const counts={supported:0,unsupported:0,unjudged:0};for(const label of labels){if(!Object.hasOwn(counts,label))throw new Error('Unknown support label');counts[label]++;}
  return {...counts,faithfulness:labels.length&&counts.unjudged===0?counts.supported/labels.length:null};
}`,
        String.raw`assert.equal(claimSupport(['supported','supported','unsupported']).faithfulness,2/3);eq(claimSupport(['supported','unjudged']),{supported:1,unsupported:0,unjudged:1,faithfulness:null});assert.equal(claimSupport([]).faithfulness,null);assert.throws(()=>claimSupport(['correct']));`),
    task('RAG Evaluation','Medium','ranked-context-precision','Reward relevant context appearing earlier in the ranking',
        'Implement ranked context precision for a nonempty list of externally judged boolean relevance flags v_i. Define score=sum_i(precision@i * v_i)/sum_i(v_i), where precision@i is relevant flags through rank i divided by i (one-based). Return zero if none are relevant and null for an empty list. Assume unique context chunks; this denominator counts relevant retrieved chunks, not all gold evidence.',
        'Distinguish rank-sensitive context purity from evidence recall.',
        ['Validate boolean judgments and use the cumulative relevance count at each rank.','Document that missing gold evidence is not directly penalized by this denominator; report recall separately.'],
        [['Flags [true,false,true]','(1+2/3)/2 = 5/6'],['Flags [false,true]','1/2']],
        ['Only relevant ranks contribute a precision term to the numerator.','This is not simply number relevant divided by total retrieved.'],
        'A rank-sensitive context score rewards placing useful evidence early. Different evaluation libraries use different judgments and aggregation conventions, so reproduce the exact formula and report the label source. This exercise calculates supplied labels only, without pretending to judge passage relevance automatically.',
        String.raw`function rankedContextPrecision(flags){
  if(!flags.every(v=>typeof v==='boolean'))throw new Error('Invalid relevance judgments');if(!flags.length)return null;
  let relevant=0,total=0;flags.forEach((flag,index)=>{if(flag){relevant++;total+=relevant/(index+1);}});return relevant?total/relevant:0;
}`,
        String.raw`assert.ok(Math.abs(rankedContextPrecision([true,false,true])-5/6)<1e-12);assert.equal(rankedContextPrecision([false,true]),0.5);assert.equal(rankedContextPrecision([false,false]),0);assert.equal(rankedContextPrecision([]),null);assert.throws(()=>rankedContextPrecision([1]));`),
    task('RAG Evaluation','Medium','fact-recall-aggregation','Compare macro and micro coverage of required evidence facts',
        'Each evaluated RAG case has requiredFactIds and contextFactIds supplied by adjudicated source mapping. Compute per-case recall over unique required facts, macro recall (mean of eligible case recalls), and micro recall (total recovered required facts/total required facts across eligible cases). Skip cases with no required labels and report skipped count. Duplicate fact IDs or overlapping chunks cannot inflate coverage.',
        'Make aggregation weighting and evidence granularity explicit.',
        ['Deduplicate facts per case and count each required fact once, even if several chunks contain it.','Return null aggregate recalls when no case is eligible and report evaluated/skipped counts.'],
        [['Case 1 recovers 1/1 facts; case 2 recovers 0/3','Macro 0.5, micro 0.25'],['Every case lacks required labels','Null recalls with all cases skipped']],
        ['Macro weights questions equally; micro weights required facts equally.','This metric measures supplied-context fact coverage, not generated-answer correctness.'],
        'Aggregation can change conclusions when questions require different amounts of evidence. Fact-level labels make chunking variants comparable and prevent overlap duplicates from earning extra credit. A no-label case is not necessarily a truly unanswerable question and must be tracked separately.',
        String.raw`function factRecall(cases){
  let evaluatedCount=0,skippedCount=0,macroSum=0,recovered=0,required=0;
  for(const c of cases){const gold=new Set(c.requiredFactIds),found=new Set(c.contextFactIds);if(!gold.size){skippedCount++;continue;}const hits=[...gold].filter(id=>found.has(id)).length;evaluatedCount++;macroSum+=hits/gold.size;recovered+=hits;required+=gold.size;}
  return {macroRecall:evaluatedCount?macroSum/evaluatedCount:null,microRecall:required?recovered/required:null,evaluatedCount,skippedCount};
}`,
        String.raw`eq(factRecall([{requiredFactIds:['a'],contextFactIds:['a','a']},{requiredFactIds:['b','c','d'],contextFactIds:[]}]),{macroRecall:0.5,microRecall:0.25,evaluatedCount:2,skippedCount:0});eq(factRecall([{requiredFactIds:[],contextFactIds:[]}]),{macroRecall:null,microRecall:null,evaluatedCount:0,skippedCount:1});`),
    task('RAG Evaluation','Hard','end-to-end-review','Build an auditable RAG evaluation that separates failure stages',
        'Design an evaluation for a RAG assistant answering from private changing documents. Include retrieval misses, poorly ranked context, unsupported generated claims, irrelevant but faithful answers, outdated evidence, unanswerable questions, and access-control failures. Define metrics and their annotation sources rather than relying on one opaque overall score.',
        'Evaluate evidence selection, answer use, usefulness, and authorization as separate properties.',
        ['Declare metric units, denominators, missing-label policies, judge procedures, and source revisions.','Use independent development/test source groups, paired comparisons, human calibration of automated judges, and explicit release gates.'],
        [['Answer repeats context accurately but never answers the question','High faithfulness can coexist with low answer relevance'],['Correct answer comes from another tenant’s document','Fail authorization regardless of answer quality']],
        ['An automatic judge’s score is evidence with error, not ground truth by definition.','Use source/fact labels so changing chunk boundaries does not make old labels meaningless.'],
        'RAG combines retrieval, context selection, and generation under access constraints. A fluent or faithful answer can still be irrelevant, stale, or unauthorized. The evaluation must localize stage failures and audit both supported answers and appropriate abstention.',
        'Version source snapshots, permissions, queries, expected facts, and answerability labels; split independent document/entity groups before tuning. Measure geometric ANN recall against exact filtered neighbors separately from labeled evidence/fact recall and ranked context precision, stating formulas and empty-label handling. Decompose generated answers into claims for context entailment/faithfulness, verify external correctness and citation support, and score answer relevance against a question-specific rubric with complete/partial/off-topic outcomes. Include stale/conflicting documents, no-evidence questions, malicious source instructions, and cross-tenant probes with zero permitted unauthorized disclosures. Calibrate any LLM judge against blinded human labels, track agreement and uncertain cases, and disclose sampling/model versions. Report paired quality, abstention, privacy, latency, and cost slices with uncertainty; freeze on development results and evaluate once on held-out data before a monitored rollout.'),
];
