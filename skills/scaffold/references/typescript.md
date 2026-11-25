# TypeScript / JavaScript

## Names

### Package name

The `name` field in `package.json` must be lowercase, URL-safe, and free of spaces; npm rejects anything else for new packages. Use kebab-case, and use `@scope/name` for organizations and monorepo packages.

### Directories

Use kebab-case.

### Files

The community is genuinely split on file naming, which makes this the place where step 3 of SKILL.md (repo conventions win) matters most. In a new project, use these defaults:

- **Modules** use kebab-case: `invoice-service.ts`.
- **Component files** use PascalCase matching the component: `InvoiceTable.tsx`. This is the most common React convention. Kebab-case component files are also widespread, and Angular's style guide uses `invoice-table.component.ts`.
- **Framework-reserved names always win.** For example, the Next.js app router uses `page.tsx`, `layout.tsx` and `route.ts`, with folders like `[id]/` for dynamic segments and `(group)/` for route groups.

### Tests

Use `*.test.ts`, which Vitest and Jest find by default. NestJS and Angular codebases use `*.spec.ts`.

## Library

```
data-viz-tools/
├── package.json
├── tsconfig.json
├── README.md
├── .gitignore
└── src/
    ├── index.ts         # public entry point; re-exports the public API
    └── index.test.ts
```

### Tests

Colocate tests beside the code by default in new TypeScript projects. Test runners find them anywhere, and a test next to its module is hard to forget. A root `tests/` folder is also fine; follow the repo if it uses one.

### Build output

Compiled output goes to `dist/`, which is gitignored. In `package.json`:

- set `"type": "module"`;
- describe entry points with `"exports"` (plus `"types"`) rather than only `"main"`;
- set `"files": ["dist"]` so only the build gets published.

## Apps

Use the generator: `npm create vite@latest`, `npx create-next-app@latest`, `npm create astro@latest`. Then add the conventions on top of what it produces.

Once an app grows, organize `src/` by feature (`src/features/billing/...`), and keep shared UI primitives in `src/components/`.

## Monorepo

```
my-workspace/
├── package.json          # "private": true, plus "workspaces" (npm/yarn)
├── pnpm-workspace.yaml   # pnpm only
├── apps/
│   └── web/
└── packages/
    └── ui/
```

Put deployable things in `apps/` and shared libraries in `packages/`; Turborepo's templates use this split. Nx workspaces have historically used `libs/` instead of `packages/`, so follow whichever the repo already has.

Give internal packages scoped names such as `@my-workspace/ui`.

## `.gitignore`

Ignore:

- `node_modules/`
- `dist/` and `coverage/`
- `*.log`
- `.env` and `.env.*`, but keep `.env.example` tracked
- framework output such as `.next/` or `.astro/`

## Adding a module to an existing repo

- **Check `tsconfig.json` for path aliases** such as `@/`, and import the way siblings do.
- **Check for barrel files.** If siblings have an `index.ts`, add one. If a parent `index.ts` re-exports the siblings, add the new module to it.
- **For a new package in a workspace monorepo**, copy the shape of the nearest sibling package: its `package.json` scripts, its `tsconfig` `extends`, and its test setup. Add the package to the workspace list unless a glob already covers it.
