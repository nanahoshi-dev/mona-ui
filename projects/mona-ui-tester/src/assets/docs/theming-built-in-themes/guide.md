## Mona

Mona is the default theme. Its surfaces run from white to near-black in neutral grays, and color appears only where it carries meaning: success, error, warning and info. The primary color is near-black in Mona Light and near-white in Mona Dark, so main actions stand out by contrast rather than hue, and selection is a quiet gray tint.

Choose Mona when the content should stay in front, or when your application brings its own brand color: a neutral theme takes one on well, as [Custom Colors](/components/theming/custom-colors) shows.

Mona Light is what an application gets with no theme provider. For Mona Dark, or to follow the system's setting:

```typescript
provideThemeOptions({ initialTheme: { name: "mona", variant: "system" } });
```

## Luna

Luna pairs clean white or charcoal surfaces with a blue primary. Text boxes, menus, popups and dialogs are translucent: they blur what's behind them, like frosted glass, so temporary surfaces keep a sense of depth while the content itself stays opaque. Its shadows are softer and wider than Mona's.

```typescript
provideThemeOptions({ initialTheme: { name: "luna", variant: "system" } });
```

The glass needs the browser's `backdrop-filter`. When the browser doesn't support it, or the user asks for less transparency in their system settings, Luna uses opaque versions of the same colors. The root element's `data-mona-transparency` attribute says which is in effect: `full` or `reduced`. A server-rendered page starts with the opaque versions, because only the browser can tell.

The [Luna Showcase](/components/theming/luna) shows the materials on a full page. This site gives Luna its own primary color with `provideThemeColorPalette()`, so the Luna you see here has a muted navy primary instead of the blue in the previews.

## Anna

Anna is dark only: charcoal surfaces, a deep violet for main actions and selection, and a lighter violet for focus rings. Controls sit flat, without shadows, and animations are quick, at 150 ms.

```typescript
provideThemeOptions({ initialTheme: { name: "anna", variant: "dark" } });
```

Anna has no light variant, so `variant: "system"` still gives Anna Dark, and `supportsVariant("anna", "light")` returns `false`. If users can switch themes, offer Anna alongside a theme that has a light variant.

On its own, Anna's deep violet would be hard to see against the dark surface. So where a color alone shows a value, as in slider ranges, progress bars, switches, radio buttons, tabs and steps, Anna uses the lighter violet instead. [Custom Themes](/components/theming/custom-themes#indicator-colors) shows how a theme of your own can do the same.

## Compare the Themes

|               | Mona                                    | Luna                                    | Anna             |
| ------------- | --------------------------------------- | --------------------------------------- | ---------------- |
| Variants      | Light, dark                             | Light, dark                             | Dark             |
| Primary color | Near-black in light, near-white in dark | Blue                                    | Deep violet      |
| Selection     | Gray tint                               | Blue tint                               | Violet           |
| Materials     | Opaque                                  | Translucent glass, or opaque if reduced | Opaque           |
| Shadows       | Subtle                                  | Soft and wide                           | None on controls |
| Motion        | 200 ms and 300 ms                       | 180 ms and 320 ms                       | 150 ms           |
| Corner radii  | 4, 6 and 8 px                           | 4, 6 and 8 px                           | 4, 6 and 8 px    |

## Start from a Built-in Theme

The themes are exported, as `monaTheme`, `lunaTheme` and `annaTheme`, and together as `builtInThemes`, so you can read their tokens or build on them:

```typescript
import { monaTheme } from "@nanahoshi/mona-ui/theme";

const radius = monaTheme.variants.light.shape["--radius-md"]; // "0.375rem"
```

To change a few tokens of a built-in theme, such as its primary color or its corner radii, see [Custom Colors](/components/theming/custom-colors). To make a theme of your own from one, see [Custom Themes](/components/theming/custom-themes#start-from-a-built-in-theme).
