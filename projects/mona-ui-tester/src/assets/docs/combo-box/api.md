## Overview & Component Selection

Combo Box renders a real text input backed by a popup of matching options, similar to Auto Complete. Unlike Auto Complete, `value` is typed `TData | null` and normally only becomes non-null when the typed or navigated text resolves to one of the items in `data` — free text that doesn't match anything is discarded on commit, unless `allowCustomValue` is enabled.

Filtering, grouping, and virtual scrolling are opt-in through companion attribute directives applied to the `<mona-combo-box>` host element, the same pattern used by Dropdown List and Auto Complete:

- `monaDropDownFilterable` — narrows the popup's visible options to those matching the typed text.
- `monaDropDownGroupable` — groups options under a header row.
- `monaDropDownVirtualScroll` — renders only the options currently in view.

**Use Combo Box when:**

- The consumer should be able to type or navigate to a value, but the committed value should still resolve to one of the listed options (unless `allowCustomValue` is explicitly enabled).

**Use `AutoComplete` instead when:**

- Any typed text is an acceptable value — the value never needs to resolve to a specific data item.

**Use `DropDownList` instead when:**

- The consumer must pick one of a bounded set of options and free-text entry into the value area is not wanted at all.

**Use `MultiSelect` instead when:**

- More than one value can be selected at once.

## Import & Quick Start

```typescript
import { ComboBoxComponent } from "@nanahoshi/mona-ui";
```

```typescript
protected readonly countries = [
    { id: 1, name: "United States" },
    { id: 2, name: "Canada" },
    { id: 3, name: "Mexico" }
];
protected readonly selectedCountry = signal<{ id: number; name: string } | null>(null);
```

```html

<mona-combo-box
    [data]="countries"
    textField="name"
    valueField="id"
    placeholder="Select a country"
    [(value)]="selectedCountry">
</mona-combo-box>
```

