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

`disabled` prevents trigger interaction and makes `toggle()` do nothing, but `expand()` and `collapse()` still work. Set `animate` to `false` when the consumer wants to provide its own content transition.

### Content height

The content directive publishes its measured height as the `--mona-collapsible-content-height` custom property. Pair `[animate]="false"` with a consumer-owned transition when the built-in height transition is not suitable. The built-in one is also skipped when the user asks for reduced motion.

### Padded content

The directive sets the content element's height, block padding and block border inline, so that nothing shows while it's closed. Those inline values are removed when it opens, along with any you set there yourself. Padding from a class survives that, and padding in `style` or a `[style.*]` binding doesn't, so the safe place for padding is an inner element:

```html
<section monaCollapsible>
    <button monaCollapsibleTrigger type="button">Details</button>
    <div monaCollapsibleContent>
        <div class="p-4">More information</div>
    </div>
</section>
```

## Accessibility Notes

Use a native `button` or `a` element for the trigger when possible. The trigger directive automatically manages the disclosure relationship:

| Attribute | Behavior |
|-----------|----------|
| `aria-expanded` | Reflects the root's current `expanded` state. |
| `aria-controls` | References the `id` on the content element, generated unless you gave it one. |
| `aria-disabled` | Set to `"true"` when the root is disabled. |

Native button triggers receive `type="button"` and use the browser's native role, focusability, and disabled behavior. A native `input` is disabled the same way, and a disabled `summary` doesn't open its `details`. Other trigger elements receive `role="button"` and `tabindex="0"`; `Enter` and `Space` toggle the root and prevent their default action. A non-native trigger, or an `a`, becomes unfocusable (`tabindex="-1"`) while disabled, and a disabled `a` doesn't follow its `href`.

A control inside a trigger, such as a button or an input in a `div` used as one, keeps its own clicks and keys, and doesn't toggle the root.

The content element is marked `inert` while collapsed, preventing focus from entering content that is not currently available. Its collapsed height is set in the first pass, so collapsed content doesn't paint open. Give every trigger an accessible name through visible text or an appropriate ARIA naming attribute.

## API

### `CollapsibleDirective`

**Selector:** `[monaCollapsible]`

Headless root directive. It adds `data-state="open"` or `data-state="closed"` to its host and exposes itself as `monaCollapsible`.

#### Inputs

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `animate` | `boolean` | `true` | Enables the height transition applied by `CollapsibleContentDirective`. |
| `disabled` | `boolean` | `false` | Suppresses trigger toggling, and `toggle()` does nothing while it's on. `expand()` and `collapse()` still work. |
| `expanded` | `boolean` | `false` | Two-way bindable open state. Use `[(expanded)]` for two-way binding. |

#### Outputs

| Name | Type | Description |
|------|------|-------------|
| `expandedChange` | `boolean` | Emitted when the open state changes. |

#### Public properties and methods

| Name | Type | Description |
|------|------|-------------|
| `contentId` | `string` | ID of the content element, referenced from the trigger's `aria-controls`. Generated, unless the content element has its own. |
| `expand()` | `void` | Sets `expanded` to `true`. |
| `collapse()` | `void` | Sets `expanded` to `false`. |
| `toggle()` | `void` | Toggles `expanded` unless the root is disabled. |
| `setContentId()` | `void` | Takes the ID the content element was given, so the trigger points at it. `CollapsibleContentDirective` calls it, so there's no need to. |

### `CollapsibleTriggerDirective`

**Selector:** `[monaCollapsibleTrigger]`

Toggles the nearest `CollapsibleDirective` on click and supported keyboard activation. It has no public inputs or outputs.

### `CollapsibleContentDirective`

**Selector:** `[monaCollapsibleContent]`

Marks the content element with its ID, `data-state`, and collapsed `inert` state.

While closed, its block padding and border are set to `0` inline, along with its height, so that nothing shows. Padding you set inline on it won't survive a toggle, so put that on an inner element. See [Padded content](#padded-content).

#### Inputs

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `id` | `string \| null` | `null` | The content's ID, for when it has to be something in particular. Generated if not given. |

### `CollapsibleConfig` and `COLLAPSIBLE_CONFIG`

Public interface describing the state and control methods exposed by a collapsible root to paired directives, and the token that provides it. Most consumers can use the directives directly and do not need to implement or inject either.

---

<!-- verification-checklist
- [x] Root, trigger, and content selectors verified against the public API
- [x] Inputs, model, methods, generated content ID, and disabled behavior verified against source
- [x] Trigger ARIA and keyboard behavior verified against source and focused directive spec
- [x] Content inert state and custom height property verified against source
- [x] No internal DOM structure or unexported helpers exposed
-->
