## Overview

| Mode | Starts with | Commits |
| :--- | :--- | :--- |
| `"cell"` | `Enter`, `F2` or a double click on a cell | When the editor is left or `Enter` is pressed. `cellEdit` then `save` report it. |
| `"row"` | The row's Edit button, or `Enter` or `F2` on any of its cells | With the row's Save button or `Enter`, after validation. `save` then `rowEdit` report it. |

`monaGridEditable` without a value edits cells; pass `{ mode: "row" }` to edit whole rows. Each column's `type` picks its built-in editor: a text box, numeric text box, date picker or checkbox. A `monaGridEditTemplate` replaces it with your own.

**Use something else when:**

- A row has many fields, or fields that don't fit a cell. Edit it in a [Dialog](/components/dialog) or a separate form, and save from there.
- Values change in bulk. Change `data` from your own controls; the grid shows the new rows.

## Import & Quick Start

```typescript
import {
    GridAddCommandDirective,
    GridColumnComponent,
    GridCommandColumnComponent,
    GridComponent,
    GridEditableDirective,
    type GridRemoveEvent,
    type GridSaveEvent,
    GridToolbarTemplateDirective
} from "@nanahoshi/mona-ui/grid";
```

```html
<mona-grid
    aria-label="Products"
    rowKey="id"
    [data]="products()"
    [monaGridEditable]="{ mode: 'row' }"
    [newRowFactory]="createProduct"
    (save)="onSave($event)"
    (remove)="onRemove($event)">
    <mona-grid-column field="name" title="Name"></mona-grid-column>
    <mona-grid-column field="price" title="Price" type="number"></mona-grid-column>
    <mona-grid-command-column></mona-grid-command-column>
</mona-grid>
```

```typescript
protected onSave(event: GridSaveEvent): void {
    const product = event.rowData as Product;
    this.products.update(products =>
        event.operation === "create" ? [product, ...products] : products.map(p => (p.id === product.id ? product : p))
    );
}
```

## Anatomy

| Piece | Placed inside | What it does |
| :--- | :--- | :--- |
| `mona-grid-command-column` | `mona-grid` | A column of command buttons. Without content it shows Edit and Remove, and Save and Cancel while its row is edited. |
| `monaGridCellTemplate` | `mona-grid-command-column` | Your own command buttons. The context has `$implicit` and `rowData` (the item), `row`, `isEditing`, `isNew`, and `edit()`, `save()`, `cancel()` and `remove()`. |
| `button[monaGridEditCommand]` | A command template | Starts row editing for the row it's given, usually the context's `row`. |
| `button[monaGridRemoveCommand]` | A command template | Removes the row it's given, asking first when the column has `removeConfirmation`. |
| `button[monaGridSaveCommand]`, `button[monaGridCancelCommand]` | A command template or the toolbar | Save or cancel the edit in progress. |
| `button[monaGridAddCommand]` | `monaGridToolbarTemplate` | Opens the add row, filled from `newRowFactory`. |
| `ng-template[monaGridEditTemplate]` | `mona-grid-column` | Replaces the column's editor. The context is a `GridEditTemplateContext`. |

## Examples

### Row Editing with Validation

```example
grid-editing/editing
```

A `mona-grid-command-column` without content shows the built-in Edit and Remove buttons, and `monaGridAddCommand` on a toolbar button opens the add row. The `schema` validates the row; a save that fails validation keeps the editor open and announces the error.

### Custom Editors

Custom edit templates receive a `GridEditTemplateContext` bound to the row's Signal Forms field:

```html
<mona-grid-column field="shipName" title="Ship Name">
    <ng-template monaGridEditTemplate let-context>
        <mona-text-box [formField]="$any(context.field)" (keydown.escape)="context.cancel()"></mona-text-box>
    </ng-template>
</mona-grid-column>
```

The context also has `value`, `setValue()`, `commit()`, `cancel()`, and `errors`, `invalid` and `touched` for showing validation messages.

### Custom Command Buttons

