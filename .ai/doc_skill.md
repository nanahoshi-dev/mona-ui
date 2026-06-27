You are working in the `mona-ui` repository.

Your task is to produce a strict, source-grounded first documentation pass for the requested Mona UI component or component family.

Target library:

* Package: `@mirei/mona-ui`
* Framework: Angular 22
* Component library source: `projects/mona-ui/src/lib`
* Demo/tester app: `projects/mona-ui-tester/src/app`
* Existing component docs: `projects/mona-ui-tester/src/app/docs/components`
* Existing component demos: `projects/mona-ui-tester/src/app/demo/components`
* Public package surface: `projects/mona-ui/src/lib/index.ts`, re-exported by `projects/mona-ui/src/public-api.ts`
* Generated component metadata: `projects/mona-ui-tester/src/assets/component-metadata.json`
* Metadata generator: `projects/mona-ui-tester/scripts/extract-metadata.ts`

Requested documentation scope:
`<COMPONENT_OR_COMPONENT_FAMILY_HERE>`

Examples:

* `button`
* `dropdown-list`
* `date-picker`, `datetime-picker`, and `time-picker`
* `grid`
* `list-view`
* `tabs`
* `tree-view`
* `tooltip` and `tooltip-directive`

Primary objective:
Create useful first-pass written documentation for the requested component(s), integrated into the existing tester/docs app, without inventing unsupported behavior and without exposing implementation details as public API.

This is not a redesign task.
This is not a refactor task.
This is a documentation task with small supporting code changes only when required for documentation quality.

The final documentation must be useful to two audiences:

1. Human Angular developers using Mona UI for the first time.
2. AI coding agents that need predictable, source-grounded documentation structure.

Do not make human-facing documentation verbose only because AI agents may read it. Agent-readability should come from clear headings, consistent API tables, precise examples, and source-grounded structure, not from dumping implementation details into the page.

Before editing anything, inspect these files and directories:

1. Repository instructions:

    * `AGENTS.md`
    * `CLAUDE.md`
    * `.eslint.config.mjs`
    * `package.json`

2. Library source for the requested component:

    * Relevant folder(s) under `projects/mona-ui/src/lib`
    * Component/directive `.ts` files
    * Template files
    * Style files
    * Public models/types
    * Utility files used by the component
    * Any base classes or inherited APIs
    * Tests/specs if present

3. Public API:

    * `projects/mona-ui/src/lib/index.ts`
    * `projects/mona-ui/src/public-api.ts`
    * Any barrel exports in the component folder

4. Existing tester/demo implementation:

    * Existing doc component under `projects/mona-ui-tester/src/app/docs/components/<component>-doc`
    * Existing demo component under `projects/mona-ui-tester/src/app/demo/components/<component>-demo`
    * Any shared demo helpers such as code viewer, demo container, event viewer, API input list item, section components, or configuration helpers
    * `projects/mona-ui-tester/src/app/routes.ts`

5. Generated metadata:

    * `projects/mona-ui-tester/src/assets/component-metadata.json`
    * `projects/mona-ui-tester/scripts/extract-metadata.ts`

Documentation rules:

1. Do not hallucinate. Every documented behavior must be grounded in source code, demos, tests, public types, styles, or existing metadata.

2. If behavior is likely but not proven, do not present it as fact. Use one of these instead:

    * `TODO(owner-review): confirm ...`
    * `Not documented yet because the implementation intent is unclear.`
    * `The source suggests ..., but this should be confirmed before treating it as public API.`

3. Do not document private/internal implementation details as public API.

Public API includes:

* exported components/directives/pipes/services/types
* selectors
* public `input()`, `model()`, and `output()` members
* documented public methods/properties intended for consumers
* CSS custom properties/design tokens if clearly intended for consumers
* content projection slots if clearly supported
* provider/configuration APIs if exported and used by consumers

Public API does not include:

* private or protected members
* implementation-only computed signals
* internal helper functions
* internal CSS classes
* internal Tailwind utility classes
* internal `data-*` attributes unless explicitly documented as public selectors
* internal SVG geometry details unless exposed through public inputs
* current DOM structure that is not part of the documented contract
* accidental behavior caused by implementation details

