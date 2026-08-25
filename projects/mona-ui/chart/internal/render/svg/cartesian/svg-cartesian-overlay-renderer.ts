import type { ChartPoint, ChartRect } from "../../../../models/chart.models";
import type {
    CartesianOverlayScene,
    ScenePointAnnotation,
    SceneReferenceBand,
    SceneReferenceLine
} from "../../../scene/cartesian-overlay-scene";
import { setSvgAttribute } from "../svg-attribute-utils";
import { SvgKeyedGroup } from "../svg-keyed-group";

export class SvgCartesianOverlayRenderer {
    readonly #overlayGroup: SvgKeyedGroup<SceneReferenceBand | SceneReferenceLine | ScenePointAnnotation, SVGElement>;
    readonly #underlayGroup: SvgKeyedGroup<SceneReferenceBand | SceneReferenceLine, SVGElement>;
    public constructor(underlayContainer: SVGGElement, overlayContainer: SVGGElement) {
        this.#underlayGroup = new SvgKeyedGroup(underlayContainer);
        this.#overlayGroup = new SvgKeyedGroup(overlayContainer);
    }

    #updateAnnotation(group: SVGGElement, ann: ScenePointAnnotation, effectiveAnchor?: ChartPoint): void {
        while (group.firstChild) {
            group.firstChild.remove();
        }

        const anchor = effectiveAnchor ?? ann.label?.anchor;
        if (ann.connector && anchor && ann.connectorWidth > 0) {
            const connectorLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
            setSvgAttribute(connectorLine, "x1", ann.point.x);
            setSvgAttribute(connectorLine, "y1", ann.point.y);
            setSvgAttribute(connectorLine, "x2", anchor.x);
            setSvgAttribute(connectorLine, "y2", anchor.y);
            setSvgAttribute(connectorLine, "stroke", ann.color);
            setSvgAttribute(connectorLine, "stroke-width", ann.connectorWidth);
            group.appendChild(connectorLine);
        }

