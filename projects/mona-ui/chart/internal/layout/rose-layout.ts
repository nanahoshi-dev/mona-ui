import type { ChartPoint } from "../../models/chart.models";
import type {
    ChartAngularAxisRegistration,
    ChartRadialAxisRegistration,
    ChartRoseSeriesRegistration
} from "../context/chart-registration-context";
import { RoseDataProcessor } from "../data/rose-data";
import type {
    ChartRadialArcSeriesStyle,
    ChartRoseSeriesScene,
    PolarArcChartScene,
    RoseCategoryScene,
    SceneRadialArcMark
} from "../scene/polar-arc-scene";
import type { ChartAngularAxisScene, ChartRadialAxisScene } from "../scene/polar-axis-scene";
import type { ChartInteractionBucket, SceneHitTarget } from "../scene/scene-geometry";
import type { ChartStyleResolver } from "../style/chart-style-resolver";
import { degreesToRadians, normalizeAngleSpan } from "../utils/angle-utils";
import { RoseHitIndex } from "../interaction/rose-hit-index";
import { PolarAxisLayoutEngine } from "./polar-axis-layout-engine";

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

        const maxAvailableRadius = Math.max(0, Math.min(containerWidth, containerHeight) / 2);

        const outerRatio = Math.max(0.05, Math.min(1, series.outerRadiusRatio()));
        const innerRatio = Math.max(0, Math.min(outerRatio - 0.01, series.innerRadiusRatio()));

        const outerRadius = maxAvailableRadius * outerRatio;
        const innerRadius = maxAvailableRadius * innerRatio;

        const spanInfo = normalizeAngleSpan(series.startAngle(), series.endAngle());
        const totalSpanRad = spanInfo.endAngleRad - spanInfo.startAngleRad;

        const scaleMode = series.scaleMode();
        const padAngleDeg = series.padAngle();
        const padAngleRad = degreesToRadians(padAngleDeg);
        const cornerRadius = series.cornerRadius?.() ?? 0;

        const preparedData = RoseDataProcessor.process({
            categoryField: series.categoryField(),
            categoryFormatter: series.categoryFormatter?.(),
            colorField: series.colorField?.(),
            colors: series.colors?.(),
            data: series.data(),
            isDatumVisible: (itemId: string) => series.isDatumVisible(itemId),
            keyField: series.keyField?.(),
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

        const strokeColor = series.strokeColor();
        const strokeWidth = series.strokeWidth?.() ?? 0;
        const fillMode = series.fillMode?.() ?? "solid";
        const fillOpacity = series.fillOpacity?.() ?? 1;

        const seriesStyle: ChartRadialArcSeriesStyle = {
            fillOpacity,
            strokeColor,
            strokeSource: strokeColor ? "explicit" : "default",
            strokeWidth,
            trackColor: "",
            trackOpacity: 0
        };

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
            visible: item.visible
        }));

        const hasRenderableData = marks.some(m => m.normalizedValue !== undefined && m.normalizedValue > 0);

        const hitIndex = new RoseHitIndex(center, hitTargets);

        return {
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
            series: [seriesScene],
            width: containerWidth
        };
    }
}
