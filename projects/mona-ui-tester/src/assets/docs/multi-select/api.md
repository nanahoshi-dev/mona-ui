## Overview & Component Selection

Multi Select renders every selected item as a removable chip inside the host element, and opens a listbox popup for the consumer to add or remove selections. Unlike Combo Box or Auto Complete, the value area is not a text input — there is no free-text entry and no `placeholder` input; the host either shows selected tags or is empty.

Filtering, grouping, and virtual scrolling are opt-in through companion attribute directives applied to the `<mona-multi-select>` host element, the same pattern used by Dropdown List:

- `monaDropDownFilterable` — renders a filter input inside the popup and narrows visible options by text.
- `monaDropDownGroupable` — groups options under a header row.
- `monaDropDownVirtualScroll` — renders only the options currently in view.

**Use Multi Select when:**

- The consumer can select any number of values from a known, bounded set of options.

**Use `DropDownList` instead when:**

- Only one value can be selected at a time.

**Use `ComboBox` or `AutoComplete` instead when:**

- Free-text entry into the value area is needed, or only a single value is selected.

## Import & Quick Start

```typescript
import { MultiSelectComponent } from "@mirei/mona-ui";
```

```typescript
protected readonly countries = [
    { id: 1, name: "United States" },
    { id: 2, name: "Canada" },
    { id: 3, name: "Mexico" }
];
protected readonly selectedCountries = signal<{ id: number; name: string }[]>([]);
```

```html

<mona-multi-select
    [data]="countries"
    textField="name"
    valueField="id"
    [(value)]="selectedCountries">
</mona-multi-select>
```

