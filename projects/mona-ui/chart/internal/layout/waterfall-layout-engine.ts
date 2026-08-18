import type { ChartAxisTick } from "../../models/chart-axis.models";
import type { ChartLegendItem } from "../../models/chart-series.models";
import type { ChartPadding, ChartPoint, ChartRect } from "../../models/chart.models";
import type {
    ChartWaterfallSeriesRegistration,
    ChartXAxisRegistration,
    ChartYAxisRegistration
} from "../context/chart-registration-context";
import { WaterfallDataProcessor } from "../data/waterfall-data";
import { WaterfallHitIndex } from "../interaction/waterfall-hit-index";
import { BandScale, CartesianScaleFactory, LinearScale } from "../scale/cartesian-scale-factory";
import type { ChartAxisScene } from "../scene/cartesian-scene";
import type {
    CartesianWaterfallChartScene,
    ChartWaterfallSeriesScene,
    SceneWaterfallBar,
    SceneWaterfallConnector,
    SceneWaterfallLabel
} from "../scene/waterfall-scene";
import type { ChartInteractionBucket, SceneHitTarget } from "../scene/scene-geometry";
import type { ChartStyleResolver } from "../style/chart-style-resolver";
import { formatXValue, formatYValue } from "../utils/chart-formatter";
import { isFiniteNumber, normalizeTickCount } from "../utils/number-utils";

export class WaterfallLayoutEngine {
    public static computeEmptyScene(width: number, height: number): CartesianWaterfallChartScene {
        const plotRect: ChartRect = { height: Math.max(0, height - 16), width: Math.max(0, width - 16), x: 8, y: 8 };
        return {
            axes: [],
            cartesianKind: "waterfall",
            coordinateSystem: "cartesian",
            hasRenderableData: false,
            height,
            hitIndex: new WaterfallHitIndex(plotRect, [], []),
            hitTargets: [],
            interactionBuckets: [],
            kindSignature: "",
            legendItems: [],
            plotRect,
            sequenceSignature: JSON.stringify([]),
            series: [],
            width,
            xAxisType: "category"
        };
    }

