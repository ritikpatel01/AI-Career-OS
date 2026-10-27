import { FULL_STACK_JOB_PREPARATION_PRACTICE } from "./roadmapPracticeJobPreparation.js";
import { REAL_WORLD_PROJECT_EXERCISES } from "./roadmapPracticeProjectsMore.js";
import { FULL_STACK_INTERVIEW_PRACTICE } from "./roadmapPracticeInterview.js";
import { FULL_STACK_DSA_PRACTICE_EXERCISES } from "./roadmapPracticeDSA.js";
import { FULL_STACK_DSA_FINAL_EXERCISES } from "./roadmapPracticeDSAFinal.js";

const slug = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const reassign = (items, topic) => items.map((item) => ({
    ...item,
    id: `frontend-projects-${slug(topic)}-${item.id}`,
    career: "Frontend Developer",
    phase: "Projects & Interview",
    topic,
    conceptsToReview: [...new Set([topic, ...(item.conceptsToReview || [])])],
    learningObjectives: [...new Set([`Apply ${topic} practices in a frontend project context.`, ...(item.learningObjectives || [])])]
}));

const dashboardPrompts = {
    Dashboard: [
        ["Easy", "Build a responsive metric summary", "Create a dashboard summary row for active projects, completed tasks, and overdue tasks. Given records with status and dueDate, derive each count from the records rather than hardcoding totals. Keep the layout usable at a narrow viewport.", "For the sample records, active=2, completed=1, overdue=1. The count is derived from the same record set shown below the cards.", "A completed task with a past due date is not also counted as overdue.", "const summary = tasks.reduce((s, task) => { if (task.status === 'completed') s.completed++; else if (task.dueDate && new Date(task.dueDate) < now) s.overdue++; else s.active++; return s; }, { active:0, completed:0, overdue:0 });\nreturn <section className='summary-grid'>{/* render each derived value */}</section>;", "Add a loading and API-error state so placeholder zeroes are not presented as account data."],
        ["Easy", "Create an empty dashboard state", "A new user has no projects or activity. Design a dashboard empty state that distinguishes a successful empty API result from loading and failure, offers a relevant create-project action, and does not show invented activity.", "Successful data=[] shows a helpful prompt and create link; loading shows status; failed fetch shows retryable error.", "A rejected request must never be converted into data=[] and labeled 'No projects yet'.", "type State = {status:'loading'} | {status:'error'; retry:()=>void} | {status:'success'; projects:Project[]};\nfunction ProjectsPanel({state}:Props){ if(state.status==='loading')return <p role='status'>Loading projects…</p>; if(state.status==='error')return <button onClick={state.retry}>Retry projects</button>; return state.projects.length ? <ProjectList items={state.projects}/> : <EmptyProjects/>; }", "Test the three states independently and verify the create action points to an existing route."],
        ["Easy", "Render recent activity with semantic time", "A dashboard receives three activity records containing action, actor, and ISO timestamp. Render newest first, use a semantic time element, and show an honest 'No recent activity' state when the successful response is empty.", "Sort a copied array newest-first and format each timestamp for display while preserving its machine-readable datetime.", "An invalid or missing timestamp should not crash the list or be presented as a verified date.", "const ordered = [...activities].sort((a,b) => Date.parse(b.createdAt)-Date.parse(a.createdAt));\nreturn ordered.map(item => <li key={item.id}><span>{item.summary}</span><time dateTime={item.createdAt}>{formatDate(item.createdAt)}</time></li>);", "Add a test for tied timestamps with a stable ID tie-breaker."],
        ["Medium", "Coordinate dashboard data requests", "A dashboard loads profile, project, and progress data independently. Model loading and partial failure explicitly so one failed panel does not silently erase successful data from the others.", "Use independent panel states or a typed aggregate that retains successful values; give each failed panel its own retry and avoid claiming every dashboard metric loaded.", "A late response for the previous signed-in account must not populate the current account's dashboard.", "const [panels,setPanels]=useState(initialPanels);\nuseEffect(()=>{const controller=new AbortController();loadPanels({signal:controller.signal}).then(setPanels).catch(()=>setPanels(s=>({...s,progress:{status:'error'}})));return()=>controller.abort();},[userId]);", "Test one panel failing while two succeed, then switch users before a pending request resolves."],
        ["Medium", "Keep dashboard filters in the URL", "An activity panel can filter by project and date range. Implement controlled filters backed by search parameters so refresh and browser Back restore the visible selection without putting private record contents in the URL.", "Store only non-sensitive filter identifiers and date bounds, validate them on read, and update the URL while preserving unrelated query parameters.", "A malformed date or unauthorized project ID must produce a safe empty/error state, not reveal another user's records.", "const [params,setParams]=useSearchParams();\nconst projectId=params.get('project')||'';\nfunction setProject(id:string){setParams(current=>{const next=new URLSearchParams(current);id?next.set('project',id):next.delete('project');return next;});}", "Add a server-side ownership check for the selected project; client filters are not authorization."],
        ["Medium", "Make a dashboard chart understandable without color", "A completion chart uses blue and gray segments only. Add a textual summary and accessible labels so a color-blind user and screen reader user can understand the same values.", "Expose the chart's data in a nearby text list or table, label each series and period, and retain sufficient contrast for visual distinctions.", "A chart whose colors differ but whose legend is hidden is not self-explanatory.", "<figure><figcaption>Tasks completed this month: 8 of 12</figcaption><ProgressChart aria-hidden='true' values={values}/><ul>{values.map(v=><li key={v.label}>{v.label}: {v.value}</li>)}</ul></figure>", "Test keyboard/screen-reader reading order and verify values match the chart data source."],
        ["Hard", "Prevent stale dashboard panels after account switching", "User A's project request is pending when the app switches to user B. Ensure all dashboard panels are keyed to the current identity and stale responses cannot leak across the account boundary.", "Abort or invalidate requests on identity change, clear prior private data immediately, and commit responses only for the request sequence and current user.", "If user B's request fails, user A's stale project names must remain hidden rather than appearing as fallback content.", "const requestId=useRef(0);\nuseEffect(()=>{const id=++requestId.current;setState({status:'loading'});loadDashboard().then(data=>{if(requestId.current===id)setState({status:'success',data});});return()=>{requestId.current++;};},[userId]);", "Add a test resolving A after B and inspect the rendered DOM for any A-only text."],
        ["Hard", "Design an actionable dashboard recommendation", "A dashboard should recommend one next action using only recorded project and roadmap data. Define the decision order, handle missing and tied progress, and link to a real feature rather than inventing an AI insight.", "Use deterministic rules over verified records, explain the evidence behind the chosen action, and fall back to a neutral setup prompt when there is insufficient data.", "An empty progress array cannot identify a strongest or weakest category; equal values need a stable neutral result.", "function nextAction(progress:Progress[],projects:Project[]) { const recorded=progress.filter(x=>Number.isFinite(x.percent)); if(!recorded.length)return {label:'Choose a career goal',to:'/roadmap',reason:'No progress has been recorded yet.'}; const incomplete=recorded.filter(x=>x.percent>0&&x.percent<100).sort((a,b)=>a.percent-b.percent); if(incomplete.length)return {label:`Continue ${incomplete[0].name}`,to:'/roadmap',reason:`Recorded progress is ${incomplete[0].percent}%.`}; if(!projects.length)return {label:'Add a project',to:'/projects',reason:'No projects are recorded.'}; return {label:'Review your roadmap',to:'/roadmap',reason:'Recorded areas are complete.'}; }", "Test empty, partial, tied, all-complete, and malformed records; verify each destination route exists."],
        ["Hard", "Design a resilient dashboard loading strategy", "The dashboard has six API-backed panels and one slow endpoint. Plan progressive rendering, request cancellation, retry boundaries, and layout stability so fast panels remain useful without presenting mixed-account or misleading stale data.", "Give panels independent loading/error states, reserve space for stable layout, cancel or ignore stale identity requests, and identify any cross-panel data dependency before parallelizing.", "A generic page-level error should not hide which panel failed or imply that all other data is invalid.", "const [profile,projects,progress] = await Promise.allSettled([loadProfile(signal),loadProjects(signal),loadProgress(signal)]);\nreturn {profile:toPanel(profile),projects:toPanel(projects),progress:toPanel(progress)};", "Define telemetry that distinguishes slow response, provider failure, and client rendering delay without logging private payloads."]
    ]
};

