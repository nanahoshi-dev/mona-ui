Mona UI is an Angular component library styled with Tailwind CSS 4. Its components are standalone and signal based: inputs are `input()` and `model()`, events are `output()`.

## Essentials

- Install with `npm install @nanahoshi/mona-ui`. The application needs Tailwind CSS 4.
- Import the styles in the main stylesheet, after Tailwind: `@import "tailwindcss";` then `@import "@nanahoshi/mona-ui/styles.css";`. Without it, components render unstyled.
- Import every symbol from its entry point, such as `import { ButtonDirective } from "@nanahoshi/mona-ui/button";`. Each page below names its entry point. The root `@nanahoshi/mona-ui` exports nothing.
- Add what you import to the standalone component's `imports` array. There are no NgModules.
- No provider is required. Optional ones: `provideThemeOptions` (`@nanahoshi/mona-ui/theme`) to pick a theme, `provideMonaI18n` (`@nanahoshi/mona-ui/i18n`) for locale and messages, `provideNotificationDefaults` (`@nanahoshi/mona-ui/notification`) and `provideSidebarStorage` (`@nanahoshi/mona-ui/sidebar`).
- Form controls implement `FormValueControl` from `@angular/forms/signals`: bind them with `[formField]`. They have no `ControlValueAccessor`, but `[(ngModel)]` and `[formControl]` still work, because Angular binds a control's `value` and `touch` directly.

## Common mistakes

- Importing from `@nanahoshi/mona-ui` instead of an entry point such as `@nanahoshi/mona-ui/grid`.
- Leaving out `@nanahoshi/mona-ui/styles.css`, or importing it before Tailwind.
- Treating a `placeholder` as a label. Give each control a name: a `<label for>` pointed at its input id, `aria-label` or `aria-labelledby`. Those two are inputs on every component that takes a name, and the component moves them to the element that has the role.
- Expecting the grid, list box or tabs to change their data. They report the change through an event, and you write it back to the data you bound.
- Putting `[disabled]` on a `monaTooltip` that sits on a button: it disables the button too. Use `[tooltipDisabled]`.
- Using the rich text editor without its extra styles: `@import "remixicon/fonts/remixicon.css";` and `@plugin "@tailwindcss/typography";`.
