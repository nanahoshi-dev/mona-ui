import type { CartesianXYChartScene } from "../scene/chart-scene";
import type {
    CartesianOverlayScene,
    SceneAnnotationLabel,
    ScenePointAnnotation,
    SceneReferenceBand,
    SceneReferenceLabel,
    SceneReferenceLine
} from "../scene/cartesian-overlay-scene";
import type {
    ChartAnnotationRegistration,
    ChartReferenceBandRegistration,
    ChartReferenceLineRegistration
} from "../context/chart-registration-context";
import type { ChartStyleResolver } from "../style/chart-style-resolver";
import type { ChartPoint, ChartRect } from "../../models/chart.models";
import { getOrCreateBaseCategoryIndex } from "../viewport/cartesian-axis-coordinate-space";

const EMPTY_OVERLAY_SCENE: CartesianOverlayScene = {
    annotations: [],
    referenceBands: [],
    referenceLines: []
};

function getLineDash(style: string): readonly number[] {
    switch (style) {
        case "dotted":
            return [2, 3];
        case "solid":
            return [];
        case "dashed":
        default:
            return [4, 4];
    }
}

export class CartesianOverlayProjector {
    public static project(
        scene: CartesianXYChartScene | null,
        referenceLines: readonly ChartReferenceLineRegistration[],
        referenceBands: readonly ChartReferenceBandRegistration[],
        annotations: readonly ChartAnnotationRegistration[],
        styleResolver: ChartStyleResolver
    ): CartesianOverlayScene {
        if (!scene || !scene.coordinateSpace || scene.plotRect.width <= 0 || scene.plotRect.height <= 0) {
            return EMPTY_OVERLAY_SCENE;
        }

        const plotRect = scene.plotRect;
        const coordinateSpace = scene.coordinateSpace;

        const projectedLines: SceneReferenceLine[] = [];
        const projectedBands: SceneReferenceBand[] = [];
        const projectedAnnotations: ScenePointAnnotation[] = [];

        // 1. Project Reference Lines
        for (const reg of referenceLines) {
            if (!reg.visible()) {
                continue;
            }

            const axis = reg.axis();
            const axisId = reg.axisId() ?? (axis === "x" ? scene.primaryXAxisId : scene.primaryYAxisId);
            if (!axisId) {
                continue;
            }

            const ref = { axis, axisId };
            const snap = coordinateSpace.get(ref);
            if (!snap || snap.valid === false) {
                continue;
            }

            let coordinate: number | undefined;
            if (snap.resolvedType === "category") {
                const geom = coordinateSpace.resolveCategoryByKey(ref, reg.value(), "viewport");
                if (!geom) {
                    continue;
                }
                coordinate = geom.bandCenter;
            } else {
                const coord = coordinateSpace.mapContinuousValue(ref, reg.value(), "viewport");
                if (coord === undefined || !Number.isFinite(coord)) {
                    continue;
                }
                coordinate = coord;
            }

            // Check if line intersects plot area
            if (axis === "x") {
                if (coordinate < plotRect.x || coordinate > plotRect.x + plotRect.width) {
                    continue;
                }
            } else if (axis === "y") {
                if (coordinate < plotRect.y || coordinate > plotRect.y + plotRect.height) {
                    continue;
                }
            }

            const style = styleResolver.resolveReferenceLineStyle(reg);
            const lineStyle = reg.lineStyle();
            const dash = getLineDash(lineStyle);

            let label: SceneReferenceLabel | undefined;
            const labelText = reg.label();
            const hasTemplate = !!reg.template?.();
            if (labelText || hasTemplate) {
                const pos = reg.labelPosition() ?? "end";
                let anchor: ChartPoint;
                if (axis === "x") {
                    switch (pos) {
                        case "start":
                            anchor = { x: coordinate, y: plotRect.y };
                            break;
                        case "center":
                            anchor = { x: coordinate, y: plotRect.y + plotRect.height / 2 };
                            break;
                        case "end":
                        default:
                            anchor = { x: coordinate, y: plotRect.y + plotRect.height };
                            break;
                    }
                } else {
                    switch (pos) {
                        case "start":
                            anchor = { x: plotRect.x, y: coordinate };
                            break;
                        case "center":
                            anchor = { x: plotRect.x + plotRect.width / 2, y: coordinate };
                            break;
                        case "end":
                        default:
                            anchor = { x: plotRect.x + plotRect.width, y: coordinate };
                            break;
                    }
                }

                label = {
                    anchor,
                    formattedText: labelText,
                    labelClass: reg.labelClass(),
                    offset: reg.labelOffset(),
                    position: pos,
                    userClass: reg.userClass()
                };
            }

            projectedLines.push({
                axis,
                axisId,
                color: style.color,
                coordinate,
                dash,
                id: reg.id,
                label,
                layer: reg.layer(),
                opacity: style.opacity,
                width: style.width
            });
        }

        // 2. Project Reference Bands
        for (const reg of referenceBands) {
            if (!reg.visible()) {
                continue;
            }

            const axis = reg.axis();
            const axisId = reg.axisId() ?? (axis === "x" ? scene.primaryXAxisId : scene.primaryYAxisId);
            if (!axisId) {
                continue;
            }

            const ref = { axis, axisId };
            const snap = coordinateSpace.get(ref);
            if (!snap || snap.valid === false) {
                continue;
            }

            let pixelStart: number;
            let pixelEnd: number;

            if (snap.resolvedType === "category") {
                const baseIndexMap = getOrCreateBaseCategoryIndex(snap.baseDomain);
                const fromStr = String(reg.from());
                const toStr = String(reg.to());
                const idxFrom = baseIndexMap.get(fromStr);
                const idxTo = baseIndexMap.get(toStr);

                if (idxFrom === undefined || idxTo === undefined) {
                    continue;
                }

                const minBaseIdx = Math.min(idxFrom, idxTo);
                const maxBaseIdx = Math.max(idxFrom, idxTo);
                const vDomain = snap.categoryIndex?.viewportDomain ?? [];

                const visibleKeysInRange = vDomain.filter(k => {
                    const bIdx = baseIndexMap.get(k);
                    return bIdx !== undefined && bIdx >= minBaseIdx && bIdx <= maxBaseIdx;
                });

                if (visibleKeysInRange.length === 0) {
                    continue;
                }

                const firstKey = visibleKeysInRange[0];
                const lastKey = visibleKeysInRange[visibleKeysInRange.length - 1];
                const firstGeom = snap.categoryIndex?.byKey.get(firstKey);
                const lastGeom = snap.categoryIndex?.byKey.get(lastKey);

                if (!firstGeom || !lastGeom) {
                    continue;
                }

                pixelStart = Math.min(firstGeom.bandStart, lastGeom.bandStart, firstGeom.bandEnd, lastGeom.bandEnd);
                pixelEnd = Math.max(firstGeom.bandStart, lastGeom.bandStart, firstGeom.bandEnd, lastGeom.bandEnd);
            } else {
                const p0 = coordinateSpace.mapContinuousValue(ref, reg.from(), "viewport");
                const p1 = coordinateSpace.mapContinuousValue(ref, reg.to(), "viewport");

                if (p0 === undefined || p1 === undefined || !Number.isFinite(p0) || !Number.isFinite(p1)) {
                    continue;
                }

                if (Math.abs(p0 - p1) < 1e-6) {
                    continue;
                }

                pixelStart = Math.min(p0, p1);
                pixelEnd = Math.max(p0, p1);
            }

            let bounds: ChartRect;
            if (axis === "x") {
                const x0 = Math.max(plotRect.x, pixelStart);
                const x1 = Math.min(plotRect.x + plotRect.width, pixelEnd);
                if (x1 <= x0) {
                    continue;
                }
                bounds = {
                    x: x0,
                    y: plotRect.y,
                    width: x1 - x0,
                    height: plotRect.height
                };
            } else {
                const y0 = Math.max(plotRect.y, pixelStart);
                const y1 = Math.min(plotRect.y + plotRect.height, pixelEnd);
                if (y1 <= y0) {
                    continue;
                }
                bounds = {
                    x: plotRect.x,
                    y: y0,
                    width: plotRect.width,
                    height: y1 - y0
                };
            }

            const style = styleResolver.resolveReferenceBandStyle(reg);

            let label: SceneReferenceLabel | undefined;
            const labelText = reg.label();
            const hasTemplate = !!reg.template?.();
            if (labelText || hasTemplate) {
                const pos = reg.labelPosition() ?? "center";
                let anchor: ChartPoint;
                if (axis === "x") {
                    switch (pos) {
                        case "start":
                            anchor = { x: bounds.x + bounds.width / 2, y: bounds.y };
                            break;
                        case "end":
                            anchor = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height };
                            break;
                        case "center":
                        default:
                            anchor = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
                            break;
                    }
                } else {
                    switch (pos) {
                        case "start":
                            anchor = { x: bounds.x, y: bounds.y + bounds.height / 2 };
                            break;
                        case "end":
                            anchor = { x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2 };
                            break;
                        case "center":
                        default:
                            anchor = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
                            break;
                    }
                }

                label = {
                    anchor,
                    formattedText: labelText,
                    labelClass: reg.labelClass(),
                    offset: reg.labelOffset(),
                    position: pos,
                    userClass: reg.userClass()
                };
            }

            projectedBands.push({
                axis,
                axisId,
                borderColor: style.borderColor,
                borderWidth: style.borderWidth,
                bounds,
                fillColor: style.fillColor,
                fillOpacity: style.fillOpacity,
                id: reg.id,
                label,
                layer: reg.layer()
            });
        }

