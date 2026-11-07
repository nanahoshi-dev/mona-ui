## Overview & Usage Guidelines

Use `SpinnerComponent` for inline indeterminate loading indicators, or `SpinnerService` to show loading overlays over specific elements or the entire page.

### Features
- **Visual Primitive (`SpinnerComponent`)**: Lightweight CSS-driven animations, reduced-motion safe, and inherits color through `currentColor`.
- **Imperative Service (`SpinnerService`)**: Manages logical loading requests, handles concurrency with **at most one physical overlay per target**, and provides delays, minimum visible durations, cancellation, and RxJS `track()` integration.

---

## Import & Basic Usage

```typescript
import { Component, inject } from "@angular/core";
import { SpinnerComponent, SpinnerService } from "@nanahoshi/mona-ui/spinner";

@Component({
    imports: [SpinnerComponent],
    template: `
        <!-- Standalone inline spinner -->
        <mona-spinner appearance="default" size="medium" />

        <!-- Composed with text and semantic colors -->
        <div class="flex items-center gap-2 text-primary">
            <mona-spinner decorative />
            <span>Loading profile...</span>
        </div>
    `
})
export class MyComponent {
    private readonly spinnerService = inject(SpinnerService);

    public loadData(targetElement: HTMLElement): void {
        const spinner = this.spinnerService.show({
            target: targetElement,
            text: "Loading records..."
        });

        // Close when operation completes
        // spinner.close();
    }
}
```

---

## Examples

### Appearances

Every appearance inherits its color through `currentColor`. Use `decorative` when visible text says the same thing.

```example
spinner/inline
```

### Element overlay

`show()` with a `target` covers that element until you call `close()` on the returned `SpinnerRef`.

```example
spinner/overlay
```

### Tracking an observable

`track()` starts the spinner upon subscription and closes it upon completion, error, or unsubscription. With `cancellable`, Cancel unsubscribes from the source, which aborts an HTTP request, and completes the returned observable without its result. An `onCancel` you gave still runs.

```example
spinner/track
```

---

## Service Examples

### Full-Page Overlay

Leave `target` out for the whole page. At z-index `1001` it sits above CDK overlays, so it covers open dialogs too:

```typescript
const spinner = this.spinnerService.show({
    text: "Preparing workspace..."
});

// In async completion:
spinner.close();
```

Only leaving the key out means the whole page. A `target` that's present but doesn't resolve to an element, such as `undefined` from a `viewChild` before its first render, shows no overlay and logs an error in development, so a spinner meant for one panel can't take over the page.

### Delay & Anti-Flicker

Short operations finishing before `delay` (in ms) never create a physical DOM overlay:

```typescript
const spinner = this.spinnerService.show({
    target: this.containerRef,
    delay: 150
});
```

### Minimum Visible Duration

Prevents flash-of-loading by keeping the spinner visible for at least `minimumVisibleDuration` ms:

```typescript
const spinner = this.spinnerService.show({
    target: this.containerRef,
    minimumVisibleDuration: 300
});
```

### Cancellation

```typescript
const controller = new AbortController();

const spinner = this.spinnerService.show({
    target: this.containerRef,
    text: "Downloading dataset...",
    cancellable: {
        text: "Cancel Download",
        onCancel: () => controller.abort()
    }
});

// Or listen via Observable:
spinner.cancelled$.subscribe(() => {
    console.log("Spinner was cancelled by user");
});
```

The button text is localized unless you give your own. While `minimumVisibleDuration` keeps a closed spinner on screen, the button is gone, because there's nothing left to cancel.

### Concurrency Guarantees

When multiple independent operations target the same element:
- Exactly **one physical overlay** is created.
- The latest active request controls the visible text/appearance.
- Closing one operation falls back to the remaining active operations without removing the overlay until all requests finish. A request still in its `delay` shows at once if it's all that's left.
- `minimumVisibleDuration` holds the overlay for the longest asked for by any request on the target.

---

## Accessibility Notes

### Inline spinner

`mona-spinner` is `role="img"` with a localized "Loading" name, or your `aria-label`. A screen reader finds it when it gets there, but it isn't announced when it appears. To announce loading, use `SpinnerService`, or put the text in a live region that's already on the page. Use `decorative` when visible text says the same thing.

### Service overlays

- **Announcing:** the service announces through the CDK `LiveAnnouncer` when a request becomes visible, with its `text` or the localized "Loading". A later `update({ text })` is read out too, at most once every 5 seconds, ending on the latest text.
- **`aria-busy`:** set on a targeted element from the moment of the request, including its `delay`, and put back as it was afterwards. It isn't set on the body for a full-page overlay. It would tell assistive technology it can skip the whole page, including the overlay. On a targeted element the Cancel button is inside the busy region, so for a cancellable request, give users another way to reach it if your screen reader support needs it.
- **Focus:** when the Cancel button goes with focus on it, because it was pressed, the request closed, another request on the same target took over without a Cancel button of its own, or `minimumVisibleDuration` is holding a closed spinner on screen, focus returns to where it came from.
- **It's not a modal lock:** the overlay blocks the pointer, not the keyboard. Focus stays where it was and the content behind stays reachable, so disable your own actions while they run if resubmitting would be a problem.
- **Motion and color:** every appearance honors `prefers-reduced-motion`, and stays visible in forced colors.
