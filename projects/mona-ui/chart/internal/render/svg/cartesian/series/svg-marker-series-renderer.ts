import type {
    ChartBubbleSeriesScene,
    ChartScatterSeriesScene
} from "../../../../scene/cartesian-scene";
import type { SceneMarker } from "../../../../scene/scene-geometry";
import { setSvgAttribute } from "../../svg-attribute-utils";
import { SvgKeyedGroup } from "../../svg-keyed-group";

export class SvgMarkerSeriesRenderer {
    readonly #keyedGroup: SvgKeyedGroup<SceneMarker, SVGCircleElement>;

    public constructor(container: SVGGElement) {
        this.#keyedGroup = new SvgKeyedGroup<SceneMarker, SVGCircleElement>(container);
    }

    public render(scene: ChartBubbleSeriesScene | ChartScatterSeriesScene): void {
        const { markers, renderOpacity = 1, style } = scene;
        if (markers.length === 0 || renderOpacity <= 0) {
            this.#keyedGroup.clear();
            return;
        }

        this.#keyedGroup.reconcile(markers, {
            key: (m, index) => m.animationKey ?? String(index),
            tag: "circle",
            update: (circle, m) => {
                const markerOpacity = (m.renderOpacity ?? 1) * renderOpacity;
                setSvgAttribute(circle, "cx", m.x);
                setSvgAttribute(circle, "cy", m.y);
                setSvgAttribute(circle, "r", Math.max(0, m.radius));
                setSvgAttribute(circle, "fill", style.color);
                setSvgAttribute(circle, "fill-opacity", style.fillOpacity);
                setSvgAttribute(circle, "stroke", style.strokeColor || "none");
                setSvgAttribute(circle, "stroke-width", style.strokeWidth ?? 0);
                setSvgAttribute(circle, "opacity", markerOpacity <= 0 ? 0 : markerOpacity);
            }
        });
    }

    public clear(): void {
        this.#keyedGroup.clear();
    }

    public destroy(): void {
        this.#keyedGroup.destroy();
    }
}
