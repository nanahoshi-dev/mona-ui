import { pie } from "d3-shape";
import type { ChartPadding, ChartPoint, ChartRect } from "../../models/chart.models";
import type { ChartLabelMeasurement, ChartPolarLabelPosition } from "../../models/chart-polar.models";
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
import { clamp } from "../utils/number-utils";
import {
    layoutOutsidePolarLabels,
    OUTSIDE_LABEL_ELBOW_LENGTH,
    OUTSIDE_LABEL_HORIZONTAL_LENGTH,
    OUTSIDE_LABEL_RADIAL_GAP
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
        const showLabels = targetSeries.showLabels();
        const labelPosition: ChartPolarLabelPosition = targetSeries.labelPosition ? targetSeries.labelPosition() : "outside";
        const dataResult = preparePolarData(targetSeries, rootData, styleResolver);
        const seriesStyle = styleResolver.resolvePolarSeriesStyle(targetSeries);

        // Reserve outside label gutters if outside labels are enabled
        let leftGutter = 0;
        let rightGutter = 0;

        if (showLabels && labelPosition === "outside" && dataResult.hasRenderableData) {
            const connectorSpace =
                OUTSIDE_LABEL_RADIAL_GAP +
                OUTSIDE_LABEL_ELBOW_LENGTH +
                OUTSIDE_LABEL_HORIZONTAL_LENGTH +
                8;

            let maxLeftWidth = 48;
            let maxRightWidth = 48;

            if (measurements && measurements.size > 0) {
                for (const d of dataResult.visibleData) {
                    const m = measurements.get(d.sliceId);
                    if (m) {
                        maxLeftWidth = Math.max(maxLeftWidth, m.width);
                        maxRightWidth = Math.max(maxRightWidth, m.width);
                    }
                }
            }

            const maxAllowedGutter = plotWidth * 0.3;
            leftGutter = clamp(maxLeftWidth + connectorSpace, 72, Math.max(72, maxAllowedGutter));
            rightGutter = clamp(maxRightWidth + connectorSpace, 72, Math.max(72, maxAllowedGutter));
        }

        const usableWidth = Math.max(0, plotWidth - leftGutter - rightGutter);
        const availableRadius = Math.max(0, Math.min(usableWidth, plotHeight) / 2);

        center = {
            x: plotRect.x + leftGutter + usableWidth / 2,
            y: plotRect.y + plotHeight / 2
        };

        const outerRatio = clamp(targetSeries.outerRadiusRatio(), 0.1, 1);
        const outerRadius = Math.max(0, availableRadius * outerRatio);

        const innerRadiusRatio =
            targetSeries.type === "donut"
                ? clamp((targetSeries as ChartDonutSeriesRegistration).innerRadiusRatio(), 0, 0.95)
                : 0;
        const innerRadius = outerRadius * innerRadiusRatio;

        const spanInfo = normalizeAngleSpan(targetSeries.startAngle(), targetSeries.endAngle());
        const padDeg = clamp(targetSeries.padAngle(), 0, 45);
        const padRad = degreesToRadians(padDeg);

        const requestedCorner = targetSeries.cornerRadius() ?? 0;
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
                    insideLabelPoint,
                    labelPoint: insideLabelPoint,
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
                        outerRadius,
                        padAngle: arc.padAngle,
                        startAngle: arc.startAngle
                    },
                    category: d.category,
                    color: d.color,
                    datum: d.datum,
                    formattedCategory: d.formattedCategory,
                    formattedPercentage: formattedPct,
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
                    measurements,
                    outerRadius,
                    plotRect,
                    slices
                });

                for (const s of slices) {
                    s.label = labelMap.get(s.sliceId);
                }
            } else if (showLabels && labelPosition === "inside") {
                const minAngleDeg = targetSeries.minLabelAngle();
                for (const s of slices) {
                    const spanDeg = radiansToDegrees(s.endAngle - s.startAngle);
                    if (spanDeg < minAngleDeg) {
                        s.label = undefined;
                    }
                }
            }
        }

        const legendItems: ChartLegendItem[] = dataResult.allData.map(d => ({
            color: d.color,
            dataIndex: d.dataIndex,
            datum: d.datum,
            itemId: d.sliceId,
            kind: "datum",
            name: d.formattedCategory,
            percentage: dataResult.visibleTotal > 0 ? d.value / dataResult.visibleTotal : 0,
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
