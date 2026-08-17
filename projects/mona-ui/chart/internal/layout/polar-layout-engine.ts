import { pie } from "d3-shape";
import type { ChartPadding, ChartPoint, ChartRect } from "../../models/chart.models";
import type { ChartLabelMeasurement, ChartPolarLabelContent, ChartPolarLabelPosition } from "../../models/chart-polar.models";
import type { ChartLegendItem } from "../../models/chart-series.models";
import type {
    ChartDonutSeriesRegistration,
    ChartPolarSeriesRegistration
} from "../context/chart-registration-context";
import { formatPolarPercentage, formatPolarValue, preparePolarData, type PolarDatum } from "../data/polar-data";
import type { PolarChartScene } from "../scene/chart-scene";
import type { ChartPolarSeriesScene, ScenePolarSlice } from "../scene/polar-scene";
import type { ChartInteractionBucket, SceneHitTarget } from "../scene/scene-geometry";
import type { ChartStyleResolver } from "../style/chart-style-resolver";
import { degreesToRadians, normalizeAngleSpan, radiansToDegrees } from "../utils/angle-utils";
import { clamp, normalizeFiniteNumber, normalizeNonNegativeNumber, normalizeRatio } from "../utils/number-utils";
import {
    formatPolarLabelText,
    layoutOutsidePolarLabels,
    OUTSIDE_LABEL_HORIZONTAL_LENGTH,
    OUTSIDE_LABEL_RADIAL_SEGMENT_LENGTH
} from "./polar-label-layout";

export interface PolarLayoutOptions {
    containerHeight: number;
    containerWidth: number;
    measurements?: ReadonlyMap<string, ChartLabelMeasurement>;
    rootData: readonly unknown[];
    series: readonly ChartPolarSeriesRegistration[];
    styleResolver: ChartStyleResolver;
}

