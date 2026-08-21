import type { ChartRangeAreaSeriesScene } from "../../../../scene/cartesian-scene";
import type { SceneRangeAreaPoint } from "../../../../scene/scene-geometry";
import {
    buildRangeAreaFillPath,
    buildRangeAreaFromStrokePath,
    buildRangeAreaToStrokePath
} from "../../../geometry/range-area-path-builder";
import { createSvgElement } from "../../svg-element-utils";
import { setSvgAttribute, withSvgAlpha } from "../../svg-attribute-utils";
import { SvgKeyedGroup } from "../../svg-keyed-group";

export class SvgRangeAreaSeriesRenderer {
    readonly #container: SVGGElement;
    #fillPath: SVGPathElement | null = null;
    #fromPath: SVGPathElement | null = null;
    #toPath: SVGPathElement | null = null;
    #markersGroup: SVGGElement | null = null;
    #markerKeyedGroup: SvgKeyedGroup<SceneRangeAreaPoint, SVGGElement> | null = null;

    public constructor(container: SVGGElement) {
        this.#container = container;
    }

    public render(scene: ChartRangeAreaSeriesScene): void {
        const points = scene.points ?? [];
        const { connectNulls, curve, fillOpacity, pointRadius, showPoints, strokeWidth, style } = scene;
        const validPoints = connectNulls ? points.filter(p => p.defined) : points;

        if (validPoints.length === 0) {
            this.clear();
            return;
        }

        const definedPoints = validPoints.filter(
            p => p.defined && p.fromPoint !== undefined && p.toPoint !== undefined
        );
        if (definedPoints.length === 0) {
            this.clear();
            return;
        }

        const opacity = scene.renderOpacity ?? 1;

        // 1. Fill Band
        if (!this.#fillPath) {
            this.#fillPath = createSvgElement("path");
            this.#container.appendChild(this.#fillPath);
        }
        const fillD = buildRangeAreaFillPath({ connectNulls, curve, points: validPoints }) ?? "";
        setSvgAttribute(this.#fillPath, "d", fillD);
        setSvgAttribute(this.#fillPath, "fill", withSvgAlpha(style.areaFillColor, fillOpacity));
        setSvgAttribute(this.#fillPath, "opacity", opacity);

        // 2. Stroke lines
        if (strokeWidth > 0) {
            if (!this.#fromPath) {
                this.#fromPath = createSvgElement("path");
                this.#container.appendChild(this.#fromPath);
            }
            if (!this.#toPath) {
                this.#toPath = createSvgElement("path");
                this.#container.appendChild(this.#toPath);
            }

            const fromD = buildRangeAreaFromStrokePath({ connectNulls, curve, points: validPoints }) ?? "";
            const toD = buildRangeAreaToStrokePath({ connectNulls, curve, points: validPoints }) ?? "";

            setSvgAttribute(this.#fromPath, "d", fromD);
            setSvgAttribute(this.#fromPath, "fill", "none");
            setSvgAttribute(this.#fromPath, "stroke", style.color);
            setSvgAttribute(this.#fromPath, "stroke-width", strokeWidth);
            setSvgAttribute(this.#fromPath, "opacity", opacity);

            setSvgAttribute(this.#toPath, "d", toD);
            setSvgAttribute(this.#toPath, "fill", "none");
            setSvgAttribute(this.#toPath, "stroke", style.color);
            setSvgAttribute(this.#toPath, "stroke-width", strokeWidth);
            setSvgAttribute(this.#toPath, "opacity", opacity);
        } else {
            if (this.#fromPath) {
                this.#fromPath.remove();
                this.#fromPath = null;
            }
            if (this.#toPath) {
                this.#toPath.remove();
                this.#toPath = null;
            }
        }

        // 3. Markers
        if (showPoints) {
            if (!this.#markersGroup) {
                this.#markersGroup = createSvgElement("g");
                this.#container.appendChild(this.#markersGroup);
                this.#markerKeyedGroup = new SvgKeyedGroup(this.#markersGroup);
            }

            this.#markerKeyedGroup?.reconcile(definedPoints, {
                key: (p, index) => p.animationKey ?? String(index),
                tag: "g",
                update: (group, p) => {
                    while (group.firstChild) {
                        group.firstChild.remove();
                    }
                    const pointAlpha = opacity * (p.renderOpacity ?? 1);
                    if (pointAlpha <= 0) {
                        return;
                    }
                    if (p.fromPoint) {
                        const circle1 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                        setSvgAttribute(circle1, "cx", p.fromPoint.x);
                        setSvgAttribute(circle1, "cy", p.fromPoint.y);
                        setSvgAttribute(circle1, "r", pointRadius);
                        setSvgAttribute(circle1, "fill", style.color);
                        setSvgAttribute(circle1, "stroke", "#ffffff");
                        setSvgAttribute(circle1, "stroke-width", 1.5);
                        setSvgAttribute(circle1, "opacity", pointAlpha);
                        group.appendChild(circle1);
                    }
                    if (p.toPoint) {
                        const circle2 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                        setSvgAttribute(circle2, "cx", p.toPoint.x);
                        setSvgAttribute(circle2, "cy", p.toPoint.y);
                        setSvgAttribute(circle2, "r", pointRadius);
                        setSvgAttribute(circle2, "fill", style.color);
                        setSvgAttribute(circle2, "stroke", "#ffffff");
                        setSvgAttribute(circle2, "stroke-width", 1.5);
                        setSvgAttribute(circle2, "opacity", pointAlpha);
                        group.appendChild(circle2);
                    }
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
        if (this.#fillPath) {
            this.#fillPath.remove();
            this.#fillPath = null;
        }
        if (this.#fromPath) {
            this.#fromPath.remove();
            this.#fromPath = null;
        }
        if (this.#toPath) {
            this.#toPath.remove();
            this.#toPath = null;
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
