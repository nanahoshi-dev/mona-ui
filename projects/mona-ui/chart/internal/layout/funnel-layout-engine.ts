import type { ChartPoint, ChartRect } from "../../models/chart.models";
import type { ChartFunnelLabelContent, ChartFunnelOrientation } from "../../models/chart-funnel.models";
import type { ChartFunnelSeriesRegistration } from "../context/chart-registration-context";
import { FunnelDataProcessor } from "../data/funnel-data";
import { FunnelHitIndex } from "../interaction/funnel-hit-index";
import type {
    CartesianFunnelChartScene,
    ChartFunnelSeriesScene,
    SceneFunnelLabel,
    SceneFunnelStage
} from "../scene/funnel-scene";
import type { ChartInteractionBucket, SceneHitTarget } from "../scene/scene-geometry";
import { ChartStyleResolver } from "../style/chart-style-resolver";

export class FunnelLayoutEngine {
    public static computeEmptyScene(width: number, height: number): CartesianFunnelChartScene {
        const plotRect: ChartRect = { height: Math.max(0, height - 16), width: Math.max(0, width - 16), x: 8, y: 8 };
        return {
            axes: [],
            cartesianKind: "funnel",
            coordinateSystem: "cartesian",
            hasRenderableData: false,
            height,
            hitIndex: new FunnelHitIndex(plotRect, "vertical", 0, 0, [], []),
            hitTargets: [],
            interactionBuckets: [],
            legendItems: [],
            orientation: "vertical",
            plotRect,
            sequenceSignature: JSON.stringify([]),
            series: [],
            width
        };
    }

