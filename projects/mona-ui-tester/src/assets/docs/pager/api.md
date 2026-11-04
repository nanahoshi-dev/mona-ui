## Overview & Component Selection

Use Pager when a consumer needs to page through a collection that is too large to display in full — grids, lists, or search results. Pager does not fetch, slice, or hold the paged data itself. It tracks `skip`, `total`, and `pageSize`, and emits `pageChange` when the user moves to another page or changes the page size; the consumer loads or slices data in response.

Pager supports two visual modes, selected with the `type` input:

- `"numeric"` (default) — numeric page buttons with optional first/last and previous/next controls.
- `"input"` — a single "Page [input] of N" control instead of numeric buttons. The words around the input come from the locale, so their order follows the language (ja-JP: "10ページ中 [3] ページ").

On narrow hosts the sections wrap onto further lines rather than being hidden. When `responsive` is enabled (the default) and the pager is narrower than 480px, the numeric page buttons are replaced by a page dropdown.

## Import & Quick Start

```typescript
import { PagerComponent } from "@nanahoshi/mona-ui";
import type { PageChangeEvent } from "@nanahoshi/mona-ui";
```

```html
<mona-pager [total]="100" [(pageSize)]="pageSize" [(skip)]="skip" (pageChange)="onPageChange($event)"></mona-pager>
```

```typescript
protected readonly pageSize = signal(10);
protected readonly skip = signal(0);

protected onPageChange(event: PageChangeEvent): void {
    // load or slice data using event.skip and event.take
}
```

## Anatomy & Public Structural Templates

Pager's default first/previous/next/last buttons, numeric page buttons, page-size control, and info summary can each be replaced with a matching `ng-template` directive projected into `<mona-pager>`. Every context includes the pager's state and actions (`PagerContext`): `currentPage`, `start`, `end`, `pageSize`, `pageSizes`, `skip`, `total`, `totalPages`, `goToPage(page)` and `setPageSize(size)`. The directives have context guards, so `let-` variables are typed.

| Directive                                 | Selector                                          | Template context                                                                                                                                                                                                                    |
|-------------------------------------------|---------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `PagerNavigationButtonsTemplateDirective` | `ng-template[monaPagerNavigationButtonsTemplate]` | `NavigationButtonsTemplateContext`: `PagerContext` plus `disabled`, `targetPage` and `navigate()`. Requires a `type` attribute input: `"first" \| "previous" \| "next" \| "last"`, identifying which button it replaces.             |
| `PagerNumericButtonsTemplateDirective`    | `ng-template[monaPagerNumericButtonsTemplate]`    | `NumericButtonsTemplateContext`: `PagerContext` plus `pages`, the page numbers the default buttons would show. Only used when `type` is `"numeric"`. The template renders inside the pager's `<ol>`, so wrap each control in `<li>`. |
| `PagerPageSizeTemplateDirective`          | `ng-template[monaPagerPageSizeTemplate]`          | `PageSizeTemplateContext`: `PagerContext`, with the page-size options as `$implicit`.                                                                                                                                               |
| `PagerInfoTemplateDirective`              | `ng-template[monaPagerInfoTemplate]`              | `InfoTemplateContext`: `PagerContext`.                                                                                                                                                                                              |

## Feature Examples

### Numeric pagination with external state

```html
<mona-pager [total]="total()" [pageSize]="10" [(skip)]="skip" (pageChange)="onPageChange($event)"></mona-pager>
```

### "Page N of M" input mode

```html
<mona-pager [type]="'input'" [total]="100" [pageSize]="10"></mona-pager>
```

### Custom page-size options and page-jump input

```html
<mona-pager [total]="100" [pageSize]="10" [pageSizeValues]="[10, 25, 50, 100]" [pageInput]="true"></mona-pager>
```

Set `pageSizeValues` to `false` or `[]` to hide the page-size dropdown entirely, or to `true` for the default options.

### Cancelling a page-size change

`pageSizeSelect` fires when the user picks a size, before it is applied. Its `PageSizeChangeEvent` extends `PreventableEvent`; call `preventDefault()` to keep the current page size. `pageSizeChange` (from `[(pageSize)]`) and `pageChange` fire only for a change that went through.

```html
<mona-pager [total]="100" [(pageSize)]="pageSize" (pageSizeSelect)="onPageSizeSelect($event)"></mona-pager>
```

```typescript
protected onPageSizeSelect(event: PageSizeChangeEvent): void {
    if (this.hasUnsavedChanges()) {
        event.preventDefault();
    }
}
```

### Custom navigation button

```html
<mona-pager [total]="100" [pageSize]="10">
    <ng-template monaPagerNavigationButtonsTemplate type="first" let-disabled="disabled" let-navigate="navigate">
        <button monaButton [disabled]="disabled" (click)="navigate()">First</button>
    </ng-template>
</mona-pager>
```

