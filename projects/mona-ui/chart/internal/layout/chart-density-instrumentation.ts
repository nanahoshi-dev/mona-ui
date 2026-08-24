export type ChartDensityStageCVisitMode = "exact" | "raw" | "sampled";

export interface ChartDensityInstrumentation {
    onBinaryXFallback?(): void;
    onBinaryXQuery?(): void;
    onBlockExtremaVisit?(blocks: number): void;
    onCandidateIndexGenerated?(count?: number): void;
    onContinuityQuery?(): void;
    onDefinedCountPrefixQuery?(): void;
    onDenseRawHitCandidateVisited?(): void;
    onDenseRawHitMaterialized?(): void;
    onDensityRuntimeBuild?(sourceCount: number): void;
    onExactProjectedRowsVisited?(count?: number): void;
    onMarkerCounts?(
        centerVisibleCount: number,
        renderCandidateCount: number,
        selectedCount: number,
        renderedCount: number
    ): void;
    onMemberTimelineRowsScanned?(count?: number): void;
    onOrdinaryGeometryNodeVisited?(): void;
    onOrdinaryTargetEvaluated?(): void;
    onRawIndexBuild?(): void;
    onRawPointsNormalized?(count: number): void;
    onRawSourceRowRead?(count?: number): void;
    onRawStageCSourceRowsVisited?(count?: number): void;
    onSampledPointEmitted?(count: number): void;
    onSampledProjectedRowsVisited?(count?: number): void;
    onSamplingBucketEvaluated?(): void;
    onSegmentIndexQuery?(): void;
    onSegmentVisited?(): void;
    onSegmentsWalkedForExactCount?(count?: number): void;
    onSelectedSegment?(): void;
    onSpatialNodeVisited?(): void;
    onSpatialPointMembershipTested?(count?: number): void;
    onStackCoverageCandidateCheck?(count?: number): void;
    onStackCoverageMemberSearch?(count?: number): void;
    onStackKeyMapLinearScan?(): void;
    onTimelineSemanticQuery?(): void;
    onUnsearchableXFallback?(): void;
    onVisibleRangeQuery?(): void;
    onVisibleSegmentCount?(count: number): void;
}

export interface ChartSynchronizationInstrumentation {
    onRecipientViewportProjection?(): void;
    onSyncMessageCoalesced?(): void;
    onSyncMessageDelivered?(): void;
    onSyncMessagePublished?(kind: "crosshair" | "viewport"): void;
}

interface CartesianDensityCounterSnapshot {
    actualRenderedMarkerCount: number;
    binaryXFallbacks: number;
    binaryXQueries: number;
    blockExtremaVisits: number;
    candidateIndicesGenerated: number;
    centerVisibleCount: number;
    continuityQueries: number;
    definedCountPrefixQueries: number;
    denseRawHitCandidatesVisited: number;
    denseRawHitsMaterialized: number;
    densityRuntimeBuilds: number;
    exactProjectedRowsVisited: number;
    memberTimelineRowsScanned: number;
    ordinaryGeometryNodesVisited: number;
    ordinaryTargetsEvaluated: number;
    rawIndexBuilds: number;
    rawPointsNormalized: number;
    rawSourceRowsRead: number;
    rawStageCSourceRowsVisited: number;
    renderCandidateCount: number;
    sampledPointsEmitted: number;
    sampledProjectedRowsVisited: number;
    samplingBucketsEvaluated: number;
    segmentIndexQueries: number;
    segmentsVisited: number;
    segmentsWalkedForExactCount: number;
    selectedMarkerCount: number;
    selectedSegmentCount: number;
    spatialNodesVisited: number;
    spatialPointMembershipTests: number;
    stackCoverageCandidateChecks: number;
    stackCoverageMemberSearches: number;
    stackKeyMapLinearScans: number;
    timelineSemanticQueries: number;
    unsearchableXFallbacks: number;
    visibleRangeQueries: number;
    visibleSegmentCount: number;
}

interface CartesianSynchronizationCounterSnapshot {
    recipientViewportProjections: number;
    syncMessagesCoalesced: number;
    syncMessagesDelivered: number;
    syncMessagesPublishedCrosshair: number;
    syncMessagesPublishedViewport: number;
}

