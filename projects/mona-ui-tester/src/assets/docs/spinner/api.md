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

## Service Examples

### Element Overlay

```typescript
const spinner = this.spinnerService.show({
    target: this.containerRef.nativeElement,
    text: "Saving changes..."
});

// In async completion:
spinner.close();
```

### Full-Page Overlay

Leave `target` out for the whole page, which covers open dialogs too:

```typescript
const spinner = this.spinnerService.show({
    text: "Preparing workspace..."
});

// In async completion:
spinner.close();
```

Only leaving the key out means the whole page. A `target` that's present but doesn't resolve to an element, such as a `viewChild` before its first render, shows no overlay and logs an error in development, so a spinner meant for one panel can't take over the page.

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

### RxJS `track()` Integration

Automatically starts the spinner upon subscription and closes it upon completion, error, or unsubscription:

```typescript
this.spinnerService
    .track(this.http.get("/api/items"), {
        target: this.containerRef,
        text: "Loading items..."
    })
    .subscribe(data => {
        this.items = data;
    });
```

With `cancellable`, Cancel unsubscribes from the source, which aborts an HTTP request, and completes the returned observable without its result.

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
- **`aria-busy`:** set on a targeted element while it's loading, and put back as it was afterwards. It isn't set on the body for a full-page overlay. It would tell assistive technology it can skip the whole page, including the overlay. On a targeted element the Cancel button is inside the busy region, so for a cancellable request, give users another way to reach it if your screen reader support needs it.
- **Focus:** after Cancel, or when the overlay goes with focus inside it, focus returns to where it came from.
- **It's not a modal lock:** the overlay blocks the pointer, not the keyboard. Focus stays where it was and the content behind stays reachable, so disable your own actions while they run if resubmitting would be a problem.
- **Motion and color:** every appearance honors `prefers-reduced-motion`, and stays visible in forced colors.

---

## API Matrix

### `SpinnerComponent`

**Selector:** `mona-spinner`

#### Inputs

| Name         | Type                                                                       | Default     | Description |
|--------------|----------------------------------------------------------------------------|-------------|-------------|
| `appearance` | `'default' \| 'pulsing' \| 'pulsing-triad' \| 'pulsing-ring' \| 'converging-spinner'` | `'default'` | Visual appearance of the spinner animation. |
| `aria-label` | `string`                                                                   | `'Loading'` | Accessible name when non-decorative. |
| `class`      | `string`                                                                   | `''`        | Additional CSS classes merged via `tailwind-merge`. Width and height classes scale the indicator too. |
| `decorative` | `boolean`                                                                  | `false`     | When `true`, removes the `img` role and sets `aria-hidden="true"`. Can be written as a bare attribute. |
| `size`       | `'small' \| 'medium' \| 'large'`                                           | `'medium'`  | Sizing preset (`small` ~12px, `medium` ~16px, `large` ~24px). |

---

### `SpinnerService`

#### Methods

| Method | Parameters | Return Type | Description |
|--------|------------|-------------|-------------|
| `show` | `options?: SpinnerOptions` | `SpinnerRef` | Displays a loading overlay and returns a request handle. |
| `hide` | `refOrId: SpinnerRef \| string` | `void` | Closes and removes the specified spinner request. |
| `track`| `source: Observable<T>, options?: SpinnerOptions` | `Observable<T>` | Wraps an Observable with automatic show/close lifecycle. |

#### `SpinnerOptions`

| Option | Type | Description |
|--------|------|-------------|
| `appearance` | `SpinnerAppearance` | Visual style for the spinner. |
| `cancellable` | `boolean \| SpinnerCancelOptions` | Enables cancellation action button and callbacks. |
| `delay` | `number` | Time in ms before the overlay is physically rendered on an idle target. |
| `id` | `string` | Optional unique identifier for the request. |
| `minimumVisibleDuration` | `number` | Minimum time in ms the overlay stays visible once displayed. |
| `size` | `SpinnerSize` | Size preset for the spinner indicator. |
| `target` | `HTMLElement \| ElementRef \| (HTMLElement \| ElementRef)[]` | One or more elements to overlay. Leave it out for the whole page. One that doesn't resolve to an element is skipped, with an error in development. |
| `text` | `string` | Status message displayed below the spinner. |
| `zIndex` | `number` | Custom z-index override. By default a full-page overlay sits just above CDK overlays, at `1001`, and a targeted one at `1`. |

#### `SpinnerRef`

| Member | Type | Description |
|--------|------|-------------|
| `id` | `string` | Unique request identifier. |
| `cancelled$` | `Observable<void>` | Emits when the user cancels the loading request. |
| `close()` | `() => void` | Idempotently closes the request and releases target leases. |
| `update()` | `(update: SpinnerUpdate) => void` | Dynamically updates `text`, `appearance`, or `size`. |

#### `SpinnerCancelOptions`

| Option | Type | Description |
|--------|------|-------------|
| `onCancel` | `() => void` | Called when the user cancels. |
| `text` | `string` | Button text. Defaults to the localized "Cancel". |

#### `SpinnerUpdate`

| Option | Type | Description |
|--------|------|-------------|
| `appearance` | `SpinnerAppearance` | New visual style. |
| `size` | `SpinnerSize` | New size preset. |
| `text` | `string` | New status text. |
