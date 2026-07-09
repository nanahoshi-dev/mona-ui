## Overview & Component Selection

Dropdown List renders a single-value combobox: the host element shows the current selection (or a placeholder) and opens a listbox popup on click, `Enter`, `Space`, or `Alt+ArrowDown`. The value area is not an editable text input — typing only happens inside the popup's filter box, and only once filtering is explicitly enabled.

Filtering, grouping, and virtual scrolling are opt-in through companion attribute directives applied to the same `<mona-dropdown-list>` host element, the same pattern used by List View:

- `monaDropDownFilterable` — renders a filter input inside the popup and narrows visible options by text.
- `monaDropDownGroupable` — groups options under a header row.
- `monaDropDownVirtualScroll` — renders only the options currently in view.

**Use Dropdown List when:**

- The consumer picks exactly one value from a known, bounded set of options.
- Free-text entry into the value area itself is not needed.

**Use `ComboBox` instead when:**

- The consumer should be able to type directly into the value area, not just into a popup filter box.

**Use `MultiSelect` instead when:**

- More than one value can be selected at once.

**Use `AutoComplete` instead when:**

- The consumer enters free text with suggestions, and the value does not need to match a list item.

## Import & Quick Start

```typescript
import { DropdownListComponent } from "@nanahoshi/mona-ui";
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

<mona-dropdown-list
    [data]="countries"
    textField="name"
    valueField="id"
    placeholder="Select a country"
    [(value)]="selectedCountry">
</mona-dropdown-list>
```

`textField` and `valueField` each accept a property name or an accessor function; when either is omitted, the data item itself is used as the display text or the value, respectively. Without any behavior directive applied, the popup renders the full `data` collection with no filter box — see [Feature Examples](#feature-examples) for filtering, grouping, and virtual scrolling.

## Anatomy & Public Structural Templates

Each structural directive below is an `ng-template` placed as projected content inside `<mona-dropdown-list>...</mona-dropdown-list>`.

| Directive                              | Selector                                       | Template context                                                   | Replaces                                                                          |
|----------------------------------------|------------------------------------------------|--------------------------------------------------------------------|-----------------------------------------------------------------------------------|
| `DropdownItemTemplateDirective`        | `ng-template[monaDropDownItemTemplate]`        | `{ $implicit: TData }` (the option's data item)                    | Each option's default text rendering inside the popup                             |
| `DropDownListValueTemplateDirective`   | `ng-template[monaDropDownListValueTemplate]`   | `{ $implicit: TData \| null }` (the selected data item, or `null`) | The default selected-value text rendered in the host element                      |
| `DropdownGroupHeaderTemplateDirective` | `ng-template[monaDropDownGroupHeaderTemplate]` | `{ $implicit: group }`                                             | The default group header row, when grouping is enabled                            |
| `DropdownHeaderTemplateDirective`      | `ng-template[monaDropDownHeaderTemplate]`      | None                                                               | No default — renders above the option list inside the popup                       |
| `DropdownFooterTemplateDirective`      | `ng-template[monaDropDownFooterTemplate]`      | None                                                               | No default — renders below the option list inside the popup                       |
| `DropdownNoDataTemplateDirective`      | `ng-template[monaDropDownNoDataTemplate]`      | None                                                               | The popup's default empty-state content                                           |
| `DropdownPrefixTemplateDirective`      | `ng-template[monaDropdownPrefixTemplate]`      | None                                                               | No default — projected content rendered before the value area on the host element |

```html

<mona-dropdown-list [data]="countries" textField="name" valueField="id">
    <ng-template monaDropDownItemTemplate let-dataItem>
        <span>{{ dataItem.name }}</span>
    </ng-template>
    <ng-template monaDropDownListValueTemplate let-dataItem>
        @if (dataItem) {
        <span>{{ dataItem.name }}</span>
        } @else {
        <span>No country selected</span>
        }
    </ng-template>
</mona-dropdown-list>
```

## Feature Examples

### Custom value display

`monaDropDownListValueTemplate` controls how the selected value renders in the host element, independently of how options render inside the popup.

```html

<mona-dropdown-list [data]="countries" textField="name" valueField="id">
    <ng-template monaDropDownListValueTemplate let-dataItem>
        <span>{{ dataItem?.name ?? 'No country selected' }}</span>
    </ng-template>
</mona-dropdown-list>
```

### Prefix content

`monaDropdownPrefixTemplate` renders projected content before the value area, such as an icon.

```html

<mona-dropdown-list [data]="countries" textField="name" valueField="id">
    <ng-template monaDropdownPrefixTemplate>
        <fa-icon [icon]="['fas', 'globe']"></fa-icon>
    </ng-template>
</mona-dropdown-list>
```

### Disabled, readonly, loading, and required states

`disabled` renders the control with reduced visual emphasis and removes pointer interaction. `readonly` prevents value changes while preserving the visual state. `loading` shows a loading indicator in place of the clear button and prevents interaction while an operation is in progress. `required` marks the field for form validation and affects the invalid state once the control is touched.

```html

<mona-dropdown-list
    [data]="countries"
    textField="name"
    valueField="id"
    [disabled]="isDisabled()"
    [readonly]="isReadonly()"
    [loading]="isLoading()"
    [required]="true"
    [showClearButton]="true">
</mona-dropdown-list>
```

### Signal Forms integration

Binding `[formField]` synchronizes `value`, `disabled`, `readonly`, `required`, `invalid`, and `touched` with a signal forms field automatically — see [Form Interaction](#form-interaction).

```typescript
import { form, required } from "@angular/forms/signals";

protected readonly countryModel = signal<{ id: number | null }>({ id: null });
protected readonly countryForm = form(this.countryModel, schema => {
    required(schema.id);
});
```

```html

<mona-dropdown-list
    [data]="countries"
    textField="name"
    valueField="id"
    [formField]="countryForm.id">
</mona-dropdown-list>
```

### Filtering

`monaDropDownFilterable` renders a filter input inside the popup that narrows the visible options by text.

```html

<mona-dropdown-list
    [data]="countries"
    textField="name"
    valueField="id"
    monaDropDownFilterable
    [monaDropDownFilterable]="{ operator: 'startsWith', caseSensitive: false }"
    filterPlaceholder="Search countries">
</mona-dropdown-list>
```

### Grouping

`monaDropDownGroupable` groups options under a header row, driven by `groupBy`. If `groupBy` is omitted while grouping is enabled, every option falls into a single, unlabeled group.

```html

<mona-dropdown-list
    [data]="countries"
    textField="name"
    valueField="id"
    monaDropDownGroupable
    groupBy="region">
</mona-dropdown-list>
```

### Virtual scrolling

`monaDropDownVirtualScroll` renders only the options currently in view, for large collections. `height` on the options object is the fixed row height, in pixels, used to measure the viewport; every option must render at that height for scrolling to stay accurate.

```html

<mona-dropdown-list
    [data]="countries"
    textField="name"
    valueField="id"
    monaDropDownVirtualScroll
    [monaDropDownVirtualScroll]="{ height: 32 }">
</mona-dropdown-list>
```

## Technical & Behavior Notes

### Staged navigation while the popup is open

While the popup is open, arrow-key and typeahead navigation only stage a highlighted option; the staged option is not written to `value` until the consumer commits it with `Enter` or by closing the popup. When the popup is closed, arrow-key and typeahead navigation commit the value immediately.

### `open` and `close` are cancelable

`open` and `close` emit event objects with `preventDefault()` and `isDefaultPrevented()`. Calling `preventDefault()` in an `open` handler stops the popup from opening; calling it in a `close` handler stops the popup from closing. `close`'s event object also exposes `via`, describing what triggered the close attempt (for example `"escape"` or `"outsideClick"`).

### Click-to-toggle

Clicking anywhere on the host element, outside the clear button, toggles the popup — in addition to the keyboard interactions documented under [Keyboard](#keyboard).

### Filtering, grouping, and virtual scrolling compose

These three directives are independent — applying more than one to the same `mona-dropdown-list` combines their behavior.

### `DropdownFieldSelectorType`, `DropdownFieldPredicateType`, and `ListSizeInputType` are not exported

`textField`, `valueField`, `itemDisabled`, `popupHeight`, and `popupWidth` are typed with these generic aliases internally, but none of the three types are re-exported from `@nanahoshi/mona-ui`. Inline values (as in the examples above) still type-check structurally; only a standalone typed variable would require an import.
`TODO(owner-review): confirm whether these types should be added to the public barrel export.`

## Accessibility & Forms Integration

### Keyboard

| Key                     | Action                                                                                                                                                                                                                                            |
|-------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `ArrowDown` / `ArrowUp` | Navigate to the next or previous option. Commits the value immediately when the popup is closed; only highlights the option when the popup is open — see [Staged navigation while the popup is open](#staged-navigation-while-the-popup-is-open). |
| `Alt+ArrowDown`         | Open the popup.                                                                                                                                                                                                                                   |
| `Alt+ArrowUp`           | Close the popup.                                                                                                                                                                                                                                  |
| `Home`                  | Move to the first option.                                                                                                                                                                                                                         |
| `End`                   | Move to the last option.                                                                                                                                                                                                                          |
| `Enter`                 | Open the popup when closed. When open, commits the highlighted option and closes the popup.                                                                                                                                                       |
| `Space`                 | Toggle the popup open or closed.                                                                                                                                                                                                                  |
| `Escape` / `Tab`        | Close the popup without committing a highlighted-but-uncommitted option.                                                                                                                                                                          |
| Character keys          | Typeahead: cycles through options whose text matches the typed characters.                                                                                                                                                                        |

### Focus

The host element is the only Tab stop; DOM focus does not move into the popup's option list. Arrow-key, `Home`/`End`, and typeahead navigation move an internal highlighted-option pointer that is reflected through `aria-activedescendant` on the host element instead.

### ARIA

| Attribute               | When present                                                                                     | Value                                             |
|-------------------------|--------------------------------------------------------------------------------------------------|---------------------------------------------------|
| `role`                  | Always                                                                                           | `"combobox"`                                      |
| `aria-haspopup`         | Always                                                                                           | `"listbox"`                                       |
| `aria-expanded`         | Always                                                                                           | Reflects the popup's open state                   |
| `aria-activedescendant` | While an option is highlighted                                                                   | The highlighted option's element id               |
| `aria-controls`         | Always                                                                                           | The popup listbox's element id                    |
| `aria-label`            | The `ariaLabel` input is set, or as a fallback to `placeholder` when `ariaLabelledBy` is unset   | The `ariaLabel` value, or the `placeholder` value |
| `aria-labelledby`       | The `ariaLabelledBy` input is set                                                                | The `ariaLabelledBy` value                        |
| `aria-disabled`         | `disabled` is `true`                                                                             | `"true"`                                          |
| `aria-readonly`         | `readonly` is `true`                                                                             | `"true"`                                          |
| `aria-required`         | `required` is `true`                                                                             | `"true"`                                          |
| `aria-invalid`          | `invalid` is `true`, or `required` is `true` and the control is `touched` with no value selected | `"true"`                                          |
| `aria-busy`             | `loading` is `true`                                                                              | `"true"`                                          |

Provide `ariaLabel` or `ariaLabelledBy` when `placeholder` does not already identify the control's purpose — `placeholder` only supplies a fallback accessible name, and disappears once a value is selected.

The control also renders a visually hidden live region that announces the highlighted or selected option's text and position to screen reader users as the consumer navigates the popup.

### Form Interaction

`DropdownListComponent` implements the signal forms `FormValueControl<TData | null>` interface and synchronizes with a field bound through `[formField]` (see [Signal Forms integration](#signal-forms-integration)). It does not implement `ControlValueAccessor` — there is no `NG_VALUE_ACCESSOR` provider and no `writeValue`/`registerOnChange`/`registerOnTouched` methods — so it cannot be used with `[(ngModel)]`, `[formControl]`, or `formControlName`.

## API

### `DropdownListComponent`

**Selector:** `mona-dropdown-list`

#### Inputs

| Name              | Type                                                 | Default     | Description                                                                                                                                                                             |
|-------------------|------------------------------------------------------|-------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `ariaLabel`       | `string`                                             | `""`        | Accessible name for the host element. Falls back to `placeholder` when empty.                                                                                                           |
| `ariaLabelledBy`  | `string`                                             | `""`        | ID of an external element that provides the accessible name for the host element.                                                                                                       |
| `data`            | `Iterable<TData>`                                    | `[]`        | Collection of items to render.                                                                                                                                                          |
| `disabled`        | `boolean`                                            | `false`     | Two-way bindable. Renders the component with reduced visual emphasis and removes pointer interaction.                                                                                   |
| `invalid`         | `boolean`                                            | `false`     | Marks the field as invalid. Set automatically by `[formField]`.                                                                                                                         |
| `itemDisabled`    | `DropdownFieldPredicateType<TData>`                  | `undefined` | Predicate or field name used to determine whether an individual item is disabled.                                                                                                       |
| `loading`         | `boolean`                                            | `false`     | Displays a loading indicator and prevents interaction while an operation is in progress.                                                                                                |
| `placeholder`     | `string`                                             | `""`        | Placeholder text shown when no value is selected.                                                                                                                                       |
| `popupClass`      | `string`                                             | `""`        | Additional CSS classes applied to the popup element.                                                                                                                                    |
| `popupHeight`     | `ListSizeInputType`                                  | `null`      | Height of the popup element.                                                                                                                                                            |
| `popupWidth`      | `ListSizeInputType`                                  | `null`      | Width of the popup element.                                                                                                                                                             |
| `readonly`        | `boolean`                                            | `false`     | Prevents value changes while preserving the component's visual state.                                                                                                                   |
| `required`        | `boolean`                                            | `false`     | Marks the field as required for form validation.                                                                                                                                        |
| `rounded`         | `"none" \| "small" \| "medium" \| "large" \| "full"` | `"medium"`  | Border-radius preset applied to the component.                                                                                                                                          |
| `showClearButton` | `boolean`                                            | `false`     | Shows a clear button that resets the selected value when clicked.                                                                                                                       |
| `size`            | `"small" \| "medium" \| "large"`                     | `"medium"`  | Size preset controlling the component's dimensions.                                                                                                                                     |
| `textField`       | `DropdownFieldSelectorType<TData>`                   | `undefined` | Property name or accessor used to derive the display text from a data item. Uses the item itself when omitted.                                                                          |
| `touched`         | `boolean`                                            | `false`     | Marks the control as touched. Set automatically by `[formField]`.                                                                                                                       |
| `class`           | `string`                                             | `""`        | Additional CSS classes merged onto the host element via `tailwind-merge`.                                                                                                               |
| `value`           | `TData \| null`                                      | `null`      | Two-way bindable, and compatible with Signal Forms via `[formField]`. Currently selected value; holds the primitive field value instead of the full data item when `valueField` is set. |
| `valueField`      | `DropdownFieldSelectorType<TData>`                   | `undefined` | Property name or accessor used to derive the value from a data item. Uses the item itself when omitted.                                                                                 |

#### Outputs

| Name     | Type               | Description                                                                                                                    |
|----------|--------------------|--------------------------------------------------------------------------------------------------------------------------------|
| `close`  | `PopupCloseEvent`  | Emitted when the popup is about to close. Cancelable.                                                                          |
| `closed` | `void`             | Emitted after the popup closes.                                                                                                |
| `open`   | `PreventableEvent` | Emitted when the popup is about to open. Cancelable.                                                                           |
| `opened` | `void`             | Emitted after the popup opens.                                                                                                 |
| `touch`  | `void`             | Emitted when the control is interacted with via blur, selection, or clear. Used by `[formField]` to mark the field as touched. |

---

### `DropdownFilterableDirective<TData>`

**Selector:** `mona-dropdown-list[monaDropDownFilterable]`

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

**Selector:** `mona-dropdown-list[monaDropDownGroupable]`

#### Inputs

| Name                    | Type                                                  | Default | Description                                                                                                                                                                    |
|-------------------------|-------------------------------------------------------|---------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `groupBy`               | `string \| ((item: TData) => R) \| null \| undefined` | `""`    | Property name, or accessor, used to derive an option's group.                                                                                                                  |
| `monaDropDownGroupable` | `GroupableOptions<TData, R> \| ""`                    | `""`    | Group header order, and optional per-group item ordering. An empty string enables grouping with default settings (`headerOrder: "asc"`); pass an object to override any field. |

No outputs.

---

### `DropdownVirtualScrollDirective<TData>`

**Selector:** `mona-dropdown-list[monaDropDownVirtualScroll]`

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
- [x] DropdownListComponent inputs/outputs/defaults verified against dropdown-list.component.ts source and cross-checked against component-metadata.json's DropdownListComponent entry (all 25 members matched: ariaLabel, ariaLabelledBy, data, disabled(model), invalid, itemDisabled, loading, placeholder, popupClass, popupHeight, popupWidth, readonly, required, rounded, showClearButton, size, textField, touched, userClass(class), value(model), valueField, close, closed, open, opened, touch)
- [x] Three behavior directives (Filterable, Groupable, VirtualScroll) inputs/outputs and default option objects verified against dropdown-filterable.directive.ts, dropdown-groupable.directive.ts, dropdown-virtual-scroll.directive.ts
- [x] Seven structural template directives and their selectors verified against dropdowns/directives/*-template.directive.ts and dropdowns/dropdown-list/directives/dropdown-list-value-template.directive.ts; template contexts verified against dropdown-list.component.html's ngTemplateOutletContext bindings
- [x] Keyboard map (ArrowDown/ArrowUp/Alt+ArrowDown/Alt+ArrowUp/Home/End/Enter/Space/Escape/Tab/typeahead) verified against dropdown-list-popup-handler.directive.ts (handleKeyDown/handleArrowKeys) and dropdown-list.component.ts (setKeydownSubscription/handleEnterKey/handleHomeEndKeys)
- [x] Staged-vs-committed value behavior verified against dropdown-list.component.ts's #navigatedValue linkedSignal, setArrowKeyNavigationSubscription, and setPopupCloseSubscriptions
- [x] Single Tab-stop focus behavior verified against dropdown-list-popup-handler.directive.ts's keydown listener bound to the host element (not to popup items) plus list-item.directive.ts's rovingTabIndex (roving -1 on all items since the combobox never delegates DOM focus into the popup)
- [x] ARIA attributes verified against dropdown-list.component.ts's host object bindings
- [x] Form integration verified: DropdownListComponent implements FormValueControl<TData | null> (dropdown-list.component.ts class declaration); no NG_VALUE_ACCESSOR provider or writeValue/registerOnChange/registerOnTouched methods found
- [x] FilterableOptions, GroupableOptions, VirtualScrollOptions, PopupCloseEvent, PreventableEvent, FilterChangeEvent confirmed exported via lib/index.ts; DropdownFieldSelectorType, DropdownFieldPredicateType, ListSizeInputType confirmed NOT exported
- [x] hostDirectives (DropdownDataHandlerDirective, DropdownListPopupHandlerDirective) confirmed to expose no public inputs/outputs of their own — omitted from API tables
- [x] No internal-only symbols (ListService, DropdownService, DropdownListService, monaDropdownLiveRegion, indicator-icon presets, Tailwind class names) documented as public API
-->