`textField` and `valueField` each accept a property name or an accessor function. Setting `valueField` lets an array of primitive field values be written into `value` (for example, restoring `value` to `[2, 3]`) to select the matching items — see [`valueField`-based restoration](#valuefield-based-restoration).

## Anatomy & Public Structural Templates

Each structural directive below is an `ng-template` placed as projected content inside `<mona-multi-select>...</mona-multi-select>`, or (for the summary tag directives) applied alongside `monaMultiSelectSummaryTag` on the host element itself. There is no value-template directive — each selected item renders as a `mona-chip`, not a rendered data item you fully control.

| Directive                                | Selector                                         | Template context                                                                                       | Replaces                                                                                                                             |
|------------------------------------------|--------------------------------------------------|--------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------|
| `DropdownItemTemplateDirective`          | `ng-template[monaDropDownItemTemplate]`          | `{ $implicit: TData }` (the option's data item)                                                        | Each option's default text rendering inside the popup                                                                                |
| `MultiSelectTagTemplateDirective`        | `ng-template[monaMultiSelectTagTemplate]`        | `{ $implicit: TData }` (the selected item's data item)                                                 | The default tag text rendered inside each selected item's chip                                                                       |
| `MultiSelectSummaryTagTemplateDirective` | `ng-template[monaMultiSelectSummaryTagTemplate]` | `{ $implicit: Iterable<TData>, tagCount: number }` (all selected items, and the configured `tagCount`) | The default "+N items" text rendered inside the summary chip — see [Collapsing tags into a summary](#collapsing-tags-into-a-summary) |
| `DropdownGroupHeaderTemplateDirective`   | `ng-template[monaDropDownGroupHeaderTemplate]`   | `{ $implicit: group }`                                                                                 | The default group header row, when grouping is enabled                                                                               |
| `DropdownHeaderTemplateDirective`        | `ng-template[monaDropDownHeaderTemplate]`        | None                                                                                                   | No default — renders above the option list inside the popup                                                                          |
| `DropdownFooterTemplateDirective`        | `ng-template[monaDropDownFooterTemplate]`        | None                                                                                                   | No default — renders below the option list inside the popup                                                                          |
| `DropdownNoDataTemplateDirective`        | `ng-template[monaDropDownNoDataTemplate]`        | None                                                                                                   | The popup's default empty-state content                                                                                              |
| `DropdownPrefixTemplateDirective`        | `ng-template[monaDropdownPrefixTemplate]`        | None                                                                                                   | No default — projected content rendered before the tags                                                                              |

```html

<mona-multi-select [data]="countries" textField="name" valueField="id">
    <ng-template monaDropDownItemTemplate let-dataItem>
        <span>{{ dataItem.name }}</span>
    </ng-template>
    <ng-template monaMultiSelectTagTemplate let-dataItem>
        <span>{{ dataItem.name }}</span>
    </ng-template>
</mona-multi-select>
```

## Feature Examples

### `valueField`-based restoration

Setting `value` to an array of primitive field values (matching `valueField`) selects the items whose fields match.

```html

<mona-multi-select [data]="countries" textField="name" valueField="id" [(value)]="selectedCountryIds"></mona-multi-select>
```

### Collapsing tags into a summary

Apply `monaMultiSelectSummaryTag` to collapse tags beyond `tagCount` into a single summary chip (default text: "+N items"). A negative `tagCount` (the default) shows every selected item as its own tag and never renders the summary chip.

```html

<mona-multi-select [data]="countries" textField="name" valueField="id" monaMultiSelectSummaryTag [monaMultiSelectSummaryTag]="2">
    <ng-template monaMultiSelectSummaryTagTemplate let-selectedItems let-tagCount="tagCount">
        <span>+{{ selectedItems.length - tagCount }} more</span>
    </ng-template>
</mona-multi-select>
```

### Checkboxes in the popup

`checkboxes` renders a checkbox next to each option in the popup, in addition to the default selected-state styling.

```html

<mona-multi-select [data]="countries" textField="name" valueField="id" [checkboxes]="true"></mona-multi-select>
```

### Closing the popup after each selection

By default the popup stays open after selecting or deselecting an item, so the consumer can pick several options in a row. Set `autoClose` to `true` to close it after each selection instead.

```html

<mona-multi-select [data]="countries" textField="name" valueField="id" [autoClose]="true"></mona-multi-select>
```

### Disabled, readonly, loading, and required states

`disabled` renders the component with reduced visual emphasis, prevents the popup from opening, and blocks tag removal. `readonly` prevents value changes while preserving the visual state. `loading` shows a loading indicator in place of the clear button. `required` marks the field for form validation and affects the invalid state once the control is touched.

```html

<mona-multi-select
    [data]="countries"
    textField="name"
    valueField="id"
    [disabled]="isDisabled()"
    [readonly]="isReadonly()"
    [loading]="isLoading()"
    [required]="true"
    [showClearButton]="true">
</mona-multi-select>
```

### Signal Forms integration

Binding `[formField]` synchronizes `value`, `disabled`, `readonly`, `required`, `invalid`, and `touched` with a signal forms field automatically.

```typescript
import { form, required } from "@angular/forms/signals";

protected readonly countryModel = signal<{ ids: number[] }>({ ids: [] });
protected readonly countryForm = form(this.countryModel, schema => {
    required(schema.ids);
});
```

```html

<mona-multi-select [data]="countries" textField="name" valueField="id" [formField]="countryForm.ids"></mona-multi-select>
```

### Filtering

`monaDropDownFilterable` renders a filter input inside the popup that narrows the visible options by text.

```html

<mona-multi-select
    [data]="countries"
    textField="name"
    valueField="id"
    monaDropDownFilterable
    [monaDropDownFilterable]="{ operator: 'contains', caseSensitive: false }">
</mona-multi-select>
```

### Grouping

`monaDropDownGroupable` groups options under a header row, driven by `groupBy`.

```html

<mona-multi-select [data]="countries" textField="name" valueField="id" monaDropDownGroupable groupBy="region"></mona-multi-select>
```

### Virtual scrolling

`monaDropDownVirtualScroll` renders only the options currently in view, for large collections.

```html

<mona-multi-select
    [data]="countries"
    textField="name"
    valueField="id"
    monaDropDownVirtualScroll
    [monaDropDownVirtualScroll]="{ height: 32 }">
</mona-multi-select>
```

## Technical & Behavior Notes

### No placeholder input

Unlike Dropdown List, Combo Box, and Auto Complete, `MultiSelectComponent` has no `placeholder` input. When nothing is selected, the host element renders no tags and no placeholder text.

### `showClearButton` clears every selection

`showClearButton` renders a single clear button that removes all selected items at once, not one at a time.

### `open` and `close` are cancelable

`open` and `close` emit event objects with `preventDefault()` and `isDefaultPrevented()`. Calling `preventDefault()` in an `open` handler stops the popup from opening; calling it in a `close` handler stops the popup from closing. `close`'s event object also exposes `via`, describing what triggered the close attempt.

### `DropdownFieldSelectorType`, `DropdownFieldPredicateType`, and `ListSizeInputType` are not exported

`textField`, `valueField`, `itemDisabled`, `popupHeight`, and `popupWidth` are typed with these generic aliases internally, but none of the three types are re-exported from `@mirei/mona-ui`. Inline values (as in the examples above) still type-check structurally; only a standalone typed variable would require an import.
`TODO(owner-review): confirm whether these types should be added to the public barrel export.`

## Accessibility & Forms Integration

### Keyboard

| Key                     | Action                                                                                                                                            |
|-------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------|
| `ArrowDown` / `ArrowUp` | Highlight the next or previous option. Wraps from the last option back to the first (and vice versa). Never selects by itself.                    |
| `Alt+ArrowDown`         | Open the popup.                                                                                                                                   |
| `Alt+ArrowUp`           | Close the popup.                                                                                                                                  |
| `Enter`                 | Open the popup when closed. When open, toggles the highlighted option's selected state; closes the popup afterward only if `autoClose` is `true`. |
| `Space`                 | Toggle the popup open or closed.                                                                                                                  |
| `Backspace`             | Remove the most recently selected tag.                                                                                                            |
| `Escape` / `Tab`        | Close the popup.                                                                                                                                  |

### Focus

The host element is the only Tab stop; DOM focus does not move into the popup's option list, and tags are not individually focusable (`tabindex="-1"` on each chip). Arrow-key navigation moves an internal highlighted-option pointer, reflected through `aria-activedescendant` on the host element, instead.

### ARIA

| Attribute               | When present                                                                                     | Value                                                                                                                  |
|-------------------------|--------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------|
| `role`                  | Always                                                                                           | `"combobox"`                                                                                                           |
| `aria-haspopup`         | Always                                                                                           | `"listbox"`                                                                                                            |
| `aria-expanded`         | Always                                                                                           | Reflects the popup's open state                                                                                        |
| `aria-activedescendant` | While an option is highlighted                                                                   | The highlighted option's element id                                                                                    |
| `aria-controls`         | Always                                                                                           | The popup listbox's element id                                                                                         |
| `aria-label`            | Always                                                                                           | The `ariaLabel` value (empty string by default — no fallback to any other text, since there is no `placeholder` input) |
| `aria-labelledby`       | Always                                                                                           | The `ariaLabelledBy` value                                                                                             |
| `aria-disabled`         | `disabled` is `true`                                                                             | `"true"`                                                                                                               |
| `aria-readonly`         | `readonly` is `true`                                                                             | `"true"`                                                                                                               |
| `aria-required`         | `required` is `true`                                                                             | `"true"`                                                                                                               |
| `aria-invalid`          | `invalid` is `true`, or `required` is `true` and the control is `touched` with no items selected | `"true"`                                                                                                               |
| `aria-busy`             | `loading` is `true`                                                                              | `"true"`                                                                                                               |

Provide `ariaLabel` or `ariaLabelledBy` to identify the control's purpose — unlike the other dropdown components, there is no `placeholder` fallback.

The control also renders a visually hidden live region that announces the highlighted or selected option's text and position to screen reader users as the consumer navigates the popup.

### Form Interaction

`MultiSelectComponent` implements the signal forms `FormValueControl<Iterable<TData>>` interface and synchronizes with a field bound through `[formField]` (see [Signal Forms integration](#signal-forms-integration)). It does not implement `ControlValueAccessor` — there is no `NG_VALUE_ACCESSOR` provider and no `writeValue`/`registerOnChange`/`registerOnTouched` methods — so it cannot be used with `[(ngModel)]`, `[formControl]`, or `formControlName`.

## API

### `MultiSelectComponent`

**Selector:** `mona-multi-select`

#### Inputs

| Name              | Type                                                 | Default     | Description                                                                                                                                                                                                                                                                                |
|-------------------|------------------------------------------------------|-------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `ariaLabel`       | `string`                                             | `""`        | Accessible name for the host element. No fallback — see [No placeholder input](#no-placeholder-input).                                                                                                                                                                                     |
| `ariaLabelledBy`  | `string`                                             | `""`        | ID of an external element that provides the accessible name for the host element.                                                                                                                                                                                                          |
| `autoClose`       | `boolean`                                            | `false`     | Closes the popup automatically after an item is selected or deselected.                                                                                                                                                                                                                    |
| `checkboxes`      | `boolean`                                            | `false`     | Renders a checkbox next to each item in the popup list to indicate its selected state.                                                                                                                                                                                                     |
| `data`            | `Iterable<TData>`                                    | `[]`        | Collection of items rendered in the popup list.                                                                                                                                                                                                                                            |
| `disabled`        | `boolean`                                            | `false`     | Two-way bindable. Disables the component, preventing the popup from opening and blocking tag removal.                                                                                                                                                                                      |
| `invalid`         | `boolean`                                            | `false`     | Marks the multi select as invalid. Set automatically by `[formField]`.                                                                                                                                                                                                                     |
| `itemDisabled`    | `DropdownFieldPredicateType<TData>`                  | `undefined` | A predicate function or the name of the field that determines whether an item is disabled.                                                                                                                                                                                                 |
| `loading`         | `boolean`                                            | `false`     | Sets the loading state of the multi select component.                                                                                                                                                                                                                                      |
| `popupClass`      | `string`                                             | `""`        | Sets the class of the popup element.                                                                                                                                                                                                                                                       |
| `popupHeight`     | `ListSizeInputType`                                  | `null`      | Sets the height of the popup element.                                                                                                                                                                                                                                                      |
| `popupWidth`      | `ListSizeInputType`                                  | `null`      | Sets the width of the popup element.                                                                                                                                                                                                                                                       |
| `readonly`        | `boolean`                                            | `false`     | Sets the readonly state of the multi select component.                                                                                                                                                                                                                                     |
| `required`        | `boolean`                                            | `false`     | Sets the required state of the multi select component.                                                                                                                                                                                                                                     |
| `rounded`         | `"none" \| "small" \| "medium" \| "large" \| "full"` | `"medium"`  | Sets the border radius of the multi select component.                                                                                                                                                                                                                                      |
| `showClearButton` | `boolean`                                            | `false`     | Renders a button that clears all selected items when at least one item is selected — see [`showClearButton` clears every selection](#showclearbutton-clears-every-selection).                                                                                                              |
| `size`            | `"small" \| "medium" \| "large"`                     | `"medium"`  | The size of the multi select component.                                                                                                                                                                                                                                                    |
| `textField`       | `DropdownFieldSelectorType<TData>`                   | `null`      | Property name or accessor used to derive the display text from a data item. Uses the item itself when unset.                                                                                                                                                                               |
| `touched`         | `boolean`                                            | `false`     | Sets the touched state of the multi select. Set automatically by `[formField]`.                                                                                                                                                                                                            |
| `class`           | `string`                                             | `""`        | Additional CSS classes merged onto the host element via `tailwind-merge`.                                                                                                                                                                                                                  |
| `value`           | `Iterable<TData>`                                    | `[]`        | Two-way bindable, and compatible with Signal Forms via `[formField]`. Currently selected values; when `valueField` is set, primitive field values can be written into this model to restore matching selected items — see [`valueField`-based restoration](#valuefield-based-restoration). |
| `valueField`      | `DropdownFieldSelectorType<TData>`                   | `null`      | Property name or accessor used to derive the value from a data item. Uses the item itself when unset.                                                                                                                                                                                      |

#### Outputs

| Name     | Type               | Description                                                                                                                                |
|----------|--------------------|--------------------------------------------------------------------------------------------------------------------------------------------|
| `close`  | `PopupCloseEvent`  | Emitted when the popup is about to close. Cancelable.                                                                                      |
| `closed` | `void`             | Emitted after the popup is closed.                                                                                                         |
| `open`   | `PreventableEvent` | Emitted when the popup is about to open. Cancelable.                                                                                       |
| `opened` | `void`             | Emitted after the popup is opened.                                                                                                         |
| `touch`  | `void`             | Emitted when the multi select is interacted with on blur, selection, remove, or clear. Used by `[formField]` to mark the field as touched. |

---

### `MultiSelectSummaryTagDirective<TData>`

**Selector:** `mona-multi-select[monaMultiSelectSummaryTag]`

#### Inputs

| Name                                     | Type     | Default | Description                                                                                                                                                                                                                                                 |
|------------------------------------------|----------|---------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `monaMultiSelectSummaryTag` (`tagCount`) | `number` | `-1`    | Number of selected item tags to display before collapsing the rest into a summary tag. A negative value shows every selected item as its own tag and never renders the summary tag — see [Collapsing tags into a summary](#collapsing-tags-into-a-summary). |

No outputs.

---

### `DropdownFilterableDirective<TData>`

**Selector:** `mona-multi-select[monaDropDownFilterable]`

#### Inputs

| Name                     | Type                               | Default | Description                                                                                                                                                                                                           |
|--------------------------|------------------------------------|---------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `filter`                 | `string`                           | `""`    | Current filter text used to narrow the visible options.                                                                                                                                                               |
| `filterPlaceholder`      | `string`                           | `""`    | Placeholder text shown in the popup's filter input.                                                                                                                                                                   |
| `monaDropDownFilterable` | `Partial<FilterableOptions> \| ""` | `""`    | Filter operator, case sensitivity, and debounce delay. An empty string enables filtering with default settings (`operator: "contains"`, `caseSensitive: false`, `debounce: 0`); pass an object to override any field. |

#### Outputs

| Name           | Type                | Description                                        |
|----------------|---------------------|----------------------------------------------------|
| `filterChange` | `FilterChangeEvent` | Emitted when the filter value changes. Cancelable. |

---

### `DropdownGroupableDirective<TData>`

**Selector:** `mona-multi-select[monaDropDownGroupable]`

#### Inputs

| Name                    | Type                                                  | Default | Description                                                                                                                                                                    |
|-------------------------|-------------------------------------------------------|---------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `groupBy`               | `string \| ((item: TData) => R) \| null \| undefined` | `""`    | Property name, or accessor, used to derive an option's group.                                                                                                                  |
| `monaDropDownGroupable` | `GroupableOptions<TData, R> \| ""`                    | `""`    | Group header order, and optional per-group item ordering. An empty string enables grouping with default settings (`headerOrder: "asc"`); pass an object to override any field. |

No outputs.

---

### `DropdownVirtualScrollDirective<TData>`

**Selector:** `mona-multi-select[monaDropDownVirtualScroll]`

#### Inputs

| Name                        | Type                                  | Default | Description                                                                                                                                                                                                |
|-----------------------------|---------------------------------------|---------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `monaDropDownVirtualScroll` | `Partial<VirtualScrollOptions> \| ""` | `""`    | Whether virtual scrolling is enabled and the pixel height of a single option row. An empty string enables virtual scrolling with default settings (`height: 28`); pass an object to override either field. |

No outputs.

---

### Exported Types

#### `FilterableOptions`

| Field           | Type                                                                                       | Description                                                               |
|-----------------|--------------------------------------------------------------------------------------------|---------------------------------------------------------------------------|
| `caseSensitive` | `boolean`                                                                                  | Whether text matching is case-sensitive.                                  |
| `debounce`      | `number`                                                                                   | Milliseconds to wait after the last keystroke before applying the filter. |
| `enabled`       | `boolean`                                                                                  | Whether filtering is active.                                              |
| `operator`      | `"contains" \| "endsWith" \| "startsWith" \| ((value: string, filter: string) => boolean)` | Match strategy used to test an option's text against the filter text.     |

#### `GroupableOptions<T = unknown, R = unknown>`

| Field              | Type                                      | Description                                                             |
|--------------------|-------------------------------------------|-------------------------------------------------------------------------|
| `enabled`          | `boolean \| undefined`                    | Whether grouping is active.                                             |
| `headerOrder`      | `"asc" \| "desc" \| undefined`            | Sort direction applied to group headers by their key.                   |
| `orderBy`          | `string \| ((item: T) => R) \| undefined` | Property name or accessor used to sort items within each group.         |
| `orderByDirection` | `"asc" \| "desc" \| undefined`            | Sort direction applied by `orderBy`. Ignored when `orderBy` is not set. |

#### `VirtualScrollOptions`

| Field     | Type                  | Description                                                               |
|-----------|-----------------------|---------------------------------------------------------------------------|
| `enabled` | `boolean`             | Whether virtual scrolling is active.                                      |
| `height`  | `number \| undefined` | Fixed row height, in pixels, used to measure the virtual scroll viewport. |

`PopupCloseEvent`, `PreventableEvent`, and `FilterChangeEvent` are also exported from `@mirei/mona-ui`.

`TODO(owner-review): DropdownFieldSelectorType<TData>, DropdownFieldPredicateType<TData>, and ListSizeInputType are used in public input signatures but are not exported — see` [DropdownFieldSelectorType, DropdownFieldPredicateType, and ListSizeInputType are not exported](#dropdownfieldselectortype-dropdownfieldpredicatetype-and-listsizeinputtype-are-not-exported).

---

<!-- verification-checklist
- [x] MultiSelectComponent inputs/outputs/defaults verified against multi-select.component.ts source and cross-checked against component-metadata.json's MultiSelectComponent entry
- [x] Confirmed no placeholder input exists (absent from both the source's public input list and component-metadata.json), and that aria-label has no fallback (bound directly to ariaLabel(), unlike DropdownList/ComboBox/AutoComplete's effectiveAriaLabel computed)
- [x] MultiSelectSummaryTagDirective and its tagCount input/monaMultiSelectSummaryTagTemplate contentChild verified against multi-select-summary-tag.directive.ts; template context { $implicit, tagCount } verified against multi-select.component.html's ngTemplateOutletContext binding
- [x] MultiSelectTagTemplateDirective verified against multi-select-tag-template.directive.ts and its usage/context in multi-select.component.html
- [x] valueField-based restoration with arrays confirmed: constructor effect calls this.#listService.setSelectedDataItems(value) for the full Iterable<TData>; spec's [formField]="form.value" test uses a numeric array field ({ value: [2] })
- [x] showClearButton clearing all selections verified against onValueClear() calling updateValue([]) and listService.clearSelections()
- [x] Keyboard map verified: ArrowUp/ArrowDown/Alt+Arrow/Escape/Tab/Space fall through to dropdown-list-popup-handler.directive.ts's shared defaults (not intercepted by MultiSelectComponent, unlike ComboBox/AutoComplete); Enter and Backspace verified against multi-select.component.ts's setEnterKeySubscription/setBackspaceKeySubscription/handleEnterKey; wrap: true verified against initialize()'s setNavigableOptions call
- [x] Focus behavior verified: host has [attr.tabindex]="disabled() ? null : 0" (host itself is the focusable element, unlike ComboBox/AutoComplete's inner <input> pattern); chips have [tabindex]="-1" and [removeTabIndex]="-1" in multi-select.component.html
- [x] ARIA attributes (single-element table, not host/input split) verified against multi-select.component.ts's host object
- [x] Form integration verified: MultiSelectComponent implements FormValueControl<Iterable<TData>>; no NG_VALUE_ACCESSOR provider or writeValue/registerOnChange/registerOnTouched methods found
- [x] FilterableOptions, GroupableOptions, VirtualScrollOptions, PopupCloseEvent, PreventableEvent, FilterChangeEvent confirmed exported via lib/index.ts; DropdownFieldSelectorType, DropdownFieldPredicateType, ListSizeInputType confirmed NOT exported; MultiSelectComponent, MultiSelectTagTemplateDirective, MultiSelectSummaryTagDirective, MultiSelectSummaryTagTemplateDirective all confirmed exported
- [x] No internal-only symbols (ListService, DropdownService, MultiSelectService, ChipComponent's own internal styling, monaDropdownLiveRegion, indicator-icon presets, Tailwind class names, data-invalid attribute) documented as public API beyond the mona-chip content-projection mention needed to explain tag rendering
-->
