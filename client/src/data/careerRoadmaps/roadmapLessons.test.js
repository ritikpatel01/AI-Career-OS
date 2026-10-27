import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { ROADMAPS } from './careerRoadmapData.js';
import { ROADMAP_LESSONS, ROADMAP_PRACTICE_LESSONS, ROADMAP_EXERCISES, buildLessonPracticeExercises } from './roadmapLearningContent.js';
import { ROADMAP_PRACTICE_BATCHES } from './roadmapPracticeBatches.js';
import { buildRoadmapPracticeCoverage } from './roadmapPracticeCoverage.js';
import { getPracticeCompletionKey } from './roadmapPracticeUtils.js';

test('every actual topic resolves through the exact lookup used by Roadmap.jsx',()=>{
    let count=0;
    for(const [career,roadmap] of Object.entries(ROADMAPS)) for(const phase of roadmap.phases) for(const topic of phase.topics){
        const lesson=ROADMAP_LESSONS[career]?.[phase.title]?.[topic];
        assert.ok(lesson,`${career}/${phase.title}/${topic}`);
        assert.equal(lesson.career,career);assert.equal(lesson.phase,phase.title);assert.equal(lesson.topic,topic);assert.equal(lesson.title,topic);
        for(const key of ['explanation','code','output','useCase','nextStep','language']) assert.ok(typeof lesson[key]==='string'&&lesson[key].trim().length>0,`${topic}:${key}`);
        for(const key of ['objectives','prerequisites','tutorial','mistakes']) assert.ok(Array.isArray(lesson[key])&&lesson[key].length>0,`${topic}:${key}`);
        for(const key of ['question','answer','explanation'])assert.ok(lesson.quiz[key]?.trim(),`${topic}:quiz.${key}`);
        assert.doesNotMatch([lesson.explanation,lesson.code,...lesson.tutorial].join(' '),/has not been authored|lorem ipsum|coming soon|TODO: (implement|replace)/i);
        count++;
    }
    assert.equal(count,285);
    assert.equal(ROADMAP_LESSONS['Backend Developer']['Node.js'].Events.language,'Reference walkthrough');
    assert.equal(ROADMAP_LESSONS['AI Engineer'].Python.Functions.language,'Python');
    assert.notEqual(ROADMAP_LESSONS['AI Engineer'].Python.Functions.code,ROADMAP_LESSONS['Full Stack Developer'].JavaScript.Functions.code);
});

test('all 29 original lessons remain the guided-Practice source with unchanged reading content',()=>{
    let count=0;
    for(const [c,phases] of Object.entries(ROADMAP_PRACTICE_LESSONS))for(const[p,topics]of Object.entries(phases))for(const[t,lesson]of Object.entries(topics)){
        for(const[key,value]of Object.entries(lesson)) assert.deepEqual(ROADMAP_LESSONS[c][p][t][key],value);
        count++;
    }
    assert.equal(count,29);
    let generated=0;
    for(const[c,r]of Object.entries(ROADMAPS))for(const p of r.phases) generated+=buildLessonPracticeExercises(c,p.title,p.topics).length;
    assert.equal(generated,87);
});

test('lesson expansion leaves the published Practice manifest exactly unchanged',async()=>{
    const before=JSON.parse(await readFile(new URL('./roadmapPracticeCoverage.json',import.meta.url),'utf8'));
    const after=buildRoadmapPracticeCoverage();delete before.generatedAt;delete after.generatedAt;assert.deepEqual(after,before);
    for(const[phase,count]of [['Node.js',54],['Express.js',63],['Databases',63]]){
        const definition=ROADMAPS['Backend Developer'].phases.find(p=>p.title===phase);
        const entries=[...(ROADMAP_EXERCISES['Backend Developer']?.[phase]||[]),...ROADMAP_PRACTICE_BATCHES['Backend Developer'][phase],...buildLessonPracticeExercises('Backend Developer',phase,definition.topics)];
        assert.equal(entries.length,count);
        const keys=entries.map(e=>getPracticeCompletionKey(definition,{...e,legacyOutlineId:definition.practice.find(o=>o.id===e.id||o.title.toLowerCase()===e.title.toLowerCase())?.id}));
        assert.equal(new Set(keys).size,count);
        assert.ok(keys.every(k=>k.startsWith(`${phase.toLowerCase().replace(/[^a-z0-9]+/g,'-')}::`)));
    }
});
