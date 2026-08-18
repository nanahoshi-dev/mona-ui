import type { ChartAxisTick } from "../../models/chart-axis.models";
import type { ChartLegendItem } from "../../models/chart-series.models";
import type { ChartField, ChartPadding, ChartPoint, ChartRect } from "../../models/chart.models";
import type {
    ChartWaterfallSeriesRegistration,
    ChartXAxisRegistration,
    ChartYAxisRegistration
} from "../context/chart-registration-context";
import { WaterfallDataProcessor } from "../data/waterfall-data";
import { WaterfallHitIndex, type WaterfallHitEntry } from "../interaction/waterfall-hit-index";
import { CartesianScaleFactory } from "../scale/cartesian-scale-factory";
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
import { ChartDiagnostics } from "../utils/chart-diagnostics";
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
            hitIndex: new WaterfallHitIndex({ entries: [], plotRect }),
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
        rootXField?: ChartField,
        warnedDiagnosticSignatures?: Set<string>
    ): CartesianWaterfallChartScene {
        const seriesId = registration.id;
        const seriesName = registration.name ? registration.name() : "Waterfall";
        const isVisible = registration.visible();

        const style = styleResolver.resolveWaterfallSeriesStyle(registration);

        const preparedData = WaterfallDataProcessor.process({
            data: registration.data?.(),
            field: registration.field(),
            keyField: registration.keyField?.(),
            kindField: registration.kindField?.(),
            rootData,
            rootXField,
            seriesElement: registration.element?.nativeElement,
            seriesId,
            seriesName,
            startValue: registration.startValue?.(),
            style,
            styleResolver,
            valueFormatter: registration.valueFormatter?.(),
            warnedDiagnosticSignatures,
            xField: registration.xField?.()
        });

        const isXAxisVisible = xAxis?.visible() ?? true;
        const isYAxisVisible = yAxis?.visible() ?? true;
        const xAxisPosition = xAxis?.position() ?? "bottom";
        const yAxisPosition = yAxis?.position() ?? "left";
        const xTitle = xAxis?.title() ?? "";
        const yTitle = yAxis?.title() ?? "";
        const yFormatter = yAxis?.formatter() ?? registration.valueFormatter?.();

        // Validate X Axis Type
        const rawXAxisType = xAxis?.type();
        if (rawXAxisType !== undefined && rawXAxisType !== "category" && rawXAxisType !== "auto") {
            if (warnedDiagnosticSignatures) {
                ChartDiagnostics.warnOnce(
                    warnedDiagnosticSignatures,
                    `[MonaChart] Waterfall X axis is categorical; configured X axis type "${rawXAxisType}" is unsupported and will be treated as "category".`,
                    `${seriesId}:incompatible-x-axis-type:${rawXAxisType}`
                );
            }
        }

        // Validate Y Axis Type
        const rawYAxisType = yAxis?.type();
        if (rawYAxisType === "category") {
            if (warnedDiagnosticSignatures) {
                ChartDiagnostics.warnOnce(
                    warnedDiagnosticSignatures,
                    `[MonaChart] Waterfall Y axis is linear; configured Y axis type "category" is unsupported and will be treated as "linear".`,
                    `${seriesId}:incompatible-y-axis-type:category`
                );
            }
        }

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
        const yTitlePadding = yAxis?.titlePadding ? (yAxis.titlePadding() ?? 8) : 8;
        const xTitlePadding = xAxis?.titlePadding ? (xAxis.titlePadding() ?? 8) : 8;
        const yLabelPadding = yAxis?.labelPadding ? (yAxis.labelPadding() ?? 4) : 4;
        const xLabelPadding = xAxis?.labelPadding ? (xAxis.labelPadding() ?? 4) : 4;

        const yHasTitle = Boolean(yTitle.trim());
        const yTitleExtent = yHasTitle ? 18 : 0;
        const yActualTitlePadding = yHasTitle ? yTitlePadding : 0;
        const yLabelsEnabled = yAxis?.labels ? (yAxis.labels() ?? true) : true;
        const yTickMarks = yAxis?.tickMarks ? (yAxis.tickMarks() ?? false) : false;
        const yTickSize = yTickMarks ? (yAxis?.tickSize ? (yAxis.tickSize() ?? 6) : 6) : 0;
        const yLabelOutward = yLabelsEnabled ? Math.max(24, maxLabelLength * 8) + yLabelPadding : 0;
        const yGutter = isYAxisVisible
            ? Math.max(48, Math.min(180, Math.round(yTickSize + yLabelOutward + (yHasTitle ? yTitleExtent + yActualTitlePadding : 0) + 8)))
            : 8;

        const xHasTitle = Boolean(xTitle.trim());
        const xTitleExtent = xHasTitle ? 18 : 0;
        const xActualTitlePadding = xHasTitle ? xTitlePadding : 0;
        const xLabelsEnabled = xAxis?.labels ? (xAxis.labels() ?? true) : true;
        const xTickMarks = xAxis?.tickMarks ? (xAxis.tickMarks() ?? false) : false;
        const xTickSize = xTickMarks ? (xAxis?.tickSize ? (xAxis.tickSize() ?? 6) : 6) : 0;
        const xLabelOutward = xLabelsEnabled ? 16 + xLabelPadding : 0;
        const xGutter = isXAxisVisible
            ? Math.max(32, Math.min(160, Math.round(xTickSize + xLabelOutward + (xHasTitle ? xTitleExtent + xActualTitlePadding : 0) + 8)))
            : 8;

        const padding: ChartPadding = {
            bottom: xAxisPosition === "bottom" ? xGutter : 12,
            left: yAxisPosition === "left" ? yGutter : 16,
            right: yAxisPosition === "right" ? yGutter : 16,
            top: xAxisPosition === "top" ? xGutter : 16
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
                hitIndex: new WaterfallHitIndex({ entries: [], plotRect }),
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

        // FWF-001: BandScale domain MUST use unique slot keys
        const slotKeys = preparedData.points.map(p => p.slotKey);
        const bandScale = CartesianScaleFactory.createBandScale(slotKeys, [0, plotWidth], 0.2, 0.1);

        const rawMaxBarWidth = registration.maxBarWidth?.();
        const maxBarWidth = isFiniteNumber(rawMaxBarWidth) && rawMaxBarWidth > 0 ? rawMaxBarWidth : undefined;
        const showConnectors = registration.showConnectors ? registration.showConnectors() : true;
        const showLabels = registration.showLabels ? registration.showLabels() : false;
        const rawMinLabelWidth = registration.minLabelWidth?.();
        const minLabelWidth = isFiniteNumber(rawMinLabelWidth) && rawMinLabelWidth >= 0 ? rawMinLabelWidth : 24;
        const rawMaxLabels = registration.maxLabels?.();
        const maxLabels = isFiniteNumber(rawMaxLabels) ? Math.max(0, Math.floor(rawMaxLabels)) : 100;

        const sceneBars: SceneWaterfallBar[] = [];
        const sceneConnectors: SceneWaterfallConnector[] = [];
        const hitTargets: SceneHitTarget[] = [];
        const hitEntries: WaterfallHitEntry[] = [];
        const interactionBuckets: ChartInteractionBucket[] = [];
        const candidateLabels: SceneWaterfallLabel[] = [];

        for (let i = 0; i < preparedData.points.length; i++) {
            const pt = preparedData.points[i];

            const slotX = plotRect.x + (bandScale.map(pt.slotKey) ?? 0);
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

            const displayValue = pt.category ?? pt.formattedCategory;
            const formattedCategory = formatXValue(
                displayValue,
                pt.dataIndex,
                xAxis?.formatter(),
                "category"
            );

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
                formattedCategory,
                formattedCumulativeAfter: pt.formattedCumulativeAfter,
                formattedCumulativeBefore: pt.formattedCumulativeBefore,
                formattedDelta: pt.formattedDelta,
                formattedValue: pt.formattedValue,
                fromY,
                isZeroChange: pt.isZeroChange,
                itemId: pt.itemId,
                kind: pt.kind,
                renderOpacity: 1,
                renderOrder: i,
                toY,
                visualKind: pt.visualKind
            };
            sceneBars.push(sceneBar);

            // Connector to previous bar
            if (showConnectors && style.connectorWidth > 0 && i > 0) {
                const prevBar = sceneBars[i - 1];

                if (prevBar) {
                    const connFromX = prevBar.bounds.x + prevBar.bounds.width;
                    const connToX = barBounds.x;
                    const connY = prevBar.toY;

                    sceneConnectors.push({
                        animationKey: `conn:${i}`,
                        color: style.connectorColor,
                        cumulativeValue: preparedData.points[i - 1].cumulativeAfter,
                        fromAnimationKey: prevBar.animationKey,
                        fromX: connFromX,
                        renderOpacity: 1,
                        toAnimationKey: pt.animationKey,
                        toX: connToX,
                        width: style.connectorWidth,
                        y: connY
                    });
                }
            }

            // Hit target
            const centerPoint: ChartPoint = {
                x: barBounds.x + barBounds.width / 2,
                y: barBounds.y + barBounds.height / 2
            };

            const hitTarget: SceneHitTarget = {
                animationKey: pt.animationKey,
                borderRadius: style.borderRadius,
                bounds: barBounds,
                category: pt.category,
                color: pt.color,
                dataIndex: pt.dataIndex,
                datum: pt.datum,
                formattedCategory,
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
                yValue: pt.value
            };

            hitTargets.push(hitTarget);

            hitEntries.push({
                animationKey: pt.animationKey,
                bounds: barBounds,
                isZeroChange: pt.isZeroChange,
                slotIndex: i,
                target: hitTarget
            });

            interactionBuckets.push({
                anchor: centerPoint,
                hits: [hitTarget],
                order: i,
                xKey: pt.itemId,
                xValue: pt.category
            });

            // Label Candidate
            if (showLabels && barBounds.width >= minLabelWidth) {
                const labelText = pt.kind === "change"
                    ? (pt.formattedDelta ?? pt.formattedValue)
                    : pt.formattedValue;

                let labelY: number;
                let isInside = false;

                if (pt.visualKind === "increase" || pt.visualKind === "total" || pt.visualKind === "subtotal") {
                    labelY = barBounds.y - 18;
                    if (labelY < plotRect.y) {
                        if (barBounds.height >= 24) {
                            labelY = barBounds.y + 4;
                            isInside = true;
                        } else {
                            labelY = barBounds.y + barBounds.height + 4;
                        }
                    }
                } else if (pt.visualKind === "decrease") {
                    labelY = barBounds.y + barBounds.height + 4;
                    if (labelY + 16 > plotRect.y + plotRect.height) {
                        if (barBounds.height >= 24) {
                            labelY = barBounds.y + barBounds.height - 20;
                            isInside = true;
                        } else {
                            labelY = barBounds.y - 18;
                        }
                    }
                } else {
                    labelY = barBounds.y - 18;
                    if (labelY < plotRect.y) {
                        labelY = barBounds.y + barBounds.height + 4;
                    }
                }

                const labelColor =
                    style.labelColor ??
                    (isInside
                        ? styleResolver.getReadableForeground(pt.color)
                        : (styleResolver.resolveCssVariable("--color-foreground") || "#1e293b"));

                // Clamp label bounds to plotRect
                labelY = Math.max(plotRect.y, Math.min(plotRect.y + plotRect.height - 16, labelY));

                const labelBounds: ChartRect = {
                    height: 16,
                    width: barBounds.width,
                    x: barBounds.x,
                    y: labelY
                };

                candidateLabels.push({
                    barBounds,
                    barEnd: pt.barEnd,
                    barStart: pt.barStart,
                    bounds: labelBounds,
                    category: pt.category,
                    cumulativeAfter: pt.cumulativeAfter,
                    cumulativeBefore: pt.cumulativeBefore,
                    dataIndex: pt.dataIndex,
                    datum: pt.datum,
                    deltaValue: pt.deltaValue,
                    fillColor: pt.color,
                    formattedCategory,
                    formattedCumulativeAfter: pt.formattedCumulativeAfter,
                    formattedCumulativeBefore: pt.formattedCumulativeBefore,
                    formattedDelta: pt.formattedDelta,
                    formattedValue: pt.formattedValue,
                    isInside,
                    itemId: pt.itemId,
                    kind: pt.kind,
                    text: labelText,
                    textColor: labelColor,
                    value: pt.value,
                    visualKind: pt.visualKind
                });
            }
        }

        // Cap labels by priority (FWF-027)
        let sceneLabels: SceneWaterfallLabel[] = candidateLabels;
        if (candidateLabels.length > maxLabels && maxLabels >= 0) {
            const prioritized = [...candidateLabels].sort((a, b) => {
                const getKindPriority = (k: string) => (k === "total" ? 0 : k === "subtotal" ? 1 : 2);
                const pA = getKindPriority(a.kind);
                const pB = getKindPriority(b.kind);
                if (pA !== pB) return pA - pB;

                const magA = Math.abs(a.deltaValue ?? a.value);
                const magB = Math.abs(b.deltaValue ?? b.value);
                if (magA !== magB) return magB - magA;

                return a.dataIndex - b.dataIndex;
            });
            const selectedSet = new Set(prioritized.slice(0, maxLabels).map(l => l.itemId));
            sceneLabels = candidateLabels.filter(l => selectedSet.has(l.itemId));
        }

        // Axes scenes
        const axisScenes: ChartAxisScene[] = [];

        // X Axis (FWF-019: Responsive Tick Thinning)
        if (isXAxisVisible) {
            const totalPoints = preparedData.points.length;
            const xTicks: ChartAxisTick[] = [];

            if (totalPoints > 0) {
                const maxAllowedTicks = 100;
                const estimatedLabelWidth = 50;
                const capacity = Math.max(1, Math.min(maxAllowedTicks, Math.floor(plotWidth / estimatedLabelWidth)));
                const stride = Math.max(1, Math.ceil(totalPoints / capacity));

                const includedIndices = new Set<number>();
                for (let idx = 0; idx < totalPoints; idx += stride) {
                    includedIndices.add(idx);
                }
                // Always include the last tick if totalPoints > 1
                if (totalPoints > 1) {
                    includedIndices.add(totalPoints - 1);
                }

                for (let idx = 0; idx < totalPoints; idx++) {
                    if (includedIndices.has(idx)) {
                        const pt = preparedData.points[idx];
                        const pos = plotRect.x + (bandScale.map(pt.slotKey) ?? 0) + bandScale.bandwidth() / 2;
                        const displayVal = pt.category !== undefined ? pt.category : pt.formattedCategory;

                        xTicks.push({
                            coordinate: pos,
                            formattedValue: sceneBars[idx].formattedCategory,
                            index: idx,
                            value: displayVal
                        });
                    }
                }
            }

            axisScenes.push({
                axis: "x",
                axisLine: xAxis?.axisLine() ?? true,
                gridLines: xAxis?.gridLines() ?? false,
                gutter: xGutter,
                labelPadding: xLabelPadding,
                labels: xLabelsEnabled,
                position: xAxisPosition,
                tickMarks: xTickMarks,
                ticks: xTicks,
                tickSize: xAxis?.tickSize ? (xAxis.tickSize() ?? 6) : 6,
                title: xTitle,
                titlePadding: xTitlePadding,
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
                gutter: yGutter,
                labelPadding: yLabelPadding,
                labels: yLabelsEnabled,
                position: yAxisPosition,
                tickMarks: yTickMarks,
                ticks: yTicks,
                tickSize: yAxis?.tickSize ? (yAxis.tickSize() ?? 6) : 6,
                title: yTitle,
                titlePadding: yTitlePadding,
                visible: isYAxisVisible
            });
        }

        const hitIndex = new WaterfallHitIndex({
            bandwidth: bandScale.bandwidth(),
            entries: hitEntries,
            plotRect,
            step: bandScale.step()
        });

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
