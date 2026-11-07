## API

### `ThemeService`

Provided in root. It's created by any theme provider at startup, or by the first thing that injects it.

#### Signals

| Name                | Type                                     | Description                                                         |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------- |
| `colorPaletteSeeds` | `Signal<ThemeColorPaletteSeeds \| null>` | The seeds of the runtime palette, or `null` when none is active.    |
| `preference`        | `Signal<ThemePreference>`                | What was asked for. This is where `"system"` shows.                 |
| `profile`           | `Signal<ThemeProfile>`                   | The tokens in effect.                                               |
| `selection`         | `Signal<ThemeSelection>`                 | The theme and variant in effect, which is always `light` or `dark`. |
| `themeName`         | `Signal<ThemeName>`                      | The name from `selection`.                                          |
| `themeVariant`      | `Signal<ThemeVariant>`                   | The variant from `selection`.                                       |

#### Methods

| Method                           | Description                                                                                                   |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `availableThemes()`              | The registered themes and their variants. Empty for a custom strategy with no `availableThemes()` of its own. |
| `clearColorPalette()`            | Removes the runtime palette, and restores the registered profile and overrides.                               |
| `setColorPalette(seeds)`         | Applies a generated palette after all overrides, and keeps it across theme switches. Throws on a bad seed.    |
| `setPrimaryColor(primary)`       | Changes only the primary seed, and keeps any other seeds.                                                     |
| `setTheme(preference)`           | Switches theme, and remembers it if there's a `persistKey`. Throws on an unknown theme or variant.            |
| `supportsVariant(name, variant)` | Whether `setTheme` would accept this.                                                                         |

### Providers

| Provider                            | Description                                                                                 |
| ----------------------------------- | ------------------------------------------------------------------------------------------- |
| `provideThemeOptions(options)`      | Sets `initialTheme`, and `persistKey` if the theme should be remembered.                    |
| `provideThemeFamily(registration)`  | Registers a theme with one or both variants.                                                |
| `provideThemeOverrides(override)`   | Changes tokens of a registered theme. Later providers override earlier ones.                |
| `provideThemeColorPalette(palette)` | Generates a light and a dark palette from seed colors, and applies whichever the theme has. |
| `provideThemeRoot(root)`            | Writes the theme to an element in place of `<html>`, and to the overlay container.          |
| `provideThemeStorage(storage)`      | Replaces where the theme is remembered. It's only used when there's a `persistKey`.         |

### Tokens

| Token            | Type                  | Default                                       |
| ---------------- | --------------------- | --------------------------------------------- |
| `THEME_ROOT`     | `HTMLElement \| null` | `document.documentElement`                    |
| `THEME_STORAGE`  | `ThemeStorage`        | `LocalStorageThemeStorage`                    |
| `THEME_STRATEGY` | `ThemeStrategy`       | `DefaultThemeStrategy` with what's registered |

### Exported Types and Values

- **Selections:** `ThemeName`, `ThemeVariant`, `ThemeVariantPreference`, `ThemePreference`, `ThemeSelection`, `ThemeAvailability`.
- **Definitions:** `ThemeProfile`, `ThemeFamilyRegistration`, `ThemeOverrideRegistration`, `ThemeOptions`, `ThemeColorPaletteRegistration`, `ThemeColorPaletteSeeds`.
- **Extending:** `ThemeStrategy`, `ThemeStorage`, `DefaultThemeStrategy`, `LocalStorageThemeStorage`.
- **Built-in themes:** `monaTheme`, `lunaTheme`, `annaTheme`, `builtInThemes`.
- **Helpers:** `generateThemeColorPalette`, `flattenThemeProfile`, `createSidebarColorRoles`.
