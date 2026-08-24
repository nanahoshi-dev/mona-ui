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
import type {} from "../../models/chart-axis.models";
import { getOrCreateBaseCategoryIndex } from "../viewport/cartesian-axis-coordinate-space";
import { formatCartesianAxisSemanticValue } from "../utils/chart-formatter";

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
            reg.userClass();
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
            let semanticIndex = 0;
            if (snap.resolvedType === "category") {
                const geom = coordinateSpace.resolveCategoryByKey(ref, reg.value(), "viewport");
                if (!geom) {
                    continue;
                }
                coordinate = geom.bandCenter;
                semanticIndex = geom.baseIndex ?? geom.viewportIndex ?? 0;
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
            const targetAxis = scene.axes.find(a => a.axis === axis && a.axisId === axisId);
            const formattedValue = formatCartesianAxisSemanticValue({
                axisScene: targetAxis,
                index: semanticIndex,
                value: reg.value(),
                xTimeSpanMs: scene.xTimeSpanMs
            });

            let label: SceneReferenceLabel | undefined;
            const labelText = reg.label();
            const hasTemplate = !!reg.template?.();
            if (labelText || hasTemplate) {
                const pos = reg.labelPosition() ?? "end";
                const offset = reg.labelOffset() ?? 6;
                let anchor: ChartPoint;
                if (axis === "x") {
                    switch (pos) {
                        case "start":
                            anchor = { x: coordinate, y: plotRect.y + offset };
                            break;
                        case "center":
                            anchor = { x: coordinate, y: plotRect.y + plotRect.height / 2 };
                            break;
                        case "end":
                        default:
                            anchor = { x: coordinate, y: plotRect.y + plotRect.height - offset };
                            break;
                    }
                } else {
                    switch (pos) {
                        case "start":
                            anchor = { x: plotRect.x + offset, y: coordinate };
                            break;
                        case "center":
                            anchor = { x: plotRect.x + plotRect.width / 2, y: coordinate };
                            break;
                        case "end":
                        default:
                            anchor = { x: plotRect.x + plotRect.width - offset, y: coordinate };
                            break;
                    }
                }

                label = {
                    anchor,
                    formattedText: labelText,
                    labelClass: reg.labelClass(),
                    offset,
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
                formattedValue,
                id: reg.id,
                label,
                layer: reg.layer(),
                opacity: style.opacity,
                semanticValue: reg.value(),
                width: style.width
            });
        }

        // 2. Project Reference Bands
        for (const reg of referenceBands) {
            reg.userClass();
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
            let idxFrom = 0;
            let idxTo = 0;

            if (snap.resolvedType === "category") {
                const baseIndexMap = getOrCreateBaseCategoryIndex(snap.baseDomain);
                const fromStr = String(reg.from());
                const toStr = String(reg.to());
                const bIdxFrom = baseIndexMap.get(fromStr);
                const bIdxTo = baseIndexMap.get(toStr);

                if (bIdxFrom === undefined || bIdxTo === undefined) {
                    continue;
                }

                idxFrom = bIdxFrom;
                idxTo = bIdxTo;

                const minBaseIdx = Math.min(bIdxFrom, bIdxTo);
                const maxBaseIdx = Math.max(bIdxFrom, bIdxTo);
                const vDomain = snap.categoryIndex?.viewportDomain ?? [];
                if (vDomain.length === 0) {
                    continue;
                }

                const firstVKey = vDomain[0];
                const lastVKey = vDomain[vDomain.length - 1];
                const vpMin = baseIndexMap.get(firstVKey);
                const vpMax = baseIndexMap.get(lastVKey);
                if (vpMin === undefined || vpMax === undefined) {
                    continue;
                }

                const minVpIdx = Math.min(vpMin, vpMax);
                const maxVpIdx = Math.max(vpMin, vpMax);

                const visMin = Math.max(minBaseIdx, minVpIdx);
                const visMax = Math.min(maxBaseIdx, maxVpIdx);

                if (visMin > visMax) {
                    continue;
                }

                const firstKey = String(snap.baseDomain[visMin]);
                const lastKey = String(snap.baseDomain[visMax]);
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
            const targetAxis = scene.axes.find(a => a.axis === axis && a.axisId === axisId);

            const formattedFrom = formatCartesianAxisSemanticValue({
                axisScene: targetAxis,
                index: idxFrom,
                value: reg.from(),
                xTimeSpanMs: scene.xTimeSpanMs
            });

            const formattedTo = formatCartesianAxisSemanticValue({
                axisScene: targetAxis,
                index: idxTo,
                value: reg.to(),
                xTimeSpanMs: scene.xTimeSpanMs
            });

            let label: SceneReferenceLabel | undefined;
            const labelText = reg.label();
            const hasTemplate = !!reg.template?.();
            if (labelText || hasTemplate) {
                const pos = reg.labelPosition() ?? "center";
                const offset = reg.labelOffset() ?? 6;
                let anchor: ChartPoint;
                if (axis === "x") {
                    switch (pos) {
                        case "start":
                            anchor = { x: bounds.x + bounds.width / 2, y: bounds.y + offset };
                            break;
                        case "end":
                            anchor = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height - offset };
                            break;
                        case "center":
                        default:
                            anchor = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
                            break;
                    }
                } else {
                    switch (pos) {
                        case "start":
                            anchor = { x: bounds.x + offset, y: bounds.y + bounds.height / 2 };
                            break;
                        case "end":
                            anchor = { x: bounds.x + bounds.width - offset, y: bounds.y + bounds.height / 2 };
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
                    offset,
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
                formattedFrom,
                formattedTo,
                from: reg.from(),
                id: reg.id,
                label,
                layer: reg.layer(),
                to: reg.to()
            });
        }

        // 3. Project Point Annotations
        for (const reg of annotations) {
            reg.userClass();
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
            let xIdx = 0;
            if (xSnap.resolvedType === "category") {
                const geom = coordinateSpace.resolveCategoryByKey(xRef, reg.x(), "viewport");
                if (!geom) {
                    continue;
                }
                px = geom.bandCenter;
                xIdx = geom.baseIndex ?? geom.viewportIndex ?? 0;
            } else {
                const coord = coordinateSpace.mapContinuousValue(xRef, reg.x(), "viewport");
                if (coord === undefined || !Number.isFinite(coord)) {
                    continue;
                }
                px = coord;
            }

            let py: number | undefined;
            let yIdx = 0;
            if (ySnap.resolvedType === "category") {
                const geom = coordinateSpace.resolveCategoryByKey(yRef, reg.y(), "viewport");
                if (!geom) {
                    continue;
                }
                py = geom.bandCenter;
                yIdx = geom.baseIndex ?? geom.viewportIndex ?? 0;
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
            const targetXAxis = scene.axes.find(a => a.axis === "x" && a.axisId === xAxisId);
            const targetYAxis = scene.axes.find(a => a.axis === "y" && a.axisId === yAxisId);

            const formattedX = formatCartesianAxisSemanticValue({
                axisScene: targetXAxis,
                index: xIdx,
                value: reg.x(),
                xTimeSpanMs: scene.xTimeSpanMs
            });
            const formattedY = formatCartesianAxisSemanticValue({
                axisScene: targetYAxis,
                index: yIdx,
                value: reg.y(),
                xTimeSpanMs: scene.xTimeSpanMs
            });

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
                        dy = -12;
                        break;
                }

                const userDx = reg.offsetX() ?? 0;
                const userDy = reg.offsetY() ?? 0;

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
                formattedX,
                formattedY,
                id: reg.id,
                label,
                marker: reg.marker(),
                markerRadius: style.markerRadius,
                markerStrokeWidth: style.markerStrokeWidth,
                point,
                xAxisId,
                xValue: reg.x(),
                yAxisId,
                yValue: reg.y()
            });
        }

        return {
            annotations: projectedAnnotations,
            referenceBands: projectedBands,
            referenceLines: projectedLines
        };
    }
}
