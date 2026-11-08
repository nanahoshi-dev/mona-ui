## Overview

`AvatarComponent` is a presentational component that renders a single avatar in one of three exclusive display modes: image, text label, or projected content. The active mode is resolved automatically based on which inputs are provided.

**Use the avatar when you need to:**

- Display a user profile picture in headers, comment threads, or contact lists
- Show initials-based fallback content when a user has no profile image, or when the image fails to load
- Represent a team or entity with a consistent, bordered shape
- Project a custom icon into a fixed-size, bordered slot

**Do not use when:**

- The avatar needs to be interactive — wrap it in a `<button>` or `<a>` yourself; the component provides no built-in interaction
- You need a stacked avatar group — compose individual `<mona-avatar>` elements manually; there is no built-in group component

## Import & Quick Start

```typescript
import { AvatarComponent } from "@nanahoshi/mona-ui/avatar";
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

**Label mode** — omit `image`, set `label` to the visible initials. **Projected content mode** — omit both `image` and `label` and project any content. Both are shown under Examples.

> **Display priority:** `image` takes priority over `label`; `label` takes priority over projected content. Setting both `image` and `label` shows only the image, until it fails to load. Then the avatar shows the label or projected content, and a new URL tries again.

A photo that isn't square is cropped to fill the avatar. Images load lazily, which matters in long lists.

## Examples

### Initials

Set `label` to the visible initials and `aria-label` to the full name. `labelColor` defaults to the foreground meant for the default `backgroundColor`, so if you change one, check the other.

```example
avatar/initials
```

### Icon

Leave out `image` and `label` to project content, such as an icon, and set `aria-label` to describe it. The avatar doesn't center projected content, so wrap it in an element that does.

```example
avatar/icon
```

## Appearance & Styling

### Size

`width` and `height` both default to `'64px'`. Pass a `number` for automatic `px` conversion, or a CSS string with explicit units:

```html

<mona-avatar [width]="80" [height]="80" borderRadius="50%"></mona-avatar>
<mona-avatar width="4rem" height="4rem"></mona-avatar>
```

Size is set as an inline style on the host, so a class like `w-8` has no effect. Use these inputs.

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
| `labelColor`      | `var(--color-primary-foreground)` |

`backgroundColor` is set to `transparent` while an image shows, regardless of the input value. It comes back if the image fails to load.

### Custom style overrides

The `customStyles` input accepts a `Partial<CSSStyleDeclaration>` object applied after all other styles, taking precedence over every other style input. Overriding layout-critical properties such as `display` may break expected rendering:

```html

<mona-avatar
    label="X"
    aria-label="Unknown user"
    [customStyles]="{ boxShadow: '0 0 0 3px var(--color-primary)' }">
</mona-avatar>
```

## Accessibility

The avatar has no built-in keyboard behavior and no interactive role. Accessibility responsibility depends on the active display mode:

**Image mode:** Provide a meaningful `alt` value when the image conveys identity information, or an `aria-label`, which the image uses when `alt` is empty. While an image shows, `aria-label` doesn't go on the host, and it's not used at all if `alt` is set. Leave both empty only when adjacent visible text already identifies the same entity.

**Label mode:** The raw visual initials (e.g., `"JD"`) are not a meaningful accessible name on their own. Set `aria-label` to the full name or entity the initials represent (e.g., `aria-label="Jane Smith"`). When `aria-label` is non-empty, the host receives `role="img"` and assistive technology announces the label value instead of the visual text.

**Projected content mode:** Set `aria-label` to describe what is projected. When non-empty, the host receives `role="img"`.

**After an image fails to load:** the host receives `role="img"`, named by `alt` or else `aria-label`, the same name the image had. With neither, the host has no role or name of its own.

If the avatar is purely decorative and already described by adjacent visible text, you may omit both `alt` and `aria-label`. Whether this is appropriate depends on context.

<!-- verification-checklist
- [x] API definitions and defaults verified against source and component-metadata.json
- [x] Basic example compiles successfully against the public API surface
- [x] No internal or unexported APIs exposed
- [x] Accessibility claims verified against source (aria-label/role="img" host bindings confirmed in avatar.component.ts; alt binding confirmed in avatar.component.html)
- [x] role="img" applies whenever the host has a name, and it has none while an image shows (host binding: hostName() ? 'img' : null)
- [x] aria-label description updated to document the mode-dependent role="img" behaviour
- [x] class input documented — direct host class binding (no twMerge; avatar uses inline styles)
- [x] Styling section documents only public inputs — no internal Tailwind classes, data attributes, or DOM structure exposed
-->
