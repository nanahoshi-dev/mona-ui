import type {
    ChartViewportAxisRef,
    ChartViewportLinkGroup
} from "../../models/chart-viewport.models";

export class CartesianViewportLinker {
    public static expandTargetAxesWithLinks(
        primaryTargets: readonly ChartViewportAxisRef[],
        linkGroups: readonly ChartViewportLinkGroup[] | undefined
    ): readonly ChartViewportAxisRef[] {
        if (!linkGroups || linkGroups.length === 0 || primaryTargets.length === 0) {
            return primaryTargets;
        }

        const resultSet = new Map<string, ChartViewportAxisRef>();
        for (const target of primaryTargets) {
            const key = `${target.axis}:${target.axisId}`;
            resultSet.set(key, target);
        }

        for (const target of primaryTargets) {
            for (const group of linkGroups) {
                const isMember = group.axes.some(a => a.axis === target.axis && a.axisId === target.axisId);
                if (isMember) {
                    for (const sibling of group.axes) {
                        const key = `${sibling.axis}:${sibling.axisId}`;
                        if (!resultSet.has(key)) {
                            resultSet.set(key, sibling);
                        }
                    }
                }
            }
        }

        return Array.from(resultSet.values());
    }
}
