# Mona UI Overlays: Dialog, Window and Sheet

Dialogs, windows and sheets are the three overlays that hold a task: a question, a tool or a form. They are built on [`PopupService`](popup.md) and share one close contract, one way to pass content and data, and the same focus rules. This guide covers what they have in common; each component's page in the tester lists its full API.

|                   | Dialog                                         | Window                      | Sheet                          |
| ----------------- | ---------------------------------------------- | --------------------------- | ------------------------------ |
| Entry point       | `@nanahoshi/mona-ui/dialog`                    | `@nanahoshi/mona-ui/window` | `@nanahoshi/mona-ui/sheet`     |
| Declarative       | `<mona-dialog>`                                | `<mona-window>`             | `<mona-sheet>`                 |
| From code         | `DialogService.show()`, `confirm()`, `alert()` | `WindowService.open()`      | —                              |
| Modal by default  | Yes                                            | No                          | Always                         |
| Moves and resizes | No                                             | Pointer and keyboard        | No                             |
| Typical use       | A question or a short form                     | A tool beside the page      | Details or a form from an edge |

---

## 1. Opening

A declarative overlay opens once it renders and closes when its `@if` goes away:

```typescript
import { Component, signal } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { SheetComponent } from "@nanahoshi/mona-ui/sheet";

@Component({
    selector: "app-profile",
    imports: [ButtonDirective, SheetComponent],
    template: `
        <button monaButton (click)="editing.set(true)">Edit profile</button>
        @if (editing()) {
            <mona-sheet title="Edit profile" side="end" (closed)="editing.set(false)">
                <form>…</form>
            </mona-sheet>
        }
    `
})
export class ProfileComponent {
    protected readonly editing = signal(false);
}
```

From code, the services return a reference at once:

```typescript
import { inject } from "@angular/core";
import { DialogService } from "@nanahoshi/mona-ui/dialog";

readonly #dialogs = inject(DialogService);

discard(): void {
    this.#dialogs.confirm({ title: "Discard changes?", text: "Your changes have not been saved." }).subscribe(ok => {
        if (ok) {
            this.reset();
        }
    });
}
```

`confirm()` emits `true` for OK and `false` for any other close; `alert()` emits once the dialog closes. Both use the translated OK and Cancel labels of the active locale.

---

## 2. The Close Contract

Every close goes through the same steps, whatever caused it: an action button, the close (X) button, Escape, a backdrop click, a programmatic `close(value)`, or the declarative element being destroyed.

1. **`close`** (`DialogRef.close$`, `WindowRef.close$`) emits a `PopupCloseEvent` first. Call `event.preventDefault()` synchronously to keep the overlay open. For a dialog action, `action` (`DialogRef.action$`) emits before it and can be prevented too. A close caused by destroying the element can't be kept.
2. **`result`** (dialog only) emits one `DialogResult` as the leave animation starts, replays to late subscribers, and completes once the dialog has closed.
3. **`closed`** (`DialogRef.closed$`, `WindowRef.closed$`) emits after the leave animation, with the same result, then completes.

A second `close()` while the overlay is closing does nothing. The result says how it closed:

```typescript
const dialogRef = this.#dialogs.show<string>({
    title: "Rename",
    content: RenameComponent,
    actions: [{ text: "Cancel" }, { data: "rename", look: "primary", text: "Rename" }]
});
dialogRef.result.subscribe(result => {
    if (result.viaClose) {
        // Closed by close(value), the X button, Escape or the backdrop: result.value and result.via.
    } else if (result.action.data === "rename") {
        // An action button.
    }
});
```

A window's `closed$` carries a `WindowResult`: `{ value, via }`, where `value` is what was passed to `close(value)`. `via` is a `PopupCloseSource` (from `@nanahoshi/mona-ui/popup`): `"action"`, `"closeButton"`, `"escape"`, `"backdropClick"`, `"programmatic"` and so on.

To ask before closing, prevent the close and decide:

```typescript
protected onClose(event: PopupCloseEvent): void {
    if (this.form.dirty()) {
        event.preventDefault();
    }
}
```

---

## 3. Content, Data and Injectors

Content can be a template or a component. Data reaches it the same way for dialogs and windows:

|           | Template                                                  | Component                                     |
| --------- | --------------------------------------------------------- | --------------------------------------------- |
| Data      | The implicit context: `let-data`                          | `inject(DIALOG_DATA)` / `inject(WINDOW_DATA)` |
| Reference | `let-dialogRef="dialogRef"` / `let-windowRef="windowRef"` | `inject(DialogRef)` / `inject(WindowRef)`     |

```typescript
@Component({ template: `<p>Rename {{ data.name }}?</p>` })
export class RenameComponent {
    protected readonly data = inject<{ name: string }>(DIALOG_DATA);
    protected readonly dialogRef = inject(DialogRef<string>);
}

readonly #injector = inject(Injector);

rename(file: { name: string }): void {
    this.#dialogs.show<string, { name: string }>({
        content: RenameComponent,
        data: file,
        injector: this.#injector,
        title: "Rename file"
    });
}
```

Pass `injector` so the content can inject what the opener provides: a feature's services, a form's providers, a route's data. Without it, the content resolves from the root injector. `DialogRef.component` and `WindowRef.component` return the created component.

---

## 4. Modality and Focus

A modal overlay (every sheet, dialogs by default, windows with `[modal]="true"`):

- has a backdrop and `aria-modal="true"`;
- keeps focus inside it: Tab and Shift+Tab can't leave;
- locks page scroll;
- makes the rest of the page `inert`, so the pointer, Tab and screen readers can't reach it.

Popups opened from inside it (a dropdown, a date picker, a menu) stay usable, and stacked modal overlays keep the page inert until the last one closes.

On open, focus moves to the first focusable element, or to `focusedElement` when it's given. On close, it returns to the element that had it before, if it can still take focus; a dialog's `restoreFocus: false` leaves it where it is.

A non-modal dialog or window traps nothing: Tab can leave it, and the page stays usable. Pressing or focusing a window raises it above the other windows.

---

## 5. Names

Each overlay renders `role="dialog"` and needs a name: a `title` (or title template), or `aria-label` when there's no visible title (`ariaLabel` in `DialogService` and `WindowService` settings). In development mode, an overlay without one logs a warning.

```html
<mona-dialog aria-label="Keyboard shortcuts">
    <ng-template monaDialogContentTemplate>…</ng-template>
</mona-dialog>
```

A dialog's `description` (or `monaDialogDescriptionTemplate`) and a sheet's `description` describe it through `aria-describedby`.

---

## 6. Position and Direction

- **Dialog and window:** centered, unless `top` or `left` is given; each axis is independent, so `top` alone keeps the overlay centered horizontally. `left` is physical, measured from the left edge in right-to-left pages too. Both stay within the viewport unless `maxWidth`/`maxHeight` say otherwise, and the body scrolls when the content is taller.
- **Window:** dragging, resizing or the title bar's arrow keys fix both axes where the window is; `move()` fixes the axes it's given and `center()` centers again.
- **Sheet:** `side` is `"top"`, `"bottom"`, `"left"`, `"right"`, `"start"` or `"end"`. `left` and `right` are physical; `start` and `end` follow the text direction at the moment the sheet opens.

See the [i18n & RTL Guide](i18n.md) for how components resolve direction.
