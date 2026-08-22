import type { ChartAxisFormatter, ChartXAxisType } from "../../models/chart-axis.models";
import type { ChartField, ChartRect } from "../../models/chart.models";
import { ChartMarkKeyResolver } from "../animation/animation-identity";
import type {
    ChartBubbleSeriesRegistration,
    ChartCartesianSeriesRegistration,
    ChartScatterSeriesRegistration,
    ChartXAxisRegistration,
    ChartYAxisRegistration
} from "../context/chart-registration-context";
import { isContinuousXValid } from "../data/chart-domain";
import { resolveData, resolveSeriesDisplayName, resolveValue } from "../data/chart-value-resolver";
import type { LinearScale, TimeScale, UtcScale } from "../scale/cartesian-scale-factory";
import type { ChartBubbleSeriesScene, ChartMarkerSeriesStyle, ChartScatterSeriesScene } from "../scene/cartesian-scene";
import type { SceneHitTarget, SceneMarker } from "../scene/scene-geometry";
import type { ChartStyleResolver } from "../style/chart-style-resolver";
import { isFiniteNumber } from "../utils/number-utils";
import type { ChartPositionScale, ResolvedChartCartesianAxisType } from "../scale/chart-scale";
import { resolveCartesianMarkerDatum } from "../density/cartesian-marker-hit-materializer";
import { resolveCartesianMarkerGeometry } from "./cartesian-marker-geometry-resolver";
import { ChartDensityTracker, type ChartDensityStageCVisitMode } from "./chart-density-instrumentation";

export {
    resolveCartesianContinuousXCoordinate,
    type ResolvedCartesianXCoordinate
} from "./cartesian-marker-coordinate-resolver";

export interface CartesianMarkerSeriesLayoutResult {
    readonly hitTargets: readonly SceneHitTarget[];
    readonly scene: ChartBubbleSeriesScene | ChartScatterSeriesScene;
    readonly validDatumCount: number;
}

export interface CartesianMarkerSeriesLayoutOptions {
    readonly bubbleSizeDomain?: readonly [number, number];
    readonly identity?: import("../animation/chart-series-mark-identity-authority").ChartSeriesMarkIdentityAuthority;
    /** Representative source-index subset; null renders every datum (ordinary layout). */
    readonly indexView?: readonly number[] | null;
    readonly linearXScale?: LinearScale;
    readonly plotRect: ChartRect;
    readonly renderOrderCounter?: { value: number };
    readonly rootData: readonly unknown[];
    readonly rootXField?: ChartField;
    readonly series: ChartCartesianSeriesRegistration;
    readonly seriesIndex: number;
    readonly sourceVisitMode?: ChartDensityStageCVisitMode;
    readonly styleResolver: ChartStyleResolver;
    readonly timeScale?: TimeScale | UtcScale;
    readonly xAxis?: ChartXAxisRegistration;
    readonly xAxisFormatter?: ChartAxisFormatter;
    readonly xAxisId?: string;
    readonly xAxisTitle?: string;
    readonly xAxisType: ChartXAxisType;
    readonly xScale?: ChartPositionScale;
    readonly xTimeSpanMs?: number;
    readonly yAxis?: ChartYAxisRegistration;
    readonly yAxisFormatter?: ChartAxisFormatter;
    readonly yAxisId?: string;
    readonly yAxisTitle?: string;
    readonly yScale: ChartPositionScale;
}

export interface CartesianMarkerLayoutResult {
    readonly hitTargets: readonly SceneHitTarget[];
    readonly seriesScenes: readonly (ChartBubbleSeriesScene | ChartScatterSeriesScene)[];
    readonly validDatumCount: number;
}

export interface CartesianMarkerLayoutOptions {
    readonly bubbleSizeDomain?: readonly [number, number];
    readonly linearXScale?: LinearScale;
    readonly plotRect: ChartRect;
    readonly renderOrderCounter?: { value: number };
    readonly rootData: readonly unknown[];
    readonly rootXField?: ChartField;
    readonly series: readonly ChartCartesianSeriesRegistration[];
    readonly styleResolver: ChartStyleResolver;
    readonly timeScale?: TimeScale | UtcScale;
    readonly xAxisFormatter?: ChartAxisFormatter;
    readonly xAxisType: ChartXAxisType;
    readonly xTimeSpanMs?: number;
    readonly yAxisFormatter?: ChartAxisFormatter;
    readonly yScale: ChartPositionScale;
}

