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
        {
            renderer:
                | SvgAreaSeriesRenderer
                | SvgBarSeriesRenderer
                | SvgCandlestickSeriesRenderer
                | SvgLineSeriesRenderer
                | SvgMarkerSeriesRenderer
                | SvgOhlcSeriesRenderer
                | SvgRangeAreaSeriesRenderer
                | SvgRangeBarSeriesRenderer;
            type: string;
        }
    >();

    #crossfadeFromGridScope: SVGGElement | null = null;
    #crossfadeToGridScope: SVGGElement | null = null;
    #fromGridRenderer: SvgCartesianGridRenderer | null = null;
    #toGridRenderer: SvgCartesianGridRenderer | null = null;

    #crossfadeFromScope: SVGGElement | null = null;
    #crossfadeToScope: SVGGElement | null = null;
    readonly #crossfadeFromContainers = new Map<string, SVGGElement>();
    readonly #crossfadeFromRenderers = new Map<string, { renderer: any; type: string }>();
    readonly #crossfadeToContainers = new Map<string, SVGGElement>();
    readonly #crossfadeToRenderers = new Map<string, { renderer: any; type: string }>();

    #crossfadeFromAxesScope: SVGGElement | null = null;
    #crossfadeToAxesScope: SVGGElement | null = null;
    #fromAxesRenderer: SvgCartesianAxisRenderer | null = null;
    #toAxesRenderer: SvgCartesianAxisRenderer | null = null;

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

        this.#clearCrossfadeScopes();

        const plotClipUrl = defs.useClipRect("plot-clip", plotRect.x, plotRect.y, plotRect.width, plotRect.height);

        // 1. Grid
        this.#gridRenderer.render(scene, styleResolver);

        // 2. Static Underlays
        this.#overlayRenderer.renderUnderlays(presentation?.cartesianOverlay ?? null, plotRect, plotClipUrl);

        // 3. Series (clipped to plot rectangle)
        setSvgAttribute(this.#layers.series, "clip-path", plotClipUrl);
        this.#renderSeriesInto(this.#layers.series, series, defs, this.#seriesContainers, this.#seriesRenderers);

        // 4. Persistent Selection
        if (presentation?.selectionScene) {
            const fallback = styleResolver.resolveSelectionStyle(null);
            this.#selectionRenderer.render(presentation.selectionScene, {
                color: presentation.selectionOptions?.color ?? fallback.color,
                fillOpacity: presentation.selectionOptions?.fillOpacity ?? fallback.fillOpacity,
                plotClipUrl,
                plotRect,
                strokeWidth: presentation.selectionOptions?.strokeWidth ?? fallback.strokeWidth
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
            plotClipUrl,
            presentation?.crosshairSnapshot ?? null
        );

        // 9. Brush
        if (presentation?.activeBrushBounds && (presentation.brushRegistration || presentation.brushSnapshot)) {
            const resolved =
                presentation.brushSnapshot ??
                (presentation.brushRegistration ? styleResolver.resolveBrushStyle(presentation.brushRegistration) : undefined);
            this.#brushRenderer.render(
                presentation.activeBrushBounds,
                presentation.brushRegistration ?? null,
                plotClipUrl,
                resolved
            );
        } else {
            this.#brushRenderer.clear();
        }
    }

    public renderCrossfade(
        fromScene: CartesianXYChartScene | null,
        toScene: CartesianXYChartScene,
        progress: number,
        presentation: ChartRenderPresentationState | null,
        styleResolver: ChartStyleResolver,
        defs: SvgDefinitionRegistry
    ): void {
        if (progress >= 1) {
            this.#clearCrossfadeScopes();
            this.render(toScene, presentation, styleResolver, defs);
            return;
        }

        const p = Math.max(0, Math.min(1, progress));
        const fromOpacity = Math.max(0, Math.min(1, 1 - p));
        const toOpacity = Math.max(0, Math.min(1, p));

        const toDefs = defs.withScope("cf-to");
        const toPlotClipUrl = toDefs.useClipRect(
            "plot-clip",
            toScene.plotRect.x,
            toScene.plotRect.y,
            toScene.plotRect.width,
            toScene.plotRect.height
        );

        // Persistent selection and data labels are suppressed during animation
        this.#selectionRenderer.clear();
        this.#dataLabelRenderer.clear();

        // Clear direct series if any
        for (const entry of this.#seriesRenderers.values()) {
            entry.renderer.clear();
        }
        for (const container of this.#seriesContainers.values()) {
            container.remove();
        }
        this.#seriesContainers.clear();
        this.#seriesRenderers.clear();

        // 1. Grid crossfade
        this.#gridRenderer.clear();
        if (fromScene) {
            if (!this.#crossfadeFromGridScope) {
                this.#crossfadeFromGridScope = createSvgElement("g");
                this.#crossfadeFromGridScope.setAttribute("data-crossfade-scope", "from");
                this.#layers.grid.appendChild(this.#crossfadeFromGridScope);
                this.#fromGridRenderer = new SvgCartesianGridRenderer(this.#crossfadeFromGridScope);
            }
            setSvgAttribute(this.#crossfadeFromGridScope, "opacity", fromOpacity);
            this.#fromGridRenderer?.render(fromScene, styleResolver);
        } else if (this.#crossfadeFromGridScope) {
            this.#fromGridRenderer?.clear();
            this.#crossfadeFromGridScope.remove();
            this.#crossfadeFromGridScope = null;
            this.#fromGridRenderer = null;
        }

        if (!this.#crossfadeToGridScope) {
            this.#crossfadeToGridScope = createSvgElement("g");
            this.#crossfadeToGridScope.setAttribute("data-crossfade-scope", "to");
            this.#layers.grid.appendChild(this.#crossfadeToGridScope);
            this.#toGridRenderer = new SvgCartesianGridRenderer(this.#crossfadeToGridScope);
        }
        setSvgAttribute(this.#crossfadeToGridScope, "opacity", toOpacity);
        this.#toGridRenderer?.render(toScene, styleResolver);

        // 2. Underlays (Target static underlay once at full own opacity)
        this.#overlayRenderer.renderUnderlays(presentation?.cartesianOverlay ?? null, toScene.plotRect, toPlotClipUrl);

        // 3. Series crossfade scopes
        this.#layers.series.removeAttribute("clip-path");

        if (fromScene) {
            const fromDefs = defs.withScope("cf-from");
            const fromPlotClipUrl = fromDefs.useClipRect(
                "plot-clip",
                fromScene.plotRect.x,
                fromScene.plotRect.y,
                fromScene.plotRect.width,
                fromScene.plotRect.height
            );

            if (!this.#crossfadeFromScope) {
                this.#crossfadeFromScope = createSvgElement("g");
                this.#crossfadeFromScope.setAttribute("data-crossfade-scope", "from");
                this.#layers.series.appendChild(this.#crossfadeFromScope);
            }
            setSvgAttribute(this.#crossfadeFromScope, "clip-path", fromPlotClipUrl);
            setSvgAttribute(this.#crossfadeFromScope, "opacity", fromOpacity);

            this.#renderSeriesInto(
                this.#crossfadeFromScope,
                fromScene.series,
                fromDefs,
                this.#crossfadeFromContainers,
                this.#crossfadeFromRenderers
            );
        } else if (this.#crossfadeFromScope) {
            for (const r of this.#crossfadeFromRenderers.values()) {
                r.renderer.clear();
            }
            this.#crossfadeFromScope.remove();
            this.#crossfadeFromScope = null;
            this.#crossfadeFromContainers.clear();
            this.#crossfadeFromRenderers.clear();
        }

        if (!this.#crossfadeToScope) {
            this.#crossfadeToScope = createSvgElement("g");
            this.#crossfadeToScope.setAttribute("data-crossfade-scope", "to");
            this.#layers.series.appendChild(this.#crossfadeToScope);
        }

        setSvgAttribute(this.#crossfadeToScope, "clip-path", toPlotClipUrl);
        setSvgAttribute(this.#crossfadeToScope, "opacity", toOpacity);

        this.#renderSeriesInto(
            this.#crossfadeToScope,
            toScene.series,
            toDefs,
            this.#crossfadeToContainers,
            this.#crossfadeToRenderers
        );

        // 4. Overlays (Target static overlays once at full own opacity)
        this.#overlayRenderer.renderOverlays(
            presentation?.cartesianOverlay ?? null,
            toScene.plotRect,
            presentation?.annotationBadgeAnchors,
            toPlotClipUrl
        );

        // 5. Axes crossfade
        this.#axisRenderer.clear();
        if (fromScene) {
            if (!this.#crossfadeFromAxesScope) {
                this.#crossfadeFromAxesScope = createSvgElement("g");
                this.#crossfadeFromAxesScope.setAttribute("data-crossfade-scope", "from");
                this.#layers.axes.appendChild(this.#crossfadeFromAxesScope);
                this.#fromAxesRenderer = new SvgCartesianAxisRenderer(this.#crossfadeFromAxesScope);
            }
            setSvgAttribute(this.#crossfadeFromAxesScope, "opacity", fromOpacity);
            this.#fromAxesRenderer?.render(fromScene, styleResolver);
        } else if (this.#crossfadeFromAxesScope) {
            this.#fromAxesRenderer?.clear();
            this.#crossfadeFromAxesScope.remove();
            this.#crossfadeFromAxesScope = null;
            this.#fromAxesRenderer = null;
        }

        if (!this.#crossfadeToAxesScope) {
            this.#crossfadeToAxesScope = createSvgElement("g");
            this.#crossfadeToAxesScope.setAttribute("data-crossfade-scope", "to");
            this.#layers.axes.appendChild(this.#crossfadeToAxesScope);
            this.#toAxesRenderer = new SvgCartesianAxisRenderer(this.#crossfadeToAxesScope);
        }

        setSvgAttribute(this.#crossfadeToAxesScope, "opacity", toOpacity);
        this.#toAxesRenderer?.render(toScene, styleResolver);

        // 6. Transient (Target transient layer once)
        this.#interactionRenderer.render(toScene, presentation?.interaction ?? null, styleResolver, toPlotClipUrl);
        this.#crosshairRenderer.render(
            presentation?.crosshair ?? null,
            presentation?.crosshairRegistration ?? null,
            toScene.plotRect,
            styleResolver,
            toPlotClipUrl
        );

        // 7. Brush (Target brush marquee once)
        if (presentation?.activeBrushBounds && presentation.brushRegistration) {
            const resolved = styleResolver.resolveBrushStyle(presentation.brushRegistration);
            this.#brushRenderer.render(
                presentation.activeBrushBounds,
                presentation.brushRegistration,
                toPlotClipUrl,
                resolved
            );
        } else {
            this.#brushRenderer.clear();
        }
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

        this.#clearCrossfadeScopes();

        for (const entry of this.#seriesRenderers.values()) {
            entry.renderer.clear();
        }
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

    #clearCrossfadeScopes(): void {
        if (this.#crossfadeFromGridScope) {
            this.#fromGridRenderer?.clear();
            this.#crossfadeFromGridScope.remove();
            this.#crossfadeFromGridScope = null;
            this.#fromGridRenderer = null;
        }
        if (this.#crossfadeToGridScope) {
            this.#toGridRenderer?.clear();
            this.#crossfadeToGridScope.remove();
            this.#crossfadeToGridScope = null;
            this.#toGridRenderer = null;
        }
        if (this.#crossfadeFromAxesScope) {
            this.#fromAxesRenderer?.clear();
            this.#crossfadeFromAxesScope.remove();
            this.#crossfadeFromAxesScope = null;
            this.#fromAxesRenderer = null;
        }
        if (this.#crossfadeToAxesScope) {
            this.#toAxesRenderer?.clear();
            this.#crossfadeToAxesScope.remove();
            this.#crossfadeToAxesScope = null;
            this.#toAxesRenderer = null;
        }
        if (this.#crossfadeFromScope) {
            for (const r of this.#crossfadeFromRenderers.values()) {
                r.renderer.clear();
            }
            this.#crossfadeFromScope.remove();
            this.#crossfadeFromScope = null;
            this.#crossfadeFromContainers.clear();
            this.#crossfadeFromRenderers.clear();
        }
        if (this.#crossfadeToScope) {
            for (const r of this.#crossfadeToRenderers.values()) {
                r.renderer.clear();
            }
            this.#crossfadeToScope.remove();
            this.#crossfadeToScope = null;
            this.#crossfadeToContainers.clear();
            this.#crossfadeToRenderers.clear();
        }
    }

    #renderSeriesInto(
        targetContainer: SVGGElement,
        seriesList: readonly import("../../../scene/cartesian-scene").ChartSeriesScene[],
        defs: SvgDefinitionRegistry,
        containersMap: Map<string, SVGGElement>,
        renderersMap: Map<string, { renderer: any; type: string }>
    ): void {
        const activeIds = new Set<string>();

        for (let i = 0; i < seriesList.length; i++) {
            const s = seriesList[i];
            activeIds.add(s.id);

            let group = containersMap.get(s.id);
            if (!group) {
                group = createSvgElement("g");
                group.setAttribute("data-series-id", s.id);
                targetContainer.appendChild(group);
                containersMap.set(s.id, group);
            }

            // Ensure correct DOM order in series layer (SVG-R1-012)
            const currentNthChild = targetContainer.children[i];
            if (currentNthChild !== group) {
                targetContainer.insertBefore(group, currentNthChild ?? null);
            }

            let entry = renderersMap.get(s.id);
            if (entry && entry.type !== s.type) {
                entry.renderer.clear();
                entry = undefined;
                renderersMap.delete(s.id);
            }

            if (!entry) {
                let renderer: any = null;
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
                    entry = { renderer, type: s.type };
                    renderersMap.set(s.id, entry);
                }
            }

            if (entry) {
                if (s.type === "area") {
                    (entry.renderer as SvgAreaSeriesRenderer).render(s, defs);
                } else {
                    entry.renderer.render(s);
                }
            }
        }

        // Cleanup stale series
        for (const [id, group] of containersMap.entries()) {
            if (!activeIds.has(id)) {
                renderersMap.get(id)?.renderer.clear();
                renderersMap.delete(id);
                group.remove();
                containersMap.delete(id);
            }
        }
    }
}
