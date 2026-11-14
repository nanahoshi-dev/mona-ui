## Try It

Choose a color and apply it. The whole site changes to match, and Reset brings back its own colors.

```example
theming-custom-colors/runtime-primary
```

## Color Roles

Colors in Mona UI are named for their job, not for a component, so the same text box looks right on a page and inside a popup:

| Role                 | Tokens                                                                | Used for                                                                                                 |
| -------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Canvas               | `--color-canvas`                                                      | The application's backdrop.                                                                              |
| Surfaces             | `--color-surface`, `--color-surface-muted`                            | The normal content plane, and quieter areas on it.                                                       |
| Raised and overlay   | `--color-surface-raised`, `--color-surface-overlay`                   | Elevated regions, and menus, popups and dialogs.                                                         |
| Text                 | `--color-foreground`, `--color-muted-foreground`                      | Main and secondary text.                                                                                 |
| Fields and controls  | `--color-input-background`, `--color-border-control`                  | Form fields, buttons and other outlined controls, which share a quiet border so they match side by side. |
| Interaction          | `--color-hover`, `--color-active`                                     | Neutral, temporary feedback when a control is hovered or pressed.                                        |
| Accent and selection | `--color-accent`, `--color-selected`                                  | Persistent selection and keyboard highlighting.                                                          |
| Primary              | `--color-primary`, `--color-focus-indicator`                          | Prominent buttons and links. Focus rings and selected borders use it too, by default.                    |
| Secondary            | `--color-secondary`                                                   | Actions that should stand out less than primary ones.                                                    |
| Status               | `--color-success`, `--color-error`, `--color-warning`, `--color-info` | Messages and states where the color carries meaning.                                                     |
| Charts               | `--color-chart-1` to `--color-chart-5`                                | Chart series.                                                                                            |

A role that fills a background has a `-foreground` token for the text on it, and the primary, secondary and status roles also have `-hover`, `-active`, `-subtle`, `-subtle-foreground` and `-border` tokens. This keeps brand color where it belongs: changing the primary recolors main actions and focus, without turning every hover state into the brand color.

[Theme Colors](/components/theming/colors) shows the roles in the current theme, with their contrast ratios.

## Generate a Palette from Brand Colors

`provideThemeColorPalette()` turns your brand colors into a full light and dark palette, fitted for contrast. Only `primary` is required. Add it to your application's providers:

```typescript
import { ApplicationConfig } from "@angular/core";
import { provideThemeColorPalette } from "@nanahoshi/mona-ui/theme";

export const appConfig: ApplicationConfig = {
    providers: [
        // ...your existing providers
        provideThemeColorPalette({ theme: "mona", seeds: { primary: "#7444c3" } })
    ]
};
```

`theme` names the theme the palette applies to, and each seed replaces its own role. A role without a seed keeps the theme's color:

| Seed                                  | Replaces                                                                       |
| ------------------------------------- | ------------------------------------------------------------------------------ |
| `primary`                             | The primary role, and the accent, selection and focus colors, tinted to match. |
| `secondary`                           | The secondary role.                                                            |
| `success`, `error`, `warning`, `info` | That status role.                                                              |

A seed can be any opaque CSS color, such as hex, `rgb()`, `hsl()` or `oklch()`:

```typescript
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
});
```

The seed's hue and chroma give the palette its identity. Mona UI then chooses each tone's lightness, and lowers the chroma where it must, so that text meets WCAG AA contrast and every color fits in the sRGB gamut, in light and in dark. A palette applies to the variants its theme has: both for Mona and Luna, and dark only for Anna. An invalid or translucent seed throws an error while the application starts, naming its role.

To see the colors before you use them, call `generateThemeColorPalette()`. It returns the tokens as two maps, `light` and `dark`:

```typescript
import { generateThemeColorPalette } from "@nanahoshi/mona-ui/theme";

const palette = generateThemeColorPalette({ primary: "#7444c3" });
palette.light["--color-primary"]; // An oklch() color.
```

## Override Specific Tokens

`provideThemeOverrides()` sets tokens of a registered theme to exact values. `common` applies to both variants, and `light` and `dark` to one each. A variant's value wins over `common`:

```typescript
import { provideThemeOverrides } from "@nanahoshi/mona-ui/theme";

provideThemeOverrides({
    theme: "mona",
    light: {
        colors: {
            "--color-primary": "oklch(48% 0.16 280)",
            "--color-primary-foreground": "white"
        }
    },
    dark: {
        colors: {
            "--color-primary": "oklch(72% 0.14 280)",
            "--color-primary-foreground": "oklch(18% 0.02 280)"
        }
    }
});
```

