import { REACT_MORE_EXERCISES } from "./roadmapPracticeReactMore.js";

const sourceByTopic = {
    Components: ["Components", {Easy:2,Medium:2,Hard:2}],
    Props: ["Props", {Easy:2,Medium:2,Hard:2}],
    State: ["State", {Easy:2,Medium:1,Hard:2}],
    Hooks: ["Hooks", {Easy:2,Medium:2,Hard:2}],
    Context: ["Context API", {Easy:2,Medium:2,Hard:2}],
    Router: ["React Router", {Easy:2,Medium:2,Hard:2}],
    Forms: ["Forms", {Easy:2,Medium:2,Hard:2}],
    "API Integration": ["API Integration", {Easy:2,Medium:2,Hard:2}]
};

const additions = {
    Context: [
        ["Easy","Share a theme preference with context","A toolbar, settings panel, and preview all need the selected light/dark theme. Explain when Context is suitable and show the provider/consumer shape without adding a global state library.","Create a ThemeContext with a sensible default, wrap the relevant subtree in a provider holding theme state, and consume it only where needed. Context avoids passing the value through every intermediate component.","Should every form input go into this context?","No; keep local interaction state local unless distant components genuinely share it.","const ThemeContext=createContext('light');function App(){const [theme,setTheme]=useState('light');return <ThemeContext.Provider value={{theme,setTheme}}><Page/></ThemeContext.Provider>;}"],
        ["Medium","Avoid a context value identity churn","A provider renders for an unrelated counter and creates a new {theme,setTheme} object each time, rerendering many consumers. Explain the cause and a measured fix without treating memoization as semantic storage.","The object identity changes each render, notifying consumers. Split contexts by update frequency or memoize the value when profiling shows meaningful work; keep correctness independent of memo retention and avoid putting unrelated high-frequency state in one context.","Would React.memo stop a component that consumes changed context?","No; consumers update when the context value changes." ,"function ThemeProvider({ theme, setTheme, children }) { const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]); return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>; }"],
        ["Hard","Define nested context ownership","A page-level theme provider and an embedded preview both need separate theme choices. Explain how nearest-provider lookup works and implement an isolated preview provider without changing the rest of the page.","useContext reads the closest matching provider above the consumer. Wrap only the preview subtree in its own provider; consumers outside continue reading the page provider. Keep provider state boundaries explicit.","What does a consumer render with if no provider is above it?","It receives the createContext default value." ,"<ThemeContext.Provider value={pageTheme}><Main/><ThemeContext.Provider value={previewTheme}><Preview/></ThemeContext.Provider></ThemeContext.Provider>"],
    ],
    Router: [
        ["Easy","Choose Link or navigation action","A sidebar item navigates to /projects while a Save button changes data in place. Explain which React Router element belongs to each and why a normal anchor can cause a full reload.","Use Link/NavLink for internal route navigation and a button for a mutation. A plain anchor performs document navigation and may reload the app; use it for true external destinations or when full navigation is intended.","When should an external resource use an anchor?","For an actual external URL; validate the scheme and make new-tab behavior clear." ,"function ProjectActions() { return <nav aria-label='Project navigation'><NavLink to='/projects'>Projects</NavLink><button type='button' onClick={saveProject}>Save project</button></nav>; }"],
        ["Medium","Render a nested project route","A project details route lives under /projects/:projectId and should retain the projects layout while rendering its selected record. Explain parent/child route structure and Outlet's role.","Define a parent projects route with children, use Outlet in the parent layout, and read projectId from route params in the detail view. Handle an unknown ID as a real not-found state rather than rendering unrelated data.","How should a nested index route render?","Use an index child for the default projects view." ,"<Route path='projects' element={<ProjectsLayout/>}><Route index element={<ProjectList/>}/><Route path=':projectId' element={<ProjectDetails/>}/></Route>"],
        ["Hard","Guard a private route and preserve return path","A logged-out user opens /settings and should return there after signing in. Describe a client route guard, safe return-path handling, and why the API still needs authorization.","Render the login route with location state containing the intended internal path, validate that the return target is same-origin/internal before navigating, then return after successful auth. This improves UX only; every backend endpoint still enforces authentication/ownership.","Why reject a return URL like https://attacker.example?","It can create an open redirect and send the user to an unsafe external destination." ,"const from=location.pathname+location.search;return user?<Outlet/>:<Navigate to='/login' replace state={{from}}/>;"],
    ],
    Forms: [
        ["Medium","Show a server field error beside its control","A profile form submits successfully at the browser layer but the API rejects a too-short title. Explain how to map the safe server validation error to the title control and preserve the user's input.","Keep the entered title, render the returned safe field message next to it, connect it with aria-describedby and aria-invalid, and let the user correct and resubmit. Do not show a success state or discard values after failure.","What if the response has no field details?","Show a general retryable form error and preserve the form state." ,"setErrors({title:'Title must contain at least two characters.'});"],
        ["Hard","Keep a multi-step form recoverable","A three-step project form loses all values when the user changes routes. Propose a React state ownership and validation plan that keeps steps coherent without saving sensitive values to localStorage.","Lift draft state to the wizard parent or use a scoped reducer/context, validate the current step before advancing, and preserve values across route-step changes. Persist through an authenticated server draft only if supported; do not claim browser-local values are account-synced.","What should happen after a server save fails?","Keep the draft in memory and report failure honestly with a retry path." ,"function ProjectWizard() { const [draft, dispatch] = useReducer(projectReducer, initialDraft); return <WizardContext.Provider value={{ draft, dispatch }}><WizardRoutes /></WizardContext.Provider>; }"],
    ]
};

