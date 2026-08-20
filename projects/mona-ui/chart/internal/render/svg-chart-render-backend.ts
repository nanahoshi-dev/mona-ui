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
import type { ChartRenderBackend, ChartRenderBackendKind, ChartRenderViewport } from "./chart-render-backend";
import { SvgDefinitionRegistry } from "./svg/svg-definition-registry";
import { SvgIdNamespace } from "./svg/svg-id-namespace";
import { SvgRootLayers } from "./svg/svg-root-layers";
import { SvgCartesianChartRenderer } from "./svg/cartesian/svg-cartesian-chart-renderer";
import { SvgPolarChartRenderer } from "./svg/polar/svg-polar-chart-renderer";
import { SvgHeatmapRenderer } from "./svg/other/svg-heatmap-renderer";
import { SvgTreemapRenderer } from "./svg/other/svg-treemap-renderer";
import { SvgFunnelRenderer } from "./svg/other/svg-funnel-renderer";
import { SvgWaterfallRenderer } from "./svg/other/svg-waterfall-renderer";
import { setSvgAttribute } from "./svg/svg-attribute-utils";

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

    public constructor(root: SVGSVGElement, instanceId?: number) {
        this.#root = root;
        this.#namespace = new SvgIdNamespace(instanceId);
        this.#layers = new SvgRootLayers(root);
        this.#defs = new SvgDefinitionRegistry(this.#layers.defs, this.#namespace);

        this.#cartesianRenderer = new SvgCartesianChartRenderer(this.#layers);
        this.#polarRenderer = new SvgPolarChartRenderer(this.#layers);
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
        this.#defs.beginFrame();

        const kind = this.#resolveSceneKind(scene);
        if (this.#lastRenderedKind && this.#lastRenderedKind !== kind) {
            this.#clearAllRenderers();
        }
        this.#lastRenderedKind = kind;

        switch (scene.coordinateSystem) {
            case "cartesian":
                if (scene.cartesianKind === "xy") {
                    this.#cartesianRenderer.render(
                        scene as CartesianXYChartScene,
                        presentation,
                        styleResolver,
                        this.#defs
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
                    this.#defs
                );
                break;
        }

        this.#defs.endFrame();
    }

    public renderCrossfade(frame: ChartCrossfadeRenderFrame): void {
        const { fromScene, presentation, progress, styleResolver, toScene } = frame;
        this.#defs.beginFrame();

        const toKind = this.#resolveSceneKind(toScene);
        if (this.#lastRenderedKind && this.#lastRenderedKind !== toKind) {
            this.#clearAllRenderers();
        }
        this.#lastRenderedKind = toKind;

        if (toScene.coordinateSystem === "cartesian" && toScene.cartesianKind === "xy") {
            const fromXY =
                fromScene && fromScene.coordinateSystem === "cartesian" && fromScene.cartesianKind === "xy"
                    ? (fromScene as CartesianXYChartScene)
                    : null;
            this.#cartesianRenderer.renderCrossfade(
                fromXY,
                toScene as CartesianXYChartScene,
                progress,
                presentation,
                styleResolver,
                this.#defs
            );
        } else {
            this.render({
                presentation,
                scene: toScene,
                styleResolver
            });
        }

        this.#defs.endFrame();
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
        this.#clearAllRenderers();
        this.#layers.clearLayers();
        this.#defs.clear();
        this.#lastRenderedKind = null;
    }

    public destroy(): void {
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
}
