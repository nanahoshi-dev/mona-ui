You are working in the `mona-ui` Angular library.

Repository/package context:

* Package name: `@mirei/mona-ui`
* Library root: `projects/mona-ui`
* Current primary entry point: `projects/mona-ui/src/public-api.ts`
* Current giant barrel: `projects/mona-ui/src/lib/index.ts`
* Target API style: component/family-level secondary entry points.
* Desired import style:

```ts
import { ButtonDirective } from "@mirei/mona-ui/button";
import { DropdownButtonComponent } from "@mirei/mona-ui/dropdown-button";
import { DatePickerComponent } from "@mirei/mona-ui/date-picker";
import { GridComponent } from "@mirei/mona-ui/grid";
```

Do not use broad group entry points as the canonical API, such as:

```ts
import { ButtonDirective } from "@mirei/mona-ui/buttons";
import { DropdownListComponent } from "@mirei/mona-ui/dropdowns";
```

Do not keep encouraging imports from the root package for individual components:

```ts
import { ButtonDirective } from "@mirei/mona-ui";
```

The goal is to convert the target component, directive, or component directory I point you to into secondary entry points where each public component/family has its own import path.

I will give you a target path such as one of these:

```txt
projects/mona-ui/src/lib/buttons/button
projects/mona-ui/src/lib/buttons/dropdown-button
projects/mona-ui/src/lib/dropdowns
projects/mona-ui/src/lib/inputs/slider
projects/mona-ui/src/lib/layout/tabs
```

Your job is to analyze the target and create/update the correct secondary entry point files.

## Required outcome

For each public component/family found under the target path, create one secondary entry point under `projects/mona-ui/<entry-point-name>`.

Examples:

```txt
projects/mona-ui/button
projects/mona-ui/dropdown-button
projects/mona-ui/drop-down-list
projects/mona-ui/drop-down-tree
projects/mona-ui/multi-select
projects/mona-ui/slider
projects/mona-ui/tabs
projects/mona-ui/tree-view
```

Each secondary entry point must contain:

```txt
projects/mona-ui/<entry-point-name>/ng-package.json
projects/mona-ui/<entry-point-name>/public-api.ts
```

**Important — this is not the naive ng-packagr shape.** Pointing `entryFile` at a
local `public-api.ts` that lives inside `projects/mona-ui/<entry-point-name>/` (with
its exports written as `../src/lib/...` relative paths) is what the first migration
commits tried, and it produces a cryptic, hard-to-diagnose TypeScript/ng-packagr error:

```txt
Cannot destructure property 'pos' of 'file.referencedFiles[index]' as it is undefined.
```

The actual working shape, confirmed across all 17 already-migrated entry points, is:

* The real entry file that ng-packagr/TypeScript type-checks must live **physically
  inside `projects/mona-ui/src/lib/`**, named `<entry-point-name>.public-api.ts`, with
  its `export * from` paths relative to `src/lib/` (e.g. `./buttons/button/...`, not
  `../src/lib/buttons/button/...`).
* `projects/mona-ui/<entry-point-name>/ng-package.json` points `entryFile` **directly**
  at that file, one level further up than you might expect:

  ```json
  {
      "$schema": "../../../node_modules/ng-packagr/ng-package.schema.json",
      "lib": {
          "entryFile": "../src/lib/<entry-point-name>.public-api.ts"
      }
  }
  ```

* `projects/mona-ui/<entry-point-name>/public-api.ts` becomes a one-line passthrough
  re-export, not the real export list:

  ```ts
  /*
   * Public API Surface of @mirei/mona-ui/<entry-point-name>
   */

  export * from "../src/lib/<entry-point-name>.public-api";
  ```

Concrete example (`auto-complete`):

```json
// projects/mona-ui/auto-complete/ng-package.json
{
    "$schema": "../../../node_modules/ng-packagr/ng-package.schema.json",
    "lib": { "entryFile": "../src/lib/auto-complete.public-api.ts" }
}
```

```ts
// projects/mona-ui/auto-complete/public-api.ts
export * from "../src/lib/auto-complete.public-api";
```

