# Theming

Every color, shadow, corner radius and animation speed in Mona UI comes from a theme. You can pick one of the built-in themes, let users switch between light and dark, generate colors from your brand, or register a theme of your own. This page explains how themes work and covers the everyday tasks. The pages under it go into detail.

## How Theming Works

A theme is a set of design tokens: named values such as `--color-primary` or `--radius-md`. Mona UI's `ThemeService` writes the active theme's tokens to the `<html>` element as CSS variables, and the components read them through Tailwind classes such as `bg-primary`. When the theme changes, the whole application follows at once, without a reload.

A theme defines these kinds of tokens:

| Tokens           | Examples                                       | What they control                                                |
| ---------------- | ---------------------------------------------- | ---------------------------------------------------------------- |
| Colors           | `--color-surface`, `--color-primary`           | Backgrounds, text, borders and states.                           |
| Shadows          | `--shadow-control`, `--shadow-raised`          | How far controls, raised panels and overlays stand off the page. |
| Shape            | `--radius-sm`, `--radius-md`, `--radius-lg`    | Corner radii.                                                    |
| Motion           | `--mona-motion-fast`, `--mona-motion-standard` | Animation durations.                                             |
| Materials        | `--mona-effect-overlay-backdrop-filter`        | Translucent, blurred backgrounds, such as Luna's glass.          |
| Component tokens | `--mona-menubar-background`                    | Details of single components.                                    |

Most themes have a light and a dark variant. The theme and the variant together, such as Mona Dark, decide which tokens are in effect.

## Built-in Themes

| Theme | Variants    | Look                                                                                |
| ----- | ----------- | ----------------------------------------------------------------------------------- |
| Mona  | Light, dark | Neutral grays, with color kept for status. The default.                             |
| Luna  | Light, dark | Clean surfaces with a blue primary, and translucent glass on controls and overlays. |
| Anna  | Light, dark | Graphite grays with a deep violet primary, and flat controls a shade lighter.       |

[Built-in Themes](/components/theming/built-in-themes) shows each one side by side, with real components.

## Choose a Theme

Without any setup, Mona UI uses Mona Light. To use another theme, add `provideThemeOptions` to your application's providers, usually in `src/app/app.config.ts`:

```typescript
import { ApplicationConfig } from "@angular/core";
import { provideThemeOptions } from "@nanahoshi/mona-ui/theme";

export const appConfig: ApplicationConfig = {
    providers: [
        // ...your existing providers
        provideThemeOptions({ initialTheme: { name: "luna", variant: "light" } })
    ]
};
```

The theme is applied before the first component renders. A theme or variant that doesn't exist throws an error while the application starts, so a typo shows up right away.

Mona UI's stylesheet declares Mona Light's tokens for Tailwind, so its classes exist at build time and the page has colors before any code runs. An application without a theme provider keeps those values until something injects `ThemeService`.

## Switch Themes at Runtime

Inject `ThemeService` and call `setTheme()`:

```typescript
import { Component, inject } from "@angular/core";
import { ThemeService } from "@nanahoshi/mona-ui/theme";

@Component({
    selector: "app-appearance-settings",
    templateUrl: "./appearance-settings.html"
})
export class AppearanceSettings {
    readonly #theme = inject(ThemeService);

    protected useDarkMode(): void {
        this.#theme.setTheme({ name: "mona", variant: "dark" });
    }
}
```

`availableThemes()` lists the registered themes and their variants, so a menu built from it offers only what exists. In a component with `protected readonly theme = inject(ThemeService)`:

```html
@for (option of theme.availableThemes(); track option.name) {
    @for (variant of option.variants; track variant) {
        <button monaButton type="button" (click)="theme.setTheme({ name: option.name, variant })">
            {{ option.name }} {{ variant }}
        </button>
    }
}
```

`setTheme()` throws for a theme that isn't registered, or a variant the theme doesn't have, and leaves the current theme in place. To check first, call `supportsVariant(name, variant)`.

## Follow the System's Light or Dark Setting

Set the variant to `"system"`:

```typescript
provideThemeOptions({ initialTheme: { name: "mona", variant: "system" } });
```

The theme then follows the operating system's light or dark setting, and keeps following it when the setting changes. `setTheme({ name: "luna", variant: "system" })` does the same at runtime. A theme with a single variant, such as a dark-only theme of your own, uses that variant whatever the system says.