Overrides aren't only for colors. A variant takes the same sections as a theme, `colors`, `shadows`, `shape`, `motion`, `effects`, `components` and `custom`, so rounder corners for every variant look like this:

```typescript
provideThemeOverrides({
    theme: "mona",
    common: {
        shape: { "--radius-sm": "0.375rem", "--radius-md": "0.625rem", "--radius-lg": "0.875rem" }
    }
});
```

You can use `provideThemeOverrides()` more than once. Later ones win, and leave the tokens they don't name alone. A palette goes through the same steps, so to adjust a generated color, put the override after the palette:

```typescript
providers: [
    provideThemeColorPalette({ theme: "mona", seeds: { primary: "#7444c3" } }),
    provideThemeOverrides({
        theme: "mona",
        dark: { colors: { "--color-primary": "oklch(74% 0.14 308.49)" } }
    })
];
```

An override for a theme or variant that isn't registered throws while the application starts. Overrides change the application's one theme: providing them in a component doesn't give that component a theme of its own.

## Use an Exact Brand Color

A palette keeps a seed's hue and chroma, but chooses the lightness each role needs for contrast. So a palette can't reproduce an exact brand color: even `#ffffff` and `#000000` give the same palette. To use an exact color, generate a palette from it, then override the base color and its foreground:

```typescript
providers: [
    provideThemeColorPalette({ theme: "mona", seeds: { primary: "#e4002b" } }),
    provideThemeOverrides({
        theme: "mona",
        light: { colors: { "--color-primary": "#e4002b", "--color-primary-foreground": "#ffffff" } }
    })
];
```

The palette still provides the hover, pressed, subtle and selection tones, and the dark variant keeps the generated primary, which is lighter so that it stands out on dark surfaces. Check the contrast of the colors you set yourself: text on the primary color needs 4.5:1, and the primary color needs 3:1 against the surface, since focus rings use it. In development, Mona UI warns when text on the primary color is below 4.5:1.

## Let Users Choose a Color

`ThemeService.setPrimaryColor()` generates a palette from one color and applies it at once, on top of the configured theme, palette and overrides. The example at the top of this page uses it:

```typescript
import { Component, inject } from "@angular/core";
import { ThemeService } from "@nanahoshi/mona-ui/theme";

@Component({
    selector: "app-appearance-settings",
    templateUrl: "./appearance-settings.html"
})
export class AppearanceSettings {
    readonly #theme = inject(ThemeService);

    protected usePrimaryColor(color: string): void {
        this.#theme.setPrimaryColor(color);
    }

    protected restoreColors(): void {
        this.#theme.clearColorPalette();
    }
}
```

`setColorPalette()` takes the same seeds as `provideThemeColorPalette()`, for more roles than the primary. `setPrimaryColor()` changes only the primary seed and keeps any others.

- The colors stay when the user switches theme or variant, using their light or dark tones as needed.
- `clearColorPalette()` removes them, and restores the configured colors.
- `colorPaletteSeeds()` is a signal with the current seeds, or `null` when there are none, for showing the user's choice.
- A bad color throws before anything changes, so the page never shows half a palette.

`persistKey` remembers the theme, not these colors. To keep them, save the seeds in your own settings and apply them again at startup:

```typescript
import { inject, provideAppInitializer } from "@angular/core";
import { ThemeService } from "@nanahoshi/mona-ui/theme";

providers: [
    provideAppInitializer(() => {
        const seeds = loadSavedColors(); // From your own settings, or null.
        if (seeds) {
            inject(ThemeService).setColorPalette(seeds);
        }
    })
];
```

If the saved value can come from anywhere but your own code, catch the error a bad color throws, so it can't stop the application from starting.

## Add Your Own Color Names

An override can add tokens a theme doesn't have, such as a brand color for your own components:

```typescript
provideThemeOverrides({
    theme: "mona",
    light: { colors: { "--color-brand": "oklch(52% 0.18 280)" } },
    dark: { colors: { "--color-brand": "oklch(72% 0.14 280)" } }
});
```

The theme service writes it as a CSS variable like any other, but Tailwind only makes classes for the names it knows at build time. To use it as `bg-brand` or `text-brand`, declare it in your global stylesheet. The value there is only a placeholder, which the theme replaces:

```css
@theme {
    --color-brand: transparent;
}
```

Without the declaration, use `bg-(--color-brand)`, or `var(--color-brand)` in plain CSS.