```html
<mona-grid-command-column [width]="120">
    <ng-template monaGridCellTemplate let-row="row">
        <button monaButton type="button" [monaGridEditCommand]="row">Change</button>
        <button monaButton type="button" [monaGridRemoveCommand]="row">Delete</button>
    </ng-template>
</mona-grid-command-column>
```

### Saving on a Server

Prevent `save` to keep the editor open while the request runs, then call `endEdit()` on the `GridEditableDirective` (from `viewChild(GridEditableDirective)`) when it succeeds.

```typescript
private readonly editable = viewChild.required(GridEditableDirective);

protected onSave(event: GridSaveEvent): void {
    event.preventDefault();
    this.api.save(event.rowData).subscribe(() => {
        this.reload();
        this.editable().endEdit();
    });
}
```

## Behavior

### Which columns are editable

Every column is editable except the one whose `field` is the `rowKey`. Set `[editable]` on a `mona-grid-column` to change that, for example `[editable]="true"` to type the key of a new row, or `[editable]="false"` for a computed column.

### Events

`save` is the one to persist from: its `rowData` holds the edited values and `originalRowData` the row as it was. `cellEdit` comes first in cell mode, with the field's old and new value; its `rowData` is the row as it was. Neither fires when nothing changed. `edit` and `add` come before an editor opens, and preventing them keeps it closed.

`cancel` carries a `reason`: `"command"`, `"escape"`, `"switch"` (another edit or the add row started) or `"removed"` (the row left the data or the view, which can't be prevented). `remove` carries the row's `key` and its `index` in `data`.

### Values

Each editor is named after its column title. Number text is read in the grid's locale (`1.234,5` in de-DE); a date picked in the calendar keeps the time of day the value had. A row without a value for an editable column starts that editor at `null`, and the field is left out of the saved row again if it stays empty.

### Data that changes during an edit

When `data` is replaced during an edit, the edit moves to the new item with the same `rowKey` and keeps what was typed. If the row is gone, the edit is canceled with the reason `"removed"`. After Save, Cancel or Remove, focus moves to the row's cell, or to the nearest cell when the row is gone.

## Forms Integration

Inline editing is built exclusively on Angular Signal Forms: the built-in editors and the `GridEditTemplateContext` passed to `monaGridEditTemplate` both operate on a `FieldTree` from `@angular/forms/signals`. No grid component implements `ControlValueAccessor`, `FormValueControl`, or `FormCheckboxControl`, so there is no `[(ngModel)]`, `[formControl]`, or `formControlName` integration at the cell-editor level.

Provide a `schema` function in `monaGridEditable`'s options to validate the row being edited. It receives a `GridEditFormContext` and returns a Signal Forms schema for the row; errors surface through `errors`, `invalid` and `touched` in custom edit templates, and on the built-in editors.

## Accessibility

The command buttons are named after their row (`Edit row 3`); `commandAriaLabel` in the options names them after something else, such as an order number. An invalid field is linked to its editor with `aria-describedby`, and a commit that fails validation is announced through a polite live region.

### Keyboard

| Key | Action |
| --- | --- |
| `Enter` / `F2` | Starts editing an editable cell; in row mode, edits the row from that cell's editor. |
| `Enter` | In cell mode, saves the cell. In row mode, saves the row after validation. |
| `Escape` | Cancels the edit. |
| `Tab` / `Shift+Tab` | In cell mode, saves and edits the next/previous editable cell. In row mode, moves between the row's editors and its Save and Cancel buttons. |

The add row works the same way. `Enter` and `Escape` are left to an input method while it composes text. The rest of the grid's keys are on [Grid Overview](/components/grid#keyboard).

### ARIA

| Attribute | When present | Value |
| --- | --- | --- |
| `aria-readonly` | On the tabular content region | `"true"` while editing is off |
| `aria-readonly` | On a data cell | `"true"` when editing is off for that cell or column |
| `aria-label` | On the built-in command buttons | `"Edit row 3"`, `"Remove row 3"`, `"Save row 3"`, `"Cancel editing row 3"`, or the `commandAriaLabel` option's text |
| `aria-describedby` | On an editor with a validation error | The error message |
