## Overview & Usage Guidelines

The Collapsible API is split into three directives:

- `CollapsibleDirective` is the headless root. It owns the `expanded` state and provides programmatic controls.
- `CollapsibleTriggerDirective` toggles the nearest root and wires disclosure attributes to the trigger element.
- `CollapsibleContentDirective` marks the content region, connects it to the trigger, and animates its measured height.

The directives add no wrapper elements. Apply them directly to the elements that should act as the root, trigger, and content region.

## Import & Basic Usage

```typescript
import { Component, signal } from "@angular/core";
import {
    CollapsibleContentDirective,
    CollapsibleDirective,
    CollapsibleTriggerDirective
} from "@nanahoshi/mona-ui/collapsible";
```

Add the directives to a standalone component's `imports` array and bind the root's `expanded` model:

```typescript
@Component({
    selector: "app-project-details",
    imports: [CollapsibleContentDirective, CollapsibleDirective, CollapsibleTriggerDirective],
    template: `
        <section monaCollapsible [(expanded)]="expanded">
            <button monaCollapsibleTrigger type="button">Project details</button>
            <div monaCollapsibleContent>
                <p>Details are shown while the region is expanded.</p>
            </div>
        </section>
    `
})
export class ProjectDetailsComponent {
    protected readonly expanded = signal(false);
}
```

The trigger and content directives find their nearest `[monaCollapsible]` root through the directive context. A root can be applied to a `div`, `section`, `li`, or another suitable container.

## State & Behavior

### Two-way state

Use `[(expanded)]` when the consumer needs to observe and control the open state:

```html
<section monaCollapsible [(expanded)]="isOpen">
    <button monaCollapsibleTrigger type="button">Advanced options</button>
    <div monaCollapsibleContent>Optional settings</div>
</section>
```

### Programmatic control

The root is exported as `monaCollapsible`, so `expand()`, `collapse()`, and `toggle()` can be called from a template reference:

```html
<section monaCollapsible #details="monaCollapsible">
    <button monaCollapsibleTrigger type="button">Details</button>
    <div monaCollapsibleContent>More information</div>
</section>

<button type="button" (click)="details.expand()">Show details</button>
<button type="button" (click)="details.collapse()">Hide details</button>
```

`disabled` prevents trigger interaction but does not block these programmatic methods. Set `animate` to `false` when the consumer wants to provide its own content transition.

### Content height

The content directive publishes its measured height as the `--mona-collapsible-content-height` custom property. Pair `[animate]="false"` with a consumer-owned transition when the built-in height transition is not suitable.

## Accessibility Notes

Use a native `button` or `a` element for the trigger when possible. The trigger directive automatically manages the disclosure relationship:

| Attribute | Behavior |
|-----------|----------|
| `aria-expanded` | Reflects the root's current `expanded` state. |
| `aria-controls` | References the generated `id` on the content element. |
| `aria-disabled` | Set to `"true"` when the root is disabled. |

Native button triggers receive `type="button"` and use the browser's native role, focusability, and disabled behavior. Other trigger elements receive `role="button"` and `tabindex="0"`; `Enter` and `Space` toggle the root and prevent their default action. A non-native trigger becomes unfocusable (`tabindex="-1"`) while disabled.

The content element is marked `inert` while collapsed, preventing focus from entering content that is not currently available. Give every trigger an accessible name through visible text or an appropriate ARIA naming attribute.

## API

### `CollapsibleDirective`

**Selector:** `[monaCollapsible]`

Headless root directive. It adds `data-state="open"` or `data-state="closed"` to its host and exposes itself as `monaCollapsible`.

#### Inputs and model

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `animate` | `boolean` | `true` | Enables the height transition applied by `CollapsibleContentDirective`. |
| `disabled` | `boolean` | `false` | Suppresses trigger toggling. `expand()`, `collapse()`, and `toggle()` remain available programmatically; `toggle()` is a no-op while disabled. |
| `expanded` | `boolean` | `false` | Two-way bindable open state. Use `[(expanded)]` for two-way binding. |

#### Public properties and methods

| Name | Type | Description |
|------|------|-------------|
| `contentId` | `string` | Generated ID assigned to the content element and referenced from the trigger's `aria-controls`. |
| `expand()` | `void` | Sets `expanded` to `true`. |
| `collapse()` | `void` | Sets `expanded` to `false`. |
| `toggle()` | `void` | Toggles `expanded` unless the root is disabled. |

### `CollapsibleTriggerDirective`

**Selector:** `[monaCollapsibleTrigger]`

Toggles the nearest `CollapsibleDirective` on click and supported keyboard activation. It has no public inputs or outputs.

### `CollapsibleContentDirective`

**Selector:** `[monaCollapsibleContent]`

Marks the content element with the root's generated ID, `data-state`, and collapsed `inert` state. It has no public inputs or outputs.

### `CollapsibleConfig`

Public interface describing the state and control methods exposed by a collapsible root to paired directives. Most consumers can use the directives directly and do not need to implement or inject this interface.

---

<!-- verification-checklist
- [x] Root, trigger, and content selectors verified against the public API
- [x] Inputs, model, methods, generated content ID, and disabled behavior verified against source
- [x] Trigger ARIA and keyboard behavior verified against source and focused directive spec
- [x] Content inert state and custom height property verified against source
- [x] No internal DOM structure or unexported helpers exposed
-->
