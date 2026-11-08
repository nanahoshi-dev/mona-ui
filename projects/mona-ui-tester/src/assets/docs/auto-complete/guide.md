## Overview

Auto Complete renders a real text input. The consumer can type anything; matching options from `data` appear in a popup below the input as suggestions, but the typed text does not have to match one of them. `value` always holds the current text of the input, not a reference to a selected data item.

Suggestion filtering, grouping, and virtual scrolling are opt-in through companion attribute directives applied to the `<mona-auto-complete>` host element, the same pattern used by Dropdown List and List View:

- `monaDropDownFilterable` — narrows the popup's visible options to those matching the typed text, using a configurable operator and case sensitivity.
- `monaDropDownGroupable` — groups options under a header row.
- `monaDropDownVirtualScroll` — renders only the options currently in view.

**Use Auto Complete when:**

- The consumer enters free text, and suggestions help but are not required — any typed value is acceptable.

**Use `DropDownList` instead when:**

- The consumer must pick one of a bounded set of options and free-text entry into the value area is not wanted.

**Use `ComboBox` instead when:**

- Typing should also be possible, but the committed value should still resolve to one of the listed options rather than arbitrary text.

**Use `MultiSelect` instead when:**

- More than one value can be selected at once.

## Import & Quick Start

```typescript
import { AutoCompleteComponent } from "@nanahoshi/mona-ui/auto-complete";
```

```typescript
protected readonly countries = [{ name: "United States" }, { name: "Canada" }, { name: "Mexico" }];
protected readonly countryText = signal<string | null>(null);
```

```html

<mona-auto-complete
    [data]="countries"
    textField="name"
    placeholder="Type a country"
    [(value)]="countryText">
</mona-auto-complete>
```

`textField` accepts a property name or an accessor function used both to render each suggestion's text and to determine what typed text an option "matches." When omitted, the data item itself is used as the display text.

## Anatomy

Each structural directive below is an `ng-template` placed as projected content inside `<mona-auto-complete>...</mona-auto-complete>`. Unlike Dropdown List, there is no value-template directive — the value area is a plain text input, not a rendered data item.

