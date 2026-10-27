import { buildLessonCatalog } from "./roadmapLessonCatalog.js";

const lesson = (data) => data;

// Preserve the original authored batch as the immutable source of existing
// guided Practice IDs. The full reading catalog is composed separately below.
export const ROADMAP_PRACTICE_LESSONS = {
    "Full Stack Developer": {
        JavaScript: {
            "Variables & Data Types": lesson({
                explanation: "A variable is a named binding to a value. JavaScript values include strings, numbers, booleans, null, undefined, objects, and symbols; the value's type determines which operations make sense.",
                prerequisites: ["Basic expressions"],
                objectives: ["Choose const or let intentionally.", "Distinguish primitive values from objects."],
                tutorial: ["Use const when the binding will not be reassigned; use let when it must change.", "Use typeof for most primitive checks, while remembering typeof null is the historical string 'object'.", "Convert input explicitly before arithmetic because form and prompt input is usually text."],
                code: "const raw = \"42\";\nconst count = Number(raw);\nconst isValid = Number.isFinite(count);\nconsole.log(count, typeof count, isValid);",
                output: "42 'number' true",
                mistakes: ["Using == when type conversion is not intended.", "Assuming const makes an object immutable; it prevents rebinding, not property updates."],
                useCase: "Validate and normalize values received from forms or APIs before using them in calculations.",
                quiz: { question: "Can a property of an object declared with const be changed?", answer: "Yes. const prevents rebinding the variable, but the object's properties can still be mutated.", explanation: "The binding remains pointed at the same object even when one of that object's properties changes." },
                nextStep: "Practice converting and validating user input before using it."
            }),
            "Conditions": lesson({
                explanation: "Conditions choose which path a program follows. A clear condition names the rule being checked and avoids relying on surprising truthy or falsy conversions.",
                prerequisites: ["Variables", "Comparison operators", "Boolean values"],
                objectives: ["Write if/else branches for mutually exclusive cases.", "Handle boundary values explicitly."],
                tutorial: ["Express the rule as a boolean comparison.", "Handle exceptional or invalid cases before the normal path.", "Use else if for ordered alternatives and switch when matching one value against many cases."],
                code: "function accessLevel(age) {\n  if (!Number.isFinite(age) || age < 0) return \"invalid\";\n  if (age >= 18) return \"adult\";\n  return \"minor\";\n}\nconsole.log(accessLevel(18));",
                output: "adult",
                mistakes: ["Using assignment (=) instead of equality (===).", "Forgetting that 0, empty string, null, undefined, and NaN are falsy."],
                useCase: "Choose UI states, validate a request, or enforce a business rule such as an age or quantity threshold.",
                quiz: { question: "Why check invalid values before checking age >= 18?", answer: "It prevents invalid inputs from falling through into a valid category.", explanation: "Early validation makes the accepted input domain explicit and keeps the business branches simple." },
                nextStep: "Add boundary tests immediately below, at, and above a threshold."
            }),
            "Loops": lesson({
                explanation: "Loops repeat work over a sequence or until a condition changes. The loop should make its stopping rule clear and should not mutate shared data unexpectedly.",
                prerequisites: ["Arrays", "Conditions"],
                objectives: ["Choose for...of for values and a counted loop for indexes.", "Prevent infinite loops by making progress toward a stopping condition."],
                tutorial: ["Identify the collection or repetition count.", "Choose a loop that exposes the values you need.", "Test empty and one-item collections as well as a typical collection."],
                code: "const scores = [4, 7, 2];\nlet total = 0;\nfor (const score of scores) total += score;\nconsole.log(total);",
                output: "13",
                mistakes: ["Changing the array while iterating over it without considering skipped items.", "Using a while loop whose condition never becomes false."],
                useCase: "Process API results, validate every submitted row, or calculate a summary over records.",
                quiz: { question: "What should happen when a loop processes an empty array?", answer: "It should execute zero iterations and leave the result in a valid initial state.", explanation: "Empty inputs are normal boundary cases, not exceptional failures." },
                nextStep: "Compare a loop with map, filter, and reduce for the same small task."
            }),
            "Functions": lesson({
                explanation: "A function packages a named operation behind inputs and an output. Small functions with clear contracts are easier to test, reuse, and debug.",
                prerequisites: ["Variables", "Expressions", "Return values"],
                objectives: ["Separate parameters from local variables.", "Return a value instead of relying on hidden side effects."],
                tutorial: ["Name the operation with a verb.", "List required inputs and validate them at the boundary.", "Return the result and test normal, boundary, and invalid inputs."],
                code: "function subtotal(price, quantity) {\n  if (price < 0 || quantity < 0) throw new RangeError(\"Values must be non-negative\");\n  return price * quantity;\n}\nconsole.log(subtotal(12, 3));",
                output: "36",
                mistakes: ["Forgetting return and getting undefined.", "Reading mutable global values instead of accepting explicit parameters."],
                useCase: "Extract input validation, formatting, or calculations so UI event handlers remain short.",
                quiz: { question: "What is the benefit of passing a value as a parameter rather than reading a global?", answer: "The function's inputs are explicit, which makes it easier to reuse and test.", explanation: "Explicit dependencies reduce hidden coupling between parts of the application." },
                nextStep: "Write a pure function and test it without rendering a page."
            }),
            "Arrays": lesson({
                explanation: "Arrays are ordered collections. map transforms each value, filter selects values, and reduce combines values; these methods return new results and make data flow visible.",
                prerequisites: ["Functions", "Objects"],
                objectives: ["Choose the array method that matches the operation.", "Avoid mutating input arrays unless mutation is intentional."],
                tutorial: ["Describe the desired output before choosing a method.", "Use map for one output per input, filter for selection, and reduce for an aggregate.", "Test empty and duplicate-containing inputs."],
                code: "const prices = [5, 12, 8];\nconst expensive = prices.filter((price) => price >= 8);\nconst doubled = expensive.map((price) => price * 2);\nconsole.log(doubled);",
                output: "[16, 24]",
                mistakes: ["Using map when the result should contain fewer items.", "Sorting or reversing an array in place when the original should be preserved."],
                useCase: "Transform server records into view models or derive visible search results without mutating API data.",
                quiz: { question: "Which method selects only items that satisfy a predicate?", answer: "filter", explanation: "filter returns a new array containing the original values whose callback returns a truthy result." },
                nextStep: "Build a search filter over an array of objects."
            }),
            "Objects": lesson({
                explanation: "Objects group related values behind named properties. They are useful for representing records, options, and structured API responses.",
                prerequisites: ["Variables", "Functions"],
                objectives: ["Read and update properties safely.", "Use destructuring and spread to make object transformations clear."],
                tutorial: ["Model one real entity as a set of named fields.", "Check optional properties before using nested values.", "Create a new object with spread when updating state immutably."],
                code: "const user = { id: 7, name: \"Mina\" };\nconst updatedUser = { ...user, name: \"Mina Patel\" };\nconsole.log(user.name, updatedUser.name);",
                output: "Mina Mina Patel",
                mistakes: ["Assuming a missing property is the same as null.", "Mutating an object shared by other parts of the program."],
                useCase: "Represent a job, user profile, or form state as one predictable object.",
                quiz: { question: "Does object spread deep-clone nested objects?", answer: "No. It makes a shallow copy; nested object references are shared.", explanation: "Nested values need their own copy if they will be changed independently." },
                nextStep: "Transform a list of objects without changing the source list."
            }),
            "DOM": lesson({
                explanation: "The Document Object Model represents a page as nodes that JavaScript can query and update. Prefer semantic HTML and update only the parts of the page that need to change.",
                prerequisites: ["HTML elements", "Selectors", "Functions"],
                objectives: ["Select elements with a stable selector.", "Update text safely and handle a missing element."],
                tutorial: ["Give the target element an id or data attribute.", "Query it after the document is available.", "Use textContent for plain text rather than injecting an HTML string."],
                code: "const heading = document.querySelector(\"[data-title]\");\nif (heading) heading.textContent = \"Roadmap\";",
                output: "The matching element displays the text Roadmap.",
                mistakes: ["Using innerHTML for untrusted text.", "Querying before the target element exists."],
                useCase: "Update a small static page or inspect browser behavior; larger applications commonly let React own the DOM.",
                quiz: { question: "Why is textContent safer than innerHTML for user-provided text?", answer: "It treats the value as text instead of parsing it as markup.", explanation: "That avoids turning a string into executable or unexpected HTML." },
                nextStep: "Connect a form submit event to a safe text update."
            }),
            "Events": lesson({
                explanation: "Events report user or browser actions such as clicks, submissions, and key presses. A handler should respond to the event without registering duplicate listeners.",
                prerequisites: ["DOM", "Functions"],
                objectives: ["Register an event handler once.", "Use the event object and prevent default behavior only when needed."],
                tutorial: ["Select the element that owns the interaction.", "Register a named or inline callback with addEventListener.", "For forms, read FormData and prevent a page reload when handling submission in JavaScript."],
                code: "const form = document.querySelector(\"form\");\nform?.addEventListener(\"submit\", (event) => {\n  event.preventDefault();\n  console.log(new FormData(form).get(\"email\"));\n});",
                output: "Submitting the form logs the entered email without reloading the page.",
                mistakes: ["Calling the handler while registering it instead of passing the function.", "Adding the same listener repeatedly during every render or update."],
                useCase: "Handle a search input, form submission, or accessible button interaction.",
                quiz: { question: "What does event.preventDefault() do for a form submit?", answer: "It stops the browser's default navigation/reload for that submission.", explanation: "The application can then validate and process the form itself." },
                nextStep: "Add validation and a visible error message to a form handler."
            }),
            "ES6+": lesson({
                explanation: "Modern JavaScript syntax includes destructuring, template strings, spread/rest, and concise object methods. These features reduce boilerplate but should keep data flow readable.",
                prerequisites: ["Arrays", "Objects", "Functions"],
                objectives: ["Destructure values without losing clarity.", "Use spread/rest for copies and flexible function arguments."],
                tutorial: ["Destructure only fields needed by the current operation.", "Use template strings for readable interpolation.", "Remember spread copies only the top level of arrays and objects."],
                code: "const job = { title: \"Analyst\", city: \"Pune\" };\nconst { title, city } = job;\nconsole.log(`${title} — ${city}`);",
                output: "Analyst — Pune",
                mistakes: ["Overusing nested destructuring that hides where values come from.", "Assuming spread performs a deep copy."],
                useCase: "Extract fields from API results and create updated React state objects.",
                quiz: { question: "What does const { title } = job do?", answer: "It reads the title property from job into a local binding named title.", explanation: "Destructuring is syntax for extracting values from arrays or objects." },
                nextStep: "Refactor a small data transformation using destructuring and spread."
            }),
            "Promises": lesson({
                explanation: "A Promise represents a result that may arrive later. It settles once, either fulfilled with a value or rejected with an error.",
                prerequisites: ["Functions", "Callbacks", "Errors"],
                objectives: ["Chain asynchronous operations with then/catch or await.", "Return values from callbacks to preserve the chain."],
                tutorial: ["Start the asynchronous operation and retain its Promise.", "Transform the resolved value with then.", "Handle rejection with catch or a surrounding try/catch when using await."],
                code: "Promise.resolve(3)\n  .then((value) => value * 2)\n  .then((value) => console.log(value))\n  .catch((error) => console.error(error));",
                output: "6",
                mistakes: ["Forgetting to return a Promise from a then callback.", "Assuming a Promise callback runs synchronously."],
                useCase: "Represent network requests, timers, and file or database operations.",
                quiz: { question: "What does catch handle in a Promise chain?", answer: "A rejection from the original Promise or an error thrown in an earlier then callback.", explanation: "A rejection path should be handled rather than silently ignored." },
                nextStep: "Rewrite a short Promise chain using async/await."
            }),
            "Async/Await": lesson({
                explanation: "async/await is syntax for writing Promise-based work in a sequential style. An async function always returns a Promise, and await pauses that function until the awaited Promise settles.",
                prerequisites: ["Promises", "try/catch"],
                objectives: ["Handle rejected operations with try/catch.", "Avoid awaiting independent operations one at a time unnecessarily."],
                tutorial: ["Mark the function async.", "Await each dependent Promise inside try/catch.", "Use Promise.all when multiple independent operations can run together."],
                code: "async function loadCount() {\n  try {\n    const response = await fetch(\"/api/count\");\n    if (!response.ok) throw new Error(\"Request failed\");\n    return await response.json();\n  } catch (error) {\n    return { error: error.message };\n  }\n}",
                output: "The function resolves to parsed JSON, or to an error object if the request fails.",
                mistakes: ["Forgetting to check response.ok because fetch does not reject on HTTP 404/500.", "Using await outside an async function in environments that do not support top-level await."],
                useCase: "Load data for a page while showing explicit loading, success, and error states.",
                quiz: { question: "Does fetch reject when the server returns HTTP 404?", answer: "No. The Promise resolves to a Response; check response.ok or response.status.", explanation: "Network failures reject, but HTTP error statuses are still valid HTTP responses." },
                nextStep: "Add a loading state and retry action around an async request."
            }),
            "Fetch API": lesson({
                explanation: "fetch sends an HTTP request and returns a Promise for a Response. The caller must check the status and parse the body using the appropriate method.",
                prerequisites: ["HTTP", "Promises", "JSON"],
                objectives: ["Send query, header, and body data correctly.", "Handle network errors and non-success HTTP statuses separately."],
                tutorial: ["Choose the URL and method.", "For JSON requests, set Content-Type and JSON.stringify the body.", "Check response.ok before parsing or presenting success."],
                code: "const response = await fetch(\"/api/jobs?limit=10\");\nif (!response.ok) throw new Error(`HTTP ${response.status}`);\nconst payload = await response.json();\nconsole.log(payload.data.length);",
                output: "Logs the number of jobs in the API response data array.",
                mistakes: ["Assuming response.json() returns parsed data synchronously.", "Showing an empty success state when the request actually failed."],
                useCase: "Connect a browser page to an authenticated JSON API.",
                quiz: { question: "What does response.json() return?", answer: "A Promise that resolves to the parsed response body.", explanation: "The body is read asynchronously, so await it before using the object." },
                nextStep: "Build a small UI with loading, empty, error, and retry states."
            }),
            "Modules": lesson({
                explanation: "ES modules split code into files with explicit imports and exports. This makes dependencies visible and helps keep each file focused.",
                prerequisites: ["Functions", "Objects"],
                objectives: ["Use named and default exports correctly.", "Avoid circular dependencies between modules."],
                tutorial: ["Export a focused function or constant from its owning file.", "Import it with a path that resolves from the importing module.", "Keep shared low-level utilities independent from page-specific code."],
                code: "// math.js\nexport const add = (a, b) => a + b;\n\n// app.js\nimport { add } from \"./math.js\";\nconsole.log(add(2, 5));",
                output: "7",
                mistakes: ["Using braces for a default import or omitting braces for a named import.", "Creating circular imports that rely on partially initialized bindings."],
                useCase: "Separate API helpers, components, and domain logic into files with explicit boundaries.",
                quiz: { question: "How does a named import differ from a default import?", answer: "A named import uses the exported name in braces; a default import chooses a local name without braces.", explanation: "The syntax must match the kind of export declared by the module." },
                nextStep: "Split a small script into a utility module and an entry module."
            }),
            "Error Handling": lesson({
                explanation: "Error handling makes failure paths explicit. Catch errors at a boundary that can recover, add context without exposing secrets, and return a useful state to the caller.",
                prerequisites: ["Functions", "Promises", "Exceptions"],
                objectives: ["Use throw for invalid operations and catch at a recovery boundary.", "Keep internal diagnostics separate from user-facing messages."],
                tutorial: ["Identify which operation can fail.", "Throw a meaningful Error or validate before the operation.", "Catch only where the program can recover or translate the error."],
                code: "function parseQuantity(value) {\n  const number = Number(value);\n  if (!Number.isInteger(number) || number < 1) {\n    throw new RangeError(\"Quantity must be a positive integer\");\n  }\n  return number;\n}",
                output: "parseQuantity(\"3\") returns 3; parseQuantity(\"0\") throws RangeError.",
                mistakes: ["Catching an error and returning success-shaped data.", "Logging credentials, document contents, or other sensitive input while diagnosing a failure."],
                useCase: "Translate API failures into retryable UI errors without leaking internal details.",
                quiz: { question: "Where should an error be caught?", answer: "At a boundary that can recover, retry, or translate it into a safe response.", explanation: "Catching too early often hides useful failures; catching too late can crash the flow." },
                nextStep: "Add one explicit failure case to an asynchronous request flow."
            }),
            "Local Storage": lesson({
                explanation: "localStorage stores string values in one browser profile across reloads. It is suitable for small non-sensitive preferences, not secrets or authoritative account data.",
                prerequisites: ["JSON", "Error Handling"],
                objectives: ["Serialize and parse values safely.", "Choose storage only when its persistence and privacy scope fit the data."],
                tutorial: ["Use setItem with a string, commonly JSON.stringify for structured values.", "Use try/catch around JSON.parse because stored data can be malformed.", "Do not store tokens or private documents in general-purpose local storage."],
                code: "localStorage.setItem(\"theme\", \"dark\");\nconst theme = localStorage.getItem(\"theme\") || \"light\";\nconsole.log(theme);",
                output: "dark",
                mistakes: ["Treating localStorage as shared across users or devices.", "Persisting authentication secrets or sensitive personal content there."],
                useCase: "Remember a harmless display preference in one browser profile.",
                quiz: { question: "Should a server-authoritative career note be saved only in localStorage?", answer: "No. It should use the authenticated account API so it follows the user across sessions and devices.", explanation: "Browser storage is local to a profile and does not provide server ownership or cross-device persistence." },
                nextStep: "Compare browser-local preferences with authenticated MongoDB records."
            })
        }
    },
    "Frontend Developer": {
        React: {
            "Components": lesson({ explanation: "A React component is a function that returns UI for its current inputs. Components should describe one coherent part of the interface and compose smaller components where that improves clarity.", prerequisites: ["JavaScript functions", "JSX"], objectives: ["Create reusable components with clear boundaries.", "Keep rendering deterministic from props and state."], tutorial: ["Name the function with an uppercase first letter.", "Return JSX describing the UI.", "Compose the component inside another component and pass data through props."], code: "function Badge({ label }) {\n  return <span className=\"badge\">{label}</span>;\n}\n\nfunction App() { return <Badge label=\"Remote\" />; }", output: "Renders a span containing Remote.", mistakes: ["Lowercase component names are treated as HTML tags.", "Putting side effects directly in render."], useCase: "Reuse consistent metadata badges across job cards and details.", quiz: { question: "Why should rendering be pure?", answer: "React may render more than once; rendering should produce UI without causing external side effects.", explanation: "Effects belong in event handlers or effect hooks, not in the render calculation." }, nextStep: "Build a small card from two reusable child components." }),
            "Props": lesson({ explanation: "Props are read-only inputs passed from a parent to a child. They let one component render different data without owning the source of that data.", prerequisites: ["Components", "Objects"], objectives: ["Pass required data explicitly.", "Keep state in the component responsible for changing it."], tutorial: ["Choose a small prop interface.", "Pass values as JSX attributes.", "Destructure props in the child and render them without mutation."], code: "function JobTitle({ title, company }) {\n  return <h2>{title} — {company}</h2>;\n}\n<JobTitle title=\"Analyst\" company=\"Example Co.\" />", output: "Analyst — Example Co.", mistakes: ["Mutating props.", "Passing an entire application object when a few fields are enough."], useCase: "Render one job card component for every job returned by the API.", quiz: { question: "Who should update a prop value?", answer: "The parent that owns the value, then pass the new value down.", explanation: "Child components receive props as inputs; they should not mutate the parent's data." }, nextStep: "Add a callback prop for a child action." }),
            "State": lesson({ explanation: "State is data that changes over time and affects rendered UI. Updating state schedules a render; changing a local variable does not.", prerequisites: ["Components", "JavaScript arrays and objects"], objectives: ["Update state through its setter.", "Avoid mutating objects and arrays held in state."], tutorial: ["Use useState for a value that affects the UI.", "Call the setter with a new value.", "Use the functional setter when the next value depends on the previous value."], code: "const [count, setCount] = useState(0);\n<button onClick={() => setCount((value) => value + 1)}>\n  {count}\n</button>", output: "Each click increments the displayed count.", mistakes: ["Mutating state and expecting React to notice.", "Using stale state in repeated asynchronous updates."], useCase: "Track selected filters, expanded panels, or form field values.", quiz: { question: "Why use setCount(value => value + 1) for a value based on previous state?", answer: "React supplies the latest state value to the updater.", explanation: "This avoids relying on a potentially stale value captured by a closure." }, nextStep: "Build a controlled search field and derive filtered results." }),
            "Hooks": lesson({ explanation: "Hooks let function components use React state and lifecycle-related behavior. Hook calls must remain at the top level so React can associate each call with the same component state slot.", prerequisites: ["Components", "State"], objectives: ["Call hooks unconditionally at the top level.", "Choose a hook that matches the behavior needed."], tutorial: ["Keep hook calls before early returns and outside loops or conditions.", "Use useState for local state.", "Use useEffect only to synchronize with an external system."], code: "function Toggle() {\n  const [open, setOpen] = useState(false);\n  return <button onClick={() => setOpen((value) => !value)}>\n    {open ? \"Hide\" : \"Show\"}\n  </button>;\n}", output: "The button toggles between Show and Hide.", mistakes: ["Calling a hook inside a branch.", "Using effects for values that can be derived during render."], useCase: "Track user interaction while keeping view state local to a feature.", quiz: { question: "Can useState be called only when a condition is true?", answer: "No. Hooks must be called in the same order on every render.", explanation: "React relies on call order to associate hook state with the component." }, nextStep: "Use an effect only when a component must synchronize with an external system." }),
            "API Integration": lesson({ explanation: "API integration connects UI state to remote data. A robust view distinguishes loading, successful data, an empty result, and a failed request.", prerequisites: ["useEffect", "Promises", "HTTP"], objectives: ["Avoid setting state after an obsolete request where possible.", "Show an honest loading and error state."], tutorial: ["Start the request from an effect or user action.", "Check response.ok and parse the body.", "Render loading, error, empty, and populated states distinctly."], code: "useEffect(() => {\n  let active = true;\n  fetch(\"/api/jobs\").then((response) => {\n    if (!response.ok) throw new Error(\"Request failed\");\n    return response.json();\n  }).then((data) => { if (active) setJobs(data.data); })\n    .catch((error) => { if (active) setError(error.message); });\n  return () => { active = false; };\n}, []);", output: "A successful response populates jobs; a rejected or non-success request sets an error.", mistakes: ["Treating an HTTP error status as a successful fetch.", "Displaying stale results after a request fails without communicating the failure."], useCase: "Load authenticated job listings from the existing backend service.", quiz: { question: "Does fetch reject on HTTP 500?", answer: "No. Check response.ok or status.", explanation: "HTTP failures resolve to a Response object; only network-level failures reject automatically." }, nextStep: "Add retry and an empty state to a small API-backed list." })
        }
    },
    "Backend Developer": {
        "Express.js": {
            "Routing": lesson({ explanation: "Express routes pair an HTTP method and path with middleware and a handler. Route order matters when patterns overlap, and handlers should return consistent status codes and response shapes.", prerequisites: ["HTTP methods", "JavaScript functions"], objectives: ["Map routes to resource actions.", "Keep route definitions thin and delegate work appropriately."], tutorial: ["Choose a resource-oriented path and method.", "Attach authentication and validation middleware before the handler.", "Return a stable JSON envelope and status code."], code: "router.get(\"/tasks/:id\", authenticate, async (req, res) => {\n  const task = await Task.findOne({ _id: req.params.id, user: req.user.userId });\n  if (!task) return res.status(404).json({ success: false, message: \"Not found\" });\n  return res.json({ success: true, data: task });\n});", output: "A matching owned task returns a 200 JSON response; an absent or unowned task returns 404.", mistakes: ["Placing a broad route before a more specific route.", "Trusting a user ID from the request body for ownership."], useCase: "Implement a user-scoped API endpoint without duplicating authorization logic.", quiz: { question: "Where should the owner ID come from for a private resource query?", answer: "From the authenticated request context populated by trusted middleware.", explanation: "A client-supplied owner ID can be changed to target another account." }, nextStep: "Add request validation before a create or update handler." }),
            "Middleware": lesson({ explanation: "Middleware is a function in the request pipeline that can inspect or modify the request, end the response, or pass control onward. Ordering determines which parsed data and security checks are available.", prerequisites: ["Express routes", "HTTP request lifecycle"], objectives: ["Call next only when processing should continue.", "Order parsing, authentication, validation, and handlers correctly."], tutorial: ["Identify the middleware's responsibility.", "Register it before the handler that needs its result.", "Use error middleware with the four-argument signature for centralized failures."], code: "function requireUser(req, res, next) {\n  if (!req.user) return res.status(401).json({ success: false });\n  return next();\n}\nrouter.get(\"/private\", requireUser, handler);", output: "Requests without an authenticated user stop with 401; others continue to handler.", mistakes: ["Calling next twice.", "Continuing after sending a response."], useCase: "Share authentication, role checks, and input validation across related routes.", quiz: { question: "What happens when middleware sends a response and then calls next()?", answer: "It can cause the pipeline to continue after the response has already been handled.", explanation: "Return after sending the response so no later handler runs." }, nextStep: "Trace one request through parsing, authentication, validation, and route handling." }),
            "Validation": lesson({ explanation: "Validation checks untrusted request data before it reaches business logic or the database. A schema should constrain types, ranges, lengths, and allowed values.", prerequisites: ["JSON", "Middleware"], objectives: ["Reject invalid data with a clear 400 response.", "Use validated values rather than the untrusted original body."], tutorial: ["Define an allowlisted schema for accepted fields.", "Validate before the controller runs.", "Return field-level errors without echoing secrets or private input."], code: "const schema = Joi.object({\n  title: Joi.string().trim().min(2).max(120).required(),\n  page: Joi.number().integer().min(1).default(1)\n});\nconst { error, value } = schema.validate(req.body);", output: "value contains validated fields; error describes invalid input when validation fails.", mistakes: ["Checking only the browser form and trusting the API request.", "Allowing unknown fields to overwrite protected model fields."], useCase: "Validate query filters, document metadata, and user-created records before persistence.", quiz: { question: "Why validate on the server if the frontend already validates?", answer: "Clients can be bypassed or altered; the server is the trust boundary.", explanation: "Server validation protects every caller, not just the intended UI." }, nextStep: "Add a schema with a maximum string length and reject unknown fields." }),
            "Error Handling": lesson({ explanation: "API error handling converts failures into consistent, safe responses while retaining enough server-side diagnostics to investigate them.", prerequisites: ["Promises", "Express middleware"], objectives: ["Preserve intentional 4xx validation and authorization statuses.", "Avoid exposing raw stack traces, database messages, or secrets."], tutorial: ["Catch async failures at an async boundary.", "Log a request-safe diagnostic on the server.", "Return a stable error envelope with a user-safe message."], code: "try {\n  const result = await service.load(id);\n  return res.json({ success: true, data: result });\n} catch (error) {\n  logger.error({ name: error.name, code: error.code });\n  return res.status(500).json({ success: false, message: \"Internal server error\" });\n}", output: "Clients receive a generic 500 response; server logs retain limited diagnostic metadata.", mistakes: ["Sending error.message from database exceptions to the client.", "Logging request bodies containing tokens or private documents."], useCase: "Keep API behavior predictable without exposing internals to users.", quiz: { question: "Should an unexpected database error message be returned to the browser?", answer: "No. Return a safe message and keep sanitized diagnostics in server logs.", explanation: "Raw errors may reveal schema, infrastructure, or user-submitted content." }, nextStep: "Review one controller and separate validation errors from unexpected failures." })
        }
    },
    "AI Engineer": {
        RAG: {
            "Chunking": lesson({ explanation: "Chunking splits a source into smaller passages so retrieval can find relevant evidence without sending an entire long document to a model. Each chunk should keep source and position metadata.", prerequisites: ["Text preprocessing", "Embeddings"], objectives: ["Choose boundaries that preserve meaning.", "Keep stable source metadata for every chunk."], tutorial: ["Normalize text without deleting meaningful structure.", "Split by headings or paragraphs before falling back to a token/character limit.", "Store document ID, chunk index, and source location with each chunk."], code: "const chunks = paragraphs.map((text, index) => ({\n  text: text.trim(),\n  metadata: { documentId: \"guide-1\", chunkIndex: index }\n})).filter((chunk) => chunk.text);", output: "An array of non-empty text chunks, each traceable to its document and index.", mistakes: ["Splitting in the middle of a sentence without overlap or context.", "Dropping source metadata so answers cannot be traced back."], useCase: "Prepare private uploaded documents for grounded question answering.", quiz: { question: "Why retain document and chunk identifiers?", answer: "They preserve provenance so retrieved text and generated claims can be traced to their source.", explanation: "Retrieval quality and answer auditing depend on knowing where each passage came from." }, nextStep: "Compare fixed-size chunks with paragraph-aware chunks on the same short document." }),
            "Embeddings": lesson({ explanation: "An embedding maps text to a numeric vector that places semantically related passages near one another in vector space. Query and document embeddings must use compatible models and preprocessing.", prerequisites: ["Vector basics", "Text chunking"], objectives: ["Embed passages and queries consistently.", "Treat vectors as search representations, not as source text."], tutorial: ["Choose an embedding model and record its version.", "Generate one vector per chunk and keep the source metadata separately.", "Embed the query with the same compatible model before searching."], code: "// Pseudocode: call the configured embedding provider for each chunk.\nconst record = {\n  text: chunk.text,\n  vector: await embed(chunk.text),\n  source: chunk.metadata\n};", output: "Each stored vector remains associated with its original chunk and source metadata.", mistakes: ["Comparing vectors produced by incompatible model versions.", "Assuming a high similarity score proves that a passage answers the question."], useCase: "Find semantically relevant policy paragraphs even when a question uses different wording.", quiz: { question: "Should query and document vectors use compatible embedding models?", answer: "Yes.", explanation: "Their coordinates must represent text in a compatible vector space for similarity comparisons to be meaningful." }, nextStep: "Inspect retrieval results for several known questions before adding generation." }),
            "Retrieval": lesson({ explanation: "Retrieval selects the passages most likely to support a question. A good system returns relevant evidence with metadata and can return no result when confidence is too low.", prerequisites: ["Chunking", "Embeddings", "Similarity search"], objectives: ["Measure whether retrieved chunks contain answer evidence.", "Preserve source attribution and apply user-level access filters."], tutorial: ["Embed the user's query.", "Search only documents the authenticated user is allowed to access.", "Return ranked passages with scores and source metadata, then inspect relevance."], code: "const matches = await vectorStore.search(queryVector, {\n  filter: { userId: authenticatedUserId },\n  limit: 5\n});\nconst evidence = matches.filter((match) => match.score >= threshold);", output: "Ranked, access-scoped evidence passages; low-confidence results can be omitted.", mistakes: ["Searching across users' private documents.", "Treating similarity ranking as proof that the top result is relevant."], useCase: "Retrieve a user's own resume or study notes before answering a document question.", quiz: { question: "When must user ownership be applied in retrieval?", answer: "Before or during the search so unauthorized passages are never returned to the answer step.", explanation: "Post-filtering after exposing results to another component is weaker than enforcing access at the retrieval boundary." }, nextStep: "Build a small relevance set and measure whether the expected passages appear in the top results." }),
            "Reranking": lesson({ explanation: "Reranking applies a second relevance model to a smaller candidate set. It can improve ordering but cannot create evidence that the retriever never found.", prerequisites: ["Retrieval", "Ranking metrics"], objectives: ["Use reranking only after candidate retrieval.", "Compare relevance before and after reranking on labeled queries."], tutorial: ["Retrieve a candidate set larger than the final context size.", "Score each query-passage pair with a reranker.", "Keep the best supported passages and preserve their original source metadata."], code: "const candidates = await retrieve(query, 20);\nconst ranked = await rerank(query, candidates);\nconst context = ranked.slice(0, 5);", output: "A smaller, reordered set of candidate passages for the answer context.", mistakes: ["Using reranking as a substitute for access control.", "Assuming a reranker fixes missing or poorly chunked source content."], useCase: "Improve the top context passages for a user's document question.", quiz: { question: "Can reranking recover a passage that the first-stage retriever did not return?", answer: "No.", explanation: "Reranking only orders candidates it receives." }, nextStep: "Compare top-k relevance with and without reranking on the same query set." }),
            "RAG Evaluation": lesson({ explanation: "RAG evaluation checks both retrieval and answer quality against known questions and source evidence. It should detect unsupported answers and missing evidence, not only fluent wording.", prerequisites: ["Retrieval", "Grounded generation", "Test cases"], objectives: ["Build question-answer-source examples.", "Measure retrieval and answer faithfulness separately."], tutorial: ["Write representative questions with expected supporting passages.", "Check whether retrieval includes the expected source in the top results.", "Review generated answers for unsupported claims, omissions, and correct abstention."], code: "const testCase = {\n  question: \"What is the cancellation window?\",\n  expectedSourceId: \"policy-section-4\",\n  expectedFact: \"within 14 days\"\n};", output: "A labeled case that can verify evidence retrieval and factual support.", mistakes: ["Scoring only answer similarity without checking its citations.", "Testing only easy questions with obvious keyword overlap."], useCase: "Prevent regressions when changing chunking, embedding models, prompts, or retrieval limits.", quiz: { question: "Why evaluate retrieval separately from answer generation?", answer: "It helps identify whether a failure came from missing evidence or from the model's use of retrieved evidence.", explanation: "The two stages fail in different ways and need different corrective actions." }, nextStep: "Create a small evaluation set that includes an unanswerable question." })
        }
    }
};

