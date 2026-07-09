## Overview

`AvatarComponent` is a presentational component that renders a single avatar in one of three exclusive display modes: image, text label, or projected content. The active mode is resolved automatically based on which inputs are provided.

**Use the avatar when you need to:**

- Display a user profile picture in headers, comment threads, or contact lists
- Show initials-based fallback content when a user has no profile image
- Represent a team or entity with a consistent, bordered shape
- Project a custom icon into a fixed-size, bordered slot

**Do not use when:**

- The avatar needs to be interactive — wrap it in a `<button>` or `<a>` yourself; the component provides no built-in interaction
- You need a stacked avatar group — compose individual `<mona-avatar>` elements manually; there is no built-in group component

## Import & Basic Usage

```typescript
import { AvatarComponent } from "@nanahoshi/mona-ui";
```

Add `AvatarComponent` to your standalone component's `imports` array.

**Image mode** — set `image` to a URL. Provide `alt` to describe non-decorative images:

```html

<mona-avatar
    image="https://example.com/photo.jpg"
    alt="Jane Smith's profile photo"
    borderRadius="50%">
</mona-avatar>
```

**Label mode** — omit `image`, set `label` to the visible initials. Use `aria-label` to give assistive technology the full name:

```html

<mona-avatar
    label="JD"
    aria-label="Jane Smith"
    borderRadius="50%"
    backgroundColor="#6366f1"
    labelColor="#ffffff">
</mona-avatar>
```

**Projected content mode** — omit both `image` and `label`, project any content, and set `aria-label` to describe it:

```html

<mona-avatar aria-label="User profile" borderRadius="50%">
    <svg lucideUser [size]="20"></svg>
</mona-avatar>
```

> **Display priority:** `image` takes priority over `label`; `label` takes priority over projected content. Setting both `image` and `label` shows only the image.

## Appearance & Styling

### Size

`width` and `height` both default to `'64px'`. Pass a `number` for automatic `px` conversion, or a CSS string with explicit units:

```html

<mona-avatar [width]="80" [height]="80" borderRadius="50%"></mona-avatar>
<mona-avatar width="4rem" height="4rem"></mona-avatar>
```

### Shape

Control shape with `borderRadius`:

| `borderRadius` | Shape            |
|----------------|------------------|
| `'0'`          | Square (default) |
| `'8px'`        | Rounded square   |
| `'50%'`        | Circle           |

In image mode, the image is also clipped to match the configured `borderRadius`.

### Color defaults

| Input             | Default value             |
|-------------------|---------------------------|
| `backgroundColor` | `var(--color-primary)`    |
| `borderColor`     | `var(--color-border)`     |
| `labelColor`      | `var(--color-foreground)` |

`backgroundColor` is set to `transparent` in image mode regardless of the input value.

### Custom style overrides

The `customStyles` input accepts a `Partial<CSSStyleDeclaration>` object applied after all other styles, taking precedence over every other style input. Overriding layout-critical properties such as `display` may break expected rendering:

```html

<mona-avatar
    label="X"
    aria-label="Unknown user"
    [customStyles]="{ boxShadow: '0 0 0 3px var(--color-primary)' }">
</mona-avatar>
```

## Accessibility Notes

The avatar has no built-in keyboard behavior and no interactive role. Accessibility responsibility depends on the active display mode:

**Image mode:** Provide a meaningful `alt` value when the image conveys identity information. Pass an empty string (`alt=""`) only when adjacent visible text already identifies the same entity.

**Label mode:** The raw visual initials (e.g., `"JD"`) are not a meaningful accessible name on their own. Set `aria-label` to the full name or entity the initials represent (e.g., `aria-label="Jane Smith"`). When `aria-label` is non-empty, the host receives `role="img"` and assistive technology announces the label value instead of the visual text.

**Projected content mode:** Set `aria-label` to describe what is projected. When non-empty, the host receives `role="img"`.

If the avatar is purely decorative and already described by adjacent visible text, you may omit both `alt` and `aria-label`. Whether this is appropriate depends on context.

## API

### `AvatarComponent`

