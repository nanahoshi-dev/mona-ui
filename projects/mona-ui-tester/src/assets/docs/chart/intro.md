# Chart

**Selector:** `mona-chart`

`MonaChartComponent` is a high-performance Canvas 2D visualization container designed for Angular 22. It renders composable Cartesian series—including Line, Area, and Bar—using declarative child components, D3-powered mathematical scale engines, accessible DOM overlays, interactive tooltips, and responsive ResizeObserver layouts.

### Key Highlights

- **High Performance Canvas 2D Backing Store**: Smooth rendering with sub-pixel DPR scaling and zero SVG DOM bloat for high-density datasets.
- **Declarative Angular 22 Composition**: Compose `<mona-line-series>`, `<mona-area-series>`, `<mona-bar-series>`, `<mona-chart-x-axis>`, `<mona-chart-y-axis>`, `<mona-chart-legend>`, and `<mona-chart-tooltip>`.
- **D3 Scale Core**: Robust categorical band scales, continuous linear scales, and temporal (time/UTC) scales with automatic zero-baseline heuristics.
- **Theme-Aware Styling**: Seamless integration with `@nanahoshi/mona-ui/theme` palette tokens (`--color-chart-1` through `--color-chart-5`), dark mode, and CVA recipes.
- **WCAG AA / AXE Accessibility**: ARIA region container, live region announcements on focus/navigation, interactive legend toggling, and full arrow-key keyboard exploration.
