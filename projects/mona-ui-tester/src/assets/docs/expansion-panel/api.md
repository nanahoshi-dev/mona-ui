## Overview

`ExpansionPanelComponent` renders a header bar and a collapsible content region. The header's title and icon are a native button that fills the row, so clicking it, or pressing `Enter` or `Space` on it, toggles the `expanded` state. Controls from the actions template sit beside that button, not inside it. The expand/collapse animation is driven by a CSS grid-row transition with no JavaScript involvement at runtime.

When multiple panels are stacked directly adjacent to one another, the component's border styles stitch the group into a visually continuous block: non-last panels suppress their bottom border and bottom radius, and non-first panels suppress their top radius. That's only how they look: each panel still opens on its own. For one panel open at a time and arrow keys between the headers, wrap them in `AccordionComponent`.

**Use `ExpansionPanelComponent` when you need to:**

- Collapse optional detail content inside a form, settings page, or record view
- Build an accordion, with `mona-accordion`, where items expand in place
- Group and hide a block of secondary information behind a labelled header

## Import & Basic Usage

```typescript
import { ExpansionPanelComponent } from "@nanahoshi/mona-ui/expansion-panel";
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

**Accordion** — `mona-accordion` keeps one panel open at a time, and `Up`, `Down`, `Home` and `End` move between the headers. Add `multiple` to let several stay open:

```typescript
import { AccordionComponent, ExpansionPanelComponent } from "@nanahoshi/mona-ui/expansion-panel";
```

```html
<mona-accordion>
    <mona-expansion-panel title="Section A">...</mona-expansion-panel>
    <mona-expansion-panel title="Section B">...</mona-expansion-panel>
    <mona-expansion-panel title="Section C">...</mona-expansion-panel>
</mona-accordion>
```

**Stacked panels** — placed directly adjacent with no wrapper, panels look like one block, with the border and radius stitching applied automatically, and each one opens independently.

**Heading level** — each header is a heading, level 3 by default. Set `headingLevel` to fit the page's outline, or to `null` for no heading:

```html
<h2>Settings</h2>
<mona-expansion-panel title="Notifications" [headingLevel]="3">...</mona-expansion-panel>
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

Set `disabled` to disable the header's button. The header renders with reduced visual emphasis and leaves the tab order, and the controls in the actions template are made inert along with it.

### Content animation

The content region uses `grid-rows-[0fr]` (collapsed) → `grid-rows-[1fr]` (expanded) with a 300 ms ease-out CSS transition. No JavaScript is involved in the animation, and it's switched off for `prefers-reduced-motion`.

### Custom classes

Pass `class` to merge additional CSS classes onto the host element through `tailwind-merge`.

### Template slots

Three `ng-template` directives customize the header:

| Slot             | Selector                                         | Replaces                                        |
|------------------|--------------------------------------------------|-------------------------------------------------|
| Title template   | `ng-template[monaExpansionPanelTitleTemplate]`   | The string `title` inside the header's button   |
| Actions template | `ng-template[monaExpansionPanelActionsTemplate]` | Injected beside the button, between title and icon |
| Icon template    | `ng-template[monaExpansionPanelIconTemplate]`    | The default plus/minus icon                     |

**Title template** — replace the string title. It renders inside the button, so it can hold text, icons and images, but not controls: put those in the actions template.

```html
<mona-expansion-panel>
    <ng-template monaExpansionPanelTitleTemplate>
        <span class="uppercase text-sm font-semibold">Advanced options</span>
    </ng-template>
    <p>Panel content.</p>
</mona-expansion-panel>
```

**Actions template** — inject controls into the header. They sit beside the toggle button, so their clicks and keys are their own, and nothing has to stop them from reaching it:

```html
<mona-expansion-panel title="Settings">
    <ng-template monaExpansionPanelActionsTemplate>
        <button monaButton look="ghost" [iconOnly]="true" [size]="'small'" aria-label="Settings"
                (click)="openSettings()">
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

The header's button is native, so a click, `Enter` and `Space` all work as a button's do, and it follows the [WAI-ARIA accordion pattern](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/). A panel needs a `title` or a title template with text, or its button has no name, which is warned about in development.

| Element        | Attribute         | When present              | Value                                            |
|----------------|-------------------|---------------------------|--------------------------------------------------|
| Heading        | `role`            | Unless `headingLevel` is `null` | `"heading"`                                |
| Heading        | `aria-level`      | Unless `headingLevel` is `null` | `headingLevel`, 3 by default               |
| Button         | `aria-expanded`   | Always                    | Reflects the current `expanded` state            |
| Button         | `aria-controls`   | Always                    | The content region's generated `id`              |
| Button         | `disabled`        | When `disabled` is `true` | Present                                          |
| Actions        | `inert`           | When `disabled` is `true` | Present                                          |
| Content region | `role`            | Always                    | `"region"`                                       |
| Content region | `aria-labelledby` | Always                    | The button's `id`                                |
| Content region | `aria-hidden`     | Always                    | `"true"` when collapsed, `"false"` when expanded |
| Content region | `inert`           | When collapsed            | Present (blocks focus from entering)             |

**Keyboard in `mona-accordion`** (when a header has focus):

| Key                 | Action                                                    |
|---------------------|-----------------------------------------------------------|
| `ArrowDown` / `ArrowUp` | Move focus to the next or previous enabled header, wrapping around. Doesn't toggle. |
| `Home` / `End`      | Move focus to the first or last enabled header.           |
| `Enter` / `Space`   | Toggle the panel, as without the accordion.               |

## API

### `AccordionComponent`

**Selector:** `mona-accordion`

Groups the `mona-expansion-panel` elements inside it, however deep, except those in an accordion of their own. It renders no element or role of its own. With only one open at a time, the panel opened last stays open, whether it was opened by a click, a binding or `expand()`. That includes panels that start open, and a disabled panel can be closed by it.

#### Inputs

| Name       | Type      | Default | Description                      |
|------------|-----------|---------|----------------------------------|
| `multiple` | `boolean` | `false` | Lets several panels stay open.   |

### `ExpansionPanelComponent`

**Selector:** `mona-expansion-panel`

#### Inputs

| Name        | Type                                       | Default    | Description                                                                                                                                                                               |
|-------------|--------------------------------------------|------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `class`     | `string`                                   | `''`       | Additional CSS classes merged onto the host element via `tailwind-merge`.                                                                                                                 |
| `disabled`  | `boolean`                                  | `false`    | Disables the header: toggling by click or key, and the actions in it.                                                                                                                     |
| `expanded`  | `boolean`                                  | `false`    | Two-way bindable. Controls whether the panel is expanded. Use `[(expanded)]` for two-way binding or `[expanded]` for one-way. Changing this programmatically animates the content region. |
| `headingLevel` | `number \| null`                        | `3`        | The level of the heading around the header's button, from 1 to 6, or `null` for no heading. Anything else counts as the default.                                                           |
| `rounded`   | `'none' \| 'small' \| 'medium' \| 'large'` | `'medium'` | Border-radius preset. When stacking panels, use the same value for all panels in the group.                                                                                               |
| `title`     | `string`                                   | `''`       | Text shown in the header's button, which also names it and the region. Ignored when `monaExpansionPanelTitleTemplate` is provided.                                                        |

`ExpansionPanelComponent` has no event outputs. Observe `[(expanded)]` to react to state changes.

#### Methods

| Method       | Description                                                                 |
|--------------|-----------------------------------------------------------------------------|
| `collapse()` | Collapses the panel, even when `disabled`.                                  |
| `expand()`   | Expands the panel, even when `disabled`.                                    |
| `focus()`    | Moves focus to the header's button.                                         |
| `toggle()`   | Toggles the panel, unless it's `disabled`.                                  |

### `ExpansionPanelTitleTemplateDirective`

**Selector:** `ng-template[monaExpansionPanelTitleTemplate]`

Replaces the string `title` in the header's button with projected content. It can't hold controls, since it's inside a button. The template has no context variables.

### `ExpansionPanelActionsTemplateDirective`

**Selector:** `ng-template[monaExpansionPanelActionsTemplate]`

Injects content beside the header's button, between the title and the toggle icon. Its controls are the application's own: their clicks and keys don't reach the button, and they need their own accessible names. The template has no context variables.

### `ExpansionPanelIconTemplateDirective`

**Selector:** `ng-template[monaExpansionPanelIconTemplate]`

Replaces the default plus/minus toggle icon. The template context exposes one variable:

| Variable    | Type      | Description                                 |
|-------------|-----------|---------------------------------------------|
| `$implicit` | `boolean` | The current expanded state (`let-expanded`) |

Import all template directives alongside the component:

```typescript
import { AccordionComponent, ExpansionPanelActionsTemplateDirective, ExpansionPanelComponent, ExpansionPanelIconTemplateDirective, ExpansionPanelTitleTemplateDirective } from "@nanahoshi/mona-ui/expansion-panel";
```

---

<!-- verification-checklist
- [x] API definitions and defaults verified against source and component-metadata.json
- [x] standalone: true removed from ActionsTemplateDirective and TitleTemplateDirective
- [x] Icon template context ($implicit: expanded()) verified in template source
- [x] Actions as a sibling of the button, with no click-propagation caveat, verified in template source and spec
- [x] AccordionComponent single-open and keys verified against source and spec
- [x] Stacking border stitching verified in CVA base styles (not-last / not-first selectors)
- [x] disabled and userClass inputs verified against source and component-metadata.json
- [x] Accessibility attribute table verified against template source (heading, aria-level, aria-expanded, aria-controls, disabled, region, aria-labelledby, aria-hidden, inert)
- [x] Keyboard activation comes from the native button
- [x] No internal or unexported APIs exposed
-->

