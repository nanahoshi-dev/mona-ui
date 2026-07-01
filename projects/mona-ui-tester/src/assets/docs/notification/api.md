## Overview & Component Selection

Notifications are shown imperatively through `NotificationService`, not by placing `<mona-notification>` directly in a template. The service dynamically creates a `mona-notification-container` (one per screen `position`) and mounts each notification inside it.

**Use `NotificationService` when you need to:**

- Show a transient toast message in response to an action (save success, validation error, background task completion)
- Auto-dismiss a message after a delay, optionally with a visible countdown
- Render custom content (a string, an `ng-template`, or an arbitrary component) inside a notification

**Use a closely related Mona UI component instead when:**

- The message must remain visible and interactive indefinitely as part of the page layout — use an inline alert/banner instead. Notification is only for transient, dismissible messages.
- You need a modal, focus-trapping interruption — use `Dialog` or `Window`. Notification is non-modal and never steals focus.

## Import & Quick Start

```typescript
import { NotificationService } from "@mirei/mona-ui";
```

Inject `NotificationService` (it is `providedIn: "root"`, so no module setup is required) and call `show()`:

```typescript
export class MyComponent {
    readonly #notificationService = inject(NotificationService);

    save(): void {
        this.#notificationService.show({
            type: "success",
            content: "Your changes have been saved.",
            duration: 4000,
            progressBar: true
        });
    }
}
```

## NotificationService

`NotificationService` is the entire public surface consumers interact with directly — there is no notification component to place in a template. It is a root-provided (`providedIn: "root"`) singleton, so a single instance manages every notification across the application, grouped by screen `position`.

| Method | Description |
|---|---|
| `hide(id: string): void` | Closes the notification with the given `id`, wherever its container is positioned. No-op if no notification with that `id` is currently shown. |
| `hideAll(): void` | Closes every currently visible notification, across all positions. |
| `show(options: NotificationOptions): NotificationRef` | Creates a notification and returns a `NotificationRef`. If a notification with the same `id` already exists at the resolved `position`, returns a ref to that existing notification instead of creating a duplicate. |

