# Mona UI List View

`<mona-list-view>` (from `@nanahoshi/mona-ui/list-view`) shows a flat collection with optional selection, grouping, paging, infinite scroll and virtual scrolling. Each feature is a directive you add to the element.

Its role follows what the user can do with it:

| Use                                                        | Role                                         |
| ---------------------------------------------------------- | -------------------------------------------- |
| items that are only shown, or opened with a click or Enter | `list` of `listitem`s (the default)          |
| items the user selects (`monaListViewSelectable`)          | `listbox` of `option`s, with `aria-selected` |
| items the user reorders or moves between two lists         | `<mona-list-box>` ([guide](list-box.md))     |
| a hierarchy                                                | `<mona-tree-view>` ([guide](tree-view.md))   |

A non-selectable list has no `aria-selected` or `aria-disabled` on its items, so screen readers don't offer choices that do nothing.

---

## 1. Items

```typescript
import { Component, signal } from "@angular/core";
import { ListViewComponent } from "@nanahoshi/mona-ui/list-view";

interface Article {
    id: number;
    title: string;
    archived: boolean;
}

@Component({
    selector: "app-articles",
    imports: [ListViewComponent],
    template: `
        <mona-list-view
            aria-label="Articles"
            textField="title"
            disabledBy="archived"
            [items]="articles()"
            [height]="320"
            (itemActivate)="open($event)"></mona-list-view>
    `
})
export class ArticlesComponent {
    protected readonly articles = signal<Article[]>([]);

    protected open(article: Article): void {
        // Navigate to the article.
    }
}
```

- `items` takes any iterable and is rendered as given: equal items (two `"a"` strings) both appear.
- `textField` is the property (or a function) that gives an item's text. Plain strings and numbers need none.
- `disabledBy` is a property name or a predicate. Disabled items can't be selected, activated or reached by arrows or typeahead.
- `(itemActivate)` fires with the data item when the user clicks an enabled item or presses <kbd>Enter</kbd> on it, whether or not the list is selectable.
- `width`, `height`, `maxWidth` and `maxHeight` take pixels or a CSS length. `width` and `height` are `100%` by default.
- `loading` sets `aria-busy` on the list and announces "Loading" through a polite status. An empty list's status reads "No data".

---

## 2. Labelling

Name the list with `aria-label`, or point `aria-labelledby` at a visible heading (it wins over `aria-label`):

```html
<h2 id="inbox-heading">Inbox</h2>
<mona-list-view aria-labelledby="inbox-heading" textField="subject" [items]="messages()"></mona-list-view>
```

- Both are inputs that move the name to the inner `list` or `listbox` element; the host keeps no ARIA attributes.
- An empty list keeps its named list element as its Tab stop, described by the "No data" text (or your no-data template).
- A paged list's pager is named "{name} pagination" from `aria-label`, so two paged lists on a page have different landmarks. Set `pagerAriaLabel` to name it yourself; with only `aria-labelledby`, the pager keeps its own default name.

---

## 3. Selection

```html
<mona-list-view
    aria-label="Recipients"
    textField="name"
    [items]="people()"
    [monaListViewSelectable]="{ mode: 'multiple' }"
    selectBy="id"
    [(selectedKeys)]="recipientIds"></mona-list-view>
```

- `monaListViewSelectable` makes the list a `listbox`. Options: `mode` (`"single"` by default, or `"multiple"`) and `toggleable` (single mode: clicking the selected item deselects it; `false` by default). Multiple mode adds `aria-multiselectable="true"`.
- `selectBy` is the property (or function) that gives an item's key. Without it, the key is the item itself. Use a stable scalar such as an id, so the selection survives a refetch.
- `[(selectedKeys)]` holds the selected keys. **`selectedKeysChange` fires only for the user's changes**: a click, <kbd>Enter</kbd>, <kbd>Space</kbd>, <kbd>Ctrl</kbd>+<kbd>A</kbd>, or an arrow key or typeahead that selects (see Navigation). Keys you set from code aren't reported back.
- In multiple mode a click toggles one item. In single mode, a click or <kbd>Enter</kbd> selects the item.

---

## 4. Navigation

Arrow keys, <kbd>Home</kbd>, <kbd>End</kbd> and typeahead work without any directive. `monaListViewNavigable` changes how they behave:

