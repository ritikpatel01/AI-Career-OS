// Python 3 reference programs with executable acceptance checks. The browser
// workspace remains a manual editor; the test suite runs these in Python.
const exercise=(topic,difficulty,slug,title,prompt,objective,requirements,cases,hints,explanation,code,checks)=>({
    id:`ai-python-${slug}-v1`,career:'AI Engineer',phase:'Python',topic,title,difficulty,kind:'coding',language:'Python',
    estimatedTime:difficulty==='Easy'?'20–30 minutes':difficulty==='Medium'?'35–50 minutes':'50–80 minutes',
    problemStatement:prompt,simplerProblem:objective,learningObjectives:[objective,`Test the stated ${topic} boundary without changing caller-owned data.`],
    prerequisites:['Python values, expressions, and basic function calls'],conceptsToReview:[topic],requirements,
    examples:cases.map(([input,output])=>({input,output,explanation})),tests:cases.map(([input,expected],i)=>({name:`Acceptance case ${i+1}`,input,expected})),
    hints,approach:explanation,walkthrough:cases.map(([input,output])=>`${input} → ${output}`).join('\n') + '\n' + explanation,
    solutionCode:code,solutionLines:[explanation,...hints],completionCriteria:requirements,commonMistakes:[],
    starterCode:'# Implement the specified contract and run the acceptance cases.\n',
    followUp:`Extend the ${topic} solution with a documented additional boundary and a failing test before changing the implementation.`,
    referenceChecks:checks
});

