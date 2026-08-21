import type {
    CartesianHeatmapChartScene,
    CartesianXYChartScene,
    ChartScene,
    PolarChartScene
} from "../scene/chart-scene";
import type { CartesianFunnelChartScene } from "../scene/funnel-scene";
import type { TreemapChartScene } from "../scene/hierarchical-scene";
import type { CartesianWaterfallChartScene } from "../scene/waterfall-scene";
import type { ChartCrossfadeRenderFrame, ChartRenderFrame } from "./chart-render-frame";
import type { ChartRenderPresentationState } from "./chart-render-presentation-state";
import type { ChartRenderBackend, ChartRenderBackendKind, ChartRenderViewport } from "./chart-render-backend";
import type { ChartStyleResolver } from "../style/chart-style-resolver";
import { SvgDefinitionRegistry } from "./svg/svg-definition-registry";
import { SvgIdNamespace } from "./svg/svg-id-namespace";
import { SvgRootLayers } from "./svg/svg-root-layers";
import { SvgCartesianChartRenderer } from "./svg/cartesian/svg-cartesian-chart-renderer";
import { SvgCartesianContentRenderer } from "./svg/cartesian/svg-cartesian-content-renderer";
import { SvgPolarChartRenderer } from "./svg/polar/svg-polar-chart-renderer";
import { SvgHeatmapRenderer } from "./svg/other/svg-heatmap-renderer";
import { SvgTreemapRenderer } from "./svg/other/svg-treemap-renderer";
import { SvgFunnelRenderer } from "./svg/other/svg-funnel-renderer";
import { SvgWaterfallRenderer } from "./svg/other/svg-waterfall-renderer";
import { setSvgAttribute } from "./svg/svg-attribute-utils";
import { createSvgElement } from "./svg/svg-element-utils";

export class SvgChartRenderBackend implements ChartRenderBackend {
    public readonly kind: ChartRenderBackendKind = "svg";

    readonly #root: SVGSVGElement;
    readonly #namespace: SvgIdNamespace;
    readonly #layers: SvgRootLayers;
    readonly #defs: SvgDefinitionRegistry;

    readonly #cartesianRenderer: SvgCartesianChartRenderer;
    readonly #polarRenderer: SvgPolarChartRenderer;
    readonly #heatmapRenderer: SvgHeatmapRenderer;
    readonly #treemapRenderer: SvgTreemapRenderer;
    readonly #funnelRenderer: SvgFunnelRenderer;
    readonly #waterfallRenderer: SvgWaterfallRenderer;

    #lastRenderedKind: string | null = null;
    #genericFromScope: SVGGElement | null = null;
    #genericToScope: SVGGElement | null = null;
    #fromCartesianRenderer: SvgCartesianContentRenderer | null = null;
    #toCartesianRenderer: SvgCartesianContentRenderer | null = null;
    #fromPolarRenderer: SvgPolarChartRenderer | null = null;
    #toPolarRenderer: SvgPolarChartRenderer | null = null;
    #fromHeatmapRenderer: SvgHeatmapRenderer | null = null;
    #toHeatmapRenderer: SvgHeatmapRenderer | null = null;
    #fromTreemapRenderer: SvgTreemapRenderer | null = null;
    #toTreemapRenderer: SvgTreemapRenderer | null = null;
    #fromFunnelRenderer: SvgFunnelRenderer | null = null;
    #toFunnelRenderer: SvgFunnelRenderer | null = null;
    #fromWaterfallRenderer: SvgWaterfallRenderer | null = null;
    #toWaterfallRenderer: SvgWaterfallRenderer | null = null;

    public constructor(root: SVGSVGElement, instanceId?: number) {
        this.#root = root;
        this.#namespace = new SvgIdNamespace(instanceId);
        this.#layers = new SvgRootLayers(root);
        this.#defs = new SvgDefinitionRegistry(this.#layers.defs, this.#namespace);

        this.#cartesianRenderer = new SvgCartesianChartRenderer(this.#layers);
        this.#polarRenderer = new SvgPolarChartRenderer(this.#layers.series);
        this.#heatmapRenderer = new SvgHeatmapRenderer(this.#layers.series);
        this.#treemapRenderer = new SvgTreemapRenderer(this.#layers.series);
        this.#funnelRenderer = new SvgFunnelRenderer(this.#layers.series);
        this.#waterfallRenderer = new SvgWaterfallRenderer(this.#layers.series);
    }

    public get rootElement(): SVGSVGElement {
        return this.#root;
    }

    public get layers(): SvgRootLayers {
        return this.#layers;
    }

    public get defs(): SvgDefinitionRegistry {
        return this.#defs;
    }

