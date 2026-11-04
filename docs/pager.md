# Mona UI Pager

`<mona-pager>` (from `@nanahoshi/mona-ui/pager`) moves through a collection one page at a time. It doesn't hold or slice the data: it tracks `skip`, `pageSize` and `total`, and you show the page they describe. The grid uses it as its pager. The [pager reference](../projects/mona-ui-tester/src/assets/docs/pager/api.md) lists every input, output and template.

---

## 1. Paging a List

```typescript
import { Component, computed, signal } from "@angular/core";
import { PagerComponent } from "@nanahoshi/mona-ui/pager";

interface SearchResult {
    id: number;
    title: string;
}

@Component({
    selector: "app-search-results",
    imports: [PagerComponent],
    template: `
        <ul>
            @for (result of pageResults(); track result.id) {
                <li>{{ result.title }}</li>
            }
        </ul>
        <mona-pager
            aria-label="Search result pages"
            [total]="results().length"
            [(skip)]="skip"
            [(pageSize)]="pageSize"></mona-pager>
    `
})
export class SearchResultsComponent {
    protected readonly pageSize = signal(10);
    protected readonly results = signal<SearchResult[]>([]);
    protected readonly skip = signal(0);
    protected readonly pageResults = computed(() => this.results().slice(this.skip(), this.skip() + this.pageSize()));
}
```

- `total` is the number of items in the whole collection.
- `skip` is the number of items before the current page (0 on the first page). `pageSize` is the number of items per page, 5 by default.
- Both are two-way models, so `[(skip)]` and `[(pageSize)]` keep your signals in step with the pager.
- `pageSize` values below 1 count as 1; `skip` and `total` values below 0 count as 0.

---

## 2. Reacting to Page Changes

To load each page from a server, handle `pageChange`:

```html
<mona-pager [total]="total()" [pageSize]="20" [(skip)]="skip" (pageChange)="load($event)"></mona-pager>
```

```typescript
protected load(event: PageChangeEvent): void {
    // event.page is 1-based; event.skip and event.take describe the request.
    void this.loadPage(event.skip, event.take);
}
```

`pageChange` carries a `PageChangeEvent` (`page`, `skip`, `take`). It fires:

- when the user changes the page: a page or navigation button, the page dropdown, the page input, or a keyboard shortcut;
- when the user changes the page size;
- when the pager corrects `skip`.

It doesn't fire when the pager is created, or when you set `skip` or `pageSize` from code to a valid page. Load the first page yourself.

**Corrections.** A `skip` that isn't the start of a page is moved to the start of the page that holds it. A `skip` past the last page (the total shrank, or a stale offset came back from the server) moves to the last page. The correction updates `[(skip)]` and fires `pageChange`, so a server-backed list reloads the right page.

---

## 3. Page Sizes

```html
<mona-pager
    [total]="total()"
    [(pageSize)]="pageSize"
    [pageSizeValues]="[10, 25, 50]"
    (pageSizeSelect)="confirm($event)"></mona-pager>
```

```typescript
protected confirm(event: PageSizeChangeEvent): void {
    if (this.hasUnsavedChanges()) {
        event.preventDefault();
    }
}
```

- `pageSizeValues` lists the sizes in the page-size dropdown. The default is `[5, 10, 20, 50, 100]`; `true` uses the default, and `false` or `[]` hides the dropdown.
- A new page size keeps the first item of the current page in view. At `skip` 40 with 10 per page, choosing 20 gives `skip` 40 (page 3).
- `pageSizeSelect` fires when the user picks a size, before it's applied. Call `preventDefault()` on its `PageSizeChangeEvent` (`newPageSize`, `oldPageSize`) to keep the current size. `pageSizeChange` and `pageChange` only fire for a change that went through.

---

## 4. Modes and Responsive Layout

- `type="numeric"` (the default) shows page buttons. The first and last page are always shown, with `visiblePages` (5 by default) pages around the current one; longer gaps become jump buttons. `pageInput` adds a box for typing a page number.
- `type="input"` shows "Page [box] of 12" instead of page buttons, and no page-size dropdown. The words around the box come from the locale, so their order follows the language.
- `firstLast` and `previousNext` (both on by default) show the first/last and previous/next buttons. `showInfo` (on) shows the range ("11 - 20 of 100 items").
- **Responsive mode.** With `responsive` on (the default), a pager narrower than 480 pixels replaces its page buttons, or its page box, with a page dropdown. It also shows the page-size dropdown, in `type="input"` mode too, and leaves out the `pageInput` box. Turn `responsive` off to keep the buttons at every width.
- On narrow hosts the sections wrap onto more lines rather than being hidden.

