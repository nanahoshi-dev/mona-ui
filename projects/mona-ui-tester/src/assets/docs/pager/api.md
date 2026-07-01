## Overview & Component Selection

Use Pager when a consumer needs to page through a collection that is too large to display in full — grids, lists, or search results. Pager does not fetch, slice, or hold the paged data itself. It tracks `skip`, `total`, and `pageSize` and emits `pageChange`/`pageSizeChange` events; the consumer is responsible for loading or slicing data in response.

Pager supports two visual modes, selected with the `type` input:

- `"numeric"` (default) — numeric page buttons with optional first/last and previous/next controls.
- `"input"` — a single "Page [input] of N" control instead of numeric buttons.

When `responsive` is enabled (the default), Pager narrows its own layout as the host element shrinks: it hides the info summary first, then the page-size/page-input controls, and finally collapses the numeric page list into a single page-selecting dropdown. This happens automatically and does not require a breakpoint input.

## Import & Quick Start

```typescript
import { PagerComponent, PagerFocusableDirective } from "@mirei/mona-ui";
import type { PageChangeEvent } from "@mirei/mona-ui";
```

```html
<mona-pager [total]="100" [pageSize]="10" [skip]="skip()" (pageChange)="onPageChange($event)"></mona-pager>
```

```typescript
protected readonly skip = signal(0);

protected onPageChange(event: PageChangeEvent): void {
    this.skip.set(event.skip);
    // load or slice data using event.skip and event.take
}
```

## Anatomy & Public Structural Templates

Pager's default first/previous/next/last buttons, numeric page buttons, page-size control, and info summary can each be replaced with a matching `ng-template` directive projected into `<mona-pager>`.

| Directive | Selector | Template context |
|---|---|---|
| `PagerNavigationButtonsTemplateDirective` | `ng-template[monaPagerNavigationButtonsTemplate]` | `NavigationButtonsTemplateContext`: `disabled`, `pageSize`, `totalPages`. Requires a `type` attribute input: `"first" \| "previous" \| "next" \| "last"`, identifying which button it replaces. |
| `PagerNumericButtonsTemplateDirective` | `ng-template[monaPagerNumericButtonsTemplate]` | `NumericButtonsTemplateContext`: `totalPages`. Only used when `type` is `"numeric"`. |
| `PagerPageSizeTemplateDirective` | `ng-template[monaPagerPageSizeTemplate]` | Implicit context: the resolved `number[]` of page-size options. |
| `PagerInfoTemplateDirective` | `ng-template[monaPagerInfoTemplate]` | `InfoTemplateContext`: `currentPage`, `pageSize`, `skip`, `total`, `totalPages`. |
| `PagerFocusableDirective` | `[monaPagerFocusable]` | Marks a custom focusable element or composite component host so it participates in Pager's inner keyboard navigation loop. |

## Feature Examples

### Numeric pagination with external state

```html
<mona-pager [total]="total()" [pageSize]="10" [skip]="skip()" (pageChange)="onPageChange($event)"></mona-pager>
```

### "Page N of M" input mode

```html
<mona-pager [type]="'input'" [total]="100" [pageSize]="10"></mona-pager>
```

### Custom page-size options and page-jump input

```html
<mona-pager [total]="100" [pageSize]="10" [pageSizeValues]="[10, 25, 50, 100]" [pageInput]="true"></mona-pager>
```

Set `pageSizeValues` to `false` or `[]` to hide the page-size dropdown entirely.

### Cancelling a page-size change

`PageSizeChangeEvent` extends `PreventableEvent`. Call `preventDefault()` to reject the change and keep the previous page size.

```typescript
protected onPageSizeChange(event: PageSizeChangeEvent): void {
    if (!confirm(`Change page size to ${event.newPageSize}?`)) {
        event.preventDefault();
    }
}
```

### Custom navigation button

```html
<mona-pager [total]="100" [pageSize]="10">
    <ng-template monaPagerNavigationButtonsTemplate type="first" let-disabled="disabled">
        <button monaButton monaPagerFocusable [disabled]="disabled">First</button>
    </ng-template>
</mona-pager>
```

## Technical & Behavior Notes

- `pageChange` emits whenever the current page changes, including once during initial render and after any programmatic `skip` or `pageSize` change — not only in response to a user click. Consumers that only want to react to user-driven navigation should compare the emitted `page` against their own previously stored value.
- Under `responsive`, sections collapse in this order as the host narrows: the info summary first, then the page-size/page-input controls, then the numeric page list (replaced by a single page-select dropdown). The exact width thresholds are implementation-defined and may change between releases — do not rely on specific pixel values.
- Setting `pageSizeValues` to `false` or an empty array removes the page-size dropdown from the layout entirely.

## Accessibility & Forms Integration

### Keyboard Map

Pager enables keyboard navigation by default. Set `[navigable]="false"` to keep only the native Tab order and native button/input behavior.

| Focus location | Shortcut | Behavior |
|---|---|---|
| Anywhere inside Pager | `Home` | Loads the first page. |
| Anywhere inside Pager | `End` | Loads the last page. |
| Pager wrapper | `Enter` | Activates inner Pager navigation and focuses the first enabled pager control. |
| Pager wrapper | `ArrowLeft` / `PageUp` | Loads the previous page. |
| Pager wrapper | `ArrowRight` / `PageDown` | Loads the next page. |
| Pager wrapper | `Tab` / `Shift+Tab` | Leaves Pager in the page's normal Tab order. |
| Inner navigation | `Tab` / `Shift+Tab` | Moves through marked Pager controls and wraps at the ends. |
| Inner navigation | `Escape` | Returns focus to the Pager wrapper and deactivates inner navigation. |
| Inner navigation | `Enter` | Runs the focused control's native action. |