    public resize(viewport: ChartRenderViewport): void {
        const { height, width } = viewport;
        setSvgAttribute(this.#root, "width", width);
        setSvgAttribute(this.#root, "height", height);
        setSvgAttribute(this.#root, "viewBox", `0 0 ${width} ${height}`);
        this.#root.style.width = `${width}px`;
        this.#root.style.height = `${height}px`;
    }

    public render(frame: ChartRenderFrame): void {
        const { presentation, scene, styleResolver } = frame;
        this.#clearGenericCrossfade();
        this.#defs.beginFrame();

        const kind = this.#resolveSceneKind(scene);
        if (this.#lastRenderedKind && this.#lastRenderedKind !== kind) {
            this.#clearAllRenderers();
            this.#layers.resetRootAttributes();
        }
        this.#lastRenderedKind = kind;

        this.#renderDirect(scene, presentation, styleResolver, this.#defs);

        this.#defs.endFrame();
    }

    public renderCrossfade(frame: ChartCrossfadeRenderFrame): void {
        const { fromScene, presentation, progress, styleResolver, toScene } = frame;
        this.#defs.beginFrame();

        const toKind = this.#resolveSceneKind(toScene);
        if (this.#lastRenderedKind && this.#lastRenderedKind !== toKind) {
            this.#clearAllRenderers();
            this.#layers.resetRootAttributes();
        }
        this.#lastRenderedKind = toKind;

        const isBothCartesianXY =
            fromScene?.coordinateSystem === "cartesian" &&
            fromScene.cartesianKind === "xy" &&
            toScene.coordinateSystem === "cartesian" &&
            toScene.cartesianKind === "xy";

        if (isBothCartesianXY) {
            this.#clearGenericCrossfade();
            this.#cartesianRenderer.renderCrossfade(
                fromScene as CartesianXYChartScene,
                toScene as CartesianXYChartScene,
                progress,
                presentation,
                styleResolver,
                this.#defs
            );
        } else {
            if (fromScene && progress < 1) {
                this.#clearAllRenderers();

                if (!this.#genericFromScope) {
                    this.#genericFromScope = createSvgElement("g");
                    this.#genericFromScope.setAttribute("data-crossfade-scope", "from");
                    this.#layers.series.appendChild(this.#genericFromScope);
                }
                if (!this.#genericToScope) {
                    this.#genericToScope = createSvgElement("g");
                    this.#genericToScope.setAttribute("data-crossfade-scope", "to");
                    this.#layers.series.appendChild(this.#genericToScope);
                }

                const p = Math.max(0, Math.min(1, progress));
                setSvgAttribute(this.#genericFromScope, "opacity", Math.max(0, Math.min(1, 1 - p)));
                setSvgAttribute(this.#genericToScope, "opacity", Math.max(0, Math.min(1, p)));

                const fromDefs = this.#defs.withScope("cf-from");
                const toDefs = this.#defs.withScope("cf-to");

                this.#renderSceneIntoContainer(fromScene, this.#genericFromScope, styleResolver, fromDefs, true);
                this.#renderSceneIntoContainer(toScene, this.#genericToScope, styleResolver, toDefs, false);
            } else {
                this.#clearGenericCrossfade();
                this.#renderDirect(toScene, presentation, styleResolver, this.#defs);
            }
        }

        this.#defs.endFrame();
    }

    #renderDirect(
        scene: ChartScene,
        presentation: ChartRenderPresentationState | null,
        styleResolver: ChartStyleResolver,
        defs: SvgDefinitionRegistry
    ): void {
        switch (scene.coordinateSystem) {
            case "cartesian":
                if (scene.cartesianKind === "xy") {
                    this.#cartesianRenderer.render(
                        scene as CartesianXYChartScene,
                        presentation,
                        styleResolver,
                        defs
                    );
                    break;
                }
                if (scene.cartesianKind === "heatmap") {
                    this.#heatmapRenderer.render(
                        scene as CartesianHeatmapChartScene,
                        presentation?.interaction ?? null,
                        styleResolver
                    );
                    break;
                }
                if (scene.cartesianKind === "funnel") {
                    this.#funnelRenderer.render(
                        scene as CartesianFunnelChartScene,
                        presentation?.interaction ?? null,
                        styleResolver
                    );
                    break;
                }
                if (scene.cartesianKind === "waterfall") {
                    this.#waterfallRenderer.render(
                        scene as CartesianWaterfallChartScene,
                        presentation?.interaction ?? null,
                        styleResolver
                    );
                    break;
                }
                break;
            case "hierarchical":
                if (scene.hierarchicalKind === "treemap") {
                    this.#treemapRenderer.render(
                        scene as TreemapChartScene,
                        presentation?.interaction ?? null,
                        styleResolver
                    );
                }
                break;
            case "polar":
                this.#polarRenderer.render(
                    scene as PolarChartScene,
                    presentation?.interaction ?? null,
                    styleResolver,
                    defs
                );
                break;
        }
    }

    #resolveSceneKind(scene: ChartScene): string {
        if (scene.coordinateSystem === "cartesian") {
            return `cartesian-${scene.cartesianKind}`;
        }
        if (scene.coordinateSystem === "hierarchical") {
            return `hierarchical-${scene.hierarchicalKind}`;
        }
        if (scene.coordinateSystem === "polar") {
            return `polar-${scene.polarKind}`;
        }
        return "unknown";
    }

    public clear(): void {
        this.#clearGenericCrossfade();
        this.#clearAllRenderers();
        this.#layers.resetRootAttributes();
        this.#defs.clear();
        this.#lastRenderedKind = null;
    }

    public destroy(): void {
        this.#clearGenericCrossfade();
        this.#cartesianRenderer.destroy();
        this.#polarRenderer.destroy();
        this.#heatmapRenderer.destroy();
        this.#treemapRenderer.destroy();
        this.#funnelRenderer.destroy();
        this.#waterfallRenderer.destroy();
        this.#defs.destroy();
        this.#layers.destroy();
    }

    #clearAllRenderers(): void {
        this.#cartesianRenderer.clear();
        this.#polarRenderer.clear();
        this.#heatmapRenderer.clear();
        this.#treemapRenderer.clear();
        this.#funnelRenderer.clear();
        this.#waterfallRenderer.clear();
    }

    #clearGenericCrossfade(): void {
        if (this.#genericFromScope) {
            this.#fromCartesianRenderer?.clear();
            this.#fromPolarRenderer?.clear();
            this.#fromHeatmapRenderer?.clear();
            this.#fromTreemapRenderer?.clear();
            this.#fromFunnelRenderer?.clear();
            this.#fromWaterfallRenderer?.clear();
            this.#genericFromScope.remove();
            this.#genericFromScope = null;
            this.#fromCartesianRenderer = null;
            this.#fromPolarRenderer = null;
            this.#fromHeatmapRenderer = null;
            this.#fromTreemapRenderer = null;
            this.#fromFunnelRenderer = null;
            this.#fromWaterfallRenderer = null;
        }
        if (this.#genericToScope) {
            this.#toCartesianRenderer?.clear();
            this.#toPolarRenderer?.clear();
            this.#toHeatmapRenderer?.clear();
            this.#toTreemapRenderer?.clear();
            this.#toFunnelRenderer?.clear();
            this.#toWaterfallRenderer?.clear();
            this.#genericToScope.remove();
            this.#genericToScope = null;
            this.#toCartesianRenderer = null;
            this.#toPolarRenderer = null;
            this.#toHeatmapRenderer = null;
            this.#toTreemapRenderer = null;
            this.#toFunnelRenderer = null;
            this.#toWaterfallRenderer = null;
        }
    }

    #renderSceneIntoContainer(
        scene: ChartScene,
        container: SVGGElement,
        styleResolver: ChartStyleResolver,
        defs: SvgDefinitionRegistry,
        isFrom: boolean
    ): void {
        switch (scene.coordinateSystem) {
            case "cartesian":
                if (scene.cartesianKind === "xy") {
                    let r = isFrom ? this.#fromCartesianRenderer : this.#toCartesianRenderer;
                    if (!r) {
                        r = new SvgCartesianContentRenderer(container);
                        if (isFrom) this.#fromCartesianRenderer = r; else this.#toCartesianRenderer = r;
                    }
                    r.render(scene as CartesianXYChartScene, defs, styleResolver);
                } else if (scene.cartesianKind === "heatmap") {
                    let r = isFrom ? this.#fromHeatmapRenderer : this.#toHeatmapRenderer;
                    if (!r) {
                        r = new SvgHeatmapRenderer(container);
                        if (isFrom) this.#fromHeatmapRenderer = r; else this.#toHeatmapRenderer = r;
                    }
                    r.render(scene as CartesianHeatmapChartScene, null, styleResolver);
                } else if (scene.cartesianKind === "funnel") {
                    let r = isFrom ? this.#fromFunnelRenderer : this.#toFunnelRenderer;
                    if (!r) {
                        r = new SvgFunnelRenderer(container);
                        if (isFrom) this.#fromFunnelRenderer = r; else this.#toFunnelRenderer = r;
                    }
                    r.render(scene as CartesianFunnelChartScene, null, styleResolver);
                } else if (scene.cartesianKind === "waterfall") {
                    let r = isFrom ? this.#fromWaterfallRenderer : this.#toWaterfallRenderer;
                    if (!r) {
                        r = new SvgWaterfallRenderer(container);
                        if (isFrom) this.#fromWaterfallRenderer = r; else this.#toWaterfallRenderer = r;
                    }
                    r.render(scene as CartesianWaterfallChartScene, null, styleResolver);
                }
                break;
            case "hierarchical":
                if (scene.hierarchicalKind === "treemap") {
                    let r = isFrom ? this.#fromTreemapRenderer : this.#toTreemapRenderer;
                    if (!r) {
                        r = new SvgTreemapRenderer(container);
                        if (isFrom) this.#fromTreemapRenderer = r; else this.#toTreemapRenderer = r;
                    }
                    r.render(scene as TreemapChartScene, null, styleResolver);
                }
                break;
            case "polar": {
                let r = isFrom ? this.#fromPolarRenderer : this.#toPolarRenderer;
                if (!r) {
                    r = new SvgPolarChartRenderer(container);
                    if (isFrom) this.#fromPolarRenderer = r; else this.#toPolarRenderer = r;
                }
                r.render(scene as PolarChartScene, null, styleResolver, defs);
                break;
            }
        }
    }
}