    public static layout(
        registration: ChartWaterfallSeriesRegistration,
        containerWidth: number,
        containerHeight: number,
        styleResolver: ChartStyleResolver,
        xAxis?: ChartXAxisRegistration,
        yAxis?: ChartYAxisRegistration,
        rootData?: readonly unknown[],
        _warnedDiagnosticSignatures?: Set<string>
    ): CartesianWaterfallChartScene {
        const seriesId = registration.id;
        const seriesName = registration.name ? registration.name() : "Waterfall";
        const isVisible = registration.visible();

        const style = styleResolver.resolveWaterfallSeriesStyle(registration);

        const preparedData = WaterfallDataProcessor.process({
            data: registration.data?.(),
            field: registration.field(),
            isDatumVisible: registration.isDatumVisible,
            kindField: registration.kindField?.(),
            rootData,
            seriesElement: registration.element?.nativeElement,
            seriesId,
            seriesName,
            startValue: registration.startValue?.(),
            style,
            styleResolver,
            valueFormatter: registration.valueFormatter?.(),
            xField: registration.xField?.()
        });

        const isXAxisVisible = xAxis?.visible() ?? true;
        const isYAxisVisible = yAxis?.visible() ?? true;
        const xAxisPosition = xAxis?.position() ?? "bottom";
        const yAxisPosition = yAxis?.position() ?? "left";
        const xTitle = xAxis?.title() ?? "";
        const yTitle = yAxis?.title() ?? "";
        const yFormatter = yAxis?.formatter() ?? registration.valueFormatter?.();

        const rawYMin = yAxis?.min();
        const rawYMax = yAxis?.max();
        const explicitYMin = isFiniteNumber(rawYMin) ? rawYMin : undefined;
        const explicitYMax = isFiniteNumber(rawYMax) ? rawYMax : undefined;
        const niceY = yAxis?.nice() ?? true;
        const yTickCount = normalizeTickCount(yAxis?.tickCount(), 5);

        const yDomainMin = explicitYMin !== undefined ? explicitYMin : preparedData.minY;
        const yDomainMax = explicitYMax !== undefined ? explicitYMax : preparedData.maxY;

        // Pass 1: Estimate Y-axis gutter
        const tentativeYScale = CartesianScaleFactory.createLinearScale(
            [yDomainMin, yDomainMax],
            [containerHeight, 0],
            niceY,
            yTickCount,
            explicitYMin,
            explicitYMax
        );
        const tentativeYRawTicks = tentativeYScale.ticks(yTickCount);
        const maxLabelLength = Math.max(
            ...tentativeYRawTicks.map((val, idx) => formatYValue(val, idx, yFormatter).length),
            3
        );
        const yMargin = isYAxisVisible
            ? Math.max(48, Math.min(120, Math.round(maxLabelLength * 7.5 + (yTitle ? 32 : 16))))
            : 8;
        const xMargin = isXAxisVisible ? (xTitle ? 44 : 32) : 8;

        const padding: ChartPadding = {
            bottom: xAxisPosition === "bottom" ? xMargin : 12,
            left: yAxisPosition === "left" ? yMargin : 16,
            right: yAxisPosition === "right" ? yMargin : 16,
            top: xAxisPosition === "top" ? xMargin : 16
        };

        const plotWidth = Math.max(0, containerWidth - padding.left - padding.right);
        const plotHeight = Math.max(0, containerHeight - padding.top - padding.bottom);
        const plotRect: ChartRect = {
            height: plotHeight,
            width: plotWidth,
            x: padding.left,
            y: padding.top
        };

        const legendItems: ChartLegendItem[] = isVisible ? [...preparedData.legendItems] : [];

        if (!isVisible || !preparedData.hasRenderableData || plotWidth <= 0 || plotHeight <= 0) {
            const emptySeries: ChartWaterfallSeriesScene = {
                bars: [],
                connectors: [],
                id: seriesId,
                kindSignature: preparedData.kindSignature,
                labels: [],
                name: seriesName,
                renderOpacity: 1,
                sequenceSignature: preparedData.sequenceSignature,
                style,
                type: "waterfall"
            };

            return {
                axes: [],
                cartesianKind: "waterfall",
                coordinateSystem: "cartesian",
                hasRenderableData: false,
                height: containerHeight,
                hitIndex: new WaterfallHitIndex(plotRect, [], []),
                hitTargets: [],
                interactionBuckets: [],
                kindSignature: preparedData.kindSignature,
                legendItems,
                plotRect,
                sequenceSignature: preparedData.sequenceSignature,
                series: [emptySeries],
                width: containerWidth,
                xAxisType: "category"
            };
        }

        // Real Scales
        const yScale = CartesianScaleFactory.createLinearScale(
            [yDomainMin, yDomainMax],
            [plotHeight, 0],
            niceY,
            yTickCount,
            explicitYMin,
            explicitYMax
        );

        const categoryStrings = preparedData.categories.map(String);
        const bandScale = CartesianScaleFactory.createBandScale(categoryStrings, [0, plotWidth], 0.2, 0.1);

        const maxBarWidth = registration.maxBarWidth?.();
        const showConnectors = registration.showConnectors ? registration.showConnectors() : true;
        const showLabels = registration.showLabels ? registration.showLabels() : true;
        const minLabelWidth = Math.max(0, registration.minLabelWidth ? (registration.minLabelWidth() ?? 0) : 0);
        const maxLabels = Math.max(0, registration.maxLabels ? registration.maxLabels() : 100);

        const sceneBars: SceneWaterfallBar[] = [];
        const sceneConnectors: SceneWaterfallConnector[] = [];
        const sceneLabels: SceneWaterfallLabel[] = [];
        const hitTargets: SceneHitTarget[] = [];
        const interactionBuckets: ChartInteractionBucket[] = [];

        for (let i = 0; i < preparedData.points.length; i++) {
            const pt = preparedData.points[i];
            const slotX = plotRect.x + (bandScale.map(String(pt.category)) ?? 0);
            const slotWidth = bandScale.bandwidth();

            let barWidth = slotWidth;
            if (maxBarWidth !== undefined && maxBarWidth > 0 && maxBarWidth < slotWidth) {
                barWidth = maxBarWidth;
            }
            const barX = slotX + (slotWidth - barWidth) / 2;

            const fromY = plotRect.y + yScale.map(pt.barStart);
            const toY = plotRect.y + yScale.map(pt.barEnd);

            const topY = Math.min(fromY, toY);
            const rawHeight = Math.abs(toY - fromY);
            const barHeight = pt.isZeroChange ? Math.max(1, rawHeight) : Math.max(0, rawHeight);

            const barBounds: ChartRect = {
                height: barHeight,
                width: barWidth,
                x: barX,
                y: topY
            };

            const isDatumVisible = registration.isDatumVisible ? registration.isDatumVisible(pt.visualKind) : true;

            const sceneBar: SceneWaterfallBar = {
                animationKey: pt.animationKey,
                barEnd: pt.barEnd,
                barStart: pt.barStart,
                borderRadius: style.borderRadius,
                bounds: barBounds,
                category: pt.category,
                color: pt.color,
                cumulativeAfter: pt.cumulativeAfter,
                cumulativeBefore: pt.cumulativeBefore,
                dataIndex: pt.dataIndex,
                datum: pt.datum,
                deltaValue: pt.deltaValue,
                formattedCategory: pt.formattedCategory,
                formattedCumulativeAfter: pt.formattedCumulativeAfter,
                formattedCumulativeBefore: pt.formattedCumulativeBefore,
                formattedDelta: pt.formattedDelta,
                formattedValue: pt.formattedValue,
                fromY,
                isZeroChange: pt.isZeroChange,
                itemId: pt.itemId,
                kind: pt.kind,
                renderOpacity: isDatumVisible ? 1 : 0,
                renderOrder: i,
                toY,
                visualKind: pt.visualKind
            };
            sceneBars.push(sceneBar);

            // Connector to previous bar
            if (showConnectors && i > 0 && isDatumVisible) {
                const prevBar = sceneBars[i - 1];
                if (prevBar && (prevBar.renderOpacity ?? 1) > 0) {
                    const connFromX = prevBar.bounds.x + prevBar.bounds.width;
                    const connToX = barBounds.x;
                    const connY = prevBar.toY;

                    sceneConnectors.push({
                        animationKey: `conn:${i}`,
                        color: style.connectorColor,
                        cumulativeValue: preparedData.points[i - 1].cumulativeAfter,
                        fromX: connFromX,
                        renderOpacity: 1,
                        toX: connToX,
                        width: style.connectorWidth,
                        y: connY
                    });
                }
            }

            // Labels
            if (showLabels && isDatumVisible && barBounds.width >= minLabelWidth && sceneLabels.length < maxLabels) {
                const labelText = pt.kind === "change"
                    ? (pt.formattedDelta ?? pt.formattedValue)
                    : pt.formattedValue;

                const labelColor = style.labelColor ?? (styleResolver.resolveCssVariable("--color-foreground") || "#1e293b");

                const labelBounds: ChartRect = {
                    height: 16,
                    width: barBounds.width,
                    x: barBounds.x,
                    y: pt.visualKind === "decrease" ? barBounds.y + barBounds.height + 4 : barBounds.y - 20
                };

                sceneLabels.push({
                    barBounds,
                    bounds: labelBounds,
                    category: pt.category,
                    color: labelColor,
                    cumulativeAfter: pt.cumulativeAfter,
                    cumulativeBefore: pt.cumulativeBefore,
                    dataIndex: pt.dataIndex,
                    datum: pt.datum,
                    deltaValue: pt.deltaValue,
                    formattedCategory: pt.formattedCategory,
                    formattedValue: pt.formattedValue,
                    isInside: false,
                    itemId: pt.itemId,
                    kind: pt.kind,
                    text: labelText,
                    value: pt.value,
                    visualKind: pt.visualKind
                });
            }

            if (isDatumVisible) {
                const centerPoint: ChartPoint = {
                    x: barBounds.x + barBounds.width / 2,
                    y: barBounds.y + barBounds.height / 2
                };

                const hitTarget: SceneHitTarget = {
                    animationKey: pt.animationKey,
                    bounds: barBounds,
                    category: pt.category,
                    color: pt.color,
                    dataIndex: pt.dataIndex,
                    datum: pt.datum,
                    formattedCategory: pt.formattedCategory,
                    formattedValue: pt.formattedValue,
                    fromValue: pt.barStart,
                    index: pt.dataIndex,
                    isPositive: pt.visualKind === "increase" || pt.visualKind === "total" || pt.visualKind === "subtotal",
                    itemId: pt.itemId,
                    point: centerPoint,
                    renderOrder: i,
                    seriesId,
                    seriesName,
                    seriesType: "waterfall",
                    toValue: pt.barEnd,
                    value: pt.value,
                    valueKind: "waterfall",
                    visualBounds: barBounds,
                    waterfall: {
                        barEnd: pt.barEnd,
                        barStart: pt.barStart,
                        cumulativeAfter: pt.cumulativeAfter,
                        cumulativeBefore: pt.cumulativeBefore,
                        deltaValue: pt.deltaValue,
                        formattedCumulativeAfter: pt.formattedCumulativeAfter,
                        formattedCumulativeBefore: pt.formattedCumulativeBefore,
                        formattedDelta: pt.formattedDelta,
                        kind: pt.kind,
                        valueKind: "waterfall"
                    },
                    xKey: pt.itemId,
                    xValue: pt.category,
                    yValue: pt.barEnd
                };
                hitTargets.push(hitTarget);

                interactionBuckets.push({
                    anchor: centerPoint,
                    hits: [hitTarget],
                    order: i,
                    xKey: pt.itemId,
                    xValue: pt.category
                });
            }
        }

        // Axes scenes
        const axisScenes: ChartAxisScene[] = [];

        // X Axis
        if (isXAxisVisible) {
            const xTicks: ChartAxisTick[] = preparedData.categories.map((cat, idx) => {
                const pos = plotRect.x + (bandScale.map(String(cat)) ?? 0) + bandScale.bandwidth() / 2;
                return {
                    coordinate: pos,
                    formattedValue: formatXValue(cat, idx, xAxis?.formatter(), "category"),
                    index: idx,
                    value: cat
                };
            });

            axisScenes.push({
                axis: "x",
                axisLine: xAxis?.axisLine() ?? true,
                gridLines: xAxis?.gridLines() ?? false,
                position: xAxisPosition,
                ticks: xTicks,
                title: xTitle,
                visible: isXAxisVisible
            });
        }

        // Y Axis
        if (isYAxisVisible) {
            const yRawTicks = yScale.ticks(yTickCount);
            const yTicks: ChartAxisTick[] = yRawTicks.map((val, idx) => {
                const pos = plotRect.y + yScale.map(val);
                return {
                    coordinate: pos,
                    formattedValue: formatYValue(val, idx, yFormatter),
                    index: idx,
                    value: val
                };
            });

            axisScenes.push({
                axis: "y",
                axisLine: yAxis?.axisLine() ?? true,
                gridLines: yAxis?.gridLines() ?? true,
                position: yAxisPosition,
                ticks: yTicks,
                title: yTitle,
                visible: isYAxisVisible
            });
        }

        const hitIndex = new WaterfallHitIndex(plotRect, sceneBars, hitTargets);

        const seriesScene: ChartWaterfallSeriesScene = {
            bars: sceneBars,
            connectors: sceneConnectors,
            id: seriesId,
            kindSignature: preparedData.kindSignature,
            labels: sceneLabels,
            name: seriesName,
            renderOpacity: 1,
            sequenceSignature: preparedData.sequenceSignature,
            style,
            type: "waterfall"
        };

        return {
            axes: axisScenes,
            cartesianKind: "waterfall",
            coordinateSystem: "cartesian",
            hasRenderableData: true,
            height: containerHeight,
            hitIndex,
            hitTargets,
            interactionBuckets,
            kindSignature: preparedData.kindSignature,
            legendItems,
            plotRect,
            sequenceSignature: preparedData.sequenceSignature,
            series: [seriesScene],
            width: containerWidth,
            xAxisType: "category"
        };
    }
}
