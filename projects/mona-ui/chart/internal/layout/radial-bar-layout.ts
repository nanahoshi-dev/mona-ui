import type { ChartPoint } from "../../models/chart.models";
import type { ChartRadialBarSeriesRegistration } from "../context/chart-registration-context";
import { RadialBarDataProcessor } from "../data/radial-bar-data";
import type {
    ChartRadialBarSeriesScene,
    PolarArcChartScene,
    SceneRadialArcMark,
    SceneRadialTrack
} from "../scene/polar-arc-scene";
import type { ChartInteractionBucket, SceneHitTarget } from "../scene/scene-geometry";
import type { ChartStyleResolver } from "../style/chart-style-resolver";
import { normalizeAngleSpan } from "../utils/angle-utils";
import { RadialBarHitIndex } from "../interaction/radial-bar-hit-index";
import {
    computeOuterRadiusWithStroke,
    computeRadialRingBands
} from "./radial-geometry-utils";
import { normalizeRatio } from "../utils/number-utils";

export interface RadialBarLayoutOptions {
    readonly containerHeight: number;
    readonly containerWidth: number;
    readonly rootData: readonly unknown[];
    readonly series: ChartRadialBarSeriesRegistration;
    readonly styleResolver: ChartStyleResolver;
    readonly warnedDiagnosticSignatures?: Set<string>;
}

