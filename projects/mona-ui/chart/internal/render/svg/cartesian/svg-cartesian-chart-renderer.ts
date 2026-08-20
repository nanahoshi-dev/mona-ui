import type { CartesianXYChartScene } from "../../../scene/chart-scene";
import type { ChartStyleResolver } from "../../../style/chart-style-resolver";
import type { ChartRenderPresentationState } from "../../chart-render-presentation-state";
import { setSvgAttribute } from "../svg-attribute-utils";
import type { SvgDefinitionRegistry } from "../svg-definition-registry";
import { createSvgElement } from "../svg-element-utils";
import type { SvgRootLayers } from "../svg-root-layers";
import { SvgCartesianAxisRenderer } from "./svg-cartesian-axis-renderer";
import { SvgCartesianBrushRenderer } from "./svg-cartesian-brush-renderer";
import { SvgCartesianCrosshairRenderer } from "./svg-cartesian-crosshair-renderer";
import { SvgCartesianDataLabelRenderer } from "./svg-cartesian-data-label-renderer";
import { SvgCartesianGridRenderer } from "./svg-cartesian-grid-renderer";
import { SvgCartesianInteractionRenderer } from "./svg-cartesian-interaction-renderer";
import { SvgCartesianOverlayRenderer } from "./svg-cartesian-overlay-renderer";
import { SvgCartesianSelectionRenderer } from "./svg-cartesian-selection-renderer";
import { SvgAreaSeriesRenderer } from "./series/svg-area-series-renderer";
import { SvgBarSeriesRenderer } from "./series/svg-bar-series-renderer";
import { SvgCandlestickSeriesRenderer } from "./series/svg-candlestick-series-renderer";
import { SvgLineSeriesRenderer } from "./series/svg-line-series-renderer";
import { SvgMarkerSeriesRenderer } from "./series/svg-marker-series-renderer";
import { SvgOhlcSeriesRenderer } from "./series/svg-ohlc-series-renderer";
import { SvgRangeAreaSeriesRenderer } from "./series/svg-range-area-series-renderer";
import { SvgRangeBarSeriesRenderer } from "./series/svg-range-bar-series-renderer";

export class SvgCartesianChartRenderer {
    readonly #layers: SvgRootLayers;
    readonly #gridRenderer: SvgCartesianGridRenderer;
    readonly #overlayRenderer: SvgCartesianOverlayRenderer;
    readonly #axisRenderer: SvgCartesianAxisRenderer;
    readonly #selectionRenderer: SvgCartesianSelectionRenderer;
    readonly #dataLabelRenderer: SvgCartesianDataLabelRenderer;
    readonly #crosshairRenderer: SvgCartesianCrosshairRenderer;
    readonly #interactionRenderer: SvgCartesianInteractionRenderer;
    readonly #brushRenderer: SvgCartesianBrushRenderer;

    readonly #seriesContainers = new Map<string, SVGGElement>();
    readonly #seriesRenderers = new Map<
        string,
        | SvgAreaSeriesRenderer
        | SvgBarSeriesRenderer
        | SvgCandlestickSeriesRenderer
        | SvgLineSeriesRenderer
        | SvgMarkerSeriesRenderer
        | SvgOhlcSeriesRenderer
        | SvgRangeAreaSeriesRenderer
        | SvgRangeBarSeriesRenderer
    >();

    public constructor(layers: SvgRootLayers) {
        this.#layers = layers;
        this.#gridRenderer = new SvgCartesianGridRenderer(layers.grid);
        this.#overlayRenderer = new SvgCartesianOverlayRenderer(layers.staticUnderlay, layers.staticOverlay);
        this.#axisRenderer = new SvgCartesianAxisRenderer(layers.axes);
        this.#selectionRenderer = new SvgCartesianSelectionRenderer(layers.selection);
        this.#dataLabelRenderer = new SvgCartesianDataLabelRenderer(layers.dataLabels);
        this.#crosshairRenderer = new SvgCartesianCrosshairRenderer(layers.transient);
        this.#interactionRenderer = new SvgCartesianInteractionRenderer(layers.transient);
        this.#brushRenderer = new SvgCartesianBrushRenderer(layers.brush);
    }

