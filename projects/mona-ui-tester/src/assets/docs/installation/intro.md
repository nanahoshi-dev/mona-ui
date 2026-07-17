# Installation

To install Mona UI, run the following command in your terminal:

```bash
npm install @nanahoshi/mona-ui
```

## Setup Styles

Import the styles in your main stylesheet `styles.css`:

```css
@import "@nanahoshi/mona-ui/styles.css";
```

Enjoy building clean, accessible, and fast web applications!

## Customize Theme Colors

Register application-wide color additions and overrides in your root bootstrap providers:

```ts
import { provideThemeColors } from "@nanahoshi/mona-ui/theme";

bootstrapApplication(AppComponent, {
    providers: [
        provideThemeColors({
            theme: "mona",
            colors: {
                common: {
                    "--color-brand": "oklch(62% 0.18 280)"
                },
                light: {
                    "--color-primary": "oklch(48% 0.16 280)",
                    "--color-primary-foreground": "white"
                },
                dark: {
                    "--color-primary": "oklch(72% 0.14 280)",
                    "--color-primary-foreground": "oklch(18% 0.02 280)"
                }
            }
        })
    ]
});
```

`common` values apply to light and dark variants. Variant-specific values override `common` values. You can register the helper more than once; later providers override earlier providers while preserving unrelated values.

Theme color registrations are static root-level configuration. They customize the global theme written by `ThemeService`; component-level providers do not create independently scoped themes.

### Using New Color Names with Tailwind

Registering `--color-brand` creates the runtime CSS variable, but Tailwind discovers named utilities at build time. To generate utilities such as `bg-brand`, declare the token in your application's `@theme` block:

```css
@theme {
    --color-brand: transparent;
}
```

Alternatively, use `bg-[var(--color-brand)]` or ordinary CSS such as `color: var(--color-brand)` without adding a named Tailwind token.

### Replacing Color Resolution

Advanced integrations can provide a custom implementation of `ThemeColorStrategy` through `THEME_COLOR_STRATEGY`. Most applications should use `provideThemeColors()` instead.