The service also sets `color-scheme` on the root element, so native controls and scrollbars match the variant.

### Read the Current Theme

`ThemeService` reports the theme through signals, so templates and `computed()` values update when it changes:

| Signal           | Value                                                                                               |
| ---------------- | --------------------------------------------------------------------------------------------------- |
| `preference()`   | What was asked for, such as `{ name: "mona", variant: "system" }`.                                  |
| `selection()`    | What's in effect, such as `{ name: "mona", variant: "dark" }`. Its variant is always light or dark. |
| `themeName()`    | The name from `selection()`.                                                                        |
| `themeVariant()` | The variant from `selection()`: `"light"` or `"dark"`.                                              |
| `profile()`      | Every token in effect.                                                                              |

For example, `computed(() => theme.themeVariant() === "dark")` says whether a dark variant is showing, including when it came from the system setting.

## Remember the User's Choice

Give `provideThemeOptions` a `persistKey`, and `setTheme()` remembers the choice. On the next visit, it's restored in place of `initialTheme`:

```typescript
provideThemeOptions({
    initialTheme: { name: "mona", variant: "system" },
    persistKey: "app-theme"
});
```

The choice is kept in `localStorage`, as JSON, under that key. A stored value that isn't a valid choice, or names a theme that no longer exists, counts as nothing stored.

To keep it somewhere else, implement `ThemeStorage` and supply it with `provideThemeStorage()`, which replaces the `THEME_STORAGE` token:

```typescript
export interface ThemeStorage {
    /** The stored choice, or null when there's none or this storage can't answer. */
    read(key: string): ThemePreference | null;
    /** Stores the choice. It must not throw. */
    write(key: string, preference: ThemePreference): void;
}
```

A storage that throws anyway doesn't stop the application, and reports an error in development.

## Avoid a Flash on Load

The theme can't be applied before the application's code has loaded, so a dark theme can show the light background for a moment. A small script in the `<head>` of `src/index.html` covers that gap. It sets the same variables as the service, which overwrites them when it starts, so nothing has to be removed later:

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

Use your own `persistKey` and your theme's canvas colors. The values above are Mona's. If your site has a Content Security Policy, it has to allow this inline script, by hash or nonce.

## Server-Side Rendering

`localStorage` isn't available on the server, so a server-rendered page shows `initialTheme` until the browser takes over and restores the remembered theme. A storage the server can read too, such as a cookie, avoids that switch. Supply it with a factory, which runs in an injection context, so it can inject the request. Here `CookieThemeStorage` is a class of your own:

```typescript
providers: [provideThemeStorage(() => new CookieThemeStorage(inject(REQUEST)))];
```

Luna changes on hydration in any case, because only a browser can say whether it supports `backdrop-filter`. The server renders its opaque materials, and the browser switches to the translucent ones.

## Use Theme Tokens in Your Own Styles

Your own components can use the same tokens, so they follow the theme too. Mona UI's stylesheet registers them with Tailwind, so they work as classes:

```html
<section class="rounded-lg border border-border bg-surface p-4 text-foreground shadow-raised">
    <h2 class="font-semibold">Storage</h2>
    <p class="text-muted-foreground">You've used 70% of your plan.</p>
</section>
```

The tokens you'll use most:

| Purpose                    | Classes                                                                                                                     |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Page background            | `bg-canvas`                                                                                                                 |
| Content background         | `bg-surface`, `bg-surface-muted`                                                                                            |
| Raised panels and overlays | `bg-surface-raised`, `bg-surface-overlay`                                                                                   |
| Text                       | `text-foreground`, `text-muted-foreground`                                                                                  |
| Borders                    | `border-border`, `border-border-subtle`                                                                                     |
| Main action                | `bg-primary text-primary-foreground`                                                                                        |
| Status                     | `bg-error text-error-foreground`, `bg-success-subtle text-success-subtle-foreground`, and the same for `warning` and `info` |
| Hover and pressed          | `hover:bg-hover`, `active:bg-active`                                                                                        |
| Shadows                    | `shadow-control`, `shadow-raised`, `shadow-overlay`                                                                         |
| Corners                    | `rounded-sm`, `rounded-md`, `rounded-lg`                                                                                    |