export class PolarLayoutEngine {
    public static computeScene(options: PolarLayoutOptions): PolarChartScene {
        const { containerHeight, containerWidth, measurements, rootData, series, styleResolver } = options;

        const padding: ChartPadding = {
            bottom: 16,
            left: 16,
            right: 16,
            top: 16
        };

        const plotWidth = Math.max(0, containerWidth - padding.left - padding.right);
        const plotHeight = Math.max(0, containerHeight - padding.top - padding.bottom);
        const plotRect: ChartRect = {
            height: plotHeight,
            width: plotWidth,
            x: padding.left,
            y: padding.top
        };

        let center: ChartPoint = {
            x: plotRect.x + plotWidth / 2,
            y: plotRect.y + plotHeight / 2
        };

        if (series.length === 0 || series.length > 1 || plotWidth <= 0 || plotHeight <= 0) {
            return {
                center,
                coordinateSystem: "polar",
                hasRenderableData: false,
                height: containerHeight,
                hitTargets: [],
                interactionBuckets: [],
                legendItems: [],
                plotRect,
                series: [],
                width: containerWidth
            };
        }

        const targetSeries = series[0];
        const showLabels = Boolean(targetSeries.showLabels());
        const labelPosition: ChartPolarLabelPosition = targetSeries.labelPosition ? targetSeries.labelPosition() : "outside";
        const labelContent: ChartPolarLabelContent = targetSeries.labelContent ? targetSeries.labelContent() : "percentage";
        const fillMode = targetSeries.fillMode ? targetSeries.fillMode() : "solid";

        const dataResult = preparePolarData(targetSeries, rootData, styleResolver);
        const seriesStyle = styleResolver.resolvePolarSeriesStyle(targetSeries);

        const strokeWidth = normalizeNonNegativeNumber(seriesStyle.strokeWidth, 1);
        const strokeInset = strokeWidth > 0 ? strokeWidth / 2 : 0;

        const connectorSpace = OUTSIDE_LABEL_RADIAL_SEGMENT_LENGTH + OUTSIDE_LABEL_HORIZONTAL_LENGTH + 8;

        // Deduct vertical connector extent from available vertical radius
        const verticalAvailableRadius =
            showLabels && labelPosition === "outside" && dataResult.hasRenderableData
                ? Math.max(0, plotHeight / 2 - connectorSpace)
                : Math.max(0, plotHeight / 2);

        // Reserve outside label gutters if outside labels are enabled
        let leftGutter = 0;
        let rightGutter = 0;

        if (showLabels && labelPosition === "outside" && dataResult.hasRenderableData) {
            let maxLeftWidth = 32;
            let maxRightWidth = 32;
            let hasLeft = false;
            let hasRight = false;

            const visibleCount = dataResult.visibleData.length;
            const spanInfo = normalizeAngleSpan(
                normalizeFiniteNumber(targetSeries.startAngle(), 0),
                normalizeFiniteNumber(targetSeries.endAngle(), 360)
            );

            // Compute approximate cumulative mid-angles to classify slices to left vs right
            let runningSum = 0;
            for (let i = 0; i < visibleCount; i++) {
                const d = dataResult.visibleData[i];
                const sliceRatio = dataResult.visibleTotal > 0 ? d.value / dataResult.visibleTotal : 1 / visibleCount;
                const midAngleDeg = spanInfo.startDegrees + (runningSum + sliceRatio / 2) * spanInfo.spanDegrees;
                runningSum += sliceRatio;

                const midAngleRad = degreesToRadians(midAngleDeg);
                const isRight = Math.sin(midAngleRad) >= 0;

                const m = measurements?.get(d.sliceId);
                const defaultText = formatPolarLabelText(d, labelContent);
                const estimatedWidth = m?.width ?? (defaultText ? Math.max(24, defaultText.length * 7.5 + 8) : 48);

                if (isRight) {
                    hasRight = true;
                    maxRightWidth = Math.max(maxRightWidth, estimatedWidth);
                } else {
                    hasLeft = true;
                    maxLeftWidth = Math.max(maxLeftWidth, estimatedWidth);
                }
            }

            const maxAllowedGutter = plotWidth * 0.35;
            leftGutter = hasLeft ? clamp(maxLeftWidth + connectorSpace, 48, Math.max(48, maxAllowedGutter)) : 16;
            rightGutter = hasRight ? clamp(maxRightWidth + connectorSpace, 48, Math.max(48, maxAllowedGutter)) : 16;
        }

        const usableWidth = Math.max(0, plotWidth - leftGutter - rightGutter);
        const horizontalAvailableRadius = Math.max(0, usableWidth / 2);
        const availableRadius = Math.min(horizontalAvailableRadius, verticalAvailableRadius);

        center = {
            x: plotRect.x + leftGutter + usableWidth / 2,
            y: plotRect.y + plotHeight / 2
        };

        const outerRatio = normalizeRatio(targetSeries.outerRadiusRatio(), 0.9, 0.1, 1);
        const requestedOuterRadius = Math.max(0, availableRadius * outerRatio);
        const outerRadius = Math.max(0, requestedOuterRadius - strokeInset);

        const innerRadiusRatio =
            targetSeries.type === "donut"
                ? normalizeRatio((targetSeries as ChartDonutSeriesRegistration).innerRadiusRatio(), 0.6, 0, 0.95)
                : 0;
        const innerRadius = Math.min(outerRadius, outerRadius * innerRadiusRatio);

        const spanInfo = normalizeAngleSpan(
            normalizeFiniteNumber(targetSeries.startAngle(), 0),
            normalizeFiniteNumber(targetSeries.endAngle(), 360)
        );

        // Safe padding calculation: cap total padding to max 35% of total angular span
        const visibleSliceCount = dataResult.visibleData.length;
        const MAX_TOTAL_PADDING_RATIO = 0.35;
        const spanRad = degreesToRadians(spanInfo.spanDegrees);
        const maxPadPerSliceRad = visibleSliceCount > 1 ? (spanRad * MAX_TOTAL_PADDING_RATIO) / visibleSliceCount : 0;
        const requestedPadRad = degreesToRadians(normalizeNonNegativeNumber(targetSeries.padAngle(), 0));
        const padRad = visibleSliceCount > 1 ? Math.min(requestedPadRad, maxPadPerSliceRad) : 0;

        const requestedCorner = normalizeNonNegativeNumber(targetSeries.cornerRadius?.(), 0);
        const maxCorner = Math.max(0, (outerRadius - innerRadius) / 2);
        const cornerRadius = clamp(requestedCorner, 0, maxCorner);

        const slices: ScenePolarSlice[] = [];
        const hitTargets: SceneHitTarget[] = [];
        const interactionBuckets: ChartInteractionBucket[] = [];

        if (dataResult.hasRenderableData && dataResult.visibleData.length > 0) {
            const pieGen = pie<PolarDatum>()
                .value(d => d.value)
                .sort(null)
                .sortValues(null)
                .startAngle(spanInfo.startAngleRad)
                .endAngle(spanInfo.endAngleRad)
                .padAngle(padRad);

            const pieArcs = pieGen(dataResult.visibleData as PolarDatum[]);
            const labelRadius = innerRadius + (outerRadius - innerRadius) * 0.55;

            for (const arc of pieArcs) {
                const d = arc.data;
                const midAngle = (arc.startAngle + arc.endAngle) / 2;

                const midRadius = (innerRadius + outerRadius) / 2;
                const centroid: ChartPoint = {
                    x: center.x + Math.sin(midAngle) * midRadius,
                    y: center.y - Math.cos(midAngle) * midRadius
                };

                const insideLabelPoint: ChartPoint = {
                    x: center.x + Math.sin(midAngle) * labelRadius,
                    y: center.y - Math.cos(midAngle) * labelRadius
                };

                const ratio = dataResult.visibleTotal > 0 ? d.value / dataResult.visibleTotal : 0;
                const formattedPct = formatPolarPercentage(ratio);

                const insideLabelBackgroundColor = d.color;

                const slice: ScenePolarSlice = {
                    category: d.category,
                    centroid,
                    color: d.color,
                    cornerRadius,
                    dataIndex: d.dataIndex,
                    datum: d.datum,
                    endAngle: arc.endAngle,
                    formattedCategory: d.formattedCategory,
                    formattedPercentage: formattedPct,
                    formattedValue: d.formattedValue,
                    innerRadius,
                    insideLabelBackgroundColor,
                    insideLabelPoint,
                    outerRadius,
                    padAngle: arc.padAngle,
                    percentage: ratio,
                    sliceId: d.sliceId,
                    startAngle: arc.startAngle,
                    value: d.value,
                    visible: true
                };
                slices.push(slice);

                const hitTarget: SceneHitTarget = {
                    arc: {
                        center,
                        endAngle: arc.endAngle,
                        innerRadius,
                        outerRadius: outerRadius + strokeInset,
                        padAngle: visibleSliceCount > 1 ? arc.padAngle : 0,
                        startAngle: arc.startAngle
                    },
                    category: d.category,
                    color: d.color,
                    datum: d.datum,
                    formattedCategory: d.formattedCategory,
                    formattedPercentage: formattedPct,
                    formattedValue: d.formattedValue,
                    index: d.dataIndex,
                    percentage: ratio,
                    point: centroid,
                    radius: (outerRadius - innerRadius) / 2,
                    seriesId: targetSeries.id,
                    seriesName: targetSeries.name(),
                    seriesType: targetSeries.type,
                    sliceId: d.sliceId,
                    xKey: d.sliceId,
                    xValue: d.category,
                    yValue: d.value
                };
                hitTargets.push(hitTarget);

                interactionBuckets.push({
                    centerX: centroid.x,
                    hits: [hitTarget],
                    xKey: d.sliceId,
                    xValue: d.category
                });
            }

            // If outside labels are enabled, layout outside labels and assign to slices
            if (showLabels && labelPosition === "outside") {
                const labelMap = layoutOutsidePolarLabels({
                    center,
                    labelContent,
                    measurements,
                    outerRadius,
                    plotRect,
                    slices,
                    strokeWidth
                });

                for (const s of slices) {
                    s.label = labelMap.get(s.sliceId);
                }
            } else if (showLabels && labelPosition === "inside") {
                const minAngleDeg = normalizeNonNegativeNumber(targetSeries.minLabelAngle?.(), 12);
                for (const s of slices) {
                    const spanDeg = radiansToDegrees(s.endAngle - s.startAngle);
                    if (spanDeg < minAngleDeg) {
                        s.label = undefined;
                    }
                }
            }
        }

        // Legend percentage uses source total across all valid slices (stable under visibility toggles)
        const legendItems: ChartLegendItem[] = dataResult.allData.map(d => ({
            color: d.color,
            dataIndex: d.dataIndex,
            datum: d.datum,
            itemId: d.sliceId,
            kind: "datum",
            name: d.formattedCategory,
            percentage: dataResult.total > 0 ? d.value / dataResult.total : 0,
            seriesId: targetSeries.id,
            seriesType: targetSeries.type,
            value: d.value,
            visible: d.visible
        }));

        const formattedTotal = targetSeries.valueFormatter()
            ? targetSeries.valueFormatter()!(dataResult.visibleTotal, -1)
            : formatPolarValue(dataResult.visibleTotal);

        const polarSeriesScene: ChartPolarSeriesScene = {
            center,
            cornerRadius,
            fillMode,
            formattedTotal,
            id: targetSeries.id,
            innerRadius,
            labelPosition,
            name: targetSeries.name(),
            outerRadius,
            padAngle: padRad,
            showLabels,
            slices,
            style: seriesStyle,
            total: dataResult.visibleTotal,
            type: targetSeries.type
        };

        return {
            center,
            coordinateSystem: "polar",
            hasRenderableData: dataResult.hasRenderableData,
            height: containerHeight,
            hitTargets,
            interactionBuckets,
            legendItems,
            plotRect,
            series: [polarSeriesScene],
            width: containerWidth
        };
    }
}