**Selector:** `mona-avatar`

#### Inputs

| Name              | Type                           | Default                     | Description                                                                                                                                                                                                                                                                                                                                                  |
|-------------------|--------------------------------|-----------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `alt`             | `string`                       | `''`                        | Alternative text for the image in image mode. Provide a meaningful description for non-decorative images. An empty string marks the image as decorative. Has no effect in label or projected-content mode.                                                                                                                                                   |
| `aria-label`      | `string`                       | `''`                        | Accessible name for the host element. In label and projected-content modes, a non-empty value also adds `role="img"` to the host so assistive technology announces the label instead of the raw visual content. In image mode, the attribute is forwarded to the host but `role="img"` is not added — the child `<img>` handles its own semantics via `alt`. |
| `backgroundColor` | `string`                       | `'var(--color-primary)'`    | Background color of the host element. Ignored in image mode — the background becomes transparent automatically.                                                                                                                                                                                                                                              |
| `borderColor`     | `string`                       | `'var(--color-border)'`     | Border color applied to the host element.                                                                                                                                                                                                                                                                                                                    |
| `borderRadius`    | `string \| number`             | `'0'`                       | Border radius. Accepts a CSS string (`'50%'`, `'8px'`) or a number converted to `px`. In image mode, the image is also clipped to this radius.                                                                                                                                                                                                               |
| `borderWidth`     | `string \| number`             | `'1px'`                     | Border width. A number is converted to `px`; a string is used as-is.                                                                                                                                                                                                                                                                                         |
| `class`           | `string`                       | `''`                        | Additional CSS classes applied to the host element.                                                                                                                                                                                                                                                                                                          |
| `customStyles`    | `Partial<CSSStyleDeclaration>` | `{}`                        | Styles applied after all other values, taking precedence over every other style input including `display`, `height`, and `width`. Overriding layout-critical properties may break expected rendering.                                                                                                                                                        |
| `height`          | `string \| number`             | `'64px'`                    | Height of the host element. A string is used as-is; a number is converted to `px`.                                                                                                                                                                                                                                                                           |
| `image`           | `string`                       | `''`                        | Image URL. When non-empty, renders an image and suppresses `label` and projected content.                                                                                                                                                                                                                                                                    |
| `label`           | `string`                       | `''`                        | Text displayed inside the avatar when no image is provided. Ignored when `image` is non-empty.                                                                                                                                                                                                                                                               |
| `labelColor`      | `string`                       | `'var(--color-foreground)'` | Color of the label text. Ignored in image mode.                                                                                                                                                                                                                                                                                                              |
| `labelFontSize`   | `string`                       | `'1rem'`                    | Font size of the label text. Ignored in image mode.                                                                                                                                                                                                                                                                                                          |
| `labelFontWeight` | `string`                       | `'700'`                     | Font weight of the label text. Ignored in image mode.                                                                                                                                                                                                                                                                                                        |
| `width`           | `string \| number`             | `'64px'`                    | Width of the host element. A string is used as-is; a number is converted to `px`.                                                                                                                                                                                                                                                                            |

`AvatarComponent` has no event outputs.

---

<!-- verification-checklist
- [x] API definitions and defaults verified against source and component-metadata.json
- [x] Basic example compiles successfully against the public API surface
- [x] No internal or unexported APIs exposed
- [x] Accessibility claims verified against source (aria-label/role="img" host bindings confirmed in avatar.component.ts; alt binding confirmed in avatar.component.html)
- [x] role="img" scoped to label and projected-content modes only — not applied in image mode (host binding: ariaLabel() && !image() ? 'img' : null)
- [x] aria-label description updated to document the mode-dependent role="img" behaviour
- [x] class input documented — direct host class binding (no twMerge; avatar uses inline styles)
- [x] Styling section documents only public inputs — no internal Tailwind classes, data attributes, or DOM structure exposed
-->

<!-- TODO(owner-review): Confirm whether customStyles is intentional long-term public API or an escape hatch that may be removed -->
<!-- TODO(owner-review): migrate to NgOptimizedImage once width/height inputs are changed to number-only -->
