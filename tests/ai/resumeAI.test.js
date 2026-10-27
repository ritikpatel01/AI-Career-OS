const test = require('node:test');
const assert = require('node:assert/strict');
const { analyzeResume } = require('../../server/services/resumeAnalysisService');
// Fragment tests target classifier helpers, not document assessability.
// Load private helpers without adding a production bypass or new exports.
const fs = require('node:fs');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const analyzerPath = require.resolve('../../server/services/resumeAnalysisService');
const helperScope = { module: { exports: {} }, require: createRequire(analyzerPath) };
vm.runInNewContext(fs.readFileSync(analyzerPath, 'utf8') + '\nmodule.exports = { parseResumeSections, analyzeSkillEvidence, buildJobDescriptionMatch };', helperScope);
const helpers = helperScope.module.exports;
const analyze = text => analyzeResume(text, 'Full Stack Developer');
const skill = (text, name = 'react') => structuredClone(helpers.analyzeSkillEvidence(helpers.parseResumeSections(text), {}, name));
const validContext = '\nEDUCATION\nBachelor of Science degree from Example University';

for (const statement of [
    'I have no React experience.',
    'Never built a React application.',
    'I am not familiar with React.',
    'I have not built applications using React.',
    "I haven't used React.",
    'React: no experience.'
]) test(`negative evidence: ${statement}`, () => {
    const result = skill(`PROJECTS\n${statement}`);
    assert.equal(result.status, 'missing');
    assert.equal(result.strength, 0);
    assert.equal(result.evidence, null);
});

test('negation applies to the skill clause, not another affirmative clause', () => {
    const text = 'PROJECTS\nNo React experience, but built APIs using Node.js.';
    assert.equal(skill(text).status, 'missing');
    assert.equal(skill(text, 'node.js').status, 'demonstrated');
});
test('not only is affirmative', () => {
    assert.equal(skill('PROJECTS\nNot only built React interfaces but also tested them.').status, 'demonstrated');
});
test('independent positive evidence survives a negative occurrence', () => {
    assert.equal(skill('SUMMARY\nNo React experience before 2020.\nPROJECTS\nBuilt a React dashboard in 2024.').status, 'demonstrated');
});
test('an unrelated action in another clause does not promote a mention', () => {
    assert.equal(skill('PROJECTS\nBuilt APIs; React is a learning interest.').status, 'mentioned');
});
test('preserves the four evidence statuses and response fields', () => {
    for (const [text, status] of [
        ['PROJECTS\nBuilt an application using React.', 'demonstrated'],
        ['EXPERIENCE\nReact application maintenance.', 'supported'],
        ['SKILLS\nReact', 'mentioned'],
        ['SKILLS\nHTML', 'missing']
    ]) {
        const item = skill(text);
        assert.equal(item.status, status);
        for (const key of ['confidence','strength','sources','evidence','evidenceDetails','requirementType','importanceWeight','reason']) assert.ok(key in item);
    }
});
for (const heading of ['Relevant Experience', 'PROFESSIONAL PROJECTS:', '• Professional Projects —']) {
    test(`common heading: ${heading}`, () => assert.equal(skill(`${heading}\nBuilt a React dashboard.`).status, 'demonstrated'));
}
test('inline headings preserve their content', () => {
    assert.equal(skill('Technical Skills: React, JavaScript').status, 'mentioned');
    assert.equal(skill('Professional Projects: Built a React dashboard.').status, 'demonstrated');
});
test('heading-free content is conservatively mentioned', () => {
    assert.equal(skill('Built a React dashboard.').status, 'mentioned');
});
test('ordinary prose containing a heading word remains evidence', () => {
    assert.equal(skill('PROJECTS\nBuilt React projects for internal users.').status, 'demonstrated');
});
test('aliases and word boundaries remain intact', () => {
    assert.equal(skill('SKILLS\nReactJS').status, 'mentioned');
    assert.equal(skill('SKILLS\nreactive programming').status, 'missing');
});
test('outputs are deterministic', () => {
    const text = 'PROJECTS\nBuilt a React dashboard.' + validContext;
    assert.deepEqual(analyze(text), analyze(text));
});


