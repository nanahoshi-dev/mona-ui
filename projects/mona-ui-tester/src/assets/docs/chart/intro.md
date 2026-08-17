# Chart

**Selector:** `mona-chart`

`MonaChartComponent` is a high-performance Canvas 2D visualization container designed for Angular 22. It renders composable Cartesian series (Line, Area, and Bar) and Polar series (Pie and Donut) using declarative child components, D3-powered mathematical geometry and scale engines, accessible DOM overlays, interactive tooltips, and responsive ResizeObserver layouts.

### Key Highlights

- **High Performance Canvas 2D Backing Store**: Smooth rendering with sub-pixel DPR scaling and zero SVG DOM bloat for high-density datasets.
- **Declarative Angular 22 Composition**: Compose `<mona-line-series>`, `<mona-area-series>`, `<mona-bar-series>`, `<mona-pie-series>`, `<mona-donut-series>`, `<mona-chart-x-axis>`, `<mona-chart-y-axis>`, `<mona-chart-legend>`, and `<mona-chart-tooltip>`.
- **Cartesian & Polar Support**: Multi-series line, area, and bar charts with continuous/categorical/temporal axes, alongside full and partial pie/donut charts with customizable center holes, outside data labels with leader lines and vertical collision resolution, and compact inside labels.
- **Polar Fill Modes & Radial Gradients**: Slices support uniform `solid` fills and soft radial `gradient` fills transitioning from transparent at the center/inner radius to a subtle wash at the outer arc, alongside independently rendered solid borders.
- **D3 Math Core**: Robust categorical band scales, continuous linear scales, temporal scales, and D3 `pie`/`arc` geometry without third-party rendering lock-in.
- **Theme-Aware Styling**: Seamless integration with `@nanahoshi/mona-ui/theme` palette tokens (`--color-chart-1` through `--color-chart-5`), dark mode, and CVA recipes.
- **WCAG AA / AXE Accessibility**: ARIA region container, live region announcements on focus/navigation, interactive series and slice legend toggling, and full arrow-key keyboard exploration.
