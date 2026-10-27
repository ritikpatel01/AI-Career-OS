// Controller boundary tests: all dependencies are stubbed; no HTTP or DB writes.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { extractResumeText, ResumeDocumentError } = require('../../server/services/resumeParserService');
const { analyzeResume: realAnalyzeResume } = require('../../server/services/resumeAnalysisService');
const source = fs.readFileSync(require.resolve('../../server/controllers/resumeController'), 'utf8');
const harness = (options = {}) => {
    const calls = [];
    const logs = [];
    let parses = 0;
    const context = { module: { exports: {} }, console: { log() {}, error(...args) { logs.push(args); } }, require(name) {
        if (name.endsWith('/resumeService')) return {};
        if (name.endsWith('/resumeParserService')) return { ResumeDocumentError, extractResumeText: async file => { parses++; return options.parser ? options.parser(file) : 'Synthetic resume text'; } };
        if (name.endsWith('/resumeAnalysisService')) return { analyzeResume: (...args) => { calls.push(args); return options.realAnalyzer ? realAnalyzeResume(...args) : { success: true, supportedRole: true }; } };
        throw new Error(`Unexpected dependency ${name}`);
    }};
    vm.runInNewContext(source, context);
    const invoke = async (body, file = { originalname: 'synthetic.pdf', mimetype: 'application/pdf', size: 1 }) => {
        const res = { code: 200, status(code) { this.code = code; return this; }, json(data) { this.data = data; return this; } };
        await context.module.exports.analyzeResume({ body, user: { userId: 'test-only' }, file }, res);
        return res;
    };
    return { invoke, calls, logs, parses: () => parses };
};
test('controller forwards trimmed optional description and preserves response envelope', async () => {
    const h = harness();
    const res = await h.invoke({targetRole:'Full Stack Developer', jobDescription:' React required '});
    assert.equal(res.code, 200);
    assert.deepEqual(h.calls[0], ['Synthetic resume text', 'Full Stack Developer', 'React required']);
    assert.equal(res.data.success, true);
    assert.equal(res.data.data.fileName, 'synthetic.pdf');
});
test('missing and blank descriptions remain optional', async () => {
    const h = harness();
    for (const body of [{targetRole:'Full Stack Developer'}, {targetRole:'Full Stack Developer', jobDescription:'  '}]) {
        assert.equal((await h.invoke(body)).code, 200);
        assert.equal(h.calls.at(-1)[2], '');
    }
});
test('invalid description types and length rejected before parsing', async () => {
    const h = harness();
    for (const jobDescription of [null, {}, [], 42, 'x'.repeat(20001)]) {
        const res = await h.invoke({targetRole:'Full Stack Developer',jobDescription});
        assert.equal(res.code, 400);
    }
    assert.equal(h.parses(), 0);
    assert.equal(h.calls.length, 0);
});

