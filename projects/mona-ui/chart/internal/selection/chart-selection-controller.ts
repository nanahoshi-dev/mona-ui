import type {
    ChartSelectedPoint,
    ChartSelectionChangeEvent,
    ChartSelectionChangeSource,
    ChartSelectionMode
} from "../../models/chart-selection.models";
import type { ChartBrushSelectionBehavior } from "../../models/chart-brush.models";
import type { SceneHitTarget } from "../scene/scene-geometry";
import type { CartesianXYChartScene } from "../scene/chart-scene";
import { ChartMarkIdentityResolver } from "../interaction/chart-mark-identity-resolver";
import { CartesianMarkSemanticResolver } from "../interaction/cartesian-mark-semantic-resolver";
import type { ChartVisibleMarkIndex } from "../interaction/chart-visible-mark-index";

export interface SelectionMutationResult {
    readonly added: readonly string[];
    readonly next: readonly string[];
    readonly removed: readonly string[];
}

export function toSelectedPoint<T = unknown>(
    hit: SceneHitTarget,
    scene?: CartesianXYChartScene | null
): ChartSelectedPoint<T> {
    const markId = ChartMarkIdentityResolver.resolve(hit);
    const fromValue = hit.fromValue ?? hit.range?.fromValue;
    const toValue = hit.toValue ?? hit.range?.toValue;
    const isRange = hit.valueKind === "range" || hit.range !== undefined;

    const scalarAxes = CartesianMarkSemanticResolver.resolveScalarAxes(hit, scene);
    const xValue = scalarAxes.xValue;
    const yValue = scalarAxes.yValue;

    const value =
        hit.value ??
        (isRange && fromValue !== undefined && toValue !== undefined
            ? [fromValue, toValue]
            : (hit.hierarchy?.aggregateValue ?? hit.yValue));

    return {
        close: hit.close ?? hit.financial?.close,
        dataIndex: hit.dataIndex ?? hit.index ?? 0,
        datum: hit.datum as T,
        fromValue,
        high: hit.high ?? hit.financial?.high,
        low: hit.low ?? hit.financial?.low,
        markId,
        open: hit.open ?? hit.financial?.open,
        rawValue: hit.rawValue,
        seriesId: hit.seriesId,
        seriesName: hit.seriesName,
        seriesType: hit.seriesType,
        stackEnd: hit.stackEnd,
        stackPercentage: hit.stackPercentage ?? hit.percentage,
        stackStart: hit.stackStart,
        toValue,
        value,
        xValue,
        yValue
    };
}

export class ChartSelectionController {
    public static applyBrush(
        current: readonly string[],
        matchedIds: readonly string[],
        behavior: ChartBrushSelectionBehavior,
        mode: ChartSelectionMode
    ): SelectionMutationResult {
        const normalizedMatched = ChartSelectionController.normalize(matchedIds);

        if (behavior === "none") {
            return { added: [], next: current, removed: [] };
        }

        let effectiveMatched = normalizedMatched;
        if (mode === "single" && effectiveMatched.length > 1) {
            effectiveMatched = [effectiveMatched[0]];
        }

        let next: readonly string[] = current;

        switch (behavior) {
            case "replace": {
                next = effectiveMatched;
                break;
            }
            case "add": {
                if (mode === "single") {
                    next = effectiveMatched.length > 0 ? [effectiveMatched[0]] : current;
                } else {
                    next = ChartSelectionController.normalize([...current, ...effectiveMatched]);
                }
                break;
            }
            case "remove": {
                const removeSet = new Set(effectiveMatched);
                next = current.filter(id => !removeSet.has(id));
                break;
            }
            case "toggle": {
                if (mode === "single") {
                    if (effectiveMatched.length === 0) {
                        next = current;
                    } else {
                        const targetId = effectiveMatched[0];
                        next = current.includes(targetId) ? [] : [targetId];
                    }
                } else {
                    const currentSet = new Set(current);
                    const toggleSet = new Set(effectiveMatched);
                    const result: string[] = [];

                    for (const id of current) {
                        if (!toggleSet.has(id)) {
                            result.push(id);
                        }
                    }
                    for (const id of effectiveMatched) {
                        if (!currentSet.has(id)) {
                            result.push(id);
                        }
                    }
                    next = result;
                }
                break;
            }
        }

        return ChartSelectionController.diff(current, next);
    }

