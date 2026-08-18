import type { ChartPoint } from "../../models/chart.models";
import type {
    ChartAngularAxisRegistration,
    ChartRadialAxisRegistration,
    ChartRoseSeriesRegistration
} from "../context/chart-registration-context";
import { RoseDataProcessor } from "../data/rose-data";
import { computeRadialDomain } from "../data/radial-domain";
import { formatRadialValue } from "../data/radar-data";
import type {
    ChartRoseSeriesScene,
    PolarArcChartScene,
    RoseCategoryScene,
    SceneRadialArcMark
} from "../scene/polar-arc-scene";
import type {
    ChartAngularAxisScene,
    ChartAngularAxisTick,
    ChartRadialAxisScene,
    ChartRadialAxisTick
} from "../scene/polar-axis-scene";
import type { ChartInteractionBucket, SceneHitTarget } from "../scene/scene-geometry";
import type { ChartStyleResolver } from "../style/chart-style-resolver";
import { degreesToRadians, normalizeAngleSpan, normalizeDegrees } from "../utils/angle-utils";
import { RoseHitIndex } from "../interaction/rose-hit-index";
import {
    computeOuterRadiusWithStroke,
    normalizeRosePadding
} from "./radial-geometry-utils";
import { clamp, normalizeNonNegativeNumber, normalizeRatio, normalizeTickCount } from "../utils/number-utils";

export interface RoseLayoutOptions {
    readonly angularAxis?: ChartAngularAxisRegistration;
    readonly containerHeight: number;
    readonly containerWidth: number;
    readonly radialAxis?: ChartRadialAxisRegistration;
    readonly rootData: readonly unknown[];
    readonly series: ChartRoseSeriesRegistration;
    readonly styleResolver: ChartStyleResolver;
    readonly warnedDiagnosticSignatures?: Set<string>;
}

