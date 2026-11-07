# Mona UI Theming

`@nanahoshi/mona-ui/theme` writes a theme's colors, shadows, motion and materials to `<html>` as CSS variables. Components read those variables through Tailwind classes, so a theme can change while the application runs, without a stylesheet of its own.

There are three built-in themes: `mona` (light and dark), `luna` (light and dark) and `anna` (dark only).

---

## 1. Setup

Add the package's stylesheet after Tailwind:

```css
@import "tailwindcss";
@import "@nanahoshi/mona-ui/styles.css";

body {
    background-color: var(--color-canvas);
    color: var(--color-foreground);
}
```

It does two things. It tells Tailwind to scan the package for the classes its components use, and it declares the tokens those classes name in a `@theme` block. The values there are Mona Light. Without a provider they're what you get, and without the `@theme` block a class like `bg-primary` wouldn't be generated at all.

Any theme provider applies the theme at startup, before the first component renders. A configuration that can't be applied, such as an unknown theme name, throws during bootstrap.

```ts
import { provideThemeOptions } from "@nanahoshi/mona-ui/theme";

bootstrapApplication(AppComponent, {
    providers: [provideThemeOptions({ initialTheme: { name: "luna", variant: "system" } })]
});
```

An application with no theme provider has no theme written until something injects `ThemeService`.

---

## 2. Choosing a Theme

Mona Light is the default. `provideThemeOptions()` chooses another, and `ThemeService.setTheme()` switches at runtime.

```ts
import { inject } from "@angular/core";
import { ThemeService } from "@nanahoshi/mona-ui/theme";

export class AppearanceSettings {
    readonly #theme = inject(ThemeService);

    protected useDark(): void {
        this.#theme.setTheme({ name: "mona", variant: "dark" });
    }
}
```

Unknown themes and variants a theme doesn't have throw, and leave the signals and the page as they were. To offer only what exists, use `availableThemes()` to list the themes and their variants, and `supportsVariant(name, variant)` to check one.

### Following the system

`variant: "system"` follows the operating system's light or dark setting, and keeps following it. A theme with one variant, such as Anna, takes that variant whatever the system says.

- `preference()` says what was asked for, which is where `"system"` shows.
- `selection()`, `themeName()` and `themeVariant()` say what's in effect, so `themeVariant()` is only ever `"light"` or `"dark"`.

The service also sets `color-scheme` on the root, so native controls and scrollbars match the variant.

### Remembering the choice

Give `provideThemeOptions()` a `persistKey`, and `setTheme()` remembers what was chosen. It's restored in place of `initialTheme` on the next load.

```ts
providers: [provideThemeOptions({ initialTheme: { name: "mona", variant: "system" }, persistKey: "app-theme" })];
```

It's kept in `localStorage` as JSON by default. A stored value that isn't a preference, or names a theme that no longer exists, counts as nothing stored, and it stays in storage. It's only written when it changes. For anywhere else, implement `ThemeStorage` and supply it with `provideThemeStorage()`, or replace `THEME_STORAGE` by hand. A storage that throws doesn't stop the application, and reports an error in development.

### Avoiding a flash on load

The theme can't be applied before the application's code has loaded, so a dark theme can show the light canvas for a moment. A small script in `<head>` covers that gap. It sets the same variables the service sets, so the service overwrites them at startup and nothing has to be removed.

```html
<script>
    (function () {
        var stored = null;
        try {
            stored = JSON.parse(localStorage.getItem("app-theme"));
        } catch (error) {}
        var variant = stored && stored.variant !== "system" ? stored.variant : null;
        var dark = variant ? variant === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
        var root = document.documentElement.style;
        root.setProperty("color-scheme", dark ? "dark" : "light");
        root.setProperty("--color-canvas", dark ? "oklch(14.1% 0.005 285.823)" : "oklch(98.5% 0 0)");
    })();
</script>
```

Use your own key and your theme's canvas colors. The values above are Mona's. A Content Security Policy has to allow this inline script, by hash or nonce.

### Server rendering

`localStorage` can't answer on the server, so a server-rendered application gets `initialTheme` in its markup and the remembered theme on hydration. A storage the server can read too, such as a cookie, avoids that. Supply it with a factory, which runs in an injection context, where `CookieThemeStorage` is a class of your own:

```ts
providers: [provideThemeStorage(() => new CookieThemeStorage(inject(REQUEST)))];
```