        if (ann.marker === "circle") {
            const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            setSvgAttribute(circle, "cx", ann.point.x);
            setSvgAttribute(circle, "cy", ann.point.y);
            setSvgAttribute(circle, "r", ann.markerRadius);
            setSvgAttribute(circle, "fill", ann.color);
            setSvgAttribute(circle, "stroke", "#ffffff");
            setSvgAttribute(circle, "stroke-width", ann.markerStrokeWidth);
            group.appendChild(circle);
        } else if (ann.marker === "diamond") {
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            const r = ann.markerRadius;
            const x = ann.point.x;
            const y = ann.point.y;
            const d = `M ${x} ${y - r} L ${x + r} ${y} L ${x} ${y + r} L ${x - r} ${y} Z`;
            setSvgAttribute(path, "d", d);
            setSvgAttribute(path, "fill", ann.color);
            setSvgAttribute(path, "stroke", "#ffffff");
            setSvgAttribute(path, "stroke-width", ann.markerStrokeWidth);
            group.appendChild(path);
        }
    }

    #updateBand(rect: SVGRectElement, band: SceneReferenceBand): void {
        const { bounds, fillColor, fillOpacity, borderColor, borderWidth } = band;
        setSvgAttribute(rect, "x", bounds.x);
        setSvgAttribute(rect, "y", bounds.y);
        setSvgAttribute(rect, "width", bounds.width);
        setSvgAttribute(rect, "height", bounds.height);
        setSvgAttribute(rect, "fill", fillColor || "none");
        setSvgAttribute(rect, "fill-opacity", fillOpacity);
        setSvgAttribute(rect, "stroke", borderColor || "none");
        setSvgAttribute(rect, "stroke-width", borderWidth ?? 0);
    }

    #updateLine(lineEl: SVGLineElement, line: SceneReferenceLine, plotRect: ChartRect): void {
        const dashArray = Array.isArray(line.dash) && line.dash.length > 0 ? line.dash.join(" ") : undefined;
        if (line.axis === "x") {
            const x = Math.round(line.coordinate);
            setSvgAttribute(lineEl, "x1", x);
            setSvgAttribute(lineEl, "y1", plotRect.y);
            setSvgAttribute(lineEl, "x2", x);
            setSvgAttribute(lineEl, "y2", plotRect.y + plotRect.height);
        } else {
            const y = Math.round(line.coordinate);
            setSvgAttribute(lineEl, "x1", plotRect.x);
            setSvgAttribute(lineEl, "y1", y);
            setSvgAttribute(lineEl, "x2", plotRect.x + plotRect.width);
            setSvgAttribute(lineEl, "y2", y);
        }
        setSvgAttribute(lineEl, "stroke", line.color);
        setSvgAttribute(lineEl, "stroke-width", line.width);
        setSvgAttribute(lineEl, "opacity", line.opacity);
        setSvgAttribute(lineEl, "stroke-dasharray", dashArray);
        setSvgAttribute(lineEl, "shape-rendering", "crispEdges");
    }

    public clear(): void {
        this.#underlayGroup.clear();
        this.#overlayGroup.clear();
    }

    public destroy(): void {
        this.#underlayGroup.destroy();
        this.#overlayGroup.destroy();
    }

    public renderOverlays(
        overlayScene: CartesianOverlayScene | null,
        plotRect: ChartRect,
        annotationBadgeAnchors?: ReadonlyMap<string, ChartPoint> | null,
        plotClipUrl?: string
    ): void {
        if (!overlayScene) {
            this.#overlayGroup.clear();
            return;
        }

        const items: (SceneReferenceBand | SceneReferenceLine | ScenePointAnnotation)[] = [];
        for (const band of overlayScene.referenceBands) {
            if (band.layer === "overlay") {
                items.push(band);
            }
        }
        for (const line of overlayScene.referenceLines) {
            if (line.layer === "overlay") {
                items.push(line);
            }
        }
        for (const ann of overlayScene.annotations) {
            items.push(ann);
        }

        this.#overlayGroup.reconcile(items, {
            key: item => item.id,
            tag: item => ("bounds" in item ? "rect" : "marker" in item ? "g" : "line"),
            update: (element, item) => {
                if ("bounds" in item) {
                    this.#updateBand(element as SVGRectElement, item);
                } else if ("marker" in item) {
                    const effectiveAnchor = annotationBadgeAnchors?.get(item.id) ?? item.label?.anchor;
                    this.#updateAnnotation(element as SVGGElement, item, effectiveAnchor);
                } else {
                    this.#updateLine(element as SVGLineElement, item, plotRect);
                }
                if (plotClipUrl && !("marker" in item)) {
                    setSvgAttribute(element, "clip-path", plotClipUrl);
                }
            }
        });
    }

    public renderUnderlays(
        overlayScene: CartesianOverlayScene | null,
        plotRect: ChartRect,
        plotClipUrl?: string
    ): void {
        if (!overlayScene) {
            this.#underlayGroup.clear();
            return;
        }

        const items: (SceneReferenceBand | SceneReferenceLine)[] = [];
        for (const band of overlayScene.referenceBands) {
            if (band.layer === "underlay") {
                items.push(band);
            }
        }
        for (const line of overlayScene.referenceLines) {
            if (line.layer === "underlay") {
                items.push(line);
            }
        }

        this.#underlayGroup.reconcile(items, {
            key: item => `${item.layer}:${item.id}`,
            tag: item => ("bounds" in item ? "rect" : "line"),
            update: (element, item) => {
                if ("bounds" in item) {
                    this.#updateBand(element as SVGRectElement, item);
                } else {
                    this.#updateLine(element as SVGLineElement, item, plotRect);
                }
                if (plotClipUrl) {
                    setSvgAttribute(element, "clip-path", plotClipUrl);
                }
            }
        });
    }
}
