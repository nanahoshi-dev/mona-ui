import type { ChartPoint } from "../../models/chart.models";
import type { ChartGaugeSeriesRegistration } from "../context/chart-registration-context";
import { GaugeDataProcessor } from "../data/gauge-data";
import type {
    ChartGaugeSeriesScene,
    PolarArcChartScene,
    SceneGaugeNeedle,
    SceneGaugeValue,
    SceneRadialTrack
} from "../scene/polar-arc-scene";
import type { ChartInteractionBucket, SceneHitTarget } from "../scene/scene-geometry";
import type { ChartStyleResolver } from "../style/chart-style-resolver";
import { normalizeAngleSpan } from "../utils/angle-utils";
import { GaugeHitIndex } from "../interaction/gauge-hit-index";
import { normalizeGaugeGeometry } from "./radial-geometry-utils";

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

        const isVisible = series.visible();
        const seriesStyle = styleResolver.resolveGaugeSeriesStyle(series);

        const geom = normalizeGaugeGeometry({
            containerHeight,
            containerWidth,
            cornerRadius: series.cornerRadius?.(),
            endAngle: series.endAngle(),
            hubRadius: series.hubRadius(),
            innerRadiusRatio: series.innerRadiusRatio(),
            needleLengthRatio: series.needleLengthRatio(),
            needleWidth: series.needleWidth(),
            outerRadiusRatio: series.outerRadiusRatio(),
            startAngle: series.startAngle()
        });

        const spanInfo = normalizeAngleSpan(geom.startAngle, geom.endAngle);
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
        const fillMode = series.fillMode?.() ?? "solid";

        const track: SceneRadialTrack = {
            color: seriesStyle.trackColor,
            endAngle: spanInfo.endAngleRad,
            innerRadius: geom.innerRadius,
            opacity: seriesStyle.trackOpacity,
            outerRadius: geom.outerRadius,
            startAngle: spanInfo.startAngleRad
        };

        const value: SceneGaugeValue = {
            animationKey: preparedData.animationKey,
            cornerRadius: geom.cornerRadius,
            dataIndex: preparedData.dataIndex,
            datum: preparedData.datum,
            endAngle: markEndAngle,
            formattedMax: preparedData.formattedMax,
            formattedMin: preparedData.formattedMin,
            formattedValue: preparedData.formattedValue,
            innerRadius: geom.innerRadius,
            isClamped: preparedData.isClamped,
            max: preparedData.max,
            min: preparedData.min,
            outerRadius: geom.outerRadius,
            ratio: preparedData.ratio,
            rawValue: preparedData.rawValue,
            renderOpacity: preparedData.hasValidData && isVisible ? 1 : 0,
            startAngle: spanInfo.startAngleRad
        };

        let needle: SceneGaugeNeedle | undefined;
        if (isVisible && preparedData.hasValidData && (indicator === "needle" || indicator === "both")) {
            needle = {
                angle: markEndAngle,
                color: seriesStyle.needleColor,
                hubColor: seriesStyle.hubColor,
                hubRadius: geom.hubRadius,
                length: geom.needleLength,
                width: geom.needleWidth
            };
        }

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

        const hitTargets: SceneHitTarget[] = [];
        const interactionBuckets: ChartInteractionBucket[] = [];
        let hitTarget: SceneHitTarget | undefined;

        if (isVisible && preparedData.hasValidData) {
            hitTarget = {
                animationKey: preparedData.animationKey,
                arc: {
                    center,
                    cornerRadius: geom.cornerRadius,
                    endAngle: markEndAngle,
                    innerRadius: geom.innerRadius,
                    outerRadius: geom.outerRadius,
                    padAngle: 0,
                    startAngle: spanInfo.startAngleRad
                },
                color: seriesStyle.color,
                dataIndex: preparedData.dataIndex,
                datum: preparedData.datum,
                formattedRadialMax: preparedData.formattedMax,
                formattedRadialMin: preparedData.formattedMin,
                formattedValue: preparedData.formattedValue,
                index: preparedData.dataIndex >= 0 ? preparedData.dataIndex : 0,
                isClamped: preparedData.isClamped,
                itemId: series.id,
                radialMax: preparedData.max,
                radialMin: preparedData.min,
                radialRatio: preparedData.ratio,
                seriesId: series.id,
                seriesName: series.name(),
                seriesType: "gauge",
                value: preparedData.rawValue,
                valueKind: "scalar",
                xKey: series.id,
                xValue: series.name(),
                yValue: preparedData.rawValue
            };

            hitTargets.push(hitTarget);

            let anchor: ChartPoint;
            if (indicator === "needle" && needle) {
                const needleMidRadius = geom.needleLength * 0.7;
                anchor = {
                    x: center.x + Math.sin(markEndAngle) * needleMidRadius,
                    y: center.y - Math.cos(markEndAngle) * needleMidRadius
                };
            } else {
                const midAngle = (spanInfo.startAngleRad + markEndAngle) / 2;
                const midRadius = (geom.innerRadius + geom.outerRadius) / 2;
                anchor = {
                    x: center.x + Math.sin(midAngle) * midRadius,
                    y: center.y - Math.cos(midAngle) * midRadius
                };
            }

            interactionBuckets.push({
                anchor,
                hits: [hitTarget],
                order: 0,
                xKey: series.id,
                xValue: series.name()
            });
        }

        const legendItems = [
            {
                color: seriesStyle.color,
                dataIndex: preparedData.dataIndex,
                datum: preparedData.datum,
                itemId: series.id,
                kind: "series" as const,
                name: series.name(),
                seriesId: series.id,
                seriesType: "gauge" as const,
                value: preparedData.rawValue,
                visible: isVisible
            }
        ];

        const hasRenderableData = isVisible && preparedData.hasValidData;
        const hitGeometry = hasRenderableData && hitTarget
            ? {
                  center,
                  indicator,
                  needle: needle
                      ? {
                            angle: needle.angle,
                            hubRadius: needle.hubRadius,
                            length: needle.length,
                            width: needle.width
                        }
                      : undefined,
                  target: hitTarget,
                  valueArc: hitTarget.arc
              }
            : null;

        const hitIndex = new GaugeHitIndex(hitGeometry);

        return {
            arcMode: "gauge",
            center,
            coordinateSystem: "polar",
            hasRenderableData,
            height: containerHeight,
            hitIndex,
            hitTargets,
            innerRadius: geom.innerRadius,
            interactionBuckets,
            legendItems,
            outerRadius: geom.outerRadius,
            plotRect: { height: containerHeight, width: containerWidth, x: 0, y: 0 },
            polarKind: "arc",
            series: [seriesScene],
            width: containerWidth
        };
    }
}
