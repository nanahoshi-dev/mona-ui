## Start from a Built-in Theme

The quickest custom theme copies a built-in one and changes some of its tokens. This one takes Mona, gives it a teal palette and rounder corners, and names it `ocean`:

```typescript
import { generateThemeColorPalette, monaTheme, type ThemeFamilyRegistration } from "@nanahoshi/mona-ui/theme";

const palette = generateThemeColorPalette({ primary: "#0f766e" });
const shape = { "--radius-sm": "0.375rem", "--radius-md": "0.625rem", "--radius-lg": "0.875rem" };

export const oceanTheme = {
    name: "ocean",
    variants: {
        light: {
            ...monaTheme.variants.light,
            colors: { ...monaTheme.variants.light.colors, ...palette.light },
            shape
        },
        dark: {
            ...monaTheme.variants.dark,
            colors: { ...monaTheme.variants.dark.colors, ...palette.dark },
            shape
        }
    }
} satisfies ThemeFamilyRegistration;
```

Register it with `provideThemeFamily()`, then select it like any other theme:

```typescript
providers: [
    provideThemeFamily(oceanTheme),
    provideThemeOptions({ initialTheme: { name: "ocean", variant: "system" } })
];
```

`availableThemes()` now lists Ocean next to the built-in themes, and `setTheme({ name: "ocean", variant: "dark" })` switches to it. Unlike [overrides](/components/theming/custom-colors#override-specific-tokens) on Mona, this keeps Mona as it was, so users can choose between the two.

## Register a Theme

`provideThemeFamily()` takes a theme's `name` and its `variants`. A theme needs at least one variant. With a single one, `variant: "system"` always gives that one:

```typescript
import { provideThemeFamily, type ThemeFamilyRegistration } from "@nanahoshi/mona-ui/theme";
import { auroraDarkProfile } from "./aurora-dark-profile";

const auroraTheme = {
    name: "aurora",
    variants: { dark: auroraDarkProfile }
} satisfies ThemeFamilyRegistration;

providers: [provideThemeFamily(auroraTheme)];
```

Register themes in the application's root providers. The theme service writes one theme for the whole application, so a theme provided in a component isn't scoped to that component.

## What a Theme Defines

Each variant is a complete `ThemeProfile`, with these sections:

| Section      | Tokens                                                                             | What they control                                                                                                |
| ------------ | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `colors`     | Every `--color-*` token that Mona Light defines                                    | Backgrounds, text, borders, states and charts. See [Color Roles](/components/theming/custom-colors#color-roles). |
| `shadows`    | `--shadow-control`, `--shadow-raised`, `--shadow-overlay`                          | How far controls, raised panels and overlays stand off the page.                                                 |
| `shape`      | `--radius-sm`, `--radius-md`, `--radius-lg`                                        | Corner radii.                                                                                                    |
| `motion`     | `--mona-motion-fast`, `--mona-motion-standard`                                     | Animation durations.                                                                                             |
| `effects`    | `--mona-effect-*`, for the `control`, `raised`, `overlay` and `backdrop` materials | Translucent or opaque backgrounds, and the backdrop behind a modal. See [Materials](#materials).                 |
| `components` | Tokens for single components, such as `--mona-menubar-background`                  | Calendar, list, menubar, pager and slider details.                                                               |
| `custom`     | Optional. Any other variables                                                      | Optional tokens, such as [indicator colors](#indicator-colors), and tokens of your own.                          |

Every token in the first six sections is required, except the two [contrast borders](#contrast-borders). A variant that's missing one throws while the application starts, and the error lists what's missing. The easiest way to get them all is to start from a built-in theme, or to copy one of its variants, such as `monaTheme.variants.light`, and change the values.

A variable in `custom` can't reuse the name of a required token. To add a color name for Tailwind classes, see [Add Your Own Color Names](/components/theming/custom-colors#add-your-own-color-names).

### Materials

The `effects` section defines four materials: `control` for fields and similar controls, `raised` for elevated panels, `overlay` for menus, popups and dialogs, and `backdrop` for what dims the page behind a modal dialog, window or sheet. Each material has four tokens. Here is Luna Light's overlay:

```typescript
"--mona-effect-overlay-background-color": "rgb(249 249 250 / 0.72)",
"--mona-effect-overlay-fallback-background-color": "#f9f9fa",
"--mona-effect-overlay-background-image": "none",
"--mona-effect-overlay-backdrop-filter": "blur(28px) saturate(115%)"
```

When the browser has no `backdrop-filter`, or the user asks for less transparency, the theme service uses the fallback color and drops the image and the filter. So the fallback has to be opaque, and readable on its own. For an opaque theme, use the same color for both and `none` for the image and the filter, as Mona does: `monaTheme.variants.light.effects` is a good starting point.

### The Backdrop

The backdrop is the exception: its fallback stays translucent, since it has to show the page it dims. Every built-in theme dims the page with half its background color and blurs it slightly:

```typescript
"--mona-effect-backdrop-background-color": "color-mix(in oklab, var(--color-background) 50%, transparent)",
"--mona-effect-backdrop-fallback-background-color": "color-mix(in oklab, var(--color-background) 50%, transparent)",
"--mona-effect-backdrop-background-image": "none",
"--mona-effect-backdrop-backdrop-filter": "blur(4px)"
```

For a dim without the blur, set `--mona-effect-backdrop-backdrop-filter` to `none`. A spinner's overlay keeps a dim of its own, but takes the backdrop's filter, so it stops blurring too. To change only that in a built-in theme, [override](/components/theming/custom-colors#override-specific-tokens) the one token:

```typescript
provideThemeOverrides({
    theme: "mona",
    common: { effects: { "--mona-effect-backdrop-backdrop-filter": "none" } }
});
```

When the user asks for less transparency, the theme service drops the blur in any case, and the page stays dimmed.

### Indicator Colors

Where a fill alone shows a value, as in slider ranges, progress bars, switches, radio buttons, tab bars and steps, components draw it with `--mona-indicator-color`, and what sits on the fill with `--mona-indicator-foreground`. Both fall back to the primary color and its foreground.

If your primary color doesn't reach 3:1 against the surface on its own, set them in `custom`, as Anna Dark does with a lighter violet:

```typescript
custom: {
    "--mona-indicator-color": "var(--color-primary-border)",
    "--mona-indicator-foreground": "#161718"
}
```

Where the primary color is text, as in the calendar's heading and the editor's links, components use `--mona-primary-text-color`, which also falls back to the primary color. If your primary color doesn't reach 4.5:1 against the surface, set it to a lighter tone, as Anna Dark does with its focus violet:

```typescript
custom: {
    "--mona-primary-text-color": "var(--color-focus-indicator)"
}
```

### Focus Rings

A focused control's border takes `--color-focus-indicator`, with a ring of the same color around it. An invalid control does the same in `--color-error`. Two variables shape the ring, and a theme sets them in `custom`:

- `--mona-focus-ring-width` is how wide the ring is. It falls back to `2px`.
- `--mona-focus-ring-opacity` is how strong the ring's color is, as a percentage. It falls back to `35%`, a soft halo.

For a solid line, as Rena draws, make the ring narrower and opaque. With the border, it reads as one 2 px line:

```typescript
custom: {
    "--mona-focus-ring-width": "1px",
    "--mona-focus-ring-opacity": "100%"
}
```

The ring and a control's shadow are drawn together, as one `box-shadow`. So for no shadow, write `0 0 #0000`, as Anna does for its flat controls, not `none`: a shadow token set to `none` hides the ring of every control that uses it.

### Contrast Borders

`--color-border-control-contrast` and `--color-border-control-contrast-hover` are the only optional colors. When the user asks for more contrast, the theme service uses them in place of `--color-border-control` and `--color-border-control-hover`, for fields, buttons, chips, chart gridlines and everything else that shares those borders. Give them at least 3:1 against `--color-input-background`. A theme without them keeps its usual borders.

To meet WCAG 1.4.11 for every user, not only those who ask for more contrast, give `--color-border-control` and `--color-border-control-hover` themselves 3:1.

## What's Checked

These throw while the application starts:

- A theme name that's empty or contains whitespace, or is already registered, including the built-in names.
- A theme without variants, or a variant missing a required token.
- A `custom` variable that reuses a required token's name.
- An override for a theme or variant that isn't registered.

In development, custom themes and overrides are also checked, and each problem logs a warning:

- A value that isn't a color.
- A custom variable whose name doesn't start with `--`.
- A shadow set to `none`, which hides the [focus ring](#focus-rings). Use `0 0 #0000` for no shadow.
- A pair below the contrast WCAG AA asks for:
    - 4.5:1 for `--color-foreground` and `--color-muted-foreground` on `--color-surface`, `--color-input-foreground` on `--color-input-background`, and `--color-primary-foreground` on `--color-primary`.
    - 3:1 for `--color-focus-indicator` and `--color-selected-border` on `--color-surface`, and for the contrast borders on `--color-input-background`, when the theme sets them.

Values the check can't read, such as `color-mix()`, aren't reported, because they may well be right.

## Replace How Themes Are Resolved

Behind the theme service, a `ThemeStrategy` turns a theme's name and variant into its tokens. The default, `DefaultThemeStrategy`, uses the registered themes and overrides. To decide yourself, provide your own through the `THEME_STRATEGY` token. This one adds a tenant's colors to whichever theme is selected:

```typescript
import { inject } from "@angular/core";
import {
    DefaultThemeStrategy,
    THEME_STRATEGY,
    type ThemeAvailability,
    type ThemeProfile,
    type ThemeSelection,
    type ThemeStrategy
} from "@nanahoshi/mona-ui/theme";

class TenantThemeStrategy implements ThemeStrategy {
    readonly #themes = new DefaultThemeStrategy([], []);
    readonly #tenant = inject(TenantSettings);

    public availableThemes(): readonly ThemeAvailability[] {
        return this.#themes.availableThemes();
    }

    public resolve(selection: ThemeSelection): ThemeProfile {
        const profile = this.#themes.resolve(selection);
        return { ...profile, colors: { ...profile.colors, ...this.#tenant.colors(selection.variant) } };
    }
}

providers: [{ provide: THEME_STRATEGY, useClass: TenantThemeStrategy }];
```

`TenantSettings` stands for a service of your own. A custom strategy replaces the registered themes and overrides, so pass the themes it should know to `DefaultThemeStrategy` yourself: its arguments are a list of themes and a list of overrides. Without an `availableThemes()` method, `ThemeService.availableThemes()` is empty.

Most applications don't need a strategy of their own. Themes, palettes and overrides cover nearly every case.