const slug=(value)=>value.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const cloneExisting=(topic)=>{
    const [source,counts]=sourceByTopic[topic],sourceItems=REACT_MORE_EXERCISES[source]||[];
    return Object.entries(counts).flatMap(([difficulty,limit])=>sourceItems.filter(item=>item.difficulty===difficulty).slice(0,limit).map((item,index)=>({...item,
        id:`frontend-react-${slug(topic)}-${difficulty.toLowerCase()}-source-${index+1}-v1`,career:"Frontend Developer",phase:"React",topic,
        conceptsToReview:[topic,...(item.conceptsToReview||[])],learningObjectives:[`Apply ${topic} concepts in a frontend component.`,...(item.learningObjectives||[])]
    })));
};
const buildCustom=(topic,[difficulty,title,question,answer,followUp,edge,solution],index)=>({
    id:`frontend-react-${slug(topic)}-${difficulty.toLowerCase()}-extra-${index+1}-v1`,career:"Frontend Developer",phase:"React",topic,title,difficulty,
    estimatedTime:difficulty==="Easy"?"20–30 minutes":difficulty==="Medium"?"30–45 minutes":"45–60 minutes",kind:"coding",language:"React and JavaScript",
    simplerProblem:`Implement the central ${topic} behavior for a small component before adding the edge case.`,
    problemStatement:`${question} State the expected behavior and explain why the implementation preserves React's rendering and interaction contract.`,
    requirements:[`Implement the stated ${topic} behavior with React's documented component model.`,`Keep state and side effects in the correct owner/lifecycle boundary.`,`Handle the follow-up case and state how it can be verified.`],
    examples:[{input:question,output:answer,explanation:"Reference answer applies the React behavior to the stated scenario."},{input:followUp,output:edge,explanation:"Follow-up verifies the edge contract."}],
    tests:[{name:"Main behavior",input:question,expected:answer},{name:"Follow-up",input:followUp,expected:edge}],
    hints:[`Identify which component owns the ${topic} decision before writing JSX.`,`Check rerender, keyboard, and failure behavior instead of testing only the initial render.`],
    learningObjectives:[`Apply ${topic} patterns to a realistic React feature.`,"Explain state ownership, user-visible behavior, and a test for the edge case."],conceptsToReview:[topic,"React rendering","Component boundaries"],prerequisites:[],
    approach:`Define the component contract for ${topic}, keep ownership and effects explicit, then verify the normal interaction and failure/boundary response.`,
    walkthrough:`Reference answer: ${answer} Follow-up: ${followUp} Boundary: ${edge} Verify the result through a user interaction rather than only inspecting JSX.`,
    solutionCode:solution,solutionLines:[answer,followUp,edge,solution],
    commonMistakes:["Duplicating state that already has a clear owner.","Assuming a client-side route or form check replaces backend authorization and validation."],followUp,
    completionCriteria:["The component behavior matches the stated scenario.","The edge case does not create stale or misleading UI state.","The verification plan exercises the user-visible interaction."],
    starterCode:`function Feature() {\n  // ${topic}: implement the described React behavior\n}\n`
});

const customExercises=Object.fromEntries(Object.entries(additions).map(([topic,items])=>[topic,items.map((item,index)=>buildCustom(topic,item,index))]));
export const FRONTEND_REACT_PRACTICE=Object.fromEntries(Object.keys(sourceByTopic).map(topic=>[topic,[...cloneExisting(topic),...(customExercises[topic]||[])]]));
