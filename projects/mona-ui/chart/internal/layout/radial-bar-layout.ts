import type { ChartPoint } from "../../models/chart.models";
import type { ChartRadialBarSeriesRegistration } from "../context/chart-registration-context";
import { RadialBarDataProcessor } from "../data/radial-bar-data";
import type {
    ChartRadialArcSeriesStyle,
    ChartRadialBarSeriesScene,
    PolarArcChartScene,
    SceneRadialArcMark,
    SceneRadialTrack
} from "../scene/polar-arc-scene";
import type { ChartInteractionBucket, SceneHitTarget } from "../scene/scene-geometry";
import type { ChartStyleResolver } from "../style/chart-style-resolver";
import { normalizeAngleSpan } from "../utils/angle-utils";
import { RadialBarHitIndex } from "../interaction/radial-bar-hit-index";

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

        const maxAvailableRadius = Math.max(0, Math.min(containerWidth, containerHeight) / 2);

        const outerRatio = Math.max(0.05, Math.min(1, series.outerRadiusRatio()));
        const innerRatio = Math.max(0, Math.min(outerRatio - 0.01, series.innerRadiusRatio()));

        const outerRadius = maxAvailableRadius * outerRatio;
        const innerRadius = maxAvailableRadius * innerRatio;
        const availableBand = Math.max(0, outerRadius - innerRadius);

        const spanInfo = normalizeAngleSpan(series.startAngle(), series.endAngle());

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

        const N = preparedData.visibleItems.length;
        let barGap = Math.max(0, series.barGap());
        let thickness: number;

        const explicitThickness = series.barThickness?.();
        if (explicitThickness !== undefined && explicitThickness > 0) {
            thickness = Math.max(1, Math.min(explicitThickness, availableBand / Math.max(1, N)));
        } else if (N > 0) {
            const rawThickness = (availableBand - barGap * Math.max(0, N - 1)) / N;
            if (rawThickness < 1 && N > 1) {
                barGap = 0;
                thickness = Math.max(1, availableBand / N);
            } else {
                thickness = Math.max(1, rawThickness);
            }
        } else {
            thickness = Math.max(1, availableBand);
        }

        const showTrack = series.showTrack();
        const strokeColor = series.strokeColor();
        const strokeWidth = series.strokeWidth?.() ?? 0;
        const fillMode = series.fillMode?.() ?? "solid";
        const fillOpacity = series.fillOpacity?.() ?? 1;
        const trackColor = series.trackColor() || styleResolver.resolveCssVariable("--mona-chart-radial-track-color") || "#e2e8f0";
        const trackOpacity = series.trackOpacity?.() ?? 0.15;

        const marks: SceneRadialArcMark[] = [];
        const tracks: SceneRadialTrack[] = [];
        const hitTargets: SceneHitTarget[] = [];
        const interactionBuckets: ChartInteractionBucket[] = [];

        const totalSpanRad = spanInfo.endAngleRad - spanInfo.startAngleRad;

        for (let i = 0; i < N; i++) {
            const datum = preparedData.visibleItems[i];
            const ringOuter = Math.max(0, outerRadius - i * (thickness + barGap));
            const ringInner = Math.max(0, ringOuter - thickness);

            if (showTrack) {
                tracks.push({
                    color: trackColor,
                    endAngle: spanInfo.endAngleRad,
                    innerRadius: ringInner,
                    opacity: trackOpacity,
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

            // Hit target (only if value arc has positive span or value is > 0)
            const target: SceneHitTarget = {
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

            // Compute anchor on the arc mid-point for bucket
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

        const seriesStyle: ChartRadialArcSeriesStyle = {
            fillOpacity,
            strokeColor,
            strokeSource: strokeColor ? "explicit" : "default",
            strokeWidth,
            trackColor,
            trackOpacity
        };

        const seriesScene: ChartRadialBarSeriesScene = {
            barGap,
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
            visible: item.visible
        }));

        const hasRenderableData = marks.some(m => m.normalizedValue !== undefined && m.normalizedValue > 0) || (showTrack && marks.length > 0);

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
