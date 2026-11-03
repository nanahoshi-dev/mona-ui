# Mona UI Dropdowns

Four components let the user pick from a list in a popup. They share the data, filtering, grouping, virtual scroll and template features described here.

| Component              | Entry point                        | Value         | Use it when                                                                                                |
| ---------------------- | ---------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------- |
| `<mona-dropdown-list>` | `@nanahoshi/mona-ui/dropdown-list` | one item      | the user must pick one of a known set, and typing isn't needed                                             |
| `<mona-combo-box>`     | `@nanahoshi/mona-ui/combo-box`     | one item      | the list is long enough that typing to find an item helps, or new values may be added (`allowCustomValue`) |
| `<mona-auto-complete>` | `@nanahoshi/mona-ui/auto-complete` | free text     | the value is text, and the list only offers suggestions                                                    |
| `<mona-multi-select>`  | `@nanahoshi/mona-ui/multi-select`  | several items | the user picks any number of items, shown as chips                                                         |

dropdown-list and multi-select are `role="combobox"` elements themselves. combo-box and auto-complete wrap an `<input role="combobox">`, so their focus, label and state live on the inner input.

---

## 1. Data and Values

```typescript
import { Component, signal } from "@angular/core";
import { DropdownListComponent } from "@nanahoshi/mona-ui/dropdown-list";

interface Country {
    code: string;
    name: string;
}

@Component({
    selector: "app-shipping",
    imports: [DropdownListComponent],
    template: `
        <span id="country-label">Country</span>
        <mona-dropdown-list
            aria-labelledby="country-label"
            textField="name"
            valueField="code"
            [data]="countries"
            [(value)]="country"></mona-dropdown-list>
    `
})
export class ShippingComponent {
    protected readonly countries: Country[] = [
        { code: "JP", name: "Japan" },
        { code: "TR", name: "Türkiye" }
    ];
    protected readonly country = signal<Country | null>(null);
}
```

- `data` takes any iterable. Plain strings or numbers work without `textField` and `valueField`.
- `textField` is the property (or a function) that gives an item's text. `valueField` gives its identity, used to match a `value` you set to an item in `data`. It should be a stable, unique scalar, so objects that are recreated (after a refetch, say) still match.
- By default `value` is the whole item (the `Country` above). With `valuePrimitive`, it's the `valueField` result instead (`'JP'`). multi-select's value is an iterable of either.
- auto-complete's value is always the text in the field (`string | null`). `textField` only decides what the suggestions show.
- `itemDisabled` (a property name or a predicate) disables individual items.

`null` means nothing is selected. A primitive `0` or `false` is a real value, not "empty".

---

## 2. Labelling

**combo-box and auto-complete** work like a text box: set `inputId` and point `<label for>` or `<mona-label for>` at it.

```html
<mona-label for="food" text="Favourite food"></mona-label>
<mona-combo-box inputId="food" textField="name" [data]="foods"></mona-combo-box>
```

**dropdown-list and multi-select** can't be named by `<label for>`, because a custom element isn't a labelable element. Use `aria-labelledby` with the id of the visible label, or `aria-label` when there's no visible text:

```html
<span id="tags-label">Tags</span> <mona-multi-select aria-labelledby="tags-label" [data]="tags"></mona-multi-select>
```

- All four take `aria-describedby` for hints and error messages.
- Without a label, dropdown-list and multi-select fall back to their `placeholder` as the name. combo-box and auto-complete leave that to the browser, which uses the input's placeholder. A placeholder disappears once there's a value, so it's a poor label; treat the fallback as a safety net.
- multi-select shows its `placeholder` while nothing is selected.

---

## 3. Forms

All four implement Angular's `FormValueControl`, so `[formField]` works directly. `[(ngModel)]` and `[formControl]` work too.

```typescript
import { form, FormField, required } from "@angular/forms/signals";

@Component({
    imports: [ComboBoxComponent, FormField, LabelComponent],
    template: `
        <mona-label for="city" text="City"></mona-label>
        <mona-combo-box inputId="city" textField="name" [data]="cities" [formField]="address.city"></mona-combo-box>
    `
})
export class AddressComponent {
    readonly #model = signal<{ city: City | null }>({ city: null });
    protected readonly address = form(this.#model, schema => required(schema.city));
}
```