    public static applyClear(current: readonly string[]): SelectionMutationResult {
        if (current.length === 0) {
            return { added: [], next: [], removed: [] };
        }
        return {
            added: [],
            next: [],
            removed: [...current]
        };
    }

    public static applyClick(
        current: readonly string[],
        clickedId: string,
        mode: ChartSelectionMode
    ): SelectionMutationResult {
        if (!clickedId) {
            return { added: [], next: current, removed: [] };
        }

        if (mode === "single") {
            if (current.length === 1 && current[0] === clickedId) {
                return { added: [], next: current, removed: [] };
            }
            return {
                added: [clickedId],
                next: [clickedId],
                removed: current.filter(id => id !== clickedId)
            };
        }

        // multiple mode
        const index = current.indexOf(clickedId);
        if (index >= 0) {
            const next = current.filter(id => id !== clickedId);
            return {
                added: [],
                next,
                removed: [clickedId]
            };
        } else {
            const next = [...current, clickedId];
            return {
                added: [clickedId],
                next,
                removed: []
            };
        }
    }

    public static buildChangeEvent<T = unknown>(
        source: ChartSelectionChangeSource,
        mutation: SelectionMutationResult,
        previousSelectedMarkIds: readonly string[],
        visibleIndex: ChartVisibleMarkIndex,
        changedHits?: readonly SceneHitTarget[],
        scene?: CartesianXYChartScene | null
    ): ChartSelectionChangeEvent<T> {
        const visibleSelectedPoints: ChartSelectedPoint<T>[] = [];
        for (const id of mutation.next) {
            const hit = visibleIndex.get(id);
            if (hit) {
                visibleSelectedPoints.push(toSelectedPoint<T>(hit, scene));
            }
        }

        let changedPoints: ChartSelectedPoint<T>[] = [];
        if (changedHits && changedHits.length > 0) {
            changedPoints = changedHits.map(h => toSelectedPoint<T>(h, scene));
        } else {
            const affectedIds = new Set([...mutation.added, ...mutation.removed]);
            for (const id of affectedIds) {
                const hit = visibleIndex.get(id);
                if (hit) {
                    changedPoints.push(toSelectedPoint<T>(hit, scene));
                }
            }
        }

        return {
            addedMarkIds: mutation.added,
            changedPoints,
            previousSelectedMarkIds,
            removedMarkIds: mutation.removed,
            selectedMarkIds: mutation.next,
            source,
            visibleSelectedPoints
        };
    }

    public static diff(previous: readonly string[], next: readonly string[]): SelectionMutationResult {
        const prevSet = new Set(previous);
        const nextSet = new Set(next);

        const added = next.filter(id => !prevSet.has(id));
        const removed = previous.filter(id => !nextSet.has(id));

        return { added, next, removed };
    }

    public static normalize(ids: readonly string[] | undefined): readonly string[] {
        if (!ids || ids.length === 0) {
            return [];
        }

        const seen = new Set<string>();
        const result: string[] = [];

        for (const id of ids) {
            if (id && !seen.has(id)) {
                seen.add(id);
                result.push(id);
            }
        }

        return result;
    }

    public static normalizeForMode(ids: readonly string[] | undefined, mode: ChartSelectionMode): readonly string[] {
        const normalized = ChartSelectionController.normalize(ids);
        if (mode === "single" && normalized.length > 1) {
            return [normalized[0]];
        }
        return normalized;
    }
}