Use a background with its matching foreground, such as `bg-primary` with `text-primary-foreground`. Each theme makes those pairs readable together. [Color Roles](/components/theming/custom-colors#color-roles) explains what each color is for, and [Theme Colors](/components/theming/colors) shows them in the current theme, with their contrast.

In plain CSS, read the variables directly:

```css
.storage-note {
    color: var(--color-muted-foreground);
    transition: opacity var(--mona-motion-fast);
}
```

### Style Light and Dark Differently

The tokens already change with the variant, so most styles need nothing more. For the rest, the theme service sets these attributes on the root element:

| Attribute                | Value                                                                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| `data-mona-theme`        | The theme's name, such as `mona`.                                                                                                    |
| `data-mona-variant`      | `light` or `dark`.                                                                                                                   |
| `data-mona-transparency` | `full`, or `reduced` when materials are opaque because the browser has no `backdrop-filter` or the user asked for less transparency. |

Tailwind's `dark:` variant follows the operating system, not the theme. To make it follow the theme, add this line to your global stylesheet, after the imports:

```css
@custom-variant dark (&:where([data-mona-variant="dark"], [data-mona-variant="dark"] *));
```

Classes such as `dark:invert` then apply whenever a dark variant is in effect, including one chosen by the system setting.

## Theme Part of a Page

By default, the theme is written to `<html>`. For an application embedded in a larger page, `provideThemeRoot()` writes it to an element of your own instead, by setting the `THEME_ROOT` token. The element, or a factory that returns it, has to exist when the application starts:

```typescript
providers: [provideThemeRoot(() => document.getElementById("app-shell"))];
```

- Overlays, such as popups and dialogs, render outside that element, so their container gets the theme too. It arrives shortly after startup, because the overlay code loads on demand. An overlay opened before then takes its colors when it does.
- Only what's in the overlay container follows the theme. A full-page spinner sits on `body`, so it keeps the page's own colors.
- Only one application should write to an element. If two do, the later one takes over and warns in development. Give each application its own element.

When the application is destroyed, the service removes the variables, the `data-mona-*` attributes and `color-scheme` it wrote.

## Accessibility

The built-in themes meet WCAG AA contrast, with one deliberate exception. A form field's border is quiet by default, below the 3:1 that WCAG 1.4.11 asks for, so fields don't crowd the page. Hover changes the border, and focus and invalid states add a cue of their own.

When the user asks for more contrast, with the operating system's setting that sets `prefers-contrast: more`, the border of fields, buttons and other controls rises to at least 3:1 on every surface, and a slider's track gains a border. If your application has to meet 1.4.11 for every user, give the borders 3:1 in a [custom theme](/components/theming/custom-themes#contrast-borders).

In forced colors mode, such as Windows' contrast themes, the browser replaces most colors, and box shadows and many backgrounds aren't drawn. When you style components yourself or build on the tokens:

- Pair `outline-none` with `focus-visible:outline-hidden`, which draws an outline in forced colors and nothing elsewhere.
- Give a state drawn only by a background `forced-colors:bg-[Highlight]`.
- Where the color is the content, such as a swatch, or text sits on a color, add `forced-color-adjust-none`. Otherwise the browser paints a backplate behind the text, which can leave it white on white.

## Customize Further

| To                                                            | Use                              | See                                                                                |
| ------------------------------------------------------------- | -------------------------------- | ---------------------------------------------------------------------------------- |
| Generate a palette from your brand colors                     | `provideThemeColorPalette()`     | [Custom Colors](/components/theming/custom-colors)                                 |
| Change specific tokens, such as one color or the corner radii | `provideThemeOverrides()`        | [Custom Colors](/components/theming/custom-colors#override-specific-tokens)        |
| Let users choose a color                                      | `ThemeService.setPrimaryColor()` | [Custom Colors](/components/theming/custom-colors#let-users-choose-a-color)        |
| Register a theme of your own                                  | `provideThemeFamily()`           | [Custom Themes](/components/theming/custom-themes)                                 |
| Decide yourself how themes resolve to tokens                  | The `THEME_STRATEGY` token       | [Custom Themes](/components/theming/custom-themes#replace-how-themes-are-resolved) |
