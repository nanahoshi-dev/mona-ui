import type { ChartAreaSeriesScene } from "../../../../scene/cartesian-scene";
import type { SceneAreaPoint } from "../../../../scene/scene-geometry";
import { buildAreaFillPath, buildAreaStrokePath } from "../../../geometry/area-path-builder";
import { createAreaGradientSpec } from "../../../series/area-gradient";
import { createSvgElement } from "../../svg-element-utils";
import { setSvgAttribute, withSvgAlpha } from "../../svg-attribute-utils";
import type { SvgDefinitionRegistry } from "../../svg-definition-registry";
import { SvgKeyedGroup } from "../../svg-keyed-group";

export class SvgAreaSeriesRenderer {
    readonly #container: SVGGElement;
    #fillPathElement: SVGPathElement | null = null;
    #strokePathElement: SVGPathElement | null = null;
    #markersGroup: SVGGElement | null = null;
    #markerKeyedGroup: SvgKeyedGroup<SceneAreaPoint, SVGCircleElement> | null = null;

    public constructor(container: SVGGElement) {
        this.#container = container;
    }

    public render(scene: ChartAreaSeriesScene, defs: SvgDefinitionRegistry): void {
        const points = scene.points ?? [];
        const { baselineY, connectNulls, curve, fillMode, fillOpacity, showPoints, style } = scene;
        const validPoints = connectNulls ? points.filter(p => p.defined) : points;

        if (validPoints.length === 0) {
            this.clear();
            return;
        }

        const definedPoints = validPoints.filter(p => p.defined);
        if (definedPoints.length === 0) {
            this.clear();
            return;
        }

        const seriesOpacity = scene.renderOpacity ?? 1;

        // 1. Fill Path
        if (!this.#fillPathElement) {
            this.#fillPathElement = createSvgElement("path");
            this.#container.appendChild(this.#fillPathElement);
        }

        const fillD = buildAreaFillPath({ baselineY, connectNulls, curve, points: validPoints }) ?? "";
        setSvgAttribute(this.#fillPathElement, "d", fillD);

        if (fillMode === "solid") {
            setSvgAttribute(this.#fillPathElement, "fill", withSvgAlpha(style.areaFillColor, fillOpacity));
        } else {
            const spec = createAreaGradientSpec(baselineY, definedPoints, style.areaFillColor, fillOpacity);
            if (spec) {
                const gradUrl = defs.useLinearGradient(`area-grad-${scene.id}`, {
                    endX: 0,
                    endY: spec.endY ?? spec.endPos,
                    startX: 0,
                    startY: spec.startY ?? spec.startPos,
                    stops: spec.stops
                });
                setSvgAttribute(this.#fillPathElement, "fill", gradUrl);
            } else {
                setSvgAttribute(this.#fillPathElement, "fill", withSvgAlpha(style.areaFillColor, fillOpacity));
            }
        }
        setSvgAttribute(this.#fillPathElement, "opacity", seriesOpacity);

        // 2. Stroke Path
        if (!this.#strokePathElement) {
            this.#strokePathElement = createSvgElement("path");
            this.#container.appendChild(this.#strokePathElement);
        }

        const strokeD = buildAreaStrokePath({ baselineY, connectNulls, curve, points: validPoints }) ?? "";
        setSvgAttribute(this.#strokePathElement, "d", strokeD);
        setSvgAttribute(this.#strokePathElement, "fill", "none");
        setSvgAttribute(this.#strokePathElement, "stroke", style.color);
        setSvgAttribute(this.#strokePathElement, "stroke-width", style.lineWidth);
        setSvgAttribute(this.#strokePathElement, "opacity", seriesOpacity);

        // 3. Markers
        if (showPoints) {
            if (!this.#markersGroup) {
                this.#markersGroup = createSvgElement("g");
                this.#container.appendChild(this.#markersGroup);
                this.#markerKeyedGroup = new SvgKeyedGroup(this.#markersGroup);
            }

            this.#markerKeyedGroup?.reconcile(definedPoints, {
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

    public clear(): void {
        if (this.#fillPathElement) {
            this.#fillPathElement.remove();
            this.#fillPathElement = null;
        }
        if (this.#strokePathElement) {
            this.#strokePathElement.remove();
            this.#strokePathElement = null;
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
}