4. Do not document accidental behavior. If something only works because of a current implementation detail, do not describe it as supported.

5. Classify every candidate documentation fact before including it:

    * Public usage contract: include.
    * Consumer warning: include if it affects correct usage.
    * Advanced public customization: include in a focused advanced/customization section.
    * Source evidence/internal mechanism: omit from human-facing docs.
    * Unclear behavior: mark with `TODO(owner-review)` or omit.
    * Agent-only metadata: keep structured through API tables and examples; do not turn it into long prose.

6. Do not change runtime behavior unless absolutely necessary to make docs compile. Documentation changes are allowed. Small demo/doc-only changes are allowed. Library source changes are allowed only for missing JSDoc descriptions or clearly incorrect public API documentation comments.

7. If adding or editing JSDoc on `input()`, `model()`, or `output()`, use the existing `@description` convention because metadata extraction depends on it.

8. Follow the existing repository rules:

    * Angular standalone components are assumed; do not add `standalone: true`.
    * Use signals and Angular 22 patterns.
    * Use `input()`, `model()`, and `output()` rather than decorators.
    * Do not use `@HostBinding` or `@HostListener`.
    * Do not use `ngClass`; use class bindings.
    * Do not use `ngStyle`; use style bindings.
    * Use native control flow: `@if`, `@for`, `@switch`.
    * Use `ChangeDetectionStrategy.OnPush`.
    * Use `inject()` rather than constructor injection.
    * Preserve strict TypeScript.
    * Do not use `any`; use `unknown` when the type is genuinely unknown.
    * Use `import type` for type-only imports.
    * Follow existing member ordering and formatting conventions.

Documentation output requirements:

For each requested component, update or create the relevant documentation page under:
`projects/mona-ui-tester/src/app/docs/components/<component>-doc`

Use the existing doc component structure where possible.

Do not introduce a new documentation framework.
Do not add dependencies.
Do not restructure the whole docs app.
Do not remove existing demos.
Do not duplicate interactive demos with long prose. Explain what the demo cannot fully communicate.

---

CRITICAL: DOCUMENTATION DEPTH CONTROL

Before writing docs, determine whether the component needs the lean layout or the comprehensive layout.

The goal is high information density without boilerplate.

Do not use the comprehensive layout for simple components only because source inspection discovered many implementation details.

Do not force every section to exist if it would be empty, speculative, or obvious.

A simple component with many internal implementation details is still a simple component if the public usage contract is small.

---

### OPTION A: THE LEAN LAYOUT

Use this path for simple attribute directives, standalone utility pipes, or presentation-focused components that do not manage complex internal states, structural template systems, overlay lifecycles, or form-control behavior.

Examples may include:

* Button
* Badge
* Avatar
* Separator
* Progress Bar
* Circular Progress Bar
* Icon-like display components
* Simple tooltip directive, if its public behavior is narrow

The lean layout should usually contain these sections:

1. Title & Selector

    * Human-readable component/directive name.
    * Include the primary selector or directive usage.
    * Mention secondary selectors/directives only if consumers use them directly.

2. Introduction

    * One sentence describing the component’s purpose.
    * Focus on what the consumer can do with it, not how it is implemented.

3. Interactive Demo

    * Provide a live demo of the component in action.
    * Do not repeat everything the demo already shows.

4. Overview & Usage Guidelines

    * One to two short paragraphs.
    * Explain when to use this component.
    * Include a short list only when it helps consumers choose correctly.
    * Avoid marketing language.

5. Import & Basic Usage

    * Show the correct import statement from `@mirei/mona-ui`.
    * Provide a minimal, realistic template example that compiles against the public API.
    * Do not use private imports.
    * Do not use fake APIs.