| Directive                              | Selector                                       | Template context                                | Replaces                                                                        |
|----------------------------------------|------------------------------------------------|-------------------------------------------------|---------------------------------------------------------------------------------|
| `DropdownItemTemplateDirective`        | `ng-template[monaDropDownItemTemplate]`        | `{ $implicit: TData }` (the option's data item) | Each option's default text rendering inside the popup                           |
| `DropdownGroupHeaderTemplateDirective` | `ng-template[monaDropDownGroupHeaderTemplate]` | `{ $implicit: group }`                          | The default group header row, when grouping is enabled                          |
| `DropdownHeaderTemplateDirective`      | `ng-template[monaDropDownHeaderTemplate]`      | None                                            | No default — renders above the option list inside the popup                     |
| `DropdownFooterTemplateDirective`      | `ng-template[monaDropDownFooterTemplate]`      | None                                            | No default — renders below the option list inside the popup                     |
| `DropdownNoDataTemplateDirective`      | `ng-template[monaDropDownNoDataTemplate]`      | None                                            | The popup's default empty-state content                                         |
| `DropdownPrefixTemplateDirective`      | `ng-template[monaDropdownPrefixTemplate]`      | None                                            | No default — projected content rendered before the input                        |
| `DropdownSuffixTemplateDirective`      | `ng-template[monaDropdownSuffixTemplate]`      | None                                            | No default — projected content rendered after the input, before the live region |

## Examples

### Filtering the suggestion list

`monaDropDownFilterable` narrows the popup's visible options to those matching the typed text. Without it, the popup shows the full `data` collection while still highlighting the best match — see [Matching without `monaDropDownFilterable`](#matching-without-monadropdownfilterable).

```example
auto-complete/filtering
```

### Grouping

`monaDropDownGroupable` groups options under a header row, driven by `groupBy`.

```example
auto-complete/grouping
```

### Custom templates

The item template replaces each option's text, the prefix template adds content before the input, and the no-data template replaces the empty popup.

```example
auto-complete/templates
```

### Signal Forms integration

Binding `[formField]` synchronizes `value`, `disabled`, `readonly`, `required`, `invalid`, and `touched` with a signal forms field automatically. The field's value type must be `string | null`.

```example
auto-complete/forms
```

### Highlight the first match while typing

`highlightFirst` (default `true`) highlights the first option whose text matches the typed text as the consumer types, so `Enter` can commit it immediately. Set it to `false` to require the consumer to navigate to an option explicitly before `Enter` commits it.

```html

<mona-auto-complete [data]="countries" textField="name" [highlightFirst]="false"></mona-auto-complete>
```

### Disabled, readonly, loading, and required states

`disabled` renders the control with reduced visual emphasis and removes pointer interaction. `readonly` prevents value changes while preserving the visual state. `loading` shows a loading indicator in place of the clear button and prevents interaction while an operation is in progress. `required` marks the field for form validation and affects the invalid state once the control is touched.

```html

<mona-auto-complete
    [data]="countries"
    textField="name"
    [disabled]="isDisabled()"
    [readonly]="isReadonly()"
    [loading]="isLoading()"
    [required]="true">
</mona-auto-complete>
```

### Virtual scrolling

`monaDropDownVirtualScroll` renders only the options currently in view, for large collections. `height` on the options object is the fixed row height, in pixels, used to measure the viewport.

```html

<mona-auto-complete
    [data]="countries"
    textField="name"
    monaDropDownVirtualScroll
    [monaDropDownVirtualScroll]="{ height: 32 }">
</mona-auto-complete>
```

## Behavior

### `value` is always the typed text, not a data item

`value` is typed `string | null` and always reflects the input's text — either what the consumer typed, or the text of a selected option. It never becomes the option's underlying data item or a field derived through `valueField`, even when `textField`/`valueField` are set.

### `valueField`'s effect is unclear

`valueField` is accepted and forwarded to the internal list state, the same as `textField`, but `AutoCompleteComponent` never reads it to shape `value` or to mark an option "selected" the way `DropdownListComponent` does. `TODO(owner-review): confirm whether valueField has any consumer-observable effect on AutoComplete, or whether its description should be corrected/removed for this component.`

### Matching without `monaDropDownFilterable`

Even when `monaDropDownFilterable` is not applied, typing still highlights the best-matching option (when `highlightFirst` is `true`) using a case-insensitive "starts with" comparison against `textField`. The popup's visible option list itself is only narrowed once `monaDropDownFilterable` is applied — without it, all options remain visible regardless of what has been typed.

### Committing and clearing

Blurring the input while the popup is closed commits the typed text as `value`, even without pressing `Enter`. Clearing the input's text (for example by pressing `Escape` when the popup is closed) also clears `value`.

### `open` and `close` are cancelable

`open` and `close` emit event objects with `preventDefault()` and `isDefaultPrevented()`. Calling `preventDefault()` in an `open` handler stops the popup from opening; calling it in a `close` handler stops the popup from closing. `close`'s event object also exposes `via`, describing what triggered the close attempt.

### `DropdownFieldSelectorType`, `DropdownFieldPredicateType`, and `ListSizeInputType` are not exported

`textField`, `valueField`, `itemDisabled`, `popupHeight`, and `popupWidth` are typed with these generic aliases internally, but none of the three types are re-exported from `@nanahoshi/mona-ui`. Inline values (as in the examples above) still type-check structurally; only a standalone typed variable would require an import.
`TODO(owner-review): confirm whether these types should be added to the public barrel export.`

## Forms Integration

`AutoCompleteComponent` implements the signal forms `FormValueControl<string | null>` interface and synchronizes with a field bound through `[formField]` (see [Signal Forms integration](#signal-forms-integration)). It has no `ControlValueAccessor`, but `[(ngModel)]`, `[formControl]` and `formControlName` work too, because Angular binds a control's `value` and `touch` directly when it has no accessor. Prefer `[formField]`, which also hands it `disabled`, `readonly`, `required` and validation state.

## Accessibility

### Keyboard

| Key                     | Action                                                                                                                                                                                                         |
|-------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `ArrowDown` / `ArrowUp` | Highlight the next or previous option. Never commits the value by itself.                                                                                                                                      |
| `Alt+ArrowDown`         | Open the popup.                                                                                                                                                                                                |
| `Alt+ArrowUp`           | Close the popup.                                                                                                                                                                                               |
| `Enter`                 | Commit the highlighted option's text (if any), or the currently typed text otherwise, and close the popup.                                                                                                     |
| `Escape`                | Close the popup if it is open; otherwise clear the typed text.                                                                                                                                                 |
| `Tab`                   | Close the popup.                                                                                                                                                                                               |
| Any other character     | Typed into the input as usual. When `monaDropDownFilterable` is applied, also narrows the popup's visible options — see [Matching without `monaDropDownFilterable`](#matching-without-monadropdownfilterable). |

### Focus

The host element itself is not a Tab stop (`tabindex="-1"`); the inner `<input>` element receives focus and is the actual Tab stop. Arrow-key navigation moves an internal highlighted-option pointer, reflected through `aria-activedescendant` on the input, instead of moving DOM focus into the popup.

### ARIA

| Element      | Attribute               | When present                                                                                   | Value                                             |
|--------------|-------------------------|------------------------------------------------------------------------------------------------|---------------------------------------------------|
| Host element | `aria-disabled`         | `disabled` is `true`                                                                           | `"true"`                                          |
| Host element | `aria-haspopup`         | Always                                                                                         | `"listbox"`                                       |
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

Provide `aria-label` or `aria-labelledby` when `placeholder` does not already identify the input's purpose, or point a `<label for>` or `<mona-label for>` at `inputId`. Provide `aria-describedby` to associate error messages or help text with the input.

The control also renders a visually hidden live region that announces the highlighted option's text and position to screen reader users as the consumer types.

<!-- verification-checklist
- [x] AutoCompleteComponent inputs/outputs/defaults verified against auto-complete.component.ts source and cross-checked against component-metadata.json's AutoCompleteComponent entry (all 26 members matched, including showClearButton defaulting to true, unlike DropdownList's false)
- [x] filterPlaceholder's no-op confirmed against auto-complete.component.ts's initialize() (this.#listService.filterInputVisible.set(false)) and list.service.ts's filterInputVisible signal (defaults true, gates the popup's own filter row)
- [x] Three behavior directives (Filterable, Groupable, VirtualScroll) confirmed applicable to mona-auto-complete via their selector strings in drop-down-filterable/groupable/virtual-scroll.directive.ts
- [x] Seven structural template directives verified against auto-complete.component.ts's contentChild() declarations and auto-complete.component.html's ngTemplateOutletContext bindings; confirmed no value-template directive exists for AutoComplete (value area is a plain <input>, not a rendered template)
- [x] Keyboard map verified against auto-complete.component.ts (setArrowKeyNavigationSubscription, setEnterKeySubscription, setEscapeKeySubscription, setSpaceKeySubscription) and dropdown-list-popup-handler.directive.ts (Tab falls through to the shared default)
- [x] "value is always typed text, never a data item" verified: value is modeled as string | null and only ever set via updateValue(string), never from a TData item
- [x] valueField's lack of effect verified: forwarded to ListService.setValueField via dropdown-data-handler.directive.ts, but ListService only reads valueField inside setSelectedDataItems, which AutoCompleteComponent never calls — flagged as owner-review rather than asserted as behavior
- [x] "Matching without monaDropDownFilterable" verified against list.service.ts's viewItems (filters only when filterText is non-empty) vs. getMatchingFilteredItem (always runs, using filterableOptions.enabled ? configured operator/caseSensitivity : "startsWith"/case-insensitive) and auto-complete.component.ts's setAutoCompleteValueChangeSubscription (setFilter only called when isFilteringEnabled())
- [x] Focus behavior verified: host has [attr.tabindex]="-1"; focus() method explicitly queries and focuses the inner <input>
- [x] ARIA attributes split by element (host div vs. inner input) verified against auto-complete.component.ts's host object and auto-complete.component.html's [attr.*] bindings on the <input>
- [x] Form integration verified: AutoCompleteComponent implements FormValueControl<string | null>; no NG_VALUE_ACCESSOR provider or writeValue/registerOnChange/registerOnTouched methods found; ngModel and formControl still work without one, checked by tests/forms-interop.spec.ts
- [x] FilterableOptions, GroupableOptions, VirtualScrollOptions, PopupCloseEvent, PreventableEvent, FilterChangeEvent confirmed exported via lib/index.ts; DropdownFieldSelectorType, DropdownFieldPredicateType, ListSizeInputType confirmed NOT exported; only AutoCompleteComponent itself (not a value-template directive, since none exists) is exported for this component family
- [x] No internal-only symbols (ListService, DropdownService, monaDropdownLiveRegion, indicator-icon presets, Tailwind class names, data-disabled/data-invalid attributes) documented as public API
-->