// Actual PDF/DOCX bytes generated in memory, never saved or uploaded.
const { createRequire } = require('node:module');
const serverRequire = createRequire(require.resolve('../../server/package.json'));
const JSZip = serverRequire('jszip'); // Already used by the installed DOCX stack.
const docxMime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const resumeLines = ['SKILLS', 'Python, React, PostgreSQL', 'PROJECTS', 'Built a React application using PostgreSQL.', 'EXPERIENCE', 'Developed Python automation tools.'];
const makePdf = (kind = 'text', lines = resumeLines) => {
    const content = kind === 'text' ? 'BT /F1 12 Tf 50 780 Td ' + lines.map((line, index) => (index ? '0 -20 Td ' : '') + `(${line}) Tj`).join('\n') + ' ET' : kind === 'image' ? 'q 100 0 0 100 50 500 cm /Im1 Do Q' : '';
    const objects = [
        '<< /Type /Catalog /Pages 2 0 R >>',
        '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
        '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R >> /XObject << /Im1 6 0 R >> >> /Contents 5 0 R >>',
        '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
        `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
        '<< /Type /XObject /Subtype /Image /Width 1 /Height 1 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Length 3 >>\nstream\nRGB\nendstream'
    ];
    let body = '%PDF-1.4\n';
    const offsets = [];
    objects.forEach((object, index) => { offsets.push(Buffer.byteLength(body)); body += `${index + 1} 0 obj\n${object}\nendobj\n`; });
    const xref = Buffer.byteLength(body);
    body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n` + offsets.map(offset => String(offset).padStart(10, '0') + ' 00000 n \n').join('') + `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
    return { mimetype: 'application/pdf', buffer: Buffer.from(body) };
};
const makeDocx = async (lines = resumeLines) => {
    const zip = new JSZip();
    zip.file('[Content_Types].xml', '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
    zip.file('_rels/.rels', '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
    zip.file('word/document.xml', '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>' + lines.map(line => `<w:p><w:r><w:t>${line}</w:t></w:r></w:p>`).join('') + '</w:body></w:document>');
    return { mimetype: docxMime, buffer: await zip.generateAsync({ type: 'nodebuffer' }) };
};

test('real PDF and DOCX preserve sections and analyzer/JD results without page artifacts', async () => {
    const baseline = realAnalyzeResume(resumeLines.join('\n'), 'Full Stack Developer', 'Required skills: React, PostgreSQL, Python');
    for (const file of [makePdf(), await makeDocx()]) {
        const text = await extractResumeText(file);
        for (const line of resumeLines) assert.ok(text.includes(line));
        assert.ok(!text.includes('-- 1 of 1 --'));
        const analysis = realAnalyzeResume(text, 'Full Stack Developer', 'Required skills: React, PostgreSQL, Python');
        assert.deepEqual(analysis.scores, baseline.scores);
        assert.deepEqual(analysis.resumeHealth, baseline.resumeHealth);
        assert.deepEqual(analysis.jobDescriptionMatch, baseline.jobDescriptionMatch);
        assert.equal(analysis.jobDescriptionMatch.score, 100);
    }
});
test('blank and image-only PDFs reject page-label-only extraction with OCR guidance', async () => {
    for (const kind of ['blank', 'image']) await assert.rejects(extractResumeText(makePdf(kind)), error => error instanceof ResumeDocumentError && /readable text/i.test(error.message) && /OCR/.test(error.message));
});
test('empty DOCX, missing file, zero bytes, and unsupported files are document errors', async () => {
    for (const file of [await makeDocx([]), undefined, {mimetype:'application/pdf',buffer:Buffer.alloc(0)}, {mimetype:'text/plain',buffer:Buffer.from('synthetic')}]) {
        await assert.rejects(extractResumeText(file), ResumeDocumentError);
    }
});
test('malformed documents and unreadable PDFs produce sanitized 422 controller responses', async () => {
    for (const file of [
        {mimetype:'application/pdf',buffer:Buffer.from('%PDF-1.4\nprivate-synthetic-marker')},
        {mimetype:docxMime,buffer:Buffer.from('private-synthetic-marker')},
        makePdf('blank'), makePdf('image'), await makeDocx([])
    ]) {
        const h = harness({parser:extractResumeText,realAnalyzer:true});
        const res = await h.invoke({targetRole:'Full Stack Developer'}, file);
        assert.equal(res.code, 422);
        assert.equal(res.data.success, false);
        assert.equal(h.calls.length, 0);
        assert.ok(!JSON.stringify(res.data).includes('private-synthetic-marker'));
        assert.ok(!JSON.stringify(h.logs).includes('private-synthetic-marker'));
        assert.ok(!/Invalid PDF structure|central directory|stack|jszip/i.test(JSON.stringify(res.data)));
    }
});
test('real extraction reaches controller analyzer with trimmed job description', async () => {
    const h = harness({parser:extractResumeText,realAnalyzer:true});
    const res = await h.invoke({targetRole:'Full Stack Developer',jobDescription:' React required '}, makePdf());
    assert.equal(res.code, 200);
    assert.ok(h.calls[0][0].includes('Built a React application'));
    assert.equal(h.calls[0][2], 'React required');
    assert.equal(res.data.data.analysis.jobDescriptionMatch.score, 100);
});
test('unexpected internal parser failure remains sanitized HTTP 500', async () => {
    const h = harness({parser:async()=>{throw new Error('private-internal-marker');}});
    const res = await h.invoke({targetRole:'Full Stack Developer'});
    assert.equal(res.code, 500);
    assert.equal(res.data.error, 'Resume analysis failed');
    assert.ok(!JSON.stringify([res.data,h.logs]).includes('private-internal-marker'));
});

const parserSource = fs.readFileSync(require.resolve('../../server/services/resumeParserService'), 'utf8');
const mockParser = (getText, destroy) => {
    const context = {module:{exports:{}},Buffer,require(name){
        if(name==='pdf-parse')return{PDFParse:class{getText(){return getText();}destroy(){return destroy();}}};
        if(name==='mammoth')return{};
        throw new Error('Unexpected dependency');
    }};
    vm.runInNewContext(parserSource,context);
    return context.module.exports;
};
test('PDF cleanup runs on success, extraction failure, and unreadable content', async () => {
    for (const mode of ['success','failure','empty']) {
        let destroyed = 0;
        const api = mockParser(async()=>{
            if(mode==='failure')throw Object.assign(new Error('private-detail'),{name:'InvalidPDFException'});
            return{text:mode==='empty'?'-- 1 of 1 --':'SKILLS\nReact'};
        },async()=>{destroyed++;});
        const pending = api.extractResumeText({mimetype:'application/pdf',buffer:Buffer.from('test')});
        if(mode==='success')assert.equal(await pending,'SKILLS\nReact');
        else await assert.rejects(pending);
        assert.equal(destroyed,1);
    }
});
test('cleanup failure does not replace original document failure', async () => {
    const api = mockParser(async()=>{throw Object.assign(new Error('invalid'),{name:'InvalidPDFException'});},async()=>{throw new Error('cleanup failure');});
    await assert.rejects(api.extractResumeText({mimetype:'application/pdf',buffer:Buffer.from('test')}), api.ResumeDocumentError);
});
test('page-marker cleanup preserves inline content and handles multiple pages', async () => {
    const api = mockParser(async()=>({text:'SKILLS\nReact\n-- 1 of 2 --\nPROJECTS\nBuilt React interfaces.\n-- 2 of 2 --\nNote -- 1 of 1 -- retained'}),async()=>{});
    const text = await api.extractResumeText({mimetype:'application/pdf',buffer:Buffer.from('test')});
    assert.ok(!text.includes('-- 1 of 2 --'));
    assert.ok(!text.includes('-- 2 of 2 --'));
    assert.ok(text.includes('Note -- 1 of 1 -- retained'));
});

test('page markers are removed with CRLF line endings', async () => {
    const api = mockParser(async()=>({text:'SKILLS\r\nReact\r\n-- 1 of 1 --\r\n'}),async()=>{});
    const text = await api.extractResumeText({mimetype:'application/pdf',buffer:Buffer.from('test')});
    assert.equal(text,'SKILLS\r\nReact');
});
test('unexpected PDF errors still clean up and remain internal failures', async () => {
    let destroyed = 0;
    const failure = new Error('synthetic internal failure');
    const api = mockParser(async()=>{throw failure;},async()=>{destroyed++;});
    await assert.rejects(api.extractResumeText({mimetype:'application/pdf',buffer:Buffer.from('test')}), error => error === failure);
    assert.equal(destroyed,1);
});

test('readable unrelated PDF and DOCX content uses existing HTTP 422 envelope without scores', async () => {
    for (const file of [makePdf('text', ['Presentation']), await makeDocx(['This is a grocery shopping list: bread milk eggs apples.'])]) {
        const h = harness({parser:extractResumeText,realAnalyzer:true});
        const res = await h.invoke({targetRole:'Full Stack Developer',jobDescription:'Required: React, Python, SQL'}, file);
        assert.equal(res.code, 422);
        assert.equal(res.data.success, false);
        assert.match(res.data.message, /not enough recognizable resume information/);
        assert.equal(res.data.data.analysis.success, false);
        assert.equal(h.calls.length, 1); // The file was readable, not a parsing failure.
        for (const key of ['scores','overallScore','atsScore','resumeHealth','jobDescriptionMatch']) assert.equal(Object.hasOwn(res.data.data.analysis,key), false);
    }
});
test('unconventional DOCX remains assessable even with zero role alignment', async () => {
    const h = harness({parser:extractResumeText,realAnalyzer:true});
    const file = await makeDocx(['Bachelor of Fine Arts degree from Example University.', 'Designed printed exhibition posters and illustrated a community history booklet.']);
    const res = await h.invoke({targetRole:'Full Stack Developer'}, file);
    assert.equal(res.code, 200);
    assert.equal(res.data.data.analysis.success, true);
    assert.equal(res.data.data.analysis.scores.roleAlignment, 0);
});
