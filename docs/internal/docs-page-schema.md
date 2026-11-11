# Documentation page schema

Status: **draft**. The manifest, checker, API reference and navigation exist, but most pages have not been migrated.

Every documentation page follows the same structure, and one manifest describes every page. A script enforces both, because a written convention alone will drift.

| Piece | Location |
|---|---|
| Page manifest | `projects/mona-ui-tester/src/app/layout/docs-manifest.ts` |
| Checker | `npm run check:docs-schema` (add `--verbose` for per-page detail, `--strict` to fail on any finding) |
| Checker tests | `projects/mona-ui-tester/scripts/check-docs-schema.spec.ts`, run by `npm run test:audit` |
| API reference | `npm run generate:api-docs` writes it, `npm run check:api-docs` fails in CI when it's out of date |

## Component pages

A page reads from top to bottom in this order. Section names are exact.

| # | Section | Required | Contains |
|---|---|---|---|
| 1 | Title and lead (H1) | Yes | The component name, its selector, and one or two sentences on what it is. |
| 2 | Playground | Yes | The live showcase, rendered by the page's demo component. It has no markdown heading. |
| 3 | `## Overview` | Yes | When to use it, and when to use something else instead. |
| 4 | `## Import & Quick Start` | Yes | The import and the smallest working example. |
| 5 | `## Anatomy` | No | The parts of a composed component and the templates it exposes. |
| 6 | `## Examples` | See below | Focused scenarios, one H3 each. |
| 7 | `## Appearance & Styling` | See below | Looks, sizes and class customization. |
| 8 | `## Theming` | No | Design tokens specific to this component. |
| 9 | `## Behavior` | No | Non-obvious rules, edge cases and technical notes. |
| 10 | `## Forms Integration` | No | Signal forms binding and validation behavior. |
| 11 | `## Accessibility` | Yes | Roles, keyboard interaction and what the consumer must provide. |
| 12 | `## API` | Yes | Generated from the entry point's exports and their JSDoc. Never written by hand. |

A page needs at least one of **Examples** or **Appearance & Styling**, because a simple component's usage often is its visual options.

### Rules

- **Topics go under H3.** Anything else, such as `Length` or `Clipboard Paste & Autofill`, becomes an H3 inside the section it belongs to, usually Examples or Behavior. This keeps the right-hand page navigation comparable between pages.
- **Keyboard goes under Accessibility.** `Keyboard Interaction` and `Keyboard Navigation` become H3s there.
- **No front matter.** `ngx-markdown` would render it as visible text. Page metadata lives in the manifest, which the compiler and checker can validate.
- **Each section has one file.** Under `assets/docs/<page path>/`, `intro.md` holds section 1, the demo component is section 2, `guide.md` holds sections 3 to 11, and the generated `api.md` holds section 12.

## The API section

`api.md` describes what the page's entry point exports from its `public-api.ts`, so anything a consumer can import is documented, and nothing else is. To change what a page says, change the library's JSDoc and run `npm run generate:api-docs`.

- **Descriptions** come from the `@description` tag or the plain comment, and a default is read from the code. `@default` is only for what the code can't say, such as an expression.
- **Components and directives:** a public property or method appears only if it has a JSDoc comment. Many are public only so a template or sibling can reach them, so a comment is how a member says it's for consumers. Mark one `@internal` to hide it even with a comment. Inputs and outputs always appear.
- **Plain classes, services, interfaces, types, functions and constants:** everything exported and public appears.
- **Styling types** (`*VariantProps`, `*VariantInput`) don't appear, because inputs spell out their values.
- **Template context** comes from a directive's `ngTemplateContextGuard`.
- **Types from another entry point** link to the page that documents them. When that entry point has no page, as with `common`, the type is shown on the page using it.
- **Pages sharing an entry point** name their exports with `apiExports` in the manifest. A page of that entry point without `apiExports` documents the exports no other page names, so a new export always lands somewhere: the chart family and grid feature pages name theirs, and Chart Overview and Grid Overview take the rest. `apiAlsoFrom` adds another entry point's exports, as the dropdowns do with `dropdowns`.

`npm run check:api-docs` also fails when the public API uses a type no entry point exports, because a consumer couldn't name it and the page couldn't describe it. `npm run generate:api-docs -- --report` lists them.

## Guide pages

