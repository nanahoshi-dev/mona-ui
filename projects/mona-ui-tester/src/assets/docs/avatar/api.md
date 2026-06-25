## Overview

`AvatarComponent` is a presentational component that renders a single avatar element. It wraps one of three display modes — image, text label, or projected content — inside a host element whose size, shape, and border are fully controlled by inputs. The active mode is resolved automatically: if `image` is non-empty, the image is shown; if only `label` is provided, the label is shown; otherwise the component renders `<ng-content>` for projected content.

Styles are applied directly to the host element with no inner wrapper, making the component straightforward to embed inline or inside flex/grid layouts.

**Use `AvatarComponent` when you need to:**

- Display a user profile picture in headers, comment threads, or contact lists
- Show initials-based fallback content when a user has no profile image
- Represent a team or entity with a consistent, bordered shape
- Project a custom icon into a fixed-size, bordered slot

**Do not use `AvatarComponent` when:**

- The avatar needs to be interactive — wrap it in a `<button>` or `<a>` yourself; the component provides no built-in interaction
- You need a stacked avatar group — compose individual `<mona-avatar>` elements manually; there is no built-in group component

## Import & Basic Usage

```typescript
import { AvatarComponent } from "@mirei/mona-ui";
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

> **Display priority:** The three modes are mutually exclusive. `image` takes priority over `label`; `label` takes priority over projected content. Setting both `image` and `label` shows only the image.

> **Accessibility — `alt` vs `aria-label`:** Use `alt` for the inner `<img>` in image mode (pass an empty string when adjacent visible text already identifies the entity). Use `aria-label` on the host in label and projected-content modes — when non-empty, the host receives `role="img"` and assistive technology announces this value as the accessible name instead of the raw visual content.

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

In image mode, `borderRadius` is also applied directly to the inner `<img>` element to clip the image to the specified radius.

### CSS custom property defaults

| Input             | Default value             |
|-------------------|---------------------------|
| `backgroundColor` | `var(--color-primary)`    |
| `borderColor`     | `var(--color-border)`     |
| `labelColor`      | `var(--color-foreground)` |

> **Note:** `backgroundColor` is hardcoded to `transparent` in image mode regardless of the input value.

### Custom style overrides

The `customStyles` input accepts a `Partial<CSSStyleDeclaration>` object that is spread after all computed values, taking precedence over every other style input. Overriding layout-critical properties such as `display` may break expected rendering:

```html

<mona-avatar
    label="X"
    aria-label="Unknown user"
    [customStyles]="{ boxShadow: '0 0 0 3px var(--color-primary)' }">
</mona-avatar>
```

## API

### `AvatarComponent`

**Selector:** `mona-avatar`

| Name              | Kind  | Type                           | Default                     | Required | Description                                                                                                                                                                                                                                                                                |
|-------------------|-------|--------------------------------|-----------------------------|----------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `alt`             | input | `string`                       | `''`                        | Optional | Alternative text forwarded to the `<img>` element in image mode. Provide a meaningful description for non-decorative images. An empty string marks the image as decorative. Has no effect in label or projected-content mode.                                                              |
| `aria-label`      | input | `string`                       | `''`                        | Optional | Accessible label for the host element. When non-empty, the host receives `role="img"` and assistive technology announces this value instead of the raw visual content. Use in label mode to name what the initials represent, and in projected-content mode to describe projected content. |
| `backgroundColor` | input | `string`                       | `'var(--color-primary)'`    | Optional | Background color of the host element. Ignored in image mode — the background becomes transparent automatically.                                                                                                                                                                            |
| `borderColor`     | input | `string`                       | `'var(--color-border)'`     | Optional | Border color applied to the host element.                                                                                                                                                                                                                                                  |
| `borderRadius`    | input | `string \| number`             | `'0'`                       | Optional | Border radius. Accepts a CSS string (`'50%'`, `'8px'`) or a number converted to `px`. Also applied directly to the inner `<img>` element in image mode.                                                                                                                                    |
| `borderWidth`     | input | `string \| number`             | `'1px'`                     | Optional | Border width. A number is converted to `px`; a string is used as-is.                                                                                                                                                                                                                       |
| `customStyles`    | input | `Partial<CSSStyleDeclaration>` | `{}`                        | Optional | Styles spread over all computed host styles after all other values are applied. Takes precedence over every other style input, including `display`, `height`, and `width`. Overriding layout-critical properties may break expected rendering.                                             |
| `height`          | input | `string \| number`             | `'64px'`                    | Optional | Height of the host element. A string is used as-is; a number is converted to `px`.                                                                                                                                                                                                         |
| `image`           | input | `string`                       | `''`                        | Optional | Image URL. When non-empty, renders an `<img>` element and suppresses `label` and projected content.                                                                                                                                                                                        |
| `label`           | input | `string`                       | `''`                        | Optional | Text displayed inside the avatar when no image is provided. Ignored when `image` is non-empty.                                                                                                                                                                                             |
| `labelColor`      | input | `string`                       | `'var(--color-foreground)'` | Optional | Color of the label text. Ignored in image mode.                                                                                                                                                                                                                                            |
| `labelFontSize`   | input | `string`                       | `'1rem'`                    | Optional | Font size of the label text. Ignored in image mode.                                                                                                                                                                                                                                        |
| `labelFontWeight` | input | `string`                       | `'700'`                     | Optional | Font weight of the label text. Ignored in image mode.                                                                                                                                                                                                                                      |
| `width`           | input | `string \| number`             | `'64px'`                    | Optional | Width of the host element. A string is used as-is; a number is converted to `px`.                                                                                                                                                                                                          |

`AvatarComponent` has no model inputs and no event outputs.

---

<!-- verification-checklist
- [x] API definitions and defaults verified against source and component-metadata.json
- [x] Basic example compiles successfully against the public API surface
- [x] No internal or unexported APIs exposed
-->

<!-- TODO(owner-review): Confirm the public package name is @mirei/mona-ui vs mona-ui -->
<!-- TODO(owner-review): Confirm whether customStyles is intentional public API or an escape hatch that may be removed -->
<!-- TODO(owner-review): migrate to NgOptimizedImage once width/height inputs are changed to number-only -->
