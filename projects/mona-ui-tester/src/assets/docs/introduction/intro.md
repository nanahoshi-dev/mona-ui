# Introduction

Welcome to **Mona UI**! A modern, high-performance, and accessible UI component library built for Angular and styled with Tailwind CSS.

## What is Mona UI?

**Mona UI** is a lightweight, responsive UI component library built from the ground up for modern Angular. It provides pixel-perfect, production-ready components designed to accelerate web development without sacrificing architectural flexibility, performance, or accessibility.

Unlike traditional component libraries that carry legacy patterns or bulky runtimes, Mona UI embraces Angular's modern reactivity model—leveraging Signals, Standalone Components, and fine-grained reactivity by default.

## Key Features

- **Signal-First Reactivity**: Built natively with Angular Signals (`input()`, `output()`, `model()`, and `computed()`) for fine-grained reactivity, predictable data flow, and optimal performance.
- **55+ Modular Components**: Comprehensive suite covering form controls, rich data presentation (Data Grid, Charts, TreeView), overlays (Dialog, Window, Popover, Sheet), navigation, and editors.
- **Accessible by Default**: Designed to adhere to WAI-ARIA authoring practices, featuring complete keyboard navigation, dynamic ARIA attributes, and zero axe violations.
- **Tailwind CSS & Semantic Tokens**: Styled with Tailwind CSS v4 and structured around semantic design tokens for effortless light, dark, and brand theming.
- **Comprehensive i18n & RTL**: Zero-configuration English defaults with typed runtime locale switching and native right-to-left (RTL) layout support using CSS Logical Properties.
- **Strictly Typed**: Authored in strict TypeScript, providing comprehensive type inference and autocomplete for a seamless developer experience.

## Quick Example

Mona UI components integrate naturally into modern Angular standalone components:

```typescript
import { Component, signal } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";

@Component({
    selector: "app-example",
    imports: [ButtonDirective],
    template: `
        <button monaButton look="primary" (click)="count.update(c => c + 1)">
            Clicked {{ count() }} times
        </button>
    `
})
export class ExampleComponent {
    protected readonly count = signal(0);
}
```

## Tech Stack

We keep our core dependencies lean and modern, built on the latest web and Angular standards:
