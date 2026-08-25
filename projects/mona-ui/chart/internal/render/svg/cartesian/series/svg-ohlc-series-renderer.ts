import type { ChartOhlcSeriesScene } from "../../../../scene/cartesian-scene";
import type { SceneOhlcMark } from "../../../../scene/scene-geometry";
import { setSvgAttribute } from "../../svg-attribute-utils";
import { SvgKeyedGroup } from "../../svg-keyed-group";

export class SvgOhlcSeriesRenderer {
    readonly #keyedGroup: SvgKeyedGroup<SceneOhlcMark, SVGPathElement>;

    public constructor(container: SVGGElement) {
        this.#keyedGroup = new SvgKeyedGroup<SceneOhlcMark, SVGPathElement>(container);
    }

    public clear(): void {
        this.#keyedGroup.clear();
    }

    public destroy(): void {
        this.#keyedGroup.destroy();
    }

    public render(scene: ChartOhlcSeriesScene): void {
        const marks = scene.marks ?? [];
        const { style } = scene;
        if (marks.length === 0) {
            this.#keyedGroup.clear();
            return;
        }

        const baseAlpha = (style.opacity ?? 1) * (scene.renderOpacity ?? 1);

        this.#keyedGroup.reconcile(marks, {
            key: (mark, index) => mark.animationKey ?? String(index),
            tag: "path",
            update: (element, mark) => {
                const markAlpha = baseAlpha * (mark.renderOpacity ?? 1);
                if (markAlpha <= 0) {
                    setSvgAttribute(element, "opacity", 0);
                    return;
                }

                const markColor =
                    style.color ||
                    (mark.direction === "rising"
                        ? style.risingColor
                        : mark.direction === "falling"
                          ? style.fallingColor
                          : style.neutralColor);

                const cx = Math.round(mark.centerX);
                const highY = Math.round(mark.highY);
                const lowY = Math.round(mark.lowY);
                const openY = Math.round(mark.openY);
                const closeY = Math.round(mark.closeY);
                const tickWidth = mark.tickWidth;

                const d = `M ${cx} ${highY} V ${lowY} M ${cx - tickWidth} ${openY} H ${cx} M ${cx} ${closeY} H ${cx + tickWidth}`;

                setSvgAttribute(element, "d", d);
                setSvgAttribute(element, "fill", "none");
                setSvgAttribute(element, "stroke", markColor);
                setSvgAttribute(element, "stroke-width", mark.wickWidth);
                setSvgAttribute(element, "opacity", markAlpha);
                setSvgAttribute(element, "shape-rendering", "crispEdges");
            }
        });
    }
}
