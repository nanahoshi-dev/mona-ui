## Overview

Dialog displays a modal (or non-modal) message centered in the viewport, with an optional icon, title, description, free-form content, and a row of action buttons. It is built on `PopupService` internally, like every other Mona UI overlay.

There are two ways to use it:

- **`DialogComponent`** (`<mona-dialog>`) is declarative. Place it behind an `@if` in your template; the dialog opens after the first render and closes when the host element is destroyed or when the consumer closes it.
- **`DialogService`** is imperative. Call `show()` with a `DialogSettings` object to open a dialog from code — useful from a service, an event handler, or anywhere without a fixed `@if` in a template. `confirm()` and `alert()` are shortcuts for the two most common prompts.

Both close the same way: an action button, the close button, Escape, or a programmatic close all close the dialog, and every close reports one result.

**Use `Dialog` when:**

- You need a modal confirmation, message, or short form, with a title/description/actions layout already built in
- You want built-in action-button wiring (`DialogAction[]` + a single `action`/`result` event) instead of composing buttons yourself

**Use `Window` instead when:**

- The user needs to drag, resize, minimize, or maximize the overlay
- The content is closer to a floating panel than a message or confirmation

**Use `Popup` directly when:**

- You need a custom anchored overlay with no title/action-row structure at all

## Import & Quick Start

```typescript
import { DialogComponent } from "@nanahoshi/mona-ui/dialog";
```

```html
@if (dialogVisible()) {
    <mona-dialog
        title="Discard changes?"
        text="Your changes have not been saved."
        [actions]="[{ text: 'Cancel' }, { text: 'Discard', look: 'error' }]"
        (close)="dialogVisible.set(false)">
    </mona-dialog>
}
```

`DialogComponent` opens automatically once its host renders; there is no explicit `open()` call for declarative usage.

Imperative usage returns a `DialogRef` synchronously. The dialog closes itself when an action is clicked; `result` says how it closed:

```typescript
import { inject } from "@angular/core";
import { DialogService } from "@nanahoshi/mona-ui/dialog";

protected readonly dialogService = inject(DialogService);

confirmDiscard(): void {
    const dialogRef = this.dialogService.show({
        title: "Discard changes?",
        text: "Your changes have not been saved.",
        actions: [{ text: "Cancel" }, { data: "discard", text: "Discard", look: "error" }]
    });
    dialogRef.result.subscribe(result => {
        if (!result.viaClose && result.action.data === "discard") {
            this.discard();
        }
    });
}
```

For a yes/no question, `confirm()` does the same with built-in, translated OK and Cancel buttons:

```typescript
this.dialogService.confirm({ title: "Discard changes?", text: "Your changes have not been saved." }).subscribe(ok => {
    if (ok) {
        this.discard();
    }
});
```

## Anatomy

