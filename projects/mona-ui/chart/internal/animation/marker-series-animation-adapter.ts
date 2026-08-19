import type {
    ChartBubbleSeriesScene,
    ChartMarkerSeriesStyle,
    ChartScatterSeriesScene
} from "../scene/cartesian-scene";
import { lerp, lerpOpacity } from "./animation-math";
import { MarkerTransition, type MarkerTransitionState } from "./marker-transition";

export interface MarkerSeriesTransitionState {
    readonly fromOpacity: number;
    readonly fromStyle: ChartMarkerSeriesStyle;
    readonly id: string;
    readonly markers: MarkerTransitionState;
    readonly maxRadius?: number;
    readonly minRadius?: number;
    readonly name: string;
    readonly pointRadius?: number;
    readonly toOpacity: number;
    readonly toStyle: ChartMarkerSeriesStyle;
    readonly type: "bubble" | "scatter";
    readonly xAxisId: string;
    readonly yAxisId: string;
}

export class MarkerSeriesAnimationAdapter {
    public static planSeries(
        fromSeries: ChartScatterSeriesScene | ChartBubbleSeriesScene | undefined,
        toSeries: ChartScatterSeriesScene | ChartBubbleSeriesScene | undefined
    ): MarkerSeriesTransitionState | null {
        if (!fromSeries && !toSeries) {
            return null;
        }

        const id = toSeries?.id ?? fromSeries?.id ?? "";
        const name = toSeries?.name ?? fromSeries?.name ?? "";
        const type = (toSeries?.type ?? fromSeries?.type ?? "scatter") as "bubble" | "scatter";
        const xAxisId = toSeries?.xAxisId ?? fromSeries?.xAxisId ?? "default-x";
        const yAxisId = toSeries?.yAxisId ?? fromSeries?.yAxisId ?? "default-y";

        const fromMarkers = fromSeries?.markers ?? [];
        const toMarkers = toSeries?.markers ?? [];
        const markerState = MarkerTransition.plan(id, fromMarkers, toMarkers);

        const defaultStyle: ChartMarkerSeriesStyle = {
            color: "#3b82f6",
            fillOpacity: type === "bubble" ? 0.55 : 0.9,
            strokeColor: "#ffffff",
            strokeWidth: 1.5
        };

        const fromStyle = fromSeries?.style ?? toSeries?.style ?? defaultStyle;
        const toStyle = toSeries?.style ?? fromSeries?.style ?? defaultStyle;

        return {
            fromOpacity: fromSeries ? (fromSeries.renderOpacity ?? 1) : 0,
            fromStyle,
            id,
            markers: markerState,
            maxRadius: (toSeries as ChartBubbleSeriesScene)?.maxRadius ?? (fromSeries as ChartBubbleSeriesScene)?.maxRadius,
            minRadius: (toSeries as ChartBubbleSeriesScene)?.minRadius ?? (fromSeries as ChartBubbleSeriesScene)?.minRadius,
            name,
            pointRadius:
                (toSeries as ChartScatterSeriesScene)?.pointRadius ??
                (fromSeries as ChartScatterSeriesScene)?.pointRadius,
            toOpacity: toSeries ? (toSeries.renderOpacity ?? 1) : 0,
            toStyle,
            type,
            xAxisId,
            yAxisId
        };
    }

    public static sampleSeries(
        state: MarkerSeriesTransitionState,
        progress: number
    ): ChartBubbleSeriesScene | ChartScatterSeriesScene {
        const p = Math.max(0, Math.min(1, progress));
        const isWholeSeriesFade = state.fromOpacity === 0 || state.toOpacity === 0;
        const sampledMarkers = MarkerTransition.sample(
            state.markers,
            p,
            isWholeSeriesFade ? "radius" : "both"
        );

        const renderOpacity = lerpOpacity(state.fromOpacity, state.toOpacity, p);
        const fillOpacity = lerp(state.fromStyle.fillOpacity, state.toStyle.fillOpacity, p);
        const strokeWidth = lerp(state.fromStyle.strokeWidth, state.toStyle.strokeWidth, p);

        const style: ChartMarkerSeriesStyle = {
            color: state.toStyle.color,
            fillOpacity,
            strokeColor: state.toStyle.strokeColor,
            strokeWidth
        };

        if (state.type === "bubble") {
            const bubbleScene: ChartBubbleSeriesScene = {
                id: state.id,
                markers: sampledMarkers,
                maxRadius: state.maxRadius ?? 24,
                minRadius: state.minRadius ?? 4,
                name: state.name,
                renderOpacity,
                style,
                type: "bubble",
                xAxisId: state.xAxisId,
                yAxisId: state.yAxisId
            };
            return bubbleScene;
        }

        const scatterScene: ChartScatterSeriesScene = {
            id: state.id,
            markers: sampledMarkers,
            name: state.name,
            pointRadius: state.pointRadius ?? 4,
            renderOpacity,
            style,
            type: "scatter",
            xAxisId: state.xAxisId,
            yAxisId: state.yAxisId
        };
        return scatterScene;
    }
}