test('a lowercase sentence cannot borrow the preceding action verb', () => {
    assert.equal(skill('PROJECTS\nBuilt internal APIs. react is a learning interest.').status, 'mentioned');
});
test('negative aliases and separate affirmative sentences are handled independently', () => {
    assert.equal(skill('PROJECTS\nNever built ReactJS interfaces.').status, 'missing');
    assert.equal(skill('PROJECTS\nNever used React. Built a React dashboard later.').status, 'demonstrated');
});
test('certification support and introductory mention strengths remain unchanged', () => {
    const certificate = skill('CERTIFICATIONS\nReact development certificate');
    assert.equal(certificate.status, 'supported');
    assert.equal(certificate.strength, 0.70);
    const mention = skill('SKILLS\nReact');
    assert.equal(mention.strength, 0.25);
    assert.equal(mention.confidence, 25);
});
test('multiple denied skills in one clause remain missing', () => {
    const text = 'PROJECTS\nNever built applications using React or Node.js.';
    assert.equal(skill(text).status, 'missing');
    assert.equal(skill(text, 'node.js').status, 'missing');
});

test('negation covers comma-separated skill lists without suppressing a new action clause', () => {
    assert.equal(skill('PROJECTS\nNo experience with React, Node.js.', 'node.js').status, 'missing');
    const text = 'PROJECTS\nNo React experience, built APIs using Node.js.';
    assert.equal(skill(text).status, 'missing');
    assert.equal(skill(text, 'node.js').status, 'demonstrated');
});

const jd = (text, resume = 'PROJECTS\nBuilt a React application.\nEXPERIENCE\nNode.js maintenance\nSKILLS\nDocker') => structuredClone(helpers.buildJobDescriptionMatch(text, helpers.parseResumeSections(resume)));
test('JD absent and blank preserve complete legacy result', () => {
    const text = 'PROJECTS\nBuilt a React app.' + validContext;
    assert.deepEqual(analyze(text), analyzeResume(text, 'Full Stack Developer', '   '));
    const result = analyzeResume(text, 'Full Stack Developer', 'React required');
    delete result.jobDescriptionMatch;
    assert.deepEqual(analyze(text), result);
});
test('JD weights, all evidence statuses, excerpts and arithmetic', () => {
    const result = jd('Required skills\nReact\nPreferred skills\nNode.js\nTechnical skills\nDocker\nSQL');
    assert.equal(result.score, 59);
    assert.equal(result.numerator, 2.95);
    assert.equal(result.denominator, 5);
    assert.deepEqual(result.counts, {matched:1,partiallySupported:1,mentioned:1,missing:1,total:4});
    assert.ok(result.requirements[0].resumeExcerpt.includes('Built'));
    assert.deepEqual(result.requirements[0].jobDescriptionExcerpts, ['React']);
});
test('aliases and repeats do not inflate coverage', () => {
    const result = jd('Requirements\nReactJS\nReact required\nReact preferred');
    assert.equal(result.requirements.length, 1);
    assert.equal(result.denominator, 2);
    assert.equal(result.requirements[0].importance, 'required');
});
test('company, benefits, unnecessary skills and alternatives are excluded', () => {
    const result = jd('About us\nWe use React\nBenefits\nDocker training\nRequirements\nSQL not required\nReact or Angular required');
    assert.equal(result.available, false);
    assert.equal(result.score, null);
    assert.equal(result.denominator, 0);
    assert.equal(result.unassessed.length, 2);
});
test('inline requirement headings and unspecified phrases', () => {
    assert.equal(jd('Requirements: React').requirements[0].importance, 'required');
    assert.equal(jd('Experience with Docker').requirements[0].importance, 'unspecified');
    assert.equal(jd('React preferred').requirements[0].importance, 'preferred');
});
test('JD does not require skills to belong to selected role', () => {
    const result = jd('Python required');
    assert.equal(result.requirements[0].skill, 'python');
});
test('negative resume evidence remains missing for JD', () => {
    assert.equal(jd('React required', 'PROJECTS\nNever built React interfaces.').requirements[0].status, 'missing');
});
test('unknown or non-requirement prose is unavailable', () => {
    assert.equal(jd('We build React products.').available, false);
    assert.equal(jd('Requirements\nUnrecognizedVendorThing').available, false);
});
test('JD input types and length are bounded', () => {
    for (const value of [null, 42, {}, [], 'x'.repeat(20001)]) assert.throws(() => analyzeResume('React', 'Full Stack Developer', value), /Job description/);
});
test('JD results are deterministic and responsive to requirements', () => {
    assert.deepEqual(jd('React required'), jd('React required'));
    assert.equal(jd('React required').score, 100);
    assert.equal(jd('SQL required').score, 0);
});

