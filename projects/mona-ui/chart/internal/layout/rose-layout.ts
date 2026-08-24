import type { ChartPoint } from "../../models/chart.models";
import type { ChartLabelMeasurement } from "../../models/chart-polar.models";
import type {
    ChartAngularAxisRegistration,
    ChartRadialAxisRegistration,
    ChartRoseSeriesRegistration
} from "../context/chart-registration-context";
import { RoseDataProcessor } from "../data/rose-data";
import { computeRadialDomain } from "../data/radial-domain";
import { formatRadialValue } from "../data/radar-data";
import { ChartDiagnostics } from "../utils/chart-diagnostics";
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
import { computeOuterRadiusWithStroke, normalizeArcCornerRadius, normalizeRosePadding } from "./radial-geometry-utils";
import { clamp, normalizeNonNegativeNumber, normalizeRatio, normalizeTickCount } from "../utils/number-utils";

export interface RoseLayoutOptions {
    readonly angularAxis?: ChartAngularAxisRegistration;
    readonly containerHeight: number;
    readonly containerWidth: number;
    readonly measurements?: ReadonlyMap<string, ChartLabelMeasurement>;
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
            measurements,
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

        const spanInfo = normalizeAngleSpan(series.startAngle(), series.endAngle());
        const totalSpanRad = spanInfo.endAngleRad - spanInfo.startAngleRad;

        const angularRotation = angularAxis ? normalizeDegrees(angularAxis.rotation()) : 0;
        const angularRotationRad = degreesToRadians(angularRotation);
        const effectiveStartAngleRad = spanInfo.startAngleRad + angularRotationRad;

        const scaleMode = series.scaleMode();

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

        // 1. Unified Rose Radial Domain
        const validValues = preparedData.allItems.map(i => i.rawValue);
        const radialTickCount = normalizeTickCount(radialAxis?.tickCount?.(), 5, 1, 20);

        const requestedMin = radialAxis?.min?.();
        let normalizedExplicitMin: number | undefined;
        if (requestedMin !== undefined && Number.isFinite(requestedMin)) {
            if (requestedMin < 0) {
                if (warnedDiagnosticSignatures) {
                    ChartDiagnostics.warnOnce(
                        warnedDiagnosticSignatures,
                        `Rose series "${series.name()}" encountered negative radial min (${requestedMin}). Normalizing to 0.`,
                        `${series.id}:negative-rose-min`
                    );
                }
                normalizedExplicitMin = 0;
            } else {
                normalizedExplicitMin = requestedMin;
            }
        }

        const domainResult = computeRadialDomain(validValues, {
            explicitMax: radialAxis?.max?.(),
            explicitMin: normalizedExplicitMin,
            nice: radialAxis?.nice?.() ?? true,
            tickCount: radialTickCount
        });

        let [dMin, dMax] = domainResult.domain;
        if (dMin < 0) {
            dMin = 0;
        }
        if (dMax <= dMin) {
            dMax = dMin + 1;
        }
        const dSpan = Math.max(1e-6, dMax - dMin);

        // 2. Gutter / Plot Size Calculations
        const showAngularLabels = angularAxis ? angularAxis.visible() && angularAxis.labels() : false;
        let leftGutter = 12;
        let rightGutter = 12;
        let topGutter = 12;
        let bottomGutter = 12;

        if (showAngularLabels && K > 0) {
            let maxLabelWidth = 24;
            let maxLabelHeight = 14;
            for (let k = 0; k < K; k++) {
                const cat = preparedData.allCategories[k];
                const meas =
                    measurements?.get(`angular:${cat.categoryKey}`) ??
                    measurements?.get(`angular:${String(cat.category)}`);
                if (meas) {
                    maxLabelWidth = Math.max(maxLabelWidth, meas.width);
                    maxLabelHeight = Math.max(maxLabelHeight, meas.height);
                } else {
                    const textLen = (cat.formattedCategory ?? String(cat.category)).length;
                    maxLabelWidth = Math.max(maxLabelWidth, Math.min(90, textLen * 6.5 + 8));
                }
            }
            const offset = normalizeNonNegativeNumber(angularAxis?.labelOffset?.(), 10);
            const maxInset = Math.min(containerWidth, containerHeight) * 0.22;
            const labelInsetX = Math.min(maxInset, maxLabelWidth + offset);
            const labelInsetY = Math.min(maxInset, maxLabelHeight + offset);
            leftGutter = Math.max(leftGutter, labelInsetX);
            rightGutter = Math.max(rightGutter, labelInsetX);
            topGutter = Math.max(topGutter, labelInsetY);
            bottomGutter = Math.max(bottomGutter, labelInsetY);
        }

