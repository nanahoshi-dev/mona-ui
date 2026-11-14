# Installation

This guide adds Mona UI to an Angular application in four steps: install the package, set up Tailwind CSS, import the styles, and render a first component. Optional setup for themes, languages, the rich text editor and chart export follows.

## Before You Begin

You need an Angular 22 or later application. To start a new one with Tailwind CSS already set up, run:

```bash
npx @angular/cli@latest new my-app --style=tailwind
```

## 1. Install the Package

In your project folder, run:

```bash
npm install @nanahoshi/mona-ui
```

npm also installs the packages Mona UI builds on, such as the Angular CDK. If your package manager doesn't install peer dependencies on its own, install the ones it lists.

## 2. Set Up Tailwind CSS

Mona UI is styled with Tailwind CSS 4. If your application already uses it, for example because you created it with `--style=tailwind`, skip to the next step.

Install Tailwind and its PostCSS plugin:

```bash
npm install tailwindcss @tailwindcss/postcss postcss
```

Then create a `.postcssrc.json` file in the project's root folder, next to `angular.json`:

```json
{
    "plugins": {
        "@tailwindcss/postcss": {}
    }
}
```

For more detail, see [Tailwind's Angular guide](https://tailwindcss.com/docs/installation/framework-guides/angular).

## 3. Import the Styles

Open your global stylesheet, usually `src/styles.css`, and make it start with these lines. If it already imports Tailwind, add the Mona UI import right after that line.

```css
@import "tailwindcss";
@import "@nanahoshi/mona-ui/styles.css";

body {
    background-color: var(--color-canvas);
    color: var(--color-foreground);
}
```

Mona UI's stylesheet must come after Tailwind. It tells Tailwind which classes the components use, and defines the theme colors those classes refer to. The `body` rule is optional: it makes the page's background and text follow the theme.

> **Using Sass?** Tailwind CSS 4 isn't designed to work with Sass. Put these lines in a plain `.css` file, and add that file to the `styles` array in `angular.json`.

## 4. Add Your First Component

Every component is imported from its own entry point, such as `@nanahoshi/mona-ui/button`, and added to the `imports` of the component that uses it. For example, in `src/app/app.ts`:

```typescript
import { Component } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";

@Component({
    selector: "app-root",
    imports: [ButtonDirective],
    template: `<button monaButton look="primary">Hello, Mona UI</button>`
})
export class App {}
```

Start the development server:

```bash
ng serve
```

Open `http://localhost:4200`. You should see a button in the theme's primary color. Mona UI is ready to use.

## Optional Setup

None of these are needed to get started. Add them when your application needs them.

### Choose a Theme

Mona UI uses the Mona Light theme by default. To start with another theme, or to follow the system's light or dark setting, add `provideThemeOptions` to the providers in `src/app/app.config.ts`:

```typescript
import { ApplicationConfig } from "@angular/core";
import { provideThemeOptions } from "@nanahoshi/mona-ui/theme";

export const appConfig: ApplicationConfig = {
    providers: [
        // ...your existing providers
        provideThemeOptions({ initialTheme: { name: "mona", variant: "system" } })
    ]
};
```

The built-in themes are Mona and Luna, each in light and dark, and Anna, which is dark only. To switch themes while the application runs, or to use your own colors, see [Theming](/components/theming).

### Translate the Built-in Text

Components show their built-in text, such as pager labels and screen reader announcements, in English. To use another language, pass one of the official locales to `provideMonaI18n`:

```typescript
import { ApplicationConfig } from "@angular/core";
import { provideMonaI18n } from "@nanahoshi/mona-ui/i18n";
import { MONA_DE_DE_LOCALE } from "@nanahoshi/mona-ui/locales/de-de";

export const appConfig: ApplicationConfig = {
    providers: [
        // ...your existing providers
        provideMonaI18n({ locale: MONA_DE_DE_LOCALE })
    ]
};
```

Official locales include Arabic, Chinese, French, German, Japanese, Portuguese, Spanish and more, each with its own entry point, such as `@nanahoshi/mona-ui/locales/fr-fr`.

For a right-to-left language, also set `dir="rtl"` on the `<html>` element in `src/index.html`. Components follow the document's direction, and choosing a locale doesn't change it.

### Set Up the Rich Text Editor

The [Editor](/components/editor) is built on [Tiptap](https://tiptap.dev), and also uses the Remix Icon font and Tailwind's typography plugin. No other component needs them, so they aren't installed with Mona UI. Install them with:

```bash
npm install @tiptap/core @tiptap/pm @tiptap/starter-kit @tiptap/extension-highlight @tiptap/extension-image @tiptap/extension-list @tiptap/extension-subscript @tiptap/extension-superscript @tiptap/extension-table @tiptap/extension-text-align @tiptap/extension-text-style remixicon @tailwindcss/typography
```

Then add two lines to your global stylesheet, after the imports from step 3. Its top then reads:

```css
@import "tailwindcss";
@import "@nanahoshi/mona-ui/styles.css";
@import "remixicon/fonts/remixicon.css";
@plugin "@tailwindcss/typography";
```

The editor's code is large, about 900 kB before compression. To keep it out of the initial bundle, show it in a lazy-loaded route, or wrap it in a `@defer` block:

```html
@defer (on viewport) {
    <mona-editor aria-label="Notes" [(value)]="notes" />
} @placeholder {
    <div class="h-72"></div>
}
```

### Export Charts

Charts can be saved as PNG, SVG or PDF files. Exporting uses three packages that charts don't need otherwise, so they aren't installed with Mona UI. If your application exports charts, install them:

```bash
npm install jspdf svg2pdf.js html2canvas-pro
```

See [Export](/components/chart#export) for how to export a chart.

## Troubleshooting

- **Components look unstyled.** Check that your global stylesheet imports `@nanahoshi/mona-ui/styles.css`, and that it comes after `@import "tailwindcss"`.
- **An import can't be found.** Import from the component's entry point, such as `@nanahoshi/mona-ui/grid`. The package root, `@nanahoshi/mona-ui`, exports nothing. Each component's page names its entry point.
- **The build can't resolve `@tiptap/core` or another `@tiptap` package.** Your application uses the editor, which needs packages that aren't installed with Mona UI. Install them as shown in [Set Up the Rich Text Editor](#set-up-the-rich-text-editor).
- **The editor's toolbar has no icons, or its text has no formatting.** Add the Remix Icon import and the typography plugin, as shown in [Set Up the Rich Text Editor](#set-up-the-rich-text-editor).
- **Exporting a chart fails with "Failed to load jsPDF" or a similar error.** Install the export packages, as shown in [Export Charts](#export-charts).

## Using an AI Coding Assistant

The documentation is also available as markdown, for coding agents. Point an agent at `/llms.txt`, which lists every page with a link to its markdown, or at `node_modules/@nanahoshi/mona-ui/llms.txt`, which matches the installed version.

## Next Steps

- [Theming](/components/theming): customize colors, density and shape.
- [Forms](/components/forms): connect the form controls to Angular's signal forms.

From there, open any component in the sidebar. Each page has live examples and a full API reference.