export const AI_PYTHON_PRACTICE=[
    exercise('Python Fundamentals','Easy','positive-total','Sum only positive integer readings',
        'Implement positive_total(values) for a list of integers representing signed sensor changes. Return the sum of strictly positive readings, excluding zero and negatives. Do not mutate the list, and return zero for empty input.',
        'Use a conditional expression while reducing a collection.',
        ['Input is a list of integers; zero is not positive.','Preserve input and return an integer total.'],
        [['[-2,0,4,7]','11'],['[]','0']],['Compare each value with zero before including it.','sum accepts an iterable, so a generator avoids an intermediate list.'],
        'A generator filters values using a strict comparison. sum starts from zero, giving an empty sequence a valid identity result.',
        String.raw`def positive_total(values):
    return sum(value for value in values if value > 0)`,
        String.raw`a = [-2, 0, 4, 7]
assert positive_total(a) == 11 and a == [-2, 0, 4, 7]
assert positive_total([]) == 0
assert positive_total([-1, 0]) == 0`),
    exercise('Python Fundamentals','Easy','word-count','Count case-insensitive whitespace tokens',
        'Implement word_counts(text), counting whitespace-separated tokens after Unicode casefold normalization. Keep punctuation as part of a token under this contract. Return a dictionary and handle blank text without inventing an empty-word key.',
        'Build a dictionary with a clear tokenization and normalization policy.',
        ['Use split without an explicit separator to collapse whitespace.','Use casefold and preserve punctuation.'],
        [['Cat cat DOG','{"cat":2,"dog":1}'],['blank whitespace','{}']],['State token boundaries before normalizing.','dict.get supplies the initial zero for a new key.'],
        'Whitespace splitting omits empty pieces, while casefold normalizes token case. Incrementing dictionary counts does not require sorting or modifying the original text.',
        String.raw`def word_counts(text):
    counts = {}
    for word in text.split():
        key = word.casefold()
        counts[key] = counts.get(key, 0) + 1
    return counts`,
        String.raw`assert word_counts('Cat cat DOG') == {'cat': 2, 'dog': 1}
assert word_counts(' \t\n') == {}
assert word_counts('Hi! hi') == {'hi!': 1, 'hi': 1}`),
    exercise('Python Fundamentals','Easy','parse-rows','Report invalid integer strings by position',
        'Implement parse_integers(rows) for a list of strings. Convert each using Python int semantics, collecting accepted values and zero-based invalid positions. Catch conversion failures locally so one bad row does not discard other valid rows.',
        'Separate conversion errors from successful data in a batch.',
        ['Return (values,invalid_indices) in input order.','Catch ValueError for these string inputs; do not catch every programming exception.'],
        [["['3','bad',' -2 ']","([3,-2],[1])"],["['1.5','']","([],[0,1])"]],['Use enumerate to retain provenance.','Keep the try block around only the conversion that may fail.'],
        'Local exception handling preserves valid neighbors and gives rejected rows an explicit position. int accepts surrounding whitespace and signs but not decimal fractions.',
        String.raw`def parse_integers(rows):
    values, invalid = [], []
    for index, raw in enumerate(rows):
        try:
            value = int(raw)
        except ValueError:
            invalid.append(index)
        else:
            values.append(value)
    return values, invalid`,
        String.raw`assert parse_integers(['3','bad',' -2 ']) == ([3,-2],[1])
assert parse_integers(['1.5','']) == ([],[0,1])
assert parse_integers([]) == ([],[])`),
    exercise('Python Fundamentals','Medium','dedup-records','Retain the latest record while preserving first-seen ID order',
        'Implement latest_records(rows) for dictionaries with hashable string id fields. Later records replace earlier records sharing an ID, but output IDs remain in first-seen order. Copy the top-level output dictionaries so editing output fields does not change input rows.',
        'Use ordered dictionary replacement and explicit copy ownership.',
        ['Keep first-seen ID order and last record contents.','Make shallow dictionary copies; nested objects remain shared by the documented contract.'],
        [["a:1,b:2,a:3","a:3,b:2"],['empty rows','[]']],['Updating an existing dict key does not move it.','dict(row) creates a shallow copy rather than a deep clone.'],
        'A mapping separates ordering from replacement. Copying each winning record prevents top-level output edits from mutating the input while keeping the shallow-copy limit explicit.',
        String.raw`def latest_records(rows):
    latest = {}
    for row in rows:
        latest[row['id']] = dict(row)
    return list(latest.values())`,
        String.raw`rows = [{'id':'a','v':1},{'id':'b','v':2},{'id':'a','v':3}]
out = latest_records(rows)
assert out == [{'id':'a','v':3},{'id':'b','v':2}]
out[0]['v'] = 9
assert rows[2]['v'] == 3
assert latest_records([]) == []`),
    exercise('Python Fundamentals','Medium','nested-copy','Repair aliased rows in a matrix constructor',
        'Implement zero_matrix(rows,cols) returning independent rows of integer zeros. Reject dimensions that are negative or not exact ints, including booleans. Explain why [[0]*cols]*rows is incorrect when one cell is later assigned.',
        'Distinguish repeated references from independent nested objects.',
        ['Validate dimensions and allow zero-sized dimensions.','Assigning one row cell must not alter another row.'],
        [['zero_matrix(2,2); set [0][0]=5','[[5,0],[0,0]]'],['zero_matrix(0,3)','[]']],['Outer list multiplication repeats references.','Create each row inside a comprehension.'],
        'The comprehension evaluates the inner list expression separately for each row. Exact int checks keep True from silently becoming dimension one.',
        String.raw`def zero_matrix(rows, cols):
    if type(rows) is not int or type(cols) is not int or rows < 0 or cols < 0:
        raise ValueError('Invalid dimensions')
    return [[0] * cols for _ in range(rows)]`,
        String.raw`m = zero_matrix(2,2)
m[0][0] = 5
assert m == [[5,0],[0,0]]
assert zero_matrix(0,3) == [] and zero_matrix(2,0) == [[],[]]
for dims in [(-1,2),(True,2),(2,1.5)]:
    try: zero_matrix(*dims)
    except ValueError: pass
    else: raise AssertionError('dimensions accepted')`),
    exercise('Python Fundamentals','Medium','inventory','Apply an all-or-nothing in-memory stock deduction',
        'Implement reserve(stock,requests) for nonnegative integer stock counts and positive integer requested quantities keyed by SKU. Validate all requests before returning a new stock dictionary. Reject unknown SKUs and insufficient stock without partially mutating the caller dictionary.',
        'Separate batch validation from applying state changes.',
        ['Validate exact positive integer request amounts, rejecting booleans.','Return a new dictionary only after every request passes.'],
        [["stock={a:3,b:1}, request={a:2}","{a:1,b:1}"],['request includes unavailable b:2','ValueError and unchanged stock']],['Check every precondition before subtraction.','Copying after validation avoids partial writes on rejected batches.'],
        'The two-pass function checks the complete batch before applying any change. This protects one in-memory call; it is not a concurrency-safe database reservation protocol.',
        String.raw`def reserve(stock, requests):
    for sku, quantity in requests.items():
        if type(quantity) is not int or quantity <= 0 or sku not in stock or stock[sku] < quantity:
            raise ValueError('Unavailable request')
    result = dict(stock)
    for sku, quantity in requests.items():
        result[sku] -= quantity
    return result`,
        String.raw`s = {'a':3,'b':1}
assert reserve(s,{'a':2}) == {'a':1,'b':1} and s == {'a':3,'b':1}
for request in [{'a':1,'b':2},{'z':1},{'a':True}]:
    try: reserve(s,request)
    except ValueError: pass
    else: raise AssertionError('invalid stock accepted')
assert s == {'a':3,'b':1}`),
    exercise('Python Fundamentals','Hard','csv-validation','Parse a CSV with explicit row diagnostics',
        'Implement read_scores(text) for CSV columns name,score in that exact order. Require a nonblank trimmed name and integer score from 0 through 100. Return accepted records and rejected logical row numbers starting at two; reject a wrong header. Quoted names containing commas must remain intact.',
        'Combine format-aware parsing with schema and value validation.',
        ['Use csv.reader rather than splitting lines at commas.','Reject wrong-width rows and collect row diagnostics without losing valid neighbors.'],
        [['name,score followed by "Doe, Ari",90','One accepted name Doe, Ari with score 90.'],['A valid header then empty name or score 101','Rejected logical data row numbers are reported.']],['Let the CSV parser handle quoting first.','Check row width before unpacking or converting.'],
        'CSV framing and schema validation are separate steps. Enumerating parsed records reports logical row positions, which may differ from physical lines for multiline quoted fields.',
        String.raw`import csv
import io

def read_scores(text):
    reader = csv.reader(io.StringIO(text))
    if next(reader, None) != ['name', 'score']:
        raise ValueError('Invalid header')
    accepted, rejected = [], []
    for number, row in enumerate(reader, 2):
        try:
            if len(row) != 2 or not row[0].strip():
                raise ValueError('Invalid row')
            score = int(row[1])
            if not 0 <= score <= 100:
                raise ValueError('Invalid score')
        except ValueError:
            rejected.append(number)
        else:
            accepted.append({'name':row[0].strip(), 'score':score})
    return accepted, rejected`,
        String.raw`assert read_scores('name,score\n"Doe, Ari",90\n,1\nBo,101\nCy,0\n') == ([{'name':'Doe, Ari','score':90},{'name':'Cy','score':0}],[3,4])
assert read_scores('name,score\n') == ([],[])
try: read_scores('score,name\n1,A')
except ValueError: pass
else: raise AssertionError('header accepted')`),
    exercise('Python Fundamentals','Hard','deep-merge','Merge nested JSON-style settings without mutating either input',
        'Implement merge_settings(base,override) for acyclic JSON-style dictionaries. Recursively merge only when both values are dictionaries; otherwise replace using the override value. Lists are replaced, not concatenated. Return fully independent nested containers.',
        'Define recursive merge semantics and copy ownership explicitly.',
        ['Override scalar/list/type conflicts with a deep copy.','Preserve missing base keys and do not share nested mutable state with either input.'],
        [["base={x:{a:1,b:2}}, override={x:{b:3}}","{x:{a:1,b:3}}"],['base list [1], override list [2]','Result list [2], independently copied.']],['Recurse only for two dictionary values.','deepcopy is appropriate for the stated acyclic JSON data domain.'],
        'Copy the base tree, then recursively resolve matching dictionary nodes. Every replacement is copied too, so editing a nested result cannot change the caller settings.',
        String.raw`from copy import deepcopy

def merge_settings(base, override):
    result = deepcopy(base)
    for key, value in override.items():
        if isinstance(value, dict) and isinstance(result.get(key), dict):
            result[key] = merge_settings(result[key], value)
        else:
            result[key] = deepcopy(value)
    return result`,
        String.raw`a={'x':{'a':1,'b':2},'items':[1]}; b={'x':{'b':3},'items':[2]}
r=merge_settings(a,b)
assert r == {'x':{'a':1,'b':3},'items':[2]}
r['items'].append(9); r['x']['a']=8
assert a == {'x':{'a':1,'b':2},'items':[1]} and b['items']==[2]
assert merge_settings({'x':1},{'x':{'a':2}})=={'x':{'a':2}}`),
    exercise('Python Fundamentals','Hard','top-k','Rank the top k labels with deterministic ties',
        'Implement top_labels(counts,k), selecting at most k labels ranked by count descending and label ascending on ties. counts maps strings to nonnegative integers; reject non-int or negative k. Use a heap-based selection to avoid sorting every label when k is small.',
        'Combine a total ranking key with bounded top-k selection.',
        ['Return labels only and allow k=0 or k larger than the collection.','Use a deterministic tie-break key and leave counts unchanged.'],
        [["{b:5,a:5,c:2}, k=2","[a,b]"],['k=0 or empty dictionary','[]']],['The best rank can be expressed as (-count,label).','heapq.nsmallest selects the smallest ranking keys.'],
        'A tuple key gives high counts priority and resolves ties lexically. nsmallest uses a bounded selection strategy for small k, with implementation-dependent optimization when selecting all items.',
        String.raw`import heapq

def top_labels(counts, k):
    if type(k) is not int or k < 0:
        raise ValueError('Invalid k')
    return heapq.nsmallest(k, counts, key=lambda label: (-counts[label], label))`,
        String.raw`c={'b':5,'a':5,'c':2}
assert top_labels(c,2)==['a','b'] and top_labels(c,9)==['a','b','c']
assert top_labels(c,0)==[] and top_labels({},2)==[]
for k in [-1,True,1.5]:
    try: top_labels(c,k)
    except ValueError: pass
    else: raise AssertionError('invalid k accepted')`),

    exercise('Functions','Easy','keyword-total','Make discounts keyword-only and return the result',
        'Implement invoice_total(price,quantity,*,discount=0) for nonnegative numeric price/quantity and discount between zero and one. Reject invalid ranges, and make discount keyword-only so a third positional argument is a TypeError. Return the numeric total instead of printing it.',
        'Use a keyword-only parameter to make an optional policy explicit.',
        ['Return price*quantity*(1-discount).','Reject negative inputs and discount outside [0,1]; inputs are finite real numbers by contract.'],
        [['invoice_total(10,2,discount=0.25)','15.0'],['invoice_total(10,2,0.25)','TypeError']],['A star introduces keyword-only parameters.','Validation belongs before calculating the valid-domain result.'],
        'The signature enforces call structure independently of range validation. Returning the computed value lets a caller test or format it without capturing console output.',
        String.raw`def invoice_total(price, quantity, *, discount=0):
    if price < 0 or quantity < 0 or not 0 <= discount <= 1:
        raise ValueError('Invalid invoice')
    return price * quantity * (1 - discount)`,
        String.raw`assert invoice_total(10,2,discount=0.25)==15
assert invoice_total(10,0)==0
try: invoice_total(10,2,0.25)
except TypeError: pass
else: raise AssertionError('positional discount accepted')
try: invoice_total(10,1,discount=2)
except ValueError: pass
else: raise AssertionError('invalid discount')`),
    exercise('Functions','Easy','fresh-default','Return a new tag list on each omitted argument',
        'Repair a Functions helper that uses tags=[] as its default. Implement add_tag(tag,tags=None) returning a new list with the tag appended. Never mutate a supplied list, and ensure independent omitted-argument calls do not accumulate previous tags.',
        'Avoid shared mutable defaults and implicit caller mutation.',
        ['Use None to signal omission.','Copy an explicitly supplied list before appending.'],
        [["add_tag('a'); add_tag('b')","['a'] then ['b']"],["tags=['x']; add_tag('y',tags)","['x','y'], original ['x']"]],['Default expressions are evaluated at definition time.','A sentinel does not by itself prevent mutation of an explicitly passed list.'],
        'Build a fresh result for both paths. This controls default-state sharing and input ownership as separate concerns; list copying is shallow under the tag-string contract.',
        String.raw`def add_tag(tag, tags=None):
    result = [] if tags is None else list(tags)
    result.append(tag)
    return result`,
        String.raw`assert add_tag('a')==['a'] and add_tag('b')==['b']
a=['x']; assert add_tag('y',a)==['x','y'] and a==['x']
assert add_tag('z',[])==['z']`),
    exercise('Functions','Easy','explicit-scope','Replace a mutable global tax rate with an explicit input',
        'A Functions calculation reads a mutable module-level tax rate, so tests affect one another. Implement taxed(amount,rate) with explicit finite nonnegative numeric inputs. Return the amount including tax and demonstrate independent calls using different rates.',
        'Make function dependencies visible and independently testable.',
        ['Do not read or update module globals.','Reject negative amount/rate; use approximate comparisons for float results.'],
        [['taxed(100,0.1)','Approximately 110'],['taxed(100,0.2)','120, independent of the earlier call']],['Parameters name dependencies that a caller controls.','Floating-point arithmetic should be checked with an appropriate tolerance.'],
        'Explicit input removes hidden ordering between tests and callers. The function has no mutable shared state; approximate float tests express the numeric contract without pretending binary fractions are exact decimal money.',
        String.raw`def taxed(amount, rate):
    if amount < 0 or rate < 0:
        raise ValueError('Negative input')
    return amount * (1 + rate)`,
        String.raw`import math
assert math.isclose(taxed(100,0.1),110)
assert taxed(100,0.2)==120 and taxed(0,0.5)==0
try: taxed(-1,0.2)
except ValueError: pass
else: raise AssertionError('negative accepted')`),
    exercise('Functions','Medium','closure-counter','Create independent stateful closures',
        'Implement make_counter(start=0), returning a zero-argument function that increments and returns its own private counter. Two returned functions must not share state. Explain why updating the enclosing binding requires nonlocal.',
        'Use closures with intentional enclosing-scope mutation.',
        ['Increment before returning the new value.','Keep each factory invocation independent.'],
        [['counter from start=3, called twice','4 then 5'],['two counters from zero','Each starts by returning 1']],['The factory call creates a new enclosing scope.','nonlocal refers to that enclosing binding rather than a new local variable.'],
        'The nested function retains its factory invocation’s state. nonlocal permits rebinding count; a global would instead couple all created counters. This simple counter has no cross-thread atomicity guarantee.',
        String.raw`def make_counter(start=0):
    count = start
    def increment():
        nonlocal count
        count += 1
        return count
    return increment`,
        String.raw`a=make_counter(3); b=make_counter()
assert a()==4 and a()==5 and b()==1 and b()==2
assert make_counter()()==1`),
    exercise('Functions','Medium','decorator-count','Count calls while preserving function metadata and errors',
        'Implement counted(fn), a decorator whose wrapper.calls counts every attempted invocation including failures. Forward positional/keyword arguments, preserve __name__ and __wrapped__, and let the original return value or exception propagate unchanged.',
        'Write a transparent decorator with observable state.',
        ['Use functools.wraps and increment before invocation.','Do not swallow exceptions or alter the result.'],
        [['Decorated add(2,b=3)','Returns 5 and calls becomes 1.'],['A decorated function raises ValueError','The same exception propagates and the attempted call is counted.']],['wraps handles metadata but not argument forwarding.','Counting before the call includes exceptions without a broad catch.'],
        'A wrapper can add one measured concern while delegating semantics. Its mutable calls attribute belongs to that wrapper; this exercise does not promise a synchronized counter for concurrent execution.',
        String.raw`from functools import wraps

def counted(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        wrapper.calls += 1
        return fn(*args, **kwargs)
    wrapper.calls = 0
    return wrapper`,
        String.raw`@counted
def add(a,b=1): return a+b
assert add(2,b=3)==5 and add.calls==1 and add.__name__=='add'
assert add.__wrapped__(1,2)==3
error=ValueError('bad')
@counted
def fail(): raise error
try: fail()
except ValueError as e: assert e is error
else: raise AssertionError('exception swallowed')
assert fail.calls==1`),
    exercise('Functions','Medium','lazy-chunks','Yield bounded chunks from a one-pass iterable',
        'Implement chunks(values,size), a generator accepting a one-pass iterable and exact positive integer size. Yield lists of at most size items, preserve order, and emit a short final list without eagerly materializing the whole input.',
        'Use lazy iteration and validate a generator contract.',
        ['Reject zero, negative, bool, and non-int sizes when iteration begins.','Empty input yields no chunks; consume only enough for each requested chunk.'],
        [['range(5), size=2','[[0,1],[2,3],[4]]'],['empty iterable','[]']],['A generator body starts on iteration, not construction.','islice can consume the next bounded slice of an iterator.'],
        'One iterator preserves one-pass input semantics. Each islice produces only the next chunk, so consumer demand controls further input reads and memory is bounded by the chunk size.',
        String.raw`from itertools import islice

def chunks(values, size):
    if type(size) is not int or size < 1:
        raise ValueError('Invalid size')
    iterator = iter(values)
    while True:
        block = list(islice(iterator, size))
        if not block:
            return
        yield block`,
        String.raw`assert list(chunks(range(5),2))==[[0,1],[2,3],[4]]
assert list(chunks([],2))==[]
seen=[]
def source():
    for x in range(10):
        seen.append(x); yield x
g=chunks(source(),2); assert next(g)==[0,1] and seen==[0,1]
try: list(chunks([1],0))
except ValueError: pass
else: raise AssertionError('zero size')`),
    exercise('Functions','Hard','retry-decorator','Retry only an explicit transient failure class',
        'Implement retry_transient(attempts,sleep), a decorator for idempotent synchronous functions. Retry only TransientError, wait with injected sleep for 1,2,4... seconds between attempts, preserve metadata/arguments, and re-raise the last failure after the exact positive attempt limit.',
        'Separate retry policy from timing and business-function semantics.',
        ['Validate attempts as an exact positive int.','Never retry other exception classes; do not sleep after the final failure.'],
        [['Two transient failures then success with attempts=3','Three calls, sleeps [1,2], returned success.'],['ValueError on the first call','One call, no retry or sleep.']],['Use an exception-specific catch and a final-attempt branch.','Injected sleep makes retry schedules testable without waiting.'],
        'The wrapper retries only the declared failure class and keeps timing outside the business function. Such retries are safe only for the stated idempotent operations; a timeout after an uncertain write requires a separate reconciliation contract.',
        String.raw`from functools import wraps

class TransientError(Exception):
    pass

def retry_transient(attempts, sleep):
    if type(attempts) is not int or attempts < 1:
        raise ValueError('Invalid attempts')
    def decorate(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            for index in range(attempts):
                try:
                    return fn(*args, **kwargs)
                except TransientError:
                    if index == attempts - 1:
                        raise
                    sleep(2 ** index)
        return wrapper
    return decorate`,
        String.raw`waits=[]; calls=[]
@retry_transient(3,waits.append)
def fetch(x):
    calls.append(x)
    if len(calls)<3: raise TransientError('later')
    return x*2
assert fetch(4)==8 and waits==[1,2] and calls==[4,4,4]
assert fetch.__name__=='fetch'
waits.clear()
@retry_transient(2,waits.append)
def bad(): raise ValueError('terminal')
try: bad()
except ValueError: pass
else: raise AssertionError('lost error')
assert waits==[]
@retry_transient(2,waits.append)
def offline(): raise TransientError('offline')
try: offline()
except TransientError: pass
else: raise AssertionError('lost final failure')
assert waits==[1]`),
    exercise('Functions','Hard','bounded-memo','Add bounded memoization to a pure function',
        'Implement memoized(maxsize), decorating pure functions with hashable arguments through functools.lru_cache. Require a positive exact integer capacity, preserve metadata, and expose cache_info/cache_clear so tests can observe hits and evictions. Do not cache side-effecting operations under this contract.',
        'Use a bounded standard-library cache with an explicit validity contract.',
        ['Reject invalid maxsize and support normal keyword arguments.','Cache successful results and preserve original exceptions; document that concurrent duplicate computation may still occur.'],
        [['Repeat the same pure call','A cache hit avoids another function execution.'],['More distinct keys than capacity','Old entries may be evicted and recomputed.']],['The standard cache already provides bookkeeping and clear methods.','A coherent cache is not a guarantee of call-once computation across threads.'],
        'Delegating to lru_cache avoids reinventing key and eviction mechanics. Correctness still depends on pure stable results and hashable inputs; the cache is not a persistent or cross-process deduplication service.',
        String.raw`from functools import lru_cache

def memoized(maxsize):
    if type(maxsize) is not int or maxsize < 1:
        raise ValueError('Invalid capacity')
    return lru_cache(maxsize=maxsize)`,
        String.raw`calls=[]
@memoized(2)
def square(x):
    calls.append(x); return x*x
assert square(2)==4 and square(2)==4 and calls==[2]
assert square.cache_info().hits==1 and square.__name__=='square'
square(3); square(4); square(2)
assert calls==[2,3,4,2]
square.cache_clear(); assert square.cache_info().currsize==0
try: memoized(True)
except ValueError: pass
else: raise AssertionError('bool capacity')`),
    exercise('Functions','Hard','pipeline-cause','Compose named transformations with preserved exception causes',
        'Implement run_pipeline(value,stages), where stages is a sequence of (name,callable) pairs. Pass each result into the next. If a stage raises an Exception, raise StageError naming that stage and retain the original error as __cause__; do not execute later stages.',
        'Add actionable error context without hiding the original failure.',
        ['Preserve stage order and return input unchanged for no stages.','Catch Exception rather than BaseException and chain failures with raise from.'],
        [['stages add 1 then double, initial 2','6'],['second stage fails','StageError names it, preserves cause, and third stage does not run.']],['Track the stage name with the callable.','Exception chaining keeps the traceback relationship inspectable.'],
        'Explicit pipeline composition keeps data dependencies visible. Wrapping at the stage boundary adds context while preserving the root error; process-control exceptions are not converted into ordinary stage failures.',
        String.raw`class StageError(Exception):
    pass

def run_pipeline(value, stages):
    for name, transform in stages:
        try:
            value = transform(value)
        except Exception as error:
            raise StageError(f'Stage failed: {name}') from error
    return value`,
        String.raw`assert run_pipeline(2,[('add',lambda x:x+1),('double',lambda x:x*2)])==6
assert run_pipeline('x',[])=='x'
seen=[]; root=ValueError('bad')
def broken(x): raise root
try: run_pipeline(1,[('parse',broken),('later',lambda x:seen.append(x))])
except StageError as e: assert 'parse' in str(e) and e.__cause__ is root
else: raise AssertionError('missing failure')
assert seen==[]`),

    exercise('OOP','Easy','ticket','Model an idempotently closable support ticket',
        'Implement a Ticket class with a required trimmed nonblank title, initial status open, and a close method. A second close should leave it closed. Each instance owns its own state, and invalid title input must fail at construction.',
        'Keep an object initialization rule and transition in one interface.',
        ['Require a string title with nonempty trimmed content.','Expose status through a read-only property and close idempotently.'],
        [["Ticket(' Login ')","title Login, status open"],['close twice','status remains closed']],['Initialize instance state in __init__.','Use a property without a setter for the public status API.'],
        'Construction establishes the title invariant and close owns the state transition. An underscore marks internal convention in Python, not a security boundary against hostile introspection.',
        String.raw`class Ticket:
    def __init__(self, title):
        if not isinstance(title, str) or not title.strip():
            raise ValueError('Title required')
        self.title = title.strip()
        self._status = 'open'
    @property
    def status(self):
        return self._status
    def close(self):
        self._status = 'closed'`,
        String.raw`a=Ticket(' Login '); b=Ticket('Other')
assert a.title=='Login' and a.status=='open'
a.close(); a.close(); assert a.status=='closed' and b.status=='open'
try: Ticket('  ')
except ValueError: pass
else: raise AssertionError('blank title')
try: a.status='open'
except AttributeError: pass
else: raise AssertionError('public setter')`),
    exercise('OOP','Easy','inventory-item','Protect quantity through stock methods',
        'Implement Inventory(quantity) for exact nonnegative integer initial stock. receive(n) and take(n) accept exact positive integers, reject booleans, and never allow negative inventory. A failed operation must leave quantity unchanged.',
        'Maintain a quantity invariant across methods.',
        ['Validate construction and every method input.','Expose quantity as a read-only property.'],
        [['Inventory(4); take(2); receive(3)','quantity 5'],['take more than available','ValueError and unchanged quantity']],['Validate before mutation.','Reuse the same positive-count validation for both methods.'],
        'A narrow method API centralizes stock validation. These local invariants do not replace an atomic database reservation when several processes change shared inventory.',
        String.raw`class Inventory:
    def __init__(self, quantity):
        if type(quantity) is not int or quantity < 0:
            raise ValueError('Invalid stock')
        self._quantity = quantity
    @property
    def quantity(self): return self._quantity
    def _count(self, n):
        if type(n) is not int or n < 1:
            raise ValueError('Invalid count')
    def receive(self, n):
        self._count(n)
        self._quantity += n
    def take(self, n):
        self._count(n)
        if n > self._quantity:
            raise ValueError('Insufficient stock')
        self._quantity -= n`,
        String.raw`s=Inventory(4); s.take(2); s.receive(3); assert s.quantity==5
for n in [6,True,0]:
    try: s.take(n)
    except ValueError: pass
    else: raise AssertionError('bad withdrawal')
assert s.quantity==5`),
    exercise('OOP','Easy','immutable-money','Represent money as a frozen integer-cent value',
        'Create a frozen Money dataclass containing exact nonnegative integer cents and an uppercase three-letter currency code. Provide plus(other) returning a new Money only for matching currencies. Reject booleans and invalid currency syntax.',
        'Use immutable value objects to avoid accidental shared-state changes.',
        ['Validate values in __post_init__.','Addition returns a new object and rejects mismatched currencies.'],
        [["Money(100,'USD').plus(Money(250,'USD'))","Money with 350 USD cents"],['USD plus EUR','ValueError']],['Frozen dataclasses prevent ordinary attribute reassignment.','Validate the combined domain rather than allowing arbitrary strings.'],
        'Integer cents avoid fractional-cent arithmetic for this contract, while a currency tag prevents mixing unrelated units. The object is an immutable value through its public dataclass interface.',
        String.raw`from dataclasses import dataclass
import re

@dataclass(frozen=True)
class Money:
    cents: int
    currency: str
    def __post_init__(self):
        if type(self.cents) is not int or self.cents < 0 or not isinstance(self.currency,str) or re.fullmatch(r'[A-Z]{3}',self.currency) is None:
            raise ValueError('Invalid money')
    def plus(self, other):
        if self.currency != other.currency:
            raise ValueError('Currency mismatch')
        return Money(self.cents + other.cents, self.currency)`,
        String.raw`a=Money(100,'USD'); b=a.plus(Money(250,'USD')); assert b==Money(350,'USD') and a.cents==100
for args in [(True,'USD'),(-1,'USD'),(1,'usd')]:
    try: Money(*args)
    except ValueError: pass
    else: raise AssertionError('invalid money')
try: a.plus(Money(1,'EUR'))
except ValueError: pass
else: raise AssertionError('mixed currencies')`),
    exercise('OOP','Medium','composition','Inject a notification sender rather than hard-coding a channel',
        'Implement Notifier(sender), whose notify(recipient,text) delegates to sender.send and returns its result. Validate nonblank text before delegation, normalize surrounding whitespace, and propagate adapter failures. Use a fake sender to prove the class needs no network or subclass for tests.',
        'Compose behavior through a small collaborator contract.',
        ['Call the injected sender once with normalized text.','Reject invalid text without sending and propagate send failures.'],
        [["notify('u1',' Hello ')","sender receives ('u1','Hello')"],['sender raises OSError','The failure propagates rather than reporting sent.']],['Depend on the send behavior, not a concrete email constructor.','Record adapter calls in a fake to verify delegation.'],
        'Composition separates notification policy from transport. The service owns input preparation while the adapter owns delivery and its observable success/failure contract.',
        String.raw`class Notifier:
    def __init__(self, sender):
        self.sender = sender
    def notify(self, recipient, text):
        if not isinstance(text,str) or not text.strip():
            raise ValueError('Text required')
        return self.sender.send(recipient,text.strip())`,
        String.raw`class Fake:
    def __init__(self): self.calls=[]
    def send(self,to,text): self.calls.append((to,text)); return 'queued'
f=Fake(); n=Notifier(f)
assert n.notify('u1',' Hello ')=='queued' and f.calls==[('u1','Hello')]
try: n.notify('u1',' ')
except ValueError: pass
else: raise AssertionError('empty sent')
assert len(f.calls)==1
class Broken:
    def send(self,*args): raise OSError('offline')
try: Notifier(Broken()).notify('u1','Hi')
except OSError: pass
else: raise AssertionError('failure hidden')`),
    exercise('OOP','Medium','polymorphism','Compute areas through a shared abstract interface',
        'Define an abstract Shape.area() contract and Rectangle and Circle implementations for finite nonnegative numeric dimensions. total_area(shapes) must call area polymorphically, without checking concrete class names or introducing unsupported methods on a base class.',
        'Use inheritance for a substitutable behavior contract.',
        ['Reject negative dimensions and keep Shape abstract.','Aggregate through area methods and return zero for no shapes.'],
        [['Rectangle(2,3) and Circle(1)','Approximately 6+pi'],['attempt to instantiate Shape','TypeError']],['ABC and abstractmethod express the required behavior.','A caller should not need isinstance branches for every new shape.'],
        'The base interface contains only the supported area capability. Both subclasses satisfy the same numeric-result contract, so aggregation remains open to future implementations without a class-name switch.',
        String.raw`from abc import ABC, abstractmethod
import math

class Shape(ABC):
    @abstractmethod
    def area(self): pass
class Rectangle(Shape):
    def __init__(self, width, height):
        if width < 0 or height < 0: raise ValueError('Negative dimension')
        self.width, self.height = width, height
    def area(self): return self.width*self.height
class Circle(Shape):
    def __init__(self, radius):
        if radius < 0: raise ValueError('Negative dimension')
        self.radius = radius
    def area(self): return math.pi*self.radius**2

def total_area(shapes):
    return sum(shape.area() for shape in shapes)`,
        String.raw`assert math.isclose(total_area([Rectangle(2,3),Circle(1)]),6+math.pi)
assert total_area([])==0
try: Shape()
except TypeError: pass
else: raise AssertionError('abstract shape instantiated')
try: Rectangle(-1,2)
except ValueError: pass
else: raise AssertionError('negative dimension')`),
    exercise('OOP','Medium','context-owner','Close an acquired resource on normal and exceptional exits',
        'Implement OwnedResource(factory) as a context manager. __enter__ calls the factory and returns its result; __exit__ closes a successfully acquired resource and never suppresses an exception. Assume close succeeds for this exercise, and distinguish factory failure from an acquired resource lifecycle.',
        'Make resource ownership explicit through the context-manager protocol.',
        ['Close exactly once on each successful context entry/exit.','Do not suppress body errors or attempt close after acquisition fails.'],
        [['with block returns normally','Acquired resource is closed.'],['body raises ValueError','Resource closes and the ValueError propagates.']],['__exit__ runs after a successful __enter__.','Returning False preserves the body exception.'],
        'The context manager pairs acquisition with release. This narrow contract assumes cleanup succeeds; preserving both a body error and a close error needs an additional explicit error policy.',
        String.raw`class OwnedResource:
    def __init__(self, factory): self.factory = factory
    def __enter__(self):
        self.resource = self.factory()
        return self.resource
    def __exit__(self, exc_type, exc, traceback):
        self.resource.close()
        return False`,
        String.raw`class Resource:
    def __init__(self): self.closes=0
    def close(self): self.closes+=1
r=Resource()
with OwnedResource(lambda:r) as got: assert got is r
assert r.closes==1
r2=Resource()
try:
    with OwnedResource(lambda:r2): raise ValueError('body')
except ValueError: pass
else: raise AssertionError('suppressed body error')
assert r2.closes==1
def unavailable(): raise OSError('acquisition failed')
try:
    with OwnedResource(unavailable): pass
except OSError: pass
else: raise AssertionError('suppressed acquisition')`),
    exercise('OOP','Hard','order-state','Reject stale order transitions with expected versions',
        'Implement an in-memory Order state machine with pending, paid, and cancelled states and a version initially zero. pay(reference,expected_version) and cancel(expected_version) only work from pending at the matching version; failed transitions leave every field unchanged.',
        'Encapsulate state and explicit optimistic transition preconditions.',
        ['Require a nonblank payment reference and increment version only on successful transition.','Expose read-only status/version and do not claim this local object is a cross-process atomic database implementation.'],
        [['pending v0 pay with reference p1 and expected 0','paid v1'],['cancel paid order or use stale expected version','ValueError with unchanged state']],['Check all transition preconditions before mutation.','A real shared repository must enforce version checks atomically.'],
        'The object concentrates allowed transitions and protects failed-operation state. A repository can implement the same expected-version contract, but an in-memory check alone does not coordinate multiple workers.',
        String.raw`class Order:
    def __init__(self):
        self._status, self._version, self.payment_ref = 'pending', 0, None
    @property
    def status(self): return self._status
    @property
    def version(self): return self._version
    def _check(self, expected):
        if type(expected) is not int or expected != self._version or self._status != 'pending':
            raise ValueError('Invalid transition')
    def pay(self, reference, expected_version):
        self._check(expected_version)
        if not isinstance(reference,str) or not reference.strip():
            raise ValueError('Reference required')
        self.payment_ref = reference.strip()
        self._status = 'paid'
        self._version += 1
    def cancel(self, expected_version):
        self._check(expected_version)
        self._status = 'cancelled'
        self._version += 1`,
        String.raw`o=Order(); o.pay(' p1 ',0); assert (o.status,o.version,o.payment_ref)==('paid',1,'p1')
try: o.cancel(1)
except ValueError: pass
else: raise AssertionError('cancel paid')
assert (o.status,o.version,o.payment_ref)==('paid',1,'p1')
p=Order()
for ref,v in [('',0),('p2',9)]:
    try: p.pay(ref,v)
    except ValueError: pass
    else: raise AssertionError('invalid payment')
assert (p.status,p.version,p.payment_ref)==('pending',0,None)
p.cancel(0); assert p.status=='cancelled' and p.version==1`),
    exercise('OOP','Hard','repository-contract','Keep a reservation service independent of persistence',
        'Implement ReservationService(repo).reserve(course_id,user_id) using an injected atomic repo.try_reserve(course_id,user_id) contract returning a reservation object or None if unavailable. Validate nonempty string IDs, raise CapacityError for None, and never convert repository exceptions into successful bookings.',
        'Separate a service orchestration contract from atomic persistence responsibility.',
        ['Call the repository exactly once after validation.','Return its result unchanged and propagate operational errors; atomic capacity/idempotency belongs to the repository contract.'],
        [['Repository returns reservation {id:r1}','Return that object.'],['Repository returns None','CapacityError, not a fabricated reservation.']],['An atomic repository method is a stronger contract than find-then-save.','Fakes verify delegation, while real concurrency requires separate database integration tests.'],
        'The service depends on behavior rather than a database library. It validates request shape and maps a domain absence outcome while preserving operational failures; tests must not pretend a fake proves real database atomicity.',
        String.raw`class CapacityError(Exception): pass

class ReservationService:
    def __init__(self, repo): self.repo = repo
    def reserve(self, course_id, user_id):
        if not all(isinstance(x,str) and x.strip() for x in (course_id,user_id)):
            raise ValueError('IDs required')
        result = self.repo.try_reserve(course_id,user_id)
        if result is None:
            raise CapacityError('Unavailable')
        return result`,
        String.raw`class Repo:
    def __init__(self,result): self.result=result; self.calls=[]
    def try_reserve(self,*args): self.calls.append(args); return self.result
value={'id':'r1'}; r=Repo(value)
assert ReservationService(r).reserve('c1','u1') is value and r.calls==[('c1','u1')]
empty=Repo(None)
try: ReservationService(empty).reserve('c1','u1')
except CapacityError: pass
else: raise AssertionError('unavailable accepted')
try: ReservationService(r).reserve('','u1')
except ValueError: pass
else: raise AssertionError('blank id')
assert len(r.calls)==1
class Broken:
    def try_reserve(self,*args): raise OSError('db')
try: ReservationService(Broken()).reserve('c1','u1')
except OSError: pass
else: raise AssertionError('db error hidden')`),
    exercise('OOP','Hard','versioned-record','Hydrate a versioned subscription without trusting arbitrary fields',
        'Implement frozen Subscription(id,interval) and hydrate_subscription(record). Version 1 records contain id and imply month; version 2 includes interval month/year. Reject unknown versions, invalid IDs, unsupported intervals, and boolean version values. Ignore unrelated input fields rather than passing them to a constructor.',
        'Keep serialized schema evolution separate from object construction.',
        ['Validate record version and allowlisted constructor values.','Preserve a documented legacy default and do not mutate the stored record.'],
        [['{version:1,id:s1}','Subscription s1, month'],['{version:2,id:s2,interval:year}','Subscription s2, year']],['Legacy defaults are explicit migration rules, not guesses.','Exact int checking rejects True as version one.'],
        'A dedicated hydrator interprets old representations before constructing a validated value object. Unknown schemas fail clearly rather than silently discarding changes that alter meaning.',
        String.raw`from dataclasses import dataclass

@dataclass(frozen=True)
class Subscription:
    id: str
    interval: str
    def __post_init__(self):
        if not isinstance(self.id,str) or not self.id.strip() or self.interval not in ('month','year'):
            raise ValueError('Invalid subscription')

def hydrate_subscription(record):
    version = record.get('version')
    if type(version) is not int or version not in (1,2):
        raise ValueError('Unsupported version')
    interval = 'month' if version == 1 else record.get('interval')
    return Subscription(record.get('id'),interval)`,
        String.raw`r={'version':1,'id':'s1'}
assert hydrate_subscription(r)==Subscription('s1','month') and r=={'version':1,'id':'s1'}
assert hydrate_subscription({'version':2,'id':'s2','interval':'year','extra':1})==Subscription('s2','year')
for r in [{'version':True,'id':'x'},{'version':3,'id':'x'},{'version':2,'id':'x','interval':'week'},{'version':1,'id':''}]:
    try: hydrate_subscription(r)
    except ValueError: pass
    else: raise AssertionError('bad record accepted')`),

    exercise('NumPy','Easy','np-affine','Apply a numeric transform without integer overflow',
        'Implement affine(values,scale,offset) for finite numeric values and scalar scale/offset. Convert input to float64 and return values*scale+offset without changing the input array. Explain why casting after multiplication can be too late for a narrow integer dtype.',
        'Choose dtype before vectorized arithmetic.',
        ['Convert before multiplying and preserve the input.','Accept empty arrays and preserve shape.'],
        [['int8 array [100], scale=2, offset=1','float array [201]'],['shape (0,2)','shape (0,2)']],['np.asarray can request the arithmetic dtype.','The expression creates a new output instead of using in-place operators.'],
        'The float64 conversion changes the arithmetic domain before multiplication. It avoids the int8 overflow in this fixture, while float64 still has its own finite range and precision limitations.',
        String.raw`import numpy as np

def affine(values, scale, offset):
    return np.asarray(values,dtype=np.float64) * scale + offset`,
        String.raw`a=np.array([100],dtype=np.int8)
np.testing.assert_array_equal(affine(a,2,1),[201.0]); assert a[0]==100
assert affine(np.empty((0,2)),2,0).shape==(0,2)
np.testing.assert_allclose(affine([[1,2],[3,4]],0.5,1),[[1.5,2],[2.5,3]])`),
    exercise('NumPy','Easy','np-axis','Compute one mean per feature column',
        'Implement feature_means(x) for a finite two-dimensional numeric array with at least one row. Return one float mean per column, reject non-matrix or zero-row input, and explain the difference between reducing axis zero and axis one.',
        'Track reduction axes and resulting shapes.',
        ['Require ndim=2 and at least one row.','Return shape (number_of_columns,) without changing x.'],
        [['[[1,2],[3,4]]','[2,3]'],['one row [[7,8]]','[7,8]']],['Axis zero removes the row dimension.','Validate the dimension before indexing shape[0].'],
        'Column means summarize examples while retaining the feature dimension. A zero-row mean has no defined finite-data average, so this contract rejects it instead of hiding a warning/NaN result.',
        String.raw`import numpy as np

def feature_means(x):
    a=np.asarray(x,dtype=float)
    if a.ndim!=2 or a.shape[0]==0:
        raise ValueError('Expected nonempty matrix')
    return a.mean(axis=0)`,
        String.raw`np.testing.assert_allclose(feature_means([[1,2],[3,4]]),[2,3])
np.testing.assert_allclose(feature_means([[7,8]]),[7,8])
assert feature_means(np.empty((2,0))).shape==(0,)
for a in [[],[1,2],np.empty((0,2))]:
    try: feature_means(a)
    except ValueError: pass
    else: raise AssertionError('invalid matrix')`),
    exercise('NumPy','Easy','np-filter','Select rows using an explicit boolean mask',
        'Implement passing_rows(x,threshold) for a finite two-dimensional matrix with at least one column. Return rows whose first column is at least threshold. Keep all columns and return independent output so later output edits do not change x.',
        'Use boolean indexing to select whole records.',
        ['Validate matrix shape and retain zero matching rows with correct width.','Do not modify the input or return a slice sharing writable data.'],
        [['[[1,8],[3,9]], threshold=2','[[3,9]]'],['threshold above all first-column values','shape (0,2)']],['Build the mask from a[:,0].','Boolean advanced indexing produces selected data separately from the source.'],
        'The mask has one decision per row and is applied to the matrix rather than a single feature. This preserves record alignment and an empty selection still retains the column dimension.',
        String.raw`import numpy as np

def passing_rows(x, threshold):
    a=np.asarray(x)
    if a.ndim!=2 or a.shape[1]<1:
        raise ValueError('Expected matrix with columns')
    return a[a[:,0]>=threshold].copy()`,
        String.raw`a=np.array([[1,8],[3,9]])
r=passing_rows(a,2); np.testing.assert_array_equal(r,[[3,9]])
r[0,0]=99; assert a[1,0]==3
assert passing_rows(a,10).shape==(0,2)`),
    exercise('NumPy','Medium','np-normalize','Normalize each row while preserving zero vectors',
        'Implement normalize_rows(x) for a finite moderate-magnitude two-dimensional float matrix. Divide each row by its L2 norm, leaving an all-zero row all zero without divide-by-zero warnings. Do not accidentally normalize columns or broadcast a (n,) divisor across the wrong axis.',
        'Control broadcasting shape and masked division.',
        ['Use row norms with keepdims=True.','Return float output without modifying x; zero norms produce zeros.'],
        [['[[3,4],[0,0]]','[[0.6,0.8],[0,0]]'],['shape (0,3)','shape (0,3)']],['A column-shaped divisor broadcasts once per row.','np.divide supports out and where for defined zero behavior.'],
        'Keeping the reduced axis produces shape (rows,1). Masked division writes only valid nonzero-norm ratios into a zero-initialized array; this avoids evaluating an invalid zero division for the chosen contract.',
        String.raw`import numpy as np

def normalize_rows(x):
    a=np.asarray(x,dtype=float)
    if a.ndim!=2: raise ValueError('Expected matrix')
    norms=np.linalg.norm(a,axis=1,keepdims=True)
    return np.divide(a,norms,out=np.zeros_like(a),where=norms!=0)`,
        String.raw`with np.errstate(divide='raise',invalid='raise'):
    np.testing.assert_allclose(normalize_rows([[3,4],[0,0]]),[[0.6,0.8],[0,0]])
assert normalize_rows(np.empty((0,3))).shape==(0,3)
np.testing.assert_allclose(normalize_rows([[2,0],[0,2],[1,0]]),[[1,0],[0,1],[1,0]])`),
    exercise('NumPy','Medium','np-standardize','Fit scaling on training rows only',
        'Implement fit_scaler(train) returning column mean and safe standard deviation, and transform(x,mean,scale). Use population standard deviation; replace zero training scales with one. Train is a nonempty finite matrix, and transforms must match feature width.',
        'Separate learned preprocessing state from its application.',
        ['Use training statistics only and ddof=0.','Validate transform feature count and do not recompute statistics on evaluation data.'],
        [['train [[1,5],[3,5]]','mean [2,5], scale [1,1]'],['transform [[5,5]] with those statistics','[[3,0]]']],['A constant feature needs a defined divisor.','Reuse fitted parameters so new examples remain in the same coordinate system.'],
        'Fitting stores the training distribution parameters; transforming performs a shape-checked broadcast. Replacing zero scale avoids division failure while retaining the constant-feature centering rule.',
        String.raw`import numpy as np

def fit_scaler(train):
    a=np.asarray(train,dtype=float)
    if a.ndim!=2 or not len(a): raise ValueError('Training matrix required')
    mean=a.mean(axis=0); scale=a.std(axis=0,ddof=0)
    return mean,np.where(scale==0,1.0,scale)

def transform(x,mean,scale):
    a=np.asarray(x,dtype=float)
    if a.ndim!=2 or a.shape[1:]!=mean.shape or scale.shape!=mean.shape:
        raise ValueError('Feature mismatch')
    return (a-mean)/scale`,
        String.raw`m,s=fit_scaler([[1,5],[3,5]])
np.testing.assert_allclose(m,[2,5]); np.testing.assert_allclose(s,[1,1])
np.testing.assert_allclose(transform([[5,5]],m,s),[[3,0]])
try: transform([[1]],m,s)
except ValueError: pass
else: raise AssertionError('wrong width')`),
    exercise('NumPy','Medium','np-copy','Return an independently editable crop',
        'Implement crop_copy(image,row_slice,col_slice) for a two-dimensional NumPy array and ordinary slice objects. Return a crop with the expected values but no shared writable memory, explaining why basic slicing alone can mutate the original during editing.',
        'Distinguish NumPy views from independent copies.',
        ['Reject non-matrix inputs and return the specified crop.','Mutating a nonempty output must leave the source unchanged.'],
        [['3x3 arange matrix, rows 0:2, cols 1:3','[[1,2],[4,5]]'],['empty row slice','Empty crop retains selected column width.']],['Basic slicing often returns a view.','copy creates the ownership boundary for later editing.'],
        'Slicing chooses the region and copying then detaches its storage. The explicit copy remains correct regardless of later assignments or whether an optimization could have safely shared memory.',
        String.raw`import numpy as np

def crop_copy(image,row_slice,col_slice):
    a=np.asarray(image)
    if a.ndim!=2: raise ValueError('Expected matrix')
    return a[row_slice,col_slice].copy()`,
        String.raw`a=np.arange(9).reshape(3,3); r=crop_copy(a,slice(0,2),slice(1,3))
np.testing.assert_array_equal(r,[[1,2],[4,5]])
assert not np.shares_memory(a,r)
r[0,0]=99; assert a[0,1]==1
assert crop_copy(a,slice(0,0),slice(1,3)).shape==(0,2)`),
    exercise('NumPy','Hard','np-softmax','Compute stable row-wise probabilities for large logits',
        'Implement softmax_rows(x) for a finite two-dimensional float matrix with at least one column. Stabilize exponentiation by subtracting each row maximum, return row sums approximately one, and support zero rows without reducing an empty feature axis.',
        'Preserve numeric stability while reducing and broadcasting by row.',
        ['Validate matrix width and never exponentiate raw large positive logits.','Return finite probabilities for the supplied finite fixtures and preserve shape.'],
        [['[[1000,1000]]','[[0.5,0.5]]'],['[[1,2]] and [[1001,1002]]','Approximately equal probabilities']],['Adding a constant to every logit in one row should not change probabilities.','Use keepdims to align each row maximum and denominator.'],
        'Subtracting the row maximum keeps the largest exponent at one. The normalization is unchanged algebraically, while the intermediate values avoid overflow on the large-positive fixtures.',
        String.raw`import numpy as np

def softmax_rows(x):
    a=np.asarray(x,dtype=float)
    if a.ndim!=2 or a.shape[1]==0: raise ValueError('Feature axis required')
    shifted=a-a.max(axis=1,keepdims=True)
    exp=np.exp(shifted)
    return exp/exp.sum(axis=1,keepdims=True)`,
        String.raw`with np.errstate(over='raise',invalid='raise'):
    np.testing.assert_allclose(softmax_rows([[1000,1000]]),[[0.5,0.5]])
    np.testing.assert_allclose(softmax_rows([[1,2]]),softmax_rows([[1001,1002]]))
p=softmax_rows([[3,-2,0],[9,9,9]]); np.testing.assert_allclose(p.sum(axis=1),[1,1])
assert softmax_rows(np.empty((0,3))).shape==(0,3)`),
    exercise('NumPy','Hard','np-pairwise','Compute squared distances in bounded row blocks',
        'Implement squared_distances(a,b,block_size) for finite moderate-magnitude matrices sharing feature width. Return shape (len(a),len(b)), but avoid an (n,m,d) broadcast allocation by using norms and matrix multiplication one block of a rows at a time.',
        'Trade temporary memory against vectorized computation.',
        ['Validate width and positive exact integer block_size.','Clip tiny negative roundoff distances to zero; output itself still needs O(n*m) memory.'],
        [['a=[[0,0],[1,0]], b=[[0,1]]','[[1],[2]]'],['empty b with matching width','Output shape (len(a),0)']],['Squared distance is norm(a)^2+norm(b)^2-2*a dot b.','Block rows and state the numerical cancellation limit for extreme near-equal magnitudes.'],
        'The identity replaces a three-dimensional difference tensor with a two-dimensional block. It is efficient for moderate magnitudes but cancellation can lose precision for huge nearly equal vectors; clipping is not a universal numerical cure.',
        String.raw`import numpy as np

def squared_distances(a,b,block_size):
    a=np.asarray(a,dtype=float); b=np.asarray(b,dtype=float)
    if a.ndim!=2 or b.ndim!=2 or a.shape[1]!=b.shape[1] or type(block_size) is not int or block_size<1:
        raise ValueError('Invalid shape or block')
    out=np.empty((len(a),len(b)),dtype=float)
    bnorm=np.sum(b*b,axis=1)
    for start in range(0,len(a),block_size):
        part=a[start:start+block_size]
        d=np.sum(part*part,axis=1)[:,None]+bnorm[None,:]-2*(part@b.T)
        out[start:start+len(part)]=np.maximum(d,0)
    return out`,
        String.raw`np.testing.assert_allclose(squared_distances([[0,0],[1,0]],[[0,1]],1),[[1],[2]])
a=np.arange(12,dtype=float).reshape(4,3); b=np.ones((2,3))
np.testing.assert_allclose(squared_distances(a,b,2),((a[:,None,:]-b[None,:,:])**2).sum(axis=2))
assert squared_distances(a,np.empty((0,3)),2).shape==(4,0)
try: squared_distances(a,np.zeros((2,2)),2)
except ValueError: pass
else: raise AssertionError('width mismatch')`),
    exercise('NumPy','Hard','np-missing-weighted','Compute weighted column means excluding missing observations',
        'Implement weighted_means(x,weights) for a 2D float matrix containing finite values or NaN and finite nonnegative row weights. Ignore NaN cells independently per column, using only observed-cell weights in each denominator. Return NaN where no positive observed weight remains.',
        'Combine missingness masks with correctly scoped weighted denominators.',
        ['Validate row/weight shapes, finite weights, and nonnegative weights.','Do not let NaN multiplied by zero poison a numerator.'],
        [['x=[[1,NaN],[3,4]], weights=[1,3]','[2.5,4]'],['all-zero weights or fully missing column','NaN for the affected columns']],['A missing value changes a column’s denominator, not every column equally.','Replace missing values before multiplication and divide only where weight remains.'],
        'Each column has its own observed-weight total. A masked numerator and denominator preserve that distinction, while an initialized NaN output gives undefined weighted means an explicit result.',
        String.raw`import numpy as np

def weighted_means(x,weights):
    a=np.asarray(x,dtype=float); w=np.asarray(weights,dtype=float)
    if a.ndim!=2 or w.ndim!=1 or len(w)!=len(a) or not np.isfinite(w).all() or (w<0).any() or np.isinf(a).any():
        raise ValueError('Invalid weighted data')
    valid=~np.isnan(a)
    numerator=(np.where(valid,a,0)*w[:,None]).sum(axis=0)
    denominator=(valid*w[:,None]).sum(axis=0)
    return np.divide(numerator,denominator,out=np.full(a.shape[1],np.nan),where=denominator>0)`,
        String.raw`np.testing.assert_allclose(weighted_means([[1,np.nan],[3,4]],[1,3]),[2.5,4])
assert np.isnan(weighted_means([[1,np.nan]],[0])).all()
assert np.isnan(weighted_means(np.empty((0,2)),[])).all()
try: weighted_means([[1]],[-1])
except ValueError: pass
else: raise AssertionError('negative weight')`),

    exercise('Pandas','Easy','pd-filter','Select a copied report without chained assignment',
        'Implement active_report(df,min_score) for columns name,active,score, where active is boolean and score is numeric or missing. Return only name/score for active rows with score at least min_score. Preserve original row labels and make an independent result for editing.',
        'Use a boolean mask and explicit column selection.',
        ['Treat missing scores as not passing.','Use .loc and copy rather than chained assignment into the input.'],
        [['active A:8, inactive B:9, active C:missing, threshold 8','Only A with score 8.'],['no qualifying rows','Empty report with name/score columns.']],['Combine masks using & and parentheses.','Select rows and columns in one loc operation.'],
        'A conjunction keeps row alignment while loc chooses the public report columns. Copying establishes the editable output boundary, and a missing numeric comparison does not create an invented score.',
        String.raw`import pandas as pd

def active_report(df,min_score):
    mask=df['active'] & df['score'].ge(min_score).fillna(False)
    return df.loc[mask,['name','score']].copy()`,
        String.raw`df=pd.DataFrame({'name':['A','B','C'],'active':[True,False,True],'score':[8,9,None]},index=[4,5,6])
r=active_report(df,8); assert r.index.tolist()==[4] and r['name'].tolist()==['A']
r.loc[4,'name']='X'; assert df.loc[4,'name']=='A'
assert active_report(df,100).columns.tolist()==['name','score'] and active_report(df,100).empty`),
    exercise('Pandas','Easy','pd-numeric','Coerce numeric text while reporting rejected labels',
        'Implement clean_scores(df) for a unique-index DataFrame whose score column contains strings or missing values. Convert with to_numeric(errors=coerce), retain rows with a numeric result, and return rejected index labels separately. Missing/blank/nonnumeric input is rejected; preserve other columns.',
        'Make data-cleaning exclusions visible rather than silently dropping them.',
        ['Return (clean_frame,rejected_labels) with numeric score values.','Preserve input and original row labels/order.'],
        [["scores ['3','bad',None,' 4 '], labels a,b,c,d","Retain a=3,d=4; reject [b,c]."],['all invalid','Empty clean frame and every label rejected.']],['Compute a converted Series aligned to the source index.','Assign to an explicit copy after selecting the accepted mask.'],
        'Coercion provides a missing marker for conversion failures, but the separate rejected-label list preserves evidence of discarded records. This contract treats originally missing inputs as rejected too.',
        String.raw`import pandas as pd

def clean_scores(df):
    numeric=pd.to_numeric(df['score'],errors='coerce')
    valid=numeric.notna()
    result=df.loc[valid].copy()
    result['score']=numeric.loc[valid]
    return result,df.index[~valid].tolist()`,
        String.raw`df=pd.DataFrame({'score':['3','bad',None,' 4 '],'tag':[1,2,3,4]},index=['a','b','c','d'])
r,bad=clean_scores(df); assert r.index.tolist()==['a','d'] and r['score'].tolist()==[3,4] and bad==['b','c']
assert df.loc['a','score']=='3'
r,bad=clean_scores(pd.DataFrame({'score':['','x']})); assert r.empty and bad==[0,1]`),
    exercise('Pandas','Easy','pd-groups','Retain missing group keys and all-missing totals explicitly',
        'Implement group_totals(df) for columns team and amount. Group by team while retaining a missing team group, and sum numeric amounts using min_count=1 so an all-missing group remains missing instead of looking like a known zero.',
        'Choose group-key and missing-value aggregation semantics explicitly.',
        ['Use dropna=False for team groups.','Return a Series and preserve all-missing groups as NaN.'],
        [['A amounts 2 and 3; missing team amount 4','A total 5 and missing-team total 4.'],['B amounts all missing','B total is missing, not zero.']],['Groupby normally drops missing keys unless configured.','min_count controls the minimum observed values for a sum.'],
        'Missing grouping keys and missing numeric observations are independent policies. Keeping the former and requiring one observed value for the latter prevents silently losing records or inventing known totals.',
        String.raw`import pandas as pd

def group_totals(df):
    return df.groupby('team',dropna=False)['amount'].sum(min_count=1)`,
        String.raw`df=pd.DataFrame({'team':['A','A',None,'B'],'amount':[2,3,4,None]})
r=group_totals(df); assert r.loc['A']==5 and pd.isna(r.loc['B'])
assert r[r.index.isna()].iloc[0]==4
assert group_totals(pd.DataFrame({'team':[],'amount':[]})).empty`),
    exercise('Pandas','Medium','pd-merge','Validate many-to-one enrichment and expose unmatched customers',
        'Implement enrich_orders(orders,customers), left joining orders(order_id,customer_id) to customers(customer_id,name). Reject missing join keys on either side and duplicate customer IDs. Keep unmatched nonmissing IDs as rows with merge indicator left_only rather than silently dropping them.',
        'Validate join cardinality and missing-key policy before enrichment.',
        ['Use validate=many_to_one and indicator=True.','Do not allow Pandas null-key matching to invent a customer relationship.'],
        [['two orders for c1 and one unique customer c1','Two enriched rows, no row multiplication.'],['order for c9 with no customer','Preserved with left_only indicator.']],['Pandas can match null join keys to each other, unlike typical SQL expectations.','Validation checks the intended uniqueness side of the join.'],
        'A left join preserves every order while the cardinality check prevents duplicate customer rows multiplying facts. Explicit missing-key rejection avoids an unintended null-to-null match.',
        String.raw`import pandas as pd

def enrich_orders(orders,customers):
    if orders['customer_id'].isna().any() or customers['customer_id'].isna().any():
        raise ValueError('Missing join key')
    return orders.merge(customers,on='customer_id',how='left',validate='many_to_one',indicator=True)`,
        String.raw`o=pd.DataFrame({'order_id':[1,2,3],'customer_id':['c1','c1','c9']}); c=pd.DataFrame({'customer_id':['c1'],'name':['Ada']})
r=enrich_orders(o,c); assert len(r)==3 and r['_merge'].astype(str).tolist()==['both','both','left_only']
try: enrich_orders(o,pd.concat([c,c],ignore_index=True))
except pd.errors.MergeError: pass
else: raise AssertionError('duplicate customer')
try: enrich_orders(pd.DataFrame({'order_id':[1],'customer_id':[None]}),c)
except ValueError: pass
else: raise AssertionError('null join key')`),
    exercise('Pandas','Medium','pd-latest','Keep a deterministic latest row per entity',
        'Implement latest_events(df) for columns entity_id,timestamp,value with nonmissing IDs and valid timestamp strings. Choose the newest instant per entity, breaking equal timestamps by the later input row. Return entities sorted by ID, converted UTC timestamps, and no temporary helper columns.',
        'Combine timestamp normalization and deterministic duplicate resolution.',
        ['Parse timestamps strictly with utc=True.','Use stable source-position tie breaking and preserve the input.'],
        [['A has equal timestamp rows value old then new','Keep new.'],['Offsets express different local times for one instant','Compare actual UTC instants, not raw strings.']],['Add an input position before sorting.','drop_duplicates keeps the selected endpoint after a deterministic sort.'],
        'Timestamp parsing establishes a comparable time axis. An explicit input-position key removes accidental dependence on sort stability or arbitrary tie ordering, then helper state is removed from the public result.',
        String.raw`import pandas as pd

def latest_events(df):
    result=df.copy()
    result['timestamp']=pd.to_datetime(result['timestamp'],utc=True,errors='raise')
    result['_position']=range(len(result))
    result=result.sort_values(['entity_id','timestamp','_position'])
    return result.drop_duplicates('entity_id',keep='last').drop(columns='_position').reset_index(drop=True)`,
        String.raw`d=pd.DataFrame({'entity_id':['A','A','B'],'timestamp':['2026-01-01T10:00:00Z','2026-01-01T10:00:00Z','2026-01-01T09:00:00Z'],'value':['old','new','b']})
r=latest_events(d); assert r['value'].tolist()==['new','b'] and '_position' not in r and isinstance(d.loc[0,'timestamp'],str)
assert str(r['timestamp'].dtype)=='datetime64[ns, UTC]'
assert latest_events(d.iloc[:0]).empty`),
    exercise('Pandas','Medium','pd-utc-days','Aggregate events by UTC day across timezone offsets',
        'Implement daily_counts(df) for a timestamp column of valid ISO-style strings with explicit offsets. Parse as UTC with mixed-format support, count records by UTC day, and return a chronologically ordered Series. Empty input must produce no day buckets.',
        'Group timezone-aware instants using an explicit reporting timezone.',
        ['Use utc=True and format=mixed for the stated Pandas version family.','Floor to UTC days rather than slicing the original timestamp text.'],
        [['2026-01-02T00:30:00+02:00 and 2026-01-01T23:00:00Z','Both count toward UTC 2026-01-01.'],['empty timestamps','Empty Series']],['Local date strings can differ while referring to the same UTC reporting day.','A sorted group count makes output deterministic.'],
        'Normalization precedes bucketing, so offset differences cannot move a record into the wrong reporting day. This is a UTC report; local-business-day reporting needs a named timezone policy instead.',
        String.raw`import pandas as pd

def daily_counts(df):
    times=pd.to_datetime(df['timestamp'],utc=True,format='mixed',errors='raise')
    return times.dt.floor('D').value_counts().sort_index()`,
        String.raw`d=pd.DataFrame({'timestamp':['2026-01-02T00:30:00+02:00','2026-01-01T23:00:00Z']})
r=daily_counts(d); assert len(r)==1 and r.iloc[0]==2 and r.index[0]==pd.Timestamp('2026-01-01',tz='UTC')
assert daily_counts(d.iloc[:0]).empty`),
    exercise('Pandas','Hard','pd-train-imputer','Impute group means learned only from training data',
        'Implement fit_imputer(train) and apply_imputer(df,means,fallback) for nonmissing string group keys and numeric-or-missing scores. Learn per-group means and a global observed mean from training only; use zero if training has no observed scores. Fill missing scores using group then global fallback.',
        'Avoid leakage while preserving group-aware missing-value semantics.',
        ['Never recompute means from evaluation data.','Handle unseen groups and all-missing training groups; return a copy.'],
        [['train A scores 2,4; evaluation A missing','Fill 3.'],['unseen B missing with global train mean 3','Fill 3 rather than evaluation-derived values.']],['Group means may themselves be missing.','Map learned means to rows and chain fallback fills.'],
        'Fit and apply separate learning from transformation. A fallback derived only from training keeps unseen and all-missing groups defined without exposing evaluation statistics.',
        String.raw`import pandas as pd

def fit_imputer(train):
    means=train.groupby('group')['score'].mean()
    global_mean=train['score'].mean()
    return means,0.0 if pd.isna(global_mean) else float(global_mean)

def apply_imputer(df,means,fallback):
    result=df.copy()
    result['score']=result['score'].fillna(result['group'].map(means)).fillna(fallback)
    return result`,
        String.raw`train=pd.DataFrame({'group':['A','A','C'],'score':[2.0,4.0,None]}); m,f=fit_imputer(train)
test_df=pd.DataFrame({'group':['A','B','C','A'],'score':[None,None,None,100.0]})
r=apply_imputer(test_df,m,f); assert r['score'].tolist()==[3,3,3,100] and test_df['score'].isna().sum()==3
m,f=fit_imputer(pd.DataFrame({'group':['X'],'score':[float('nan')]})); assert f==0
assert apply_imputer(pd.DataFrame({'group':['X'],'score':[None]}),m,f)['score'].iloc[0]==0`),
    exercise('Pandas','Hard','pd-fanout','Aggregate independent child tables before joining totals',
        'Implement order_totals(orders,lines,payments) with orders unique order_id and child tables order_id,amount_cents containing integers. Compute line and payment totals independently, preserve every order, fill missing totals with zero, and avoid two-child join multiplication.',
        'Control relational cardinality before summing facts.',
        ['Aggregate each child to one row per order first.','Do not use distinct amounts to repair repeated equal-valued legitimate lines.'],
        [['one order with lines 100,100 and payments 50,150','line_cents=200, paid_cents=200'],['order has no child rows','Both totals zero.']],['Two one-to-many joins can create a Cartesian product within an order.','Group each fact table separately and validate the subsequent joins.'],
        'Preaggregation creates at most one row per parent on each side. This prevents row multiplication while preserving repeated amounts as separate real facts; output totals use exact integer cents within int64 range.',
        String.raw`import pandas as pd

def order_totals(orders,lines,payments):
    l=lines.groupby('order_id')['amount_cents'].sum().rename('line_cents')
    p=payments.groupby('order_id')['amount_cents'].sum().rename('paid_cents')
    result=orders.merge(l,on='order_id',how='left',validate='one_to_one').merge(p,on='order_id',how='left',validate='one_to_one')
    result[['line_cents','paid_cents']]=result[['line_cents','paid_cents']].fillna(0).astype('int64')
    return result`,
        String.raw`o=pd.DataFrame({'order_id':[1,2]}); l=pd.DataFrame({'order_id':[1,1],'amount_cents':[100,100]}); p=pd.DataFrame({'order_id':[1,1],'amount_cents':[50,150]})
r=order_totals(o,l,p)
assert r[['line_cents','paid_cents']].values.tolist()==[[200,200],[0,0]] and len(r)==2
try: order_totals(pd.concat([o,o]),l,p)
except pd.errors.MergeError: pass
else: raise AssertionError('duplicate parent accepted')`),
    exercise('Pandas','Hard','pd-chunks','Combine exact group totals from a stream of frames',
        'Implement aggregate_chunks(chunks) for a one-pass iterable of DataFrames with nonmissing string team keys and integer cents. Compute per-team totals without concatenating all frames. Return a sorted team,total_cents DataFrame and handle empty input with the same columns.',
        'Use an associative summary to process data in bounded chunks.',
        ['Maintain only per-team totals rather than retaining frames.','Document that memory still grows with distinct team count.'],
        [['chunk1 A:2,B:3; chunk2 A:-1','A:1,B:3'],['empty iterable','Empty frame with team,total_cents columns']],['Per-chunk group sums can be added because integer addition is associative in this bounded fixture.','A one-pass source must not be traversed for sizing first.'],
        'Each frame is reduced to group totals and then discarded. This bounds row storage to the current chunk plus distinct-group state; it is not constant memory for unbounded group cardinality.',
        String.raw`import pandas as pd

def aggregate_chunks(chunks):
    totals={}
    for frame in chunks:
        for team,total in frame.groupby('team')['cents'].sum().items():
            totals[team]=totals.get(team,0)+int(total)
    return pd.DataFrame([(team,totals[team]) for team in sorted(totals)],columns=['team','total_cents'])`,
        String.raw`frames=(f for f in [pd.DataFrame({'team':['A','B'],'cents':[2,3]}),pd.DataFrame({'team':['A'],'cents':[-1]})])
assert aggregate_chunks(frames).to_dict('records')==[{'team':'A','total_cents':1},{'team':'B','total_cents':3}]
r=aggregate_chunks(iter([])); assert r.empty and r.columns.tolist()==['team','total_cents']
assert aggregate_chunks([pd.DataFrame({'team':[],'cents':[]})]).empty`),

    exercise('APIs','Easy','api-json','Decode a JSON object without trusting its shape',
        'Implement decode_object(body) for UTF-8 response bytes. Decode JSON and require an object/dictionary, rejecting valid JSON arrays or null. Propagate decoding and parsing errors so the caller can distinguish invalid API data from a successful empty object.',
        'Separate byte decoding, JSON syntax, and application shape validation.',
        ['Accept a JSON object including {}.','Reject other JSON types and never convert malformed data into a fabricated success.'],
        [['UTF-8 bytes containing {"ok":true}','Dictionary with ok True.'],['bytes containing [] or null','ValueError for wrong shape.']],['json.loads can parse several top-level JSON types.','Check the parsed type after decoding, not the first text character.'],
        'The parser validates syntax while an explicit dictionary check enforces the consuming contract. Empty objects remain valid; malformed encoding or syntax remains observable instead of becoming an empty default.',
        String.raw`import json

def decode_object(body):
    value=json.loads(body.decode('utf-8'))
    if not isinstance(value,dict): raise ValueError('Expected object')
    return value`,
        String.raw`assert decode_object(b'{"ok":true}')=={'ok':True} and decode_object(b'{}')=={}
for raw in [b'[]',b'null',b'{broken']:
    try: decode_object(raw)
    except ValueError: pass
    else: raise AssertionError('bad response accepted')`),
    exercise('APIs','Easy','api-get','Fetch JSON with a timeout and owned response cleanup',
        'Implement fetch_json(url,opener=urlopen) for a trusted configured HTTPS endpoint returning a small JSON payload. Supply a five-second urllib timeout, close the response through a context manager, and let HTTP/transport/JSON failures propagate. Use an injected opener in tests.',
        'Own the response lifetime and make transport dependence replaceable.',
        ['Pass timeout=5 and use a with block.','Do not disable TLS verification or replace failures with empty successful JSON.'],
        [['Fake successful response containing {"count":2}','Returns {count:2} and closes response.'],['Malformed JSON response','Parsing fails and response still closes.']],['urlopen responses support context management.','A urllib timeout controls blocking operations, not an absolute whole-workflow deadline.'],
        'Dependency injection makes request parameters and cleanup observable without network access. This small-body example is not a general unbounded-download client; larger responses need a size limit and total deadline policy.',
        String.raw`import json
from urllib.request import urlopen

def fetch_json(url,opener=urlopen):
    with opener(url,timeout=5) as response:
        return json.load(response)`,
        String.raw`import io
calls=[]; responses=[]
def opener(url,timeout):
    calls.append((url,timeout)); r=io.BytesIO(b'{"count":2}'); responses.append(r); return r
assert fetch_json('https://api.example.test/items',opener)=={'count':2}
assert calls==[('https://api.example.test/items',5)] and responses[0].closed
r=io.BytesIO(b'not json')
try: fetch_json('https://api.example.test/items',lambda *a,**k:r)
except ValueError: pass
else: raise AssertionError('invalid JSON')
assert r.closed`),
    exercise('APIs','Easy','api-query','Encode query values rather than concatenating URLs',
        'Implement search_url(base,query,tags) for a trusted HTTPS base URL without an existing query or fragment. Encode q plus repeated tag parameters, preserving spaces, ampersands, slashes, and Unicode as values. Reject unsupported base scheme or preexisting query/fragment.',
        'Keep query data from becoming URL structure.',
        ['Use urlencode with doseq=True.','Do not place authentication secrets in the query; base is trusted configuration, not arbitrary user fetch authority.'],
        [['query a&b, tags [x y,z]','Decoded query has q=a&b and two separate tag values.'],['http base or base with existing query','ValueError under this explicit contract.']],['URL encoding is different from manual string substitution.','Repeated keys are represented by a sequence of values.'],
        'A parsed base enforces the documented URL shape and urlencode handles value delimiters. This helper does not implement SSRF protection or authorize arbitrary destinations; the endpoint remains trusted configuration.',
        String.raw`from urllib.parse import urlsplit,urlunsplit,urlencode

def search_url(base,query,tags):
    parts=urlsplit(base)
    if parts.scheme!='https' or not parts.netloc or parts.query or parts.fragment or parts.username is not None or parts.password is not None:
        raise ValueError('Invalid configured base')
    encoded=urlencode({'q':query,'tag':list(tags)},doseq=True)
    return urlunsplit((parts.scheme,parts.netloc,parts.path,encoded,''))`,
        String.raw`from urllib.parse import parse_qs,urlsplit
u=search_url('https://api.example.test/search','a&b',['x y','z'])
assert parse_qs(urlsplit(u).query)=={'q':['a&b'],'tag':['x y','z']}
assert 'token' not in u
for base in ['http://api.example.test','https://api.example.test?q=x','https://u:p@api.example.test']:
    try: search_url(base,'x',[])
    except ValueError: pass
    else: raise AssertionError('invalid base')`),
    exercise('APIs','Medium','api-errors','Map not-found separately from transport and server failures',
        'Implement load_item(url,opener=urlopen) for a small trusted JSON object endpoint. Return None only for HTTP 404. Wrap other HTTP failures and URLError transport failures in APIError preserving the cause; malformed JSON must remain a parsing failure rather than becoming not-found.',
        'Classify observable API failures without conflating absence and outage.',
        ['Catch HTTPError before URLError because it is a subclass.','Close HTTP error response objects and preserve exception chaining.'],
        [['HTTP 404','None'],['HTTP 503 or transport failure','APIError with original cause.']],['An HTTP error can also own a response body resource.','Limit each catch to the failure category it deliberately maps.'],
        'Known absence has a narrow mapping. Other statuses and transport errors remain failures, and a parsing bug is not reclassified as a missing item. Error-body cleanup is still required when the normal with block is never entered.',
        String.raw`import json
from urllib.request import urlopen
from urllib.error import HTTPError,URLError

class APIError(Exception): pass

def load_item(url,opener=urlopen):
    try:
        with opener(url,timeout=5) as response:
            value=json.load(response)
            if not isinstance(value,dict): raise ValueError('Expected object')
            return value
    except HTTPError as error:
        error.close()
        if error.code==404: return None
        raise APIError(f'HTTP {error.code}') from error
    except URLError as error:
        raise APIError('Transport failure') from error`,
        String.raw`import io
body=io.BytesIO(b'not found'); missing=HTTPError('https://api.example.test',404,'missing',{},body)
def absent(*a,**k): raise missing
assert load_item('https://api.example.test',absent) is None and body.closed
for error in [HTTPError('https://api.example.test',503,'down',{},io.BytesIO(b'')),URLError('offline')]:
    def broken(*a,**k): raise error
    try: load_item('https://api.example.test',broken)
    except APIError as wrapped: assert wrapped.__cause__ is error
    else: raise AssertionError('lost error')
r=io.BytesIO(b'bad')
try: load_item('https://api.example.test',lambda *a,**k:r)
except ValueError: pass
else: raise AssertionError('parse hidden')
assert r.closed`),
    exercise('APIs','Medium','api-pagination','Collect cursor pages with cycle and page-budget protection',
        'Implement collect_items(fetch_page,max_pages) for a synchronous injected function accepting a cursor (initially None) and returning {items:list,next:nonempty-string-or-None}. Preserve item order, reject malformed pages and repeated cursors, and fail when another page would exceed the positive exact integer budget.',
        'Bound API pagination and validate every continuation response.',
        ['Allow an empty items list with a valid continuation.','Do not loop forever on repeated cursors or silently return a truncated success.'],
        [['First items [1], next c1; second items [2], next None','[1,2]'],['next cursor repeats or max_pages is exceeded','ValueError rather than an infinite loop or partial success.']],['A page count and a seen-cursor set bound different failure modes.','Validate next before scheduling another fetch.'],
        'Each page is validated before accumulation. Repeated cursors and exhausted budgets produce explicit failures; this in-memory collector still needs item/byte bounds for very large legitimate collections.',
        String.raw`def collect_items(fetch_page,max_pages):
    if type(max_pages) is not int or max_pages<1: raise ValueError('Invalid budget')
    cursor=None; seen=set(); result=[]
    for _ in range(max_pages):
        if cursor in seen: raise ValueError('Cursor cycle')
        seen.add(cursor)
        page=fetch_page(cursor)
        if not isinstance(page,dict) or not isinstance(page.get('items'),list): raise ValueError('Invalid page')
        nxt=page.get('next')
        if 'next' not in page or (nxt is not None and (not isinstance(nxt,str) or not nxt)): raise ValueError('Invalid cursor')
        result.extend(page['items'])
        if nxt is None: return result
        cursor=nxt
    raise ValueError('Page budget exceeded')`,
        String.raw`pages={None:{'items':[1],'next':'c1'},'c1':{'items':[2],'next':None}}
assert collect_items(pages.__getitem__,2)==[1,2]
assert collect_items(lambda c:{'items':[],'next':None},1)==[]
for fetch,budget in [(lambda c:{'items':[],'next':'x'},4),(pages.__getitem__,1),(lambda c:{'items':'bad','next':None},1)]:
    try: collect_items(fetch,budget)
    except ValueError: pass
    else: raise AssertionError('bad pagination accepted')`),
    exercise('APIs','Medium','api-retry-get','Retry bounded GET statuses with a controlled delay policy',
        'Implement get_with_retry(send,attempts,sleep) where send(method) returns (status,headers,body). Retry GET only for 429 or 503, at most attempts times. Support Retry-After only as nonnegative digit seconds capped at 60; otherwise use capped exponential delays. Raise APIError on terminal non-2xx status.',
        'Make HTTP retry decisions explicit and deterministic.',
        ['Use injected sleep and never sleep after the last failed attempt.','Do not retry other status codes or automatically replay writes.'],
        [['503 then 200, attempts 2','GET twice with one delay and return body.'],['400 on first attempt','APIError immediately with no sleep.']],['A narrow status allowlist avoids treating invalid input as transient.','This exercise supports delay-seconds, not Retry-After HTTP dates.'],
        'The loop owns both maximum attempts and delay placement. Its contract covers idempotent GET status retries only; transport exceptions and total deadlines need additional explicit policies rather than being caught indiscriminately.',
        String.raw`class APIError(Exception): pass

def get_with_retry(send,attempts,sleep):
    if type(attempts) is not int or attempts<1: raise ValueError('Invalid attempts')
    for index in range(attempts):
        status,headers,body=send('GET')
        if 200<=status<300: return body
        if status not in (429,503) or index==attempts-1: raise APIError(f'HTTP {status}')
        raw=headers.get('Retry-After')
        delay=min(int(raw),60) if isinstance(raw,str) and raw.isascii() and raw.isdigit() else min(2**index,30)
        sleep(delay)`,
        String.raw`responses=iter([(503,{'Retry-After':'2'},None),(200,{},'ok')]); waits=[]; methods=[]
def send(method): methods.append(method); return next(responses)
assert get_with_retry(send,2,waits.append)=='ok' and waits==[2] and methods==['GET','GET']
waits=[]
try: get_with_retry(lambda m:(400,{},None),3,waits.append)
except APIError: pass
else: raise AssertionError('400 accepted')
assert waits==[]
responses=iter([(429,{'Retry-After':'999'},None),(503,{},None)])
try: get_with_retry(lambda m:next(responses),2,waits.append)
except APIError: pass
else: raise AssertionError('final status accepted')
assert waits==[60]`),
    exercise('APIs','Hard','api-bounded-body','Read and decode a JSON body under a strict byte limit',
        'Implement bounded_json(url,max_bytes,opener=urlopen) for a small trusted endpoint. Read at most max_bytes+1 response bytes using bounded reads, reject an oversized response before parsing, and close on every path. Validate max_bytes as an exact positive integer; do not trust Content-Length as the sole limit.',
        'Bound response memory independently of declared HTTP metadata.',
        ['Detect an over-limit body by reading one sentinel byte beyond the budget.','Use a timeout, preserve JSON/transport errors, and own response cleanup.'],
        [['Body exactly fits max_bytes','Decode JSON normally.'],['Body exceeds max_bytes despite missing/false Content-Length','ValueError and closed response.']],['Read up to the remaining budget plus one, not an unlimited response.read().','Some streams return fewer bytes than requested before EOF.'],
        'A bounded loop handles partial reads and detects excess using one extra byte. It limits this decoded JSON body input, not arbitrary compressed expansion, complete request time, or the memory amplification of parsed JSON objects.',
        String.raw`import json
from urllib.request import urlopen

def bounded_json(url,max_bytes,opener=urlopen):
    if type(max_bytes) is not int or max_bytes<1: raise ValueError('Invalid byte budget')
    data=bytearray()
    with opener(url,timeout=5) as response:
        while len(data)<=max_bytes:
            part=response.read(min(4096,max_bytes+1-len(data)))
            if not part: break
            data.extend(part)
        if len(data)>max_bytes: raise ValueError('Response too large')
        return json.loads(data.decode('utf-8'))`,
        String.raw`import io
r=io.BytesIO(b'{"x":1}')
assert bounded_json('https://api.example.test',7,lambda *a,**k:r)=={'x':1} and r.closed
r=io.BytesIO(b'{"x":12}')
try: bounded_json('https://api.example.test',7,lambda *a,**k:r)
except ValueError: pass
else: raise AssertionError('oversize accepted')
assert r.closed
class Partial(io.BytesIO):
    def read(self,n=-1): return super().read(min(n,2))
r=Partial(b'[1,2]'); assert bounded_json('https://api.example.test',5,lambda *a,**k:r)==[1,2] and r.closed`),
    exercise('APIs','Hard','api-deadline','Propagate a remaining budget across sequential API calls',
        'Implement fetch_pair(fetch,clock,budget), performing fetch(a,timeout=remaining) then fetch(b,timeout=remaining). Use an injected monotonic clock and a finite positive budget; fail before starting a call when no time remains and also reject completion after the overall deadline.',
        'Distinguish a per-operation timeout from an end-to-end deadline.',
        ['Recalculate remaining time before each call and check after completion.','Preserve fetch failures; the injected fetch must honor its timeout for actual interruption.'],
        [['budget 5, first fetch consumes 2','Second receives timeout 3.'],['first fetch consumes the whole budget','Second never starts and TimeoutError is raised.']],['A fixed timeout reused for every step can exceed the overall budget.','A cooperative transport timeout and a caller deadline are different guarantees.'],
        'The monotonic deadline carries one shared time allowance through sequential work. A post-check rejects late success, but cannot retroactively stop noncooperative work or undo side effects; this exercise uses read calls with an injected timeout-respecting transport.',
        String.raw`import math

def fetch_pair(fetch,clock,budget):
    if not isinstance(budget,(int,float)) or isinstance(budget,bool) or not math.isfinite(budget) or budget<=0:
        raise ValueError('Invalid budget')
    deadline=clock()+budget
    results=[]
    for name in ('a','b'):
        remaining=deadline-clock()
        if remaining<=0: raise TimeoutError('Deadline exceeded')
        results.append(fetch(name,timeout=remaining))
        if clock()>=deadline: raise TimeoutError('Deadline exceeded')
    return tuple(results)`,
        String.raw`now=[0.0]; seen=[]
def fetch(name,timeout):
    seen.append((name,timeout)); now[0]+=2 if name=='a' else 1; return name.upper()
assert fetch_pair(fetch,lambda:now[0],5)==('A','B') and seen==[('a',5.0),('b',3.0)]
now=[0.0]; calls=[]
def slow(name,timeout): calls.append(name); now[0]+=5; return 'late'
try: fetch_pair(slow,lambda:now[0],5)
except TimeoutError: pass
else: raise AssertionError('late success')
assert calls==['a']`),
    exercise('APIs','Hard','api-idempotent-post','Build a retry-safe create client with an explicit server contract',
        'Implement create_job(send,payload,key,attempts) against a server documented to atomically deduplicate POST /jobs by Idempotency-Key and reject mismatched payload reuse. The injected send accepts method,path,json,headers. Retry only an injected UncertainTransportError with the same payload/key and bounded attempts; return only a 201 object with a nonblank string id.',
        'Keep logical operation identity stable through uncertain request outcomes.',
        ['Validate nonblank bounded key and positive attempt limit before sending.','Do not retry terminal HTTP errors or generate a fresh key inside a retry.'],
        [['First response is lost after possible creation; second returns stored 201','Both attempts use the same key/payload, and the client returns the job object.'],['Server returns 409 payload conflict','Raise APIError without replaying a different operation.']],['A timeout does not prove the first POST did nothing.','Safe replay here depends on the stated server idempotency contract, not merely a header name.'],
        'The client preserves one logical operation across transport uncertainty and validates the final response. Payload copies prevent an adapter mutating the caller or later attempt; production use additionally needs bounded backoff/deadline and durable key ownership across client restarts.',
        String.raw`from copy import deepcopy

class UncertainTransportError(Exception): pass
class APIError(Exception): pass

def create_job(send,payload,key,attempts):
    if not isinstance(key,str) or not key.strip() or len(key)>128 or type(attempts) is not int or attempts<1:
        raise ValueError('Invalid operation identity or attempts')
    command=deepcopy(payload)
    for index in range(attempts):
        try:
            status,body=send('POST','/jobs',json=deepcopy(command),headers={'Idempotency-Key':key})
        except UncertainTransportError:
            if index==attempts-1: raise
            continue
        if status!=201: raise APIError(f'HTTP {status}')
        if not isinstance(body,dict) or not isinstance(body.get('id'),str) or not body['id'].strip():
            raise APIError('Invalid response')
        return body`,
        String.raw`seen=[]; payload={'items':[1]}
def send(method,path,json,headers):
    seen.append((method,path,deepcopy(json),dict(headers)))
    json['items'].append(99)
    if len(seen)==1: raise UncertainTransportError('lost response')
    return 201,{'id':'j1'}
assert create_job(send,payload,'op1',2)=={'id':'j1'} and payload=={'items':[1]}
assert seen[0]==seen[1] and seen[0][3]=={'Idempotency-Key':'op1'}
calls=[]
def conflict(*a,**k): calls.append(1); return 409,{}
try: create_job(conflict,payload,'op1',3)
except APIError: pass
else: raise AssertionError('conflict accepted')
assert len(calls)==1
try: create_job(lambda *a,**k:(201,{'id':''}),{},'op2',1)
except APIError: pass
else: raise AssertionError('invalid success')`)
];