test('Node.js does not create an incidental JavaScript requirement', () => {
    assert.deepEqual(jd('Node.js required').requirements.map(item => item.skill), ['node.js']);
});
test('multiple aliases on the same line produce one requirement', () => {
    assert.equal(jd('React / ReactJS required').available, false);
    assert.equal(jd('React and ReactJS required').requirements.length, 1);
});
test('optional requirements and ignored sections do not inflate denominator', () => {
    const result = jd('Required skills\nReact\nBenefits\nDocker required for training\nPreferred skills\nSQL optional');
    assert.equal(result.denominator, 2);
    assert.equal(result.requirements[0].skill, 'react');
});

for (const technology of ['sql', 'mysql', 'postgresql']) {
    test(`JD database identity: ${technology}`, () => {
        const result = jd(`Required skills: ${technology}`);
        assert.deepEqual(result.requirements.map(item => item.skill), [technology]);
    });
}
for (const technology of ['SQL', 'MySQL']) {
    test(`${technology} evidence cannot satisfy PostgreSQL`, () => {
        const result = jd('PostgreSQL required', `PROJECTS\nBuilt a ${technology} database.`);
        assert.equal(result.requirements[0].status, 'missing');
        assert.equal(result.score, 0);
    });
}
test('PostgreSQL and Postgres evidence and requirements share one identity', () => {
    const result = jd('Required skills: PostgreSQL, Postgres', 'PROJECTS\nBuilt a Postgres database.');
    assert.equal(result.requirements.length, 1);
    assert.equal(result.requirements[0].skill, 'postgresql');
    assert.equal(result.requirements[0].status, 'demonstrated');
    assert.equal(result.score, 100);
    assert.equal(result.denominator, 2);
});
test('SQL and PostgreSQL remain independently assessable', () => {
    const result = jd('Required skills: SQL, PostgreSQL', 'PROJECTS\nBuilt a PostgreSQL database.');
    assert.deepEqual(result.requirements.map(item => item.skill).sort(), ['postgresql', 'sql']);
    assert.equal(result.requirements.find(item => item.skill === 'sql').status, 'missing');
    assert.equal(result.counts.total, 2);
    assert.equal(result.numerator, 2);
    assert.equal(result.denominator, 4);
    assert.equal(result.score, 50);
});
test('mixed required and preferred phrases retain individual weights', () => {
    const result = jd('Required skills: Python, Django preferred', 'SKILLS\nPython\nPROJECTS\nBuilt a Django app.');
    assert.equal(result.requirements.find(item => item.skill === 'python').weight, 2);
    assert.equal(result.requirements.find(item => item.skill === 'django').weight, 1);
    assert.equal(result.numerator, 1.5);
    assert.equal(result.denominator, 3);
    assert.equal(result.score, 50);
});
for (const text of ['Required skills: Python, Django optional', 'Python required and Django not required', 'Django not necessary; Python required']) {
    test(`exclusion stays local: ${text}`, () => {
        const result = jd(text, 'SKILLS\nPython');
        assert.deepEqual(result.requirements.map(item => item.skill), ['python']);
        assert.equal(result.denominator, 2);
        assert.equal(result.score, 25);
        assert.equal(result.unassessed.length, 1);
    });
}
test('alternative exclusion stays local to its requirement phrase', () => {
    const result = jd('Required skills: React or Angular, Python', 'SKILLS\nPython');
    assert.deepEqual(result.requirements.map(item => item.skill), ['python']);
    assert.equal(result.requirements[0].weight, 2);
    assert.equal(result.unassessed.length, 1);
});
test('ambiguous importance uses unspecified instead of guessing', () => {
    assert.equal(jd('Python required or preferred').requirements.length, 0);
    assert.equal(jd('Python required/preferred').available, false);
    assert.equal(jd('Python required but also preferred').requirements[0].importance, 'unspecified');
});
test('JD fixes preserve legacy database matching and all non-JD results', () => {
    const text = 'PROJECTS\nBuilt a MySQL database.\nSKILLS\nPython' + validContext;
    const baseline = analyze(text);
    assert.equal(baseline.skillDetails.find(item => item.skill === 'sql').status, 'demonstrated');
    for (const description of ['PostgreSQL required', 'Required skills: Python, Django preferred']) {
        const result = analyzeResume(text, 'Full Stack Developer', description);
        delete result.jobDescriptionMatch;
        assert.deepEqual(result, baseline);
    }
});
test('JD database coverage rounding and determinism', () => {
    const text = 'SKILLS\nPostgres\nPROJECTS\nBuilt a Python app.';
    const description = 'Required skills: SQL, PostgreSQL, Python';
    const result = jd(description, text);
    assert.deepEqual(result, jd(description, text));
    assert.equal(result.numerator, 2.5);
    assert.equal(result.denominator, 6);
    assert.equal(result.counts.total, 3);
    assert.equal(result.score, 42);
});

