## Try It

Press a button and hold it, then let go. The rest of this site has no ripples, so this example turns them on for itself.

```example
ripple/buttons
```

Chips that toggle, tabs and list items ripple too:

```example
ripple/components
```

## Turn Ripples On

Add `provideRipple()` to your application's providers:

```typescript
import { ApplicationConfig } from "@angular/core";
import { provideRipple } from "@nanahoshi/mona-ui/ripple";

export const appConfig: ApplicationConfig = {
    providers: [
        // ...your existing providers
        provideRipple()
    ]
};
```

These then draw one when pressed:

| Component                    | Ripples                                                                                                                                                  |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Buttons                      | Every look but `link` and `clear`, which have no surface to draw it on. That includes the buttons of button groups, dropdown buttons and split buttons. |
| Chips                        | A chip that toggles or is a link. A chip that only shows a value does nothing when pressed, so it doesn't ripple.                                        |
| Tabs                         | Every tab but a disabled one.                                                                                                                            |
| List items                   | The items of List Box, List View, and the popups of Dropdown List, Combo Box, Auto Complete and Multi Select, when they can be selected or navigated.   |

A press on a control inside one of these, such as a chip's remove button, a tab's close button, or a button in a list item's template, belongs to that control, so the item around it doesn't ripple. `provideRipple({ enabled: false })` keeps ripples off, for example behind a setting.

### Part of an Application

Provide `RIPPLE_OPTIONS` on a component to turn ripples on or off for everything inside it:

```typescript
import { Component } from "@angular/core";
import { RIPPLE_OPTIONS } from "@nanahoshi/mona-ui/ripple";

@Component({
    selector: "app-toolbar",
    providers: [{ provide: RIPPLE_OPTIONS, useValue: { enabled: true } }],
    templateUrl: "./toolbar.component.html"
})
export class ToolbarComponent {}
```

### One Button or Chip

`monaRippleDisabled` turns the ripple off for one button or chip:

```html
<button monaButton monaRippleDisabled>Save</button>
<mona-chip label="Archived" toggleable monaRippleDisabled></mona-chip>
```

## Your Own Elements

Import `RippleDirective` and add `monaRipple` to anything else people press, such as a tile:

```example
ripple/custom-element
```

The wave covers the element's padding box, in its corner radius, over its background and under its content. For that, the first press gives the element `isolation: isolate`, and makes it `relative` if its position is `static`. If the element's position can change later, set one with a class yourself, as the tiles above do with `relative`.

Mona UI's buttons and chips already have the directive. Don't add `monaRipple` to one: Angular doesn't allow a directive on an element twice. As on Mona UI's own components, a press on a button, link or form field inside the element doesn't make it ripple.

## Customize It

Three tokens set how the ripple looks and moves. It has its own timing rather than the theme's motion tokens, which keep menus and popups brisk:

| Token                         | Default | Sets                                                       |
| ----------------------------- | ------- | ---------------------------------------------------------- |
| `--mona-ripple-opacity`       | `12%`   | How much of the element's text color the wave shows.       |
| `--mona-ripple-duration`      | `450ms` | How long the wave takes to spread.                         |
| `--mona-ripple-fade-duration` | `300ms` | How long it takes to fade, once it has finished spreading. |

The wave starts moving at once and slows as it spreads, so a press shows straight away even at a longer duration. Set the tokens in your styles, for the whole page or for one element:

```css
:root {
    --mona-ripple-opacity: 16%;
    --mona-ripple-duration: 600ms;
}
```

## Accessibility

The ripple is decoration, so nothing changes for assistive technology:

- Its layer is hidden from screen readers and takes no pointer events.
- There's no ripple with the system's reduced motion setting. The pressed background still shows the press.
- There's no ripple in forced colors, where it would paint as a solid block.
- Keyboard presses draw none. The focus indicator already shows where they act.
- Disabled, `aria-disabled` and loading buttons draw none.