6. Public Customization

    * Document customization exposed through public inputs, models, outputs, template directives, content projection, CSS variables, or documented theme tokens.
    * Keep this section short.
    * Do not mention internal Tailwind utility classes.
    * Do not mention private data attributes.
    * Do not describe internal SVG, DOM, or CSS structure unless the consumer must know it.
    * Prefer consumer-facing wording.

   Bad:
   `The track uses data-[stroke-trail=true]:stroke-input-border.`

   Good:
   `The track uses the theme's input-border color.`

   Bad:
   `The component computes arc length from signal inputs.`

   Good:
   `The displayed arc reflects the current value within the configured range.`

7. Focused Examples

    * Add only examples that demonstrate meaningful public usage variations.
    * Keep each example small and compilable.
    * Prefer examples that answer likely consumer questions.
    * Do not create examples only to demonstrate every input mechanically.
    * For simple components, three to five examples are usually enough.

   Good examples for a circular progress component:

    * determinate progress
    * indeterminate/loading state
    * custom range
    * custom color if public
    * custom label template if public

   Avoid examples that only expose implementation mechanics.

8. Accessibility Notes

    * Include only accessibility behavior confirmed by source, tests, runtime handlers, or explicit ARIA attributes.
    * Do not claim the component is accessible unless the implementation supports the claim.
    * If the component renders ARIA attributes, document them precisely.
    * If the consumer must provide an accessible name, say so.
    * If decorative usage is unclear, mark it for owner review instead of inventing guidance.

   Bad:
   `This component is fully accessible.`

   Good:
   `The component renders role="progressbar". Provide an accessible name when surrounding text does not already describe the progress value.`

   Good when unclear:
   `TODO(owner-review): confirm the recommended decorative usage pattern before documenting aria-hidden or empty-label guidance.`

9. API Matrix

    * Split into two tables: **Inputs** (including two-way models) first, **Outputs** second. Omit a table entirely if the component has no members of that kind.
    * Columns for the Inputs table: Name, Type, Default, Description.
    * Columns for the Outputs table: Name, Type, Description.
    * Do not include a Kind column or a Required column.
    * Indicate two-way model inputs in their Description (e.g., “Two-way bindable ...”).
    * Map directly from source code and `component-metadata.json`.
    * Do not include private members.
    * Do not include unexported helper types unless they appear in public signatures.
    * Order rows by name ascending (A → Z) within each table.

10. Verification Checklist

    * Add a hidden or visible review checklist at the bottom of the page:

        * API definitions and defaults verified
        * Basic example compiles successfully
        * No internal or unexported APIs exposed
        * Accessibility claims verified against source or marked for owner review
        * Styling section includes only public customization points

---

### OPTION B: THE COMPREHENSIVE LAYOUT

Use this path for compound controls, heavy input components, overlay systems, or virtualized data structures that expose complex interaction behavior, structural templates, form integration, lazy loading, or sub-component architectures.

Examples may include:

* Grid
* TreeView
* DropDownList
* ComboBox
* DatePicker
* DateTimePicker
* TimePicker
* TabStrip/Tabs, if multiple structural directives are involved
* ListView, if templating, selection, grouping, or virtualization are part of the public contract

The comprehensive layout should usually contain these sections:

1. Title & Selector

    * Human-readable component name.
    * Include all relevant structural selectors/directives that consumers use directly.
    * Do not list private implementation selectors.

2. Introduction

    * One sentence describing the component’s purpose.
    * Focus on the consumer-facing problem it solves.

3. Interactive Demo

    * Provide a live demo of the component in action.
    * Do not duplicate the demo with long prose.

4. Overview & Component Selection

    * Two to four concise paragraphs explaining the component’s core purpose.
    * Explicitly state when to use this component versus closely related Mona UI components.
    * Include a short comparison matrix only when it helps consumers choose correctly.

   Example:
   `Use DropDownList when the user must select from known options. Use ComboBox when text entry and filtering are part of the interaction.`

5. Import & Quick Start

    * Show the explicit package import from `@mirei/mona-ui`.
    * Include a minimal, compilable code snippet displaying standard template placement and minimal TypeScript setup requirements.
    * Do not use private imports.

6. Anatomy & Public Structural Templates

    * Describe only layout pieces, content projection slots, and structural template hooks exposed to consumers.
    * Explicitly detail available template context signatures when confirmed by public directives or source.
    * Do not describe internal DOM structure unless consumers rely on it directly.