const emptyDensitySnapshot = (): CartesianDensityCounterSnapshot => ({
    actualRenderedMarkerCount: 0,
    binaryXFallbacks: 0,
    binaryXQueries: 0,
    blockExtremaVisits: 0,
    candidateIndicesGenerated: 0,
    centerVisibleCount: 0,
    continuityQueries: 0,
    denseRawHitCandidatesVisited: 0,
    definedCountPrefixQueries: 0,
    denseRawHitsMaterialized: 0,
    densityRuntimeBuilds: 0,
    exactProjectedRowsVisited: 0,
    memberTimelineRowsScanned: 0,
    ordinaryGeometryNodesVisited: 0,
    ordinaryTargetsEvaluated: 0,
    rawIndexBuilds: 0,
    rawPointsNormalized: 0,
    rawStageCSourceRowsVisited: 0,
    rawSourceRowsRead: 0,
    sampledProjectedRowsVisited: 0,
    renderCandidateCount: 0,
    sampledPointsEmitted: 0,
    samplingBucketsEvaluated: 0,
    selectedMarkerCount: 0,
    selectedSegmentCount: 0,
    segmentsWalkedForExactCount: 0,
    segmentIndexQueries: 0,
    segmentsVisited: 0,
    stackKeyMapLinearScans: 0,
    stackCoverageCandidateChecks: 0,
    stackCoverageMemberSearches: 0,
    spatialNodesVisited: 0,
    spatialPointMembershipTests: 0,
    timelineSemanticQueries: 0,
    unsearchableXFallbacks: 0,
    visibleRangeQueries: 0,
    visibleSegmentCount: 0
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

    public onBinaryXFallback(): void {
        this.snapshot.binaryXFallbacks += 1;
    }

    public onBinaryXQuery(): void {
        this.snapshot.binaryXQueries += 1;
    }

    public onBlockExtremaVisit(blocks: number): void {
        this.snapshot.blockExtremaVisits += blocks;
    }

    public onCandidateIndexGenerated(count = 1): void {
        this.snapshot.candidateIndicesGenerated += count;
    }

    public onContinuityQuery(): void {
        this.snapshot.continuityQueries += 1;
    }

    public onDefinedCountPrefixQuery(): void {
        this.snapshot.definedCountPrefixQueries += 1;
    }

    public onDenseRawHitCandidateVisited(): void {
        this.snapshot.denseRawHitCandidatesVisited += 1;
    }

    public onDenseRawHitMaterialized(): void {
        this.snapshot.denseRawHitsMaterialized += 1;
    }

    public onDensityRuntimeBuild(_sourceCount: number): void {
        this.snapshot.densityRuntimeBuilds += 1;
    }

    public onExactProjectedRowsVisited(count = 1): void {
        this.snapshot.exactProjectedRowsVisited += count;
    }

    public onMarkerCounts(
        centerVisibleCount: number,
        renderCandidateCount: number,
        selectedCount: number,
        renderedCount: number
    ): void {
        this.snapshot.centerVisibleCount = Math.max(this.snapshot.centerVisibleCount, centerVisibleCount);
        this.snapshot.renderCandidateCount = Math.max(this.snapshot.renderCandidateCount, renderCandidateCount);
        this.snapshot.selectedMarkerCount = Math.max(this.snapshot.selectedMarkerCount, selectedCount);
        this.snapshot.actualRenderedMarkerCount = Math.max(this.snapshot.actualRenderedMarkerCount, renderedCount);
    }

    public onMemberTimelineRowsScanned(count = 1): void {
        this.snapshot.memberTimelineRowsScanned += count;
    }

    public onOrdinaryGeometryNodeVisited(): void {
        this.snapshot.ordinaryGeometryNodesVisited += 1;
    }

    public onOrdinaryTargetEvaluated(): void {
        this.snapshot.ordinaryTargetsEvaluated += 1;
    }

    public onRawIndexBuild(): void {
        this.snapshot.rawIndexBuilds += 1;
    }

    public onRawPointsNormalized(count: number): void {
        this.snapshot.rawPointsNormalized += count;
    }

    public onRawSourceRowRead(count = 1): void {
        this.snapshot.rawSourceRowsRead += count;
    }

    public onRawStageCSourceRowsVisited(count = 1): void {
        this.snapshot.rawStageCSourceRowsVisited += count;
    }

    public onSampledPointEmitted(count: number): void {
        this.snapshot.sampledPointsEmitted += count;
    }

    public onSampledProjectedRowsVisited(count = 1): void {
        this.snapshot.sampledProjectedRowsVisited += count;
    }

    public onSamplingBucketEvaluated(): void {
        this.snapshot.samplingBucketsEvaluated += 1;
    }

    public onSegmentIndexQuery(): void {
        this.snapshot.segmentIndexQueries += 1;
    }

    public onSegmentVisited(): void {
        this.snapshot.segmentsVisited += 1;
    }

    public onSegmentsWalkedForExactCount(count = 1): void {
        this.snapshot.segmentsWalkedForExactCount += count;
    }

    public onSelectedSegment(): void {
        this.snapshot.selectedSegmentCount += 1;
    }

    public onSpatialNodeVisited(): void {
        this.snapshot.spatialNodesVisited += 1;
    }

    public onSpatialPointMembershipTested(count = 1): void {
        this.snapshot.spatialPointMembershipTests += count;
    }

    public onStackCoverageCandidateCheck(count = 1): void {
        this.snapshot.stackCoverageCandidateChecks += count;
    }

    public onStackCoverageMemberSearch(count = 1): void {
        this.snapshot.stackCoverageMemberSearches += count;
    }

    public onStackKeyMapLinearScan(): void {
        this.snapshot.stackKeyMapLinearScans += 1;
    }

    public onTimelineSemanticQuery(): void {
        this.snapshot.timelineSemanticQueries += 1;
    }

    public onUnsearchableXFallback(): void {
        this.snapshot.unsearchableXFallbacks += 1;
    }

    public onVisibleRangeQuery(): void {
        this.snapshot.visibleRangeQueries += 1;
    }

    public onVisibleSegmentCount(count: number): void {
        this.snapshot.visibleSegmentCount = Math.max(this.snapshot.visibleSegmentCount, count);
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
    public static current:
        (ChartDensityInstrumentation & { readonly snapshot: CartesianDensityCounterSnapshot }) | null = null;

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
        (ChartSynchronizationInstrumentation & { readonly snapshot: CartesianSynchronizationCounterSnapshot }) | null =
        null;

    public static install(): ChartSynchronizationInstrumentation & {
        readonly snapshot: CartesianSynchronizationCounterSnapshot;
    } {
        const instrumentation = new CountingSynchronizationInstrumentation();
        this.current = instrumentation;
        return instrumentation;
    }

    public static uninstall(): void {
        this.current = null;
    }
}