## Technical & Behavior Notes

- `pageChange` is emitted synchronously for user actions (a button, the page input, the page dropdown, a page-size change, keyboard shortcuts) and when Pager corrects an invalid `skip`. It is not emitted on creation or when `skip` is set from code to a valid page.
- An invalid `skip` is corrected to the start of the page that holds it: a skip past the last page (the total shrank, a stale server skip) moves to the last page, and a skip between page boundaries (the host changed `pageSize`) moves to the start of its page. The correction updates `[(skip)]` and is reported through `pageChange`.
- A page-size change keeps the first item of the current page in view: at `skip` 40 with 10 per page, choosing 20 gives `skip` 40 (page 3). It always emits `pageChange` with the new `take`.
- Values below the minimum are ignored: `pageSize` and `visiblePages` count as at least 1, `skip` and `total` as at least 0.
- Setting `pageSizeValues` to `false` or an empty array removes the page-size dropdown from the layout entirely. In `"input"` mode the page-size dropdown is not shown, except in the responsive compact layout below 480px, which shows it and leaves out the page input box.

## Accessibility & Forms Integration

### Keyboard Map

Pager's buttons, dropdowns and input are ordinary Tab stops; the pager itself is not a Tab stop and never traps `Tab`. With `navigable` (the default), these shortcuts work while a pager button has focus. Set `[navigable]="false"` to keep only native button behavior.

| Shortcut     | Behavior                                                    |
|--------------|-------------------------------------------------------------|
| `Home`       | Goes to the first page.                                     |
| `End`        | Goes to the last page.                                      |
| `PageUp`     | Goes to the previous page.                                  |
| `PageDown`   | Goes to the next page.                                      |
| `ArrowLeft`  | Goes to the previous page (the next page in right-to-left). |
| `ArrowRight` | Goes to the next page (the previous page in right-to-left). |

In the page input, `Enter` commits the typed page (not while an IME is composing), and `Home` and `End` move the caret.

### ARIA Roles

| Attribute                | When present                                         | Value                                                                                                                 |
|--------------------------|------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------|
| `role`                   | On the host                                          | `"navigation"`                                                                                                        |
| `aria-label`             | On the host, unless `aria-labelledby` is set         | The `aria-label` input, or `"Pagination"`                                                                             |
| `aria-label`             | On the first/previous/next/last buttons              | `"First page"`, `"Previous page"`, `"Next page"`, `"Last page"`                                                       |
| `aria-label`             | On the jump (ellipsis) buttons                       | `"Jump back {visiblePages} pages"` / `"Jump forward {visiblePages} pages"`                                            |
| `aria-label`             | On every numeric page button                         | `"Page {n}"`                                                                                                          |
| `aria-current`           | On the numeric page button matching the current page | `"page"`                                                                                                              |
| `aria-label`             | On the page-size dropdown                            | `"Items per page"`                                                                                                    |
| `aria-label`             | On the page dropdown and the `pageInput` box         | `"Page"`                                                                                                              |
| `aria-labelledby`        | On the `"input"` mode page box                       | The text around it ("Page" … "of 10")                                                                                 |
| `role="status"` (polite) | Visually hidden, inside the host                     | Announces the new range ("11 - 20 of 100 items") after a user change.                                                 |

These labels are rendered by Pager's default markup only. If a consumer replaces a button using `PagerNavigationButtonsTemplateDirective` or `PagerNumericButtonsTemplateDirective`, they are responsible for providing an equivalent accessible name on their own markup.

### Focus Behavior

When the focused button becomes disabled or is removed (Next on the last page, a jump button that is no longer needed), focus moves to the current page button instead of being lost. Page buttons are tracked by page number, so a focused page button keeps focus when the window of visible pages moves.

### Form Interaction

Pager is not a form control. It does not implement `FormValueControl`/`FormCheckboxControl` or `ControlValueAccessor`, and cannot be bound with `[(ngModel)]`, `[formControl]`, or `formControlName`.

## API

### `PagerComponent`

**Selector:** `mona-pager`

#### Inputs

