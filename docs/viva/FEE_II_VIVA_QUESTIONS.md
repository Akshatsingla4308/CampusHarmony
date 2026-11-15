# FRONT END ENGINEERING-II (25CSE0203) — VIVA QUESTION BANK

**Course Title:** Front End Engineering-II (FEE-II)  
**Course Code:** 25CSE0203  
**Target Audience:** Chitkara University BE CSE, Batch 2025 (Semester III)  
**Evaluation:** Project-Based Evaluation III (40 Marks)  
**Structure:** 30 Basic Questions + 20 Intermediate Questions + 10 Project-Specific Questions + Viva Tips  

---

## PART 1: 30 BASIC VIVA QUESTIONS & ANSWERS

### Q1: What is HTML5 and why is semantic markup important?
**Answer:** HTML5 is the standard markup language for the web. Semantic tags (like `<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, and `<footer>`) describe their meaning to both the browser and developer, improving search engine optimization (SEO), accessibility (screen readers), and code readability.

### Q2: What is the CSS Box Model?
**Answer:** Every HTML element is represented as a rectangular box comprising four concentric layers:
1. **Content:** The text or image itself.
2. **Padding:** Transparent spacing between the content and the border.
3. **Border:** The line wrapping around the padding and content.
4. **Margin:** Transparent spacing outside the border separating the element from neighbors.

### Q3: What is the difference between `box-sizing: content-box` and `border-box`?
**Answer:** In `content-box` (default), `width` sets only the content area; padding and border add to the element's rendered width. In `border-box`, `width` includes content, padding, and border, making responsive layout calculations much simpler and predictable.

### Q4: Explain the difference between CSS Flexbox and CSS Grid.
**Answer:** 
- **Flexbox:** One-dimensional layout system (lays items out in a row *or* a column). Ideal for navbars, toolbars, and dynamic item alignment.
- **Grid:** Two-dimensional layout system (lays items out in rows *and* columns simultaneously). Ideal for page-level structural layouts and dashboards.

### Q5: What are the differences between `var`, `let`, and `const` in JavaScript?
**Answer:**
- `var`: Function-scoped, hoisted to the top with `undefined`, can be re-declared and updated.
- `let`: Block-scoped (`{}`), hoisted into a "temporal dead zone", cannot be re-declared in the same scope, but can be updated.
- `const`: Block-scoped, cannot be re-declared or reassigned after initialization.

### Q6: What are JavaScript primitive data types?
**Answer:** JavaScript has 7 primitive types: `string`, `number`, `bigint`, `boolean`, `undefined`, `symbol`, and `null`. Primitives are immutable and compared by value.

### Q7: What is the difference between `==` and `===`?
**Answer:** `==` (loose equality) performs type coercion before comparison (e.g., `'5' == 5` is `true`). `===` (strict equality) checks both value and data type without coercion (e.g., `'5' === 5` is `false`). Always prefer `===`.

### Q8: What is the DOM (Document Object Model)?
**Answer:** The DOM is a tree-structured programmatic representation of an HTML document created by the browser. It allows programming languages like JavaScript to inspect, manipulate, create, and delete HTML elements dynamically.

### Q9: What is event bubbling and event capturing?
**Answer:** When an event occurs on an element:
1. **Capturing phase:** The event trickles down from the `window` to the target element.
2. **Target phase:** The event reaches the target element.
3. **Bubbling phase:** The event bubbles back up from the target element through all its parent ancestors.

### Q10: How do you prevent event bubbling in JavaScript?
**Answer:** Call `event.stopPropagation()` inside the event handler function.

### Q11: What is a Single Page Application (SPA)?
**Answer:** An SPA is a web application that loads a single HTML page once. As the user navigates, JavaScript dynamically rewrites the DOM without reloading the full page from the server, providing a fast, native app-like user experience.

### Q12: What is React and what problem does it solve?
**Answer:** React is an open-source JavaScript library developed by Meta for building user interfaces using declarative, reusable components. It solves the performance and complexity issues of manually querying and updating the browser DOM.

### Q13: What is JSX in React?
**Answer:** JSX (JavaScript XML) is a syntax extension that allows developers to write HTML-like markup inside JavaScript files. It is transpiled by build tools (like Babel or Vite/esbuild) into standard `React.createElement()` JavaScript calls.

### Q14: What is the Virtual DOM and how does it work?
**Answer:** The Virtual DOM is a lightweight, in-memory JavaScript representation of the real DOM. When component state changes:
1. React creates a new Virtual DOM tree.
2. It compares it with the previous tree using a "diffing algorithm".
3. It computes the minimal set of changes (reconciliation) and updates only those specific nodes in the real browser DOM.

### Q15: What is the difference between `props` and `state`?
**Answer:**
- **Props (Properties):** Read-only inputs passed from a parent component to a child component. They cannot be modified by the child.
- **State:** Internal, mutable data managed by the component itself. When state changes, the component re-renders.

### Q16: What is a React Component?
**Answer:** A self-contained, reusable piece of user interface. Modern React uses Functional Components, which are plain JavaScript functions that accept `props` as an argument and return JSX.

### Q17: What are React Hooks?
**Answer:** Hooks are special functions introduced in React 16.8 that allow functional components to use state and other React features (lifecycle, context) without writing class components. (e.g., `useState`, `useEffect`, `useContext`).

### Q18: What is `useState` and how does it work?
**Answer:** `useState` is a React hook that declares a state variable. It takes the initial value as an argument and returns an array with two elements: the current state value and a setter function to update it (e.g., `const [count, setCount] = useState(0)`).

### Q19: What is `useEffect` and what are its common use cases?
**Answer:** `useEffect` lets functional components perform side effects such as data fetching, setting up subscriptions, or manually interacting with the browser DOM. It runs after the component renders.

### Q20: What is the dependency array in `useEffect`?
**Answer:**
- **Omitted (`useEffect(fn)`):** Runs after *every* render.
- **Empty array (`useEffect(fn, [])`):** Runs *only once* when the component mounts (loads).
- **With dependencies (`useEffect(fn, [id])`):** Runs on mount and re-runs whenever any dependency in the array changes.

### Q21: Why shouldn't you update state directly (e.g., `state.count = 5`)?
**Answer:** React tracks state changes via setter functions (e.g., `setCount(5)`). Direct mutation does not notify React of the change, so the component will not re-render, leading to out-of-sync UI.

### Q22: What is the purpose of the `key` prop in React lists?
**Answer:** The `key` prop gives elements in an array a stable identity. It helps React's diffing algorithm determine which items have been added, removed, or reordered, avoiding unnecessary DOM re-creations and maintaining input focus/state.

### Q23: Why should you never use array index as a `key` if the list changes?
**Answer:** If items are inserted, deleted, or reordered, the index of each item changes. This confuses React's reconciliation, causing subtle rendering bugs, incorrect animation states, and form inputs retaining wrong values. Always use a unique identifier (like `student.id` or `student.roll`).

### Q24: What is "Lifting State Up"?
**Answer:** When two or more sibling components need access to the same state, you lift that state up to their closest common parent component. The parent then passes the state down via `props` along with callback functions to update it.

### Q25: What is a Controlled Component?
**Answer:** An HTML form input element whose value is controlled by React state (e.g., `<input value={name} onChange={e => setName(e.target.value)} />`). React is the single source of truth for the input's current value.

### Q26: What is the difference between Synchronous and Asynchronous JavaScript?
**Answer:**
- **Synchronous:** Code executes line-by-line sequentially; each task blocks the execution of the next task until it completes.
- **Asynchronous:** Long-running tasks (like network HTTP requests or timers) execute in the background via the browser event loop, allowing other code to run without freezing the UI.

### Q27: What is a JavaScript Promise?
**Answer:** An object representing the eventual completion (or failure) of an asynchronous operation and its resulting value. It exists in one of three states: `pending`, `fulfilled`, or `rejected`.

### Q28: What is `async/await`?
**Answer:** Syntactic sugar built on top of JavaScript Promises. It allows asynchronous code to be written and read like synchronous code, using `async` to declare a function returning a promise and `await` to pause execution until the promise resolves.

### Q29: What is `localStorage`?
**Answer:** A browser Web Storage API that allows web applications to store key-value string pairs persistently across browser sessions with no expiration time, typically up to 5–10 MB.

### Q30: What is CORS (Cross-Origin Resource Sharing)?
**Answer:** A browser security mechanism that restricts web applications from making HTTP requests to a domain, protocol, or port different from the one that served the web page, unless the server explicitly sends `Access-Control-Allow-Origin` headers.

---

## PART 2: 20 INTERMEDIATE VIVA QUESTIONS & ANSWERS

### Q31: How does the React 19 reconciliation algorithm work?
**Answer:** React uses a heuristic $O(n)$ diffing algorithm based on two assumptions:
1. Two elements of different types will produce different trees (React tears down the old tree and mounts the new one).
2. The developer can hint at which child elements are stable across renders using the `key` prop.

### Q32: What is the React Context API and when should it be used?
**Answer:** Context provides a way to pass data through the component tree without having to pass props down manually at every level ("prop drilling"). It is ideal for global state like current user authentication, UI theme, or language preferences.

### Q33: What is the difference between Context API and Redux?
**Answer:** Context API is built into React and designed for low-to-medium frequency global state (like user identity or theme). Redux is an external state management library designed for complex, high-frequency state updates with time-travel debugging and strict unidirectional action dispatch pipelines.

### Q34: What is React Router and how does client-side routing work?
**Answer:** React Router is a declarative routing library. It intercepts browser URL changes using the HTML5 `History` API (`pushState`/`popState`) and conditionally renders matching component trees without triggering a full page reload from the web server.

### Q35: What is the difference between `useCallback` and `useMemo`?
**Answer:**
- `useMemo`: Caches the *result* of a complex, expensive calculation between renders (`const val = useMemo(() => compute(a), [a])`).
- `useCallback`: Caches a *function instance* between renders so it can be passed to optimized child components without causing them to re-render (`const fn = useCallback(() => doSomething(a), [a])`).

### Q36: What is a Custom Hook in React?
**Answer:** A JavaScript function whose name begins with `use` and can call other React hooks. Custom hooks extract and share reusable stateful logic (such as fetching data or managing window size) across multiple components without duplicating code.

### Q37: How does conditional rendering work in React?
**Answer:** React evaluates standard JavaScript expressions to decide what UI to render:
- Ternary operator: `{isLoading ? <LoadingState /> : <DataTable />}`
- Logical AND (`&&`): `{hasError && <ErrorMessage />}`
- Early return: `if (!data) return <LoadingState />;`

### Q38: What is Vite and why is it faster than Webpack?
**Answer:** Vite is a modern frontend build tool. During development, it leverages native browser ES Modules (ESM) to serve code instantly without bundling the entire project upfront. For production, it uses Rollup to generate highly optimized, tree-shaken static assets.

### Q39: What is Tree Shaking in modern JavaScript bundlers?
**Answer:** A dead-code elimination technique used during the production build step. By analyzing ES6 `import`/`export` statements statically, the bundler removes unused functions and modules, significantly reducing final bundle size.

### Q40: What is an Error Boundary in React?
**Answer:** A React component that catches JavaScript errors anywhere in its child component tree, logs those errors, and displays a fallback UI instead of crashing the entire application with a blank screen.

### Q41: What is the difference between `fetch()` and `axios`?
**Answer:**
- `fetch()`: Native browser API, returns raw response, requires manual JSON parsing (`res.json()`), does not reject HTTP error codes like 404/500 automatically.
- `axios`: Third-party library, automatically transforms JSON data, intercepts requests/responses, and automatically throws errors on non-2xx status codes.

### Q42: What is the purpose of HTTP interceptors in an API client?
**Answer:** Interceptors allow inspecting, modifying, or enriching HTTP requests and responses globally before they reach `.then()` or `.catch()`. For example, automatically attaching Bearer tokens or formatting errors.

### Q43: How does CSS styling differ between vanilla CSS, CSS Modules, and Tailwind CSS?
**Answer:**
- **Vanilla CSS:** Global scope, risk of class name collisions across large teams.
- **CSS Modules:** Locally scoped CSS classes generated automatically (e.g., `Button_btn__1a2b3`) to prevent style leaks.
- **Tailwind CSS:** Utility-first framework where classes are composed directly in markup (`flex items-center p-4 bg-white`), eliminating the need to write custom CSS rules.

### Q44: What are the Core Web Vitals?
**Answer:** Standardized metrics defined by Google to measure real-world user experience:
1. **LCP (Largest Contentful Paint):** Loading performance (should occur within 2.5s).
2. **FID / INP (First Input Delay / Interaction to Next Paint):** Responsiveness (should be under 200ms).
3. **CLS (Cumulative Layout Shift):** Visual stability (should score $< 0.1$).

### Q45: What is accessibility (a11y) in frontend engineering?
**Answer:** Designing and developing websites so that people with disabilities can perceive, understand, navigate, and interact with them. Involves semantic HTML, ARIA labels, sufficient color contrast, keyboard-navigable focus states, and screen reader compatibility.

### Q46: How do you optimize web images for fast loading?
**Answer:** Use modern compressed formats (`WebP`, `AVIF`), define explicit `width` and `height` to prevent layout shifts (CLS), specify `loading="lazy"` for below-the-fold images, and use responsive `<picture>` tags.

### Q47: What is the purpose of `package.json` and `package-lock.json`?
**Answer:**
- `package.json`: Manifest listing project metadata, scripts, and semantic version ranges for dependencies (`^1.2.0`).
- `package-lock.json`: Locks down the exact, deterministic dependency tree (down to commit hashes/sub-dependencies), ensuring identical builds across all machines.

### Q48: What is Vitest and how does it compare to Jest?
**Answer:** Vitest is a next-generation test runner native to Vite. It reuses the same configuration, plugins, and transform pipeline as Vite, resulting in dramatically faster test startup, instant HMR for tests, and out-of-the-box ESM and TypeScript support without extra Babel config.

### Q49: What is React Testing Library (RTL) and what is its core philosophy?
**Answer:** RTL is a testing utility for React components. Its guiding principle is: *"The more your tests resemble the way your software is used, the more confidence they can give you."* It tests behavior from the user's perspective (querying by text, label, or role) rather than implementation details (component state or internals).

### Q50: How do you handle authentication persistence in single-page applications?
**Answer:** Store the authentication token or user session payload in `localStorage` or `sessionStorage` (or HttpOnly cookies for enterprise security). On initial app boot, an `AuthContext` reads the stored token and restores user state before rendering protected routes.

---

## PART 3: 10 PROJECT-SPECIFIC QUESTIONS & CODE REFERENCES

### Q51: How is persona switching (Faculty vs. Student) implemented in Campus Harmony?
**Answer:** 
Implemented in `frontend/src/context/AuthContext.jsx`. The context maintains an `activePersona` state (`faculty` or `student`). Helper functions `switchPersona(role)` update both React state and `localStorage`. When the user switches personas:
1. `Sidebar.jsx` dynamically updates the navigation links (e.g., faculty sees CRUD actions and grading tools; students see read-only attendance and marks).
2. `Navbar.jsx` updates the active role pill and displays student or teacher metadata.
**Reference:** `frontend/src/context/AuthContext.jsx#L15-L65`

### Q52: How does `DataTable.jsx` handle client-side searching, sorting, and pagination?
**Answer:**
`frontend/src/components/common/DataTable.jsx` is a generic, reusable data grid:
- **Search:** Uses `.filter()` across all object properties matching the search term case-insensitively.
- **Sort:** Uses `[...data].sort()` with dynamic comparator evaluation based on `sortKey` and `sortOrder` (`asc`/`desc`).
- **Pagination:** Uses `.slice((currentPage - 1) * pageSize, currentPage * pageSize)` to compute visible records, alongside an interactive page navigator.
**Reference:** `frontend/src/components/common/DataTable.jsx#L20-L85`

### Q53: How does Campus Harmony preserve and link the original evaluated vanilla HTML/CSS/JS portal?
**Answer:**
The original evaluated portal was placed in `frontend/public/sms/` (containing `index.html`, `students.html`, `attendance.html`, `reports.html`, `styles.css`, and `app.js`).
1. In the React navbar and sidebar, a direct link routes to `/sms/index.html`.
2. A dedicated React container page `VanillaPortal.jsx` embeds the legacy application inside an iframe while providing a direct button to open it in a full tab.
**Reference:** `frontend/src/pages/VanillaPortal.jsx#L1-L45`

### Q54: How does `frontend/src/lib/api.js` centralize REST communication and error handling?
**Answer:**
All HTTP requests route through helper functions (`apiGet`, `apiPost`, `apiPut`, `apiDelete`) wrapping native `fetch()`. The helper automatically sets `'Content-Type': 'application/json'`, checks `res.ok`, and parses JSON. If the server returns an error status (e.g., 400 or 500), it extracts the backend `message` from `ApiResponse` and throws a JavaScript `Error` with that exact description.
**Reference:** `frontend/src/lib/api.js#L1-L60`

### Q55: How does the Attendance module calculate defaulters and classes needed?
**Answer:**
In `frontend/src/pages/Attendance.jsx` and `Defaulters.jsx`:
- Defaulter condition: `(presentDays / totalDays) * 100 < 75.0`.
- Shortfall classes formula:
  $$\text{needed} = \left\lceil \frac{0.75 \times \text{totalDays} - \text{presentDays}}{0.25} \right\rceil$$
- The UI displays a `<StatusBadge status="Defaulter" />` in red and highlights the recovery count in bold orange.
**Reference:** `frontend/src/pages/Defaulters.jsx#L30-L75`

### Q56: How does the Marks entry page dynamically handle different assessment tiers?
**Answer:**
In `frontend/src/pages/Marks.jsx`, the component provides a selector for exam types (`ST1`, `ST2`, `END_TERM`, `PRACTICAL`). The maximum marks dynamically adjust based on exam type (`ST1`/`ST2` max 30, `END_TERM` max 100, `PRACTICAL` max 50). Client-side validation checks `0 <= marks <= maxMarks` before sending `POST /api/marks` to the backend.
**Reference:** `frontend/src/pages/Marks.jsx#L40-L110`

### Q57: How do Vitest and React Testing Library verify component behavior in this project?
**Answer:**
Located in `frontend/src/components/__tests__/`:
- `DataTable.test.jsx`: Renders mock data, simulates user typing into the search input, and asserts that filtered rows match.
- `MetricCard.test.jsx`: Verifies title, value, icon, and trend percentages render properly.
- `StatusBadge.test.jsx`: Tests badge color variants (`Active`, `Defaulter`, `Warning`).
Running `npm run test` executes 19 assertions in under 2 seconds.
**Reference:** `frontend/src/components/__tests__/DataTable.test.jsx`

### Q58: How does the application prevent blank-screen crashes during network errors?
**Answer:**
Every page component wraps API calls in `try ... catch ... finally` blocks. On failure:
1. `loading` state is set to `false`.
2. An `error` state is populated with the message.
3. The UI conditionally renders `<ErrorMessage message={error} onRetry={fetchData} />`, providing the user with a retry button instead of a broken layout.
**Reference:** `frontend/src/components/common/ErrorMessage.jsx`

### Q59: How does the DBMS & Java Demo page interact with backend stored procedures and threads?
**Answer:**
- On `/dbms-demo`, clicking "Run Defaulter Procedure" sends `POST /api/dbms/defaulter-report`, which triggers MySQL stored procedure `sp_generate_attendance_defaulter_report` with a cursor, updating the audit table and refreshing the UI table.
- On `/java-demo`, clicking "Run Parallel Attendance Batch" sends `POST /api/java-demo/concurrency-simulation`, invoking `AttendanceProcessingDemo` with 4 worker threads, rendering execution time and thread worker IDs.
**Reference:** `frontend/src/pages/DbmsDemo.jsx` & `frontend/src/pages/JavaDemo.jsx`

### Q60: How is the production bundle built and served locally?
**Answer:**
Running `npm run build` triggers Vite's production pipeline:
- Compiles JSX and Tailwind CSS into minified CSS and JavaScript chunks (`dist/assets/index-[hash].js`).
- Inspects dependencies and tree-shakes unused code.
- Generates a static production bundle served by any static web server or embedded within Spring Boot.
**Reference:** `frontend/vite.config.js` and `frontend/package.json`

---

## PART 4: TOP 10 COMMON MISTAKES TO AVOID IN FEE-II VIVA

1. **Saying "HTML is a programming language":** HTML is a *markup language*; JavaScript is the programming language.
2. **Modifying state directly:** Never write `this.state = ...` or `studentList.push(newStudent)`. Always use the setter (`setStudentList([...studentList, newStudent])`).
3. **Using array indexes as React keys:** When the evaluator asks why you used `key={student.id}`, explain that stable IDs prevent reconciliation rendering bugs.
4. **Confusing Props and State:** Remember: Props are *passed into* a component (read-only); State is *managed within* the component (mutable).
5. **Forgetting the `useEffect` dependency array:** An empty array `[]` means run on mount only; omitting it causes an infinite re-render loop if state is updated inside.
6. **Thinking Virtual DOM is slower than Real DOM:** Virtual DOM batching minimizes expensive layout and paint calculations in the browser.
7. **Not knowing the port numbers:** Campus Harmony runs frontend on `http://localhost:5173` (Vite dev) or `http://localhost:8081` (preview) and backend on `http://localhost:8080`.
8. **Claiming you used cloud services:** Emphasize that Campus Harmony is **100% local, offline, and self-contained** (MySQL, Spring Boot, React).
9. **Forgetting to mention the evaluated legacy portal:** Always highlight that the original vanilla portal was preserved under `frontend/public/sms/` and integrated cleanly.
10. **Panic when asked about errors:** Explain your clean error-handling pattern (`try/catch`, `ErrorMessage` component with retry button).
