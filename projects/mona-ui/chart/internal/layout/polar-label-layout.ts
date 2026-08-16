import type { ChartPoint, ChartRect } from "../../models/chart.models";
import type { ChartLabelMeasurement, ChartPolarLabelSide } from "../../models/chart-polar.models";
import type { ScenePolarLabel, ScenePolarSlice } from "../scene/polar-scene";

export const OUTSIDE_LABEL_RADIAL_GAP = 8;
export const OUTSIDE_LABEL_ELBOW_LENGTH = 12;
export const OUTSIDE_LABEL_HORIZONTAL_LENGTH = 18;
export const DEFAULT_LABEL_HEIGHT = 18;
export const DEFAULT_LABEL_WIDTH = 48;
export const MIN_LABEL_VERTICAL_GAP = 4;

export interface PolarLabelLayoutOptions {
    center: ChartPoint;
    measurements?: ReadonlyMap<string, ChartLabelMeasurement>;
    outerRadius: number;
    plotRect: ChartRect;
    slices: readonly ScenePolarSlice[];
}

interface RawLabelCandidate {
    arcAnchor: ChartPoint;
    elbow: ChartPoint;
    height: number;
    index: number;
    lineEnd: ChartPoint;
    midAngle: number;
    naturalPosition: ChartPoint;
    side: ChartPolarLabelSide;
    slice: ScenePolarSlice;
    width: number;
}

export function layoutOutsidePolarLabels(
    options: PolarLabelLayoutOptions
): Map<string, ScenePolarLabel> {
    const { center, measurements, outerRadius, plotRect, slices } = options;
    const result = new Map<string, ScenePolarLabel>();

    if (!slices || slices.length === 0 || outerRadius <= 0) {
        return result;
    }

    const arcAnchorRadius = outerRadius + OUTSIDE_LABEL_RADIAL_GAP;
    const elbowRadius = arcAnchorRadius + OUTSIDE_LABEL_ELBOW_LENGTH;

    const candidates: RawLabelCandidate[] = [];

    for (let i = 0; i < slices.length; i++) {
        const slice = slices[i];
        if (!slice.visible) {
            continue;
        }

        const midAngle = (slice.startAngle + slice.endAngle) / 2;
        const side: ChartPolarLabelSide = Math.sin(midAngle) >= 0 ? "right" : "left";

        const arcAnchor: ChartPoint = {
            x: center.x + Math.sin(midAngle) * arcAnchorRadius,
            y: center.y - Math.cos(midAngle) * arcAnchorRadius
        };

        const elbow: ChartPoint = {
            x: center.x + Math.sin(midAngle) * elbowRadius,
            y: center.y - Math.cos(midAngle) * elbowRadius
        };

        const lineEndX =
            elbow.x +
            (side === "right"
                ? OUTSIDE_LABEL_HORIZONTAL_LENGTH
                : -OUTSIDE_LABEL_HORIZONTAL_LENGTH);

        const lineEnd: ChartPoint = {
            x: lineEndX,
            y: elbow.y
        };

        const measured = measurements?.get(slice.sliceId);
        const height = measured?.height ?? DEFAULT_LABEL_HEIGHT;
        const width =
            measured?.width ??
            (slice.formattedPercentage
                ? Math.max(24, slice.formattedPercentage.length * 7)
                : DEFAULT_LABEL_WIDTH);

        candidates.push({
            arcAnchor,
            elbow,
            height,
            index: i,
            lineEnd,
            midAngle,
            naturalPosition: { x: lineEnd.x, y: lineEnd.y },
            side,
            slice,
            width
        });
    }

    const leftCandidates = candidates.filter(c => c.side === "left");
    const rightCandidates = candidates.filter(c => c.side === "right");

    const topBound = plotRect.y + 8;
    const bottomBound = plotRect.y + plotRect.height - 8;
    const availableHeight = Math.max(0, bottomBound - topBound);

    layoutHemisphere(leftCandidates, topBound, bottomBound, availableHeight, result);
    layoutHemisphere(rightCandidates, topBound, bottomBound, availableHeight, result);

    return result;
}