export class CartesianMarkerLayout {
    public static calculateBubbleSizeDomain(
        visibleBubbleSeries: readonly ChartBubbleSeriesRegistration[],
        rootData: readonly unknown[],
        rootXField: ChartField | undefined,
        xAxisType: ChartXAxisType,
        seriesContextResolver?: (
            seriesId: string
        ) => { effectiveXField?: ChartField; xType?: ResolvedChartCartesianAxisType } | undefined
    ): readonly [number, number] {
        let globalMinSize = Number.POSITIVE_INFINITY;
        let globalMaxSize = Number.NEGATIVE_INFINITY;

        for (const bubbleSeries of visibleBubbleSeries) {
            const ctx = seriesContextResolver?.(bubbleSeries.id);
            const sData = resolveData(bubbleSeries.data(), rootData);
            const sizeField = bubbleSeries.sizeField();
            const sXField = ctx?.effectiveXField ?? bubbleSeries.xField() ?? rootXField;
            const sField = bubbleSeries.field();
            const sXType = (ctx?.xType as ChartXAxisType) ?? xAxisType;

            for (let i = 0; i < sData.length; i++) {
                const rawX = resolveValue(sData[i], sXField, i);
                const rawY = resolveValue(sData[i], sField, i);
                const sVal = resolveValue(sData[i], sizeField, i);

                // Fully valid check: X is valid, Y is finite, size is finite > 0
                if (
                    isContinuousXValid(rawX, sXType) &&
                    isFiniteNumber(rawY) &&
                    isFiniteNumber(sVal) &&
                    (sVal as number) > 0
                ) {
                    const num = Number(sVal);
                    if (num < globalMinSize) globalMinSize = num;
                    if (num > globalMaxSize) globalMaxSize = num;
                }
            }
        }

        const hasValidBubbleDomain = Number.isFinite(globalMinSize) && Number.isFinite(globalMaxSize);
        return hasValidBubbleDomain ? [globalMinSize, globalMaxSize] : [1, 1];
    }

    public static computeSeries(options: CartesianMarkerSeriesLayoutOptions): CartesianMarkerSeriesLayoutResult | null {
        const {
            bubbleSizeDomain,
            linearXScale,
            plotRect,
            renderOrderCounter,
            rootData,
            rootXField,
            series: s,
            seriesIndex: sIdx,
            styleResolver,
            timeScale,
            xAxisFormatter,
            xAxisType,
            xScale,
            xTimeSpanMs,
            yAxisFormatter,
            yScale
        } = options;

        const effectiveXScale = xScale ?? linearXScale ?? timeScale;
        if (xAxisType === "category" || !effectiveXScale) {
            return null;
        }

        if (s.type !== "scatter" && s.type !== "bubble") {
            return null;
        }

        const isBubble = s.type === "bubble";
        const sStyle: ChartMarkerSeriesStyle = styleResolver.resolveMarkerSeriesStyle(s, sIdx);
        const seriesDisplayName = resolveSeriesDisplayName(s, sIdx);
        const sData = resolveData(s.data(), rootData);
        const sXField = s.xField() ?? rootXField;
        const sField = s.field();
        const keyResolver = new ChartMarkKeyResolver(s.id, s.keyField?.(), s.seriesKey?.());

        const effectiveBubbleSizeDomain =
            bubbleSizeDomain ??
            (isBubble
                ? CartesianMarkerLayout.calculateBubbleSizeDomain(
                      [s as ChartBubbleSeriesRegistration],
                      rootData,
                      rootXField,
                      xAxisType
                  )
                : [1, 1]);

        const markerGeometry = resolveCartesianMarkerGeometry({
            bubbleSizeDomain: effectiveBubbleSizeDomain,
            series: s as ChartScatterSeriesRegistration | ChartBubbleSeriesRegistration,
            styleResolver
        });

        const bSeries = isBubble ? (s as ChartBubbleSeriesRegistration) : undefined;
        const datumContext = {
            bubbleRadiusScale: markerGeometry.bubbleRadiusScale ?? undefined,
            color: sStyle.color,
            data: sData,
            defaultMinRadius: markerGeometry.bubbleMinRadius,
            defaultScatterRadius: markerGeometry.scatterRadius,
            identity: options.identity,
            keyResolver,
            series: s,
            seriesOrdinal: sIdx,
            seriesDisplayName,
            seriesType: s.type as "bubble" | "scatter",
            sizeField: bSeries?.sizeField(),
            sizeFormatter: bSeries?.sizeFormatter?.(),
            valueField: sField,
            valueFormatter:
                "valueFormatter" in s && typeof (s as any).valueFormatter === "function"
                    ? ((s as any).valueFormatter() as any)
                    : undefined,
            xAxis: options.xAxis,
            xAxisFormatter,
            xAxisId: options.xAxisId ?? "default-x",
            xAxisTitle: options.xAxisTitle,
            xAxisType,
            xField: sXField,
            xScale: effectiveXScale,
            xTimeSpanMs,
            yAxis: options.yAxis,
            yAxisFormatter,
            yAxisId: options.yAxisId ?? "default-y",
            yAxisTitle: options.yAxisTitle,
            yScale
        };

        const markers: SceneMarker[] = [];
        const hitTargets: SceneHitTarget[] = [];
        let validDatumCount = 0;

        // Sampled representative subset keeps marker volume bounded (§56/§218).
        const iterateIndices = options.indexView ?? null;

        if (iterateIndices !== null) {
            for (const dIdx of iterateIndices) {
                recordSourceVisit(options.sourceVisitMode ?? "raw");
                renderMarkerDatum(dIdx);
            }
        } else {
            for (let dIdx = 0; dIdx < sData.length; dIdx++) {
                recordSourceVisit(options.sourceVisitMode ?? "raw");
                renderMarkerDatum(dIdx);
            }
        }

        function recordSourceVisit(mode: ChartDensityStageCVisitMode): void {
            if (mode === "raw") {
                ChartDensityTracker.current?.onRawStageCSourceRowsVisited?.();
            } else if (mode === "sampled") {
                ChartDensityTracker.current?.onSampledProjectedRowsVisited?.();
            } else {
                ChartDensityTracker.current?.onExactProjectedRowsVisited?.();
            }
        }

        function renderMarkerDatum(dIdx: number): void {
            const res = resolveCartesianMarkerDatum(
                datumContext,
                dIdx,
                renderOrderCounter ? ++renderOrderCounter.value : 0
            );
            if (!res) {
                return;
            }

            // Valid datum count increments for any semantically valid marker before viewport culling
            validDatumCount++;

            // Off-screen culling: if circle is completely outside plot bounds
            const isFullyOutside =
                res.xPos + res.markerRadius < plotRect.x ||
                res.xPos - res.markerRadius > plotRect.x + plotRect.width ||
                res.yPos + res.markerRadius < plotRect.y ||
                res.yPos - res.markerRadius > plotRect.y + plotRect.height;

            if (isFullyOutside) {
                return;
            }

            markers.push(res.marker);
            hitTargets.push(res.target);
        }

        let scene: ChartBubbleSeriesScene | ChartScatterSeriesScene;
        if (isBubble) {
            scene = {
                id: s.id,
                markers,
                maxRadius: markerGeometry.bubbleMaxRadius,
                minRadius: markerGeometry.bubbleMinRadius,
                name: seriesDisplayName,
                style: sStyle,
                type: "bubble",
                xAxisId: options.xAxisId ?? s.xAxisId?.() ?? "default-x",
                yAxisId: options.yAxisId ?? s.yAxisId?.() ?? "default-y"
            };
        } else {
            scene = {
                id: s.id,
                markers,
                name: seriesDisplayName,
                pointRadius: markerGeometry.scatterRadius,
                style: sStyle,
                type: "scatter",
                xAxisId: options.xAxisId ?? s.xAxisId?.() ?? "default-x",
                yAxisId: options.yAxisId ?? s.yAxisId?.() ?? "default-y"
            };
        }

        return {
            hitTargets,
            scene,
            validDatumCount
        };
    }

