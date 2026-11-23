## API

Everything below is imported from `@nanahoshi/mona-ui/ripple`.

### `RippleDirective`

**Selector:** `[monaRipple]`

Draws a ripple when the element is pressed. Mona UI's buttons and the other components people press apply it themselves.

| Input                | Type      | Default | Description                                                                                                                          |
| -------------------- | --------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `monaRippleDisabled` | `boolean` | `false` | Turns the ripple off for this element while ripples are on. Buttons, chips, check boxes, radio buttons and switches take it as well. |

### Providers

| Provider                 | Description                                                                                  |
| ------------------------ | -------------------------------------------------------------------------------------------- |
| `provideRipple(options)` | Turns ripples on for the application. `options` is optional; `{ enabled: false }` keeps them off. |

### Tokens

| Token            | Type            | Default              |
| ---------------- | --------------- | -------------------- |
| `RIPPLE_OPTIONS` | `RippleOptions` | `{ enabled: false }` |

### Exported Types and Values

- **Types:** `RippleOptions`, with `enabled`.
- **Values:** `DEFAULT_RIPPLE_OPTIONS`, what `RIPPLE_OPTIONS` holds when nothing is provided.
