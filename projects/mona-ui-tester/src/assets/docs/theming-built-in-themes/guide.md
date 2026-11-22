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

This site gives Luna its own primary color with `provideThemeColorPalette()`, so when you choose Luna from the site's theme menu, it has a muted navy primary instead of the blue in the previews.

## Anna

Anna pairs graphite grays with a deep violet for main actions. Controls sit flat, without shadows, and a shade lighter than any surface around them, so text boxes, buttons and check boxes stand out by their fill. Animations are quick, at 150 ms.

```typescript
provideThemeOptions({ initialTheme: { name: "anna", variant: "system" } });
```

Anna Dark has charcoal surfaces, near-black borders and a solid violet for selection. On its own, the deep violet would be hard to see against the dark surface. So where a color alone shows a value, as in slider ranges, progress bars, switches, radio buttons, tabs and steps, Anna Dark uses a lighter violet instead. [Custom Themes](/components/theming/custom-themes#indicator-colors) shows how a theme of your own can do the same.

Anna Light has soft gray surfaces and off-white controls that darken gently on hover. Selection is a violet tint rather than a solid fill, so secondary text in a selected row stays readable. The deep violet stands out well on the light surface, so it draws slider ranges, switches and the rest as it is.

## Rena

Rena takes its colors from Tailwind CSS's default palette: cool grays with an indigo primary. Rena Light puts white panels on a very light, cool gray page, and Rena Dark puts slightly lighter panels on a deep blue-gray page. Controls cast a small, crisp shadow, and menus and popups a larger, softer one. Animations are quick, at 150 ms and 200 ms.

```typescript
provideThemeOptions({ initialTheme: { name: "rena", variant: "system" } });
```

Where the other themes draw a soft, translucent halo around a focused or invalid control, Rena draws a solid line: the control's border takes the focus color, with a 1 px ring of the same color around it. [Custom Themes](/components/theming/custom-themes#focus-rings) shows how a theme of your own can do the same.

Selection is an indigo tint in both variants. Main actions keep the same indigo in Rena Dark, under white text, but on its own it would be hard to see against the dark surface. So where a color alone shows a value, as in slider ranges, progress bars, switches, radio buttons, tabs and steps, and where the primary color is text, Rena Dark uses a lighter indigo instead.

## Compare the Themes

|               | Mona                                    | Luna                                    | Anna                                 | Rena              |
| ------------- | --------------------------------------- | --------------------------------------- | ------------------------------------ | ----------------- |
| Variants      | Light, dark                             | Light, dark                             | Light, dark                          | Light, dark       |
| Primary color | Near-black in light, near-white in dark | Blue                                    | Deep violet                          | Indigo            |
| Selection     | Gray tint                               | Blue tint                               | Violet tint in light, violet in dark | Indigo tint       |
| Materials     | Opaque                                  | Translucent glass, or opaque if reduced | Opaque                               | Opaque            |
| Shadows       | Subtle                                  | Soft and wide                           | None on controls                     | Small and crisp   |
| Focus ring    | Soft halo                               | Soft halo                               | Soft halo                            | Solid line        |
| Motion        | 200 ms and 300 ms                       | 180 ms and 320 ms                       | 150 ms                               | 150 ms and 200 ms |
| Corner radii  | 4, 6 and 8 px                           | 4, 6 and 8 px                           | 4, 6 and 8 px                        | 4, 6 and 8 px     |

## Start from a Built-in Theme

The themes are exported, as `monaTheme`, `lunaTheme`, `annaTheme` and `renaTheme`, and together as `builtInThemes`, so you can read their tokens or build on them:

```typescript
import { monaTheme } from "@nanahoshi/mona-ui/theme";

const radius = monaTheme.variants.light.shape["--radius-md"]; // "0.375rem"
```

To change a few tokens of a built-in theme, such as its primary color or its corner radii, see [Custom Colors](/components/theming/custom-colors). To make a theme of your own from one, see [Custom Themes](/components/theming/custom-themes#start-from-a-built-in-theme).
