## Try It

Press a button and hold it, then let go. The rest of this site has no ripples, so this example turns them on for itself.

```example
ripple/buttons
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

Every Mona UI button then draws one, including those in button groups, dropdown buttons and split buttons. The `link` and `clear` looks don't, since they have no surface to draw it on. `provideRipple({ enabled: false })` keeps ripples off, for example behind a setting.

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

### One Button

`monaRippleDisabled` turns the ripple off for one button:

```html
<button monaButton monaRippleDisabled>Save</button>
```

## Your Own Elements

Import `RippleDirective` and add `monaRipple` to anything else people press, such as a tile:

```example
ripple/custom-element
```

The wave covers the element's padding box, in its corner radius, over its background and under its content. For that, the first press gives the element `isolation: isolate`, and makes it `relative` if its position is `static`. If the element's position can change later, set one with a class yourself, as the tiles above do with `relative`.

A Mona UI button already has the directive. Don't add `monaRipple` to one: Angular doesn't allow a directive on an element twice.

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
