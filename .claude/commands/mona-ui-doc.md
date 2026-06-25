---
description: Generate first-pass documentation for a Mona UI component or component family. Use when the user invokes /mona-ui-doc with a component name (e.g. /mona-ui-doc button, /mona-ui-doc date-picker, /mona-ui-doc grid). Also use when the user asks to generate, write, or update documentation for any component in the mona-ui library.
---

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
`$ARGUMENTS`

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
Create useful first-pass written documentation for the requested component(s), integrated into the existing tester/docs app, without inventing unsupported behavior.

This is not a redesign task.
This is not a refactor task.
This is a documentation task with small supporting code changes only when required for documentation quality.

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

3. Do not document private/internal implementation details as public API. Public API includes:

    * exported components/directives/pipes/services/types
    * selectors
    * public `input()`, `model()`, and `output()` members
    * documented public methods/properties intended for consumers
    * CSS custom properties/design tokens if clearly intended for consumers
    * content projection slots if clearly supported
    * provider/configuration APIs if exported and used by consumers

4. Do not document accidental behavior. If something only works because of a current implementation detail, do not describe it as supported.

5. Do not change runtime behavior unless absolutely necessary to make docs compile. Documentation changes are allowed. Small demo/doc-only changes are allowed. Library source changes are allowed only for missing JSDoc descriptions or clearly incorrect public API documentation comments.

6. If adding or editing JSDoc on `input()`, `model()`, or `output()`, use the existing `@description` convention because metadata extraction depends on it.

7. Follow the existing repository rules:

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

---
CRITICAL: DYNAMIC LAYOUT SELECTION
Analyze the architectural scope of the component. Choose the matching layout path below to maintain high information density while eliminating empty boilerplate.
---

### OPTION A: THE LEAN LAYOUT

Use this path for simple attribute directives, standalone utility pipes, or presentation-only components (e.g., Button, Badge, Avatar, Separator) that do not manage complex internal states, structural templates, or sub-component systems.

1. Title & Selector
    * Human-readable component/directive name.
    * Include the primary selector or directive usage.

2. Introduction
    * Provide a one-sentence brief overview of the component's purpose and functionality.

3. Interactive Demo
    * Provide a live demo of the component in action.

4. Overview & Guidelines
    * One to two concise paragraphs describing what it is for and the problem it solves.
    * Include a quick, scannable bulleted list outlining explicit scenarios for when to use it over native alternatives.

5. Import & Basic Usage
    * Show the correct import statement from `@mirei/mona-ui`.
    * Provide a minimal, realistic template example that compiles perfectly against the public API surface.

6. Appearance & Styling
    * Document supported structural variants, sizes, orientation options, and exposed CSS custom properties/theme tokens confirmed by the source code styles.

7. API Matrix
    * Include a cleanly formatted table mapped directly from source code and `component-metadata.json`.
    * Provide structured columns for: Name, Kind (input/model/output), Type, Default Value, Required/Optional status, and Description.

8. Verification Checklist
    * Add a hidden or visible review checklist at the very bottom of the page:
        - API definitions and defaults verified
        - Basic example compiles successfully
        - No internal or unexported APIs exposed

---

### OPTION B: THE COMPREHENSIVE LAYOUT

Use this path for compound controls, heavy input components, overlay systems, or virtualized data structures (e.g., Grid, TreeView, DropDownList, DatePicker, TabStrip) that utilize multi-slot content projection, reactive form tracking, complex interaction layers, or sub-component architectures.

1. Title & Selector
    * Human-readable component name along with all relevant structural selectors/directives.

2. Introduction
    * Provide a one-sentence brief overview of the component's purpose and functionality.

3. Interactive Demo
    * Provide a live demo of the component in action.

4. Overview & Contextual Matrix
    * Two to four concise paragraphs explaining the component's core purpose.
    * Explicitly state when to use this component versus closely related Mona UI components (e.g., DropDownList vs. ComboBox, or ListBox vs. ListView) to guide consumer selection immediately.

5. Import & Quick Start
    * Show the explicit package import from `@mirei/mona-ui`.
    * Include a minimal, compilable code snippet displaying standard template placement and minimal TypeScript setup requirements.

6. Anatomy & Structural Templates
    * Describe the internal layout pieces, content projection slots, and structural template hooks (`ng-template`) exposed to the consumer.
    * Explicitly detail available template context signatures (e.g., row item variables) so consumers know what data properties are available.

7. Feature Examples
    * Provide multiple small, hyper-focused compilable examples demonstrating key operational variations:
        - Value binding and state initialization
        - Disabled, readonly, or explicit validation error states
        - Custom cell, row, or item templates using structural directives
        - Async data stream integration using reactive primitives or signals

8. Technical & Behavior Notes
    * Explicitly document crucial backend behaviors, overlay collision/positioning rules, state synchronization edge cases, lazy-loading lifecycles, or performance tuning thresholds for handling large datasets.