| Name              | Type                                                 | Default                | Description                                                                                                                                  |
|-------------------|------------------------------------------------------|------------------------|----------------------------------------------------------------------------------------------------------------------------------------------|
| `aria-label`      | `string \| null`                                     | `null`                 | Accessible name of the navigation landmark. Defaults to the localized `"Pagination"`.                                                        |
| `aria-labelledby` | `string`                                             | `''`                   | Id of an element that names the landmark; takes precedence over `aria-label`.                                                                |
| `class`           | `string`                                             | `''`                   | Additional CSS classes merged onto the host element via `tailwind-merge`.                                                                    |
| `firstLast`       | `boolean`                                            | `true`                 | Whether to show the first and last page buttons.                                                                                             |
| `navigable`       | `boolean`                                            | `true`                 | Whether the page shortcuts work on focused pager buttons.                                                                                    |
| `pageInput`       | `boolean`                                            | `false`                | Whether to show the page-jump numeric input in `"numeric"` mode.                                                                             |
| `pageSize`        | `number`                                             | `5`                    | The page size. Model: supports `[(pageSize)]`.                                                                                               |
| `pageSizeValues`  | `readonly number[] \| boolean`                       | `[5, 10, 20, 50, 100]` | The page-size dropdown options. `true` uses the defaults; `false` or `[]` hides the dropdown.                                                |
| `previousNext`    | `boolean`                                            | `true`                 | Whether to show the previous and next page buttons.                                                                                          |
| `responsive`      | `boolean`                                            | `true`                 | Whether the numeric page buttons become a page dropdown when the pager is narrower than 480px.                                               |
| `rounded`         | `'none' \| 'small' \| 'medium' \| 'large' \| 'full'` | `'medium'`             | Border-radius preset.                                                                                                                        |
| `showInfo`        | `boolean`                                            | `true`                 | Whether to show the info summary section.                                                                                                    |
| `size`            | `'small' \| 'medium' \| 'large'`                     | `'medium'`             | Size preset for text, buttons, and icons.                                                                                                    |
| `skip`            | `number`                                             | `0`                    | The number of items to skip (0-based offset into the collection). Model: supports `[(skip)]`.                                                |
| `total`           | `number`                                             | `0`                    | The total number of items in the collection.                                                                                                 |
| `type`            | `'input' \| 'numeric'`                               | `'numeric'`            | Whether to render numeric page buttons or a "Page [input] of N" control.                                                                     |
| `visiblePages`    | `number`                                             | `5`                    | The number of numeric page buttons visible at once; pages further away are reached through jump buttons. The first and last page always show. |

Boolean inputs accept bare attributes (`<mona-pager pageInput>`).

#### Outputs

| Name             | Type                  | Description                                                                                                                       |
|------------------|-----------------------|-----------------------------------------------------------------------------------------------------------------------------------|
| `pageChange`     | `PageChangeEvent`     | Emitted when the user changes the page or the page size, or when Pager corrects an invalid `skip`. Not emitted on creation.         |
| `pageSizeChange` | `number`              | The `pageSize` model's change event: the new size, after a page-size change went through.                                         |
| `pageSizeSelect` | `PageSizeChangeEvent` | Emitted when the user picks a page size, before it is applied. Call `preventDefault()` on the event to keep the current size.     |
| `skipChange`     | `number`              | The `skip` model's change event.                                                                                                  |

`PagerComponent` has no public methods intended for consumer use.

### Exported Types & Directives

| Type                               | Shape                                                                         | Description                                                                                          |
|------------------------------------|-------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------|
| `PagerType`                        | `'input' \| 'numeric'`                                                        | Valid values for the `type` input.                                                                   |
| `PageChangeEvent`                  | `{ page: number; skip: number; take: number }`                                | Payload of `pageChange`. `page` is 1-based.                                                          |
| `PageSizeChangeEvent`              | Extends `PreventableEvent`; adds `newPageSize: number`, `oldPageSize: number` | Payload of `pageSizeSelect`. Call `preventDefault()`/`isDefaultPrevented()` to cancel the change.    |
| `PagerContext`                     | See [Anatomy](#anatomy--public-structural-templates)                          | The state and actions every template context includes.                                               |
| `InfoTemplateContext`              | `PagerContext & { $implicit: PagerContext }`                                  | Template context for `PagerInfoTemplateDirective`.                                                   |
| `NavigationButtonsTemplateContext` | `PagerContext & { disabled, targetPage, navigate() }`                         | Template context for `PagerNavigationButtonsTemplateDirective`.                                      |
| `NumericButtonsTemplateContext`    | `PagerContext & { pages }`                                                    | Template context for `PagerNumericButtonsTemplateDirective`.                                         |
| `PageSizeTemplateContext`          | `PagerContext & { $implicit: readonly number[] }`                             | Template context for `PagerPageSizeTemplateDirective`.                                               |

---

<!-- verification-checklist
- [x] All API tables cross-checked against pager.component.ts, the context models and component-metadata.json
- [x] All provided code examples compile against public imports only
- [x] Keyboard map and accessibility claims verified against pager.component.ts/html (button-only shortcuts, RTL arrows, landmark, labels, live status, focus recovery)
- [x] Form integration claim verified — no FormValueControl/FormCheckboxControl/ControlValueAccessor implementation in pager.component.ts
- [x] The 480px responsive threshold is documented because it decides when the page dropdown replaces the buttons
-->
