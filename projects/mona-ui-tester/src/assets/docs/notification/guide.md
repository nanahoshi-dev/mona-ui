## Overview

Notifications are shown imperatively through `NotificationService`, not by placing `<mona-notification>` directly in a template. The service dynamically creates a `mona-notification-container` (one per screen `position`) and mounts each notification inside it.

**Use `NotificationService` when you need to:**

- Show a transient toast message in response to an action (save success, validation error, background task completion)
- Auto-dismiss a message after a delay, optionally with a visible countdown
- Render custom content (a string, an `ng-template`, or an arbitrary component) inside a notification

**Use a closely related Mona UI component instead when:**

- The message must remain visible and interactive indefinitely as part of the page layout — use an inline alert/banner instead. Notification is only for transient, dismissible messages.
- You need a modal, focus-trapping interruption — use `Dialog` or `Window`. Notification is non-modal and never takes focus when it appears.

## Import & Quick Start

```typescript
import { NotificationService } from "@nanahoshi/mona-ui/notification";
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

### NotificationService

`NotificationService` is the entire public surface consumers interact with directly — there is no notification component to place in a template. It is a root-provided (`providedIn: "root"`) singleton, so a single instance manages every notification across the application, grouped by screen `position`.

| Method                                                | Description                                                                                                                                                                                                          |
|-------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `hide(id: string): void`                              | Closes the notification with the given `id`, wherever its container is positioned. No-op if no notification with that `id` is currently shown.                                                                       |
| `hideAll(): void`                                     | Closes every currently visible notification, across all positions.                                                                                                                                                   |
| `show(options: NotificationOptions): NotificationRef` | Creates a notification and returns a `NotificationRef`. If a notification with the same `id` already exists at the resolved `position`, returns a ref to that existing notification instead of creating a duplicate. |

See [Anatomy & Options Resolution](#anatomy) for how `show()` fills in defaults, and [API](#api) for the full `NotificationOptions` / `NotificationRef` shapes.

## Anatomy

`show()` resolves defaults before creating the notification:

| Option     | Resolved default when omitted                                            |
|------------|--------------------------------------------------------------------------|
| `id`       | A generated identifier                                                   |
| `position` | `"topright"`                                                             |
| `type`     | `"info"`                                                                 |
| `title`    | Derived from `type` (e.g. `"Info"`, `"Success"`, `"Warning"`, `"Error"`) |
| `closable` | `true`, for timed notifications too — see [Dismissal](#dismissal)        |

`show()` does not mutate the `options` object passed to it.

## Examples

### Types

`type` sets the icon, the color and how urgently the notification is announced. These close after 5 seconds and show a countdown bar.

```example
notification/types
```

### Template content

A template gets the `NotificationRef` as its implicit context and the `data` as `data`.

```example
notification/template
```

### Updating a notification

`update()` changes the content, title, type or close button of a notification that is already shown, and announces the new message.

```example
notification/update
```

### Dismissal

Every notification has a close button unless you set `closable: false`, timed ones included, so a user can dismiss a message before its time is up. With `duration`, the notification also closes on its own after that many milliseconds.

The countdown pauses while the pointer is over the notification, while focus is inside it, and while the browser window is in the background. Hover and focus are tracked separately, so moving the pointer away doesn't restart it while focus is still inside. It resumes with the time that was left, measured by the clock, so a short notification isn't stretched by a slow or throttled tab.

```typescript
// No duration: stays until the user closes it.
this.#notificationService.show({ content: "Manual dismiss only." });

// Closes after 5s, and has a close button.
this.#notificationService.show({ content: "Auto-dismissing.", duration: 5000 });

// Closes after 5s, with no close button. Avoid this for messages users need time to read.
this.#notificationService.show({ content: "Brief.", duration: 5000, closable: false });
```

### Application-wide defaults

`provideNotificationDefaults()` sets how every notification behaves, for example to let users turn auto-hide off (WCAG 2.2.1):

```typescript
import { provideNotificationDefaults } from "@nanahoshi/mona-ui/notification";

bootstrapApplication(AppComponent, {
    providers: [provideNotificationDefaults({ autoHide: false, maxVisible: 3 })]
});
```

| Default             | Value  | Effect                                                                             |
|---------------------|--------|------------------------------------------------------------------------------------|
| `autoHide`          | `true` | Whether notifications with a `duration` close on their own.                        |
| `durationScale`     | `1`    | A factor applied to every `duration`; `2` keeps notifications twice as long.       |
| `maxVisible`        | none   | The most notifications shown at once per position. The oldest closes to make room. |
| `pauseOnWindowBlur` | `true` | Whether the countdown pauses while the browser window doesn't have focus.          |

### Content types

`content` accepts a plain string, a `TemplateRef`, or a component `Type`. Pass `data` for a template or component to use:

```typescript
this.#notificationService.show({ content: "Plain text notification." });