    public static compute(options: CartesianMarkerLayoutOptions): CartesianMarkerLayoutResult {
        const {
            bubbleSizeDomain,
            linearXScale,
            plotRect,
            renderOrderCounter,
            rootData,
            rootXField,
            series,
            styleResolver,
            timeScale,
            xAxisFormatter,
            xAxisType,
            xTimeSpanMs,
            yAxisFormatter,
            yScale
        } = options;

        const seriesScenes: (ChartBubbleSeriesScene | ChartScatterSeriesScene)[] = [];
        const hitTargets: SceneHitTarget[] = [];
        let totalValidDatumCount = 0;

        const effectiveBubbleSizeDomain =
            bubbleSizeDomain ??
            CartesianMarkerLayout.calculateBubbleSizeDomain(
                series.filter(s => s.type === "bubble" && s.visible()) as ChartBubbleSeriesRegistration[],
                rootData,
                rootXField,
                xAxisType
            );

        for (let sIdx = 0; sIdx < series.length; sIdx++) {
            const s = series[sIdx];
            if (!s.visible() || (s.type !== "scatter" && s.type !== "bubble")) {
                continue;
            }

            const res = this.computeSeries({
                bubbleSizeDomain: effectiveBubbleSizeDomain,
                linearXScale,
                plotRect,
                renderOrderCounter,
                rootData,
                rootXField,
                series: s,
                seriesIndex: sIdx,
                styleResolver,
                timeScale,
                xAxisFormatter,
                xAxisType,
                xTimeSpanMs,
                yAxisFormatter,
                yScale
            });

            if (res) {
                seriesScenes.push(res.scene);
                hitTargets.push(...res.hitTargets);
                totalValidDatumCount += res.validDatumCount;
            }
        }

        return {
            hitTargets,
            seriesScenes,
            validDatumCount: totalValidDatumCount
        };
    }
}