export class RadialBarLayout {
    public static computeScene(options: RadialBarLayoutOptions): PolarArcChartScene {
        const {
            containerHeight,
            containerWidth,
            rootData,
            series,
            styleResolver,
            warnedDiagnosticSignatures
        } = options;

        const center: ChartPoint = {
            x: containerWidth / 2,
            y: containerHeight / 2
        };

        const isVisible = series.visible();
        const seriesStyle = styleResolver.resolveRadialArcSeriesStyle(series);

        const maxAvailableRadius = Math.max(0, Math.min(containerWidth, containerHeight) / 2);
        const outerRadius = computeOuterRadiusWithStroke(
            maxAvailableRadius,
            series.outerRadiusRatio(),
            seriesStyle.strokeWidth
        );

        const innerRatio = normalizeRatio(series.innerRadiusRatio(), 0.2, 0, 0.99);
        const innerRadius = outerRadius * innerRatio;

        const spanInfo = normalizeAngleSpan(series.startAngle(), series.endAngle());
        const totalSpanRad = spanInfo.endAngleRad - spanInfo.startAngleRad;

        const preparedData = RadialBarDataProcessor.process({
            categoryField: series.categoryField(),
            categoryFormatter: series.categoryFormatter?.(),
            colorField: series.colorField?.(),
            colors: series.colors?.(),
            data: series.data(),
            isDatumVisible: (itemId: string) => series.isDatumVisible(itemId),
            keyField: series.keyField?.(),
            max: series.max?.(),
            min: series.min?.(),
            rootData,
            seriesElement: series.element?.nativeElement,
            seriesField: series.field(),
            seriesId: series.id,
            seriesName: series.name(),
            styleResolver,
            valueFormatter: series.valueFormatter?.(),
            warnedDiagnosticSignatures
        });

        const showTrack = series.showTrack();
        const fillMode = series.fillMode?.() ?? "solid";

        const marks: SceneRadialArcMark[] = [];
        const tracks: SceneRadialTrack[] = [];
        const hitTargets: SceneHitTarget[] = [];
        const interactionBuckets: ChartInteractionBucket[] = [];

        const N = preparedData.visibleItems.length;
        const ringBandsResult = computeRadialRingBands(
            innerRadius,
            outerRadius,
            N,
            series.barGap(),
            series.barThickness?.()
        );

        if (isVisible) {
            for (let i = 0; i < N; i++) {
                const datum = preparedData.visibleItems[i];
                const band = ringBandsResult.bands[i];
                const ringOuter = band ? band.outerRadius : outerRadius;
                const ringInner = band ? band.innerRadius : innerRadius;
                const thickness = ringOuter - ringInner;

                if (showTrack) {
                    tracks.push({
                        color: seriesStyle.trackColor,
                        endAngle: spanInfo.endAngleRad,
                        innerRadius: ringInner,
                        opacity: seriesStyle.trackOpacity,
                        outerRadius: ringOuter,
                        startAngle: spanInfo.startAngleRad
                    });
                }

                const valueSpanRad = totalSpanRad * datum.normalizedValue;
                const markEndAngle = spanInfo.startAngleRad + valueSpanRad;
                const cornerRadius = series.cornerRadius?.() !== undefined
                    ? Math.min(series.cornerRadius()!, thickness / 2)
                    : thickness / 2;

                const mark: SceneRadialArcMark = {
                    animationKey: datum.animationKey,
                    category: datum.category,
                    color: datum.color,
                    cornerRadius,
                    dataIndex: datum.dataIndex,
                    datum: datum.datum,
                    endAngle: markEndAngle,
                    formattedCategory: datum.formattedCategory,
                    formattedValue: datum.formattedValue,
                    innerRadius: ringInner,
                    itemId: datum.itemId,
                    normalizedValue: datum.normalizedValue,
                    outerRadius: ringOuter,
                    padAngle: 0,
                    rawValue: datum.rawValue,
                    startAngle: spanInfo.startAngleRad,
                    visible: true
                };

                marks.push(mark);

                const target: SceneHitTarget = {
                    animationKey: datum.animationKey,
                    arc: {
                        center,
                        cornerRadius,
                        endAngle: markEndAngle,
                        innerRadius: ringInner,
                        outerRadius: ringOuter,
                        padAngle: 0,
                        startAngle: spanInfo.startAngleRad
                    },
                    color: datum.color,
                    dataIndex: datum.dataIndex,
                    datum: datum.datum,
                    formattedCategory: datum.formattedCategory,
                    formattedValue: datum.formattedValue,
                    index: datum.dataIndex,
                    itemId: datum.itemId,
                    seriesId: series.id,
                    seriesName: series.name(),
                    seriesType: "radialBar",
                    value: datum.rawValue,
                    valueKind: "scalar",
                    xKey: datum.itemId,
                    xValue: datum.category,
                    yValue: datum.rawValue
                };

                hitTargets.push(target);

                const midAngle = (spanInfo.startAngleRad + markEndAngle) / 2;
                const midRadius = (ringInner + ringOuter) / 2;
                interactionBuckets.push({
                    anchor: {
                        x: center.x + Math.sin(midAngle) * midRadius,
                        y: center.y - Math.cos(midAngle) * midRadius
                    },
                    hits: [target],
                    order: i,
                    xKey: datum.itemId,
                    xValue: datum.category
                });
            }
        }

        const seriesScene: ChartRadialBarSeriesScene = {
            barGap: ringBandsResult.gap,
            fillMode,
            id: series.id,
            marks,
            name: series.name(),
            style: seriesStyle,
            tracks,
            type: "radialBar"
        };

        const legendItems = preparedData.allItems.map(item => ({
            color: item.color,
            dataIndex: item.dataIndex,
            datum: item.datum,
            itemId: item.itemId,
            kind: "datum" as const,
            name: item.formattedCategory,
            seriesId: series.id,
            seriesType: "radialBar" as const,
            value: item.rawValue,
            visible: isVisible && item.visible
        }));

        const hasRenderableData = isVisible && (
            marks.some(m => m.normalizedValue !== undefined && m.normalizedValue > 0) || (showTrack && marks.length > 0)
        );

        const hitIndex = new RadialBarHitIndex(center, hitTargets);

        return {
            arcMode: "radialBar",
            center,
            coordinateSystem: "polar",
            hasRenderableData,
            height: containerHeight,
            hitIndex,
            hitTargets,
            innerRadius,
            interactionBuckets,
            legendItems,
            outerRadius,
            plotRect: { height: containerHeight, width: containerWidth, x: 0, y: 0 },
            polarKind: "arc",
            series: [seriesScene],
            width: containerWidth
        };
    }
}
