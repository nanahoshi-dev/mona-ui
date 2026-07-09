## Overview

`ExpansionPanelComponent` renders a header bar and a collapsible content region. Clicking the header (or pressing `Enter` / `Space` when it has focus) toggles the `expanded` state. The expand/collapse animation is driven by a CSS grid-row transition with no JavaScript involvement at runtime.

When multiple panels are stacked directly adjacent to one another, the component's border styles stitch the group into a visually continuous block: non-last panels suppress their bottom border and bottom radius, and non-first panels suppress their top radius. No wrapper component is required.

**Use `ExpansionPanelComponent` when you need to:**

- Collapse optional detail content inside a form, settings page, or record view
- Build a vertical accordion-style list where items expand in place
- Group and hide a block of secondary information behind a labelled header

## Import & Basic Usage

```typescript
import { ExpansionPanelComponent } from "@nanahoshi/mona-ui";
```

Add `ExpansionPanelComponent` to your standalone component's `imports` array.

**Minimal panel with a string title:**

```html
<mona-expansion-panel title="Details">
    <p>Content shown when expanded.</p>
</mona-expansion-panel>
```

**Two-way expanded binding:**

```html
<mona-expansion-panel title="Settings" [(expanded)]="isOpen">
    <p>Content</p>
</mona-expansion-panel>
```

**Stacked accordion** — place panels directly adjacent with no wrapper; the border and radius stitching is automatic:

```html
<mona-expansion-panel title="Section A">...</mona-expansion-panel>
<mona-expansion-panel title="Section B">...</mona-expansion-panel>
<mona-expansion-panel title="Section C">...</mona-expansion-panel>
```

## Appearance & Styling

### Rounded presets

| `rounded` | Shape                  |
|-----------|------------------------|
| `none`    | Square corners         |
| `small`   | `rounded-sm`           |
| `medium`  | `rounded-md` (default) |
| `large`   | `rounded-lg`           |

When panels are stacked, border-radius is only visible on the first panel's top corners and the last panel's bottom corners. The `rounded` value must be consistent across all panels in a stack for the stitching to look correct.

### Disabled state

Set `disabled` to suppress click and keyboard toggling on the header. The header renders with reduced visual emphasis and no longer participates in tab order.

### Content animation

The content region uses `grid-rows-[0fr]` (collapsed) → `grid-rows-[1fr]` (expanded) with a 300 ms ease-out CSS transition. No JavaScript is involved in the animation.

### Custom classes

Pass `userClass` to merge additional CSS classes onto the host element.

### Template slots

Three `ng-template` directives customize the header:

| Slot             | Selector                                         | Replaces                                        |
|------------------|--------------------------------------------------|-------------------------------------------------|
| Title template   | `ng-template[monaExpansionPanelTitleTemplate]`   | The string `title` inside the header title area |
| Actions template | `ng-template[monaExpansionPanelActionsTemplate]` | Injected into the header between title and icon |
| Icon template    | `ng-template[monaExpansionPanelIconTemplate]`    | The default plus/minus icon                     |

**Title template** — replace the string title with any content:

```html
<mona-expansion-panel>
    <ng-template monaExpansionPanelTitleTemplate>
        <span class="uppercase text-sm font-semibold">Advanced options</span>
    </ng-template>
    <p>Panel content.</p>
</mona-expansion-panel>
```

**Actions template** — inject controls into the header. Actions are rendered inside the clickable header region, so any interactive control must call `$event.stopPropagation()` to prevent its click from toggling the panel:

```html
<mona-expansion-panel title="Settings">
    <ng-template monaExpansionPanelActionsTemplate>
        <button monaButton look="ghost" [iconOnly]="true" [size]="'small'"
                (click)="$event.stopPropagation(); openSettings()">
            <svg lucideSettings [size]="14"></svg>
        </button>
    </ng-template>
    <p>Panel content.</p>
</mona-expansion-panel>
```

**Icon template** — replace the default plus/minus toggle icon. The template context exposes `$implicit` as the current boolean expanded state (`let-expanded`):

```html
<mona-expansion-panel title="Documents">
    <ng-template monaExpansionPanelIconTemplate let-expanded>
        <div class="px-2">
            @if (expanded) {
                <svg lucideChevronUp [size]="14"></svg>
            } @else {
                <svg lucideChevronDown [size]="14"></svg>
            }
        </div>
    </ng-template>
    <p>Panel content.</p>
</mona-expansion-panel>
```

