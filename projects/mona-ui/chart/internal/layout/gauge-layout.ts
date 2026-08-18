import type { ChartPoint } from "../../models/chart.models";
import type { ChartGaugeSeriesRegistration } from "../context/chart-registration-context";
import { GaugeDataProcessor } from "../data/gauge-data";
import type {
    ChartGaugeSeriesScene,
    ChartGaugeSeriesStyle,
    PolarArcChartScene,
    SceneGaugeNeedle,
    SceneGaugeValue,
    SceneRadialTrack
} from "../scene/polar-arc-scene";
import type { ChartInteractionBucket, SceneHitTarget } from "../scene/scene-geometry";
import type { ChartStyleResolver } from "../style/chart-style-resolver";
import { normalizeAngleSpan } from "../utils/angle-utils";
import { GaugeHitIndex } from "../interaction/gauge-hit-index";

export interface GaugeLayoutOptions {
    readonly containerHeight: number;
    readonly containerWidth: number;
    readonly rootData: readonly unknown[];
    readonly series: ChartGaugeSeriesRegistration;
    readonly styleResolver: ChartStyleResolver;
    readonly warnedDiagnosticSignatures?: Set<string>;
}

export class GaugeLayout {
    public static computeScene(options: GaugeLayoutOptions): PolarArcChartScene {
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
        const outerRadius = maxAvailableRadius * outerRatio;

        const innerRatio = Math.max(0, Math.min(0.99, series.innerRadiusRatio()));
        const innerRadius = outerRadius * innerRatio;

        const spanInfo = normalizeAngleSpan(series.startAngle(), series.endAngle());
        const totalSpanRad = spanInfo.endAngleRad - spanInfo.startAngleRad;

        const preparedData = GaugeDataProcessor.process({
            data: series.data(),
            explicitValue: series.value?.(),
            keyField: series.keyField?.(),
            max: series.max(),
            min: series.min(),
            rootData,
            seriesField: series.field(),
            seriesId: series.id,
            seriesName: series.name(),
            valueFormatter: series.valueFormatter?.(),
            warnedDiagnosticSignatures
        });

        const valueSpanRad = totalSpanRad * preparedData.ratio;
        const markEndAngle = spanInfo.startAngleRad + valueSpanRad;

        const indicator = series.indicator();
        const primaryColor = series.color()
            ? styleResolver.resolveCssVariable(series.color(), series.element?.nativeElement)
            : styleResolver.resolvePaletteColor(0);

        const trackColor = series.trackColor()
            ? styleResolver.resolveCssVariable(series.trackColor(), series.element?.nativeElement)
            : styleResolver.resolveCssVariable("--mona-chart-radial-track-color") || "#e2e8f0";
        const trackOpacity = series.trackOpacity?.() ?? 0.15;

        const needleColor = series.needleColor()
            ? styleResolver.resolveCssVariable(series.needleColor(), series.element?.nativeElement)
            : primaryColor || "#1e293b";
        const hubColor = needleColor;

        const fillMode = series.fillMode?.() ?? "solid";
        const fillOpacity = series.fillOpacity?.() ?? 1;
        const strokeColor = series.trackColor() ? "" : "";
        const strokeWidth = 0;

        const track: SceneRadialTrack = {
            color: trackColor,
            endAngle: spanInfo.endAngleRad,
            innerRadius,
            opacity: trackOpacity,
            outerRadius,
            startAngle: spanInfo.startAngleRad
        };

        const value: SceneGaugeValue = {
            animationKey: preparedData.animationKey,
            dataIndex: preparedData.dataIndex,
            datum: preparedData.datum,
            endAngle: markEndAngle,
            formattedValue: preparedData.formattedValue,
            innerRadius,
            isClamped: preparedData.isClamped,
            max: preparedData.max,
            min: preparedData.min,
            outerRadius,
            ratio: preparedData.ratio,
            rawValue: preparedData.rawValue,
            startAngle: spanInfo.startAngleRad
        };

        let needle: SceneGaugeNeedle | undefined;
        if (indicator === "needle" || indicator === "both") {
            const lengthRatio = Math.max(0.1, Math.min(1, series.needleLengthRatio()));
            needle = {
                angle: markEndAngle,
                color: needleColor,
                hubColor,
                hubRadius: Math.max(1, series.hubRadius()),
                length: outerRadius * lengthRatio,
                width: Math.max(1, series.needleWidth())
            };
        }

        const seriesStyle: ChartGaugeSeriesStyle = {
            color: primaryColor,
            fillOpacity,
            hubColor,
            needleColor,
            strokeColor,
            strokeSource: "default",
            strokeWidth,
            trackColor,
            trackOpacity
        };

        const seriesScene: ChartGaugeSeriesScene = {
            fillMode,
            id: series.id,
            indicator,
            name: series.name(),
            needle,
            showValue: series.showValue(),
            style: seriesStyle,
            track,
            type: "gauge",
            value
        };

        const hitTarget: SceneHitTarget = {
            arc: {
                center,
                cornerRadius: series.cornerRadius?.() ?? 0,
                endAngle: indicator === "needle" ? spanInfo.endAngleRad : markEndAngle,
                innerRadius,
                outerRadius,
                padAngle: 0,
                startAngle: spanInfo.startAngleRad
            },
            color: primaryColor,
            dataIndex: preparedData.dataIndex,
            datum: preparedData.datum,
            formattedValue: preparedData.formattedValue,
            index: preparedData.dataIndex >= 0 ? preparedData.dataIndex : 0,
            itemId: series.id,
            seriesId: series.id,
            seriesName: series.name(),
            seriesType: "gauge",
            value: preparedData.rawValue,
            valueKind: "scalar",
            xKey: series.id,
            xValue: series.name(),
            yValue: preparedData.rawValue
        };

        const midAngle = (spanInfo.startAngleRad + markEndAngle) / 2;
        const midRadius = (innerRadius + outerRadius) / 2;
        const interactionBuckets: ChartInteractionBucket[] = [
            {
                anchor: {
                    x: center.x + Math.sin(midAngle) * midRadius,
                    y: center.y - Math.cos(midAngle) * midRadius
                },
                hits: [hitTarget],
                order: 0,
                xKey: series.id,
                xValue: series.name()
            }
        ];

        const legendItems = [
            {
                color: primaryColor,
                dataIndex: preparedData.dataIndex,
                datum: preparedData.datum,
                itemId: series.id,
                kind: "series" as const,
                name: series.name(),
                seriesId: series.id,
                seriesType: "gauge" as const,
                value: preparedData.rawValue,
                visible: series.visible()
            }
        ];

        const hitIndex = new GaugeHitIndex(center, [hitTarget], innerRadius, outerRadius);

        return {
            arcMode: "gauge",
            center,
            coordinateSystem: "polar",
            hasRenderableData: true,
            height: containerHeight,
            hitIndex,
            hitTargets: [hitTarget],
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