const buildDashboardExercise = ([difficulty, title, problem, answer, edge, solution, followUp], index) => ({
    id: `frontend-projects-dashboard-${difficulty.toLowerCase()}-${index + 1}-v1`,
    career: "Frontend Developer", phase: "Projects & Interview", topic: "Dashboard", title, difficulty,
    estimatedTime: difficulty === "Easy" ? "25–35 minutes" : difficulty === "Medium" ? "35–50 minutes" : "50–70 minutes",
    kind: "coding", language: "React / JavaScript",
    problemStatement: `${problem} Define the acceptance criteria and explain how you will verify them with realistic dashboard data.`,
    simplerProblem: `Implement this first: ${answer}`,
    requirements: ["Derive displayed values from the supplied records or request state; do not add demo account data.", "Keep loading, successful empty, and failed requests distinct.", "Use stable record identity and preserve keyboard-accessible controls."],
    examples: [{input:problem,output:answer,explanation:"The expected result applies the stated dashboard requirement to its primary scenario."},{input:edge,output:solution,explanation:"The second case verifies an important boundary or failure condition."}],
    tests: [{name:"Primary dashboard behavior",input:problem,expected:answer},{name:"Boundary behavior",input:edge,expected:solution}],
    hints: ["Trace each displayed value to the real record or API state that supports it.", "Exercise empty, error, delayed, and account-change cases in addition to the happy path."],
    learningObjectives:["Build a dashboard behavior that communicates real account data accurately.","Explain its state transitions, accessibility behavior, and verification strategy."],
    conceptsToReview:["Dashboard architecture","Async UI state","Data accuracy","Accessibility"], prerequisites:[],
    approach:"Identify the data contract and state transitions first. Implement a narrow component or selector, then verify the normal result, the empty case, and the failure/race case without substituting fabricated values.",
    walkthrough:`For the primary case, ${answer} For the boundary case, ${edge} Use the reference implementation as a starting point, adapt its types and service names to the real project, and assert what the user sees after each transition.`,
    solutionCode:solution, solutionLines:[answer,edge,solution],
    commonMistakes:["Using a default zero or empty array to hide an API failure.","Updating the interface from a stale response after the signed-in user or filter has changed."],
    followUp, completionCriteria:["The primary scenario displays the correct value or state.","The boundary case cannot create false success or leak stale data.","A repeatable test covers the user-visible result."],
    starterCode:"function DashboardPanel({ data, status }) {\n  // Derive the visible state from the confirmed request result.\n}\n"
});