        const showRadialLabels = radialAxis ? radialAxis.visible() && radialAxis.labels() : false;
        if (showRadialLabels) {
            const radialLabelAngle = normalizeDegrees(radialAxis?.labelAngle?.() ?? 0);
            const labelAngleRad = degreesToRadians(radialLabelAngle);
            const radialLabelOffset = normalizeNonNegativeNumber(radialAxis?.labelOffset?.(), 6);
            let maxRadWidth = 24;
            let maxRadHeight = 14;
            for (let idx = 0; idx < domainResult.ticks.length; idx++) {
                const val = domainResult.ticks[idx];
                const meas = measurements?.get(`radial:val:${val}`) ?? measurements?.get(`radial:${val}`);
                if (meas) {
                    maxRadWidth = Math.max(maxRadWidth, meas.width);
                    maxRadHeight = Math.max(maxRadHeight, meas.height);
                } else {
                    const text = radialAxis?.formatter?.() ? radialAxis.formatter()!(val, idx) : formatRadialValue(val);
                    maxRadWidth = Math.max(maxRadWidth, Math.min(100, text.length * 7 + 8));
                }
            }
            const maxInset = Math.min(containerWidth, containerHeight) * 0.22;
            const radialInsetX = Math.min(maxInset, maxRadWidth + radialLabelOffset);
            const radialInsetY = Math.min(maxInset, maxRadHeight + radialLabelOffset);

            const sinA = Math.sin(labelAngleRad);
            const cosA = Math.cos(labelAngleRad);

            if (sinA > 0.3) {
                rightGutter = Math.max(rightGutter, radialInsetX);
            } else if (sinA < -0.3) {
                leftGutter = Math.max(leftGutter, radialInsetX);
            }
            if (cosA > 0.3) {
                topGutter = Math.max(topGutter, radialInsetY);
            } else if (cosA < -0.3) {
                bottomGutter = Math.max(bottomGutter, radialInsetY);
            }
        }

        const usableWidth = Math.max(0, containerWidth - leftGutter - rightGutter);
        const usableHeight = Math.max(0, containerHeight - topGutter - bottomGutter);
        const maxAvailableRadius = Math.max(0, Math.min(usableWidth, usableHeight) / 2);

        const outerRadius = computeOuterRadiusWithStroke(
            maxAvailableRadius,
            series.outerRadiusRatio(),
            seriesStyle.strokeWidth
        );

        const innerRatio = normalizeRatio(series.innerRadiusRatio(), 0, 0, 0.99);
        const innerRadius = outerRadius * innerRatio;

        const rinSq = innerRadius * innerRadius;
        const routSq = outerRadius * outerRadius;
        const areaSpanSq = Math.max(0, routSq - rinSq);
        const radiusSpan = Math.max(0, outerRadius - innerRadius);

        const computePetalRadius = (val: number): { radius: number; ratio: number } => {
            const ratio = Math.max(0, Math.min(1, (val - dMin) / dSpan));
            let r: number;
            if (scaleMode === "area") {
                r = Math.sqrt(rinSq + ratio * areaSpanSq);
            } else {
                r = innerRadius + ratio * radiusSpan;
            }
            return { radius: clamp(r, 0, outerRadius), ratio };
        };