function layoutHemisphere(
    candidates: RawLabelCandidate[],
    topBound: number,
    bottomBound: number,
    availableHeight: number,
    result: Map<string, ScenePolarLabel>
): void {
    if (candidates.length === 0) {
        return;
    }

    // Sort by natural vertical position
    candidates.sort((a, b) => a.naturalPosition.y - b.naturalPosition.y);

    // Filter/suppress smallest slices if total required height exceeds availableHeight
    const activeCandidates = [...candidates];
    while (activeCandidates.length > 0) {
        const totalRequiredHeight =
            activeCandidates.reduce((sum, c) => sum + c.height, 0) +
            (activeCandidates.length - 1) * MIN_LABEL_VERTICAL_GAP;

        if (totalRequiredHeight <= availableHeight || activeCandidates.length === 1) {
            break;
        }

        // Find candidate with smallest slice value/percentage and suppress
        let smallestIdx = 0;
        let smallestVal = activeCandidates[0].slice.value;
        for (let i = 1; i < activeCandidates.length; i++) {
            if (activeCandidates[i].slice.value < smallestVal) {
                smallestVal = activeCandidates[i].slice.value;
                smallestIdx = i;
            }
        }

        const [suppressed] = activeCandidates.splice(smallestIdx, 1);
        result.set(suppressed.slice.sliceId, {
            arcAnchor: suppressed.arcAnchor,
            elbow: suppressed.elbow,
            heightEstimate: suppressed.height,
            lineEnd: suppressed.lineEnd,
            naturalPosition: suppressed.naturalPosition,
            position: suppressed.naturalPosition,
            side: suppressed.side,
            visible: false,
            widthEstimate: suppressed.width
        });
    }

    if (activeCandidates.length === 0) {
        return;
    }

    // Re-sort remaining active candidates by natural Y to guarantee monotonic non-crossing order
    activeCandidates.sort((a, b) => a.naturalPosition.y - b.naturalPosition.y);

    const positionsY: number[] = new Array(activeCandidates.length);

    // Forward pass
    for (let i = 0; i < activeCandidates.length; i++) {
        const curr = activeCandidates[i];
        if (i === 0) {
            positionsY[i] = Math.max(curr.naturalPosition.y, topBound + curr.height / 2);
        } else {
            const prev = activeCandidates[i - 1];
            const requiredDist = prev.height / 2 + curr.height / 2 + MIN_LABEL_VERTICAL_GAP;
            positionsY[i] = Math.max(curr.naturalPosition.y, positionsY[i - 1] + requiredDist);
        }
    }

    // Backward pass
    const lastIdx = activeCandidates.length - 1;
    if (positionsY[lastIdx] + activeCandidates[lastIdx].height / 2 > bottomBound) {
        positionsY[lastIdx] = bottomBound - activeCandidates[lastIdx].height / 2;

        for (let i = lastIdx - 1; i >= 0; i--) {
            const curr = activeCandidates[i];
            const next = activeCandidates[i + 1];
            const requiredDist = curr.height / 2 + next.height / 2 + MIN_LABEL_VERTICAL_GAP;
            positionsY[i] = Math.min(positionsY[i], positionsY[i + 1] - requiredDist);
        }
    }

    // Final clamp to topBound and adjust down if needed
    if (positionsY[0] - activeCandidates[0].height / 2 < topBound) {
        positionsY[0] = topBound + activeCandidates[0].height / 2;
        for (let i = 1; i < activeCandidates.length; i++) {
            const prev = activeCandidates[i - 1];
            const curr = activeCandidates[i];
            const requiredDist = prev.height / 2 + curr.height / 2 + MIN_LABEL_VERTICAL_GAP;
            positionsY[i] = Math.max(positionsY[i], positionsY[i - 1] + requiredDist);
        }
    }

    // Build final ScenePolarLabel for active candidates
    for (let i = 0; i < activeCandidates.length; i++) {
        const c = activeCandidates[i];
        const finalY = positionsY[i];

        const lineEnd: ChartPoint = {
            x: c.lineEnd.x,
            y: finalY
        };

        const labelPosition: ChartPoint = {
            x: c.side === "right" ? lineEnd.x + 4 : lineEnd.x - 4,
            y: finalY
        };

        result.set(c.slice.sliceId, {
            arcAnchor: c.arcAnchor,
            elbow: c.elbow,
            heightEstimate: c.height,
            lineEnd,
            naturalPosition: c.naturalPosition,
            position: labelPosition,
            side: c.side,
            visible: true,
            widthEstimate: c.width
        });
    }
}