```ts
// projects/mona-ui/src/lib/auto-complete.public-api.ts
export * from "./dropdowns/auto-complete/components/auto-complete.component";
export * from "./dropdowns/directives/drop-down-footer-template.directive";
// ...rest of the family's real exports, relative to src/lib
```

Adjust the `$schema` relative path if needed based on the actual folder depth. Since the secondary entry point folders should be direct children of `projects/mona-ui`, the path above should normally be correct.

The entry point name must be kebab-case and should match the public component/family name, not the broad category folder.

Good:

```txt
@mirei/mona-ui/button
@mirei/mona-ui/dropdown-button
@mirei/mona-ui/drop-down-list
@mirei/mona-ui/drop-down-tree
@mirei/mona-ui/multi-select
@mirei/mona-ui/range-slider
```

Bad:

```txt
@mirei/mona-ui/buttons
@mirei/mona-ui/dropdowns
@mirei/mona-ui/inputs
@mirei/mona-ui/date-inputs
```

## Component family rule

Create one entry point per public component family, not one entry point per physical file.

For example, `dropdown-button` should include the main component, its public item/group/separator components, its public radio/checkbox item components, its public template directives, and any public event/settings/options/model types required to use it.

Example shape (the real export list lives in `projects/mona-ui/src/lib/dropdown-button.public-api.ts`, per the "Required outcome" section above — paths are relative to `src/lib/`, not to the entry-point folder):

```ts
// projects/mona-ui/src/lib/dropdown-button.public-api.ts

export * from "./buttons/dropdown-button/components/dropdown-button/dropdown-button.component";
export * from "./buttons/dropdown-button/components/dropdown-button-item/dropdown-button-item.component";
export * from "./buttons/dropdown-button/components/dropdown-button-group/dropdown-button-group.component";
export * from "./buttons/dropdown-button/components/dropdown-button-separator/dropdown-button-separator.component";
export * from "./buttons/dropdown-button/components/dropdown-button-checkbox-item/dropdown-button-checkbox-item.component";
export * from "./buttons/dropdown-button/components/dropdown-button-radio-group/dropdown-button-radio-group.component";
export * from "./buttons/dropdown-button/components/dropdown-button-radio-item/dropdown-button-radio-item.component";

export * from "./buttons/dropdown-button/directives/dropdown-button-text-template.directive";
export * from "./buttons/dropdown-button/directives/dropdown-button-menu-group-template.directive";
export * from "./buttons/dropdown-button/directives/dropdown-button-menu-item-icon-template.directive";
export * from "./buttons/dropdown-button/directives/dropdown-button-menu-item-shortcut-template.directive";
export * from "./buttons/dropdown-button/directives/dropdown-button-menu-item-text-template.directive";
```

(`projects/mona-ui/dropdown-button/public-api.ts` is then just `export * from "../src/lib/dropdown-button.public-api";`.)

Do not create separate entry points like:

```txt
@mirei/mona-ui/dropdown-button-item
@mirei/mona-ui/dropdown-button-group
@mirei/mona-ui/dropdown-button-separator
```

Those belong to the `dropdown-button` family.

## Public export discovery rules

For each target component/family, inspect all source files under the target directory and nearby related directories used by the component.

Export all symbols that are required for external consumers to correctly use the component/directive.

Export these when they are public:

1. Angular components used directly in user templates.
2. Angular directives used directly in user templates.
3. Angular pipes intended for direct user use.
4. Services that consumers are expected to inject.
5. Injection tokens that consumers are expected to provide or inject.
6. Event classes/interfaces emitted through public outputs.
7. Option/settings/config interfaces accepted by public inputs.
8. Template context interfaces used by public template directives.
9. Ref/result/action classes returned by public services.
10. Enums/string-union types used by public inputs/outputs.
11. Public utility types that appear in the component’s public API surface.
12. Public CVA/signal-forms-related interfaces if consumers need them.
13. Public style variant prop types only if they are already intended to be public or are used by public APIs.

Use `export type` for type-only exports where appropriate.

Example (written in `projects/mona-ui/src/lib/slider.public-api.ts`, so paths are relative to `src/lib/`):

