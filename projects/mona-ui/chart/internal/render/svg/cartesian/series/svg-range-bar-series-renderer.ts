import type { ChartRangeBarSeriesScene } from "../../../../scene/cartesian-scene";
import type { SceneRangeBar } from "../../../../scene/scene-geometry";
import { buildRoundedRectPath } from "../../../geometry/rounded-rect-path-builder";
import { setSvgAttribute } from "../../svg-attribute-utils";
import { SvgKeyedGroup } from "../../svg-keyed-group";

export class SvgRangeBarSeriesRenderer {
    readonly #keyedGroup: SvgKeyedGroup<SceneRangeBar, SVGPathElement>;

    public constructor(container: SVGGElement) {
        this.#keyedGroup = new SvgKeyedGroup<SceneRangeBar, SVGPathElement>(container);
    }

    public render(scene: ChartRangeBarSeriesScene): void {
        const { bars, borderRadius, fillOpacity, style } = scene;
        if (bars.length === 0) {
            this.#keyedGroup.clear();
            return;
        }

        const baseAlpha = fillOpacity * (scene.renderOpacity ?? 1);

        this.#keyedGroup.reconcile(bars, {
            key: (bar, index) => bar.animationKey ?? String(bar.index ?? index),
            tag: "path",
            update: (element, bar) => {
                const barAlpha = baseAlpha * (bar.renderOpacity ?? 1);
                const orientation = bar.orientation ?? scene.orientation ?? "vertical";

                if (orientation === "horizontal" && bar.width <= 0.001) {
                    const x = Math.round(bar.x);
                    setSvgAttribute(element, "d", `M ${x} ${bar.y} V ${bar.y + bar.height}`);
                    setSvgAttribute(element, "fill", "none");
                    setSvgAttribute(element, "stroke", style.color);
                    setSvgAttribute(element, "stroke-width", 1.5);
                    setSvgAttribute(element, "opacity", barAlpha <= 0 ? 0 : barAlpha);
                    return;
                }

                if (orientation === "vertical" && bar.height <= 0.001) {
                    const y = Math.round(bar.y);
                    setSvgAttribute(element, "d", `M ${bar.x} ${y} H ${bar.x + bar.width}`);
                    setSvgAttribute(element, "fill", "none");
                    setSvgAttribute(element, "stroke", style.color);
                    setSvgAttribute(element, "stroke-width", 1.5);
                    setSvgAttribute(element, "opacity", barAlpha <= 0 ? 0 : barAlpha);
                    return;
                }

                const radius = bar.radius ?? borderRadius;
                const cornerRadii = bar.cornerRadii ?? (radius > 0 ? {
                    bottomLeft: radius,
                    bottomRight: radius,
                    topLeft: radius,
                    topRight: radius
                } : { bottomLeft: 0, bottomRight: 0, topLeft: 0, topRight: 0 });

                const d = buildRoundedRectPath(bar.x, bar.y, bar.width, bar.height, cornerRadii);
                setSvgAttribute(element, "d", d);
                setSvgAttribute(element, "fill", style.color);
                setSvgAttribute(element, "stroke", "none");
                setSvgAttribute(element, "stroke-width", 0);
                setSvgAttribute(element, "opacity", barAlpha <= 0 ? 0 : barAlpha);
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
