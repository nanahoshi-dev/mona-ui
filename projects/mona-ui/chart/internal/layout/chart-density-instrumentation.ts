export interface ChartDensityInstrumentation {
    onDensityRuntimeBuild?(sourceCount: number): void;
    onRawPointsNormalized?(count: number): void;
    onVisibleRangeQuery?(): void;
    onBlockExtremaVisit?(blocks: number): void;
    onSamplingBucketEvaluated?(): void;
    onSampledPointEmitted?(count: number): void;
    onDenseRawHitMaterialized?(): void;
    onSpatialNodeVisited?(): void;
}

export interface ChartSynchronizationInstrumentation {
    onSyncMessagePublished?(kind: "crosshair" | "viewport"): void;
    onSyncMessageCoalesced?(): void;
    onSyncMessageDelivered?(): void;
    onRecipientViewportProjection?(): void;
}

interface CartesianDensityCounterSnapshot {
    blockExtremaVisits: number;
    denseRawHitsMaterialized: number;
    densityRuntimeBuilds: number;
    rawPointsNormalized: number;
    sampledPointsEmitted: number;
    samplingBucketsEvaluated: number;
    spatialNodesVisited: number;
    visibleRangeQueries: number;
}

interface CartesianSynchronizationCounterSnapshot {
    syncMessagesCoalesced: number;
    syncMessagesDelivered: number;
    syncMessagesPublishedCrosshair: number;
    syncMessagesPublishedViewport: number;
    recipientViewportProjections: number;
}

const emptyDensitySnapshot = (): CartesianDensityCounterSnapshot => ({
    blockExtremaVisits: 0,
    denseRawHitsMaterialized: 0,
    densityRuntimeBuilds: 0,
    rawPointsNormalized: 0,
    sampledPointsEmitted: 0,
    samplingBucketsEvaluated: 0,
    spatialNodesVisited: 0,
    visibleRangeQueries: 0
});

const emptySynchronizationSnapshot = (): CartesianSynchronizationCounterSnapshot => ({
    recipientViewportProjections: 0,
    syncMessagesCoalesced: 0,
    syncMessagesDelivered: 0,
    syncMessagesPublishedCrosshair: 0,
    syncMessagesPublishedViewport: 0
});

class CountingDensityInstrumentation implements ChartDensityInstrumentation {
    public readonly snapshot = emptyDensitySnapshot();

    public onBlockExtremaVisit(blocks: number): void {
        this.snapshot.blockExtremaVisits += blocks;
    }

    public onDensityRuntimeBuild(_sourceCount: number): void {
        this.snapshot.densityRuntimeBuilds += 1;
    }

    public onDenseRawHitMaterialized(): void {
        this.snapshot.denseRawHitsMaterialized += 1;
    }

    public onRawPointsNormalized(count: number): void {
        this.snapshot.rawPointsNormalized += count;
    }

    public onSampledPointEmitted(count: number): void {
        this.snapshot.sampledPointsEmitted += count;
    }

    public onSamplingBucketEvaluated(): void {
        this.snapshot.samplingBucketsEvaluated += 1;
    }

    public onSpatialNodeVisited(): void {
        this.snapshot.spatialNodesVisited += 1;
    }

    public onVisibleRangeQuery(): void {
        this.snapshot.visibleRangeQueries += 1;
    }
}

class CountingSynchronizationInstrumentation implements ChartSynchronizationInstrumentation {
    public readonly snapshot = emptySynchronizationSnapshot();

    public onRecipientViewportProjection(): void {
        this.snapshot.recipientViewportProjections += 1;
    }

    public onSyncMessageCoalesced(): void {
        this.snapshot.syncMessagesCoalesced += 1;
    }

    public onSyncMessageDelivered(): void {
        this.snapshot.syncMessagesDelivered += 1;
    }

    public onSyncMessagePublished(kind: "crosshair" | "viewport"): void {
        if (kind === "viewport") {
            this.snapshot.syncMessagesPublishedViewport += 1;
        } else {
            this.snapshot.syncMessagesPublishedCrosshair += 1;
        }
    }
}

export class ChartDensityTracker {
    public static current: (ChartDensityInstrumentation & { readonly snapshot: CartesianDensityCounterSnapshot }) | null = null;

    public static install(): ChartDensityInstrumentation & { readonly snapshot: CartesianDensityCounterSnapshot } {
        const instrumentation = new CountingDensityInstrumentation();
        this.current = instrumentation;
        return instrumentation;
    }

    public static uninstall(): void {
        this.current = null;
    }
}

export class ChartSynchronizationTracker {
    public static current:
        | (ChartSynchronizationInstrumentation & { readonly snapshot: CartesianSynchronizationCounterSnapshot })
        | null = null;

    public static install():
        | ChartSynchronizationInstrumentation
        & { readonly snapshot: CartesianSynchronizationCounterSnapshot } {
        const instrumentation = new CountingSynchronizationInstrumentation();
        this.current = instrumentation;
        return instrumentation;
    }

    public static uninstall(): void {
        this.current = null;
    }
}
