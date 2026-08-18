# Chart

**Selector:** `mona-chart`

`MonaChartComponent` is a high-performance Canvas 2D visualization container designed for Angular 22. It renders composable Cartesian series (Line, Area, Bar, Range Bar, Range Area, Scatter, Bubble, Candlestick, and OHLC), Cartesian Heatmaps, Sector series (Pie and Donut), and Polar Axis series (Radar and Continuous Polar) using declarative child components, D3-powered mathematical geometry and scale engines, accessible DOM overlays, interactive tooltips, and responsive ResizeObserver layouts.

### Key Highlights

- **High Performance Canvas 2D Backing Store**: Smooth rendering with sub-pixel DPR scaling and zero SVG DOM bloat for high-density datasets.
- **Declarative Angular 22 Composition**: Compose `<mona-line-series>`, `<mona-area-series>`, `<mona-bar-series>`, `<mona-range-bar-series>`, `<mona-range-area-series>`, `<mona-scatter-series>`, `<mona-bubble-series>`, `<mona-candlestick-series>`, `<mona-ohlc-series>`, `<mona-heatmap-series>`, `<mona-pie-series>`, `<mona-donut-series>`, `<mona-radar-series>`, `<mona-polar-series>`, `<mona-chart-x-axis>`, `<mona-chart-y-axis>`, `<mona-chart-angular-axis>`, `<mona-chart-radial-axis>`, `<mona-chart-legend>`, and `<mona-chart-tooltip>`.
- **Cartesian, Financial, Heatmap, Sector & Polar Axis Support**: Multi-series line, area, grouped/stacked bar, floating range bar, continuous range area, scatter, bubble, financial candlestick & OHLC bars, heatmaps with custom color ramps, alongside full and partial pie/donut charts, multi-metric radar charts with polygon/circular grid rings, and continuous polar charts mapping directional signals across 360 degrees.
- **Radial Fill Modes & Gradients**: Slices and radial series support uniform `solid` washes, soft radial `gradient` fills transitioning from transparent at the pole/inner radius to the outer boundary, and outline-only modes.
- **D3 Math Core**: Robust categorical band scales, continuous linear scales, temporal scales, and D3 `pie`/`arc`/`lineRadial`/`areaRadial` geometry without third-party rendering lock-in.
- **Theme-Aware Styling**: Seamless integration with `@nanahoshi/mona-ui/theme` palette tokens (`--color-chart-1` through `--color-chart-5`), dark mode, financial directional tokens (`--mona-chart-financial-rising-color`, `--mona-chart-financial-falling-color`, `--mona-chart-financial-neutral-color`, `--mona-chart-financial-hollow-fill`), and CVA recipes.
- **WCAG AA / AXE Accessibility**: ARIA region container, live region announcements on focus/navigation, interactive series and slice legend toggling, and full arrow-key keyboard exploration across spokes, slices, and series.