- `[formField]` writes `disabled`, `readonly`, `required`, `invalid` and `touched`. Don't bind those yourself on the same element.
- The field is marked **touched when focus leaves the component**, as with a native input. Moving between the field, its clear button, its chips and its popup doesn't count, and neither does picking an option. An error gated on `touched` therefore doesn't appear while the user is still choosing.
- The invalid look (and `aria-invalid`) appears once the field is touched: when `invalid` is set, or when `required` is set and nothing is selected.
- Boolean inputs accept the bare attribute form: `<mona-dropdown-list disabled required>`.

What leaving the field does to typed text:

- **combo-box** settles it. Text that matches an item (ignoring case) selects it. Empty text clears the value. Other text is passed to `(valueAdd)` when `allowCustomValue` is on; otherwise the selected item's text comes back. The field never shows text that isn't its value.
- **auto-complete** commits the text as the value.

---

## 4. Keyboard

| Key                              | dropdown-list                                                    | combo-box                                                | auto-complete                   | multi-select                           |
| -------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------- | -------------------------------------- |
| <kbd>↓</kbd> / <kbd>↑</kbd>      | closed: change the value; open: move through the options         | move through the options                                 | move through the suggestions    | move through the options               |
| <kbd>Alt</kbd>+<kbd>↓</kbd>      | open                                                             | open                                                     | open                            | open                                   |
| <kbd>Alt</kbd>+<kbd>↑</kbd>      | commit and close                                                 | close                                                    | close                           | close                                  |
| <kbd>Enter</kbd>                 | open, or commit and close                                        | select the highlighted item or the typed text            | pick the highlighted suggestion | open, or toggle the highlighted option |
| <kbd>Space</kbd>                 | open, or commit and close; part of the search while typing ahead | types a space                                            | types a space                   | open, or toggle the highlighted option |
| <kbd>Esc</kbd>                   | close without changing the value                                 | open: restore the selected text and close; closed: clear | open: close; closed: clear      | close                                  |
| <kbd>Tab</kbd>                   | commit the highlighted option and move on                        | settle the text and move on                              | commit the text and move on     | close and move on                      |
| <kbd>Home</kbd> / <kbd>End</kbd> | first / last option                                              | caret                                                    | caret                           | —                                      |
| letters                          | type ahead to the matching option                                | filter or highlight                                      | filter or highlight             | —                                      |
| <kbd>Backspace</kbd>             | —                                                                | edits                                                    | edits                           | remove the last chip                   |

- An outside click or a page scroll that closes a dropdown-list popup doesn't change the value either.
- An <kbd>Esc</kbd> that clears a combo-box or auto-complete stays with the field. An <kbd>Esc</kbd> with nothing to clear or close reaches the dialog or window around the field, so it closes that.
- Keys pressed while an IME is composing (Japanese, Chinese or Korean input, including the <kbd>Enter</kbd> that confirms a conversion) are left to the IME.
- The clear button is in the tab order after the field and clears on <kbd>Enter</kbd> or <kbd>Space</kbd>.

---

## 5. Clear Button and Loading

- `showClearButton` shows a button that clears the value and keeps focus in the field. It defaults to `false`, except on auto-complete, where it defaults to `true`. It's never shown on a disabled or read-only field, or while `loading`.
- `loading` shows a spinner in place of the clear button and sets `aria-busy`. It doesn't block the field: the user can keep typing or choosing while data loads.

---

## 6. Filtering

Add `monaDropDownFilterable` to filter the list as the user types. dropdown-list and multi-select get a filter box at the top of the popup; combo-box and auto-complete filter by what's typed into the field.

```html
<mona-dropdown-list
    aria-label="Timezone"
    [data]="timezones"
    [monaDropDownFilterable]="{ operator: 'contains', debounce: 150 }"
    filterPlaceholder="Search timezones"></mona-dropdown-list>
```

