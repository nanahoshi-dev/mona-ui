import type { CartesianXYChartScene } from "../../../scene/chart-scene";
import type { ChartSeriesScene } from "../../../scene/cartesian-scene";
import type { ChartStyleResolver } from "../../../style/chart-style-resolver";
import { setSvgAttribute } from "../svg-attribute-utils";
import type { SvgDefinitionRegistry } from "../svg-definition-registry";
import { createSvgElement } from "../svg-element-utils";
import { SvgCartesianAxisRenderer } from "./svg-cartesian-axis-renderer";
import { SvgCartesianGridRenderer } from "./svg-cartesian-grid-renderer";
import { SvgCartesianOverlayRenderer } from "./svg-cartesian-overlay-renderer";
import { SvgAreaSeriesRenderer } from "./series/svg-area-series-renderer";
import { SvgBarSeriesRenderer } from "./series/svg-bar-series-renderer";
import { SvgCandlestickSeriesRenderer } from "./series/svg-candlestick-series-renderer";
import { SvgLineSeriesRenderer } from "./series/svg-line-series-renderer";
import { SvgMarkerSeriesRenderer } from "./series/svg-marker-series-renderer";
import { SvgOhlcSeriesRenderer } from "./series/svg-ohlc-series-renderer";
import { SvgRangeAreaSeriesRenderer } from "./series/svg-range-area-series-renderer";
import { SvgRangeBarSeriesRenderer } from "./series/svg-range-bar-series-renderer";

/**
 * Small overflow allowance so marks whose stroke or radius sits exactly at a
 * domain extreme (a peak touching the max, a point at the first/last category)
 * aren't visually chopped in half by the plot clip rectangle.
 */
const SERIES_CLIP_OVERFLOW = 8;

interface SvgSeriesRendererLike {
    clear(): void;
    render(scene: ChartSeriesScene, defs?: SvgDefinitionRegistry): void;
}

export class SvgCartesianContentRenderer {
    readonly #axesGroup: SVGGElement;
    readonly #axisRenderer: SvgCartesianAxisRenderer;
    readonly #container: SVGGElement;
    readonly #gridGroup: SVGGElement;
    readonly #gridRenderer: SvgCartesianGridRenderer;
    readonly #overlayGroup: SVGGElement;
    readonly #overlayRenderer: SvgCartesianOverlayRenderer;
    readonly #seriesContainers = new Map<string, SVGGElement>();
    readonly #seriesGroup: SVGGElement;
    readonly #seriesRenderers = new Map<string, { renderer: SvgSeriesRendererLike; type: string }>();
    readonly #underlayGroup: SVGGElement;
    public constructor(container: SVGGElement) {
        this.#container = container;

        this.#gridGroup = createSvgElement("g");
        this.#gridGroup.setAttribute("data-layer", "grid");
        this.#container.appendChild(this.#gridGroup);

        this.#underlayGroup = createSvgElement("g");
        this.#underlayGroup.setAttribute("data-layer", "underlay");
        this.#container.appendChild(this.#underlayGroup);

        this.#seriesGroup = createSvgElement("g");
        this.#seriesGroup.setAttribute("data-layer", "series");
        this.#container.appendChild(this.#seriesGroup);

        this.#overlayGroup = createSvgElement("g");
        this.#overlayGroup.setAttribute("data-layer", "overlay");
        this.#container.appendChild(this.#overlayGroup);

        this.#axesGroup = createSvgElement("g");
        this.#axesGroup.setAttribute("data-layer", "axes");
        this.#container.appendChild(this.#axesGroup);

        this.#gridRenderer = new SvgCartesianGridRenderer(this.#gridGroup);
        this.#overlayRenderer = new SvgCartesianOverlayRenderer(this.#underlayGroup, this.#overlayGroup);
        this.#axisRenderer = new SvgCartesianAxisRenderer(this.#axesGroup);
    }

    #renderSeries(seriesList: readonly ChartSeriesScene[], defs: SvgDefinitionRegistry): void {
        const activeIds = new Set<string>();

        for (let i = 0; i < seriesList.length; i++) {
            const s = seriesList[i];
            activeIds.add(s.id);

            let group = this.#seriesContainers.get(s.id);
            if (!group) {
                group = createSvgElement("g");
                group.setAttribute("data-series-id", s.id);
                this.#seriesGroup.appendChild(group);
                this.#seriesContainers.set(s.id, group);
            }

            const currentNthChild = this.#seriesGroup.children[i];
            if (currentNthChild !== group) {
                this.#seriesGroup.insertBefore(group, currentNthChild ?? null);
            }

            let entry = this.#seriesRenderers.get(s.id);
            if (entry && entry.type !== s.type) {
                entry.renderer.clear();
                entry = undefined;
                this.#seriesRenderers.delete(s.id);
            }

            if (!entry) {
                let renderer: SvgSeriesRendererLike | null = null;
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
                    this.#seriesRenderers.set(s.id, entry);
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

        for (const [id, group] of this.#seriesContainers.entries()) {
            if (!activeIds.has(id)) {
                this.#seriesRenderers.get(id)?.renderer.clear();
                this.#seriesRenderers.delete(id);
                group.remove();
                this.#seriesContainers.delete(id);
            }
        }
    }

    public clear(): void {
        this.#gridRenderer.clear();
        this.#overlayRenderer.clear();
        this.#axisRenderer.clear();

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
        this.#gridGroup.remove();
        this.#underlayGroup.remove();
        this.#seriesGroup.remove();
        this.#overlayGroup.remove();
        this.#axesGroup.remove();
    }

    public render(scene: CartesianXYChartScene, defs: SvgDefinitionRegistry, styleResolver: ChartStyleResolver): void {
        const { plotRect, series } = scene;
        if (plotRect.width <= 0 || plotRect.height <= 0) {
            this.clear();
            return;
        }

        const plotClipUrl = defs.useClipRect(
            "plot-clip",
            plotRect.x - SERIES_CLIP_OVERFLOW,
            plotRect.y - SERIES_CLIP_OVERFLOW,
            plotRect.width + SERIES_CLIP_OVERFLOW * 2,
            plotRect.height + SERIES_CLIP_OVERFLOW * 2
        );

        // 1. Grid
        this.#gridRenderer.render(scene, styleResolver);

        // 2. Underlays
        this.#overlayRenderer.renderUnderlays(null, plotRect, plotClipUrl);

        // 3. Series
        setSvgAttribute(this.#seriesGroup, "clip-path", plotClipUrl);
        this.#renderSeries(series, defs);

        // 4. Overlays
        this.#overlayRenderer.renderOverlays(null, plotRect, undefined, plotClipUrl);

        // 5. Axes
        this.#axisRenderer.render(scene, styleResolver);
    }
}
