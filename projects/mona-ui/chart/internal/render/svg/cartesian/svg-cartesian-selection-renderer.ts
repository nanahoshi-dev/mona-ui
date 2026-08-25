import type { ChartRect } from "../../../../models/chart.models";
import { CartesianMarkVisualGeometry } from "../../../interaction/cartesian-mark-visual-geometry";
import type { CartesianSelectionScene } from "../../../scene/cartesian-selection-scene";
import type { SceneHitTarget } from "../../../scene/scene-geometry";
import { setSvgAttribute } from "../svg-attribute-utils";
import { SvgKeyedGroup } from "../svg-keyed-group";

export interface SvgCartesianSelectionOptions {
    readonly color?: string;
    readonly fillOpacity?: number;
    readonly plotClipUrl?: string;
    readonly plotRect: ChartRect;
    readonly strokeWidth?: number;
}

export class SvgCartesianSelectionRenderer {
    readonly #keyedGroup: SvgKeyedGroup<SceneHitTarget, SVGGElement>;

    public constructor(container: SVGGElement) {
        this.#keyedGroup = new SvgKeyedGroup<SceneHitTarget, SVGGElement>(container);
    }

    public clear(): void {
        this.#keyedGroup.clear();
    }

    public destroy(): void {
        this.#keyedGroup.destroy();
    }

    public render(scene: CartesianSelectionScene | null, options: SvgCartesianSelectionOptions): void {
        if (!scene || scene.hits.length === 0) {
            this.#keyedGroup.clear();
            return;
        }

        const { color = "#3b82f6", fillOpacity = 0.12, plotClipUrl, strokeWidth = 2 } = options;

        this.#keyedGroup.reconcile(scene.hits, {
            key: (hit, index) => `${hit.seriesId}:${hit.animationKey ?? hit.index ?? index}`,
            tag: "g",
            update: (group, hit) => {
                while (group.firstChild) {
                    group.firstChild.remove();
                }

                if (plotClipUrl) {
                    setSvgAttribute(group, "clip-path", plotClipUrl);
                }

                const type = hit.seriesType;

                if (type === "bar" || type === "rangeBar") {
                    const b = CartesianMarkVisualGeometry.getVisualBounds(hit);
                    if (b) {
                        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                        setSvgAttribute(rect, "x", b.x);
                        setSvgAttribute(rect, "y", b.y);
                        setSvgAttribute(rect, "width", b.width);
                        setSvgAttribute(rect, "height", b.height);
                        setSvgAttribute(rect, "fill", color);
                        setSvgAttribute(rect, "fill-opacity", fillOpacity);
                        setSvgAttribute(rect, "stroke", color);
                        setSvgAttribute(rect, "stroke-width", strokeWidth);
                        group.appendChild(rect);
                    }
                } else if (type === "rangeArea") {
                    const highPt = hit.highPoint ?? hit.point;
                    const lowPt = hit.lowPoint ?? hit.point;
                    if (highPt && lowPt) {
                        const connector = document.createElementNS("http://www.w3.org/2000/svg", "line");
                        setSvgAttribute(connector, "x1", highPt.x);
                        setSvgAttribute(connector, "y1", highPt.y);
                        setSvgAttribute(connector, "x2", lowPt.x);
                        setSvgAttribute(connector, "y2", lowPt.y);
                        setSvgAttribute(connector, "stroke", color);
                        setSvgAttribute(connector, "stroke-width", strokeWidth);
                        group.appendChild(connector);

                        const highCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                        setSvgAttribute(highCircle, "cx", highPt.x);
                        setSvgAttribute(highCircle, "cy", highPt.y);
                        setSvgAttribute(highCircle, "r", 5);
                        setSvgAttribute(highCircle, "fill", "none");
                        setSvgAttribute(highCircle, "stroke", color);
                        setSvgAttribute(highCircle, "stroke-width", strokeWidth);
                        group.appendChild(highCircle);

                        const lowCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                        setSvgAttribute(lowCircle, "cx", lowPt.x);
                        setSvgAttribute(lowCircle, "cy", lowPt.y);
                        setSvgAttribute(lowCircle, "r", 5);
                        setSvgAttribute(lowCircle, "fill", "none");
                        setSvgAttribute(lowCircle, "stroke", color);
                        setSvgAttribute(lowCircle, "stroke-width", strokeWidth);
                        group.appendChild(lowCircle);
                    }
                } else if (type === "candlestick" || type === "ohlc") {
                    const b = CartesianMarkVisualGeometry.getVisualBounds(hit);
                    if (b) {
                        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                        setSvgAttribute(rect, "x", b.x);
                        setSvgAttribute(rect, "y", b.y);
                        setSvgAttribute(rect, "width", b.width);
                        setSvgAttribute(rect, "height", b.height);
                        setSvgAttribute(rect, "fill", color);
                        setSvgAttribute(rect, "fill-opacity", fillOpacity);
                        setSvgAttribute(rect, "stroke", color);
                        setSvgAttribute(rect, "stroke-width", strokeWidth);
                        group.appendChild(rect);
                    } else if (hit.point) {
                        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                        setSvgAttribute(circle, "cx", hit.point.x);
                        setSvgAttribute(circle, "cy", hit.point.y);
                        setSvgAttribute(circle, "r", 6);
                        setSvgAttribute(circle, "fill", "none");
                        setSvgAttribute(circle, "stroke", color);
                        setSvgAttribute(circle, "stroke-width", strokeWidth);
                        group.appendChild(circle);
                    }
                } else {
                    const pt = CartesianMarkVisualGeometry.getVisualCenter(hit);
                    const baseRadius = CartesianMarkVisualGeometry.getVisualRadius(hit, 4);
                    const ringRadius = baseRadius + 3;

                    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                    setSvgAttribute(circle, "cx", pt.x);
                    setSvgAttribute(circle, "cy", pt.y);
                    setSvgAttribute(circle, "r", ringRadius);
                    setSvgAttribute(circle, "fill", color);
                    setSvgAttribute(circle, "fill-opacity", fillOpacity);
                    setSvgAttribute(circle, "stroke", color);
                    setSvgAttribute(circle, "stroke-width", strokeWidth);
                    group.appendChild(circle);
                }
            }
        });
    }
}