7. Feature Examples

    * Provide multiple small, focused, compilable examples demonstrating key public usage variations.
    * Prefer examples that map to real consumer decisions.
    * Examples may include:

        * value binding and state initialization
        * disabled, readonly, or validation states
        * custom item/row/cell templates
        * async data integration using signals or observables
        * form integration
        * selection modes
        * grouping, sorting, filtering, or pagination if public
        * lazy loading or virtualization if public

   Do not add examples for unsupported behavior.

8. Technical & Behavior Notes

    * Document behavior that consumers must understand to use the component correctly.
    * Include overlay positioning, collision behavior, selection synchronization, lazy-loading lifecycle, performance thresholds, or backend interaction rules only when source evidence confirms them.
    * Do not turn implementation details into public guarantees.
    * Avoid explaining private algorithms unless their effects are part of the public contract.

   Bad:
   `The component stores option state in an internal linkedSignal and recalculates visible items through computed.`

   Good:
   `When the options input changes, the displayed option list updates from the new collection. If selected values are not present in the new collection, verify the component’s documented selection behavior before relying on automatic reconciliation.`

9. Accessibility & Forms Integration

    * Keyboard Map:

        * Document keyboard navigation only when confirmed by specs, runtime handlers, or source code.
        * Use a table for key/action pairs.
        * Do not invent standard keyboard behavior that is not implemented.

    * ARIA Roles:

        * List managed ARIA roles and attributes confirmed by source.
        * State consumer responsibilities, such as providing labels, only when applicable.

    * Focus Behavior:

        * Document focus trapping, roving tabindex, active descendant, or focus restoration only when implemented.

    * Form Interaction:

        * If the component is a form control, document reactive forms and signal forms support only when confirmed.
        * Distinguish between value inputs/models and form control integration.
        * Do not claim form support for display-only components unless implemented.

10. API Matrix

    * For each component or directive, split member tables into two groups: **Inputs** (including two-way models) first, **Outputs** second. Omit a table entirely if the component has no members of that kind.
    * Columns for the Inputs table: Name, Type, Default, Description.
    * Columns for the Outputs table: Name, Type, Description.
    * Do not include a Kind column or a Required column.
    * Indicate two-way model inputs in their Description (e.g., "Two-way bindable ...").
    * Also provide separate tables for: Public methods (if intended for consumer use), Exported public types, Public directives or child components used with the component.
    * Order rows by name ascending (A → Z) within each table.
    * Ensure type definitions map exactly to the framework’s strict TypeScript signatures.
    * Do not expose private or unexported types as supported API.
    * If a public signature references a type that is not exported, mark it for owner review.

11. Review Checklist

    * Add an owner-review validation block at the bottom of the page:

        * All API tables cross-checked against generated metadata
        * All provided code examples compile natively without private imports
        * Keyboard maps and accessibility claims verified in source/runtime
        * Form integration claims verified
        * No implementation-only details exposed as public contract
        * Unclear behavior marked with `TODO(owner-review)`

---

Strict content quality rules:

* Write for Angular developers using Mona UI for the first time.
* Prefer precise technical prose over marketing prose.
* Keep paragraphs short.
* Prefer examples and tables over long explanation.
* Avoid saying “simply,” “just,” “obviously,” or “easy.”
* Do not say the component is accessible unless the implementation supports the claim.
* Do not say the component is production-ready.
* Do not make unsupported compatibility claims.
* Do not mention implementation internals unless users need to know them to use the component correctly.
* Do not duplicate the interactive demo.
* Do not over-document obvious HTML behavior.
* Do not write long philosophical explanations.
* Do not repeat the component class name in every paragraph.
* In prose, prefer the human-readable component name. Use the TypeScript class name mainly in API references.
* Avoid generic filler such as “highly customizable,” “powerful,” “beautiful,” “robust,” or “flexible” unless a specific, source-backed capability follows.
* Prefer “consumer” for developers using the library.
* Prefer “host element” when describing directive usage.
* Prefer “projected content” for Angular content projection.

Terminology:

