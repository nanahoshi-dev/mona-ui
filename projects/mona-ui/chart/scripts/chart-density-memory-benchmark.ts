import { performance } from "node:perf_hooks";
import { buildScalarDensityData } from "../internal/density/cartesian-density-preparer";
import { ChartSeriesMarkIdentityAuthority } from "../internal/animation/chart-series-mark-identity-authority";
import { ChartDensityTracker } from "../internal/layout/chart-density-instrumentation";

interface BenchmarkDataPoint {
    readonly x: number;
    readonly y: number | null;
}

interface BenchmarkResult {
    readonly arrayBuffersAfterTeardown: number;
    readonly arrayBuffersBefore: number;
    readonly dataGenerationMs: number;
    readonly heapUsedAfterTeardown: number;
    readonly heapUsedBefore: number;
    readonly identityBuildMs: number;
    readonly occurrenceRankBuilds: number;
    readonly points: number;
    readonly replacementBuildMs: number;
    readonly replacementReleases: number;
    readonly rssAfterTeardown: number;
    readonly rssBefore: number;
    readonly sourceAuthorityBuilds: number;
    readonly sourceIndexBuildMs: number;
    readonly sourceIndexCapacityBytes: number;
    readonly viewportQueries: number;
    readonly viewportQueryMs: number;
}

function memorySnapshot(): NodeJS.MemoryUsage {
    return process.memoryUsage();
}

function createData(count: number, offset = 0): BenchmarkDataPoint[] {
    return Array.from({ length: count }, (_, index) => ({
        x: index + offset,
        y: index % 97 === 0 ? null : Math.sin(index / 200)
    }));
}

function runBenchmark(points: number): BenchmarkResult {
    const before = memorySnapshot();
    const dataStart = performance.now();
    const data = createData(points);
    const dataGenerationMs = performance.now() - dataStart;
    const sourceIndexStart = performance.now();
    const source = buildScalarDensityData({
        buildGeometryIndex: false,
        data,
        temporal: false,
        xField: "x",
        yField: "y"
    });
    const sourceIndexBuildMs = performance.now() - sourceIndexStart;

    const identityStart = performance.now();
    const identity = new ChartSeriesMarkIdentityAuthority("benchmark", data, {
        extractNaturalKey: (_, index) => source.x[index],
        naturalKeysUnique: true
    });
    const identityBuildMs = performance.now() - identityStart;

    let viewportQueries = 0;
    const viewportStart = performance.now();
    for (let i = 0; i < 50; i++) {
        const start = i * Math.max(1, Math.floor(points / 100));
        source.segmentIndex.findFirstIntersecting(start, start + Math.max(1, Math.floor(points / 10)));
        source.segmentIndex.findLastIntersecting(start, start + Math.max(1, Math.floor(points / 10)));
        viewportQueries += 1;
    }
    const viewportQueryMs = performance.now() - viewportStart;

    const replacementStart = performance.now();
    identity.release("source-replacement");
    const replacementData = createData(points, points);
    const replacementSource = buildScalarDensityData({
        buildGeometryIndex: false,
        data: replacementData,
        temporal: false,
        xField: "x",
        yField: "y"
    });
    const replacementIdentity = new ChartSeriesMarkIdentityAuthority("benchmark", replacementData, {
        extractNaturalKey: (_, index) => replacementSource.x[index],
        naturalKeysUnique: true
    });
    const replacementBuildMs = performance.now() - replacementStart;
    replacementIdentity.release("destroy");
    const tracker = ChartDensityTracker.current;
    const snapshot = tracker?.snapshot;
    const after = memorySnapshot();

    return {
        arrayBuffersAfterTeardown: after.arrayBuffers,
        arrayBuffersBefore: before.arrayBuffers,
        dataGenerationMs,
        heapUsedAfterTeardown: after.heapUsed,
        heapUsedBefore: before.heapUsed,
        identityBuildMs,
        occurrenceRankBuilds: snapshot?.occurrenceRankBuilds ?? 0,
        points,
        replacementBuildMs,
        replacementReleases: snapshot?.sourceGenerationReleases ?? 0,
        rssAfterTeardown: after.rss,
        rssBefore: before.rss,
        sourceAuthorityBuilds: snapshot?.sourceAuthorityBuilds ?? 0,
        sourceIndexCapacityBytes: snapshot?.sourceIndexCapacityBytes ?? 0,
        sourceIndexBuildMs,
        viewportQueries,
        viewportQueryMs
    };
}

for (const points of [10_000, 100_000, 250_000, 1_000_000]) {
    const instrumentation = ChartDensityTracker.install();
    const result = runBenchmark(points);
    ChartDensityTracker.uninstall();
    process.stdout.write(
        `${JSON.stringify({
            ...result,
            sourceIndexBufferAllocations: instrumentation.snapshot.sourceIndexBufferAllocations,
            sourceGenerationReleases: instrumentation.snapshot.sourceGenerationReleases,
            destroyReleases: instrumentation.snapshot.destroyReleases
        })}\n`
    );
}