9. Accessibility & Forms Integration
    * Keyboard Map: Document complete keyboard navigation maps confirmed explicitly by specs or runtime handlers.
    * ARIA Roles: List managed ARIA attributes, focus-trapping behaviors, and clear consumer layout responsibilities (such as manual `aria-label` requirements).
    * Form Interaction: If a form control, explicitly document `ControlValueAccessor` execution behavior, Reactive Forms integration, and Signal-based form support.

10. API Matrix
    * Provide granular, categorized tables for: Inputs, Signal Models, Outputs, and Public Methods/Exported Types intended for direct consumer interaction.
    * Ensure Type definitions map exactly to the framework's strict TypeScript signatures.

11. Review Checklist
    * Add an owner-review validation block at the bottom of the page:
        - All API tables cross-checked against generated metadata
        - All provided code examples compile natively without private imports
        - Keyboard maps and accessibility claims physically verified in runtime

---

Strict content quality rules:

* Write for Angular developers using Mona UI for the first time.
* Prefer precise technical prose over marketing prose.
* Keep paragraphs short.
* Avoid saying "simply," "just," "obviously," or "easy."
* Do not say the component is accessible unless the implementation supports the claim.
* Do not say the component is production-ready.
* Do not make unsupported compatibility claims.
* Do not mention implementation internals unless users need to know them.
* Do not duplicate the interactive demo; explain what the demo cannot fully communicate.
* Do not over-document obvious HTML behavior.
* Do not write long philosophical explanations.
* Use consistent terminology:

    * "input" for Angular signal inputs
    * "model" for two-way signal model inputs
    * "output" for events
    * "selector" for component/directive selectors
    * "consumer" for developers using the library
    * "projected content" for Angular content projection
    * "host element" when describing directive usage

Example quality bar:

Bad:
"Button is a customizable button component that lets you create beautiful buttons."

Good:
"ButtonDirective styles a native `button` or compatible host element using Mona UI button variants. Use it when you need a consistent action control while preserving native button semantics."

Bad:
"This component is fully accessible."

Good:
"The directive preserves the native button element's keyboard behavior when used on `<button>`. If it is applied to a non-button host, the consumer is responsible for providing equivalent keyboard and ARIA behavior unless the directive implements it."

Bad:
"Use this input to change the value."

Good:
"Sets the selected value. When used with Angular forms, prefer binding through the form control instead of manually synchronizing this input."

Implementation process:

Step 1: Build an evidence map.
Before editing, create an internal evidence map for each component:

* Source files inspected
* Demo files inspected
* Public exports inspected
* Inputs/models/outputs discovered
* Examples discovered
* Accessibility evidence discovered
* Styling/theming evidence discovered
* Unclear areas requiring owner review

Do not include the full evidence map in the final docs unless useful, but use it to avoid unsupported claims.

Step 2: Update API comments if needed.
If a public `input()`, `model()`, or `output()` is missing a useful `@description`, add one.
Descriptions must be factual, concise, and consumer-facing.
Do not add noisy comments for private members.
After changing descriptions, ensure metadata can be regenerated.

Step 3: Update the doc component.
Edit the existing doc page under:
`projects/mona-ui-tester/src/app/docs/components/<component>-doc`

Prefer using existing shared doc/demo components already present in the tester app.
Keep the style consistent with neighboring documentation pages.
Do not introduce a new documentation framework.

Step 4: Add examples.
Use existing demo examples where possible.
If adding code snippets, keep them small and realistic.
The examples must compile.
Do not use fake APIs.
Do not use private imports.
Do not use outdated Angular syntax.

Step 5: Validate.
Run the most relevant checks available in this repository:

* `npm run build:metadata`
* `npm run test:lib` if library source changed
* `npm run test:app` if tester/docs changed
* `npm run build` if practical

If running all checks is too expensive, run the smallest relevant subset and explicitly report what was and was not run.

Step 6: Final response.
When finished, report:

* Components documented
* Files changed
* Public API comments added/changed
* Examples added
* Unclear areas marked with `TODO(owner-review)`
* Commands run
* Any failures or skipped checks
* Any follow-up recommendations

Hard refusal rules:

* Do not invent public API.
* Do not document unexported/internal symbols as supported.
* Do not silently change component behavior.
* Do not add broad claims like "fully accessible," "complete," "production ready," or "best practice" unless verified.
* Do not remove existing demos.
* Do not restructure the whole docs app.
* Do not add dependencies.
* Do not rename public APIs.
* Do not change routes except when adding a missing doc page for a component that already exists and should be publicly documented.
* Do not modify unrelated components.

Start with the requested scope only:
`$ARGUMENTS`

First, inspect the repository and produce a concise implementation plan.
Then apply the documentation changes.
