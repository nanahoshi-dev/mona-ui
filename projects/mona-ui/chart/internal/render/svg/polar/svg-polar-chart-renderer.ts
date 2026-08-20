import type { ChartInteractionState } from "../../../interaction/chart-interaction-state";
import type {
    PolarArcChartScene,
    PolarAxisChartScene,
    PolarChartScene,
    PolarSectorChartScene
} from "../../../scene/chart-scene";
import type { ChartStyleResolver } from "../../../style/chart-style-resolver";
import type { SvgDefinitionRegistry } from "../svg-definition-registry";
import type { SvgRootLayers } from "../svg-root-layers";
import { SvgPolarArcRenderer } from "./svg-polar-arc-renderer";
import { SvgPolarAxisRenderer } from "./svg-polar-axis-renderer";
import { SvgPolarSectorRenderer } from "./svg-polar-sector-renderer";

export class SvgPolarChartRenderer {
    readonly #sectorRenderer: SvgPolarSectorRenderer;
    readonly #axisRenderer: SvgPolarAxisRenderer;
    readonly #arcRenderer: SvgPolarArcRenderer;

    public constructor(layers: SvgRootLayers) {
        this.#sectorRenderer = new SvgPolarSectorRenderer(layers.series);
        this.#axisRenderer = new SvgPolarAxisRenderer(layers.series);
        this.#arcRenderer = new SvgPolarArcRenderer(layers.series);
    }

    public render(
        scene: PolarChartScene,
        interactionState: ChartInteractionState | null,
        styleResolver: ChartStyleResolver,
        defs: SvgDefinitionRegistry
    ): void {
        switch (scene.polarKind) {
            case "sector": {
                this.#axisRenderer.clear();
                this.#arcRenderer.clear();
                const sectorScene = scene as PolarSectorChartScene;
                for (const s of sectorScene.series) {
                    this.#sectorRenderer.render(s, interactionState, styleResolver, defs);
                }
                break;
            }
            case "axis":
                this.#sectorRenderer.clear();
                this.#arcRenderer.clear();
                this.#axisRenderer.render(scene as PolarAxisChartScene, interactionState, styleResolver, defs);
                break;
            case "arc":
                this.#sectorRenderer.clear();
                this.#axisRenderer.clear();
                this.#arcRenderer.render(scene as PolarArcChartScene, interactionState, styleResolver, defs);
                break;
        }
    }

    public clear(): void {
        this.#sectorRenderer.clear();
        this.#axisRenderer.clear();
        this.#arcRenderer.clear();
    }

    public destroy(): void {
        this.clear();
        this.#sectorRenderer.destroy();
        this.#axisRenderer.destroy();
        this.#arcRenderer.destroy();
    }
}