test('unattached list modifiers do not silently assign mandatory weight to neighbors', () => {
    const result = jd('Python, Django required');
    assert.equal(result.requirements.find(item => item.skill === 'python').importance, 'unspecified');
    assert.equal(result.requirements.find(item => item.skill === 'django').importance, 'required');
    assert.equal(result.denominator, 3);
});
test('shared exclusion of a skill conjunction does not invent a positive requirement', () => {
    const result = jd('Required skills: Python and Django optional, React');
    assert.deepEqual(result.requirements.map(item => item.skill), ['react']);
});
test('database product-specific evidence preserves original excerpts and negative filtering', () => {
    const positive = jd('PostgreSQL required', 'PROJECTS\nBuilt a PostgreSQL application.');
    assert.equal(positive.requirements[0].status, 'demonstrated');
    assert.equal(positive.requirements[0].resumeExcerpt, 'Built a PostgreSQL application.');
    const negative = jd('Postgres required', 'PROJECTS\nNever built a Postgres application.');
    assert.equal(negative.requirements[0].status, 'missing');
});

const importanceMap = result => Object.fromEntries(result.requirements.map(item => [item.skill, item.importance]));
test('bare inline labels propagate through the exact required/preferred lists', () => {
    const result = jd('Required: JavaScript, React, Node.js, Express, MongoDB\nPreferred: TypeScript, Docker');
    assert.deepEqual(importanceMap(result), {javascript:'required',react:'required','node.js':'required',express:'required',mongodb:'required',typescript:'preferred',docker:'preferred'});
    assert.equal(result.denominator, 12);
    assert.equal(result.counts.total, 7);
});
for (const separator of ['; ', ' ']) {
    test(`multiple inline labels stay scoped with separator ${JSON.stringify(separator)}`, () => {
        assert.deepEqual(importanceMap(jd(`Required: React, Python${separator}Preferred: Docker, TypeScript`)), {react:'required',python:'required',docker:'preferred',typescript:'preferred'});
    });
}
test('standalone and bullet-prefixed case-varied labels preserve list context', () => {
    assert.deepEqual(importanceMap(jd('• rEqUiReD:\nReact, Python\n- pReFeRrEd:\nDocker, TypeScript')), {react:'required',python:'required',docker:'preferred',typescript:'preferred'});
    assert.deepEqual(importanceMap(jd('* REQUIRED: React, Python\n• preferred: Docker, TypeScript')), {react:'required',python:'required',docker:'preferred',typescript:'preferred'});
});
test('bare labels retain local overrides and exclusions without changing list defaults', () => {
    const result = jd('Required: Python, Django preferred, React optional, Docker\nPreferred: TypeScript, PostgreSQL required');
    assert.deepEqual(importanceMap(result), {python:'required',django:'preferred',docker:'required',typescript:'preferred',postgresql:'required'});
    assert.equal(result.unassessed.length, 1);
});
test('duplicate skills across bare labels retain the strongest importance without double counting', () => {
    for (const text of ['Preferred: React, Python; Required: React', 'Required: React; Preferred: React, Python']) {
        const result = jd(text);
        assert.deepEqual(importanceMap(result), {react:'required',python:'preferred'});
        assert.equal(result.denominator, 3);
        assert.equal(result.counts.total, 2);
    }
});
test('suffix-only ambiguity remains conservative and inline labels do not expand following prose', () => {
    assert.deepEqual(importanceMap(jd('Python, Django required')), {python:'unspecified',django:'required'});
    assert.deepEqual(importanceMap(jd('Preferred: Docker\nExperience building REST APIs and full-stack web applications')), {docker:'preferred'});
});