export class RoseLayout {
    public static computeScene(options: RoseLayoutOptions): PolarArcChartScene {
        const {
            angularAxis,
            containerHeight,
            containerWidth,
            radialAxis,
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

        const innerRatio = normalizeRatio(series.innerRadiusRatio(), 0, 0, 0.99);
        const innerRadius = outerRadius * innerRatio;

        const spanInfo = normalizeAngleSpan(series.startAngle(), series.endAngle());
        const totalSpanRad = spanInfo.endAngleRad - spanInfo.startAngleRad;

        const scaleMode = series.scaleMode();
        const cornerRadius = series.cornerRadius?.() !== undefined
            ? Math.max(0, series.cornerRadius()!)
            : 0;

        const preparedData = RoseDataProcessor.process({
            categoryField: series.categoryField(),
            categoryFormatter: series.categoryFormatter?.(),
            colorField: series.colorField?.(),
            colors: series.colors?.(),
            data: series.data(),
            isDatumVisible: (itemId: string) => series.isDatumVisible(itemId),
            keyField: series.keyField?.(),
            max: radialAxis?.max?.(),
            min: radialAxis?.min?.(),
            rootData,
            scaleMode,
            seriesElement: series.element?.nativeElement,
            seriesField: series.field(),
            seriesId: series.id,
            seriesName: series.name(),
            styleResolver,
            valueFormatter: series.valueFormatter?.(),
            warnedDiagnosticSignatures
        });

        const K = preparedData.allCategories.length;
        const deltaTheta = K > 0 ? totalSpanRad / K : 0;
        const padAngleRad = normalizeRosePadding(series.padAngle(), deltaTheta, K);

        const angularCategories: RoseCategoryScene[] = [];
        for (let k = 0; k < K; k++) {
            const cat = preparedData.allCategories[k];
            const slotStart = spanInfo.startAngleRad + k * deltaTheta;
            const slotEnd = slotStart + deltaTheta;
            angularCategories.push({
                category: cat.category,
                categoryKey: cat.categoryKey,
                endAngle: slotEnd,
                formattedCategory: cat.formattedCategory,
                index: k,
                midAngle: (slotStart + slotEnd) / 2,
                startAngle: slotStart
            });
        }

        const marks: SceneRadialArcMark[] = [];
        const hitTargets: SceneHitTarget[] = [];
        const interactionBuckets: ChartInteractionBucket[] = [];

        const rinSq = innerRadius * innerRadius;
        const routSq = outerRadius * outerRadius;
        const areaSpanSq = Math.max(0, routSq - rinSq);
        const radiusSpan = Math.max(0, outerRadius - innerRadius);

        if (isVisible) {
            for (let i = 0; i < preparedData.visibleItems.length; i++) {
                const datum = preparedData.visibleItems[i];
                const k = datum.categoryIndex;
                const slotStart = spanInfo.startAngleRad + k * deltaTheta;
                const slotEnd = slotStart + deltaTheta;

                let petalOuter: number;
                if (scaleMode === "area") {
                    petalOuter = Math.sqrt(rinSq + datum.normalizedRatio * areaSpanSq);
                } else {
                    petalOuter = innerRadius + datum.normalizedRatio * radiusSpan;
                }

                const mark: SceneRadialArcMark = {
                    animationKey: datum.animationKey,
                    category: datum.category,
                    color: datum.color,
                    cornerRadius,
                    dataIndex: datum.dataIndex,
                    datum: datum.datum,
                    endAngle: slotEnd,
                    formattedCategory: datum.formattedCategory,
                    formattedValue: datum.formattedValue,
                    innerRadius,
                    itemId: datum.itemId,
                    normalizedValue: datum.normalizedRatio,
                    outerRadius: petalOuter,
                    padAngle: padAngleRad,
                    rawValue: datum.rawValue,
                    startAngle: slotStart,
                    visible: true
                };

                marks.push(mark);

                const target: SceneHitTarget = {
                    animationKey: datum.animationKey,
                    arc: {
                        center,
                        cornerRadius,
                        endAngle: slotEnd,
                        innerRadius,
                        outerRadius: petalOuter,
                        padAngle: padAngleRad,
                        startAngle: slotStart
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
                    seriesType: "rose",
                    value: datum.rawValue,
                    valueKind: "scalar",
                    xKey: datum.itemId,
                    xValue: datum.category,
                    yValue: datum.rawValue
                };

                hitTargets.push(target);

                const midAngle = (slotStart + slotEnd) / 2;
                const midRadius = (innerRadius + petalOuter) / 2;
                interactionBuckets.push({
                    anchor: {
                        x: center.x + Math.sin(midAngle) * midRadius,
                        y: center.y - Math.cos(midAngle) * midRadius
                    },
                    hits: [target],
                    order: k,
                    xKey: datum.itemId,
                    xValue: datum.category
                });
            }
        }

        const fillMode = series.fillMode?.() ?? "solid";

        const seriesScene: ChartRoseSeriesScene = {
            angularCategories,
            fillMode,
            id: series.id,
            marks,
            name: series.name(),
            scaleMode,
            style: seriesStyle,
            type: "rose"
        };

        // 1. Angular Axis Scene
        let angularAxisScene: ChartAngularAxisScene | undefined;
        if (angularAxis) {
            const showAngularLabels = angularAxis.visible() && angularAxis.labels();
            const angularRotation = normalizeDegrees(angularAxis.rotation());
            const angularLabelOffset = normalizeNonNegativeNumber(angularAxis.labelOffset(), 10);
            const angularFormatter = angularAxis.formatter();

            const angularTicks: ChartAngularAxisTick[] = [];
            for (let k = 0; k < K; k++) {
                const cat = preparedData.allCategories[k];
                const slotStart = spanInfo.startAngleRad + k * deltaTheta;
                const slotEnd = slotStart + deltaTheta;
                const midAngle = (slotStart + slotEnd) / 2;

                const labelPoint: ChartPoint = {
                    x: center.x + Math.sin(midAngle) * (outerRadius + angularLabelOffset),
                    y: center.y - Math.cos(midAngle) * (outerRadius + angularLabelOffset)
                };

                const formattedValue = angularFormatter
                    ? angularFormatter(cat.category, k)
                    : cat.formattedCategory;

                angularTicks.push({
                    angle: midAngle,
                    formattedValue,
                    index: k,
                    labelPoint,
                    tickKey: cat.categoryKey,
                    value: cat.category,
                    visible: true
                });
            }

            angularAxisScene = {
                axisLine: angularAxis.axisLine(),
                gridLines: angularAxis.gridLines(),
                labelOffset: angularLabelOffset,
                labels: showAngularLabels,
                mode: "category",
                rotation: angularRotation,
                ticks: angularTicks,
                visible: angularAxis.visible()
            };
        }

        // 2. Radial Axis Scene
        let radialAxisScene: ChartRadialAxisScene | undefined;
        if (radialAxis) {
            const showRadialLabels = radialAxis.visible() && radialAxis.labels();
            const radialLabelAngle = normalizeDegrees(radialAxis.labelAngle());
            const labelAngleRad = degreesToRadians(radialLabelAngle);
            const radialLabelOffset = normalizeNonNegativeNumber(radialAxis.labelOffset(), 6);
            const radialFormatter = radialAxis.formatter();
            const radialTickCount = normalizeTickCount(radialAxis.tickCount(), 5, 1, 20);

            const domainResult = computeRadialDomain(preparedData.allItems.map(i => i.rawValue), {
                explicitMax: radialAxis.max(),
                explicitMin: radialAxis.min(),
                nice: radialAxis.nice(),
                tickCount: radialTickCount
            });

            const [dMin, dMax] = domainResult.domain;
            const dSpan = Math.max(1e-6, dMax - dMin);

            const cosLabel = Math.cos(labelAngleRad);
            const sinLabel = Math.sin(labelAngleRad);

            const radialTicks: ChartRadialAxisTick[] = domainResult.ticks.map((val, idx) => {
                const ratio = Math.max(0, Math.min(1, (val - dMin) / dSpan));
                let r: number;
                if (scaleMode === "area") {
                    r = Math.sqrt(rinSq + ratio * areaSpanSq);
                } else {
                    r = innerRadius + ratio * radiusSpan;
                }
                r = clamp(r, 0, outerRadius);

                const labelPoint: ChartPoint = {
                    x: center.x + sinLabel * r + cosLabel * radialLabelOffset,
                    y: center.y - cosLabel * r + sinLabel * radialLabelOffset
                };

                const formattedValue = radialFormatter
                    ? radialFormatter(val, idx)
                    : formatRadialValue(val);

                return {
                    formattedValue,
                    index: idx,
                    isZero: Math.abs(val) < 1e-9,
                    labelPoint,
                    radius: r,
                    tickKey: `val:${val}`,
                    value: val,
                    visible: true
                };
            });

            radialAxisScene = {
                axisLine: radialAxis.axisLine(),
                domain: domainResult.domain,
                gridLines: radialAxis.gridLines(),
                gridShape: "circle",
                labelAngle: radialLabelAngle,
                labelOffset: radialLabelOffset,
                labels: showRadialLabels,
                ticks: radialTicks,
                visible: radialAxis.visible()
            };
        }

        const legendItems = preparedData.allItems.map(item => ({
            color: item.color,
            dataIndex: item.dataIndex,
            datum: item.datum,
            itemId: item.itemId,
            kind: "datum" as const,
            name: item.formattedCategory,
            seriesId: series.id,
            seriesType: "rose" as const,
            value: item.rawValue,
            visible: isVisible && item.visible
        }));

        const hasRenderableData = isVisible && marks.some(m => m.normalizedValue !== undefined && m.normalizedValue > 0);

        const hitIndex = new RoseHitIndex(
            center,
            hitTargets,
            spanInfo.startAngleRad,
            totalSpanRad,
            K
        );

        return {
            angularAxis: angularAxisScene,
            arcMode: "rose",
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
            radialAxis: radialAxisScene,
            series: [seriesScene],
            width: containerWidth
        };
    }
}
