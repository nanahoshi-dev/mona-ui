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
            <mona-spinner />
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

```typescript
const spinner = this.spinnerService.show({
    text: "Preparing workspace..."
});

// In async completion:
spinner.close();
```

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

### Concurrency Guarantees

When multiple independent operations target the same element:
- Exactly **one physical overlay** is created.
- The latest active request controls the visible text/appearance.
- Closing one operation falls back to the remaining active operations without removing the overlay until all requests finish.

---

## API Matrix

### `SpinnerComponent`

**Selector:** `mona-spinner`

#### Inputs

| Name         | Type                                                                       | Default     | Description |
|--------------|----------------------------------------------------------------------------|-------------|-------------|
| `appearance` | `'default' \| 'pulsing' \| 'pulsing-triad' \| 'pulsing-ring' \| 'converging-spinner'` | `'default'` | Visual appearance of the spinner animation. |
| `aria-label` | `string`                                                                   | `'Loading'` | Accessible text announced by assistive technology when non-decorative. |
| `class`      | `string`                                                                   | `''`        | Additional CSS classes merged via `tailwind-merge`. |
| `decorative` | `boolean`                                                                  | `false`     | When `true`, removes status semantics and sets `aria-hidden="true"`. |
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
| `target` | `HTMLElement \| ElementRef \| (HTMLElement \| ElementRef)[]` | One or more elements to overlay. Defaults to page-level. |
| `text` | `string` | Status message displayed below the spinner. |
| `zIndex` | `number` | Custom z-index override. |

#### `SpinnerRef`

| Member | Type | Description |
|--------|------|-------------|
| `id` | `string` | Unique request identifier. |
| `cancelled$` | `Observable<void>` | Emits when the user cancels the loading request. |
| `close()` | `() => void` | Idempotently closes the request and releases target leases. |
| `update()` | `(update: SpinnerUpdate) => void` | Dynamically updates `text`, `appearance`, or `size`. |
