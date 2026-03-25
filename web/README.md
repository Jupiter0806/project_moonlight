# Product Readiness Checklist: Core Architecture & Design

## 1. System Architecture

- **Framework:** Next.js (App Router, react-compiler)
- **Rendering Model:** Hybrid (Server Components + Client Components) with Streaming.
- **Architectural Style:** Modular Monolith / Micro-Frontend (Logical separation by feature domain).
- **Development Methodology:** Component-Driven Development (CDD).
- **Project Structure:** Feature-Based Folder Structure (Colocation of logic, UI, and tests).

## 2. Feature Modules & Rendering Strategies

The application consists of three primary domains, each optimized for specific performance metrics and user interaction patterns.

### A. Chamber (Interaction Layer)

**Domain:** Real-time user input (Q&A) and dynamic AI responses.
**Optimization Goal:** minimize Interaction to Next Paint (INP) and preserve main thread responsiveness.
**Rendering Strategy:** **Client Components with Server Actions (Streaming)**.

- **Why:** While the initial shell is server-rendered for immediate First Contentful Paint (FCP), the rich interactivity of typing and chat management requires client-side state. We utilize Server Actions to stream AI responses directly into the client component, avoiding heavy client-side fetching waterfalls.
- **Key Metrics:** INP, TTI (Time to Interactive).

### B. Camphor (Preservation Layer)

**Domain:** Feeds of recent reflections and topic-based updates.
**Optimization Goal:** Immediate shell visibility and progressive data loading.
**Rendering Strategy:** **Server Components (RSC) with Suspense Streaming**.

- **Why:** The generic layout should load instantly (low TTFB). The dynamic list of reflections, which may involve longer database queries, is wrapped in React Suspense boundaries. This allows the server to send the HTML shell immediately and stream the content list as soon as it's ready, preventing the page from blocking.
- **Key Metrics:** FCP (First Contentful Paint), LCP (Largest Contentful Paint).

### C. Moonlight (Review Layer)

**Domain:** Daily summarization and review dashboard.
**Optimization Goal:** Data completeness and visual stability.
**Rendering Strategy:** **Server Components (RSC) with Suspense Streaming**.

- **Why:** Similar to Camphor, this is a read-heavy view. We prioritize rendering the dashboard layout on the server to reduce client-side JavaScript bundle size. Charts and interactive elements will be isolated Client Components ("Islands") hydrated only when visible or necessary.
- **Key Metrics:** TBT (Total Blocking Time), CLS (Cumulative Layout Shift).

## 3. Automated Quality Gates

We enforce code quality early in the development lifecycle ("Shift Left") to prevent technical debt and runtime errors.

- **Formatting & Style:** **Prettier** (Auto-formatting) + **EditorConfig**.
- **Static Analysis:** **ESLint** (React/Next.js best practices, accessibility rules).
- **Type Safety:** **TypeScript** (Strict mode enabled, no `any`).
- **Pre-commit Hooks:** **Husky** + **lint-staged**.
  - Ensures all staged files pass linting and formatting.
  - **Secret Scanning:** Prevents accidental credential commits.

## 4. Test Strategy

We follow the "Testing Trophy" approach, prioritizing integration confidence over granular unit isolation.

- **Unit Tests:** **Jest**. Focus on utility functions, custom hooks, and complex business logic algorithms.
- **Component/Integration Tests:** **React Testing Library**. Focus on user interactions, accessibility (a11y), and rendering states (loading/error) by mocking data layers.
- **End-to-End (E2E) Tests:** **Playwright**. Focus on critical user journeys (Authentication, Core "Chamber" flow, "Moonlight" dashboard). Coverage is limited to stable, high-value paths to avoid maintenance fatigue.

## 5. CI/CD Pipeline

The pipeline ensures that every commit is verifiable and every deployment is reproducible.

### A. Pipeline Workflow (GitHub Actions)

1.  **Validation (On Pull Request)**
    - **Static Checks:** Parallel execution of Lint, Prettier, and TypeScript compilation.
    - **Tests:** Run Unit and Integration suites.
    - **Security:** SAST (Static Application Security Testing) and dependency auditing (e.g., `npm audit`, Snyk).

2.  **Preview Environment (Ephemeral)**
    - **Deploy:** Automatic deployment to a temporary URL (Vercel Preview / Netlify).
    - **E2E Smoke Tests:** Playwright runs against the _live_ preview URL to verify critical paths work in a realistic environment.

3.  **Build & Artifact (On Merge to Main)**
    - **Build Once, Deploy Many:** Generate the production artifact (Docker image or `.next` standalone build) once. Configuration is injected at runtime via environment variables.

4.  **Production Deployment**
    - **Promotion:** The verified artifact is promoted to the production environment.
    - **Zero Downtime:** Rolling updates or Blue/Green deployment strategy.

### B. Visual Pipeline Workflow

