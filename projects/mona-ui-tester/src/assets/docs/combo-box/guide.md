## Overview

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
import { ComboBoxComponent } from "@nanahoshi/mona-ui/combo-box";
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

`textField` and `valueField` each accept a property name or an accessor function. `valueField` identifies each item for selection matching and, when `valuePrimitive` is enabled, is also what gets read from and written into `value` instead of the full item — see [Primitive value binding](#primitive-value-binding).

## Anatomy

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

## Examples

### Filtering

`monaDropDownFilterable` narrows the popup's visible options to those matching the typed text.

```example
combo-box/filtering
```

### Primitive value binding

By default `value` holds the complete selected data item. Set `valuePrimitive` to `true` to have `value` hold the value resolved through `valueField` instead — useful for storing just an id rather than the whole object. Setting `value` to a matching field value (for example, restoring it from a signal forms field) also selects the corresponding item and updates the displayed text to that item's `textField`.

```example
combo-box/primitive
```

The value becomes the matching `code` once an item is selected, and `null` again once cleared. `valueField` should resolve to a stable, unique scalar; without it, the item itself is used as the value, which naturally supports primitive data such as `["One", "Two", "Three"]`. Custom values via `allowCustomValue`/`valueAdd` are unaffected — see [Allowing custom values](#allowing-custom-values).

### Allowing custom values

`allowCustomValue` lets the consumer commit typed text that doesn't match any item in `data`. When enabled, unmatched text on `Enter` emits `valueAdd` with the typed text instead of writing to `value` — the consumer decides how to handle it, here by adding a new item to `data` and then setting `value`.

```example
combo-box/custom-values
```

### Signal Forms integration

Binding `[formField]` synchronizes `value`, `disabled`, `readonly`, `required`, `invalid`, and `touched` with a signal forms field automatically.

```example
combo-box/forms
```

### Grouping

`monaDropDownGroupable` groups options under a header row, driven by `groupBy`.

```html

<mona-combo-box [data]="countries" textField="name" valueField="id" monaDropDownGroupable groupBy="region"></mona-combo-box>
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

## Behavior

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

## Forms Integration

`ComboBoxComponent` implements the signal forms `FormValueControl<TValue | null>` interface (`TValue` defaults to `TData`, or the `valueField` type when `valuePrimitive` is `true`) and synchronizes with a field bound through `[formField]` (see [Signal Forms integration](#signal-forms-integration)). It has no `ControlValueAccessor`, but `[(ngModel)]`, `[formControl]` and `formControlName` work too, because Angular binds a control's `value` and `touch` directly when it has no accessor. Prefer `[formField]`, which also hands it `disabled`, `readonly`, `required` and validation state.

## Accessibility

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
| Input        | `aria-label`            | The `aria-label` input is set, or as a fallback to `placeholder` when `aria-labelledby` is unset | The `aria-label` value, or the `placeholder` value |
| Input        | `aria-labelledby`       | The `aria-labelledby` input is set                                                             | The `aria-labelledby` value                        |
| Input        | `aria-describedby`      | The `aria-describedby` input is set                                                            | The `aria-describedby` value                       |

The input also carries the native HTML `required` attribute (not just `aria-required`) when `required` is `true`, so native browser form validation also observes it.

Provide `aria-label` or `aria-labelledby` when `placeholder` does not already identify the input's purpose, or point a `<label for>` or `<mona-label for>` at `inputId`. Provide `aria-describedby` to associate error messages or help text with the input.

The control also renders a visually hidden live region that announces the highlighted option's text and position to screen reader users as the consumer types.

<!-- verification-checklist
- [x] ComboBoxComponent inputs/outputs/defaults verified against combo-box.component.ts source and cross-checked against component-metadata.json's ComboBoxComponent entry (all 30 members matched, including showClearButton defaulting to false, matching DropdownList)
- [x] valuePrimitive and TValue-generic value binding verified against combo-box.component.ts's getControlValue() (returns getDataItemValue(dataItem) when valuePrimitive() else dataItem) and synchronizeSelection() (setSelectedKeys([value]) when valuePrimitive() else setSelectedDataItems([value])); confirmed value-restoration by primitive field only takes effect when valuePrimitive is true, unlike the pre-valuePrimitive behavior this doc previously described
- [x] filterPlaceholder's no-op confirmed against combo-box.component.ts's initialize() (this.#listService.filterInputVisible.set(false))
- [x] Enter key resolution (4-branch logic) verified against combo-box.component.ts's handleEnterKey(): userNavigatedViaArrows branch, highlighted-item-matches-text branch, matchingFilteredItem fallback, allowCustomValue valueAdd branch
- [x] Clear button visibility verified: @if (showClearButton() && selectedListItem() && !loading()) in combo-box.component.html, gated on selectedListItem() not on typed text presence
- [x] Escape behavior verified against setEscapeKeySubscription(): reverts comboBoxValue/navigatedValue to selectedListItem when popup open with a selection, calls clear() otherwise
- [x] Tab behavior verified against setKeydownSubscription(): only closePopup() is called, no commit/revert — flagged as owner-review since it may be an oversight rather than intended
- [x] Seven ARIA rows for host vs. six for input verified against combo-box.component.ts's host object and combo-box.component.html's [attr.*] bindings on the <input>; confirmed host has no aria-haspopup (unlike AutoComplete's host) and input carries native required attribute in addition to aria-required on host
- [x] Focus behavior verified: host has [attr.tabindex]="-1"; focus() method explicitly queries and focuses the inner <input>
- [x] Form integration verified: ComboBoxComponent implements FormValueControl<TValue | null>; no NG_VALUE_ACCESSOR provider or writeValue/registerOnChange/registerOnTouched methods found; ngModel and formControl still work without one, checked by tests/forms-interop.spec.ts
- [x] FilterableOptions, GroupableOptions, VirtualScrollOptions, PopupCloseEvent, PreventableEvent, FilterChangeEvent confirmed exported via lib/index.ts; DropdownFieldSelectorType, DropdownFieldPredicateType, ListSizeInputType confirmed NOT exported; only ComboBoxComponent itself is exported for this component family
- [x] No internal-only symbols (ListService, DropdownService, DropdownListService, monaDropdownLiveRegion, indicator-icon presets, Tailwind class names, data-disabled/data-invalid attributes) documented as public API
-->
