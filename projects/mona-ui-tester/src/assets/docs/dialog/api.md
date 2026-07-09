## Overview & Component Selection

Dialog displays a modal (or non-modal) message centered in the viewport, with an optional icon, title, description, free-form content, and a row of action buttons. It is built on `PopupService` internally, like every other Mona UI overlay.

There are two ways to use it:

- **`DialogComponent`** (`<mona-dialog>`) is declarative. Place it behind an `@if` in your template; the dialog opens after the first render and closes when the host element is destroyed or when the consumer closes it.
- **`DialogService`** is imperative. Call `show()` with a `DialogSettings` object to open a dialog from code — useful from a service, an event handler, or anywhere without a fixed `@if` in a template.

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
import { DialogComponent } from "@nanahoshi/mona-ui";
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

Imperative usage returns a `DialogRef` synchronously:

```typescript
import { inject } from "@angular/core";
import { DialogService } from "@nanahoshi/mona-ui";

protected readonly dialogService = inject(DialogService);

confirmDiscard(): void {
    const dialogRef = this.dialogService.show({
        title: "Discard changes?",
        text: "Your changes have not been saved.",
        actions: [{ text: "Cancel" }, { text: "Discard", look: "error" }]
    });
    dialogRef.result.subscribe(result => {
        if (!result.viaClose && result.action.text === "Discard") {
            dialogRef.close();
        }
    });
}
```

## Anatomy & Public Structural Templates

Dialog has five structural template directives, each an `ng-template` placed as projected content inside `<mona-dialog>...</mona-dialog>`. None of them expose a template context.

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

When a footer template is provided, it replaces the built-in action-button row entirely — `actions` and `actionsLayout` no longer render anything.

## Feature Examples

### Action buttons and results

```typescript
protected readonly actions: DialogAction[] = [
    { text: "Cancel" },
    { text: "Save", look: "primary" }
];

protected onAction(event: DialogActionEvent): void {
    if (event.action.text === "Save") {
        this.save();
    }
}
```

```html
<mona-dialog title="Save changes?" [actions]="actions" (action)="onAction($event)" (close)="dialogVisible.set(false)">
</mona-dialog>
```

Each `DialogAction` renders as a `monaButton` with that action's `text`, `look`, `rounded`, `iconOnly`, and `cssClass`. Clicking one emits `action`; unless a subscriber calls `event.preventDefault()`, the dialog then closes on its own.

### Severity type and icon

```html
<mona-dialog type="error" title="Something went wrong" text="The file could not be saved."> </mona-dialog>
```