```html
<mona-list-view
    aria-label="Themes"
    [items]="themes"
    monaListViewSelectable
    [monaListViewNavigable]="{ mode: 'highlight', wrap: true }"></mona-list-view>
```

- `mode: "select"` (the default) makes the selection follow the arrow keys and typeahead in single selection mode. `mode: "highlight"` only moves focus; the user selects with <kbd>Enter</kbd> or a click.
- In multiple mode the arrow keys and typeahead always just move focus; <kbd>Space</kbd> toggles.
- `wrap` (`false` by default) moves from the last item to the first and back.
- `[monaListViewNavigable]="{ enabled: false }"` turns the keys off. Only one item can then be reached from the keyboard, so keep it on unless the items hold their own controls.

---

## 5. Grouping

```html
<mona-list-view
    aria-label="Contacts"
    textField="name"
    [items]="contacts()"
    groupBy="company"
    [monaListViewGroupable]="{ headerOrder: 'asc', orderBy: 'name' }"></mona-list-view>
```

- `groupBy` is a property name or a function. Dates group by their time, so two `Date` objects for the same moment share a group.
- Options: `headerOrder` (`"asc"` or `"desc"`) sorts the groups; `orderBy` and `orderByDirection` sort the items in each group; `headerText` (a `(value) => string` function) writes the header text. By default dates use the locale's medium date format and numbers the locale's digits.
- Without virtual scrolling, each group is nested and named by its header: a `group` inside a listbox, a nested `list` inside a list. A virtual list stays flat, and each item is described by its header (`aria-describedby`).

---

## 6. Paging

```html
<mona-list-view
    aria-label="Orders"
    textField="number"
    [items]="orders()"
    [monaListViewPageable]="{ pageSize: 20, showInfo: true }"
    [(page)]="page"
    [(pageSize)]="pageSize"
    (pageSizeSelect)="confirmPageSize($event)"></mona-list-view>
```

- `monaListViewPageable` slices `items` into pages and shows a `<mona-pager>` below the list (see the [pager guide](pager.md)). Options and defaults: `pageSize` (10), `pageSizeValues` (`[5, 10, 20, 25, 50, 100]`), `type` (`"numeric"` or `"input"`), `visiblePages` (5), `previousNext` (`true`), `firstLast` (`false`) and `showInfo` (`false`). The pager isn't responsive.
- `[(page)]` is the 1-based page. **`pageChange` fires when the user changes the page, not when you set `[page]` from code.**
- `[(pageSize)]` overrides the options' `pageSize`; it updates when the user picks a size. A new size keeps the first item of the current page in view.
- `(pageSizeSelect)` fires when the user picks a size, before it applies. Call `preventDefault()` to keep the current size.
- The pager is hidden while the list is empty and with virtual scrolling.
- Items report their position in the whole list (`aria-posinset`, `aria-setsize`), not in the page. <kbd>Ctrl</kbd>+<kbd>A</kbd> selects the items on the current page.

---

## 7. Infinite Scroll

```html
<mona-list-view
    aria-label="Activity"
    textField="summary"
    [items]="events()"
    [height]="400"
    [loading]="loading()"
    (scrollBottom)="loadMore()"></mona-list-view>
```

- `(scrollBottom)` fires **once** each time the user scrolls to the end of the list. Scrolling away and back fires again, and so does reaching the new end after more items arrive. It also works with virtual scrolling.
- It doesn't fire on a paged list.
- The list must be able to scroll: give it a `height` or `maxHeight`, or a parent with a fixed height.
- Set `loading` while the next batch loads, so assistive technology hears "Loading" and the list is `aria-busy`.

---

## 8. Virtual Scrolling

```html
<mona-list-view
    aria-label="Cities"
    textField="name"
    [items]="cities"
    [height]="360"
    [monaListViewVirtualScroll]="{ enabled: true, height: 32 }"></mona-list-view>
```

- Virtual scrolling renders only the rows in view. Use it for lists of more than a few hundred items.
- The options are required: `enabled`, and `height`, the row height in pixels (28 by default). It must match the rendered row, including any item template.
- **The viewport takes the list view's `height`.** A pixel height is the safe choice. A percentage (the default `100%`) needs a parent with a definite height, or the viewport collapses. `height=""` sizes the viewport to all its rows, which renders every row and defeats virtualization.
- Paging is off while virtual scrolling is on; group headers stay in the flat list.
- When the item that holds the Tab stop is scrolled out of the rendered rows, the list itself takes the Tab stop and hands focus on to the item.