export const ROADMAP_EXERCISES = {
    "Full Stack Developer": {
        "Web Fundamentals": [
            {
                id: "explain-client-vs-server", title: "Explain client vs server", difficulty: "Easy", estimatedTime: "20–30 minutes", topic: "Client vs Server",
                simplerProblem: "Describe what the browser asks for and what a web server sends back, using one familiar website as an example.", conceptsToReview: ["Client and server roles", "Request and response", "Static and dynamic content"], learningObjectives: ["Trace client and server responsibilities across a request and response.", "Identify data that must be validated or kept on the server."],
                prerequisites: ["Basic browser use", "URLs and web pages"],
                problemStatement: "Write a short request-to-response trace for opening a product page. Identify the client, the server, the request data, the response, and one thing that should remain on the server. Then explain what changes when the user submits a search form.",
                requirements: ["Use a concrete example such as searching for a book.", "Distinguish browser responsibilities from server responsibilities.", "Name at least two request details and two response details.", "Do not include passwords or other secrets in a URL."],
                examples: [{ input: "User opens /books?q=history", output: "Browser sends a request; server returns a page or data for matching books.", explanation: "The browser is the client. The server processes the request and chooses a response." }, { input: "User submits a sign-in form", output: "The browser sends form data over HTTPS; the server verifies it and returns an appropriate response.", explanation: "Authentication decisions belong on the server; the client displays the result." }],
                starterCode: "Request trace\n1. Client:\n2. Request method and path:\n3. Useful request headers or body:\n4. Server responsibility:\n5. Response status and content:\n6. What the browser does next:", language: "Written analysis", kind: "written",
                tests: [{ name: "Page request", input: "GET /books?q=history", expected: "Client, request, server work, and response are all identified" }, { name: "Form submission", input: "A user submits a search form", expected: "Form data is sent to a server endpoint and results are returned" }],
                hints: ["Start at the browser and follow one request to its response.", "A server can validate input, access data, and decide what response to send.", "For the search form, describe the request separately from how the browser renders results."],
                approach: "Draw a two-column client/server sequence, then add arrows for each request and response. Label which side owns each action.",
                walkthrough: "For GET /books?q=history, the browser creates an HTTP request. The server reads q, finds matching data, and sends a status plus HTML or JSON. The browser renders that response.",
                solutionCode: "Client (browser): collects the search query and sends GET /books?q=history.\nServer: validates the query, searches its data, and returns 200 with matching results.\nClient: renders the returned results. A later form submission sends new input to a server endpoint; secrets should use HTTPS and a request body, not the URL.",
                solutionLines: ["Name the browser as the client.", "Describe the request method, path, and relevant input.", "Describe server-side validation or data access.", "Describe the response and how the client uses it."],
                followUp: "Add a simple sequence diagram for a request that receives a 404 response.",
                completionCriteria: ["The trace distinguishes client and server responsibilities.", "Both request and response are described.", "The examples do not place credentials in a URL."]
            },
            {
                id: "explain-http-request-and-response", title: "Explain HTTP request and response", difficulty: "Easy", estimatedTime: "25–35 minutes", topic: "HTTP & HTTPS",
                simplerProblem: "Read a small HTTP exchange and explain what the client asked for and what the server answered.", conceptsToReview: ["HTTP methods", "Status codes", "Headers and body", "HTTPS transport"], learningObjectives: ["Choose an HTTP method and status that fit an operation.", "Explain what HTTPS protects and which application checks remain necessary."],
                prerequisites: ["Client and server roles", "Basic URLs"],
                problemStatement: "For each scenario, choose an appropriate HTTP method and describe the request and response. Include a status code, one useful header, and a small example response body. Explain why HTTPS is important when sending private data.",
                requirements: ["Use GET for reading and POST for creating in the supplied scenarios.", "Use 200 for a successful read and 201 for a successful creation.", "Include Content-Type when a JSON body is sent.", "Explain that HTTPS protects data in transit but does not replace server-side authorization."],
                examples: [{ input: "Read a course with ID 42", output: "GET /courses/42 → 200; response body contains the course.", explanation: "GET retrieves a representation and normally does not create a resource." }, { input: 'Create a course titled "HTTP Basics"', output: 'POST /courses with JSON → 201; response identifies the created course.', explanation: "POST sends creation data in the request body." }],
                starterCode: "Scenario | Method and path | Request body? | Success status | Response\nRead course 42 | | | |\nCreate a course | | | |",
                language: "HTTP analysis", kind: "written",
                tests: [{ name: "Read scenario", input: "Read course 42", expected: "GET /courses/42 and a successful 200 response" }, { name: "Create scenario", input: "Create a course", expected: "POST with JSON body and 201 response" }, { name: "Private data", input: "Send sign-in credentials", expected: "HTTPS is used and credentials are not placed in the URL" }],
                hints: ["Ask whether the action reads existing data or creates new data.", "The status describes the outcome; headers describe metadata about the message.", "HTTPS encrypts traffic in transit, while the server still needs authentication and authorization."],
                approach: "For each action, record method, path, body, status, and response. Keep transport security separate from application permissions.",
                walkthrough: "Reading course 42 maps to GET /courses/42. If it exists and access is allowed, the server can return 200 and a JSON representation with Content-Type: application/json.",
                solutionCode: "Read course: GET /courses/42; no request body; 200 OK; JSON course response.\nCreate course: POST /courses; JSON body {\"title\":\"HTTP Basics\"}; Content-Type: application/json; 201 Created; JSON representation of the created course.\nUse HTTPS for private data in transit. Still validate identity and permissions on the server.",
                solutionLines: ["Choose a method based on the action.", "Include a request body when sending creation data.", "Choose a status that describes the outcome.", "Treat HTTPS, authentication, and authorization as separate protections."],
                followUp: "Add a missing-resource case and explain why it should return 404 instead of a successful empty object.",
                completionCriteria: ["Read and create scenarios use appropriate methods.", "Statuses and JSON metadata are plausible.", "HTTPS is not described as a replacement for authorization."]
            },
            {
                id: "explain-dns-with-an-example", title: "Explain DNS with an example", difficulty: "Easy", estimatedTime: "20–30 minutes", topic: "DNS",
                simplerProblem: "Explain how a human-friendly domain name is looked up so a browser can contact a server.", conceptsToReview: ["Domain names", "DNS lookup", "IP addresses", "Browser request sequence"], learningObjectives: ["Trace a hostname lookup to address information.", "Distinguish DNS resolution from receiving a web response."],
                prerequisites: ["URLs", "Basic client/server concepts"],
                problemStatement: "Trace a first visit to https://learn.example.org/courses. Explain the purpose of a DNS lookup, where the path appears in the process, and what happens after the browser has an address. Avoid claiming that DNS itself returns the web page.",
                requirements: ["Separate the hostname from the URL path.", "Explain that DNS resolves a name to address information.", "Explain that the browser then makes an HTTP request to the destination.", "Mention that caches may avoid a fresh lookup."],
                examples: [{ input: "https://learn.example.org/courses", output: "Hostname: learn.example.org; path: /courses", explanation: "DNS lookup concerns the hostname; the path is sent in the later HTTP request." }, { input: "A cached DNS answer is available", output: "The browser or operating system may reuse it before contacting DNS again.", explanation: "Caching can reduce repeated lookups, subject to record lifetime." }],
                starterCode: "URL: https://learn.example.org/courses\nHostname:\nPath:\nWhat DNS resolves:\nWhat the browser does after resolution:", language: "Written analysis", kind: "written",
                tests: [{ name: "Separate URL parts", input: "https://learn.example.org/courses", expected: "hostname learn.example.org and path /courses" }, { name: "DNS role", input: "Browser needs to reach the hostname", expected: "DNS provides address information, not the page content" }],
                hints: ["Split the URL into scheme, hostname, and path.", "DNS handles the hostname lookup, not the path.", "After resolution, the browser establishes a connection and sends an HTTP request."],
                approach: "Write the sequence as URL parsing → hostname resolution or cache hit → connection → HTTP request → server response.",
                walkthrough: "For https://learn.example.org/courses, the browser identifies learn.example.org as the hostname. DNS or a cache provides address information. The browser then connects securely and requests /courses.",
                solutionCode: "Hostname: learn.example.org\nPath: /courses\nDNS: resolves the hostname to address information (possibly from cache).\nNext: the browser connects to the destination using HTTPS and sends an HTTP request for /courses. The server returns a response; DNS does not return the web page.",
                solutionLines: ["Identify the hostname separately from the path.", "Describe DNS as name-to-address resolution.", "Continue with connection and HTTP request.", "Mention caching without implying the page comes from DNS."],
                followUp: "Compare a DNS cache hit with a cache miss and note what remains the same about the HTTP request.",
                completionCriteria: ["Hostname and path are separated correctly.", "DNS is described as resolution rather than content delivery.", "The later browser request is included." ]
            },
            {
                id: "create-a-simple-rest-api-request", title: "Create a simple REST API request", difficulty: "Easy", estimatedTime: "30–40 minutes", topic: "REST APIs",
                simplerProblem: "Design a small request that retrieves a list of books and another request that creates one book.", conceptsToReview: ["Resource URLs", "HTTP methods", "JSON", "Status codes"], learningObjectives: ["Design collection requests using resource-oriented paths and methods.", "Describe a consistent status and JSON response for each operation."],
                prerequisites: ["HTTP methods", "JSON objects", "Status codes"],
                problemStatement: "Design a minimal REST-style API interaction for a books collection. Specify a GET request to list books and a POST request to add a book. Provide the request body and plausible success responses. Do not include implementation-specific server behavior that the prompt does not define.",
                requirements: ["Use /api/books as the collection resource.", "GET must not include a creation body.", "POST must send a JSON object with title and author.", "Show a JSON response and a status for each successful operation."],
                examples: [{ input: "List books", output: "GET /api/books → 200 with a JSON array", explanation: "The collection path identifies the resource being read." }, { input: 'Create {"title":"Web Basics","author":"A. Lee"}', output: "POST /api/books → 201 with the created book", explanation: "Creation data is sent in JSON in the request body." }],
                starterCode: "GET /api/books\nExpected status:\nExample response body:\n\nPOST /api/books\nContent-Type:\nRequest JSON:\nExpected status and response:", language: "HTTP design", kind: "written",
                tests: [{ name: "List operation", input: "GET /api/books", expected: "200 response with a JSON array" }, { name: "Create operation", input: 'POST with {"title":"Web Basics","author":"A. Lee"}', expected: "201 response containing the created book" }],
                hints: ["Treat books as a collection resource.", "Use GET to retrieve and POST to create.", "A JSON request body should be paired with Content-Type: application/json."],
                approach: "Define each operation as method + resource URL + optional body + expected status and response.",
                walkthrough: "GET /api/books has no creation body and can return 200 with a list. POST /api/books sends title and author as JSON and can return 201 with the created resource.",
                solutionCode: "GET /api/books\n200 OK\n[{\"id\":\"b1\",\"title\":\"Web Basics\",\"author\":\"A. Lee\"}]\n\nPOST /api/books\nContent-Type: application/json\n{\"title\":\"Web Basics\",\"author\":\"A. Lee\"}\n201 Created\n{\"id\":\"b2\",\"title\":\"Web Basics\",\"author\":\"A. Lee\"}",
                solutionLines: ["Use a collection URL for both operations.", "Use GET for retrieval and POST for creation.", "Send creation fields as JSON with the matching content type.", "Return a status and representation that match each action."],
                followUp: "Design GET /api/books/:id and DELETE /api/books/:id, including not-found behavior.",
                completionCriteria: ["The operations use the same resource collection consistently.", "The POST body is valid JSON with the requested fields.", "The methods and success statuses match their purpose."]
            },
            {
                id: "inspect-requests-using-browser-devtools", title: "Inspect requests using browser DevTools", difficulty: "Medium", estimatedTime: "30–45 minutes", topic: "Browsers & Rendering",
                simplerProblem: "Use the browser Network panel to observe one page request and explain the important parts without exposing private data.", conceptsToReview: ["Network panel", "Request URL and method", "Status codes", "Response headers"], learningObjectives: ["Inspect a browser request and explain its role in page loading and rendering.", "Record useful diagnostics while excluding credentials and personal data."],
                prerequisites: ["Browser DevTools basics", "HTTP request and response"],
                problemStatement: "Open a public page you are permitted to inspect and use the Network panel to record one document or fetch request. Report its method, resource type, status, and a non-sensitive response header. Explain whether the browser loaded a document or requested data. Do not copy cookies, authorization headers, or personal information into your notes.",
                requirements: ["Use a public or authorized page.", "Record method, resource type, and status.", "Describe one safe header or response detail.", "Do not reveal cookies, tokens, credentials, or personal information."],
                examples: [{ input: "Reload a public documentation page with Network open", output: "A document request is visible with its method and status.", explanation: "The document request loads the page resource; additional fetches may load data or assets." }, { input: "Filter the Network panel to Fetch/XHR", output: "Data requests can be distinguished from document and image requests.", explanation: "Resource type helps explain what the browser is loading." }],
                starterCode: "Request inspected:\nPage (public/authorized):\nMethod:\nResource type:\nStatus:\nSafe response detail:\nWhat the request does:\nSensitive values excluded? Yes / No",
                language: "Browser investigation", kind: "written",
                tests: [{ name: "Document request", input: "Reload a public page", expected: "Identify a document request and its status" }, { name: "Fetch request", input: "Filter by Fetch/XHR", expected: "Identify one data request if the page makes one" }, { name: "Privacy check", input: "Review your notes", expected: "No cookies, authorization values, tokens, or personal information copied" }],
                hints: ["Open DevTools before reloading so the first document request is captured.", "Use the resource-type filter to distinguish a document from Fetch/XHR.", "Inspect headers selectively and never copy secret request headers."],
                approach: "Capture one request, record only the fields required by the exercise, then explain its role in the page load.",
                walkthrough: "A page reload commonly shows a document request. Its status describes the response outcome. Later Fetch/XHR requests may retrieve data, while scripts, styles, and images load as separate resources.",
                solutionCode: "Example observation (values vary by page):\nMethod: GET\nResource type: document\nStatus: 200\nSafe detail: Content-Type indicates HTML\nPurpose: loads the page document.\nPrivacy: do not copy Cookie or Authorization headers, tokens, or personal data.",
                solutionLines: ["Capture the request while reloading an authorized page.", "Identify method, resource type, and status.", "Explain the request's role in loading the page.", "Remove any sensitive values from notes."],
                followUp: "Compare the document request with one Fetch/XHR request and explain how their response types differ.",
                completionCriteria: ["The request is observed in DevTools and classified.", "A safe response detail is recorded.", "No sensitive header or personal data is included." ]
            }
        ],
        JavaScript: [
            {
                id: "js-word-frequency-map-v1", title: "Count words in a sentence", difficulty: "Easy", estimatedTime: "30–40 minutes", topic: "Objects", learningObjectives: ["Use an object-like Map to count normalized word keys.", "Handle whitespace and empty input without creating invalid entries."],
                simplerProblem: "Read a sentence and count how often each lowercase word appears, even when spaces or letter case vary.", conceptsToReview: ["String trim and split", "Map keys and values", "Case normalization"],
                prerequisites: ["Strings", "Loops", "Map"],
                problemStatement: "In this JavaScript Objects exercise, implement countWords(text) with a Map whose keys are words normalized to lowercase and whose values are occurrence counts. Treat runs of whitespace as separators and ignore empty tokens, then explain when a plain object would be an appropriate alternative key-value representation.",
                requirements: ["Do not mutate the input string or use a global counter.", "Normalize each word with toLowerCase().", "Return an empty Map for empty or whitespace-only input.", "Target O(n) time in the number of characters."],
                examples: [{ input: 'countWords("Red blue red")', output: 'Map { "red" => 2, "blue" => 1 }', explanation: "The two occurrences of Red/red share one normalized key." }, { input: 'countWords("  GO\\tgo  ")', output: 'Map { "go" => 2 }', explanation: "Leading, trailing, and repeated whitespace does not create empty keys." }, { input: 'countWords("   ")', output: "Map {}", explanation: "Whitespace-only input has no words." }],
                starterCode: "function countWords(text) {\n  // Return a Map of lowercase word -> count.\n}\n\nconsole.log(countWords(\"Red blue red\"));",
                language: "JavaScript", tests: [{ name: "repeated word", input: "Red blue red", expected: "red:2, blue:1" }, { name: "mixed whitespace", input: "  GO\\tgo  ", expected: "go:2" }, { name: "empty text", input: "   ", expected: "empty Map" }],
                hints: ["What should the result contain before you process the first word?", "Split on a whitespace regular expression, then remove empty tokens.", "For each normalized token, set its count to (existing count or 0) + 1."],
                approach: "Trim the input, return early if empty, split into tokens, then accumulate normalized keys in a Map.",
                walkthrough: "For `Red blue red`, the Map starts empty. The first token sets red to 1; blue becomes 1; the final red reads 1 and updates it to 2.",
                solutionCode: "function countWords(text) {\n  const counts = new Map();\n  const words = text.trim().split(/\\s+/).filter(Boolean);\n  for (const word of words) {\n    const normalized = word.toLowerCase();\n    counts.set(normalized, (counts.get(normalized) ?? 0) + 1);\n  }\n  return counts;\n}",
                solutionLines: ["Create a new Map so the function does not mutate outside state.", "Trim and split on one or more whitespace characters; filter prevents empty keys.", "Normalize each token before looking it up.", "Read the previous count or zero, increment it, and store the result."],
                complexity: { time: "O(n)", space: "O(u)", explanation: "n is the input length and u is the number of distinct words." },
                followUp: "Extend the function to ignore punctuation while preserving apostrophes inside contractions.",
                completionCriteria: ["All three examples pass when run locally.", "The result is a Map and empty text returns an empty Map.", "The input is not modified."]
            },
            {
                id: "build-a-calculator", title: "Build a validated calculator", difficulty: "Medium", estimatedTime: "45–60 minutes", topic: "Functions", learningObjectives: ["Define a function contract for validated arithmetic inputs.", "Return correct values and reject unsupported or unsafe operations."],
                simplerProblem: "Write one function that safely performs four basic operations and clearly rejects invalid inputs.", conceptsToReview: ["Function parameters and return values", "Finite-number validation", "Conditions and switch"],
                prerequisites: ["Functions", "Conditions", "Number.isFinite"],
                problemStatement: "Implement calculate(left, operator, right) for +, -, *, and /. Return the numeric result. Reject non-finite operands, unknown operators, and division by zero with a RangeError or Error; do not return NaN or Infinity as a successful result.",
                requirements: ["Accept only finite numeric operands.", "Support exactly +, -, *, and /.", "Throw a clear error for an unsupported operator or division by zero.", "Keep arithmetic separate from input parsing."],
                examples: [{ input: 'calculate(8, "/", 2)', output: "4", explanation: "Ordinary division returns a finite result." }, { input: 'calculate(5, "*", 0)', output: "0", explanation: "Zero is a valid operand for multiplication." }, { input: 'calculate(4, "/", 0)', output: "throws RangeError", explanation: "Division by zero is rejected explicitly." }],
                starterCode: "function calculate(left, operator, right) {\n  // Validate operands and operator, then return the result.\n}", language: "JavaScript",
                tests: [{ name: "division", input: '8, "/", 2', expected: "4" }, { name: "zero multiplication", input: '5, "*", 0', expected: "0" }, { name: "divide by zero", input: '4, "/", 0', expected: "RangeError" }],
                hints: ["Validate both operands before entering the operator branches.", "Use a switch statement so unsupported operators have an explicit default case.", "Check right === 0 before returning the division result."],
                approach: "Validate inputs, dispatch on the operator, and reject invalid results before returning. Keep the function pure so it is easy to test.",
                walkthrough: "For 8 / 2, finite-input validation passes, the '/' branch runs, the divisor is nonzero, and the function returns 4.",
                solutionCode: "function calculate(left, operator, right) {\n  if (!Number.isFinite(left) || !Number.isFinite(right)) {\n    throw new TypeError(\"Operands must be finite numbers\");\n  }\n  switch (operator) {\n    case \"+\": return left + right;\n    case \"-\": return left - right;\n    case \"*\": return left * right;\n    case \"/\":\n      if (right === 0) throw new RangeError(\"Cannot divide by zero\");\n      return left / right;\n    default: throw new Error(\"Unsupported operator\");\n  }\n}",
                solutionLines: ["Reject invalid operands before performing arithmetic.", "Switch on the operator to make supported operations explicit.", "Guard the denominator before division.", "Reject unknown operators instead of silently returning undefined."],
                complexity: { time: "O(1)", space: "O(1)", explanation: "Each call performs a fixed number of validations and operations." },
                followUp: "Add a parser for a string expression while keeping parsing separate from calculate().",
                completionCriteria: ["All supported operations return correct results.", "Invalid operands, operators, and division by zero fail clearly.", "No error path is reported as a numeric success."]
            }
        ]
    },
    "Frontend Developer": {
        React: [
            {
                id: "react-search-jobs-v1", title: "Build a searchable job list", difficulty: "Medium", estimatedTime: "50–70 minutes", topic: "State", learningObjectives: ["Represent the user's query as React component state.", "Derive filtered UI from current props and state without mutating source data."],
                simplerProblem: "As the user types, show only jobs whose title, company, or location contains the search text.", conceptsToReview: ["Controlled inputs", "React state", "Array.filter and string normalization"],
                prerequisites: ["Components", "Props", "Array.filter", "Controlled inputs"],
                problemStatement: "Build a React component that receives jobs as props and filters them by a search field. Match title, company, and location case-insensitively. Show the original list when the query is blank and a clear empty state when no jobs match. Keep the search query in React state and derive the visible list from it.",
                requirements: ["Do not mutate the jobs prop.", "Use a controlled input.", "Match any of title, company, or location.", "Announce the result count and provide an empty state."],
                examples: [{ input: "query: 'design'", output: "Only jobs with design in title, company, or location are shown.", explanation: "Matching ignores case." }, { input: "query: '   '", output: "All jobs are shown.", explanation: "Whitespace-only searches behave as an empty query." }],
                starterCode: "function SearchableJobs({ jobs }) {\n  const [query, setQuery] = useState(\"\");\n  // Derive visibleJobs and render the input, count, and list.\n}", language: "JavaScript / JSX",
                tests: [{ name: "case-insensitive match", input: "'DESIGN'", expected: "matching listing remains visible" }, { name: "blank query", input: "'   '", expected: "all listings remain visible" }, { name: "no match", input: "'no-such-role'", expected: "empty state is shown" }],
                hints: ["Trim and lowercase the query once.", "Use some() over the three searchable fields for each job.", "Render a separate empty-state element when visibleJobs.length is zero."],
                approach: "Keep the query in component state and derive visible results during render; do not copy filtered results into a second state variable.",
                walkthrough: "For query `design`, normalize it to `design`, then retain a job if any normalized searchable field includes that substring.",
                solutionCode: "function SearchableJobs({ jobs }) {\n  const [query, setQuery] = useState(\"\");\n  const normalized = query.trim().toLowerCase();\n  const visibleJobs = jobs.filter((job) =>\n    [job.title, job.company, job.location]\n      .filter(Boolean)\n      .some((value) => value.toLowerCase().includes(normalized))\n  );\n  return (\n    <section>\n      <label>Search jobs<input value={query} onChange={(event) => setQuery(event.target.value)} /></label>\n      <p aria-live=\"polite\">{visibleJobs.length} results</p>\n      {visibleJobs.length ? visibleJobs.map((job) => <article key={job.id}>{job.title}</article>) : <p>No jobs match. Try another search.</p>}\n    </section>\n  );\n}",
                solutionLines: ["Store only the editable query in state.", "Normalize it once so case and surrounding whitespace do not affect results.", "Filter the input prop without modifying it; some() matches across fields.", "Render count and empty states from the derived array."],
                followUp: "Add a sort selector and preserve the selected job while filtering.",
                completionCriteria: ["Search matches all three fields without case sensitivity.", "Blank search returns the full input list.", "No results and result count are announced clearly."]
            },
            {
                id: "react-controlled-form-v1", title: "Create a validated contact form", difficulty: "Easy", estimatedTime: "35–45 minutes", topic: "Forms", learningObjectives: ["Control form field values with React state.", "Validate and report field errors before presenting a successful submission."],
                simplerProblem: "Collect a name and email, keep what the user typed, and show success only after both pass checks.", conceptsToReview: ["Controlled form fields", "Submit events", "Accessible labels and validation"],
                prerequisites: ["State", "Events", "HTML labels"],
                problemStatement: "Create a form with name and email fields. Keep both inputs controlled, trim values on submit, reject a blank name and a malformed email, and show field-level feedback. Do not display a success state until validation passes.",
                requirements: ["Associate each label with its input.", "Prevent the browser's default submit only inside the submit handler.", "Preserve entered values when validation fails.", "Show a success summary only for valid values."],
                examples: [{ input: "name: '  ', email: 'a@b.com'", output: "Name error; no success message.", explanation: "Trim before validating." }, { input: "name: 'Asha', email: 'asha@example.com'", output: "Validated confirmation.", explanation: "Both fields meet the basic checks." }],
                starterCode: "function ContactForm() {\n  const [name, setName] = useState(\"\");\n  const [email, setEmail] = useState(\"\");\n  // Add submit validation and accessible feedback.\n}", language: "JavaScript / JSX",
                tests: [{ name: "blank name", input: "name='  '", expected: "field error" }, { name: "valid data", input: "Asha / asha@example.com", expected: "success summary" }],
                hints: ["Keep each input value in state.", "Build an errors object in the submit handler.", "Render success only when the error object is empty."],
                approach: "Control field values, normalize only for validation/submission, and render error state separately from submitted success.",
                walkthrough: "A blank name remains visible in the field and adds a name error. Correcting it and submitting again clears the error and can show confirmation.",
                solutionCode: "function ContactForm() {\n  const [name, setName] = useState(\"\");\n  const [email, setEmail] = useState(\"\");\n  const [error, setError] = useState(\"\");\n  const [submitted, setSubmitted] = useState(false);\n  function submit(event) {\n    event.preventDefault();\n    const cleanName = name.trim();\n    const cleanEmail = email.trim();\n    if (!cleanName) { setError(\"Enter your name.\"); setSubmitted(false); return; }\n    if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(cleanEmail)) { setError(\"Enter a valid email.\"); setSubmitted(false); return; }\n    setError(\"\"); setSubmitted(true);\n  }\n  return <form onSubmit={submit}>/* labeled controlled fields */</form>;\n}",
                solutionLines: ["Keep input values in state so the displayed value always matches React state.", "Prevent default submission in the event handler.", "Trim values and validate before setting submitted=true.", "Clear stale success when a later submission is invalid."],
                followUp: "Add an async submit state and keep the button disabled while a request is pending.",
                completionCriteria: ["Both fields are controlled and labeled.", "Invalid submission shows an error and never shows success.", "Valid submission shows confirmation."]
            }
        ]
    },
    "Backend Developer": {
        "Express.js": [
            {
                id: "express-task-filter-v1", title: "Build a validated task-list endpoint", difficulty: "Medium", estimatedTime: "50–70 minutes", topic: "Routing", learningObjectives: ["Define an Express route that maps query input to a response.", "Validate scalar query values and preserve the API response envelope."],
                simplerProblem: "Return all tasks by default, or only tasks with one accepted status; reject malformed filters.", conceptsToReview: ["Express query parameters", "Allowlist validation", "HTTP status codes"],
                prerequisites: ["Express routing", "Query strings", "HTTP status codes"],
                problemStatement: "Implement Express routing for GET /api/tasks with an optional status query. Accept only pending or completed. Return the matching in-memory task records in the existing { success, data } envelope. Reject a repeated status parameter or an unsupported value with HTTP 400.",
                requirements: ["Do not use the query value as a regular expression.", "Treat omitted status as all tasks.", "Reject arrays/repeated values and unsupported values.", "Keep the task collection unchanged."],
                examples: [{ input: "GET /api/tasks?status=pending", output: "200 { success: true, data: [pending tasks] }", explanation: "Only pending tasks are returned." }, { input: "GET /api/tasks?status=done", output: "400 { success: false, message: 'Invalid status' }", explanation: "The status is not allowlisted." }],
                starterCode: "router.get(\"/api/tasks\", (req, res) => {\n  const { status } = req.query;\n  // Validate and filter tasks.\n});", language: "JavaScript",
                tests: [{ name: "omitted filter", input: "GET /api/tasks", expected: "all tasks" }, { name: "valid filter", input: "?status=pending", expected: "pending only" }, { name: "invalid filter", input: "?status=done", expected: "400" }],
                hints: ["Check typeof status before treating it as a string.", "Allowlist values with a Set.", "Filter with exact equality and preserve the response envelope."],
                approach: "Validate query shape and allowed values first, then apply exact-match filtering and return a stable JSON response.",
                walkthrough: "A request with no status uses the full array. A pending query filters with task.status === 'pending'. An unsupported or repeated value exits before filtering with 400.",
                solutionCode: "const allowedStatuses = new Set([\"pending\", \"completed\"]);\nrouter.get(\"/api/tasks\", (req, res) => {\n  const status = req.query.status;\n  if (status !== undefined && (typeof status !== \"string\" || !allowedStatuses.has(status))) {\n    return res.status(400).json({ success: false, message: \"Invalid status\" });\n  }\n  const data = status ? tasks.filter((task) => task.status === status) : tasks;\n  return res.json({ success: true, data });\n});",
                solutionLines: ["Use a Set to express the accepted values.", "Express query parsing can yield non-string values for repeated or bracket-form input; reject those.", "Use strict equality for the filter; no regex is needed.", "Return before filtering on invalid input."],
                followUp: "Add page/limit validation and apply bounded pagination after filtering.",
                completionCriteria: ["Omitted, pending, and completed filters behave correctly.", "Repeated and unsupported values return 400.", "The response envelope stays consistent."]
            },
            {
                id: "express-body-validation-v1", title: "Validate task creation before persistence", difficulty: "Medium", estimatedTime: "45–60 minutes", topic: "Validation", learningObjectives: ["Validate request bodies at the API boundary.", "Prevent invalid input from reaching persistence and return actionable client errors."],
                simplerProblem: "Check a task title on the server before saving, and never save or report success for invalid input.", conceptsToReview: ["Schema validation", "Middleware ordering", "201 and 400 responses"],
                prerequisites: ["Express middleware", "Joi schemas", "POST status codes"],
                problemStatement: "Add POST /api/tasks that accepts a JSON title and optional description. The title must be a trimmed string from 2 to 80 characters. Reject unknown fields and invalid content with HTTP 400 before calling the persistence service.",
                requirements: ["Validate at the server boundary.", "Call persistence only with validated values.", "Return 201 only after the create operation succeeds.", "Do not expose raw database errors."],
                examples: [{ input: '{"title":" Review API "}', output: "201 with normalized title 'Review API'", explanation: "Whitespace is trimmed before persistence." }, { input: '{"title":"x"}', output: "400 validation error", explanation: "The title is too short." }],
                starterCode: "const taskSchema = Joi.object({ /* define fields */ });\nrouter.post(\"/api/tasks\", validate(taskSchema), createTask);", language: "JavaScript",
                tests: [{ name: "valid title", input: "Review API", expected: "201 after service success" }, { name: "short title", input: "x", expected: "400, service not called" }, { name: "extra property", input: "{title, admin}", expected: "400" }],
                hints: ["Set trim and min/max constraints in the schema.", "Configure unknown keys to be rejected or stripped according to the API contract.", "Keep the create service after validation middleware."],
                approach: "Use schema middleware to validate and normalize the request before the controller; only then call persistence.",
                walkthrough: "A valid title is trimmed by Joi and passed to the service. A short title exits in middleware, so no database write is attempted.",
                solutionCode: "const taskSchema = Joi.object({\n  title: Joi.string().trim().min(2).max(80).required(),\n  description: Joi.string().max(500).allow(\"\")\n}).unknown(false);\nrouter.post(\"/api/tasks\", validate(taskSchema), async (req, res) => {\n  try {\n    const task = await taskService.create(req.body);\n    return res.status(201).json({ success: true, data: task });\n  } catch {\n    return res.status(500).json({ success: false, message: \"Could not create task\" });\n  }\n});",
                solutionLines: ["The schema defines accepted fields and normalizes the title.", "Validation middleware prevents invalid bodies from reaching the handler.", "The service receives only validated data.", "The handler returns 201 only after create resolves and hides unexpected error details."],
                followUp: "Add authentication and derive the task owner from req.user, never from the body.",
                completionCriteria: ["Valid input reaches the service with a trimmed title.", "Invalid and unknown input is rejected before persistence.", "Failures do not return a false 201 response."]
            }
        ]
    },
    "AI Engineer": {
        RAG: [
            {
                id: "rag-chunk-provenance-v1", title: "Chunk a document without losing provenance", difficulty: "Medium", estimatedTime: "50–70 minutes", topic: "Chunking", learningObjectives: ["Create bounded text chunks without losing source offsets or paragraph identity.", "Preserve document and chunk provenance needed for retrieval citations."],
                simplerProblem: "Split text into size-limited pieces while keeping enough source information to find where every piece came from.", conceptsToReview: ["Whitespace tokenization", "Array indexes", "Metadata and stable ordering"],
                prerequisites: ["Arrays", "Text normalization", "Document metadata"],
                problemStatement: "Write chunkParagraphs(documentId, paragraphs, maxChars). Return ordered chunks that do not exceed maxChars. Keep each paragraph intact when it fits; split an oversized paragraph at whitespace. Every chunk must retain documentId, a zero-based chunkIndex, and the original paragraph index.",
                requirements: ["Ignore blank paragraphs but do not renumber the original paragraph indexes.", "Do not split a word when a whitespace boundary is available.", "Reject maxChars < 8.", "Return an empty array for no non-empty paragraphs."],
                examples: [{ input: 'paragraphs=["Alpha beta", "Gamma"], maxChars=20', output: 'chunks retain paragraphIndex 0 and 1', explanation: "Each paragraph fits and remains separately traceable." }, { input: 'paragraphs=["alpha beta gamma delta epsilon"], maxChars=12', output: '["alpha beta", "gamma delta", "epsilon"]', explanation: "Words are packed at spaces without any chunk exceeding 12 characters." }],
                starterCode: "function chunkParagraphs(documentId, paragraphs, maxChars) {\n  // Return text plus stable source metadata.\n}", language: "JavaScript",
                tests: [{ name: "blank paragraph", input: '["", "A useful paragraph"]', expected: "no blank chunk; source index retained" }, { name: "oversized text", input: "maxChars=12", expected: "no chunk exceeds 12 characters" }, { name: "invalid bound", input: "maxChars=5", expected: "RangeError" }],
                hints: ["Validate maxChars before processing.", "Track paragraphIndex before filtering blank input.", "Build a current text buffer and flush it before appending a word that would exceed maxChars."],
                approach: "Process original paragraphs in order, split only oversized paragraphs into words, then pack words into bounded chunks while attaching source metadata at creation time.",
                walkthrough: "With maxChars 12, `alpha beta` has length 10. Adding `gamma` would exceed the limit, so emit the first chunk and begin the next one with gamma.",
                solutionCode: "function chunkParagraphs(documentId, paragraphs, maxChars) {\n  if (!Number.isInteger(maxChars) || maxChars < 8) throw new RangeError(\"maxChars must be at least 8\");\n  const chunks = [];\n  paragraphs.forEach((paragraph, paragraphIndex) => {\n    const words = paragraph.trim().split(/\\s+/).filter(Boolean);\n    let text = \"\";\n    const emit = () => { if (text) chunks.push({ text, metadata: { documentId, chunkIndex: chunks.length, paragraphIndex } }); text = \"\"; };\n    for (const word of words) {\n      if (word.length > maxChars) throw new RangeError(\"A single word exceeds maxChars\");\n      const candidate = text ? `${text} ${word}` : word;\n      if (candidate.length > maxChars) emit();\n      text = text ? `${text} ${word}` : word;\n    }\n    emit();\n  });\n  return chunks;\n}",
                solutionLines: ["Reject invalid bounds before creating output.", "Iterate original paragraphs with their original index.", "Build a word buffer and emit it before it would exceed the character limit.", "Assign chunkIndex from the output length so it is stable within the result."],
                followUp: "Add overlap while preserving source offsets and verify that overlap does not exceed the maximum size.",
                completionCriteria: ["All chunks respect maxChars.", "Source document and paragraph metadata are preserved.", "Blank inputs produce no empty chunks and invalid limits fail clearly."]
            },
            {
                id: "rag-retrieval-evaluation-v1", title: "Evaluate evidence retrieval", difficulty: "Hard", estimatedTime: "75–100 minutes", topic: "RAG Evaluation", learningObjectives: ["Measure whether a retriever returns the expected evidence within top-k results.", "Report evaluated and skipped cases without conflating retrieval with answer quality."],
                simplerProblem: "For each answerable question, check whether its expected source appears within the first k retrieved results, then report the share that did.", conceptsToReview: ["Top-k ranking", "Set membership", "Hit rate and denominators"],
                prerequisites: ["Chunk metadata", "Vector search", "Precision and recall"],
                problemStatement: "For RAG evaluation, given a set of test questions and ranked retrieved chunk IDs, calculate hit rate at k: the fraction of questions whose expected source ID appears in the first k results. Ignore answer generation; this exercise measures retrieval only.",
                requirements: ["Validate that k is a positive integer.", "A question with no expected source is excluded and counted separately.", "Do not count duplicate retrieved IDs more than once for a question.", "Return hitRate, evaluatedCount, and skippedCount."],
                examples: [{ input: "expected=[a,b,null], results=[[x,a],[b],[z]], k=2", output: "hitRate=1, evaluatedCount=2, skippedCount=1", explanation: "Both answerable cases find their source in the top two; one case is unanswerable." }, { input: "expected=[a,b], results=[[x],[x,a]], k=1", output: "hitRate=0, evaluatedCount=2, skippedCount=0", explanation: "Both top-1 results are x: neither the expected source a nor the expected source b is retrieved, so both cases miss." }],
                starterCode: "function hitRateAtK(cases, k) {\n  // Return hitRate, evaluatedCount, and skippedCount.\n}", language: "JavaScript",
                tests: [{ name: "source in top k", input: "expected=a, results=[x,a], k=2", expected: "hit" }, { name: "source below k", input: "expected=a, results=[x,b,a], k=2", expected: "miss" }, { name: "unanswerable case", input: "expected=null", expected: "skipped" }, { name: "both top-1 results miss", input: "expected=[a,b], results=[[x],[x,a]], k=1", expected: "hitRate=0, evaluatedCount=2, skippedCount=0" }],
                hints: ["Separate unanswerable cases before scoring.", "Use a Set of the first k results for duplicate-safe membership.", "Divide hits by evaluatedCount; define behavior when evaluatedCount is zero."],
                approach: "Validate k, split skipped from evaluated cases, count one hit per evaluated question, and return both the denominator and skipped count so the metric is interpretable.",
                walkthrough: "At k=2, `[x,a]` contains expected source a and is a hit. `[z]` has no expected source, so it is skipped rather than counted as failure.",
                solutionCode: "function hitRateAtK(cases, k) {\n  if (!Number.isInteger(k) || k < 1) throw new RangeError(\"k must be a positive integer\");\n  const evaluated = cases.filter((item) => item.expectedSourceId);\n  const skippedCount = cases.length - evaluated.length;\n  const hits = evaluated.filter((item) =>\n    new Set(item.retrievedIds.slice(0, k)).has(item.expectedSourceId)\n  ).length;\n  return {\n    hitRate: evaluated.length ? hits / evaluated.length : null,\n    evaluatedCount: evaluated.length,\n    skippedCount\n  };\n}",
                solutionLines: ["Validate k to avoid confusing slices or invalid top-k metrics.", "Keep unanswerable cases out of the retrieval denominator and report them explicitly.", "Inspect only the first k IDs and use Set membership for clarity.", "Return null when there are no evaluable cases instead of reporting a misleading zero."],
                complexity: { time: "O(n × k)", space: "O(k)", explanation: "For n question cases, each case examines at most k retrieved IDs and creates a temporary set of at most k IDs." },
                followUp: "Add reciprocal rank or recall@k and compare two retrieval configurations on the same labeled set.",
                completionCriteria: ["Hit rate matches the examples.", "Unanswerable cases are reported separately.", "Invalid k and zero evaluated cases have explicit behavior."]
            }
        ]
    }
};