    public static layout(
        registration: ChartFunnelSeriesRegistration,
        plotRect: ChartRect,
        width: number,
        height: number,
        styleResolver: ChartStyleResolver,
        rootData?: readonly unknown[] | unknown,
        warnedDiagnosticSignatures?: Set<string>
    ): CartesianFunnelChartScene {
        const seriesId = registration.id;
        const seriesName = registration.name ? registration.name() : "Funnel";
        const isVisible = registration.visible();

        const orientation: ChartFunnelOrientation = registration.orientation ? registration.orientation() : "vertical";
        const gap = Math.max(0, registration.gap ? registration.gap() : 2);
        const widthRatio = Math.max(0.1, Math.min(1, registration.widthRatio ? registration.widthRatio() : 0.9));
        const showLabels = registration.showLabels ? registration.showLabels() : true;
        const labelContent: ChartFunnelLabelContent = registration.labelContent
            ? registration.labelContent()
            : "category-value";
        const maxLabels = Math.max(0, registration.maxLabels ? registration.maxLabels() : 100);
        const minLabelWidth = Math.max(0, registration.minLabelWidth ? (registration.minLabelWidth() ?? 0) : 0);
        const minLabelHeight = Math.max(0, registration.minLabelHeight ? (registration.minLabelHeight() ?? 0) : 0);

        const seriesStyle = styleResolver.resolveFunnelSeriesStyle(registration);

        const preparedData = FunnelDataProcessor.process({
            categoryField: registration.categoryField(),
            categoryFormatter: registration.categoryFormatter?.(),
            color: registration.color?.(),
            colorField: registration.colorField?.(),
            colors: registration.colors?.(),
            data: registration.data?.(),
            field: registration.field(),
            isDatumVisible: registration.isDatumVisible.bind(registration),
            keyField: registration.keyField?.(),
            rootData: Array.isArray(rootData)
                ? rootData
                : rootData !== undefined && rootData !== null
                  ? [rootData]
                  : undefined,
            seriesElement: registration.element?.nativeElement,
            seriesId,
            seriesName,
            styleResolver,
            valueFormatter: registration.valueFormatter?.(),
            warnedDiagnosticSignatures
        });

        const legendItems = preparedData.legendItems.map(item => ({
            ...item,
            visible: isVisible && item.visible
        }));

        if (
            !isVisible ||
            !preparedData.hasPositiveStage ||
            preparedData.visibleStages.length === 0 ||
            plotRect.width <= 0 ||
            plotRect.height <= 0
        ) {
            const emptySeries: ChartFunnelSeriesScene = {
                id: seriesId,
                labels: [],
                name: seriesName,
                orientation,
                renderOpacity: 1,
                sequenceSignature: preparedData.sequenceSignature,
                stages: [],
                style: seriesStyle,
                type: "funnel"
            };

            return {
                axes: [],
                cartesianKind: "funnel",
                coordinateSystem: "cartesian",
                hasRenderableData: false,
                height,
                hitIndex: new FunnelHitIndex(plotRect, orientation, 0, gap, [], []),
                hitTargets: [],
                interactionBuckets: [],
                legendItems,
                orientation,
                plotRect,
                sequenceSignature: preparedData.sequenceSignature,
                series: [emptySeries],
                width
            };
        }

        const visibleStages = preparedData.visibleStages;
        const N = visibleStages.length;
        const isVertical = orientation === "vertical";

        const availableSpan = isVertical
            ? Math.max(0, plotRect.height - gap * (N - 1))
            : Math.max(0, plotRect.width - gap * (N - 1));

        const slotSpan = availableSpan / N;
        const maxCrossSection = isVertical ? plotRect.width * widthRatio : plotRect.height * widthRatio;
        const centerCoord = isVertical ? plotRect.x + plotRect.width / 2 : plotRect.y + plotRect.height / 2;

        const sceneStages: SceneFunnelStage[] = [];
        const sceneLabels: SceneFunnelLabel[] = [];
        const hitTargets: SceneHitTarget[] = [];
        const interactionBuckets: ChartInteractionBucket[] = [];

        for (let i = 0; i < N; i++) {
            const stage = visibleStages[i];
            const leadingRatio = preparedData.maxValue > 0 ? stage.value / preparedData.maxValue : 0;
            const leadingCross = leadingRatio * maxCrossSection;

            let trailingCross: number;
            if (i < N - 1) {
                const nextRatio = preparedData.maxValue > 0 ? visibleStages[i + 1].value / preparedData.maxValue : 0;
                trailingCross = nextRatio * maxCrossSection;
            } else {
                trailingCross = leadingCross; // Last stage is flat
            }

            let polygon: readonly [ChartPoint, ChartPoint, ChartPoint, ChartPoint];
            let bounds: ChartRect;

            if (isVertical) {
                const y0 = plotRect.y + i * (slotSpan + gap);
                const y1 = y0 + slotSpan;
                const x0Top = centerCoord - leadingCross / 2;
                const x1Top = centerCoord + leadingCross / 2;
                const x0Bottom = centerCoord - trailingCross / 2;
                const x1Bottom = centerCoord + trailingCross / 2;

                polygon = [
                    { x: x0Top, y: y0 },
                    { x: x1Top, y: y0 },
                    { x: x1Bottom, y: y1 },
                    { x: x0Bottom, y: y1 }
                ];

                const minX = Math.min(x0Top, x0Bottom);
                const maxX = Math.max(x1Top, x1Bottom);
                bounds = {
                    height: slotSpan,
                    width: maxX - minX,
                    x: minX,
                    y: y0
                };
            } else {
                const x0 = plotRect.x + i * (slotSpan + gap);
                const x1 = x0 + slotSpan;
                const y0Left = centerCoord - leadingCross / 2;
                const y1Left = centerCoord + leadingCross / 2;
                const y0Right = centerCoord - trailingCross / 2;
                const y1Right = centerCoord + trailingCross / 2;

                polygon = [
                    { x: x0, y: y0Left },
                    { x: x1, y: y0Right },
                    { x: x1, y: y1Right },
                    { x: x0, y: y1Left }
                ];

                const minY = Math.min(y0Left, y0Right);
                const maxY = Math.max(y1Left, y1Right);
                bounds = {
                    height: maxY - minY,
                    width: slotSpan,
                    x: x0,
                    y: minY
                };
            }

            const textColor = styleResolver.getReadableForeground(stage.color);

            const sceneStage: SceneFunnelStage = {
                animationKey: stage.animationKey,
                bounds,
                category: stage.category,
                conversionRate: stage.conversionRate,
                dataIndex: stage.dataIndex,
                datum: stage.datum,
                dropOff: stage.dropOff,
                fillColor: stage.color,
                formattedCategory: stage.formattedCategory,
                formattedConversionRate: stage.formattedConversionRate,
                formattedOverallConversionRate: stage.formattedOverallConversionRate,
                formattedValue: stage.formattedValue,
                overallConversionRate: stage.overallConversionRate,
                polygon,
                previousValue: stage.previousValue,
                renderOpacity: 1,
                renderOrder: i,
                sourceIndex: stage.sourceIndex,
                stageId: stage.stageId,
                stageIndex: stage.stageIndex,
                textColor,
                value: stage.value
            };
            sceneStages.push(sceneStage);

            // Labels
            if (showLabels && bounds.width >= minLabelWidth && bounds.height >= minLabelHeight && sceneLabels.length < maxLabels) {
                let text = "";
                switch (labelContent) {
                    case "category":
                        text = stage.formattedCategory;
                        break;
                    case "value":
                        text = stage.formattedValue;
                        break;
                    case "category-value":
                        text = `${stage.formattedCategory} ${stage.formattedValue}`;
                        break;
                    case "category-value-conversion":
                        text = stage.formattedConversionRate
                            ? `${stage.formattedCategory} ${stage.formattedValue} (${stage.formattedConversionRate})`
                            : `${stage.formattedCategory} ${stage.formattedValue}`;
                        break;
                }

                sceneLabels.push({
                    bounds,
                    category: stage.category,
                    color: textColor,
                    conversionRate: stage.conversionRate,
                    dataIndex: stage.dataIndex,
                    datum: stage.datum,
                    dropOff: stage.dropOff,
                    formattedCategory: stage.formattedCategory,
                    formattedConversionRate: stage.formattedConversionRate,
                    formattedOverallConversionRate: stage.formattedOverallConversionRate,
                    formattedValue: stage.formattedValue,
                    overallConversionRate: stage.overallConversionRate,
                    previousValue: stage.previousValue,
                    stageId: stage.stageId,
                    stageIndex: stage.stageIndex,
                    text,
                    value: stage.value
                });
            }

            const centerPoint: ChartPoint = {
                x: bounds.x + bounds.width / 2,
                y: bounds.y + bounds.height / 2
            };

            const hitTarget: SceneHitTarget = {
                animationKey: stage.animationKey,
                bounds,
                category: stage.category,
                color: stage.color,
                dataIndex: stage.dataIndex,
                datum: stage.datum,
                formattedCategory: stage.formattedCategory,
                formattedValue: stage.formattedValue,
                funnel: {
                    category: stage.category,
                    conversionRate: stage.conversionRate,
                    dropOff: stage.dropOff,
                    formattedCategory: stage.formattedCategory,
                    formattedConversionRate: stage.formattedConversionRate,
                    formattedOverallConversionRate: stage.formattedOverallConversionRate,
                    formattedValue: stage.formattedValue,
                    overallConversionRate: stage.overallConversionRate,
                    previousValue: stage.previousValue,
                    stageId: stage.stageId,
                    stageIndex: stage.stageIndex,
                    value: stage.value
                },
                index: stage.dataIndex,
                itemId: stage.stageId,
                point: centerPoint,
                renderOrder: i,
                seriesId,
                seriesName,
                seriesType: "funnel",
                value: stage.value,
                valueKind: "scalar",
                visualBounds: bounds,
                xKey: stage.stageId,
                xValue: stage.category,
                yValue: stage.value
            };
            hitTargets.push(hitTarget);

            interactionBuckets.push({
                anchor: centerPoint,
                hits: [hitTarget],
                order: i,
                xKey: stage.stageId,
                xValue: stage.category
            });
        }

        const hitIndex = new FunnelHitIndex(
            plotRect,
            orientation,
            slotSpan,
            gap,
            sceneStages,
            hitTargets
        );

        const seriesScene: ChartFunnelSeriesScene = {
            id: seriesId,
            labels: sceneLabels,
            name: seriesName,
            orientation,
            renderOpacity: 1,
            sequenceSignature: preparedData.sequenceSignature,
            stages: sceneStages,
            style: seriesStyle,
            type: "funnel"
        };

        return {
            axes: [],
            cartesianKind: "funnel",
            coordinateSystem: "cartesian",
            hasRenderableData: true,
            height,
            hitIndex,
            hitTargets,
            interactionBuckets,
            legendItems,
            orientation,
            plotRect,
            sequenceSignature: preparedData.sequenceSignature,
            series: [seriesScene],
            width
        };
    }
}
