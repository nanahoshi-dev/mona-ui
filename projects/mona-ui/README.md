# Mona UI

A modern, high-performance, accessible UI component library built for Angular and styled with Tailwind CSS.

---

## Features

- **Signal-Based State & Reactive Architecture:** First-class Angular Signals architecture for fine-grained reactivity.
- **Standalone Components:** Designed exclusively with modern Angular standalone components.
- **Comprehensive Internationalization (i18n):** Zero-config English defaults with full runtime locale switching, typed message namespaces, and message override precedence.
- **RTL-Ready:** Fully prepared for right-to-left layout direction with CSS Logical Properties and CDK-driven directionality.
- **High-Grade Accessibility (a11y):** Strict adherence to WCAG AA minimums, dynamic ARIA attributes, and zero AXE violations.
- **40+ Rich Components:** Data grids, interactive charts, calendar/pickers, rich text editor, scroll view, dialogs, dropdowns, and more.

---

## Documentation

Coding agents can read the documentation as markdown. The package includes it: start from `llms.txt` at the package root, which links to a page for each component in `docs/`.

- [Theming](docs/theming.md)
- [Forms](docs/forms.md)
- [Internationalization (i18n) & RTL Guide](docs/i18n.md)
- [Buttons](docs/button.md)
- [Popups](docs/popup.md)
- [Text Boxes](docs/text-box.md)
- [Dropdowns](docs/dropdowns.md)
- [Numeric Text Boxes](docs/numeric-text-box.md)
- [Dates and Times](docs/dates.md)
- [Patch Stores & Merge Utilities](docs/patch-store.md)
- [Component Migration Inventory](docs/internal/i18n-rtl-migration-inventory.md)

---

## Quick Start

### Installation

```bash
npm install @nanahoshi/mona-ui
```

Mona UI is styled with Tailwind CSS 4. Import the package's styles after Tailwind in your main stylesheet:

```css
@import "tailwindcss";
@import "@nanahoshi/mona-ui/styles.css";
```

### Setup Internationalization

Mona UI works out-of-the-box in English without configuration. To provide a customized locale or configure runtime language switching, import `provideMonaI18n`:

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideMonaI18n } from '@nanahoshi/mona-ui/i18n';

export const appConfig: ApplicationConfig = {
    providers: [
        provideMonaI18n()
    ]
};
```

For complete details on localization, locale switching, and RTL support, refer to the [i18n & RTL Guide](docs/i18n.md).

---

## Development

### Building the Library

```bash
npm run build:metadata
npm run build:prod
```

### Running Tests

```bash
# Run unit tests for the component library
npm run test:lib

# Run unit tests for the tester app
npm run test:app
```

### i18n & RTL Quality Audit

Mona UI includes an automated AST-based scanner to verify that no hard-coded English text, static ARIA labels, or physical CSS properties are introduced:

```bash
npm run audit:i18n-rtl:strict
```

---

## License

MIT