---

## 5. Inside the Grid

`<mona-grid>` draws its own pager, so you don't add `<mona-pager>` to it. Set the paging on the grid:

```html
<mona-grid
    ariaLabel="Orders"
    [data]="orders()"
    [(skip)]="skip"
    [(pageSize)]="pageSize"
    [pageSizeValues]="[10, 25, 50]"
    [responsivePager]="false"
    (pageChange)="onPageChange($event)"></mona-grid>
```

| Grid input        | Pager behavior                                                                                  |
| ----------------- | ----------------------------------------------------------------------------------------------- |
| `[(skip)]`        | The current page, as rows before it.                                                            |
| `[(pageSize)]`    | Rows per page; 10 when you don't set it.                                                        |
| `pageSizeValues`  | The page-size dropdown. It's empty by default, so the grid's pager shows no page-size dropdown. |
| `responsivePager` | The pager's `responsive` mode; on by default.                                                   |

- The grid's pager always has a page input, and its `total` is the number of rows after filtering (or the server's `total` with `monaGridServerBinding`).
- The grid's `pageChange` fires for the same user changes as the pager's, and also when the rows shrink below the current page and the grid moves back to the last page.
- The pager is hidden while the grid has no rows (except with server binding) and with virtual scrolling.
- For server paging, see the server binding section of the [grid guide](grid.md).

---

## 6. Labelling

The pager is a `navigation` landmark named "Pagination". When a page has more than one pager, name each one with `aria-label`, or point `aria-labelledby` at a visible heading (it wins over `aria-label`):

```html
<h2 id="results-heading">Results</h2>
<mona-pager aria-labelledby="results-heading" [total]="total()" [(skip)]="skip"></mona-pager>
```

- Every button has a name: "First page", "Previous page", "Next page", "Last page", "Page 4", and "Jump forward 5 pages" for a jump button. The current page button has `aria-current="page"`.
- The page-size dropdown is named "Items per page", the page dropdown and the page input "Page". In `type="input"` mode the box is named by the words around it ("Page" … "of 12").
- After each user change, a polite live region announces the new range ("11 - 20 of 100 items"). Changes you make from code stay silent.
- A replacement button from `monaPagerNavigationButtonsTemplate` or `monaPagerNumericButtonsTemplate` doesn't get these names; give your markup its own.

The labels come from the `pager` message namespace. Override them through i18n (see the i18n guide):

```typescript
provideMonaI18n({
    messages: {
        pager: { pagerLabel: "Pages", itemsPerPageLabel: "Rows per page" }
    }
});
```

| Key                                                                     | Used for                                                  |
| ----------------------------------------------------------------------- | --------------------------------------------------------- |
| `pagerLabel`                                                            | the landmark's name, when no `aria-label` is set          |
| `firstPageLabel`, `previousPageLabel`, `nextPageLabel`, `lastPageLabel` | the navigation buttons                                    |
| `pageLabel`, `jumpBackwardLabel`, `jumpForwardLabel`                    | page buttons and jump buttons                             |
| `itemsPerPageLabel`, `pageSizeLabel`                                    | the page-size dropdown's name and its value ("10 / page") |
| `pageSelectLabel`                                                       | the page dropdown and the page input                      |
| `pageInputPrefix`, `pageInputSuffix`                                    | the words around the box in `type="input"` mode           |
| `rangeStatus`                                                           | the range summary and its announcement                    |

The full list is in `PAGER_DEFAULT_MESSAGES`, exported from `@nanahoshi/mona-ui/pager`.

---

## 7. Keyboard

The pager's buttons, dropdowns and input are ordinary Tab stops. The pager itself isn't a Tab stop and never traps <kbd>Tab</kbd>. While a pager button has focus:

| Key                  | Action                                             |
| -------------------- | -------------------------------------------------- |
| <kbd>Home</kbd>      | first page                                         |
| <kbd>End</kbd>       | last page                                          |
| <kbd>Page Up</kbd>   | previous page                                      |
| <kbd>Page Down</kbd> | next page                                          |
| <kbd>←</kbd>         | previous page (next page in right-to-left layouts) |
| <kbd>→</kbd>         | next page (previous page in right-to-left layouts) |

- Set `[navigable]="false"` to keep only the buttons' native behavior.
- In the page input, <kbd>Enter</kbd> goes to the typed page (not while an IME is composing), and <kbd>Home</kbd> and <kbd>End</kbd> move the caret. Leaving the input also goes to the typed page; a number out of range is clamped.
- When the focused button is disabled or removed (Next on the last page, a jump button that is no longer needed), focus moves to the current page button.