const insufficientMessage = 'There is not enough recognizable resume information in the extracted text to provide a useful assessment. Upload a text-based resume containing your skills, education, projects, or work history.';
const scoreFields = ['overallScore','matchScore','resumeMatch','skillScore','resumeQuality','atsScore','scores','scoreBreakdown','resumeHealth','jobDescriptionMatch'];
for (const [name, text] of [
    ['single generic word', 'Presentation'],
    ['unrelated prose', 'This is a grocery shopping list: bread milk eggs apples.'],
    ['symbol-heavy fragment', '### @@@ *** Presentation ### %%%'],
    ['contact details alone', 'person@example.test\n+1 202 555 0199\nhttps://github.com/example'],
    ['empty headings', 'SKILLS\nEDUCATION\nEXPERIENCE\nPROJECTS'],
    ['repeated skills', 'SKILLS\nReact React React Python Python Python'],
    ['minimal extracted artifact', '9\nPresentation'],
    ['headings and repeated action keywords', 'PROJECTS\nBuilt React React React React React'],
    ['fallback metrics without content', 'EXPERIENCE\nPROJECTS\nPresentation']
]) {
    test(`assessability rejects ${name} without calculated scores`, () => {
        const result = analyze(text);
        assert.equal(result.success, false);
        assert.equal(result.supportedRole, true);
        assert.equal(result.message, insufficientMessage);
        for (const key of scoreFields) assert.equal(Object.hasOwn(result, key), false, key);
    });
}
test('JD skills cannot make unrelated resume text assessable', () => {
    const result = analyzeResume('Presentation', 'Full Stack Developer', 'Required: React, Python, SQL');
    assert.equal(result.success, false);
    for (const key of scoreFields) assert.equal(Object.hasOwn(result, key), false);
});

// Baselines captured from the pre-change analyzer, not newly accepted values.
const assessableFixtures = [
    ['heading-free narrative', 'Bachelor of Science degree from Example University.\nBuilt a scheduling application using Python for local volunteers.', {overall:11,roleAlignment:0,technicalSkills:0,resumeQuality:27,atsCompatibility:53}],
    ['anonymized project resume', 'SKILLS\nReact PostgreSQL\nPROJECTS\nBuilt a React application using PostgreSQL for appointment scheduling.', {overall:30,roleAlignment:10,technicalSkills:11,resumeQuality:60,atsCompatibility:67}],
    ['student without employment', 'EDUCATION\nBachelor of Science degree from Example University\nPROJECTS\nDesigned a working solar irrigation prototype for the campus garden.', {overall:24,roleAlignment:0,technicalSkills:0,resumeQuality:60,atsCompatibility:67}],
    ['employment without Skills section', 'EMPLOYMENT\nCoordinated patient appointments and maintained accurate clinic schedules for the nursing team.\nManaged patient intake records and improved communication between staff and local clinics.', {overall:20,roleAlignment:0,technicalSkills:0,resumeQuality:50,atsCompatibility:60}],
    ['legitimate zero-role-alignment resume', 'EDUCATION\nBachelor of Fine Arts degree from Example University\nPROJECTS\nDesigned printed exhibition posters and illustrated a community history booklet.', {overall:24,roleAlignment:0,technicalSkills:0,resumeQuality:60,atsCompatibility:67}]
];
const legacyFields = ['success','targetRole','normalizedRole','supportedRole','overallScore','matchScore','resumeMatch','skillScore','resumeQuality','atsScore','scoreInterpretations','scores','roleSummary','matchedSkills','missingSkills','weakSkills','skillDetails','evidenceSummary','evidenceReport','requirementBreakdown','resumeHealth','sectionSummary','strengths','weakAreas','recommendations','scoreBreakdown','scoreMethodology','limitations','analysisVersion'];
for (const [name, text, expectedScores] of assessableFixtures) {
    test(`assessability accepts ${name} with preserved scores and response fields`, () => {
        const result = analyze(text);
        assert.equal(result.success, true);
        assert.deepEqual(result.scores, expectedScores);
        assert.deepEqual(Object.keys(result), legacyFields);
        const withJd = analyzeResume(text, 'Full Stack Developer', 'React required');
        assert.ok(withJd.jobDescriptionMatch);
        delete withJd.jobDescriptionMatch;
        assert.deepEqual(withJd, result);
    });
}
test('content-rich project narrative can stand alone without contact or education', () => {
    const result = analyze('Designed a working solar irrigation prototype for the campus garden.\nBuilt a monitoring system that records soil conditions and controls water delivery.');
    assert.equal(result.success, true);
});
