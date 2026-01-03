---
description: Reorganize file contents according to framework-specific ordering conventions
allowed-tools: mcp__context7__*, Task
argument-hint: [path]
---

## Step 1: Fetch Documentation

Use context7 to fetch:

- React docs on component structure and hooks rules
- Next.js docs on file conventions and metadata API
- Node.js docs on module patterns

## Step 2: Analyze and Reorganize

Scan `$ARGUMENTS` (default: entire project) and reorganize according to these ordering conventions:

## Ordering Conventions

### Imports (top of file)

1. Node.js built-ins (`node:fs`, `node:path`)
2. External packages (`react`, `next`, `express`)
3. Internal aliases (`@/lib`, `@/components`)
4. Relative imports (`./utils`, `../hooks`)
5. Type-only imports last within each group
6. Side-effect imports at the very end (`import './styles.css'`)

### After Imports

1. Type definitions and interfaces
2. Constants and configuration
3. Schemas (Zod, Yup, etc.)
4. Helper/utility functions (pure, no dependencies)

### React Components

1. Type definitions (Props, State)
2. Constants used by component
3. Component function
    - Hooks (useState, useEffect, custom) — in order of dependency
    - Derived state / memos
    - Callbacks / handlers
    - Effects
    - Early returns (loading, error states)
    - Main JSX return
4. Subcomponents (if not extracted)
5. Default export

### Next.js Specific

1. Metadata exports (`generateMetadata`, `metadata`)
2. Config exports (`dynamic`, `revalidate`, `runtime`)
3. `generateStaticParams` (for dynamic routes)
4. Main page/layout component
5. Default export

### Node.js Servers / Modules

1. Imports
2. Types
3. Constants / config
4. Singleton initialization (clients, connections)
5. Helper functions (pure utilities)
6. Core business logic functions
7. Route handlers / event handlers
8. Middleware
9. Server setup / initialization
10. Exports

### Exports (bottom of file)

1. Named exports grouped logically
2. Default export last

## Output Format

For each file:

1. Current order summary
2. Violations found
3. Suggested reordering with rationale
4. Refactored file (or diff if preferred)