        // 3. Project Point Annotations
        for (const reg of annotations) {
            if (!reg.visible()) {
                continue;
            }

            const xAxisId = reg.xAxisId() ?? scene.primaryXAxisId;
            const yAxisId = reg.yAxisId() ?? scene.primaryYAxisId;
            if (!xAxisId || !yAxisId) {
                continue;
            }

            const xRef = { axis: "x" as const, axisId: xAxisId };
            const yRef = { axis: "y" as const, axisId: yAxisId };

            const xSnap = coordinateSpace.get(xRef);
            const ySnap = coordinateSpace.get(yRef);
            if (!xSnap || xSnap.valid === false || !ySnap || ySnap.valid === false) {
                continue;
            }

            let px: number | undefined;
            if (xSnap.resolvedType === "category") {
                const geom = coordinateSpace.resolveCategoryByKey(xRef, reg.x(), "viewport");
                if (!geom) {
                    continue;
                }
                px = geom.bandCenter;
            } else {
                const coord = coordinateSpace.mapContinuousValue(xRef, reg.x(), "viewport");
                if (coord === undefined || !Number.isFinite(coord)) {
                    continue;
                }
                px = coord;
            }

            let py: number | undefined;
            if (ySnap.resolvedType === "category") {
                const geom = coordinateSpace.resolveCategoryByKey(yRef, reg.y(), "viewport");
                if (!geom) {
                    continue;
                }
                py = geom.bandCenter;
            } else {
                const coord = coordinateSpace.mapContinuousValue(yRef, reg.y(), "viewport");
                if (coord === undefined || !Number.isFinite(coord)) {
                    continue;
                }
                py = coord;
            }

            if (
                px < plotRect.x ||
                px > plotRect.x + plotRect.width ||
                py < plotRect.y ||
                py > plotRect.y + plotRect.height
            ) {
                continue;
            }

            const style = styleResolver.resolveAnnotationStyle(reg);
            const point: ChartPoint = { x: px, y: py };

            let label: SceneAnnotationLabel | undefined;
            const labelText = reg.label();
            const hasTemplate = !!reg.template?.();
            if (labelText || hasTemplate) {
                const placement = reg.labelPlacement() ?? "top";
                let dx = 0;
                let dy = 0;
                switch (placement) {
                    case "bottom":
                        dy = 12;
                        break;
                    case "left":
                        dx = -12;
                        break;
                    case "right":
                        dx = 12;
                        break;
                    case "top":
                    default:
                        dy = 0;
                        break;
                }

                const userDx = reg.offsetX() ?? 0;
                const userDy = placement === "top" ? (reg.offsetY() ?? -12) : (reg.offsetY() ?? 0);

                const anchor: ChartPoint = {
                    x: px + dx + userDx,
                    y: py + dy + userDy
                };

                label = {
                    anchor,
                    formattedText: labelText,
                    labelClass: reg.labelClass(),
                    offsetX: userDx,
                    offsetY: userDy,
                    placement,
                    userClass: reg.userClass()
                };
            }

            projectedAnnotations.push({
                color: style.color,
                connector: reg.connector(),
                connectorWidth: style.connectorWidth,
                data: reg.data(),
                id: reg.id,
                label,
                marker: reg.marker(),
                markerRadius: style.markerRadius,
                markerStrokeWidth: style.markerStrokeWidth,
                point
            });
        }

        return {
            annotations: projectedAnnotations,
            referenceBands: projectedBands,
            referenceLines: projectedLines
        };
    }
}
