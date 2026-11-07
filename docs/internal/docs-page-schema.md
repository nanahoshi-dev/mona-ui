# Documentation page schema

Status: **draft**. The manifest, checker and API reference exist, but the site does not read from the manifest yet, and most pages have not been migrated.

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
- **Pages sharing an entry point** name their exports with `apiExports` in the manifest. `apiAlsoFrom` adds another entry point's exports, as the dropdowns do with `dropdowns`.

`npm run check:api-docs` also fails when the public API uses a type no entry point exports, because a consumer couldn't name it and the page couldn't describe it. `npm run generate:api-docs -- --report` lists them.

## Guide pages

Guides in Get Started (`kind: "guide"`) need a title and lead, and otherwise have no fixed sections, because their subject varies. The checker validates their manifest entries but not their headings.

## The manifest

Each page declares `path`, `title`, `kind`, `description`, and `entryPoint` for components. Descriptions are one plain sentence, with no markdown, since they are reused by search results, page metadata and `llms.txt`.

The file must stay free of Angular imports so scripts can load it under plain Node. For the same reason it does not hold sidebar icons or `loadComponent` functions; see Next steps.

The checker always fails when the manifest and `routes.ts` disagree, when a page is listed twice, or when an entry point has no `public-api.ts`.

### Categories

Get Started, Actions, Form Fields, Selection, Date Time & Color, Data, Charts, Navigation, Overlays, Layout, Feedback.

### Nesting

Add `children` only when a topic has its own examples and is worth linking to directly. Everything else stays an in-page section. No page has children yet, because each child needs a route. The planned trees are:

- **Chart:** Overview, then series grouped by family (the current library has 20 series types), Axes, Annotations, Interaction.
- **Grid:** Overview, then a page per major feature. Server binding and row sizing already have their own demos.

Keep nesting to two levels. Use links with disclosure buttons, not `role="tree"`.

## Where the pages stand

Measured on 2026-11-07, with every route and entry point matching the manifest:

| Group | Pages | Work needed |
|---|---|---|
| Matches the schema | 1 | `popup-menu` |
| Heading edits only | 34 | Renames, plus dividing `Accessibility & Forms Integration` on 16 pages |
| Restructuring | 26 | Moving sections, or demoting one-off headings to H3 |
| No content | 3 | Writing the page |

- **No content:** `date-picker`, `datetime-picker` and `time-picker` have a one-line description and no markdown.
- **Most restructuring:** `otp-input`, `rating`, `label`, `chart` and `radio-button`.

## Next steps

1. Rename headings across the 34 simple pages.
2. Restructure the 26 pages, and write the 3 missing ones.
3. Add `check:docs-schema --strict` to `pr.yml` once all pages pass.
4. Have the sidebar and routes read the manifest. The sidebar can keep a small icon map keyed by path. Routes can stay in `routes.ts`, kept honest by the checker, since a generated route file would add a build step for little gain.

The planned command menu gets a manifest entry under Navigation when its route exists.
