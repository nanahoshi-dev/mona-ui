import type { ChartInteractionState } from "../../../interaction/chart-interaction-state";
import type {
    PolarArcChartScene,
    PolarAxisChartScene,
    PolarChartScene,
    PolarSectorChartScene
} from "../../../scene/chart-scene";
import type { ChartStyleResolver } from "../../../style/chart-style-resolver";
import { createSvgElement } from "../svg-element-utils";
import type { SvgDefinitionRegistry } from "../svg-definition-registry";
import type { SvgRootLayers } from "../svg-root-layers";
import { SvgPolarArcRenderer } from "./svg-polar-arc-renderer";
import { SvgPolarAxisRenderer } from "./svg-polar-axis-renderer";
import { SvgPolarSectorRenderer } from "./svg-polar-sector-renderer";

export class SvgPolarChartRenderer {
    readonly #container: SVGGElement;
    #sectorRenderer: SvgPolarSectorRenderer | null = null;
    #axisRenderer: SvgPolarAxisRenderer | null = null;
    #arcRenderer: SvgPolarArcRenderer | null = null;

    #sectorContainer: SVGGElement | null = null;
    #axisContainer: SVGGElement | null = null;
    #arcContainer: SVGGElement | null = null;

    public constructor(containerOrLayers: SVGGElement | SvgRootLayers) {
        this.#container = "series" in containerOrLayers ? containerOrLayers.series : containerOrLayers;
    }

    public render(
        scene: PolarChartScene,
        interactionState: ChartInteractionState | null,
        styleResolver: ChartStyleResolver,
        defs: SvgDefinitionRegistry
    ): void {
        switch (scene.polarKind) {
            case "sector": {
                this.#axisRenderer?.clear();
                this.#arcRenderer?.clear();
                if (!this.#sectorRenderer) {
                    this.#sectorContainer = createSvgElement("g");
                    this.#sectorContainer.setAttribute("data-polar-kind", "sector");
                    this.#container.appendChild(this.#sectorContainer);
                    this.#sectorRenderer = new SvgPolarSectorRenderer(this.#sectorContainer);
                }
                const sectorScene = scene as PolarSectorChartScene;
                for (const s of sectorScene.series) {
                    this.#sectorRenderer.render(s, interactionState, styleResolver, defs);
                }
                break;
            }
            case "axis": {
                this.#sectorRenderer?.clear();
                this.#arcRenderer?.clear();
                if (!this.#axisRenderer) {
                    this.#axisContainer = createSvgElement("g");
                    this.#axisContainer.setAttribute("data-polar-kind", "axis");
                    this.#container.appendChild(this.#axisContainer);
                    this.#axisRenderer = new SvgPolarAxisRenderer(this.#axisContainer);
                }
                this.#axisRenderer.render(scene as PolarAxisChartScene, interactionState, styleResolver, defs);
                break;
            }
            case "arc": {
                this.#sectorRenderer?.clear();
                this.#axisRenderer?.clear();
                if (!this.#arcRenderer) {
                    this.#arcContainer = createSvgElement("g");
                    this.#arcContainer.setAttribute("data-polar-kind", "arc");
                    this.#container.appendChild(this.#arcContainer);
                    this.#arcRenderer = new SvgPolarArcRenderer(this.#arcContainer);
                }
                this.#arcRenderer.render(scene as PolarArcChartScene, interactionState, styleResolver, defs);
                break;
            }
        }
    }

    public clear(): void {
        this.#sectorRenderer?.clear();
        this.#axisRenderer?.clear();
        this.#arcRenderer?.clear();
    }

    public destroy(): void {
        this.clear();
        this.#sectorRenderer?.destroy();
        this.#axisRenderer?.destroy();
        this.#arcRenderer?.destroy();
        this.#sectorContainer?.remove();
        this.#axisContainer?.remove();
        this.#arcContainer?.remove();
    }
}