Luna also changes on hydration in any case, because `backdrop-filter` support can only be read in a browser: the server renders its reduced material, and the client switches to the full one.

---

## 3. Color Roles

Mona's colors describe intent instead of a specific component:

- `canvas` is the application backdrop; `surface` is the normal content plane.
- `surface-raised` contains controls and elevated regions; `surface-overlay` is reserved for menus, popups, and dialogs.
- `input-background` and the control-border tokens give form fields a boundary of at least 3:1 on every surface, as WCAG 1.4.11 asks. Buttons and other controls whose text identifies them use the quieter `border`. Hover strengthens a field's border, and focus and invalid states add their own cue.
- `hover` and `active` are neutral, temporary interaction feedback.
- `accent` is persistent selection and keyboard highlighting. Mona's built-in accent is a quiet zinc tone rather than a competing hue.
- `primary` is the stronger action color used by prominent buttons, links, and focus indicators. It is near-black in Mona Light and near-white in Mona Dark.

This separation lets the same textbox work on a page or inside a dropdown without turning every hover state into brand color. The built-in palette is monochrome except for success, error, warning, and info, where color communicates meaning.

Not all of these reach a component through a named utility. Slider ranges, progress, switches, radio dots, tab bars and steps use an optional `--mona-indicator-color`, with `--mona-indicator-foreground` for what sits on it. Both fall back to the primary pair, and a theme sets them through `custom`. Anna uses them to keep its violet under labels while its fills use a lighter tone with 3:1 against the surface.

---

## 4. A Palette from Brand Colors

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

---

## 5. Explicit Overrides

Register application-wide color additions and overrides in your root bootstrap providers:

```ts
import { provideThemeOverrides } from "@nanahoshi/mona-ui/theme";

bootstrapApplication(AppComponent, {
    providers: [
        provideThemeOverrides({
            theme: "mona",
            common: {
                colors: {
                    "--color-brand": "oklch(62% 0.18 280)"
                }
            },
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
        })
    ]
});
```

`common` values apply to light and dark variants. Variant-specific values override `common` values. You can register the helper more than once; later providers override earlier providers while preserving unrelated values.

Generated palettes use the same ordered provider pipeline. Place `provideThemeOverrides()` after `provideThemeColorPalette()` to fine-tune any generated token:

```ts
providers: [
    provideThemeColorPalette({ theme: "mona", seeds: { primary: "#7444c3" } }),
    provideThemeOverrides({
        theme: "mona",
        dark: { colors: { "--color-primary": "oklch(74% 0.14 308.49)" } }
    })
];
```

Theme registrations are static root-level configuration. They customize the global theme written by `ThemeService`; component-level providers do not create independently scoped themes.

---

## 6. Brand Colors at Runtime

Inject `ThemeService` when the application user can choose a brand color after bootstrap. A single primary seed regenerates all related semantic roles and updates the root variables immediately:

```ts
import { inject } from "@angular/core";
import { ThemeService } from "@nanahoshi/mona-ui/theme";

export class AppearanceSettings {
    readonly #theme = inject(ThemeService);

    protected usePrimaryColor(color: string): void {
        this.#theme.setPrimaryColor(color);
    }

    protected restoreConfiguredPalette(): void {
        this.#theme.clearColorPalette();
    }
}
```

Use `setColorPalette()` when users can customize more roles:

```ts
themeService.setColorPalette({
    primary: "#3f6be2",
    secondary: "#526070",
    success: "#287a4b"
});
```

The runtime palette is applied after registered profiles and provider overrides. It remains active when `setTheme()` switches families or variants, using its generated light or dark tones as appropriate. `clearColorPalette()` restores the provider-resolved palette. `colorPaletteSeeds` is a readonly signal for displaying the current runtime choice.

Runtime updates are atomic: invalid or translucent colors throw before the active profile, signals, or root styles change. `persistKey` remembers the theme, not the palette. To keep a runtime palette, save its seeds in your own settings store and apply them again at startup.

A seed gives a hue and a chroma, and Mona chooses the lightness each role needs for contrast. `setPrimaryColor("#fff")` and `setPrimaryColor("#000")` come to the same color, so a palette can't reproduce an exact brand color. To use one, set it with `provideThemeOverrides()`, and check its contrast yourself.

---

## 7. Registering a Theme

Custom families provide one or both variants. Every declared variant is a complete, independent `ThemeProfile` with `colors`, `shadows`, `motion`, `effects`, `shape`, and `components` sections:

```ts
import { provideThemeFamily, type ThemeFamilyRegistration } from "@nanahoshi/mona-ui/theme";
import { auroraDarkProfile } from "./aurora-dark-profile";

const auroraTheme = {
    name: "aurora",
    variants: { dark: auroraDarkProfile }
} satisfies ThemeFamilyRegistration;

providers: [provideThemeFamily(auroraTheme)];
```

The profile must declare the full canonical token contract. The required `effects` section defines control, raised, and overlay materials, including opaque fallbacks; `shape` defines the shared small, medium, and large radius scale. Optional custom variables may not collide with required profile variables. Mona UI automatically substitutes effect fallbacks when backdrop filtering is unavailable or reduced transparency is requested.

### Using New Color Names with Tailwind

Registering `--color-brand` creates the runtime CSS variable, but Tailwind discovers named utilities at build time. To generate utilities such as `bg-brand`, declare the token in your application's `@theme` block:

```css
@theme {
    --color-brand: transparent;
}
```

Alternatively, use `bg-(--color-brand)` or ordinary CSS such as `color: var(--color-brand)` without adding a named Tailwind token.

A custom theme can start from a built-in one, since `monaTheme`, `lunaTheme`, `annaTheme` and `builtInThemes` are exported. A strategy can wrap `DefaultThemeStrategy`, and a custom one can report its themes through an optional `availableThemes()`. Without it, `ThemeService.availableThemes()` is empty.

### What's checked

A name with whitespace, a duplicate theme, a theme with no variants, and an override for a theme or variant that doesn't exist all throw when the application starts.

In development, custom themes and overrides are also checked, and each problem logs a warning:

- A value that isn't a color.
- A custom variable without `--`.
- A main pair below what AA needs: 4.5:1 for `--color-foreground` and `--color-muted-foreground` on `--color-surface`, `--color-input-foreground` on `--color-input-background`, and `--color-primary-foreground` on `--color-primary`, and 3:1 for `--color-border-control` on `--color-input-background`, and `--color-focus-indicator` and `--color-selected-border` on `--color-surface`.

Values it can't read, such as `color-mix()`, aren't reported, because they may well be right.

---

## 8. Theming Part of a Page

`provideThemeRoot()` writes the theme to an element in place of `<html>`, for an application embedded in a larger page. It sets `THEME_ROOT`, which defaults to `<html>`. The element, or a factory for it, has to exist at startup.

```ts
providers: [provideThemeRoot(() => document.getElementById("app-shell"))];
```

- Overlays render outside that element, so the overlay container gets the theme too. It gets it a moment after startup, because the overlay module loads on demand, and an overlay opened before that gets its colors when it arrives.
- Only what's in the overlay container follows. A full-page spinner sits on `body`, so it keeps the page's own colors.
- Charts inside the element follow a switch.

### One writer for each element

Only one service should write to an element. If two do, the later one owns it: it warns in development, and the earlier one's `selection()` stops being true. Give each application its own element with `provideThemeRoot()`.

A theme is written once per application. Component-level providers don't create a theme of their own.

When the application's injector is destroyed, the service removes the variables and the `data-mona-*` attributes it wrote, and `color-scheme` with them.

---

## 9. Attributes on the Root

| Attribute                | Value                                                                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `data-mona-theme`        | The theme's name.                                                                                                                     |
| `data-mona-variant`      | `light` or `dark`.                                                                                                                    |
| `data-mona-transparency` | `full`, or `reduced` when materials are opaque, because the browser has no `backdrop-filter` or the user asked for less transparency. |

---

## 10. Contrast and Forced Colors

The built-in themes meet WCAG AA, and a spec checks them: text is 4.5:1, and field borders, focus indicators, selected borders, chart colors and scrollbar thumbs are 3:1. There are no `prefers-contrast` rules, since the tokens don't need them.

In forced colors the browser replaces most of these colors, and rings and many backgrounds don't paint. When you add your own styles to a component or build on the tokens:

- Pair `outline-none` with `focus-visible:outline-hidden`, which draws an outline there and nothing elsewhere.
- Give a state drawn only by a background `forced-colors:bg-[Highlight]`.
- Where the color is the content, or text sits on it, use `forced-color-adjust-none`. Otherwise the browser paints a Canvas backplate behind the text, which can leave it white on white.

---

## 11. Replacing Profile Resolution

Advanced integrations can provide their own `ThemeStrategy` through `THEME_STRATEGY`. Most applications should use the family and override providers instead.