Dialog has five structural template directives, each an `ng-template` placed as projected content inside `<mona-dialog>...</mona-dialog>`. Only the content template receives a context (see [Content from a template or a component](#content-from-a-template-or-a-component)).

| Directive                            | Selector                                     | Replaces                           |
|--------------------------------------|----------------------------------------------|------------------------------------|
| `DialogTitleTemplateDirective`       | `ng-template[monaDialogTitleTemplate]`       | The `title` input                  |
| `DialogDescriptionTemplateDirective` | `ng-template[monaDialogDescriptionTemplate]` | The `description` input            |
| `DialogContentTemplateDirective`     | `ng-template[monaDialogContentTemplate]`     | The `text` input                   |
| `DialogIconTemplateDirective`        | `ng-template[monaDialogIconTemplate]`        | The built-in `type` icon           |
| `DialogFooterTemplateDirective`      | `ng-template[monaDialogFooterTemplate]`      | The generated `actions` button row |

```html
<mona-dialog title="Delete file?">
    <ng-template monaDialogIconTemplate>
        <svg lucideTriangleAlert [size]="32"></svg>
    </ng-template>
    <ng-template monaDialogFooterTemplate>
        <div class="flex justify-end gap-2 p-2">
            <button monaButton (click)="dialogVisible.set(false)">Cancel</button>
            <button monaButton look="error" (click)="delete()">Delete</button>
        </div>
    </ng-template>
</mona-dialog>
```

When a footer template is provided, it replaces the built-in action-button row entirely — `actions` and `actionsLayout` no longer render anything, and Enter no longer triggers a default action.

## Examples

### Action buttons and results

```example
dialog/basic
```

Each `DialogAction` renders as a `monaButton` with that action's `text`, `look`, `rounded`, `iconOnly`, and `cssClass`. Clicking one emits `action` (and `DialogRef.action$`); unless a subscriber calls `event.preventDefault()`, the dialog then closes on its own, for `<mona-dialog>` and `DialogService.show()` alike. Give actions a `data` value to tell them apart without comparing their (translated) text.

### Default action

```typescript
protected readonly actions: DialogAction[] = [
    { text: "Cancel" },
    { default: true, look: "primary", text: "Save" }
];
```

Pressing Enter inside the dialog triggers the action marked `default: true`, as in a form. Enter on a control that handles it itself (a button, a link, a text area, a select, a checkbox, a menu, an option…) does what that control does instead. `confirm()` and `alert()` make OK the default.

### Severity type and icon

```html
<mona-dialog type="error" title="Something went wrong" text="The file could not be saved."> </mona-dialog>
```

`type` accepts `"info" | "success" | "warning" | "error" | "confirm"`, each with a built-in icon, or `null` to render no icon at all. `"confirm"`, `"error"`, and `"warning"` also switch the rendered ARIA role — see [Accessibility](#accessibility).

On `<mona-dialog>`, `type` defaults to `"info"`, so a dialog without `type` shows the info icon. For a dialog with no icon, such as one holding a form, set `[type]="null"`. `DialogService.show()` has no default type: leave `type` out of the settings, or set it to `null`, and the dialog has no icon. `alert()` defaults to `"info"` and `confirm()` to `"confirm"`.

### Custom content instead of plain text

A content template replaces `text`. Here Enter in the text box triggers the default Save action.

```example
dialog/content
```

### A form in a dialog

Bind a signal form inside a content template. Save is the default action, so Enter in a text field triggers it. While the form is invalid, the `action` handler calls `event.preventDefault()`, which keeps the dialog open, and marks the form touched to show the errors. Once the form is valid, Save closes the dialog.

```example
dialog/form
```

Enter triggers the default action only outside a `<form>` element: inside one, Enter is left to the form's own submit. The example doesn't use a `<form>` element; signal forms don't need one.

### A confirmation from code

`confirm()` opens a dialog with OK and Cancel, and emits `true` only for OK.

```example
dialog/service
```

### Content from a template or a component

`DialogService.show()` takes either a `TemplateRef` or a component class as `content`, and a `data` value for it.

A template receives `data` as its implicit context and the `DialogRef` as `dialogRef`:

```html
<ng-template #renameContent let-file let-dialogRef="dialogRef">
    <p>Rename {{ file.name }}?</p>
    <button monaButton (click)="dialogRef.close('renamed')">Rename</button>
</ng-template>
```

A component injects `DIALOG_DATA` and `DialogRef`:

```typescript
@Component({
    selector: "app-rename-file",
    template: `<p>Rename {{ data.name }}?</p>`
})
export class RenameFileComponent {
    protected readonly data = inject<{ name: string }>(DIALOG_DATA);
    protected readonly dialogRef = inject(DialogRef<string>);
}

const dialogRef = this.dialogService.show<string, { name: string }>({
    content: RenameFileComponent,
    data: { name: "report.pdf" },
    injector: this.#injector,
    title: "Rename file"
});
dialogRef.component; // ComponentRef<RenameFileComponent>
```

Pass `injector` to give the content the providers of the place that opened it (a feature's services, a form's providers); without it, the content resolves from the root injector.

### Preventing a close

```typescript
protected onClose(event: PopupCloseEvent): void {
    if (this.formDirty()) {
        event.preventDefault();
        return;
    }
    this.dialogVisible.set(false);
}
```

```html
<mona-dialog (close)="onClose($event)"> </mona-dialog>
```

### Updating an open dialog

Only a subset of inputs stay reactive after the dialog opens — see [Live vs. one-shot inputs](#live-vs-one-shot-inputs). Changing `title`, `text`, `type`, `actions`, or the other live inputs on an already-open `<mona-dialog>` updates it in place, without closing and reopening:

```html
<mona-dialog [title]="stepTitle()" [text]="stepText()" [type]="stepType()"> </mona-dialog>
```

### Closing with a value

```typescript
const dialogRef = this.dialogService.show<number>({ title: "Pick a size", content: this.sizePicker() });
dialogRef.result.subscribe(result => {
    if (result.viaClose && result.via === PopupCloseSource.Programmatic) {
        this.size.set(result.value ?? 0);
    }
});

// From the content:
dialogRef.close(42);
```

## Behavior

### Live vs. one-shot inputs

After the dialog opens, `<mona-dialog>` keeps `actions`, `actionsLayout`, `aria-label`, `closable`, `description`, `rounded`, `text`, `title`, and `type` reactive — changing any of them re-renders the open dialog in place.

All other inputs (`height`, `width`, `top`, `left`, `minHeight`, `minWidth`, `maxHeight`, `maxWidth`, `focusedElement`, `closeOnEscape`, `modal`, and every `*Template` projected via content) are read once when the dialog opens. Changing them afterward has no effect on the already-open dialog.

`DialogRef.update()` performs the same in-place update as the reactive inputs above; it is how `DialogService.show()` consumers can update an imperatively-opened dialog without closing it.

### Positioning and size

The dialog is centered in the viewport. `left` pins it that many pixels from the viewport's left edge and `top` that many pixels from the top; each one replaces centering on its own axis only, so `top` alone keeps the dialog centered horizontally. `left` is physical: it measures from the left edge in right-to-left pages too.

The dialog sizes itself to its content. Unless `maxHeight`/`maxWidth` are given, it stays 1rem inside the viewport on each side; when its content is taller, the header and footer stay in place and the body scrolls.

### The close contract

Every close — an action, the close (X) button, Escape, a programmatic `dialogRef.close(value)`, or a destroyed `<mona-dialog>` — goes through the same steps:

1. `close` / `DialogRef.close$` emits a `PopupCloseEvent`. Call `event.preventDefault()` synchronously to keep the dialog open (a close caused by destroying `<mona-dialog>` can't be kept). For an action, `action` / `DialogRef.action$` emits first, and preventing it keeps the dialog open as well.
2. `DialogRef.result` emits one `DialogResult` as the leave animation starts. It replays to late subscribers and completes once the dialog has closed.
3. `closed` / `DialogRef.closed$` emits the same `DialogResult` after the leave animation, then completes.

A second `close()` while the dialog is closing does nothing.

### `modal`

`modal` (default `true`) makes the dialog modal: a backdrop, `aria-modal="true"`, focus kept inside the dialog, page scroll locked, and the rest of the page `inert`, so a pointer, Tab, or a screen reader can't reach it. Popups opened from inside the dialog (a dropdown, a date picker) stay usable, and stacked modal dialogs keep the page inert until the last one closes.

A non-modal dialog (`modal: false`) does none of that: Tab can leave it, and the page stays usable and scrollable.

- `DialogPromptSettings` is `DialogSettings` without `actions`, `content`, `data`, and `footerTemplate`. The buttons are labelled with the `ok` and `cancel` dialog messages (override them through `messages`) and carry `data` values `DIALOG_OK` (`"ok"`) and `DIALOG_CANCEL` (`"cancel"`). `confirm()` defaults `type` to `"confirm"`, `alert()` to `"info"`.

## Forms Integration

Dialog is a container, not a form control, so it has no form integration.

## Accessibility

### Keyboard

The Escape key closes the dialog when `closeOnEscape` is `true` (the default). Enter triggers the [default action](#default-action), if there is one.

### Focus

A modal dialog keeps focus inside itself for as long as it is open — Tab and Shift+Tab cannot move focus to the rest of the page. When it opens, focus moves automatically to the first focusable element, unless `focusedElement` is provided, in which case focus moves there instead. When it closes, focus returns to the element that had it before, if that element is still focusable; set `restoreFocus: false` in `DialogSettings` to leave focus where it is.

### ARIA

| Attribute          | When present                                                            | Value                                                                                       |
|--------------------|-------------------------------------------------------------------------|---------------------------------------------------------------------------------------------|
| `role`             | Always                                                                  | `"alertdialog"` when `type` is `"confirm"`, `"error"`, or `"warning"`; `"dialog"` otherwise |
| `aria-labelledby`  | When `title` or a `monaDialogTitleTemplate` is present                  | ID of the title element                                                                     |
| `aria-label`       | When there is no title                                                  | The `aria-label` input, or the `ariaLabel` setting                                           |
| `aria-describedby` | Only when `description` or a `monaDialogDescriptionTemplate` is present | ID of the description element                                                               |
| `aria-modal`       | When `modal` is `true`                                                  | `"true"`                                                                                    |

Every dialog needs an accessible name: a `title`, a title template, or `aria-label` (`ariaLabel` in the service settings). In development mode, a dialog without one logs a warning.

<!-- verification-checklist
- [x] Batch 5 (module 11): close contract (action$/close$/result/closed$), confirm/alert, DIALOG_DATA, injector, component content, ariaLabel, aria-modal, default action, inert, non-modal focus, strategy positioning and viewport caps verified against dialog sources and dialog/tests/dialog-close-contract.spec.ts
- [x] DialogComponent inputs and defaults verified against dialog.component.ts source (post-audit-fix state, including the reactive `effect()` covering actions/actionsLayout/closable/description/rounded/text/title/type)
- [x] DialogComponent outputs verified (action: DialogActionEvent, close: PopupCloseEvent, closed: void) against dialog.component.ts source
- [x] Live vs. one-shot input split verified directly against the effect() body vs. #openDialog() body in dialog.component.ts
- [x] DialogService.show() verified as the only public method
- [x] DialogRef public methods/properties verified against models/DialogRef.ts and DialogRefParams.ts
- [x] DialogRef.result / DialogResult verified against models/DialogResult.ts and the dialogResult$ subject in DialogReference.ts
- [x] DialogActionEvent properties verified against models/DialogActionEvent.ts; PreventableEvent base verified exported via index.ts
- [x] DialogAction fields verified against models/DialogAction.ts
- [x] DialogSettings fields verified against models/DialogSettings.ts; internal-only DialogInjectorData/DialogReference/DialogRefParams confirmed NOT exported and NOT documented as public API
- [x] Five structural template directives verified against directives/*.ts and dialog-content.component.html; confirmed none pass a template context
- [x] `close` firing for every close path (including post-action programmatic close) verified against dialog.component.ts's #dialogRef.result subscription and DialogReference.close()/PopupReference.close()
- [x] Role/aria-labelledby/aria-describedby verified against dialog-content.component.ts; aria-modal is set when modal (batch 5)
- [x] Auto-focus-in and focusedElement override verified against dialog-content.component.ts's CdkTrapFocus autoCapture + afterNextRender-driven focusElement()
- [x] Escape-key close behavior verified against dialog.service.ts passing closeOnEscape through to PopupService
- [x] component-metadata.json regenerated via `npm run build:metadata` and cross-checked for the `closed` output and current descriptions
- [x] No internal-only symbols (DialogContentComponent, DialogInjectorData, DialogReference, DialogReferenceOptions, DialogRefParams) documented as public API
-->