```mermaid
flowchart TD
    %% Trigger Events
    PR([Pull Request]) --> CI_Start
    Merge([Merge to Main]) --> CD_Start

    %% CI / PR Phase
    subgraph CI_Phase ["CI: Validation & Preview"]
        direction TB
        CI_Start{Start Gates}

        subgraph Parallel_Jobs ["Parallel Validation"]
            Static["Static Analysis<br/>(Lint/Prettier/TS)"]
            Tests["Test Suites<br/>(Unit/Integration)"]
            Sec["Security<br/>(SAST/Audit)"]
        end

        PreviewDep["Deploy Preview<br/>(Ephemeral URL)"]
        SmokeTest["E2E Smoke Tests<br/>(Playwright)"]

        CI_Start --> Static & Tests & Sec
        Static & Tests & Sec --> PreviewDep
        PreviewDep --> SmokeTest
    end

    %% CD / Main Phase
    subgraph CD_Phase ["CD: Build & Production"]
        direction TB
        CD_Start{Start Deploy}

        Build["Build Artifact<br/>(Docker / .next)"]
        Promote["Promote to Production<br/>(Zero Downtime)"]

        CD_Start --> Build
        Build --> Promote
    end

    %% Flow Connection
    SmokeTest -- "Approval" --> Merge

    %% Styling
    classDef event fill:#fff3e0,stroke:#f57c00,stroke-width:2px,color:#000
    classDef job fill:#e3f2fd,stroke:#1565c0,stroke-width:1px,color:#000

    class PR,Merge,CI_Start,CD_Start event
    class Static,Tests,Sec,PreviewDep,SmokeTest,Build,Promote job
```

## 6. Git Branching Strategy

We utilize a rigorous **GitHub Flow** enhanced with environmental stages to ensure stability while allowing parallel development of future versions and emergency maintenance.

### A. Branch Definitions

- **`main` (Production):**
  - **Source of Truth:** The live production code.
  - **Protection:** Strict blocking. No direct commits allowed. Requires PR merge.
  - **Tagging:** Automated Semantic Versioning tags (e.g., `v1.2.0`) are generated upon every merge.

- **`dev` (Development):**
  - **Integration Hub:** The default target for today's work and the current release candidate.
  - **Protection:** No direct commits. Requires reviews and passing CI.

- **`feat/*` (Feature Work):**
  - **Scope:** Short-lived branches for a single user story, bug fix, or task.
  - **Lifecycle:** Branched from `dev`, implemented, and merged back into `dev` via Pull Request. Deleted after merge.

- **`hotfix/*` (Critical Maintenance):**
  - **Scope:** Emergency patches for production incidents that cannot wait for the next release cycle.
  - **Strategy:** Branched from `main`, fixed, and merged into **both** `main` (patch prod) and `dev` (prevent regression).

- **`releases/*` (Parallel Future Development):**
  - **Scope:** A temporary workspace for the _next_ major version (e.g., `releases/v2.0`) while the current version (v1.x) is still being finalized on `dev`.
  - **Maintenance:** Must regularly **sync (rebase/merge)** from `dev` to consume bug fixes and prevent conflict accumulation.
  - **Exit Strategy:** Once the current release (v1.x) ships to `main`, this branch merges back into `dev` and is deleted.

### B. Governance Rules

1.  **Platform:** GitHub is the single command center.
2.  **Protection Rule:** `main` and `dev` enforce:
    - **Require Pull Request Reviews:** At least 1 approval.
    - **Require Status Checks:** CI (Build/Test/Lint) must pass.
    - **No Direct Pushes:** All changes come via PR.

### C. Workflow Visualization

```mermaid
gitGraph
    commit id: "Init"
    branch dev
    checkout dev
    commit id: "v1-Start"

    %% 1. START PARALLEL WORK: V2 Team starts early
    branch releases/v2.0
    checkout releases/v2.0
    commit id: "v2-Feat-A"

    %% 2. CURRENT WORK: V1 Team continues on dev
    checkout dev
    commit id: "v1-Feat-B"

    %% 3. MAINTENANCE: V2 Team re-syncs dev changes (Avoid Conflicts)
    checkout releases/v2.0
    merge dev id: "Sync-v1-Updates"
    commit id: "v2-Feat-C"

    %% 4. DEPLOY V1: Current version ships
    checkout dev
    commit id: "v1-Finalize"
    checkout main
    merge dev id: "Deploy-v1.0" tag: "v1.0.0"

    %% 5. HOTFIX: Emergency on Prod
    branch hotfix/v1.0.1
    commit id: "Critical-Fix"
    checkout main
    merge hotfix/v1.0.1 id: "Patch-Prod" tag: "v1.0.1"
    checkout dev
    merge hotfix/v1.0.1 id: "Patch-Dev"

    %% 6. CONSOLIDATION: V1 is done, Merge V2 into Dev
    checkout dev
    merge releases/v2.0 id: "Merge-v2-to-Dev"
```

## x. Performance & Observability

### A. Optimization

#### i. Lazy loading

#### ii. Tree shaking

Enforce Modular import, avoid "Barrel Files" for large libraries. A "barrel file" is an index.ts that re-exports everything(Example shown as below), which can _de-opt_ tree shaking in some scenarios, causing the bundler to process files you aren't using.

```typescript
// components/index.ts
export * from "./Button";
export * from "./Table";
export * from "./Modal"; // ...and 50 others
```

For huge 3rd-party libraries (like lodash or heavy UI libraries) that don't support ESM tree shaking well, you can configure next.config.js to rewrite imports automatically:

```js
/* next.config.mjs */
const nextConfig = {
  modularizeImports: {
    "lucide-react": {
      transform: "lucide-react/dist/esm/icons/{{member}}",
    },
  },
};
```

This forces import { Home } from 'lucide-react' to become import Home from 'lucide-react/dist/esm/icons/home', ensuring you only bundle the one icon.

#### iii. Code splitting

Route-based and Component-based will be handled by Next.js automatically. More granularly, split heavy components using `next/dynamic`(lazy loading).
