import type { ChartPoint, ChartRect } from "../../models/chart.models";
import type {
    CartesianOverlayScene,
    ScenePointAnnotation,
    SceneReferenceBand,
    SceneReferenceLine
} from "../scene/cartesian-overlay-scene";
import { crispPixel, drawPointMarker } from "../utils/canvas-utils";

function drawDiamondMarker(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    fillColor: string,
    strokeColor: string,
    strokeWidth: number
): void {
    context.save();
    context.beginPath();
    context.moveTo(x, y - radius);
    context.lineTo(x + radius, y);
    context.lineTo(x, y + radius);
    context.lineTo(x - radius, y);
    context.closePath();

    context.fillStyle = fillColor;
    context.fill();

    if (strokeWidth > 0 && strokeColor) {
        context.strokeStyle = strokeColor;
        context.lineWidth = strokeWidth;
        context.stroke();
    }
    context.restore();
}

export class CartesianOverlayRenderer {
    private static renderAnnotation(
        context: CanvasRenderingContext2D,
        ann: ScenePointAnnotation,
        effectiveAnchor?: ChartPoint
    ): void {
        // Connector line
        const anchor = effectiveAnchor ?? ann.label?.anchor;
        if (ann.connector && anchor && ann.connectorWidth > 0) {
            context.save();
            context.strokeStyle = ann.color;
            context.lineWidth = ann.connectorWidth;
            context.beginPath();
            context.moveTo(ann.point.x, ann.point.y);
            context.lineTo(anchor.x, anchor.y);
            context.stroke();
            context.restore();
        }

        // Marker
        if (ann.marker === "circle") {
            drawPointMarker(
                context,
                ann.point.x,
                ann.point.y,
                ann.markerRadius,
                ann.color,
                "#ffffff",
                ann.markerStrokeWidth
            );
        } else if (ann.marker === "diamond") {
            drawDiamondMarker(
                context,
                ann.point.x,
                ann.point.y,
                ann.markerRadius,
                ann.color,
                "#ffffff",
                ann.markerStrokeWidth
            );
        }
    }

    private static renderBand(context: CanvasRenderingContext2D, band: SceneReferenceBand): void {
        context.save();
        const { bounds, fillColor, fillOpacity, borderColor, borderWidth } = band;

        if (fillColor && fillOpacity > 0) {
            context.globalAlpha = fillOpacity;
            context.fillStyle = fillColor;
            context.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
        }

        if (borderColor && borderWidth > 0) {
            context.globalAlpha = 1;
            context.strokeStyle = borderColor;
            context.lineWidth = borderWidth;
            context.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
        }

        context.restore();
    }

    private static renderLine(
        context: CanvasRenderingContext2D,
        line: SceneReferenceLine,
        plotRect: ChartRect
    ): void {
        if (line.width <= 0 || line.opacity <= 0) {
            return;
        }
        context.save();
        context.globalAlpha = line.opacity;
        context.strokeStyle = line.color;
        context.lineWidth = line.width;
        context.setLineDash(line.dash as number[]);

        context.beginPath();
        if (line.axis === "x") {
            const x = crispPixel(line.coordinate, line.width);
            context.moveTo(x, plotRect.y);
            context.lineTo(x, plotRect.y + plotRect.height);
        } else {
            const y = crispPixel(line.coordinate, line.width);
            context.moveTo(plotRect.x, y);
            context.lineTo(plotRect.x + plotRect.width, y);
        }
        context.stroke();
        context.setLineDash([]);
        context.restore();
    }

    public static renderOverlays(
        context: CanvasRenderingContext2D,
        overlayScene: CartesianOverlayScene | null,
        plotRect: ChartRect,
        annotationBadgeAnchors?: ReadonlyMap<string, ChartPoint> | null
    ): void {
        if (!overlayScene) {
            return;
        }

        context.save();
        context.beginPath();
        context.rect(plotRect.x, plotRect.y, plotRect.width, plotRect.height);
        context.clip();

        // 1. Overlay Bands
        for (const band of overlayScene.referenceBands) {
            if (band.layer === "overlay") {
                this.renderBand(context, band);
            }
        }

        // 2. Overlay Lines
        for (const line of overlayScene.referenceLines) {
            if (line.layer === "overlay") {
                this.renderLine(context, line, plotRect);
            }
        }

        // 3. Annotations (connectors then markers)
        for (const ann of overlayScene.annotations) {
            const effectiveAnchor = annotationBadgeAnchors?.get(ann.id) ?? ann.label?.anchor;
            this.renderAnnotation(context, ann, effectiveAnchor);
        }

        context.restore();
    }

    public static renderUnderlays(
        context: CanvasRenderingContext2D,
        overlayScene: CartesianOverlayScene | null,
        plotRect: ChartRect
    ): void {
        if (!overlayScene || (overlayScene.referenceBands.length === 0 && overlayScene.referenceLines.length === 0)) {
            return;
        }

        context.save();
        context.beginPath();
        context.rect(plotRect.x, plotRect.y, plotRect.width, plotRect.height);
        context.clip();

        // 1. Underlay Bands
        for (const band of overlayScene.referenceBands) {
            if (band.layer === "underlay") {
                this.renderBand(context, band);
            }
        }

        // 2. Underlay Lines
        for (const line of overlayScene.referenceLines) {
            if (line.layer === "underlay") {
                this.renderLine(context, line, plotRect);
            }
        }

        context.restore();
    }
}