Default Pager controls are already marked for inner navigation. Custom controls rendered through pager templates must use `monaPagerFocusable` on the focusable element or on the composite component host.

### ARIA Roles

| Attribute | When present | Value |
|---|---|---|
| `aria-label` | On the first/previous/next/last buttons | `"First page"`, `"Previous page"`, `"Next page"`, `"Last page"` |
| `aria-label` | On the jump (ellipsis) buttons | `"Jump back {visiblePages} pages"` / `"Jump forward {visiblePages} pages"` |
| `aria-label` | On every numeric page button | `"Page {n}"` |
| `aria-current` | On the numeric page button matching the current page | `"page"` |

These labels are rendered by Pager's default button markup only. If a consumer replaces a button using `PagerNavigationButtonsTemplateDirective` or `PagerNumericButtonsTemplateDirective`, they are responsible for providing an equivalent accessible name on their own markup.

### Focus Behavior

When `navigable` is enabled, the Pager wrapper is the page-level Tab stop. Press `Enter` on the wrapper to move into Pager controls; while inner navigation is active, `Tab` wraps inside the marked controls until `Escape` returns focus to the wrapper. When `navigable` is disabled, focus moves through rendered controls in native Tab order.

### Form Interaction

Pager is not a form control. It does not implement `FormValueControl`/`FormCheckboxControl` or `ControlValueAccessor`, and cannot be bound with `[(ngModel)]`, `[formControl]`, or `formControlName`.

## API

### `PagerComponent`

**Selector:** `mona-pager`

#### Inputs

| Name | Type | Default | Description |
|---|---|---|---|
| `class` | `string` | `''` | Additional CSS classes merged onto the host element via `tailwind-merge`. |
| `firstLast` | `boolean` | `true` | Whether to show the first and last page buttons. |
| `navigable` | `boolean` | `true` | Whether to enable keyboard navigation on the pager wrapper and its inner controls. |
| `pageInput` | `boolean` | `false` | Whether to show the page-jump numeric input. |
| `pageSize` | `number` | `5` | The page size. |
| `pageSizeValues` | `number[] \| boolean` | `[5, 10, 20, 50, 100]` | The page-size dropdown options. `false` or `[]` hides the dropdown. |
| `previousNext` | `boolean` | `true` | Whether to show the previous and next page buttons. |
| `responsive` | `boolean` | `true` | Whether to progressively hide sections (info, then page-size/input, then the numeric page list) as the host element narrows. |
| `rounded` | `'none' \| 'small' \| 'medium' \| 'large' \| 'full'` | `'medium'` | Border-radius preset. |
| `showInfo` | `boolean` | `true` | Whether to show the info summary section. |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Size preset for text, buttons, and icons. |
| `skip` | `number` | `0` | The number of items to skip (0-based offset into the collection). |
| `total` | `number` | `0` | The total number of items in the collection. |
| `type` | `'input' \| 'numeric'` | `'numeric'` | Whether to render numeric page buttons or a "Page [input] of N" control. |
| `visiblePages` | `number` | `5` | The number of numeric page buttons visible at once before collapsing into jump buttons. |

#### Outputs

| Name | Type | Description |
|---|---|---|
| `pageChange` | `PageChangeEvent` | Emitted when the current page changes. See [Technical & Behavior Notes](#technical--behavior-notes) for when this fires beyond direct user interaction. |
| `pageSizeChange` | `PageSizeChangeEvent` | Emitted when the page size changes. Call `preventDefault()` on the event to cancel the change. |

`PagerComponent` has no model inputs and no public methods intended for consumer use.

### Exported Types & Directives

| Type | Shape | Description |
|---|---|---|
| `PagerType` | `'input' \| 'numeric'` | Valid values for the `type` input. |
| `PageChangeEvent` | `{ page: number; skip: number; take: number }` | Payload of `pageChange`. `page` is 1-based. |
| `PageSizeChangeEvent` | Extends `PreventableEvent`; adds `newPageSize: number`, `oldPageSize: number` | Payload of `pageSizeChange`. Call `preventDefault()`/`isDefaultPrevented()` to cancel the change. |
| `InfoTemplateContext` | `{ currentPage, pageSize, skip, total, totalPages }` | Template context for `PagerInfoTemplateDirective`. |
| `NavigationButtonsTemplateContext` | `{ disabled, pageSize, totalPages }` | Template context for `PagerNavigationButtonsTemplateDirective`. |
| `NumericButtonsTemplateContext` | `{ totalPages }` | Template context for `PagerNumericButtonsTemplateDirective`. |
| `Page` | `{ page: number; text: string }` | Shape of a single page entry. Not referenced by any Pager input, output, or template context — exported for consumers who need to type a page list independently. |
| `PagerFocusableDirective` | `[monaPagerFocusable]` | Directive for registering custom template controls with Pager keyboard navigation. |

---

<!-- verification-checklist
- [x] All API tables cross-checked against pager.component.ts and component-metadata.json
- [x] All provided code examples compile against public imports only
- [x] Keyboard map and accessibility claims verified against pager.component.ts/html (wrapper shortcuts, focus loop, aria-label/aria-current bindings)
- [x] Form integration claim verified — no FormValueControl/FormCheckboxControl/ControlValueAccessor implementation in pager.component.ts
- [x] No implementation-only details exposed as public contract (responsive width thresholds intentionally described only qualitatively)
- [x] Page model documented as exported-but-unreferenced rather than omitted, since it is part of the package's public export surface
-->