    public render(
        scene: CartesianXYChartScene,
        presentation: ChartRenderPresentationState | null,
        styleResolver: ChartStyleResolver,
        defs: SvgDefinitionRegistry
    ): void {
        const { plotRect, series } = scene;
        if (plotRect.width <= 0 || plotRect.height <= 0) {
            this.clear();
            return;
        }

        const plotClipUrl = defs.useClipRect("plot-clip", plotRect.x, plotRect.y, plotRect.width, plotRect.height);

        // 1. Grid
        this.#gridRenderer.render(scene, styleResolver);

        // 2. Static Underlays
        this.#overlayRenderer.renderUnderlays(presentation?.cartesianOverlay ?? null, plotRect, plotClipUrl);

        // 3. Series (clipped to plot rectangle)
        setSvgAttribute(this.#layers.series, "clip-path", plotClipUrl);
        this.#renderSeries(series, defs);

        // 4. Persistent Selection
        if (presentation?.selectionScene) {
            this.#selectionRenderer.render(presentation.selectionScene, {
                color: presentation.selectionOptions?.color,
                fillOpacity: presentation.selectionOptions?.fillOpacity,
                plotClipUrl,
                plotRect,
                strokeWidth: presentation.selectionOptions?.strokeWidth
            });
        } else {
            this.#selectionRenderer.clear();
        }

        // 5. Generic Data Labels (default <text> labels)
        if (presentation?.cartesianDataLabels?.defaultLabels && presentation.cartesianDataLabels.defaultLabels.length > 0) {
            this.#dataLabelRenderer.render(presentation.cartesianDataLabels.defaultLabels, plotClipUrl);
        } else {
            this.#dataLabelRenderer.clear();
        }

