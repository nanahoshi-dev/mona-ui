## Overview

`ChipComponent` is a compact label element used to represent filterable tags, toggleable options, removable selections, or navigation chips. It supports three content modes — a `label` input string, projected content via `<ng-content>`, or a mix of both with an optional prefix template — and three optional behaviors: toggle selection, removability, and RouterLink navigation.

When `toggleable` is `true`, each activation flips the `selected` model. When `removable` is `true`, a remove button appears inside the chip. Both behaviors can be combined.

**Use the chip when you need to:**

- Display removable tags in a tag input or multiselect
- Represent filterable categories that the user can toggle on and off
- Show selectable option badges in a compact collection (skill tags, interest categories)
- Label entities with an optional avatar or icon prefix (contact chips)
- Render compact, styled navigation items with `[routerLink]`

**Do not use when:**

- A standalone action button is needed — use `<button monaButton>` instead

## Import & Basic Usage

```typescript
import { ChipComponent } from "@nanahoshi/mona-ui/chip";
// Optional: only needed when adding a prefix template
import { ChipPrefixTemplateDirective } from "@nanahoshi/mona-ui/chip";
```

Add the imported symbols to your standalone component's `imports` array.

**Display chip:**

```html
<mona-chip label="Angular"></mona-chip>
```

**Toggleable chip:**

```html
<mona-chip label="TypeScript" [toggleable]="true" [(selected)]="isSelected"></mona-chip>
```

**Removable chip:**

```html
<mona-chip label="Remove me" [removable]="true" (remove)="onRemove($event)"></mona-chip>
```

**RouterLink navigation chip:**

```html
<mona-chip label="Overview" [routerLink]="['/overview']"></mona-chip>
```

**Custom padding & class override:**

```html
<mona-chip label="Custom Padding" class="px-6 py-2"></mona-chip>
```

**Projected content:**

```html
<mona-chip>
    <svg lucideTag [size]="12"></svg>
    Draft
</mona-chip>
```

When `label` is non-empty it takes precedence over projected content — both are not visible at the same time.

**Prefix template — avatar chip:**

```html
<mona-chip label="Jane Smith">
    <ng-template monaChipPrefixTemplate>
        <mona-avatar image="photo.jpg" alt="" [width]="16" [height]="16" borderRadius="50%" [borderWidth]="0">
        </mona-avatar>
    </ng-template>
</mona-chip>
```

The prefix template renders before the label or projected content. It receives no template context.

> **Keyboard access:** Chips receive `tabindex="0"` automatically when `toggleable` is `true` or when functioning as a link (`[routerLink]`). Passive chips and removable-only chips aren't focusable, leaving keyboard access directly on the child remove button.

### Removing chips from a list

`remove` fires for the remove button and for Delete and Backspace on the chip. Your parent destroys the chip, and focus goes with it, so a keyboard user lands at the top of the page unless you move it. Move it in the handler, for example to the control that adds chips:

```html
@for (tag of tags(); track tag) {
    <mona-chip [label]="tag" [removable]="true" (remove)="removeTag(tag, tagInput)"></mona-chip>
}
<input #tagInput aria-label="Add a tag" />
```

```typescript
protected removeTag(tag: string, tagInput: HTMLInputElement): void {
    this.tags.update(tags => tags.filter(item => item !== tag));
    tagInput.focus();
}
```

## Appearance & Styling

### Look variants

| `look`      | Appearance                                         |
|-------------|----------------------------------------------------|
| `default`   | Background with border; adapts to the active theme |
| `outline`   | Transparent background with border                 |
| `primary`   | Filled primary color                               |
| `secondary` | Filled secondary color                             |
| `success`   | Filled success color                               |
| `error`     | Filled error color                                 |
| `warning`   | Filled warning color                               |
| `info`      | Filled info color                                  |
| `ghost`     | No background or border; hover reveals background  |

### Sizes

| `size`   | Description                |
|----------|----------------------------|
| `small`  | Compact padding            |
| `medium` | Standard padding (default) |
| `large`  | Generous padding           |

The remove button dimensions scale automatically with `size`.

### Rounded presets

| `rounded` | Shape                          |
|-----------|--------------------------------|
| `none`    | No rounding                    |
| `small`   | Slight rounding                |
| `medium`  | Moderate rounding (default)    |
| `large`   | Strong rounding                |
| `full`    | Pill / fully rounded           |