* Use “input” for Angular signal inputs.
* Use “model” for two-way signal model inputs.
* Use “output” for events.
* Use “selector” for component/directive selectors.
* Use “consumer” for developers using the library.
* Use “projected content” for Angular content projection.
* Use “host element” when describing directive usage.
* Use “template context” for variables exposed by structural templates.
* Use “public API” only for exported and supported consumer-facing APIs.

---

AI-agent-readability rules:

Human documentation must remain concise, but it should also be easy for AI agents to parse.

To support AI agents:

1. Use stable section names.

   Good:

    * Import & Basic Usage
    * Public Customization
    * Examples
    * Accessibility Notes
    * API

2. Use explicit selectors and import paths.

3. Keep API tables complete and consistent.

4. Prefer small, compilable examples.

5. Use exact public type names.

6. Mark uncertainty explicitly with `TODO(owner-review)`.

7. Avoid burying required setup inside prose.

8. Avoid unsupported claims that an agent may later repeat as fact.

9. Do not place implementation evidence into user docs unless it changes consumer behavior.

10. Do not create `llms.txt`, `llms-full.txt`, JSON API exports, or machine-readable documentation files unless the repository already has such infrastructure or the requested scope explicitly asks for it.

11. If the repository already has AI-oriented documentation infrastructure, keep it separate from human-facing component pages. Human pages should not become longer to compensate for missing machine-readable docs.

---

Implementation-detail filtering rules:

When inspecting source code, you will discover many true facts. Not every true fact belongs in documentation.

Omit these from human-facing docs unless they are explicitly public or consumer-actionable:

* private method names
* private field names
* internal computed signals
* internal effects
* internal store structure
* internal helper functions
* internal CSS class names
* Tailwind utility names
* internal variant configuration names
* internal `data-*` attributes
* internal DOM nesting
* SVG path/math implementation details
* change detection mechanics
* internal event delegation
* internal cache/memoization mechanisms
* test-only utilities
* demo-only helpers
* implementation-specific timing details that are not public guarantees

Include these when confirmed:

* selectors
* import paths
* public inputs, models, outputs
* public methods intended for consumers
* exported public types
* public structural directives
* public template context variables
* public CSS variables or documented theme tokens
* form integration behavior
* keyboard handling implemented by the component
* ARIA roles and attributes rendered by the component
* validation/error behavior exposed to consumers
* performance guidance that consumers must follow
* important limitations that affect usage

If a true implementation detail is useful only as evidence, use it internally to support the docs. Do not copy it into the page.

---

Example quality bar:

Bad:
`Button is a customizable button component that lets you create beautiful buttons.`

Good:
`ButtonDirective styles a native button or compatible host element using Mona UI button variants. Use it when you need a consistent action control while preserving native button semantics.`

Bad:
`This component is fully accessible.`

Good:
`The directive preserves the native button element's keyboard behavior when used on <button>. If it is applied to a non-button host, the consumer is responsible for providing equivalent keyboard and ARIA behavior unless the directive implements it.`

Bad:
`Use this input to change the value.`

Good:
`Sets the selected value. When used with Angular forms, prefer binding through the form control instead of manually synchronizing this input.`

Bad:
`The component uses computed signals to derive the visible label.`

Good:
`The label reflects the current value unless a custom label template is provided.`

Bad:
`The track is styled with data-[stroke-trail=true]:stroke-input-border.`

Good:
`The track uses the theme's input-border color.`

Bad:
`The disabled state applies opacity-50 and pointer-events-none.`

Good:
`Disabled state renders the control with reduced visual emphasis and prevents pointer interaction.`

Bad:
`The SVG circle uses stroke-dasharray and stroke-dashoffset to draw the progress arc.`

Good:
`The progress arc represents the current value within the configured range.`

---

Implementation process:

Step 1: Build an evidence map.

Before editing, create an internal evidence map for each component:

* Source files inspected
* Demo files inspected
* Public exports inspected
* Inputs/models/outputs discovered
* Public directives discovered
* Public template contexts discovered
* Public methods discovered
* Public exported types discovered
* Examples discovered
* Accessibility evidence discovered
* Forms integration evidence discovered
* Styling/theming evidence discovered
* Unclear areas requiring owner review