const interviewSources = [
    ...FULL_STACK_INTERVIEW_PRACTICE["React Interview"].filter((item) => item.difficulty === "Easy").slice(0, 2),
    ...FULL_STACK_INTERVIEW_PRACTICE["JavaScript Interview"].filter((item) => item.difficulty === "Easy").slice(0, 1),
    ...FULL_STACK_INTERVIEW_PRACTICE["React Interview"].filter((item) => item.difficulty === "Medium").slice(0, 2),
    ...FULL_STACK_INTERVIEW_PRACTICE["JavaScript Interview"].filter((item) => item.difficulty === "Medium").slice(0, 1),
    ...FULL_STACK_INTERVIEW_PRACTICE["React Interview"].filter((item) => item.difficulty === "Hard").slice(0, 2),
    ...FULL_STACK_INTERVIEW_PRACTICE["JavaScript Interview"].filter((item) => item.difficulty === "Hard").slice(0, 1)
];

const dsaSources = [
    FULL_STACK_DSA_PRACTICE_EXERCISES.Arrays[0],
    FULL_STACK_DSA_PRACTICE_EXERCISES.Strings[0],
    FULL_STACK_DSA_PRACTICE_EXERCISES["Hash Maps"][0],
    FULL_STACK_DSA_PRACTICE_EXERCISES["Binary Search"][3],
    FULL_STACK_DSA_PRACTICE_EXERCISES["Linked Lists"][3],
    FULL_STACK_DSA_PRACTICE_EXERCISES.Stacks[3],
    FULL_STACK_DSA_PRACTICE_EXERCISES.Trees[6],
    FULL_STACK_DSA_FINAL_EXERCISES.Graphs[6],
    FULL_STACK_DSA_FINAL_EXERCISES["Dynamic Programming"][6]
];

export const FRONTEND_PROJECTS_PRACTICE = {
    Portfolio: reassign(FULL_STACK_JOB_PREPARATION_PRACTICE.Portfolio, "Portfolio"),
    "E-Commerce": reassign(REAL_WORLD_PROJECT_EXERCISES["E-Commerce Application"], "E-Commerce"),
    Dashboard: dashboardPrompts.Dashboard.map(buildDashboardExercise),
    "Chat App": reassign(REAL_WORLD_PROJECT_EXERCISES["Chat Application"], "Chat App"),
    "Frontend Interview": reassign(interviewSources, "Frontend Interview"),
    DSA: reassign(dsaSources, "DSA")
};
