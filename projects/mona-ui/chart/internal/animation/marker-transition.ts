import type { SceneMarker } from "../scene/scene-geometry";
import { lerp } from "./animation-math";

export interface MorphingMarkerPair {
    readonly from: SceneMarker;
    readonly to: SceneMarker;
}

export type TargetMarkerSlot =
    | { readonly from: SceneMarker; readonly kind: "morph"; readonly to: SceneMarker }
    | { readonly kind: "enter"; readonly to: SceneMarker };

export interface MarkerTransitionState {
    readonly entering: readonly SceneMarker[];
    readonly exiting: readonly SceneMarker[];
    readonly key: string;
    readonly morphing: readonly MorphingMarkerPair[];
    readonly targetSlots: readonly TargetMarkerSlot[];
}

export type MarkerEnterExitMode = "both" | "opacity" | "radius";

export class MarkerTransition {
    public static plan(
        key: string,
        fromMarkers: readonly SceneMarker[],
        toMarkers: readonly SceneMarker[]
    ): MarkerTransitionState {
        const fromMap = new Map<string, SceneMarker>();
        for (let i = 0; i < fromMarkers.length; i++) {
            fromMap.set(fromMarkers[i].animationKey, fromMarkers[i]);
        }

        const toMap = new Map<string, SceneMarker>();
        for (let i = 0; i < toMarkers.length; i++) {
            toMap.set(toMarkers[i].animationKey, toMarkers[i]);
        }

        const morphing: MorphingMarkerPair[] = [];
        const entering: SceneMarker[] = [];
        const exiting: SceneMarker[] = [];
        const targetSlots: TargetMarkerSlot[] = [];

        for (let i = 0; i < toMarkers.length; i++) {
            const to = toMarkers[i];
            const from = fromMap.get(to.animationKey);
            if (from) {
                const pair: MorphingMarkerPair = { from, to };
                morphing.push(pair);
                targetSlots.push({ from, kind: "morph", to });
            } else {
                entering.push(to);
                targetSlots.push({ kind: "enter", to });
            }
        }

        for (let i = 0; i < fromMarkers.length; i++) {
            const from = fromMarkers[i];
            if (!toMap.has(from.animationKey)) {
                exiting.push(from);
            }
        }

        return {
            entering,
            exiting,
            key,
            morphing,
            targetSlots
        };
    }

    public static sample(
        state: MarkerTransitionState,
        progress: number,
        mode: MarkerEnterExitMode = "both"
    ): readonly SceneMarker[] {
        const p = Math.max(0, Math.min(1, progress));
        const sampled: SceneMarker[] = [];

        // 1. Exiting markers sampled in background (scale down radius and/or fade out opacity)
        const exitP = 1 - p;
        for (let i = 0; i < state.exiting.length; i++) {
            const m = state.exiting[i];
            const baseOpacity = m.renderOpacity ?? 1;
            const radius = mode === "opacity" ? m.radius : m.radius * exitP;
            const renderOpacity = mode === "radius" ? baseOpacity : baseOpacity * exitP;

            if (radius > 0 && renderOpacity > 0) {
                sampled.push({
                    animationKey: m.animationKey,
                    datum: m.datum,
                    formattedSize: m.formattedSize,
                    index: m.index,
                    radius: Math.max(0, radius),
                    renderOpacity: Math.max(0, Math.min(1, renderOpacity)),
                    sizeValue: m.sizeValue,
                    x: m.x,
                    xValue: m.xValue,
                    y: m.y,
                    yValue: m.yValue
                });
            }
        }

        // 2. Target markers in exact slot order (morphing or entering)
        for (let i = 0; i < state.targetSlots.length; i++) {
            const slot = state.targetSlots[i];
            if (slot.kind === "morph") {
                const { from, to } = slot;
                const x = lerp(from.x, to.x, p);
                const y = lerp(from.y, to.y, p);
                const radius = lerp(from.radius, to.radius, p);
                const fromOpacity = from.renderOpacity ?? 1;
                const toOpacity = to.renderOpacity ?? 1;
                const renderOpacity = lerp(fromOpacity, toOpacity, p);

                sampled.push({
                    animationKey: to.animationKey,
                    datum: to.datum,
                    formattedSize: to.formattedSize,
                    index: to.index,
                    radius: Math.max(0, radius),
                    renderOpacity: Math.max(0, Math.min(1, renderOpacity)),
                    sizeValue: to.sizeValue,
                    x,
                    xValue: to.xValue,
                    y,
                    yValue: to.yValue
                });
            } else {
                const m = slot.to;
                const baseOpacity = m.renderOpacity ?? 1;
                const radius = mode === "opacity" ? m.radius : m.radius * p;
                const renderOpacity = mode === "radius" ? baseOpacity : baseOpacity * p;

                if (radius > 0 && renderOpacity > 0) {
                    sampled.push({
                        animationKey: m.animationKey,
                        datum: m.datum,
                        formattedSize: m.formattedSize,
                        index: m.index,
                        radius: Math.max(0, radius),
                        renderOpacity: Math.max(0, Math.min(1, renderOpacity)),
                        sizeValue: m.sizeValue,
                        x: m.x,
                        xValue: m.xValue,
                        y: m.y,
                        yValue: m.yValue
                    });
                }
            }
        }

        return sampled;
    }
}