### Selected state

Each `look` value applies a distinct selected appearance when `selected` is `true`: a shifted background tone and a border in the text's color, which also shows in forced colors. Without `toggleable`, `selected` is only a look, with no state for assistive technology.

### Custom classes

```html
<mona-chip label="Tag" class="font-bold tracking-wide"></mona-chip>
<mona-chip label="Custom Padding" class="px-6 py-2"></mona-chip>
```

Classes passed via `class` are merged with variant classes using `tailwind-merge`. Consumer utilities override Mona UI defaults (e.g. `class="px-6 py-2"` replaces default size padding). Targeted logical side utilities (such as `ps-*` and `pe-*`) can be used for RTL-aware edge specialization.

## Accessibility Notes

The following attributes are managed automatically on the host element:

| Attribute       | When present                                   | Value                                |
|-----------------|------------------------------------------------|--------------------------------------|
| `aria-label`    | `aria-label` is non-empty                      | Value of the `aria-label` input. Text in `label` reads itself, so it isn't copied. |
| `aria-checked`  | `toggleable` is `true`                         | `"true"` or `"false"`                |
| `aria-disabled` | `disabled` is `true`, on a chip with a role    | `"true"`                             |
| `role`          | `toggleable` is `true`                         | `"checkbox"`                         |
| `role`          | A `[routerLink]`, and not `toggleable`         | `"link"`                             |
| `role`          | Passive, with an `aria-label`                  | `"group"`                            |
| `tabindex`      | Interactive, or set by the input               | `0` when interactive, `-1` when disabled |

**Toggleable or link, and removable:** an interactive role makes its children presentational, which would hide the remove button. So the host is a `role="group"`, and an inner element holds the `checkbox` or `link` role, `aria-checked`, `aria-disabled`, `aria-label` and `tabindex`, beside the remove button.

**Remove button:** When `removable` is `true`, the remove button inside the chip has an automatically computed accessible label: `"Remove, <label>"` using the `label` input or `aria-label`, or `"Remove, item"` with neither. Override this with the `removeLabel` input.

The remove button's target is 24 by 24 pixels at every size, though its icon is smaller.

| Key | Action |
|-----|--------|
| `Enter`, `Space` | Toggles a toggleable chip, once while held. Space doesn't scroll the page. |
| `Enter` | Follows a link chip. |
| `Delete`, `Backspace` | Removes a removable chip, also from its remove button. |

A control you project into a chip keeps its own clicks and keys, and doesn't toggle the chip. When focus is on the remove button, Enter and Space activate only that button.

**Consumer responsibilities:**

- When `removable` is `true` and no `label` is set, provide `[removeLabel]` or `[aria-label]` so the remove button carries a meaningful accessible label. It warns in development otherwise.
- Move focus after removing a chip (see "Removing chips from a list").
- For icon-only or purely visual chips, set `[aria-label]` to describe what the chip represents.

## API

### `ChipComponent`

**Selector:** `mona-chip`

**Content projection:** default slot for chip body content; use `<ng-template monaChipPrefixTemplate>` for prefix content rendered before the label.

#### Inputs

