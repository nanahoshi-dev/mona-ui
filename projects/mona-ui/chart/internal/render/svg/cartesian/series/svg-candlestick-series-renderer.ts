import type { ChartCandlestickSeriesScene } from "../../../../scene/cartesian-scene";
import type { SceneCandlestickMark } from "../../../../scene/scene-geometry";
import { setSvgAttribute } from "../../svg-attribute-utils";
import { SvgKeyedGroup } from "../../svg-keyed-group";

export class SvgCandlestickSeriesRenderer {
    readonly #keyedGroup: SvgKeyedGroup<SceneCandlestickMark, SVGGElement>;

    public constructor(container: SVGGElement) {
        this.#keyedGroup = new SvgKeyedGroup<SceneCandlestickMark, SVGGElement>(container);
    }

    public clear(): void {
        this.#keyedGroup.clear();
    }

    public destroy(): void {
        this.#keyedGroup.destroy();
    }

    public render(scene: ChartCandlestickSeriesScene): void {
        const marks = scene.marks ?? [];
        const { style } = scene;
        if (marks.length === 0) {
            this.#keyedGroup.clear();
            return;
        }

        const baseAlpha = (style.opacity ?? 1) * (scene.renderOpacity ?? 1);

        this.#keyedGroup.reconcile(marks, {
            key: (mark, index) => mark.animationKey ?? String(index),
            tag: "g",
            update: (group, mark) => {
                while (group.firstChild) {
                    group.firstChild.remove();
                }

                const markAlpha = baseAlpha * (mark.renderOpacity ?? 1);
                if (markAlpha <= 0) {
                    return;
                }

                const markColor =
                    style.color ||
                    (mark.direction === "rising"
                        ? style.risingColor
                        : mark.direction === "falling"
                          ? style.fallingColor
                          : style.neutralColor);
                const wickColor = style.wickColor || markColor;
                const wickWidth = mark.wickWidth;

                // 1. Wick Line
                const wickLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
                const cx = Math.round(mark.centerX);
                setSvgAttribute(wickLine, "x1", cx);
                setSvgAttribute(wickLine, "y1", Math.round(mark.highY));
                setSvgAttribute(wickLine, "x2", cx);
                setSvgAttribute(wickLine, "y2", Math.round(mark.lowY));
                setSvgAttribute(wickLine, "stroke", wickColor);
                setSvgAttribute(wickLine, "stroke-width", wickWidth);
                setSvgAttribute(wickLine, "shape-rendering", "crispEdges");
                group.appendChild(wickLine);

                // 2. Body Box
                const bounds = mark.bodyBounds;
                const bodyRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                setSvgAttribute(bodyRect, "x", bounds.x);
                setSvgAttribute(bodyRect, "y", bounds.y);
                setSvgAttribute(bodyRect, "width", bounds.width);
                setSvgAttribute(bodyRect, "height", bounds.height);

                if (mark.fillMode === "hollow" && mark.direction === "rising") {
                    setSvgAttribute(bodyRect, "fill", style.hollowFillColor ?? "#ffffff");
                    setSvgAttribute(bodyRect, "stroke", markColor);
                    setSvgAttribute(bodyRect, "stroke-width", Math.max(1, wickWidth));
                } else {
                    setSvgAttribute(bodyRect, "fill", markColor);
                    setSvgAttribute(bodyRect, "stroke", "none");
                    setSvgAttribute(bodyRect, "stroke-width", 0);
                }
                group.appendChild(bodyRect);

                setSvgAttribute(group, "opacity", markAlpha);
            }
        });
    }
}
