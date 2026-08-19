import type {
    ChartBarSeriesRegistration,
    ChartCartesianSeriesRegistration,
    ChartRangeBarSeriesRegistration
} from "../context/chart-registration-context";
import type { CartesianStackLayout } from "../data/cartesian-stack-engine";
import { normalizePositiveNumber } from "../utils/number-utils";

export interface CartesianBarSlot {
    readonly id: string;
    readonly kind: "series" | "stack";
    readonly maxBarWidth?: number;
    readonly seriesIds: readonly string[];
    readonly stackGroup?: string;
}

export interface CartesianBarSlotLayout {
    readonly bySeriesId: ReadonlyMap<string, CartesianBarSlot>;
    readonly slots: readonly CartesianBarSlot[];
}

export class CartesianBarSlots {
    public static computeSlotLayout(
        series: readonly ChartCartesianSeriesRegistration[],
        stackLayout?: CartesianStackLayout,
        invalidSeriesIds?: ReadonlySet<string>
    ): CartesianBarSlotLayout {
        const visibleBarSeries = series.filter(
            (s): s is ChartBarSeriesRegistration | ChartRangeBarSeriesRegistration =>
                s.visible() && (s.type === "bar" || s.type === "rangeBar") && !invalidSeriesIds?.has(s.id)
        );

        const slots: CartesianBarSlot[] = [];
        const bySeriesId = new Map<string, CartesianBarSlot>();
        const seenStackGroups = new Set<string>();

        for (const s of visibleBarSeries) {
            if (s.type === "rangeBar") {
                const slot: CartesianBarSlot = {
                    id: `series:${s.id}`,
                    kind: "series",
                    maxBarWidth: normalizePositiveNumber(s.maxBarWidth?.()),
                    seriesIds: [s.id]
                };
                slots.push(slot);
                bySeriesId.set(s.id, slot);
                continue;
            }

            const rawStack = s.stack?.()?.trim();
            const xAxisId = ("xAxisId" in s && typeof s.xAxisId === "function" ? s.xAxisId() : undefined) ?? "default-x";
            const yAxisId = ("yAxisId" in s && typeof s.yAxisId === "function" ? s.yAxisId() : undefined) ?? "default-y";
            const groupKey = rawStack ? `bar:${xAxisId}:${yAxisId}:${rawStack}` : undefined;
            const stackGroup = groupKey && stackLayout
                ? (stackLayout.groups.find(g => g.id === groupKey) ?? stackLayout.groupBySeriesId.get(s.id))
                : undefined;

            if (rawStack) {
                // If series specifies a stack group, only create a slot if it is a valid stack group
                if (stackGroup) {
                    if (!seenStackGroups.has(stackGroup.id)) {
                        seenStackGroups.add(stackGroup.id);
                        const groupMembers = visibleBarSeries.filter(
                            member => stackGroup.seriesIds.includes(member.id)
                        );
                        let minMaxBarWidth: number | undefined;
                        for (const member of groupMembers) {
                            const w = normalizePositiveNumber(member.maxBarWidth?.());
                            if (w !== undefined) {
                                minMaxBarWidth = minMaxBarWidth !== undefined ? Math.min(minMaxBarWidth, w) : w;
                            }
                        }
                        const slot: CartesianBarSlot = {
                            id: stackGroup.id,
                            kind: "stack",
                            maxBarWidth: minMaxBarWidth,
                            seriesIds: groupMembers.map(m => m.id),
                            stackGroup: stackGroup.name
                        };
                        slots.push(slot);
                        for (const member of groupMembers) {
                            bySeriesId.set(member.id, slot);
                        }
                    }
                }
                // If configured with a stack but no valid group found (e.g. conflicting modes), do NOT create unstacked fallback
            } else {
                const slot: CartesianBarSlot = {
                    id: `series:${s.id}`,
                    kind: "series",
                    maxBarWidth: normalizePositiveNumber(s.maxBarWidth?.()),
                    seriesIds: [s.id]
                };
                slots.push(slot);
                bySeriesId.set(s.id, slot);
            }
        }

        return { bySeriesId, slots };
    }

    public static computeSlots(
        series: readonly ChartCartesianSeriesRegistration[],
        stackLayout?: CartesianStackLayout,
        invalidSeriesIds?: ReadonlySet<string>
    ): readonly CartesianBarSlot[] {
        return this.computeSlotLayout(series, stackLayout, invalidSeriesIds).slots;
    }
}