this.#notificationService.show({ content: this.undoTemplate, data: { file: "report.pdf" } });

this.#notificationService.show({ content: UploadNotificationComponent, data: { fileName: "report.pdf" } });
```

A template gets the `NotificationRef` as its implicit context and the `data` as `data` (see the template example above). A component injects them:

```typescript
@Component({ template: `<p class="p-2">Uploading {{ data.fileName }}…</p>` })
export class UploadNotificationComponent {
    protected readonly data = inject<{ fileName: string }>(NOTIFICATION_DATA);
    protected readonly ref = inject(NOTIFICATION_REF);
}
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
ref.update({ content: "Upload complete.", type: "success" });
ref.hide();
```

`update()` changes the content, title, type or close button of a notification that is already shown, and announces the new message. `afterHide` emits once the notification's leave animation has ended and it has been removed.

Calling `show()` again with the same `id` (at the same `position`) returns the existing `NotificationRef` instead of creating a duplicate notification. Use `NotificationService.hide(id)` or `NotificationService.hideAll()` to close notifications without holding onto a `NotificationRef`.

## Behavior

**`closable: false` with no `duration` can't be dismissed by the user.** Close it yourself with `ref.hide()` or `hide(id)`.

**Reusing an `id` doesn't change an already-shown notification.** `show()` returns the existing ref and discards the new `options`; call `ref.update()` to change it.

**`id` uniqueness is scoped per `position`.** The same `id` at two different positions creates two independent notifications.

**Notifications at one position share a container**, created when the first is shown and removed with the last. A notification shown and hidden in the same tick leaves nothing behind. A container on `document.body` takes the app's direction and the active Mona locale as `dir` and `lang`.

**The countdown bar is drawn in the type's theme color**, through its CSS variable, so it follows a theme switch. Reduced motion turns the enter and leave animations off.

## Forms Integration

Not applicable. Notification does not accept or emit user input and has no form control integration.

## Accessibility

### Keyboard

The close button is a native `<button>` (Enter / Space). When a notification closes while it has focus, focus moves to the next notification that can take it, or back to where it was before it entered the notifications.

### Announcements and ARIA

Each notification is announced through the CDK `LiveAnnouncer` once it has rendered, and again after `update()`: politely for `info` and `success`, assertively for `error` and `warning`. The notification itself isn't a live region, since one inserted with its text already in it is often skipped by screen readers. The announcement is the title and the text for string content, or the rendered text of a template or component.

| Element               | Attribute     | Value                                                 |
|-----------------------|---------------|-------------------------------------------------------|
| Container             | `role`        | `"region"`                                            |
| Container             | `aria-label`  | `"Notifications"` (the `notification.region` message) |
| Countdown bar wrapper | `aria-hidden` | `"true"`: the time left isn't announced               |
| Close button          | `aria-label`  | `closeTitle`, or the localized `"Close"`              |

**Consumer responsibilities:**

- The close button's accessible name defaults to `"Close"`; set `closeTitle` to override it.
- When using a custom component or `TemplateRef` as `content`, the consumer is responsible for that content's own accessibility (labels, focus order, etc.). Its rendered text is what gets announced.
- Give users enough time: keep a close button on timed notifications, and consider `provideNotificationDefaults({ autoHide: false })` or a `durationScale` as a user setting.

<!-- verification-checklist
- [x] API definitions and defaults verified against notification.service.ts, NotificationOptions.ts, NotificationRef.ts, NotificationDefaults.ts, notification.tokens.ts and notification.component.html/ts
- [x] closable defaults to true for timed notifications too (spec: close button on a 300 ms notification)
- [x] Same-tick show/hide leaves no container (container created synchronously; spec with 20 pairs and show b / hide b / show c)
- [x] Countdown measured with performance.now() and paused separately for hover, focus and window blur (specs with fake timers)
- [x] provideNotificationDefaults: autoHide, durationScale, maxVisible, pauseOnWindowBlur (specs)
- [x] LiveAnnouncer announcements (polite / assertive by type), again on update(); no role=status/alert in the DOM (spec)
- [x] Container is role=region named by the new notification.region message (14 catalogs), with dir and lang on body containers
- [x] Progress bar wrapper aria-hidden; color through var(--color-<type>) (specs)
- [x] Focus handed to the next notification, then back to where it came from (spec)
- [x] NOTIFICATION_REF / NOTIFICATION_DATA for components; $implicit ref and data for templates (specs)
- [x] afterHide after the leave animation (spec dispatches animationend)
- [x] Not a form control; no CVA/signal-forms integration exists — documented as Not applicable
- [x] API tables sorted A→Z within each section
- [x] Basic examples compile against the public API surface
-->