## Accessibility Notes

The header toggles via mouse click and via `Enter` or `Space` while it has focus; both keys call `preventDefault()` so `Space` does not scroll the page.

| Attribute       | When present                          | Value                                            |
|-----------------|---------------------------------------|--------------------------------------------------|
| `role`          | Always                                | `"button"`                                       |
| `tabindex`      | Always                                | `0`, or `-1` when `disabled` is `true`           |
| `aria-expanded` | Always                                | Reflects the current `expanded` state            |
| `aria-controls` | Always                                | The content region's generated `id`              |
| `aria-disabled` | When `disabled` is `true`             | `"true"`                                         |
| `aria-hidden`   | On the content region, always         | `"true"` when collapsed, `"false"` when expanded |
| `inert`         | On the content region, when collapsed | Present (blocks focus from entering)             |

TODO(owner-review): confirm whether the header should remain a `role="button"` `<div>` or move to a native `<button>` element; the current implementation supports the ARIA disclosure pattern either way.

## API

### `ExpansionPanelComponent`

**Selector:** `mona-expansion-panel`

#### Inputs

| Name        | Type                                       | Default    | Description                                                                                                                                                                               |
|-------------|--------------------------------------------|------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `disabled`  | `boolean`                                  | `false`    | Suppresses click and keyboard toggling on the header.                                                                                                                                     |
| `expanded`  | `boolean`                                  | `false`    | Two-way bindable. Controls whether the panel is expanded. Use `[(expanded)]` for two-way binding or `[expanded]` for one-way. Changing this programmatically animates the content region. |
| `rounded`   | `'none' \| 'small' \| 'medium' \| 'large'` | `'medium'` | Border-radius preset. When stacking panels, use the same value for all panels in the group.                                                                                               |
| `title`     | `string`                                   | `''`       | Text shown in the header title area. Ignored when `monaExpansionPanelTitleTemplate` is provided.                                                                                          |
| `userClass` | `string`                                   | `''`       | Additional CSS classes merged onto the host element via `tailwind-merge`.                                                                                                                 |

`ExpansionPanelComponent` has no event outputs. Observe `[(expanded)]` to react to state changes.

### `ExpansionPanelTitleTemplateDirective`

**Selector:** `ng-template[monaExpansionPanelTitleTemplate]`

Replaces the string `title` in the header title area with projected content. The template has no context variables.

### `ExpansionPanelActionsTemplateDirective`

**Selector:** `ng-template[monaExpansionPanelActionsTemplate]`

Injects content between the title area and the toggle icon. The template has no context variables.

> **Click propagation:** the actions area is inside the clickable header. Any interactive control inside an actions template must call `$event.stopPropagation()` on its click handler to prevent it from toggling the panel.

### `ExpansionPanelIconTemplateDirective`

**Selector:** `ng-template[monaExpansionPanelIconTemplate]`

Replaces the default plus/minus toggle icon. The template context exposes one variable:

| Variable    | Type      | Description                                 |
|-------------|-----------|---------------------------------------------|
| `$implicit` | `boolean` | The current expanded state (`let-expanded`) |

Import all template directives alongside the component:

```typescript
import {
    ExpansionPanelComponent,
    ExpansionPanelTitleTemplateDirective,
    ExpansionPanelActionsTemplateDirective,
    ExpansionPanelIconTemplateDirective
} from "@nanahoshi/mona-ui";
```

---

<!-- verification-checklist
- [x] API definitions and defaults verified against source and component-metadata.json
- [x] standalone: true removed from ActionsTemplateDirective and TitleTemplateDirective
- [x] Icon template context ($implicit: expanded()) verified in template source
- [x] Actions click-propagation caveat verified in demo source
- [x] Stacking border stitching verified in CVA base styles (not-last / not-first selectors)
- [x] disabled and userClass inputs verified against source and component-metadata.json
- [x] Accessibility attribute table verified against template source (role, tabindex, aria-expanded, aria-controls, aria-disabled, aria-hidden, inert)
- [x] Keyboard activation (Enter/Space + preventDefault) verified against component source and spec
- [x] No internal or unexported APIs exposed
-->