`textField` and `valueField` each accept a property name or an accessor function. Unlike Auto Complete, setting `valueField` on Combo Box lets a primitive field value be written into `value` (for example, restoring `value` to `2` from a signal forms field) to select the matching item — see [`valueField`-based restoration](#valuefield-based-restoration).

## Anatomy & Public Structural Templates

Each structural directive below is an `ng-template` placed as projected content inside `<mona-combo-box>...</mona-combo-box>`. As with Auto Complete, there is no value-template directive — the value area is a plain text input.

| Directive                              | Selector                                       | Template context                                | Replaces                                                    |
|----------------------------------------|------------------------------------------------|-------------------------------------------------|-------------------------------------------------------------|
| `DropdownItemTemplateDirective`        | `ng-template[monaDropDownItemTemplate]`        | `{ $implicit: TData }` (the option's data item) | Each option's default text rendering inside the popup       |
| `DropdownGroupHeaderTemplateDirective` | `ng-template[monaDropDownGroupHeaderTemplate]` | `{ $implicit: group }`                          | The default group header row, when grouping is enabled      |
| `DropdownHeaderTemplateDirective`      | `ng-template[monaDropDownHeaderTemplate]`      | None                                            | No default — renders above the option list inside the popup |
| `DropdownFooterTemplateDirective`      | `ng-template[monaDropDownFooterTemplate]`      | None                                            | No default — renders below the option list inside the popup |
| `DropdownNoDataTemplateDirective`      | `ng-template[monaDropDownNoDataTemplate]`      | None                                            | The popup's default empty-state content                     |
| `DropdownPrefixTemplateDirective`      | `ng-template[monaDropdownPrefixTemplate]`      | None                                            | No default — projected content rendered before the input    |

```html

<mona-combo-box [data]="countries" textField="name" valueField="id">
    <ng-template monaDropDownItemTemplate let-dataItem>
        <span>{{ dataItem.name }}</span>
    </ng-template>
</mona-combo-box>
```

## Feature Examples

### `valueField`-based restoration

Setting `value` to a primitive field value (matching `valueField`) selects the item whose field matches, and updates the displayed text to that item's `textField`.

```html

<mona-combo-box [data]="countries" textField="name" valueField="id" [(value)]="selectedCountryId"></mona-combo-box>
```

### Allowing custom values

`allowCustomValue` lets the consumer commit typed text that doesn't match any item in `data`. When enabled, unmatched text on `Enter` emits `valueAdd` with the typed text instead of writing to `value` — the consumer decides how to handle it (for example, adding a new item to `data` and then setting `value`).

```typescript
protected onValueAdd(text: string): void {
    const newItem = { id: crypto.randomUUID(), name: text };
    this.countries.update(items => [...items, newItem]);
    this.selectedCountry.set(newItem);
}
```

```html

<mona-combo-box
    [data]="countries"
    textField="name"
    valueField="id"
    [allowCustomValue]="true"
    (valueAdd)="onValueAdd($event)">
</mona-combo-box>
```

### Disabled, readonly, loading, and required states

`disabled` renders the control with reduced visual emphasis and removes pointer interaction. `readonly` prevents value changes while preserving the visual state. `loading` shows a loading indicator in place of the clear button and prevents interaction while an operation is in progress. `required` marks the field for form validation and affects the invalid state once the control is touched.

```html

<mona-combo-box
    [data]="countries"
    textField="name"
    valueField="id"
    [disabled]="isDisabled()"
    [readonly]="isReadonly()"
    [loading]="isLoading()"
    [required]="true"
    [showClearButton]="true">
</mona-combo-box>
```

### Signal Forms integration

Binding `[formField]` synchronizes `value`, `disabled`, `readonly`, `required`, `invalid`, and `touched` with a signal forms field automatically.

```typescript
import { form, required } from "@angular/forms/signals";

protected readonly countryModel = signal<{ id: number | null }>({ id: null });
protected readonly countryForm = form(this.countryModel, schema => {
    required(schema.id);
});
```

```html

<mona-combo-box [data]="countries" textField="name" valueField="id" [formField]="countryForm.id"></mona-combo-box>
```

### Filtering

`monaDropDownFilterable` narrows the popup's visible options to those matching the typed text.

```html

<mona-combo-box
    [data]="countries"
    textField="name"
    valueField="id"
    monaDropDownFilterable
    [monaDropDownFilterable]="{ operator: 'contains', caseSensitive: false }">
</mona-combo-box>
```

### Grouping

`monaDropDownGroupable` groups options under a header row, driven by `groupBy`.

```html

<mona-combo-box [data]="countries" textField="name" valueField="id" monaDropDownGroupable groupBy="region"></mona-combo-box>
```

### Virtual scrolling

`monaDropDownVirtualScroll` renders only the options currently in view, for large collections.

```html

<mona-combo-box
    [data]="countries"
    textField="name"
    valueField="id"
    monaDropDownVirtualScroll
    [monaDropDownVirtualScroll]="{ height: 32 }">
</mona-combo-box>
```

## Technical & Behavior Notes

### Enter key resolution

Pressing `Enter` resolves the typed or navigated text to a value:

1. If an item was reached by arrow-key navigation, that item is committed.
2. Otherwise, if the typed text case-insensitively matches the highlighted item's text, or matches another item in `data`, that item is committed.
3. Otherwise, when `allowCustomValue` is `false`, the value is cleared — see [Allowing custom values](#allowing-custom-values).
4. Otherwise, when `allowCustomValue` is `true` and there is typed text, `valueAdd` is emitted with that text instead of writing to `value`.

### Clear button requires a matched selection

The clear button (`showClearButton`) only appears once the typed or navigated text resolves to a selected item — typing unmatched text does not show it, even though the input is not empty.

### Escape reverts unsaved navigation

While the popup is open, `Escape` reverts the displayed text to the currently selected item (or clears it if nothing is selected) and closes the popup, discarding any in-progress typing or arrow-key navigation. While the popup is closed, `Escape` clears the value entirely.

### `Tab` closes without reverting

`Tab` closes the popup without committing or reverting in-progress typed text.
`TODO(owner-review): confirm whether Tab is intended to leave the displayed text out of sync with value, or whether it should behave like Escape.`

### `open` and `close` are cancelable

`open` and `close` emit event objects with `preventDefault()` and `isDefaultPrevented()`. Calling `preventDefault()` in an `open` handler stops the popup from opening; calling it in a `close` handler stops the popup from closing. `close`'s event object also exposes `via`, describing what triggered the close attempt.

### `DropdownFieldSelectorType`, `DropdownFieldPredicateType`, and `ListSizeInputType` are not exported

`textField`, `valueField`, `itemDisabled`, `popupHeight`, and `popupWidth` are typed with these generic aliases internally, but none of the three types are re-exported from `@nanahoshi/mona-ui`. Inline values (as in the examples above) still type-check structurally; only a standalone typed variable would require an import.
`TODO(owner-review): confirm whether these types should be added to the public barrel export.`

## Accessibility & Forms Integration

### Keyboard

| Key                     | Action                                                                                                                                                                                |
|-------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `ArrowDown` / `ArrowUp` | Navigate to the next or previous option and stage it (does not commit until `Enter`).                                                                                                 |
| `Enter`                 | Resolve the typed or navigated text to a value and close the popup — see [Enter key resolution](#enter-key-resolution).                                                               |
| `Escape`                | Revert to the current selection and close the popup, or clear the value if the popup is already closed — see [Escape reverts unsaved navigation](#escape-reverts-unsaved-navigation). |
| `Tab`                   | Close the popup — see [`Tab` closes without reverting](#tab-closes-without-reverting).                                                                                                |
| Any other character     | Typed into the input as usual, and re-opens the popup if it is closed. When `monaDropDownFilterable` is applied, also narrows the popup's visible options.                            |

### Focus

The host element itself is not a Tab stop (`tabindex="-1"`); the inner `<input>` element receives focus and is the actual Tab stop. Arrow-key navigation moves an internal highlighted-option pointer, reflected through `aria-activedescendant` on the input, instead of moving DOM focus into the popup.

### ARIA

| Element      | Attribute               | When present                                                                                   | Value                                             |
|--------------|-------------------------|------------------------------------------------------------------------------------------------|---------------------------------------------------|
| Host element | `aria-disabled`         | `disabled` is `true`                                                                           | `"true"`                                          |
| Host element | `aria-invalid`          | `invalid` is `true`, or `required` is `true` and the control is `touched` with no value        | `"true"`                                          |
| Host element | `aria-readonly`         | `readonly` is `true`                                                                           | `"true"`                                          |
| Host element | `aria-required`         | `required` is `true`                                                                           | `"true"`                                          |
| Input        | `role`                  | Always                                                                                         | `"combobox"`                                      |
| Input        | `aria-autocomplete`     | Always                                                                                         | `"list"`                                          |
| Input        | `aria-haspopup`         | Always                                                                                         | `"listbox"`                                       |
| Input        | `aria-controls`         | Always                                                                                         | The popup listbox's element id                    |
| Input        | `aria-expanded`         | Always                                                                                         | Reflects the popup's open state                   |
| Input        | `aria-busy`             | Always                                                                                         | Reflects the `loading` input                      |
| Input        | `aria-activedescendant` | While an option is highlighted                                                                 | The highlighted option's element id               |
| Input        | `aria-invalid`          | `invalid` is `true`, or `required` is `true` and the control is `touched` with no value        | `"true"`                                          |
| Input        | `aria-label`            | The `ariaLabel` input is set, or as a fallback to `placeholder` when `ariaLabelledBy` is unset | The `ariaLabel` value, or the `placeholder` value |
| Input        | `aria-labelledby`       | The `ariaLabelledBy` input is set                                                              | The `ariaLabelledBy` value                        |
| Input        | `aria-describedby`      | The `ariaDescribedBy` input is set                                                             | The `ariaDescribedBy` value                       |

The input also carries the native HTML `required` attribute (not just `aria-required`) when `required` is `true`, so native browser form validation also observes it.

Provide `ariaLabel` or `ariaLabelledBy` when `placeholder` does not already identify the input's purpose. Provide `ariaDescribedBy` to associate error messages or help text with the input.

The control also renders a visually hidden live region that announces the highlighted option's text and position to screen reader users as the consumer types.

### Form Interaction

`ComboBoxComponent` implements the signal forms `FormValueControl<TData | null>` interface and synchronizes with a field bound through `[formField]` (see [Signal Forms integration](#signal-forms-integration)). It does not implement `ControlValueAccessor` — there is no `NG_VALUE_ACCESSOR` provider and no `writeValue`/`registerOnChange`/`registerOnTouched` methods — so it cannot be used with `[(ngModel)]`, `[formControl]`, or `formControlName`.

## API

### `ComboBoxComponent`

**Selector:** `mona-combo-box`

#### Inputs

| Name               | Type                                                 | Default     | Description                                                                                                                                                                                                                                                                                 |
|--------------------|------------------------------------------------------|-------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `allowCustomValue` | `boolean`                                            | `false`     | Allows a custom value to be committed when it doesn't match any item in `data` — see [Allowing custom values](#allowing-custom-values).                                                                                                                                                     |
| `ariaDescribedBy`  | `string`                                             | `""`        | ID of an element that provides an extended description for the input.                                                                                                                                                                                                                       |
| `ariaLabel`        | `string`                                             | `""`        | Accessible name for the input. Falls back to `placeholder` when neither this nor `ariaLabelledBy` is set.                                                                                                                                                                                   |
| `ariaLabelledBy`   | `string`                                             | `""`        | ID of an external element that provides the accessible name for the input.                                                                                                                                                                                                                  |
| `data`             | `Iterable<TData>`                                    | `[]`        | Collection of items to render.                                                                                                                                                                                                                                                              |
| `disabled`         | `boolean`                                            | `false`     | Two-way bindable. Renders the component with reduced visual emphasis and removes pointer interaction.                                                                                                                                                                                       |
| `invalid`          | `boolean`                                            | `false`     | Marks the combo box as invalid. Set automatically by `[formField]`.                                                                                                                                                                                                                         |
| `itemDisabled`     | `DropdownFieldPredicateType<TData>`                  | `undefined` | Predicate function or field name that determines whether an item is disabled.                                                                                                                                                                                                               |
| `loading`          | `boolean`                                            | `false`     | Displays a loading indicator and prevents interaction while an operation is in progress.                                                                                                                                                                                                    |
| `placeholder`      | `string`                                             | `""`        | Placeholder text shown when no value is selected or entered.                                                                                                                                                                                                                                |
| `popupClass`       | `string`                                             | `""`        | Sets the class of the popup element.                                                                                                                                                                                                                                                        |
| `popupHeight`      | `ListSizeInputType`                                  | `null`      | Sets the height of the popup element.                                                                                                                                                                                                                                                       |
| `popupWidth`       | `ListSizeInputType`                                  | `null`      | Sets the width of the popup element.                                                                                                                                                                                                                                                        |
| `readonly`         | `boolean`                                            | `false`     | Prevents value changes while preserving the component's visual state.                                                                                                                                                                                                                       |
| `required`         | `boolean`                                            | `false`     | Sets the required state of the combo box component.                                                                                                                                                                                                                                         |
| `rounded`          | `"none" \| "small" \| "medium" \| "large" \| "full"` | `"medium"`  | Border-radius preset applied to the component.                                                                                                                                                                                                                                              |
| `showClearButton`  | `boolean`                                            | `false`     | Displays a button that resets the value to empty when an item is selected — see [Clear button requires a matched selection](#clear-button-requires-a-matched-selection).                                                                                                                    |
| `size`             | `"small" \| "medium" \| "large"`                     | `"medium"`  | Size preset controlling the component's dimensions.                                                                                                                                                                                                                                         |
| `textField`        | `DropdownFieldSelectorType<TData>`                   | `undefined` | Property name or accessor used to derive the display text from a data item. Uses the item itself when unset.                                                                                                                                                                                |
| `touched`          | `boolean`                                            | `false`     | Sets the touched state of the combo box. Set automatically by `[formField]`.                                                                                                                                                                                                                |
| `class`            | `string`                                             | `""`        | Additional CSS classes merged onto the host element via `tailwind-merge`.                                                                                                                                                                                                                   |
| `value`            | `TData \| null`                                      | `null`      | Two-way bindable, and compatible with Signal Forms via `[formField]`. Currently selected value; when `valueField` is set, a primitive field value can be written into this model to restore a matching selected item — see [`valueField`-based restoration](#valuefield-based-restoration). |
| `valueField`       | `DropdownFieldSelectorType<TData>`                   | `undefined` | Property name or accessor used to derive the value from a data item. Uses the item itself when unset.                                                                                                                                                                                       |

#### Outputs

| Name       | Type               | Description                                                                                                                                                                                 |
|------------|--------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `close`    | `PopupCloseEvent`  | Emitted when the popup is about to close. Cancelable.                                                                                                                                       |
| `closed`   | `void`             | Emitted after the popup is closed.                                                                                                                                                          |
| `open`     | `PreventableEvent` | Emitted when the popup is about to open. Cancelable.                                                                                                                                        |
| `opened`   | `void`             | Emitted after the popup is opened.                                                                                                                                                          |
| `touch`    | `void`             | Emitted when the combo box is interacted with on blur, selection, clear, or committed input. Used by `[formField]` to mark the field as touched.                                            |
| `valueAdd` | `string`           | Emitted with the entered text when the consumer presses `Enter` on unmatched input. Only emitted when `allowCustomValue` is `true` — see [Allowing custom values](#allowing-custom-values). |

---

### `DropdownFilterableDirective<TData>`

**Selector:** `mona-combo-box[monaDropDownFilterable]`

#### Inputs

| Name                     | Type                               | Default | Description                                                                                                                                                                                                           |
|--------------------------|------------------------------------|---------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `filter`                 | `string`                           | `""`    | Current filter text used to narrow the visible options.                                                                                                                                                               |
| `filterPlaceholder`      | `string`                           | `""`    | No effect on Combo Box — the popup's own filter row is disabled for this component, since the main input already serves as the filter box.                                                                            |
| `monaDropDownFilterable` | `Partial<FilterableOptions> \| ""` | `""`    | Filter operator, case sensitivity, and debounce delay. An empty string enables filtering with default settings (`operator: "contains"`, `caseSensitive: false`, `debounce: 0`); pass an object to override any field. |

#### Outputs

| Name           | Type                | Description                                        |
|----------------|---------------------|----------------------------------------------------|
| `filterChange` | `FilterChangeEvent` | Emitted when the filter value changes. Cancelable. |

---

### `DropdownGroupableDirective<TData>`

**Selector:** `mona-combo-box[monaDropDownGroupable]`

#### Inputs

| Name                    | Type                                                  | Default | Description                                                                                                                                                                    |
|-------------------------|-------------------------------------------------------|---------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `groupBy`               | `string \| ((item: TData) => R) \| null \| undefined` | `""`    | Property name, or accessor, used to derive an option's group.                                                                                                                  |
| `monaDropDownGroupable` | `GroupableOptions<TData, R> \| ""`                    | `""`    | Group header order, and optional per-group item ordering. An empty string enables grouping with default settings (`headerOrder: "asc"`); pass an object to override any field. |

No outputs.

---

### `DropdownVirtualScrollDirective<TData>`

**Selector:** `mona-combo-box[monaDropDownVirtualScroll]`

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

`PopupCloseEvent`, `PreventableEvent`, and `FilterChangeEvent` are also exported from `@nanahoshi/mona-ui`.

`TODO(owner-review): DropdownFieldSelectorType<TData>, DropdownFieldPredicateType<TData>, and ListSizeInputType are used in public input signatures but are not exported — see` [DropdownFieldSelectorType, DropdownFieldPredicateType, and ListSizeInputType are not exported](#dropdownfieldselectortype-dropdownfieldpredicatetype-and-listsizeinputtype-are-not-exported).

---

<!-- verification-checklist
- [x] ComboBoxComponent inputs/outputs/defaults verified against combo-box.component.ts source and cross-checked against component-metadata.json's ComboBoxComponent entry (all 27 members matched, including showClearButton defaulting to false, matching DropdownList)
- [x] valueField-based restoration confirmed working (unlike AutoComplete): combo-box.component.ts's constructor effect calls this.#listService.setSelectedDataItems([value]) when value != null, same pattern as DropdownListComponent
- [x] filterPlaceholder's no-op confirmed against combo-box.component.ts's initialize() (this.#listService.filterInputVisible.set(false))
- [x] Enter key resolution (4-branch logic) verified against combo-box.component.ts's handleEnterKey(): userNavigatedViaArrows branch, highlighted-item-matches-text branch, matchingFilteredItem fallback, allowCustomValue valueAdd branch
- [x] Clear button visibility verified: @if (showClearButton() && selectedListItem() && !loading()) in combo-box.component.html, gated on selectedListItem() not on typed text presence
- [x] Escape behavior verified against setEscapeKeySubscription(): reverts comboBoxValue/navigatedValue to selectedListItem when popup open with a selection, calls clear() otherwise
- [x] Tab behavior verified against setKeydownSubscription(): only closePopup() is called, no commit/revert — flagged as owner-review since it may be an oversight rather than intended
- [x] Seven ARIA rows for host vs. six for input verified against combo-box.component.ts's host object and combo-box.component.html's [attr.*] bindings on the <input>; confirmed host has no aria-haspopup (unlike AutoComplete's host) and input carries native required attribute in addition to aria-required on host
- [x] Focus behavior verified: host has [attr.tabindex]="-1"; focus() method explicitly queries and focuses the inner <input>
- [x] Form integration verified: ComboBoxComponent implements FormValueControl<TData | null>; no NG_VALUE_ACCESSOR provider or writeValue/registerOnChange/registerOnTouched methods found
- [x] FilterableOptions, GroupableOptions, VirtualScrollOptions, PopupCloseEvent, PreventableEvent, FilterChangeEvent confirmed exported via lib/index.ts; DropdownFieldSelectorType, DropdownFieldPredicateType, ListSizeInputType confirmed NOT exported; only ComboBoxComponent itself is exported for this component family
- [x] No internal-only symbols (ListService, DropdownService, DropdownListService, monaDropdownLiveRegion, indicator-icon presets, Tailwind class names, data-disabled/data-invalid attributes) documented as public API
-->