- Options (all optional): `operator` (`'contains'` by default, `'startsWith'`, `'endsWith'` or a `(text, filter) => boolean` function), `caseSensitive` (`false`), `debounce` in milliseconds (`0`) and `enabled`.
- `(filterChange)` emits a `FilterChangeEvent` with the text. Call `event.preventDefault()` to filter on the server instead: the list is left alone, and you replace `data` with the results.
- When the popup is open, the number of results is announced to screen readers after each change ("3 results available", "No results found"), whether the list was filtered in place or `data` was replaced.

---

## 7. Grouping and Virtual Scroll

```html
<mona-combo-box
    inputId="food"
    textField="name"
    [data]="foods"
    groupBy="category"
    [monaDropDownGroupable]="{ headerOrder: 'asc', orderBy: 'name' }"
    [monaDropDownVirtualScroll]="{ height: 32 }"></mona-combo-box>
```

- `monaDropDownGroupable` groups items by `groupBy` (a property name or a function). `headerOrder` sorts the groups, `orderBy` and `orderByDirection` sort the items in each group.
- `monaDropDownVirtualScroll` renders only the visible rows. Use it for lists of more than a few hundred items. `height` is the row height in pixels (`28` by default) and must match the rendered row, including any item template.

---

## 8. Templates

Put an `ng-template` with one of these attributes inside the component:

| Template                            | Context                                                  | Where it appears                                  |
| ----------------------------------- | -------------------------------------------------------- | ------------------------------------------------- |
| `monaDropDownItemTemplate`          | `let-item` (the data item)                               | each option                                       |
| `monaDropDownGroupHeaderTemplate`   | `let-group` (the group key)                              | each group header                                 |
| `monaDropDownHeaderTemplate`        | —                                                        | above the list                                    |
| `monaDropDownFooterTemplate`        | —                                                        | below the list                                    |
| `monaDropDownNoDataTemplate`        | —                                                        | in place of an empty list                         |
| `monaDropdownPrefixTemplate`        | —                                                        | inside the field, before the value                |
| `monaDropdownSuffixTemplate`        | —                                                        | inside the field, after the value (auto-complete) |
| `monaDropDownListValueTemplate`     | `let-item` (the selected item)                           | dropdown-list's displayed value                   |
| `monaMultiSelectTagTemplate`        | `let-item`                                               | each multi-select chip                            |
| `monaMultiSelectSummaryTagTemplate` | `let-items` (all selected items), `let-shown="tagCount"` | the summary chip                                  |

```html
<mona-multi-select aria-label="Assignees" textField="name" [data]="people" [monaMultiSelectSummaryTag]="2">
    <ng-template monaDropDownItemTemplate let-person>
        <img [src]="person.avatar" alt="" class="size-5 rounded-full" />
        <span>{{ person.name }}</span>
    </ng-template>
</mona-multi-select>
```

- `[monaMultiSelectSummaryTag]="n"` shows the first `n` chips and collapses the rest into one summary chip. Its remove button removes all the hidden items.
- Each chip's remove button is labelled from the item's text ("Remove, Ada"), so a tag template doesn't need to add one.
- Images and icons in templates are usually decorative: give them `alt=""` or `aria-hidden="true"`. The option's accessible name comes from its text.

---

## 9. Popup

- `popupWidth` sets the popup's width. By default it matches the field.
- `popupHeight` caps the popup's height, in pixels or as a CSS length. Shorter lists shrink to fit. Without it, the popup is at most 200 pixels tall.
- `popupClass` adds classes to the popup.
- `(open)` and `(close)` fire before the popup opens or closes, and can be cancelled with `preventDefault()`. `(opened)` and `(closed)` fire once the animation has finished. `(close)` carries a `PopupCloseEvent` whose `via` says why it closed (`PopupCloseSource.Escape`, `.OutsideClick`, `.Programmatic`, …).
- `focus(options?)` moves focus to the field (the inner input on combo-box and auto-complete, with the caret at the end). `options` go to the native call, for example `{ preventScroll: true }`.