        // 6. Static Overlays / Annotations
        this.#overlayRenderer.renderOverlays(
            presentation?.cartesianOverlay ?? null,
            plotRect,
            presentation?.annotationBadgeAnchors,
            plotClipUrl
        );

        // 7. Axes
        this.#axisRenderer.render(scene, styleResolver);

        // 8. Transient Interaction & Crosshair
        this.#interactionRenderer.render(scene, presentation?.interaction ?? null, styleResolver, plotClipUrl);
        this.#crosshairRenderer.render(
            presentation?.crosshair ?? null,
            presentation?.crosshairRegistration ?? null,
            plotRect,
            styleResolver,
            plotClipUrl
        );

        // 9. Brush
        this.#brushRenderer.render(
            presentation?.activeBrushBounds ?? null,
            presentation?.brushRegistration ?? null,
            plotClipUrl
        );
    }

    public renderCrossfade(
        fromScene: CartesianXYChartScene | null,
        toScene: CartesianXYChartScene,
        progress: number,
        presentation: ChartRenderPresentationState | null,
        styleResolver: ChartStyleResolver,
        defs: SvgDefinitionRegistry
    ): void {
        const plotRect = toScene.plotRect;
        const plotClipUrl = defs.useClipRect("plot-clip", plotRect.x, plotRect.y, plotRect.width, plotRect.height);

        // Persistent selection and data labels are suppressed during animation
        this.#selectionRenderer.clear();
        this.#dataLabelRenderer.clear();

        // 1. Grid
        this.#gridRenderer.render(toScene, styleResolver);

        // 2. Underlays
        this.#overlayRenderer.renderUnderlays(presentation?.cartesianOverlay ?? null, plotRect, plotClipUrl);

        // 3. Series
        setSvgAttribute(this.#layers.series, "clip-path", plotClipUrl);
        this.#renderSeries(toScene.series, defs);

        // 6. Overlays
        this.#overlayRenderer.renderOverlays(
            presentation?.cartesianOverlay ?? null,
            plotRect,
            presentation?.annotationBadgeAnchors,
            plotClipUrl
        );

        // 7. Axes
        this.#axisRenderer.render(toScene, styleResolver);

        // 8. Transient
        this.#interactionRenderer.render(toScene, presentation?.interaction ?? null, styleResolver, plotClipUrl);
        this.#crosshairRenderer.render(
            presentation?.crosshair ?? null,
            presentation?.crosshairRegistration ?? null,
            plotRect,
            styleResolver,
            plotClipUrl
        );

        // 9. Brush
        this.#brushRenderer.render(
            presentation?.activeBrushBounds ?? null,
            presentation?.brushRegistration ?? null,
            plotClipUrl
        );
    }

    public clear(): void {
        this.#gridRenderer.clear();
        this.#overlayRenderer.clear();
        this.#axisRenderer.clear();
        this.#selectionRenderer.clear();
        this.#dataLabelRenderer.clear();
        this.#crosshairRenderer.clear();
        this.#interactionRenderer.clear();
        this.#brushRenderer.clear();

        for (const container of this.#seriesContainers.values()) {
            container.remove();
        }
        this.#seriesContainers.clear();
        this.#seriesRenderers.clear();
    }

    public destroy(): void {
        this.clear();
        this.#gridRenderer.destroy();
        this.#overlayRenderer.destroy();
        this.#axisRenderer.destroy();
        this.#selectionRenderer.destroy();
        this.#dataLabelRenderer.destroy();
        this.#crosshairRenderer.destroy();
        this.#interactionRenderer.destroy();
        this.#brushRenderer.destroy();
    }

    #renderSeries(seriesList: readonly import("../../../scene/cartesian-scene").ChartSeriesScene[], defs: SvgDefinitionRegistry): void {
        const activeIds = new Set<string>();

        for (let i = 0; i < seriesList.length; i++) {
            const s = seriesList[i];
            activeIds.add(s.id);

            let group = this.#seriesContainers.get(s.id);
            if (!group) {
                group = createSvgElement("g");
                group.setAttribute("data-series-id", s.id);
                this.#layers.series.appendChild(group);
                this.#seriesContainers.set(s.id, group);
            }

            let renderer = this.#seriesRenderers.get(s.id);
            if (!renderer) {
                switch (s.type) {
                    case "area":
                        renderer = new SvgAreaSeriesRenderer(group);
                        break;
                    case "bar":
                        renderer = new SvgBarSeriesRenderer(group);
                        break;
                    case "bubble":
                    case "scatter":
                        renderer = new SvgMarkerSeriesRenderer(group);
                        break;
                    case "candlestick":
                        renderer = new SvgCandlestickSeriesRenderer(group);
                        break;
                    case "line":
                        renderer = new SvgLineSeriesRenderer(group);
                        break;
                    case "ohlc":
                        renderer = new SvgOhlcSeriesRenderer(group);
                        break;
                    case "rangeArea":
                        renderer = new SvgRangeAreaSeriesRenderer(group);
                        break;
                    case "rangeBar":
                        renderer = new SvgRangeBarSeriesRenderer(group);
                        break;
                }
                if (renderer) {
                    this.#seriesRenderers.set(s.id, renderer);
                }
            }

            if (renderer) {
                if (s.type === "area") {
                    (renderer as SvgAreaSeriesRenderer).render(s, defs);
                } else {
                    (renderer as any).render(s);
                }
            }
        }

        // Cleanup stale series
        for (const [id, group] of this.#seriesContainers.entries()) {
            if (!activeIds.has(id)) {
                this.#seriesRenderers.get(id)?.clear();
                this.#seriesRenderers.delete(id);
                group.remove();
                this.#seriesContainers.delete(id);
            }
        }
    }
}
