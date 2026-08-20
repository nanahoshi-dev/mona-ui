import type { ChartBarSeriesScene } from "../../../../scene/cartesian-scene";
import type { SceneBar } from "../../../../scene/scene-geometry";
import { buildBarPath } from "../../../geometry/rounded-rect-path-builder";
import { setSvgAttribute } from "../../svg-attribute-utils";
import { SvgKeyedGroup } from "../../svg-keyed-group";

export class SvgBarSeriesRenderer {
    readonly #keyedGroup: SvgKeyedGroup<SceneBar, SVGPathElement>;

    public constructor(container: SVGGElement) {
        this.#keyedGroup = new SvgKeyedGroup<SceneBar, SVGPathElement>(container);
    }

    public render(scene: ChartBarSeriesScene): void {
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
                const d = buildBarPath({
                    cornerRadii: bar.cornerRadii,
                    height: bar.height,
                    isPositive: bar.isPositive,
                    orientation: "vertical",
                    radius: bar.radius ?? borderRadius,
                    width: bar.width,
                    x: bar.x,
                    y: bar.y
                });

                setSvgAttribute(element, "d", d);
                setSvgAttribute(element, "fill", style.color);
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
