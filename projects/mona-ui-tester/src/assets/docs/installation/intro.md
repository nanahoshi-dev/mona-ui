# Installation

To install Mona UI, run the following command in your terminal:

```bash
npm install @nanahoshi/mona-ui
```

Mona UI is styled with Tailwind CSS 4, so the application needs it too. See [Tailwind's Angular guide](https://tailwindcss.com/docs/installation/framework-guides/angular) if it isn't set up yet.

## Set Up Styles

In your main stylesheet, import the package's styles after Tailwind:

```css
@import "tailwindcss";
@import "@nanahoshi/mona-ui/styles.css";

body {
    background-color: var(--color-canvas);
    color: var(--color-foreground);
}
```

That tells Tailwind to scan the package for the classes its components use, and declares the theme tokens those classes name. The `body` rule is yours to change, and it's there so the page follows the theme.

The rich text editor needs two more:

```css
@import "remixicon/fonts/remixicon.css";
@plugin "@tailwindcss/typography";
```

## Choose a Theme

Mona Light works with no further setup. To use another theme, follow the system's setting, remember a choice or add your own colors, see [Theming](/components/theming).

```ts
import { provideThemeOptions } from "@nanahoshi/mona-ui/theme";

bootstrapApplication(AppComponent, {
    providers: [provideThemeOptions({ initialTheme: { name: "mona", variant: "system" } })]
});
```

## Build Forms

The form controls work with Angular's signal forms through `[formField]`. See [Forms](/components/forms) for how to name them, and what each one supports.