See [Anatomy & Options Resolution](#anatomy--options-resolution) for how `show()` fills in defaults, and [API](#api) for the full `NotificationOptions` / `NotificationRef` shapes.

## Anatomy & Options Resolution

`show()` resolves defaults before creating the notification:

| Option | Resolved default when omitted |
|---|---|
| `id` | A generated identifier |
| `position` | `"topright"` |
| `type` | `"info"` |
| `title` | Derived from `type` (e.g. `"Info"`, `"Success"`, `"Warning"`, `"Error"`) |
| `closable` | `true`, but only when `duration` is also omitted — see [Dismissal](#dismissal) |

`show()` does not mutate the `options` object passed to it.

## Feature Examples

### Dismissal

If you don't supply `closable` or `duration`, `closable` defaults to `true` so the notification always renders a close button. If you supply `duration`, the notification auto-dismisses after that many milliseconds and `closable` is left as you set it.

The auto-dismiss countdown pauses while the notification is hovered or focused, and resumes when the pointer leaves or focus moves away, so a user reading a notification never loses it mid-read.

```typescript
// Dismissible by default (no duration, no closable) — user must close it manually.
this.#notificationService.show({ content: "Manual dismiss only." });

// Auto-dismisses after 5s; no close button unless closable is set explicitly.
this.#notificationService.show({ content: "Auto-dismissing.", duration: 5000 });

// Both: closable AND auto-dismissing.
this.#notificationService.show({ content: "Either way.", duration: 5000, closable: true });
```

### Content types

`content` accepts a plain string, a `TemplateRef`, or a component `Type`:

```typescript
this.#notificationService.show({ content: "Plain text notification." });

this.#notificationService.show({ content: this.myTemplateRef });

this.#notificationService.show({ content: MyCustomNotificationComponent });
```

### Positioning and scoping

Notifications are grouped into one container per `position` (`"top"`, `"topleft"`, `"topright"`, `"bottom"`, `"bottomleft"`, `"bottomright"`), appended to `document.body` by default:

```typescript
this.#notificationService.show({ content: "Bottom-left toast.", position: "bottomleft" });
```

Pass `appendTo` (a `ViewContainerRef`) to scope the notification container to a specific element instead of the document body — useful for notifications confined to a panel or card:

```typescript
this.#notificationService.show({ content: "Scoped notification.", appendTo: this.scopedContainer() });
```

### Managing a notification after showing it

`show()` returns a `NotificationRef`:

```typescript
const ref = this.#notificationService.show({ content: "Uploading…", id: "upload-1" });

ref.afterHide.subscribe(() => console.log("Notification closed"));
ref.hide();
```

Calling `show()` again with the same `id` (at the same `position`) returns the existing `NotificationRef` instead of creating a duplicate notification. Use `NotificationService.hide(id)` or `NotificationService.hideAll()` to close notifications without holding onto a `NotificationRef`.

## Technical & Behavior Notes

**A notification is only guaranteed dismissible through its options, not through a fixed default.** Explicitly setting `closable: false` together with no `duration` produces a notification with no close button and no auto-dismiss timer, which the user cannot dismiss. Set at least one of `closable` or `duration` for any notification the user must be able to close.

**Reusing an `id` does not update an already-shown notification's content.** If a notification with the given `id` already exists at the resolved `position`, `show()` returns a ref to the existing notification and the new `options` (including a different `content`) are discarded.

**`id` uniqueness is scoped per `position`.** The same `id` at two different positions creates two independent notifications.

## Accessibility & Forms Integration

### Keyboard

No keyboard handling is implemented by the notification itself beyond the close button's native `<button>` behavior (Enter / Space) when `closable` is `true`.

### ARIA

| Attribute | When present | Value |
|---|---|---|
| `role` | Always | `"alert"` for `type: "error"` or `"warning"`; `"status"` for `type: "info"` or `"success"` |
| `aria-live` | Always | `"assertive"` for `type: "error"` or `"warning"`; `"polite"` for `type: "info"` or `"success"` |

`error` and `warning` notifications interrupt screen readers immediately. `info` and `success` notifications are announced without interrupting the user's current task.

**Consumer responsibilities:**

- The close button's accessible name defaults to `"Close"`; set `closeTitle` to override it.
- When using a custom component or `TemplateRef` as `content`, the consumer is responsible for that content's own accessibility (labels, focus order, etc.) — the notification only manages the outer `role`/`aria-live` container.

### Forms

Not applicable — Notification does not accept or emit user input and has no form control integration.

## API

### `NotificationService`

Injectable, `providedIn: "root"`. See [NotificationService](#notificationservice) for a description of each method.

| Method | Description |
|---|---|
| `hide(id: string): void` | Closes the notification with the given `id`. |
| `hideAll(): void` | Closes every currently visible notification. |
| `show(options: NotificationOptions): NotificationRef` | Creates (or reuses, by `id`) a notification. |

### `NotificationOptions`

| Name | Type | Default | Description |
|---|---|---|---|
| `appendTo` | `ViewContainerRef \| undefined` | `undefined` (appends to `document.body`) | The container to append the notification's container to. |
| `closable` | `boolean \| undefined` | `true` when `duration` is not set, otherwise `undefined` | Whether a close button is rendered. |
| `closeTitle` | `string \| undefined` | `"Close"` | The accessible title/tooltip for the close button. |
| `content` | `string \| TemplateRef<unknown> \| Type<unknown>` | — | The notification's content. |
| `duration` | `number \| undefined` | `undefined` (stays open until manually closed) | Time, in milliseconds, before the notification auto-closes. |
| `height` | `number \| string \| undefined` | `undefined` | The notification's height; a number is treated as pixels. |
| `id` | `string \| undefined` | A generated identifier | A unique identifier, scoped per `position`; reusing an `id` returns the existing notification. |
| `position` | `NotificationPosition \| undefined` | `"topright"` | The screen position the notification is anchored to. |
| `progressBar` | `boolean \| undefined` | `undefined` | Whether a countdown progress bar is displayed for a timed notification. |
| `title` | `string \| undefined` | Derived from `type` (e.g. `"Info"`, `"Success"`) | The notification's title. |
| `type` | `NotificationType \| undefined` | `"info"` | Controls icon, color, and the ARIA `role`/`aria-live` combination — see [Accessibility & Forms Integration](#accessibility--forms-integration). |
| `width` | `number \| string \| undefined` | `undefined` | The notification's width; a number is treated as pixels. |

### `NotificationRef`

| Name | Type | Description |
|---|---|---|
| `afterHide` | `Observable<void>` | Emits once the notification has finished closing and been removed. |
| `content` | `ComponentRef<unknown> \| null` | The dynamically created content component's reference, or `null` for string/template content. |
| `hide(): void` | — | Closes the notification. |

### Exported Types

#### `NotificationPosition`

```typescript
type NotificationPosition = "bottom" | "bottomleft" | "bottomright" | "top" | "topleft" | "topright";
```

#### `NotificationType`

```typescript
type NotificationType = "error" | "info" | "success" | "warning";
```

---

<!-- verification-checklist
- [x] API definitions and defaults verified against notification.service.ts, NotificationOptions.ts, NotificationRef.ts, NotificationPosition.ts, NotificationType.ts, and notification.component.html/ts
- [x] show() default resolution (id, position, type, title, closable) verified in NotificationService.show()
- [x] closable default (true only when duration is also unset) verified against the resolvedOptions expression in show()
- [x] show() confirmed to not mutate the caller's options object (spreads into a new resolvedOptions object)
- [x] Duplicate-id reuse (same id at same position returns existing ref, new options discarded) verified in show()
- [x] id uniqueness scoped per position verified via notificationContainerMap keyed by NotificationPosition
- [x] Auto-dismiss pause-on-hover/focus and resume-on-leave/blur verified via host pointerenter/pointerleave/focusin/focusout bindings in notification.component.ts
- [x] role/aria-live mapping (alert/assertive for error|warning, status/polite for info|success) verified via the role()/ariaLive() computed signals and [attr.role]/[attr.aria-live] bindings in notification.component.html
- [x] Close button default accessible name ("Close") and closeTitle override verified in notification.component.html
- [x] appendTo scoping to a ViewContainerRef vs. default document.body verified in NotificationService.createContainerComponent()
- [x] No keyboard handling beyond the native close button confirmed; no other keyboard behavior implemented
- [x] Not a form control; no CVA/signal-forms integration exists — documented as Not applicable
- [x] No internal or unexported APIs exposed
- [x] API tables sorted A→Z within each section
- [x] Basic examples compile against the public API surface
-->