Use this evidence map to avoid unsupported claims.

Do not include the full evidence map in the final documentation page unless a short owner-review note is useful.

Step 2: Decide layout depth.

Choose either the lean layout or the comprehensive layout.

Use the lean layout for simple components even if their implementation contains many internal details.

Use the comprehensive layout only when the public usage contract is genuinely complex.

Record the reason briefly in your implementation notes or final response.

Step 3: Filter facts.

Before writing, classify discovered facts as:

* Include in human docs
* Include only as API table data
* Include only as owner-review TODO
* Use as internal evidence but omit from docs
* Ignore as private/internal

If the generated draft begins to explain private implementation mechanisms, remove that prose.

Step 4: Update API comments if needed.

If a public `input()`, `model()`, or `output()` is missing a useful `@description`, add one.

Descriptions must be:

* factual
* concise
* consumer-facing
* free of private implementation details

Do not add noisy comments for private members.

After changing descriptions, ensure metadata can be regenerated.

Step 5: Update the doc component.

Edit the existing doc page under:
`projects/mona-ui-tester/src/app/docs/components/<component>-doc`

Prefer using existing shared doc/demo components already present in the tester app.

Keep the style consistent with neighboring documentation pages.

Do not introduce a new documentation framework.

Step 6: Add or refine examples.

Use existing demo examples where possible.

If adding code snippets:

* keep them small
* make them realistic
* make them compile
* use public imports from `@mirei/mona-ui`
* use Angular 22 syntax
* avoid fake data when a minimal real value is clearer
* avoid demonstrating private behavior
* avoid examples that only restate every API input mechanically

For lean components, usually add three to five examples maximum unless the component has more public variation.

For comprehensive components, group examples by practical feature area.

Step 7: Update accessibility documentation carefully.

Only document accessibility behavior that is proven by source, tests, or runtime handlers.

If the component renders ARIA attributes, document them exactly.

If the consumer must provide labels, state that clearly.

If keyboard behavior is not implemented or not verified, do not invent a keyboard map.

If decorative usage is unclear, use:
`TODO(owner-review): confirm the recommended decorative usage pattern.`

Step 8: Update styling documentation carefully.

Only document styling hooks that are public or consumer-actionable.

Do not expose:

* Tailwind utility class names
* internal variant function names
* internal data attributes
* private CSS selectors
* internal DOM structure

Prefer documenting:

* public appearance inputs
* size inputs
* orientation inputs
* color inputs
* public CSS variables
* documented theme tokens
* content/template customization points

Step 9: Validate.

Run the most relevant checks available in this repository:

* `npm run build:metadata`
* `npm run test:lib` if library source changed
* `npm run test:app` if tester/docs changed
* `npm run build` if practical

If running all checks is too expensive, run the smallest relevant subset and explicitly report what was and was not run.

Step 10: Final response.

When finished, report:

* Components documented
* Layout path selected and why
* Files changed
* Public API comments added/changed
* Examples added or refined
* Internal details removed or intentionally omitted
* Unclear areas marked with `TODO(owner-review)`
* Commands run
* Any failures or skipped checks
* Any follow-up recommendations

---

Hard refusal rules:

* Do not invent public API.
* Do not document unexported/internal symbols as supported.
* Do not silently change component behavior.
* Do not add broad claims like “fully accessible,” “complete,” “production ready,” or “best practice” unless verified.
* Do not remove existing demos.
* Do not restructure the whole docs app.
* Do not add dependencies.
* Do not rename public APIs.
* Do not change routes except when adding a missing doc page for a component that already exists and should be publicly documented.
* Do not modify unrelated components.
* Do not create AI-specific documentation files unless explicitly requested or already supported by the repository.
* Do not make human-facing docs longer only to satisfy AI-agent use cases.

Start with the requested scope only:
`<COMPONENT_OR_COMPONENT_FAMILY_HERE>`

First, inspect the repository and produce a concise implementation plan.
Then apply the documentation changes.