const exerciseSlug = (value) => String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

// Turn existing, authored topic lessons into practice activities. Each activity
// is grounded in that lesson's own objectives, tutorial, quiz, examples, and
// mistakes; nothing is published for topics that lack lesson material.
export const buildLessonPracticeExercises = (career, phaseTitle, phaseTopics) => {
    const lessons = ROADMAP_PRACTICE_LESSONS[career]?.[phaseTitle] || {};

    return phaseTopics.flatMap((topicValue) => {
        const topic = typeof topicValue === "string"
            ? topicValue
            : topicValue?.title || topicValue?.name || topicValue?.topic || topicValue?.label;
        const lesson = lessons[topic];
        if (!topic || !lesson?.explanation || !lesson?.quiz?.question || !lesson?.quiz?.answer) return [];

        const objectives = lesson.objectives?.length
            ? lesson.objectives
            : [`Explain and apply ${topic} using the lesson example.`];
        const tutorial = lesson.tutorial?.length ? lesson.tutorial : [lesson.explanation];
        const examples = [
            {
                input: lesson.useCase || lesson.quiz.question,
                output: lesson.output || lesson.quiz.answer,
                explanation: lesson.quiz.explanation || lesson.explanation
            },
            {
                input: lesson.quiz.question,
                output: lesson.quiz.answer,
                explanation: lesson.quiz.explanation || lesson.explanation
            }
        ];
        const modes = [
            {
                suffix: "apply",
                title: `Apply ${topic}`,
                difficulty: "Easy",
                estimatedTime: "15–25 minutes",
                problemStatement: `Complete this topic's next step: ${lesson.nextStep || `create a small example that demonstrates ${topic}`}. Use the lesson objectives to explain the choices you make and what result you expect.`,
                requirement: `Address this objective: ${objectives[0]}`,
                hint: "Start with the smallest example in the lesson, then change one input or condition and predict what should happen."
            },
            {
                suffix: "debug",
                title: `Diagnose a ${topic} mistake`,
                difficulty: "Medium",
                estimatedTime: "20–30 minutes",
                problemStatement: `Review this common issue from the lesson: ${lesson.mistakes?.[0] || `an implementation does not follow the expected ${topic} behavior`}. Explain how you would reproduce it, identify its cause, and correct it without introducing a new failure.`,
                requirement: "Include one observable check that would show the correction works.",
                hint: "Compare the behavior with the lesson's explanation and test one assumption at a time."
            },
            {
                suffix: "teach-back",
                title: `Explain ${topic} with an example`,
                difficulty: "Hard",
                estimatedTime: "25–35 minutes",
                problemStatement: `Answer the lesson check: ${lesson.quiz.question} Then create a second example that demonstrates the same ${topic} principle and explain why its result follows.`,
                requirement: `Connect your answer to this learning objective: ${objectives[objectives.length - 1]}`,
                hint: "State the rule first, trace the example step by step, then explain a boundary or alternative case."
            }
        ];

        return modes.map((mode) => {
            const isCoding = Boolean(lesson.code);
            return {
                id: `guided-${exerciseSlug(career)}-${exerciseSlug(phaseTitle)}-${exerciseSlug(topic)}-${mode.suffix}-v1`,
                title: mode.title,
                career,
                phase: phaseTitle,
                topic,
                kind: isCoding ? "coding" : "written",
                difficulty: mode.difficulty,
                estimatedTime: mode.estimatedTime,
                simplerProblem: lesson.useCase || lesson.nextStep || lesson.explanation,
                conceptsToReview: lesson.prerequisites?.length ? lesson.prerequisites : [topic],
                prerequisites: lesson.prerequisites || [],
                problemStatement: mode.problemStatement,
                learningObjectives: objectives,
                requirements: [mode.requirement, "Use the supplied lesson material; clearly state any assumption you make."],
                examples,
                starterCode: "",
                language: isCoding ? "JavaScript" : "Written response",
                tests: [
                    { name: "Apply the lesson", input: examples[0].input, expected: examples[0].output },
                    { name: "Explain the concept", input: lesson.quiz.question, expected: lesson.quiz.answer }
                ],
                hints: [mode.hint, ...tutorial].slice(0, 4),
                approach: lesson.explanation,
                walkthrough: `${examples[0].input} Expected: ${examples[0].output}. ${examples[0].explanation}`,
                solutionCode: isCoding
                    ? lesson.code
                    : `${lesson.explanation}\n\nExample: ${examples[0].input}\nExpected: ${examples[0].output}\n\nCheck: ${lesson.quiz.question}\nAnswer: ${lesson.quiz.answer}`,
                solutionLines: tutorial.slice(0, 5),
                commonMistakes: lesson.mistakes || [],
                followUp: lesson.nextStep || `Create a second example that uses ${topic} in a different situation.`,
                completionCriteria: objectives
            };
        });
    });
};

// Reading coverage is independent of the original lesson-derived exercise set.
export const ROADMAP_LESSONS = buildLessonCatalog(ROADMAP_PRACTICE_LESSONS, ROADMAP_EXERCISES);