`type` accepts `"info" | "success" | "warning" | "error" | "confirm"`, each with a built-in icon, or `null` to render no icon at all. `"confirm"`, `"error"`, and `"warning"` also switch the rendered ARIA role — see [Accessibility & Forms Integration](#accessibility-forms-integration).

### Custom content instead of plain text

```html
<mona-dialog title="Edit profile">
    <ng-template monaDialogContentTemplate>
        <mona-text-box placeholder="Display name"></mona-text-box>
    </ng-template>
</mona-dialog>
```

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

### Imperative usage with a dynamic content template

```typescript
protected readonly dynamicContent = viewChild<TemplateRef<unknown>>("dynamicContent");

open(): void {
    const dialogRef = this.dialogService.show({
        title: "Processing",
        content: this.dynamicContent()
    });
}
```

## Technical & Behavior Notes

### Live vs. one-shot inputs

After the dialog opens, `<mona-dialog>` keeps `actions`, `actionsLayout`, `closable`, `description`, `rounded`, `text`, `title`, and `type` reactive — changing any of them re-renders the open dialog in place.

All other inputs (`height`, `width`, `top`, `left`, `minHeight`, `minWidth`, `maxHeight`, `maxWidth`, `focusedElement`, `closeOnEscape`, `modal`, and every `*Template` projected via content) are read once when the dialog opens. Changing them afterward has no effect on the already-open dialog.

`DialogRef.update()` performs the same in-place update as the reactive inputs above; it is how `DialogService.show()` consumers can update an imperatively-opened dialog without closing it.

### Positioning

If `top` and `left` are both omitted, the dialog is centered in the viewport. Providing either one switches to that fixed pixel position.

### `close` fires for every close path

`close` emits for the close (X) button, the Escape key, and any programmatic `dialogRef.close()` call — including the implicit close that follows an unprevented `action` click. Call `event.preventDefault()` synchronously inside a `close` handler to cancel any of these, the same way `PopupRef.beforeClose` works (see the Popup documentation's [Preventing a close](/components/popup#preventing-a-close) section, since Dialog is built on the same mechanism).

### `modal` only controls the backdrop

`modal` (default `true`) toggles whether a backdrop is rendered behind the dialog. It does not affect focus trapping — Dialog always traps focus inside itself while open, regardless of `modal`.

## Accessibility & Forms Integration

### Keyboard

The Escape key closes the dialog when `closeOnEscape` is `true` (the default).

### Focus

Dialog traps focus inside itself for as long as it is open — Tab and Shift+Tab cannot move focus to the rest of the page. When it opens, focus moves automatically to the first focusable element, unless `focusedElement` is provided, in which case focus moves there instead.

### ARIA

| Attribute          | When present                                                            | Value                                                                                       |
|--------------------|-------------------------------------------------------------------------|---------------------------------------------------------------------------------------------|
| `role`             | Always                                                                  | `"alertdialog"` when `type` is `"confirm"`, `"error"`, or `"warning"`; `"dialog"` otherwise |
| `aria-labelledby`  | Always                                                                  | ID of the title element (rendered even when a custom `monaDialogTitleTemplate` is used)     |
| `aria-describedby` | Only when `description` or a `monaDialogDescriptionTemplate` is present | ID of the description element                                                               |

Dialog does not render `aria-modal`, even when `modal` is `true`. <!-- TODO(owner-review): confirm whether aria-modal should be added; Window renders it but Dialog currently does not. -->

Form integration is not applicable — Dialog is a container, not a form control.

## API

### `DialogComponent`

**Selector:** `mona-dialog`

#### Inputs

| Name             | Type                                                               | Default    | Description                                                                                                                                   |
|------------------|--------------------------------------------------------------------|------------|-----------------------------------------------------------------------------------------------------------------------------------------------|
| `actions`        | `Iterable<DialogAction>`                                           | `[]`       | Sets the actions of the dialog.                                                                                                               |
| `actionsLayout`  | `ActionsLayout`                                                    | `"end"`    | Sets the layout of the actions in the dialog footer.                                                                                          |
| `closable`       | `boolean`                                                          | `true`     | Sets the visibility of the close button in the dialog header.                                                                                 |
| `closeOnEscape`  | `boolean`                                                          | `true`     | Sets whether the dialog should close when the escape key is pressed.                                                                          |
| `description`    | `string`                                                           | —          | Sets the description of the dialog.                                                                                                           |
| `focusedElement` | `HTMLElement \| ElementRef<HTMLElement> \| string \| null`         | —          | Sets the element that should receive focus when the dialog is opened. When omitted, focus moves to the first focusable element automatically. |
| `height`         | `number`                                                           | —          | Sets the height of the dialog.                                                                                                                |
| `left`           | `number`                                                           | —          | Sets the left position of the dialog.                                                                                                         |
| `maxHeight`      | `number`                                                           | —          | Sets the maximum height of the dialog.                                                                                                        |
| `maxWidth`       | `number`                                                           | —          | Sets the maximum width of the dialog.                                                                                                         |
| `minHeight`      | `number`                                                           | —          | Sets the minimum height of the dialog.                                                                                                        |
| `minWidth`       | `number`                                                           | —          | Sets the minimum width of the dialog.                                                                                                         |
| `modal`          | `boolean`                                                          | `true`     | Sets whether the dialog should have an overlay behind it. See [`modal` only controls the backdrop](#modal-only-controls-the-backdrop).        |
| `rounded`        | `"none" \| "small" \| "medium" \| "large"`                         | `"medium"` | Border-radius preset applied to the component.                                                                                                |
| `text`           | `string`                                                           | —          | Primary text content displayed by the component.                                                                                              |
| `title`          | `string`                                                           | —          | Title text displayed in the component header or trigger.                                                                                      |
| `top`            | `number`                                                           | —          | Sets the top position of the dialog.                                                                                                          |
| `type`           | `"info" \| "success" \| "warning" \| "error" \| "confirm" \| null` | `"info"`   | Visual severity type of the dialog, controlling its icon and semantic role. Set to `null` to render the dialog without an icon.               |
| `width`          | `number`                                                           | —          | Sets the width of the dialog.                                                                                                                 |

#### Outputs

| Name     | Type                | Description                                                                                                                                                            |
|----------|---------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `action` | `DialogActionEvent` | Emitted when the user clicks an action button. Call `event.preventDefault()` to keep the dialog open.                                                                  |
| `close`  | `PopupCloseEvent`   | Emits for every close path (close button, Escape, or a programmatic close). Preventable — see [`close` fires for every close path](#close-fires-for-every-close-path). |
| `closed` | `void`              | Emitted after the dialog has fully closed. Preventing this event has no effect.                                                                                        |

---

### `DialogService`

Injectable service, `providedIn: "root"`.

#### Public methods

| Name                                        | Description                                 |
|---------------------------------------------|---------------------------------------------|
| `show(settings: DialogSettings): DialogRef` | Opens a dialog and returns its `DialogRef`. |

---

### `DialogRef<R = unknown>`

Returned by `DialogService.show()`.

#### Public methods

| Name                                          | Description                                                                                 |
|-----------------------------------------------|---------------------------------------------------------------------------------------------|
| `close(result?: R): void`                     | Closes the dialog, optionally carrying a result value.                                      |
| `update(data: Partial<DialogSettings>): void` | Updates the dialog's content and appearance in place. Only the fields provided are changed. |

#### Properties

| Name        | Type                             | Description                                                                                                                                                                                 |
|-------------|----------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `close$`    | `Observable<PopupCloseEvent<R>>` | Emits before any close proceeds.                                                                                                                                                            |
| `closed$`   | `Observable<void>`               | Emits once the dialog has fully closed.                                                                                                                                                     |
| `component` | `ComponentRef<unknown> \| null`  | The hosted component instance, when `content` is a component rather than a `TemplateRef`.                                                                                                   |
| `element`   | `HTMLElement`                    | The dialog's overlay element.                                                                                                                                                               |
| `height`    | `number`                         | The dialog's current rendered height, in pixels.                                                                                                                                            |
| `popupRef`  | `PopupRef`                       | The underlying `PopupRef`, for advanced overlay access.                                                                                                                                     |
| `result`    | `Observable<DialogResult>`       | Emits the outcome of the dialog: an action click or a close. Primarily useful with `DialogService.show()`, where there is no `(action)`/`(close)` template binding to subscribe to instead. |
| `width`     | `number`                         | The dialog's current rendered width, in pixels.                                                                                                                                             |

---

### `DialogActionEvent<T = unknown>`

Extends `PreventableEvent`.

#### Properties

| Name            | Type                  | Description                        |
|-----------------|-----------------------|------------------------------------|
| `action`        | `DialogAction<T>`     | The action that was clicked.       |
| `originalEvent` | `Event \| undefined`  | Inherited from `PreventableEvent`. |
| `type`          | `string \| undefined` | Inherited from `PreventableEvent`. |

#### Inherited methods

| Name                            | Description                                            |
|---------------------------------|--------------------------------------------------------|
| `preventDefault(): void`        | Marks the event as prevented, keeping the dialog open. |
| `isDefaultPrevented(): boolean` | Whether `preventDefault()` was called.                 |

---

### Exported Types

#### `DialogAction<T = unknown>`

| Field      | Type                            | Description                                                                                      |
|------------|---------------------------------|--------------------------------------------------------------------------------------------------|
| `text`     | `string`                        | Required. The button's label.                                                                    |
| `cssClass` | `string`                        | Additional class applied to the action button.                                                   |
| `data`     | `T`                             | Arbitrary data associated with the action, readable from `DialogActionEvent.action.data`.        |
| `iconOnly` | `boolean`                       | Renders the button as icon-only.                                                                 |
| `look`     | `ButtonVariantProps["look"]`    | The action button's visual style.                                                                |
| `rounded`  | `ButtonVariantProps["rounded"]` | The action button's border-radius preset. Falls back to the dialog's own `rounded` when omitted. |

#### `DialogResult`

`{ viaClose: true } | { viaClose: false; action: DialogAction }` — the value emitted by `DialogRef.result`.

#### `DialogSettings`

The settings object accepted by `DialogService.show()`. Fields mirror the `DialogComponent` inputs of the same name (`actions`, `actionsLayout`, `closable`, `closeOnEscape`, `description`, `focusedElement`, `height`, `left`, `maxHeight`, `maxWidth`, `minHeight`, `minWidth`, `modal`, `rounded`, `text`, `title`, `top`, `type`, `width`), plus these service-only fields:

| Field                 | Type                   | Description                                                    |
|-----------------------|------------------------|----------------------------------------------------------------|
| `content`             | `TemplateRef<unknown>` | Template rendered in place of `text`.                          |
| `descriptionTemplate` | `TemplateRef<unknown>` | Template rendered in place of `description`.                   |
| `footerTemplate`      | `TemplateRef<unknown>` | Template rendered in place of the generated action-button row. |
| `iconTemplate`        | `TemplateRef<unknown>` | Template rendered in place of the built-in `type` icon.        |
| `titleTemplate`       | `TemplateRef<unknown>` | Template rendered in place of `title`.                         |

---

<!-- verification-checklist
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
- [x] `modal` only affecting the backdrop (hasBackdrop) and not the focus trap verified against dialog.service.ts (hasBackdrop: settings.modal ?? true) and dialog-content.component.ts (trapFocus.enabled is never assigned, unlike WindowContentComponent)
- [x] Role/aria-labelledby/aria-describedby verified against dialog-content.component.ts's role()/describedById() computed signals and host bindings; confirmed no aria-modal binding exists, flagged as TODO(owner-review)
- [x] Auto-focus-in and focusedElement override verified against dialog-content.component.ts's CdkTrapFocus autoCapture + afterNextRender-driven focusElement()
- [x] Escape-key close behavior verified against dialog.service.ts passing closeOnEscape through to PopupService
- [x] Centering-when-top/left-omitted behavior verified against utils/setWindowStyles.ts, shared by both Dialog and Window
- [x] component-metadata.json regenerated via `npm run build:metadata` and cross-checked for the `closed` output and current descriptions
- [x] No internal-only symbols (DialogContentComponent, DialogInjectorData, DialogReference, DialogReferenceOptions, DialogRefParams) documented as public API
-->
