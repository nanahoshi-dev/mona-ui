import type {
    ChartBarSeriesRegistration,
    ChartCartesianSeriesRegistration
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

export class CartesianBarSlots {
    public static computeSlots(
        series: readonly ChartCartesianSeriesRegistration[],
        stackLayout?: CartesianStackLayout
    ): readonly CartesianBarSlot[] {
        const visibleBarSeries = series.filter(
            (s): s is ChartBarSeriesRegistration => s.visible() && s.type === "bar"
        );

        const slots: CartesianBarSlot[] = [];
        const seenStackGroups = new Set<string>();

        for (const s of visibleBarSeries) {
            const rawStack = s.stack?.()?.trim();
            const groupKey = rawStack ? `bar:${rawStack}` : undefined;
            const stackGroup = groupKey && stackLayout
                ? stackLayout.groups.find(g => g.id === groupKey)
                : undefined;

            if (stackGroup) {
                if (!seenStackGroups.has(stackGroup.id)) {
                    seenStackGroups.add(stackGroup.id);
                    const groupMembers = visibleBarSeries.filter(
                        member => member.stack?.()?.trim() === stackGroup.name
                    );
                    let minMaxBarWidth: number | undefined;
                    for (const member of groupMembers) {
                        const w = normalizePositiveNumber(member.maxBarWidth?.());
                        if (w !== undefined) {
                            minMaxBarWidth = minMaxBarWidth !== undefined ? Math.min(minMaxBarWidth, w) : w;
                        }
                    }
                    slots.push({
                        id: stackGroup.id,
                        kind: "stack",
                        maxBarWidth: minMaxBarWidth,
                        seriesIds: groupMembers.map(m => m.id),
                        stackGroup: stackGroup.name
                    });
                }
            } else {
                slots.push({
                    id: `series:${s.id}`,
                    kind: "series",
                    maxBarWidth: normalizePositiveNumber(s.maxBarWidth?.()),
                    seriesIds: [s.id]
                });
            }
        }

        return slots;
    }
}
