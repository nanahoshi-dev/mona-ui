# Introduction

Mona UI is a library of user interface components for Angular. It gives you the controls most applications need, from buttons and form fields to data grids, charts and a rich text editor, built to work together and ready to use.

The components are built on Angular's signals and standalone components, styled with Tailwind CSS, and accessible from the start. They all follow the active theme, so one setting changes the look of the whole application.

## What's Included

- **Actions**: [Button](/components/button), [Button Group](/components/button-group), [Dropdown Button](/components/dropdown-button) and [Split Button](/components/split-button).
- **Forms**: [Text Box](/components/textbox), [Numeric Text Box](/components/numeric-textbox), [Checkbox](/components/checkbox), [Dropdown List](/components/dropdown-list), [Multi Select](/components/multi-select), [Slider](/components/slider), a rich text [Editor](/components/editor) and more.
- **Dates, times and colors**: [Calendar](/components/calendar), [Date Picker](/components/date-picker), [Time Picker](/components/time-picker) and [Color Picker](/components/color-picker).
- **Data**: a full-featured [Grid](/components/grid) with sorting, filtering, grouping, editing and export, plus [List View](/components/list-view), [Tree View](/components/tree-view) and [Pager](/components/pager).
- **Charts**: [line and area](/components/chart-line-area), [bar](/components/chart-bar), [pie](/components/chart-pie), [scatter](/components/chart-scatter), [heatmap](/components/chart-heatmap) and [other series](/components/chart), drawn on canvas.
- **Navigation**: [Tabs](/components/tabs), [Menubar](/components/menubar), [Breadcrumb](/components/breadcrumb), [Sidebar](/components/sidebar), [Stepper](/components/stepper) and a [Command Menu](/components/command).
- **Overlays**: [Dialog](/components/dialog), [Window](/components/window), [Popover](/components/popover), [Sheet](/components/sheet) and [Tooltip](/components/tooltip).
- **Layout and feedback**: [Card](/components/card), [Splitter](/components/splitter), [Expansion Panel](/components/expansion-panel), [Notification](/components/notification), [Progress Bar](/components/progress-bar) and [Skeleton](/components/skeleton).

The sidebar lists every component.

## Key Features

- **Made for modern Angular.** Every component is standalone and uses signals for its inputs, outputs and state.
- **Accessible.** Components follow the WAI-ARIA patterns, work with the keyboard and screen readers, and stay usable in forced colors mode.
- **Themeable.** Colors, density and shape come from design tokens. Pick a built-in theme in light or dark, follow the system's setting, or define your own. See [Theming](/components/theming).
- **Ready for forms.** The form controls work with Angular's signal forms through `[formField]`. See [Forms](/components/forms).
- **Localizable.** Built-in text is in English by default, and can be translated or switched at runtime. Layouts mirror for right-to-left languages.
- **Typed.** Inputs, events and template contexts are fully typed, so your editor catches mistakes as you write.
- **Only what you use.** Each component has its own entry point, such as `@nanahoshi/mona-ui/button`, so your application only includes the components it imports.

## Quick Example

Every component is used the same way: import it from its entry point, add it to your component's `imports`, and use it in the template. This button counts its clicks:

```typescript
import { Component, signal } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";

@Component({
    selector: "app-counter",
    imports: [ButtonDirective],
    template: `
        <button monaButton look="primary" (click)="increment()">
            Clicked {{ count() }} times
        </button>
    `
})
export class CounterComponent {
    protected readonly count = signal(0);

    protected increment(): void {
        this.count.update(count => count + 1);
    }
}
```

## Tech Stack

Mona UI is built with Angular 22, Tailwind CSS 4 and TypeScript 6. Your application needs Angular 22 or later and Tailwind CSS 4.
