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
import { MultiSelectComponent } from "@nanahoshi/mona-ui/multi-select";
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

`textField` and `valueField` each accept a property name or an accessor function. `valueField` identifies each item for selection matching and, when `valuePrimitive` is enabled, is also what gets read from and written into `value` instead of the full items — see [Primitive value binding](#primitive-value-binding).

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

## Examples

### Checkboxes in the popup

`checkboxes` renders a checkbox next to each option in the popup, in addition to the default selected-state styling. By default the popup stays open after selecting or deselecting an item, so the consumer can pick several options in a row. `monaDropDownFilterable` adds a filter input inside the popup.

```example
multi-select/checkboxes
```

### Collapsing tags into a summary

Apply `monaMultiSelectSummaryTag` to collapse tags beyond `tagCount` into a single summary chip (default text: "+N items"). A negative `tagCount` (the default) shows every selected item as its own tag and never renders the summary chip. `monaMultiSelectSummaryTagTemplate` replaces the summary chip's text.

```example
multi-select/summary
```

### Primitive value binding

By default `value` holds the complete selected data items. Set `valuePrimitive` to `true` to have `value` hold an array of the values resolved through `valueField` instead — useful for storing just ids rather than the whole objects. Setting `value` to an array of matching field values (for example, restoring it from a signal forms field) also selects the corresponding items.

```example
multi-select/primitive
```

`valueField` should resolve to a stable, unique scalar; without it, the item itself is used as the value, which naturally supports primitive data such as `["One", "Two", "Three"]`.

### Signal Forms integration

Binding `[formField]` synchronizes `value`, `disabled`, `readonly`, `required`, `invalid`, and `touched` with a signal forms field automatically. Signal Forms' `required` doesn't treat an empty array as missing, so use `minLength(path, 1)` to require a selection.

```example
multi-select/forms
```

### Closing the popup after each selection

Set `autoClose` to `true` to close the popup after each selection instead of keeping it open.

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

`textField`, `valueField`, `itemDisabled`, `popupHeight`, and `popupWidth` are typed with these generic aliases internally, but none of the three types are re-exported from `@nanahoshi/mona-ui`. Inline values (as in the examples above) still type-check structurally; only a standalone typed variable would require an import.
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

`MultiSelectComponent` implements the signal forms `FormValueControl<Iterable<TValue>>` interface (`TValue` defaults to `TData`, or the `valueField` type when `valuePrimitive` is `true`) and synchronizes with a field bound through `[formField]` (see [Signal Forms integration](#signal-forms-integration)). It does not implement `ControlValueAccessor` — there is no `NG_VALUE_ACCESSOR` provider and no `writeValue`/`registerOnChange`/`registerOnTouched` methods — so it cannot be used with `[(ngModel)]`, `[formControl]`, or `formControlName`.

<!-- verification-checklist
- [x] MultiSelectComponent inputs/outputs/defaults verified against multi-select.component.ts source and cross-checked against component-metadata.json's MultiSelectComponent entry (all 28 members matched, including the valuePrimitive input added alongside value/valueField)
- [x] Confirmed no placeholder input exists (absent from both the source's public input list and component-metadata.json), and that aria-label has no fallback (bound directly to ariaLabel(), unlike DropdownList/ComboBox/AutoComplete's effectiveAriaLabel computed)
- [x] MultiSelectSummaryTagDirective and its tagCount input/monaMultiSelectSummaryTagTemplate contentChild verified against multi-select-summary-tag.directive.ts; template context { $implicit, tagCount } verified against multi-select.component.html's ngTemplateOutletContext binding
- [x] MultiSelectTagTemplateDirective verified against multi-select-tag-template.directive.ts and its usage/context in multi-select.component.html
- [x] valuePrimitive and TValue-generic value binding verified against multi-select.component.ts's getSelectedControlValues() (maps each selected item through getDataItemValue when valuePrimitive() else uses item.data) and synchronizeSelection() (setSelectedKeys(value) when valuePrimitive() else setSelectedDataItems(value)); confirmed value-restoration by primitive field array only takes effect when valuePrimitive is true; multi-select.component.spec.ts's dedicated PrimitiveMultiSelectFormModel host ([valuePrimitive]="true", form model { value: [2] }) tests this separately from the default object-mode host ({ value: [FOOD_ITEMS[1]] })
- [x] showClearButton clearing all selections verified against onValueClear() calling updateValue([]) and listService.clearSelections()
- [x] Keyboard map verified: ArrowUp/ArrowDown/Alt+Arrow/Escape/Tab/Space fall through to dropdown-list-popup-handler.directive.ts's shared defaults (not intercepted by MultiSelectComponent, unlike ComboBox/AutoComplete); Enter and Backspace verified against multi-select.component.ts's setEnterKeySubscription/setBackspaceKeySubscription/handleEnterKey; wrap: true verified against initialize()'s setNavigableOptions call
- [x] Focus behavior verified: host has [attr.tabindex]="disabled() ? null : 0" (host itself is the focusable element, unlike ComboBox/AutoComplete's inner <input> pattern); chips have [tabindex]="-1" and [removeTabIndex]="-1" in multi-select.component.html
- [x] ARIA attributes (single-element table, not host/input split) verified against multi-select.component.ts's host object
- [x] Form integration verified: MultiSelectComponent implements FormValueControl<Iterable<TValue>>; no NG_VALUE_ACCESSOR provider or writeValue/registerOnChange/registerOnTouched methods found
- [x] FilterableOptions, GroupableOptions, VirtualScrollOptions, PopupCloseEvent, PreventableEvent, FilterChangeEvent confirmed exported via lib/index.ts; DropdownFieldSelectorType, DropdownFieldPredicateType, ListSizeInputType confirmed NOT exported; MultiSelectComponent, MultiSelectTagTemplateDirective, MultiSelectSummaryTagDirective, MultiSelectSummaryTagTemplateDirective all confirmed exported
- [x] No internal-only symbols (ListService, DropdownService, MultiSelectService, ChipComponent's own internal styling, monaDropdownLiveRegion, indicator-icon presets, Tailwind class names, data-invalid attribute) documented as public API beyond the mona-chip content-projection mention needed to explain tag rendering
-->