        const angularCategories: RoseCategoryScene[] = [];
        for (let k = 0; k < K; k++) {
            const cat = preparedData.allCategories[k];
            const slotStart = effectiveStartAngleRad + k * deltaTheta;
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

        if (isVisible) {
            for (let i = 0; i < preparedData.visibleItems.length; i++) {
                const datum = preparedData.visibleItems[i];
                const k = datum.categoryIndex;
                const slotStart = effectiveStartAngleRad + k * deltaTheta;
                const slotEnd = slotStart + deltaTheta;

                const { radius: petalOuter, ratio: normalizedRatio } = computePetalRadius(datum.rawValue);
                const maxPetalCorner = Math.max(0, (petalOuter - innerRadius) / 2);
                const cornerRadius = normalizeArcCornerRadius(series.cornerRadius?.(), maxPetalCorner, 0);

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
                    normalizedValue: normalizedRatio,
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
                    category: datum.category,
                    categoryIndex: k,
                    color: datum.color,
                    dataIndex: datum.dataIndex,
                    datum: datum.datum,
                    formattedCategory: datum.formattedCategory,
                    formattedRadialMax: String(dMax),
                    formattedRadialMin: String(dMin),
                    formattedValue: datum.formattedValue,
                    index: datum.dataIndex,
                    isClamped: datum.rawValue < dMin || datum.rawValue > dMax,
                    itemId: datum.itemId,
                    radialMax: dMax,
                    radialMin: dMin,
                    radialRatio: normalizedRatio,
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

        // 3. Angular Axis Scene (with label thinning for dense categories)
        let angularAxisScene: ChartAngularAxisScene | undefined;
        if (angularAxis) {
            const angularLabelOffset = normalizeNonNegativeNumber(angularAxis.labelOffset(), 10);
            const angularFormatter = angularAxis.formatter();

            const maxDisplayLabels = 36;
            const labelStride = K > maxDisplayLabels ? Math.ceil(K / maxDisplayLabels) : 1;

            const angularTicks: ChartAngularAxisTick[] = [];
            for (let k = 0; k < K; k++) {
                if (k % labelStride !== 0 && k !== K - 1) {
                    continue;
                }

                const cat = preparedData.allCategories[k];
                const slotStart = effectiveStartAngleRad + k * deltaTheta;
                const slotEnd = slotStart + deltaTheta;
                const midAngle = (slotStart + slotEnd) / 2;

                const labelPoint: ChartPoint = {
                    x: center.x + Math.sin(midAngle) * (outerRadius + angularLabelOffset),
                    y: center.y - Math.cos(midAngle) * (outerRadius + angularLabelOffset)
                };

                const formattedValue = angularFormatter ? angularFormatter(cat.category, k) : cat.formattedCategory;

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

        // 4. Radial Axis Scene (with gridShape polygon normalization)
        let radialAxisScene: ChartRadialAxisScene | undefined;
        if (radialAxis) {
            if (radialAxis.gridShape?.() === "polygon") {
                if (warnedDiagnosticSignatures) {
                    ChartDiagnostics.warnOnce(
                        warnedDiagnosticSignatures,
                        `Rose series "${series.name()}" does not support polygon radial grids. Normalizing gridShape to "circle".`,
                        `${series.id}:rose-grid-shape-polygon`
                    );
                }
            }

            const showRadialLabels = radialAxis.visible() && radialAxis.labels();
            const radialLabelAngle = normalizeDegrees(radialAxis.labelAngle());
            const labelAngleRad = degreesToRadians(radialLabelAngle);
            const radialLabelOffset = normalizeNonNegativeNumber(radialAxis.labelOffset(), 6);
            const radialFormatter = radialAxis.formatter();

            const cosLabel = Math.cos(labelAngleRad);
            const sinLabel = Math.sin(labelAngleRad);

            const radialTicks: ChartRadialAxisTick[] = domainResult.ticks.map((val, idx) => {
                const { radius: r } = computePetalRadius(val);

                const labelPoint: ChartPoint = {
                    x: center.x + sinLabel * r + cosLabel * radialLabelOffset,
                    y: center.y - cosLabel * r + sinLabel * radialLabelOffset
                };

                const formattedValue = radialFormatter ? radialFormatter(val, idx) : formatRadialValue(val);

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
                domain: [dMin, dMax],
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

        const hasRenderableData = isVisible && preparedData.allItems.length > 0;

        const hitIndex = new RoseHitIndex(center, hitTargets, effectiveStartAngleRad, totalSpanRad, K);

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
