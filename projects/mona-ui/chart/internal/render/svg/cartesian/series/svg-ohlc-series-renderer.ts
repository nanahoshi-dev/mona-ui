import type { ChartOhlcSeriesScene } from "../../../../scene/cartesian-scene";
import type { SceneOhlcMark } from "../../../../scene/scene-geometry";
import { setSvgAttribute } from "../../svg-attribute-utils";
import { SvgKeyedGroup } from "../../svg-keyed-group";

/** Draws each OHLC mark as a group of two paths: the high-low stem in `wickColor`, and the open and close ticks. */
export class SvgOhlcSeriesRenderer {
    readonly #keyedGroup: SvgKeyedGroup<SceneOhlcMark, SVGGElement>;

    public constructor(container: SVGGElement) {
        this.#keyedGroup = new SvgKeyedGroup<SceneOhlcMark, SVGGElement>(container);
    }

    public clear(): void {
        this.#keyedGroup.clear();
    }

    public destroy(): void {
        this.#keyedGroup.destroy();
    }

    static #ensurePaths(group: SVGGElement): readonly [SVGPathElement, SVGPathElement] {
        const paths = group.querySelectorAll<SVGPathElement>(":scope > path");
        if (paths.length === 2) {
            return [paths[0], paths[1]];
        }
        group.replaceChildren();
        const stem = document.createElementNS("http://www.w3.org/2000/svg", "path");
        const ticks = document.createElementNS("http://www.w3.org/2000/svg", "path");
        group.append(stem, ticks);
        return [stem, ticks];
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
            tag: "g",
            update: (group, mark) => {
                const [stem, ticks] = SvgOhlcSeriesRenderer.#ensurePaths(group);
                const markAlpha = baseAlpha * (mark.renderOpacity ?? 1);
                if (markAlpha <= 0) {
                    setSvgAttribute(group, "opacity", 0);
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
                const openY = Math.round(mark.openY);
                const closeY = Math.round(mark.closeY);
                const tickWidth = mark.tickWidth;

                setSvgAttribute(group, "opacity", markAlpha);
                setSvgAttribute(group, "fill", "none");
                setSvgAttribute(group, "stroke-width", mark.wickWidth);
                setSvgAttribute(group, "shape-rendering", "crispEdges");
                setSvgAttribute(stem, "d", `M ${cx} ${Math.round(mark.highY)} V ${Math.round(mark.lowY)}`);
                setSvgAttribute(stem, "stroke", style.wickColor || markColor);
                setSvgAttribute(
                    ticks,
                    "d",
                    `M ${cx - tickWidth} ${openY} H ${cx} M ${cx} ${closeY} H ${cx + tickWidth}`
                );
                setSvgAttribute(ticks, "stroke", markColor);
            }
        });
    }
}