```ts
export type { SliderValue, SliderTick, SliderTickTemplateContext } from "./inputs/slider/models/Slider";
export * from "./inputs/slider/components/slider/slider.component";
export * from "./inputs/slider/directives/slider-handle-template.directive";
export * from "./inputs/slider/directives/slider-tick-value-template.directive";
```

Do not export private implementation details.

Do not export these unless they are already intentionally public:

1. Internal helper functions.
2. Private utility classes used only by implementation.
3. Internal stores.
4. Internal adapters.
5. Internal constants.
6. Internal host directives not meant to be used directly.
7. Testing utilities.
8. Demo-only files.
9. Story/demo/example files.
10. CSS class builders unless they are part of the intended public API.

When unsure, decide based on this rule:

> If a user needs to import the symbol to use, configure, type, extend, inject, or handle the component, export it. If only the component implementation needs it, do not export it.

## Public type naming and collision rule

Avoid introducing public name collisions in a single entry point.

Inside a secondary entry point, local generic names are acceptable only if they are unambiguous within that entry point.

Acceptable:

```ts
// @mirei/mona-ui/list-view
export type { SelectableOptions } from "../src/lib/list-view/models/SelectableOptions";
```

However, if two exported symbols inside the same entry point have the same name, alias them.

Example:

```ts
export type { FilterableOptions as GridFilterableOptions } from "../src/lib/grid/models/FilterableOptions";
export type { GroupableOptions as GridGroupableOptions } from "../src/lib/grid/models/GroupableOptions";
```

If the component already has component-prefixed public types, prefer those:

```ts
GridSelectableOptions
TreeSelectableOptions
ListViewSelectionEvent
DropDownTreeExpandableOptions
```

Do not rename source interfaces unless necessary. Prefer export aliasing first, because renaming source files/types can create a larger unrelated refactor.

If source-level renaming is necessary because the public name is actively misleading, do it consistently and update all internal imports/usages.

## Shared/common dependency rule

If a component’s public API depends on shared models from `src/lib/common`, re-export those shared models from the component’s own secondary entry point when consumers need them.

Example (in `projects/mona-ui/src/lib/tree-view.public-api.ts`):

```ts
// @mirei/mona-ui/tree-view
export * from "./common/tree/models/NodeItem";
export * from "./common/tree/models/NodeSelectEvent";
export * from "./common/tree/models/TreeSelectableOptions";
export * from "./tree-view/components/tree-view/tree-view.component";
```

Do not force consumers to import common models from vague paths like `@mirei/mona-ui/common` unless there is already a clear, intentional, stable common/core entry point.

If you create a common shared entry point, only do it for truly cross-component public primitives and name it specifically:

```txt
@mirei/mona-ui/core
@mirei/mona-ui/query
@mirei/mona-ui/popup
```

Avoid dumping unrelated things into:

```txt
@mirei/mona-ui/common
```

## Root public API rule

Do not continue adding component exports to `projects/mona-ui/src/lib/index.ts`.

For the target component/family you migrate, remove or stop relying on its exports from the giant root barrel if doing so does not break the current migration scope.

Preferred long-term direction:

```ts
// projects/mona-ui/src/public-api.ts

/*
 * Public API Surface of mona-ui
 *
 * The root entry point should stay small.
 * Import components from secondary entry points:
 *
 *   @mirei/mona-ui/button
 *   @mirei/mona-ui/dropdown-button
 *   @mirei/mona-ui/grid
 */
```

If removing root exports would cause too many unrelated changes, leave the old root exports temporarily but mark the migrated area with a TODO/deprecation comment. Do not duplicate new exports into the root barrel unless there is a deliberate compatibility reason.

Do not create a new giant replacement barrel.

## Import update rule

After creating the secondary entry point, update imports in the repository for the migrated target where appropriate.

Replace imports like this:

```ts
import { DropdownButtonComponent } from "@mirei/mona-ui";
```

with:

```ts
import { DropdownButtonComponent } from "@mirei/mona-ui/dropdown-button";
```

Also update internal demo/docs/example imports if they import from the root package.

Do not blindly rewrite relative implementation imports inside the library unless they are public-facing examples or they need to change for build correctness.

For source files inside the same component family, relative imports are fine.