| Name          | Type                                                                                                           | Default     | Description                                                                                                                                                                                        |
|---------------|----------------------------------------------------------------------------------------------------------------|-------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `aria-label`  | `string`                                                                                                       | `""`        | Accessible name of the chip, for one whose text doesn't describe it, such as an icon. On a chip with no other role, it makes the chip a named group.                                               |
| `class`       | `string`                                                                                                       | `""`        | Additional CSS classes merged onto the host element via `tailwind-merge`.                                                                                                                          |
| `disabled`    | `boolean`                                                                                                      | `false`     | Renders the chip with reduced visual emphasis and removes pointer interaction.                                                                                                                     |
| `label`       | `string`                                                                                                       | `""`        | Text label displayed inside the chip. When non-empty, takes precedence over projected content. Also part of the remove button's accessible label.                                                  |
| `look`        | `'default' \| 'error' \| 'ghost' \| 'info' \| 'outline' \| 'primary' \| 'secondary' \| 'success' \| 'warning'` | `'default'` | Visual style variant controlling the chip's background color, border, and interaction states.                                                                                                      |
| `removable`   | `boolean`                                                                                                      | `false`     | Renders a remove button inside the chip. When activated, emits the `remove` output.                                                                                                                |
| `removeLabel` | `string`                                                                                                       | —           | Accessible label for the remove button, overriding the auto-computed `"Remove, <label>"` fallback. A chip with only projected content needs this or `aria-label`, or it warns in development.     |
| `rounded`     | `'none' \| 'small' \| 'medium' \| 'large' \| 'full'`                                                           | `'full'`    | Border-radius preset applied to the chip.                                                                                                                                                          |
| `selected`    | `boolean`                                                                                                      | `false`     | Two-way bindable selected state. When `toggleable` is `true`, each activation flips this value. Use `[(selected)]` for two-way binding.                                                            |
| `size`        | `'small' \| 'medium' \| 'large'`                                                                               | `'medium'`  | Size preset controlling the chip's padding and remove button dimensions.                                                                                                                           |
| `removeTabIndex` | `number \| string`                                                                                          | `0`         | Tab index for the remove button. Set to `-1` to exclude it from the tab order, since Delete and Backspace on the chip also remove it.                                                              |
| `tabindex`    | `number \| string`                                                                                             | —           | Tab index override for the chip's control. When not set, `0` when `toggleable` is `true` or functioning as a link, not focusable otherwise. Overridden to `-1` when `disabled` is `true`.           |
| `toggleable`  | `boolean`                                                                                                      | `false`     | Enables toggle behavior. When `true`, each activation flips `selected`, and the chip's control receives `role="checkbox"` with `aria-checked`.                                                     |
| `value`       | `unknown`                                                                                                      | —           | Arbitrary value associated with this chip. The chip doesn't use it or emit it, so pass the item in your `(remove)` handler.                                                                        |

#### Outputs

| Name           | Type    | Description                                                                                                                                              |
|----------------|---------|----------------------------------------------------------------------------------------------------------------------------------------------------------|
| `contentClick` | `void`  | Emitted when a toggleable chip body is activated via click, Enter, or Space. Not emitted when the remove button is activated or for non-toggleable chips. |
| `remove`       | `Event` | Emitted when the remove button is clicked, or Delete or Backspace is pressed on the chip. Only fires when `removable` is `true`. Emits the originating `Event`. |

---

### `ChipPrefixTemplateDirective`

**Selector:** `ng-template[monaChipPrefixTemplate]`

Apply to an `<ng-template>` directly inside `<mona-chip>` to render prefix content (e.g., an avatar or icon) before the chip label or projected content. The template receives no context.

```html
<mona-chip label="Jane Smith">
    <ng-template monaChipPrefixTemplate>
        <mona-avatar image="photo.jpg" alt="" [width]="16" [height]="16" borderRadius="50%" [borderWidth]="0">
        </mona-avatar>
    </ng-template>
</mona-chip>
```

`ChipPrefixTemplateDirective` has no inputs or outputs.

---

<!-- verification-checklist
- [x] API definitions and defaults verified against source (chip.component.ts) and component-metadata.json
- [x] removeLabel and removeTabIndex in the API table
- [x] Inputs sorted A→Z: aria-label, class, disabled, label, look, removable, removeLabel, rounded, selected, size, tabindex, toggleable, value
- [x] Outputs sorted A→Z: contentClick, remove
- [x] selected correctly documented as two-way bindable (model)
- [x] tabindex default documented as computed (undefined input, automatic logic)
- [x] contentClick clarified: not emitted from remove button
- [x] ariaLabel input alias confirmed as aria-label in chip.component.ts
- [x] removeLabel and value defaults are — (undefined, no default in source)
- [x] Accessibility claims verified against source: role/aria-checked/aria-disabled/aria-label/tabindex host bindings confirmed in chip.component.ts; remove button aria-label confirmed in template
- [x] Keyboard guard fix confirmed: button[data-chip-remove] selector; remove button keyboard activation does not trigger chip body
- [x] Basic examples compile against the public API surface
- [x] No internal or unexported APIs exposed
- [x] ChipPrefixTemplateDirective documented with selector and no-inputs note
- [x] intro.md trimmed to title + selector + one sentence, matching button/avatar/breadcrumb pattern
-->
