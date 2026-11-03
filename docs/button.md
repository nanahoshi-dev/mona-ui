# Mona UI Buttons

`@nanahoshi/mona-ui/button` exports `ButtonDirective`, which styles a native `<button>` and adds loading, toggle and group behavior to it. It applies to any `button[monaButton]`. `@nanahoshi/mona-ui/button-group` groups several of them into one segmented control.

---

## 1. Basic Usage

```typescript
import { Component } from '@angular/core';
import { ButtonDirective } from '@nanahoshi/mona-ui/button';

@Component({
    selector: 'app-toolbar',
    imports: [ButtonDirective],
    template: `
        <button monaButton look="primary" (click)="save()">Save</button>
        <button monaButton look="ghost" disabled>Archive</button>
        <button monaButton look="error" type="submit">Delete</button>
    `
})
export class ToolbarComponent {
    protected save(): void {}
}
```

- `type` defaults to `"button"`, so a button inside a form never submits it by accident. Set `type="submit"` when it should.
- `disabled`, `loading`, `iconOnly` and `toggleable` accept the bare attribute form (`<button monaButton disabled>`) as well as bindings.
- Classes you put on the button are merged with the built-in ones through `tailwind-merge`, so `class="px-2"` replaces the size padding instead of competing with it.

---

## 2. Appearance

| Input | Values | Default |
|---|---|---|
| `look` | `default`, `primary`, `secondary`, `success`, `error`, `warning`, `info`, `outline`, `ghost`, `link`, `clear` | `default` |
| `size` | `small`, `medium`, `large` | `medium` |
| `rounded` | `none`, `small`, `medium`, `large`, `full` | `medium` |
| `iconOnly` | `true`, `false` | `false` |

- `outline` looks the same as `default`.
- `clear` has no background, border or selected state; use another look for toggle buttons.
- `iconOnly` makes the button square and removes its padding. Give it an accessible name (see section 6).

The host also carries `data-look` and `data-size` attributes, which you can use in your own selectors.

---

## 3. Loading

```html
<button monaButton look="primary" [loading]="saving()" (click)="save()">Save</button>
```

While `loading` is `true`:

- A spinner is shown before the content. On an `iconOnly` button the spinner replaces the icon, so the button keeps its size.
- The button sets `aria-busy="true"` and `aria-disabled="true"`.
- Clicks are blocked, including form submission and the toggle behavior, until loading ends.
- The button is **not** natively disabled and keeps its `tabindex`. Browsers move focus to the page when a focused button is disabled, so a keyboard user who pressed Save would otherwise lose their place.

To detect a loading button from CSS or tests, use `[aria-busy="true"]`, not `:disabled`.

---

## 4. Toggle Buttons

```html
<button monaButton toggleable [(selected)]="bold">Bold</button>
```

With `toggleable`, each click flips `selected`, and the button exposes `aria-pressed`. `selected` is a two-way binding, so `[(selected)]` keeps your state in sync. Read the new value in `(selectedChange)`; a `(click)` handler on the same button runs before the value changes.

---

## 5. Button Groups

```typescript
import { ButtonDirective } from '@nanahoshi/mona-ui/button';
import { ButtonGroupComponent } from '@nanahoshi/mona-ui/button-group';
```

```html
<mona-button-group selection="single" [allowEmpty]="false" aria-label="Text alignment">
    <button monaButton [(selected)]="alignLeft">Left</button>
    <button monaButton [(selected)]="alignCenter">Center</button>
    <button monaButton [(selected)]="alignRight">Right</button>
</mona-button-group>
```

- The group's `look`, `size`, `rounded` and `disabled` apply to its buttons. A button is disabled when either it or the group is.
- Buttons in a group are toggleable by default. `selection="single"` makes them behave like radio buttons; `allowEmpty="false"` keeps one selected.
- Set `[toggleable]="false"` on an action button inside a group; it then has no `aria-pressed` state.
- Only the `monaButton` elements placed directly in the group belong to it. Buttons inside a component placed in the group, or in a popup opened from one, keep their own look and behavior.

`ButtonService` is how the group talks to its buttons. It is exported for the button-group entry point; applications don't need it.

---

## 6. Accessibility

- **Icon-only buttons need a name.** Add `aria-label`, `aria-labelledby` or `title`, or visually hidden text. In dev mode, an icon-only button without one logs a `[Mona Button]` warning to the console.
- **Popup triggers:** set `aria-haspopup` to `menu`, `listbox`, `tree`, `grid`, `dialog` or `true` on a button that opens one. The default, `"false"`, omits the attribute.
- **Focus:** a keyboard-focused button shows a 2px outline in the theme's `--color-focus-indicator`, offset by 2px. It is an outline rather than a shadow, so it also shows in forced-colors (high contrast) mode.
- `tabindex` defaults to `0` and becomes `-1` while the button is disabled. A value that is not a number falls back to `0`.

---

## 7. Inputs

| Input | Type | Description |
|---|---|---|
| `aria-haspopup` | `ButtonAriaHasPopup` | Forwarded to `aria-haspopup`; `"false"` omits it. |
| `class` | `string` | Merged with the built-in classes. |
| `disabled` | `boolean` | Natively disables the button. |
| `iconOnly` | `boolean` | Square button without padding. |
| `loading` | `boolean` | Spinner, `aria-busy`, blocked clicks; stays focusable. |
| `look` | see section 2 | Visual style. Two-way bindable. |
| `rounded` | see section 2 | Corner radius. |
| `selected` | `boolean` | Pressed state of a toggle button. Two-way bindable. |
| `size` | see section 2 | Height and padding. |
| `tabindex` | `number` | Tab index while enabled. |
| `toggleable` | `boolean` | Clicks flip `selected`. Defaults to `true` inside a group. |
| `type` | `"button" \| "submit" \| "reset"` | Native button type. Defaults to `"button"`. |