Guides in Get Started (`kind: "guide"`) need a title and lead, and otherwise have no fixed sections, because their subject varies. The checker validates their manifest entries but not their headings.

## The manifest

Each page declares `path`, `title`, `kind`, `description`, and `entryPoint` for components. Descriptions are one plain sentence, with no markdown, since they are reused by search results, page metadata and `llms.txt`.

The sidebar, breadcrumb, document title and previous and next links read from it, through `layout/services/docs-navigation.service.ts`. Routes stay in `routes.ts`, kept honest by the checker, since a generated route file would add a build step for little gain.

The file must stay free of Angular imports so scripts can load it under plain Node. For the same reason it does not hold `loadComponent` functions, and the guides' sidebar icons live in `sidebar-group.component.ts`.

The checker always fails when the manifest and `routes.ts` disagree, when a page is listed twice, or when an entry point has no `public-api.ts`.

### Categories

Get Started, Actions, Form Fields, Selection, Date Time & Color, Data, Charts, Navigation, Overlays, Layout, Feedback.

### Nesting

Add `children` only when a topic has its own examples and is worth linking to directly. Everything else stays an in-page section. No page has children yet, because each child needs a route, and the sidebar will need to render them when the first one arrives.

- **Charts** don't nest. The Charts category holds Chart Overview and one page per series family (Line & Area, Bar & Waterfall, Scatter & Bubble, Financial, Heatmap, Pie & Donut, Funnel, Treemap, Radar & Polar, Radial), each with its own playground. The playgrounds share `PartsDemoContainerComponent` and nothing else, so one family's demo never depends on another's.
- **Grid** doesn't nest either. The Grid category holds Grid Overview and one page per feature (Sorting & Filtering, Grouping & Aggregates, Selection, Editing, Columns, Rows, Server Binding & Virtualization, State & Export), each with its own playground. A feature directive's panel is a part with `placement: "host"`, so the code sample writes its bindings on `<mona-grid>` rather than nesting it.

Keep nesting to two levels. Use links with disclosure buttons, not `role="tree"`.

## Examples

An example is a real component in `src/app/examples/<page>/<name>`, so it's compiled with the site, and a guide shows it with a fenced block:

````markdown
```example
button/looks
```
````

The page runs it, shows its source and can send it to StackBlitz as a generated project (`example-project.ts`). An example can only import from Angular, Mona UI, Lucide, RxJS and its own folder, since that's all the project has, and its markup goes in a template file. After adding one, run `npm run generate:examples`. `check:examples` fails if the registry is stale, an example breaks these rules, or a guide doesn't show it exactly once.

## Search

`npm run build:search-index` builds the search index from the manifest and the markdown each page's component shows, and `build:tester` and `serve:tester` run it first. The index goes to `dist/docs-search` and is served at `/pagefind`. It's rebuilt only when one of those starts, so a dev server keeps searching the text it started with.

A new page needs nothing extra, as long as its component names its markdown with `src="docs/…"`. The script fails if it finds no markdown for a page, except the ones listed in `PAGES_WITHOUT_MARKDOWN`. A heading's link in the results relies on `docs-heading-id.ts`, which the site and the script share.

## AI docs

`npm run generate:ai-docs` writes the docs as plain markdown for coding agents, and `build:tester` and `serve:tester` run it first. It reads the same manifest and markdown as search, and writes to `dist/docs-ai`, which the site serves from its root:

- `/components/<page>.md`: one page, headed by its title, description and entry point. Each example's files replace its `example` block, so the code is there to read. HTML comments and H1s are left out, and links to other pages point at their markdown files.
- `/llms.txt`: the essentials from `projects/mona-ui-tester/ai/llms-essentials.md`, then a link to every page, grouped as in the sidebar.
- `/llms-full.txt`: every page in one file.

`npm run build:prod` also runs it with `--package`, which puts the pages in the package's `docs` folder and an `llms.txt` that links to them at its root, so an installed version carries the docs that match it. `verify:package` fails if a page that `llms.txt` links to is missing.

Keep `llms-essentials.md` short. It's what an agent reads first: installing, importing, providers, and the mistakes worth warning about.

## Where the pages stand

Every component page matches the schema, and `pr.yml` runs `check:docs-schema --strict` so they keep matching.

The command menu's page is under Navigation.