For cross-entry-point imports inside library source, prefer stable internal relative imports unless the project already has a clear convention for package self-imports.

## Directory target behavior

If I point you to a directory containing multiple component families, such as:

```txt
projects/mona-ui/src/lib/dropdowns
```

then create one secondary entry point per actual public family under that directory.

For `dropdowns`, likely entry points are:

```txt
@mirei/mona-ui/auto-complete
@mirei/mona-ui/combo-box
@mirei/mona-ui/drop-down-list
@mirei/mona-ui/drop-down-tree
@mirei/mona-ui/multi-select
```

Shared dropdown directives should be handled carefully:

* If a directive is only used internally by one component family, export it only from that component family if it is public.
* If a directive is intended to be used across multiple dropdown components by consumers, either re-export it from each relevant family entry point or create a precise shared entry point if there is a strong reason.
* Do not create `@mirei/mona-ui/dropdowns` as the main public API.

## File formatting rules

Keep export files readable and grouped.

Use this order inside `public-api.ts` where practical:

1. Main component/directive/pipe.
2. Related child components.
3. Public directives.
4. Public services.
5. Public models/events/options/settings.
6. Public utility types.

Example (`projects/mona-ui/src/lib/drop-down-list.public-api.ts`):

```ts
/*
 * Public API Surface of @mirei/mona-ui/drop-down-list
 */

export * from "./dropdowns/drop-down-list/components/dropdown-list/dropdown-list.component";
export * from "./dropdowns/drop-down-list/directives/drop-down-list-value-template.directive";

export * from "./dropdowns/directives/drop-down-item-template.directive";
export * from "./dropdowns/directives/drop-down-header-template.directive";
export * from "./dropdowns/directives/drop-down-footer-template.directive";
export * from "./dropdowns/directives/drop-down-no-data-template.directive";

export type { FilterableOptions } from "./common/models/FilterableOptions";
export type { VirtualScrollOptions } from "./common/models/VirtualScrollOptions";
```

Prefer explicit exports over `export *` when aliasing is needed or when only selected symbols should be public.

Use `export *` only when the entire file is intended to be public.

## Validation requirements

After making changes, run the relevant validation commands available in this repository.

At minimum, try:

```bash
npm run build
```

or, if this project uses Angular CLI directly:

```bash
npx ng build mona-ui
```

Also run the relevant tests or type checks if scripts exist:

```bash
npm test
npm run test
npm run typecheck
npm run lint
```

Use the actual scripts from `package.json`; do not invent scripts that do not exist.

The build must verify that ng-packagr discovers the new secondary entry point and emits package subpaths correctly.

After the build, inspect `dist/mona-ui` and confirm that the expected secondary entry point exists, for example:

```txt
dist/mona-ui/button
dist/mona-ui/dropdown-button
dist/mona-ui/drop-down-list
```

Also confirm the generated package metadata includes the corresponding export path, either directly or through ng-packagr output.

## Final report format

When finished, report:

1. Which target path was migrated.
2. Which secondary entry points were created.
3. Which public symbols each entry point exports.
4. Which imports were updated.
5. Whether root barrel exports were removed, left alone, or marked for later cleanup.
6. Which validation commands were run and their results.
7. Any symbols that were ambiguous and how you handled them.
8. Any remaining TODOs.

Do not claim success if the build was not run or failed. If validation could not be completed, say exactly what was not run and why.

## Important constraints

* Do not change component behavior.
* Do not change selectors.
* Do not change inputs/outputs.
* Do not change templates unless required for import/build correctness.
* Do not move implementation files unless absolutely necessary.
* Do not rename public symbols unless needed to solve a real collision or misleading API.
* Do not introduce broad category entry points as the canonical API.
* Do not export every file mechanically.
* Do not expose internal implementation details just because they are exported locally.
* Do not break existing relative imports inside implementation code without reason.
* Do not modify unrelated components outside the target scope except for imports/build files required by the migration.
* Keep the migration incremental and reviewable.

Start by inspecting the target path, existing exports in `src/lib/index.ts`, and all files referenced by the component’s public inputs, outputs, template directives, services, and model types. Then implement the secondary entry point migration.
