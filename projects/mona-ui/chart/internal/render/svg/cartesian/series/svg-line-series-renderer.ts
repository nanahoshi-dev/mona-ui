import type { ChartLineSeriesScene } from "../../../../scene/cartesian-scene";
import type { ScenePoint } from "../../../../scene/scene-geometry";
import { buildLinePath } from "../../../geometry/line-path-builder";
import { createSvgElement } from "../../svg-element-utils";
import { resolveStrokeDashArray, setSvgAttribute } from "../../svg-attribute-utils";
import { SvgKeyedGroup } from "../../svg-keyed-group";

export class SvgLineSeriesRenderer {
    readonly #container: SVGGElement;
    #markerKeyedGroup: SvgKeyedGroup<ScenePoint, SVGCircleElement> | null = null;
    #markersGroup: SVGGElement | null = null;
    #pathElement: SVGPathElement | null = null;
    public constructor(container: SVGGElement) {
        this.#container = container;
    }

    public clear(): void {
        if (this.#pathElement) {
            this.#pathElement.remove();
            this.#pathElement = null;
        }
        if (this.#markersGroup) {
            this.#markerKeyedGroup?.clear();
            this.#markersGroup.remove();
            this.#markersGroup = null;
            this.#markerKeyedGroup = null;
        }
    }

    public destroy(): void {
        this.clear();
    }

    public render(scene: ChartLineSeriesScene): void {
        const points = scene.points ?? [];
        const { connectNulls, curve, showPoints, style } = scene;
        const validPoints = connectNulls ? points.filter(p => p.defined) : points;

        if (validPoints.length === 0) {
            this.clear();
            return;
        }

        if (!this.#pathElement) {
            this.#pathElement = createSvgElement("path");
            this.#container.appendChild(this.#pathElement);
        }

        const d = buildLinePath({ connectNulls, curve, points: validPoints }) ?? "";
        const seriesOpacity = scene.renderOpacity ?? 1;

        setSvgAttribute(this.#pathElement, "d", d);
        setSvgAttribute(this.#pathElement, "fill", "none");
        setSvgAttribute(this.#pathElement, "stroke", style.color);
        setSvgAttribute(this.#pathElement, "stroke-width", style.lineWidth);
        setSvgAttribute(this.#pathElement, "stroke-dasharray", resolveStrokeDashArray(style.lineStyle));
        setSvgAttribute(this.#pathElement, "opacity", seriesOpacity);


        if (showPoints) {
            if (!this.#markersGroup) {
                this.#markersGroup = createSvgElement("g");
                this.#container.appendChild(this.#markersGroup);
                this.#markerKeyedGroup = new SvgKeyedGroup(this.#markersGroup);
            }

            const visiblePoints = validPoints.filter(p => p.defined);
            this.#markerKeyedGroup?.reconcile(visiblePoints, {
                key: (p, index) => p.animationKey ?? String(index),
                tag: "circle",
                update: (circle, p) => {
                    const pointAlpha = seriesOpacity * (p.renderOpacity ?? 1);
                    setSvgAttribute(circle, "cx", p.x);
                    setSvgAttribute(circle, "cy", p.y);
                    setSvgAttribute(circle, "r", style.pointRadius);
                    setSvgAttribute(circle, "fill", style.color);
                    setSvgAttribute(circle, "stroke", "#ffffff");
                    setSvgAttribute(circle, "stroke-width", 1.5);
                    setSvgAttribute(circle, "opacity", pointAlpha <= 0 ? 0 : pointAlpha);
                }
            });
        } else if (this.#markersGroup) {
            this.#markerKeyedGroup?.clear();
            this.#markersGroup.remove();
            this.#markersGroup = null;
            this.#markerKeyedGroup = null;
        }
    }
}
