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

## Understand the Color Roles

Mona's colors describe intent instead of a specific component:

- `canvas` is the application backdrop; `surface` is the normal content plane.
- `surface-raised` contains controls and elevated regions; `surface-overlay` is reserved for menus, popups, and dialogs.
- `input-background` and the control-border tokens give form fields a quiet resting boundary; hover strengthens the border, while focus and invalid states provide the high-contrast cue.
- `hover` and `active` are neutral, temporary interaction feedback.
- `accent` is persistent selection and keyboard highlighting. Mona's built-in accent is a quiet zinc tone rather than a competing hue.
- `primary` is the stronger action color used by prominent buttons, links, and focus indicators. It is near-black in Mona Light and near-white in Mona Dark.

This separation lets the same textbox work on a page or inside a dropdown without turning every hover state into brand color. The built-in palette is monochrome except for success, error, warning, and info, where color communicates meaning.

## Generate a Palette from Brand Colors

Use `provideThemeColorPalette()` for a contrast-fitted light and dark palette. Only `primary` is required. Optional seeds replace their own role; an omitted secondary or status seed keeps Mona's built-in value.

```ts
import { provideThemeColorPalette } from "@nanahoshi/mona-ui/theme";

bootstrapApplication(AppComponent, {
    providers: [
        provideThemeColorPalette({
            theme: "mona",
            seeds: {
                primary: "#7444c3",
                secondary: "hsl(212 27% 39%)",
                success: "oklch(62% 0.14 150)",
                error: "rgb(194 65 59)",
                warning: "#b36b00",
                info: "oklch(60% 0.15 255)"
            }
        })
    ]
});
```

Seeds may use opaque CSS Color Level 4 syntax, including hex, RGB, HSL, and OKLCH. Seed hue and chroma establish identity; Mona generates variant-aware tones and adjusts lightness and chroma when required for WCAG contrast and sRGB gamut. Invalid or translucent seeds throw a role-specific configuration error.

You can also call `generateThemeColorPalette()` directly when you need to inspect the immutable light and dark color maps before registration.

## Add Explicit Color Overrides

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

Generated palettes use the same ordered provider pipeline. Place `provideThemeColors()` after `provideThemeColorPalette()` to fine-tune any generated token:

```ts
providers: [
    provideThemeColorPalette({ theme: "mona", seeds: { primary: "#7444c3" } }),
    provideThemeColors({
        theme: "mona",
        colors: { dark: { "--color-primary": "oklch(74% 0.14 308.49)" } }
    })
];
```

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
