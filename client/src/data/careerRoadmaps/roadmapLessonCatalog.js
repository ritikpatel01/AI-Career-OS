import { ROADMAPS } from './careerRoadmapData.js';
import { ROADMAP_PRACTICE_BATCHES } from './roadmapPracticeBatches.js';
import { AI_TOPIC_LESSONS } from './roadmapSupplementalLessons.js';

// Explicit cross-track reuse, never a global title-only search: Events in a
// Node phase must not resolve to DOM events, and Python functions need Python.
const reuse = {
    'Backend Developer': {
        'Authentication & Security': ['Full Stack Developer','Authentication & Security', {OWASP:'OWASP Basics'}],
        'Deployment & System Design': ['Full Stack Developer','DevOps & Deployment', {Cloud:'Cloud Basics'}]
    },
    'AI Engineer': {
        'LLM Engineering': ['AI Engineer','RAG',{}],
        'AI Applications': ['Full Stack Developer','DevOps & Deployment',{}]
    }
};
const alternate = {
    Authorization:['Full Stack Developer','Backend Development','Authorization'],
    OWASP:['Full Stack Developer','Web Security','OWASP Basics'],
    Caching:['Full Stack Developer','System Design','Caching'],
    Queues:['Full Stack Developer','System Design','Queues'],
    Scalability:['Full Stack Developer','System Design','Scalability']
};

export const buildLessonCatalog = (originalLessons, originalExercises) => {
    const exercisesFor = (career,phase,topic) => [
        ...(originalExercises[career]?.[phase] || []),
        ...(ROADMAP_PRACTICE_BATCHES[career]?.[phase] || [])
    ].filter(e=>e.topic===topic);
    const fromExercises = (entries) => {
        const foundation = entries.find(e=>e.difficulty==='Easy') || entries[0];
        const extension = entries.find(e=>e.difficulty==='Medium') || foundation;
        const steps = foundation.examples.map(example => `${example.input} → ${example.output}. ${example.explanation || ""}`);
        return {
            explanation: foundation.walkthrough + (extension !== foundation ? `\n\n${extension.walkthrough}` : ""),
            prerequisites: foundation.prerequisites?.length ? foundation.prerequisites : ['Basic request/response flow and typed data'],
            objectives: foundation.learningObjectives,
            tutorial: [...new Set([...steps, extension.walkthrough])],
            code: foundation.solutionCode,
            output: foundation.examples.map(e=>`${e.input} → ${e.output}`).join('\n'),
            mistakes: foundation.commonMistakes?.length ? foundation.commonMistakes : foundation.requirements.map(r=>`Skipping this check: ${r}`),
            useCase: foundation.problemStatement,
            quiz: {question:foundation.examples[1].input,answer:foundation.examples[1].output,explanation:foundation.examples[1].explanation || foundation.walkthrough},
            nextStep: extension.followUp,
            language: foundation.kind==='written' ? 'Reference walkthrough' : foundation.language || 'Code',
            sourceExerciseIds: [...new Set([foundation.id,extension.id])]
        };
    };
    const catalog = {};
    for (const [career,roadmap] of Object.entries(ROADMAPS)) {
        catalog[career] = {};
        for (const phase of roadmap.phases) {
            const mapped = catalog[career][phase.title] = {};
            for (const topic of phase.topics) {
                let content = originalLessons[career]?.[phase.title]?.[topic];
                if (!content) {
                    const own = exercisesFor(career,phase.title,topic);
                    if (own.length) content = fromExercises(own);
                }
                // AI lessons are authored in the language/domain of that track.
                if (!content && career==='AI Engineer') content = AI_TOPIC_LESSONS[topic];
                if (!content) {
                    const mapping = reuse[career]?.[phase.title];
                    if (mapping) {
                        const [sourceCareer,sourcePhase,names] = mapping;
                        const sourceTopic = names[topic] || topic;
                        content = originalLessons[sourceCareer]?.[sourcePhase]?.[sourceTopic];
                        const entries = exercisesFor(sourceCareer,sourcePhase,sourceTopic);
                        if (!content && entries.length) content = fromExercises(entries);
                    }
                }
                if (!content && career==='Backend Developer' && alternate[topic]) {
                    const [c,p,t] = alternate[topic];
                    const entries = exercisesFor(c,p,t);
                    if (entries.length) content=fromExercises(entries);
                }
                if (!content) throw new Error(`Missing authored lesson: ${career} / ${phase.title} / ${topic}`);
                mapped[topic] = {...content,career,phase:phase.title,topic,title:topic,language:content.language || 'JavaScript'};
            }
        }
    }
    return catalog;
};
