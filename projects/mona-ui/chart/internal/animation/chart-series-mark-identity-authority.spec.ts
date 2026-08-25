import { afterEach, describe, expect, it } from "vitest";
import { ChartDensityTracker } from "../layout/chart-density-instrumentation";
import { ChartSeriesMarkIdentityAuthority } from "./chart-series-mark-identity-authority";

describe("ChartSeriesMarkIdentityAuthority", () => {
    afterEach(() => {
        ChartDensityTracker.uninstall();
    });

    it("does not allocate occurrence ranks for unique source keys", () => {
        const instrumentation = ChartDensityTracker.install();
        const authority = new ChartSeriesMarkIdentityAuthority(
            "series-1",
            [{ x: 10 }, { x: 20 }, { x: 30 }],
            { extractNaturalKey: datum => (datum as { x: number }).x }
        );

        expect(authority.occurrenceRankAt(0)).toBe(0);
        expect(authority.occurrenceRankAt(2)).toBe(0);
        expect(instrumentation.snapshot.markIdentityAuthorityBuilds).toBe(1);
        expect(instrumentation.snapshot.occurrenceRankBuilds).toBe(0);
    });

    it("preserves duplicate-key occurrence identity", () => {
        const instrumentation = ChartDensityTracker.install();
        const authority = new ChartSeriesMarkIdentityAuthority(
            "series-1",
            [{ x: "A" }, { x: "A" }, { x: "B" }, { x: "A" }],
            { extractNaturalKey: datum => (datum as { x: string }).x }
        );

        expect([0, 1, 2, 3].map(index => authority.occurrenceRankAt(index))).toEqual([0, 1, 0, 2]);
        expect(authority.resolveKeyAt(0)).toBe(JSON.stringify(["series-1", "s", "A", 0]));
        expect(authority.resolveKeyAt(1)).toBe(JSON.stringify(["series-1", "s", "A", 1]));
        expect(authority.resolveKeyAt(3)).toBe(JSON.stringify(["series-1", "s", "A", 2]));
        expect(instrumentation.snapshot.occurrenceRankBuilds).toBe(1);
    });

    it("uses source indexes directly when no semantic key is configured", () => {
        const instrumentation = ChartDensityTracker.install();
        const authority = new ChartSeriesMarkIdentityAuthority("series-1", [{ x: 10 }, { x: 20 }]);

        expect(authority.occurrenceRankAt(0)).toBe(0);
        expect(authority.occurrenceRankAt(1)).toBe(0);
        expect(instrumentation.snapshot.markIdentityAuthorityBuilds).toBe(1);
        expect(instrumentation.snapshot.occurrenceRankBuilds).toBe(0);
    });

    it("releases reverse lookup and source-dependent state", () => {
        const instrumentation = ChartDensityTracker.install();
        const authority = new ChartSeriesMarkIdentityAuthority(
            "series-1",
            [{ x: "A" }, { x: "A" }],
            { extractNaturalKey: datum => (datum as { x: string }).x }
        );

        expect(
            authority.locate({ occurrenceRank: 1, partType: "s", seriesPrefix: "series-1", value: "A" })
        ).toBe(1);
        authority.release("destroy");
        authority.release("destroy");

        expect(
            authority.locate({ occurrenceRank: 1, partType: "s", seriesPrefix: "series-1", value: "A" })
        ).toBeNull();
        expect(instrumentation.snapshot.destroyReleases).toBe(1);
        expect(instrumentation.snapshot.sourceGenerationReleases).toBe(0);
    });
});