---

## 9. Templates

| Template                          | Context                         | Where it appears          |
| --------------------------------- | ------------------------------- | ------------------------- |
| `monaListViewItemTemplate`        | `let-item` (the data item)      | each item                 |
| `monaListViewGroupHeaderTemplate` | `let-group` (the group's value) | each group header         |
| `monaListViewHeaderTemplate`      | —                               | above the list            |
| `monaListViewFooterTemplate`      | —                               | below the list            |
| `monaListViewNoDataTemplate`      | —                               | in place of an empty list |

```html
<mona-list-view aria-label="Team" [items]="members()" (itemActivate)="openProfile($event)">
    <ng-template monaListViewItemTemplate let-member>
        <img [ngSrc]="member.avatar" width="24" height="24" alt="" />
        <span>{{ member.name }}</span>
    </ng-template>
</mona-list-view>
```

- Keys pressed in controls inside header, footer and item templates (an input in the header, say) are left to those controls; the list doesn't swallow them.
- An option in a listbox shouldn't contain buttons or links: its name is its whole content, and assistive technology treats it as one choice. For rows with their own controls, use a non-selectable list.
- Give decorative images `alt=""` and icons `aria-hidden="true"`.

---

## 10. Keyboard

The list is one Tab stop: the active item (else the last selected item on the page, else the first enabled one) has `tabindex="0"` and the others `-1`. Items show a solid 2px focus ring.

| Key                                         | Action                                                                              |
| ------------------------------------------- | ----------------------------------------------------------------------------------- |
| <kbd>↓</kbd> / <kbd>↑</kbd>                 | next / previous enabled item; in single selection with `mode: "select"`, selects it |
| <kbd>Home</kbd> / <kbd>End</kbd>            | first / last enabled item (selecting it, as above)                                  |
| <kbd>Page Up</kbd> / <kbd>Page Down</kbd>   | scroll by about a screen                                                            |
| <kbd>Enter</kbd>                            | select the item (when selectable) and fire `itemActivate`                           |
| <kbd>Space</kbd>                            | multiple selection: toggle the item                                                 |
| <kbd>Ctrl</kbd>/<kbd>Cmd</kbd>+<kbd>A</kbd> | multiple selection: select every enabled item in view                               |
| letters                                     | type ahead to the next item whose text starts with the typed text                   |

- The keys are vertical only, so they are the same in right-to-left layouts.
- <kbd>Alt</kbd>+arrow keys are left to the page (and to the list box, which moves items with them).
- An <kbd>Enter</kbd> that confirms an IME composition is ignored.
- When the focused item is removed from `items`, focus moves to the item now at its position (or the last one), instead of dropping to the page.

---

## 11. Localization

The texts come from the `list` message namespace (see the [i18n guide](i18n.md)):

| Key                | Used for                                                              |
| ------------------ | --------------------------------------------------------------------- |
| `loading`          | the status while `loading` is set                                     |
| `noData`           | the empty list's text and status                                      |
| `pagerLabel(list)` | the pager's name, from `aria-label` ("Orders pagination")             |
| `filterList`       | the filter input of the dropdown popups (the list view has no filter) |

The pager's own labels come from the `pager` namespace. The namespace's type is `MonaListMessages`, from `@nanahoshi/mona-ui/i18n`.

```typescript
provideMonaI18n({
    messages: {
        list: { noData: "Nothing here yet", pagerLabel: (list: string) => `Pages of ${list}` }
    }
});
```

---

## 12. Not Supported

- **Range selection.** <kbd>Shift</kbd>+arrow and <kbd>Shift</kbd>+click don't extend the selection; in multiple mode items are toggled one by one (or all at once with <kbd>Ctrl</kbd>+<kbd>A</kbd>).
- **Filtering.** The list view has no filter box; filter `items` yourself.
- **Paging with virtual scrolling** at the same time.
- **Moving items.** Reordering and moving between lists is what `<mona-list-box>` is for.
