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

**Accordion** — `mona-accordion` keeps one panel open at a time, and `Up`, `Down`, `Home` and `End` move between the headers. Add `multiple` to let several stay open. It comes from the same entry point:

```typescript
import { AccordionComponent, ExpansionPanelComponent } from "@nanahoshi/mona-ui/expansion-panel";
```

**Stacked panels** — placed directly adjacent with no wrapper, panels look like one block, with the border and radius stitching applied automatically, and each one opens independently.

**Content isn't lazy** — what you project is created with the panel and stays alive while it's collapsed. For heavy content, render it yourself once the panel has opened:

```html
<mona-expansion-panel title="Report" [(expanded)]="reportOpen">
    @if (reportOpen()) {
        <app-report></app-report>
    }
</mona-expansion-panel>
```

**Heading level** — each header is a heading, level 3 by default. Set `headingLevel` to fit the page's outline, from 1 to 6, or to `null` for no heading. Anything else counts as 3:

```html
<h2>Settings</h2>
<mona-expansion-panel title="Notifications" [headingLevel]="3">...</mona-expansion-panel>
```

## Examples

### Accordion

Opening one panel closes the one that was open.

```example
expansion-panel/accordion
```

### Opening from code

`expanded` is a two-way model, so a control outside the panel can open and close it.

```example
expansion-panel/controlled
```

### Header actions and icon

A button in the actions template sits beside the header's toggle, so clicking it doesn't open the panel. The icon template gets the expanded state as `let-expanded`.

```example
expansion-panel/header-templates
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

The content region uses `grid-rows-[0fr]` (collapsed) → `grid-rows-[1fr]` (expanded) with an ease-out CSS transition. Its duration is the theme's `--mona-motion-standard`, which is 300 ms in the Mona theme. No JavaScript is involved in the animation, and it's switched off for `prefers-reduced-motion`.

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

**Actions template** — inject controls into the header. They sit beside the toggle button, so their clicks and keys are their own, and nothing has to stop them from reaching it. See [Header actions and icon](#header-actions-and-icon).

**Icon template** — replace the default plus/minus toggle icon. The template context exposes `$implicit` as the current boolean expanded state (`let-expanded`), as in the same example.

## Accessibility Notes

The header's button is native, so a click, `Enter` and `Space` all work as a button's do, and it follows the [WAI-ARIA accordion pattern](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/). A panel needs a `title` or a title template with text, or its button has no name, which is warned about in development.

| Element        | Attribute         | When present              | Value                                            |
|----------------|-------------------|---------------------------|--------------------------------------------------|
| Heading        | `role`            | Unless `headingLevel` is `null` | `"heading"`                                |
| Heading        | `aria-level`      | Unless `headingLevel` is `null` | `headingLevel`, 3 by default               |
| Button         | `aria-expanded`   | Always                    | Reflects the current `expanded` state            |
| Button         | `aria-controls`   | Always                    | The content region's generated `id`              |
| Button         | `disabled`        | When `disabled` is `true` | Present                                          |
| Button         | `aria-disabled`   | When `disabled` is `true` | `"true"`                                         |
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
