import type {
    ChartAreaSeriesRegistration,
    ChartBarSeriesRegistration,
    ChartCartesianSeriesRegistration
} from "../context/chart-registration-context";
import type { ChartXAxisType } from "../../models/chart-axis.models";
import type { ChartField } from "../../models/chart.models";
import type { ChartStackMode } from "../../models/chart-stack.models";
import type { ResolvedChartCartesianAxisType } from "../scale/chart-scale";
import type { ChartInteractionXKey } from "../scene/scene-geometry";
import { ChartMarkKeyResolver } from "../animation/animation-identity";
import { isFiniteNumber } from "../utils/number-utils";
import type { ChartDiagnostic } from "../utils/chart-diagnostics";
import { resolveData, resolveValue } from "./chart-value-resolver";
import { isCartesianSeriesCompatibleWithXAxisType } from "./chart-domain";
import { resolveCartesianTemporalValue } from "./cartesian-temporal-value-resolver";

export type StackableCartesianSeriesRegistration = ChartAreaSeriesRegistration | ChartBarSeriesRegistration;

type MutableStackPosition = { stackPosition?: "inner" | "outer" | "single" };

type SeriesWithOptionalAxisId = { xAxisId?: () => string; yAxisId?: () => string };

export interface CartesianStackEntry {
    readonly animationKey: string;
    readonly dataIndex: number;
    readonly datum: unknown;
    readonly defined: boolean;
    readonly rawValue: number;
    readonly stackEnd: number;
    readonly stackPercentage?: number;
    readonly stackPosition?: "inner" | "outer" | "single";
    readonly stackStart: number;
    readonly stackTotal?: number;
    readonly synthetic: boolean;
    readonly visualValue: number;
    readonly xKey: ChartInteractionXKey;
    readonly xValue: unknown;
}

export interface CartesianStackGroup {
    readonly geometryType: "area" | "bar";
    readonly hasNegative: boolean;
    readonly hasPositive: boolean;
    readonly id: string;
    readonly mode: ChartStackMode;
    readonly name: string;
    readonly seriesIds: readonly string[];
    readonly xAxisId: string;
    readonly xKeys: readonly ChartInteractionXKey[];
    readonly yAxisId: string;
}

export interface RegisteredStackMembership {
    readonly geometryType: "area" | "bar";
    readonly groupId: string;
    readonly groupName: string;
    readonly mode: ChartStackMode;
    readonly seriesId: string;
    readonly valid: boolean;
    readonly xAxisId: string;
    readonly yAxisId: string;
}

export interface RegisteredCartesianStackGroup {
    readonly geometryType: "area" | "bar";
    readonly id: string;
    readonly mode: ChartStackMode;
    readonly name: string;
    readonly registeredHasNegative: boolean;
    readonly registeredHasPositive: boolean;
    readonly registeredSeriesIds: readonly string[];
    readonly valid: boolean;
    readonly xAxisId: string;
    readonly yAxisId: string;
}

export interface CartesianStackConfiguration {
    readonly groups: readonly RegisteredCartesianStackGroup[];
    readonly membershipBySeriesId: ReadonlyMap<string, RegisteredStackMembership>;
    readonly signature: string;
}

export interface CartesianStackLayout {
    readonly bySeriesId: ReadonlyMap<string, ReadonlyMap<ChartInteractionXKey, CartesianStackEntry>>;
    readonly groupBySeriesId: ReadonlyMap<string, CartesianStackGroup>;
    readonly groups: readonly CartesianStackGroup[];
    readonly hasNormalStacks: boolean;
    readonly hasPercentStacks: boolean;
    readonly orderedBySeriesId: ReadonlyMap<string, readonly CartesianStackEntry[]>;
    readonly visibleHasNegative: boolean;
    readonly visibleHasPositive: boolean;
    readonly yExtent: readonly [number, number];
}

export type CartesianVisibleYUnitMode = "invalid" | "none" | "normal-stack" | "percent-stack" | "raw";

export type CartesianAxisUnitMode = "percent" | "raw";

export interface CartesianValueAxisStackState {
    readonly extent: readonly [number, number];
    readonly groupIds: readonly string[];
    readonly hasNegative: boolean;
    readonly hasPositive: boolean;
    readonly unitMode: "invalid" | "none" | "percent" | "raw";
}

export interface CartesianStackAnalysis {
    readonly axisUnitMode: CartesianAxisUnitMode;
    readonly configuration: CartesianStackConfiguration;
    readonly diagnostics: readonly ChartDiagnostic[];
    readonly invalidGroupIds: ReadonlySet<string>;
    readonly invalidSeriesIds: ReadonlySet<string>;
    readonly layout: CartesianStackLayout;
    readonly visibleLayout: CartesianStackLayout;
    readonly visibleYUnitMode: CartesianVisibleYUnitMode;
    readonly yUnitMode: "invalid" | "normal" | "percent" | "raw";
}

export interface CartesianStackCoordinationResult {
    readonly analysisByGroupId: ReadonlyMap<string, CartesianStackAnalysis>;
    readonly analysisBySeriesId: ReadonlyMap<string, CartesianStackAnalysis>;
    readonly configuration: CartesianStackConfiguration;
    readonly diagnostics: readonly ChartDiagnostic[];
    readonly invalidGroupIds: ReadonlySet<string>;
    readonly invalidSeriesIds: ReadonlySet<string>;
    readonly layout: CartesianStackLayout;
    readonly valueAxisState: {
        readonly x: ReadonlyMap<string, CartesianValueAxisStackState>;
        readonly y: ReadonlyMap<string, CartesianValueAxisStackState>;
    };
    readonly visibleLayout: CartesianStackLayout;
}

export interface CartesianStackEngineOptions {
    readonly orientation?: "horizontal" | "vertical";
    readonly primaryXAxisId?: string;
    readonly primaryYAxisId?: string;
    readonly resolvedXAxisTypeByAxisId?: ReadonlyMap<string, ResolvedChartCartesianAxisType>;
    readonly resolvedYAxisTypeByAxisId?: ReadonlyMap<string, ResolvedChartCartesianAxisType>;
    readonly rootData: readonly unknown[];
    readonly rootXField?: ChartField;
    readonly series: readonly ChartCartesianSeriesRegistration[];
    readonly xAxisType?: ChartXAxisType;
}

interface RawDatumRecord {
    readonly animationKey: string;
    readonly dataIndex: number;
    readonly datum: unknown;
    readonly rawValue: number;
    readonly xKey: ChartInteractionXKey;
    readonly xValue: unknown;
}

export class CartesianStackEngine {
    public static computeAnalysis(options: CartesianStackEngineOptions): CartesianStackAnalysis {
        const coord = this.computeCoordination(options);
        const targetValueAxisId =
            options.orientation === "horizontal"
                ? (options.primaryXAxisId ?? "default-x")
                : (options.primaryYAxisId ?? "default-y");
        const targetState = (options.orientation === "horizontal"
            ? coord.valueAxisState.x.get(targetValueAxisId)
            : coord.valueAxisState.y.get(targetValueAxisId)) ?? {
            extent: [0, 0] as [number, number],
            groupIds: [],
            hasNegative: false,
            hasPositive: false,
            unitMode: "raw" as const
        };

        const visibleSeriesOnTargetAxis = options.series.filter(s => {
            const sAxisId =
                options.orientation === "horizontal"
                    ? (("xAxisId" in s && typeof (s as SeriesWithOptionalAxisId).xAxisId === "function"
                          ? (s as SeriesWithOptionalAxisId).xAxisId!()
                          : undefined) ??
                      options.primaryXAxisId ??
                      "default-x")
                    : (("yAxisId" in s && typeof (s as SeriesWithOptionalAxisId).yAxisId === "function"
                          ? (s as SeriesWithOptionalAxisId).yAxisId!()
                          : undefined) ??
                      options.primaryYAxisId ??
                      "default-y");
            return sAxisId === targetValueAxisId && s.visible();
        });

        const axisUnitMode: CartesianAxisUnitMode = targetState.unitMode === "percent" ? "percent" : "raw";
        const visibleYUnitMode: CartesianVisibleYUnitMode =
            visibleSeriesOnTargetAxis.length === 0
                ? "none"
                : targetState.unitMode === "percent"
                  ? "percent-stack"
                  : targetState.unitMode === "invalid"
                    ? "invalid"
                    : coord.layout.hasNormalStacks
                      ? "normal-stack"
                      : "raw";

        return {
            axisUnitMode,
            configuration: coord.configuration,
            diagnostics: coord.diagnostics,
            invalidGroupIds: coord.invalidGroupIds,
            invalidSeriesIds: coord.invalidSeriesIds,
            layout: coord.layout,
            visibleLayout: coord.visibleLayout,
            visibleYUnitMode,
            yUnitMode:
                targetState.unitMode === "percent"
                    ? "percent"
                    : targetState.unitMode === "invalid"
                      ? "invalid"
                      : "normal"
        };
    }

    public static computeCoordination(options: CartesianStackEngineOptions): CartesianStackCoordinationResult {
        const { orientation = "vertical", rootData, rootXField, series, xAxisType = "category" } = options;
        const diagnostics: ChartDiagnostic[] = [];

        // 1. Discover registered stack groups across stackable series
        const registeredGroupMap = new Map<
            string,
            {
                geometryType: "area" | "bar";
                name: string;
                seriesList: StackableCartesianSeriesRegistration[];
                xAxisId: string;
                yAxisId: string;
            }
        >();

        for (const s of series) {
            if (s.type !== "bar" && s.type !== "area") {
                continue;
            }
            const stackable = s as StackableCartesianSeriesRegistration;
            const rawStackInput = stackable.stack?.();
            const rawModeInput = stackable.stackMode?.();

            if (typeof rawStackInput === "string" && rawStackInput.length > 0 && !rawStackInput.trim()) {
                diagnostics.push({
                    code: "empty-stack-group",
                    message: `Series "${s.name()}" specifies a whitespace-only stack name. It will be treated as unstacked.`,
                    severity: "warning",
                    signature: `empty-group:${s.id}`
                });
            }

            const trimmedStack = rawStackInput?.trim();
            if (!trimmedStack) {
                if (rawModeInput && rawModeInput !== "normal") {
                    diagnostics.push({
                        code: "stack-mode-without-group",
                        message: `Series "${s.name()}" specifies stackMode="${rawModeInput}" without a valid stack group name. Stacking mode will have no effect.`,
                        severity: "warning",
                        signature: `mode-without-group:${s.id}`
                    });
                }
                continue;
            }

            const xAxisId =
                ("xAxisId" in stackable && typeof stackable.xAxisId === "function" ? stackable.xAxisId() : undefined) ??
                options.primaryXAxisId ??
                "default-x";
            const yAxisId =
                ("yAxisId" in stackable && typeof stackable.yAxisId === "function" ? stackable.yAxisId() : undefined) ??
                options.primaryYAxisId ??
                "default-y";

            // Check compatibility with group's independent axis type
            const indepType =
                orientation === "horizontal"
                    ? (options.resolvedYAxisTypeByAxisId?.get(yAxisId) ?? "category")
                    : (options.resolvedXAxisTypeByAxisId?.get(xAxisId) ?? xAxisType ?? "category");

            if (
                !isCartesianSeriesCompatibleWithXAxisType(
                    s.type,
                    indepType as ChartXAxisType | ResolvedChartCartesianAxisType
                )
            ) {
                continue;
            }

            const groupKey = `${stackable.type}:${xAxisId}:${yAxisId}:${trimmedStack}`;

            let groupRecord = registeredGroupMap.get(groupKey);
            if (!groupRecord) {
                groupRecord = {
                    geometryType: stackable.type,
                    name: trimmedStack,
                    seriesList: [],
                    xAxisId,
                    yAxisId
                };
                registeredGroupMap.set(groupKey, groupRecord);
            }
            groupRecord.seriesList.push(stackable);
        }

        const registeredGroups: RegisteredCartesianStackGroup[] = [];
        const membershipBySeriesId = new Map<string, RegisteredStackMembership>();
        const invalidGroupIds = new Set<string>();
        const invalidSeriesIds = new Set<string>();

        for (const [groupKey, groupInfo] of registeredGroupMap) {
            const { geometryType, name, seriesList, xAxisId, yAxisId } = groupInfo;
            const firstMode: ChartStackMode = seriesList[0]?.stackMode?.() ?? "normal";
            const hasConflict = seriesList.some(s => (s.stackMode?.() ?? "normal") !== firstMode);

            if (hasConflict) {
                invalidGroupIds.add(groupKey);
                for (const s of seriesList) {
                    invalidSeriesIds.add(s.id);
                }
                diagnostics.push({
                    code: "conflicting-stack-mode",
                    message: `Stack group "${name}" (${geometryType}) contains conflicting stackMode values among series [${seriesList.map(s => s.name()).join(", ")}]. Stack geometry for this group was omitted.`,
                    severity: "warning",
                    signature: `conflicting-mode:${groupKey}`
                });
            }

            // Enforce linear scale on actual value axis
            const valueAxisId = orientation === "horizontal" ? xAxisId : yAxisId;
            const valueAxisType =
                orientation === "horizontal"
                    ? (options.resolvedXAxisTypeByAxisId?.get(xAxisId) ?? "linear")
                    : (options.resolvedYAxisTypeByAxisId?.get(yAxisId) ?? "linear");

            if (valueAxisType !== "linear") {
                invalidGroupIds.add(groupKey);
                for (const s of seriesList) {
                    invalidSeriesIds.add(s.id);
                }
                diagnostics.push({
                    code: "nonlinear-stack-value-axis",
                    message: `Stack group "${name}" on axis "${valueAxisId}" uses non-linear scale "${valueAxisType}". Stacking is only supported on linear value axes.`,
                    severity: "warning",
                    signature: `nonlinear-stack:${groupKey}`
                });
            }

            const isValid = !hasConflict && valueAxisType === "linear";

            let regHasPos = false;
            let regHasNeg = false;
            for (const s of seriesList) {
                const sData = resolveData(s.data(), rootData);
                const sField = s.field();
                for (let i = 0; i < sData.length; i++) {
                    const y = resolveValue(sData[i], sField, i);
                    if (isFiniteNumber(y)) {
                        if (y > 0) regHasPos = true;
                        if (y < 0) regHasNeg = true;
                    }
                }
            }

            const regGroup: RegisteredCartesianStackGroup = {
                geometryType,
                id: groupKey,
                mode: firstMode,
                name,
                registeredHasNegative: regHasNeg,
                registeredHasPositive: regHasPos,
                registeredSeriesIds: seriesList.map(s => s.id),
                valid: isValid,
                xAxisId,
                yAxisId
            };
            registeredGroups.push(regGroup);

            for (const s of seriesList) {
                membershipBySeriesId.set(s.id, {
                    geometryType,
                    groupId: groupKey,
                    groupName: name,
                    mode: firstMode,
                    seriesId: s.id,
                    valid: isValid,
                    xAxisId,
                    yAxisId
                });
            }
        }

        const configSignature = JSON.stringify(
            registeredGroups.map(g => ({
                geometryType: g.geometryType,
                id: g.id,
                mode: g.mode,
                name: g.name,
                series: g.registeredSeriesIds,
                valid: g.valid,
                xAxisId: g.xAxisId,
                yAxisId: g.yAxisId
            }))
        );

        const configuration: CartesianStackConfiguration = {
            groups: registeredGroups,
            membershipBySeriesId,
            signature: configSignature
        };

        // 2. Process visible layout for valid groups
        const visibleGroups: CartesianStackGroup[] = [];
        const bySeriesId = new Map<string, Map<ChartInteractionXKey, CartesianStackEntry>>();
        const orderedBySeriesId = new Map<string, CartesianStackEntry[]>();
        const groupBySeriesId = new Map<string, CartesianStackGroup>();

        let globalMinY = 0;
        let globalMaxY = 0;
        let visibleHasPositive = false;
        let visibleHasNegative = false;
        let hasNormalStacks = false;
        let hasPercentStacks = false;

        const warnedDuplicateKeys = new Set<string>();

        // Track extents per value axis
        const axisMinMax = new Map<string, { hasNeg: boolean; hasPos: boolean; max: number; min: number }>();

        for (const [groupKey, groupInfo] of registeredGroupMap) {
            if (invalidGroupIds.has(groupKey)) {
                continue;
            }

            const { geometryType, name, seriesList, xAxisId, yAxisId } = groupInfo;
            const visibleMembers = seriesList.filter(s => s.visible());
            if (visibleMembers.length === 0) {
                continue;
            }

            const groupMode: ChartStackMode = seriesList[0]?.stackMode?.() ?? "normal";
            if (groupMode === "percent") {
                hasPercentStacks = true;
            } else {
                hasNormalStacks = true;
            }

            const groupIndepAxisType =
                orientation === "horizontal"
                    ? (options.resolvedYAxisTypeByAxisId?.get(yAxisId) ?? "category")
                    : (options.resolvedXAxisTypeByAxisId?.get(xAxisId) ?? xAxisType ?? "category");

            const valueAxisId = orientation === "horizontal" ? xAxisId : yAxisId;
            let axisEntry = axisMinMax.get(valueAxisId);
            if (!axisEntry) {
                axisEntry = { hasNeg: false, hasPos: false, max: 0, min: 0 };
                axisMinMax.set(valueAxisId, axisEntry);
            }

            // Extract records per series
            const seriesRecordsMap = new Map<string, Map<ChartInteractionXKey, RawDatumRecord>>();
            const groupXKeyOrder: ChartInteractionXKey[] = [];
            const groupXKeySet = new Set<ChartInteractionXKey>();

            for (const s of visibleMembers) {
                const sData = resolveData(s.data(), rootData);
                const sXField =
                    orientation === "horizontal" ? (s.xField?.() ?? rootXField) : (s.xField?.() ?? rootXField);
                const sField = s.field();
                const keyResolver = new ChartMarkKeyResolver(s.id, s.keyField?.(), s.seriesKey?.());
                const sRecords = new Map<ChartInteractionXKey, RawDatumRecord>();

                for (let dIdx = 0; dIdx < sData.length; dIdx++) {
                    const datum = sData[dIdx];
                    const xVal = resolveValue(datum, sXField, dIdx);
                    const yVal = resolveValue(datum, sField, dIdx);

                    const xKey = this.resolveNormalizedXKey(
                        xVal,
                        dIdx,
                        groupIndepAxisType as ChartXAxisType | ResolvedChartCartesianAxisType
                    );
                    if (xKey === undefined) {
                        continue;
                    }

                    if (!groupXKeySet.has(xKey)) {
                        groupXKeySet.add(xKey);
                        groupXKeyOrder.push(xKey);
                    }

                    if (!isFiniteNumber(yVal)) {
                        continue;
                    }

                    if (sRecords.has(xKey)) {
                        const warnId = `${s.id}:${String(xKey)}`;
                        if (!warnedDuplicateKeys.has(warnId)) {
                            warnedDuplicateKeys.add(warnId);
                            diagnostics.push({
                                code: "duplicate-x-mark",
                                message: `Series "${s.name()}" has duplicate valid coordinate "${String(xKey)}". Later duplicates are skipped for stack layout.`,
                                severity: "warning",
                                signature: `duplicate-x:${warnId}`
                            });
                        }
                        continue;
                    }

                    const animationKey = keyResolver.resolveKey(datum, xKey, dIdx);
                    sRecords.set(xKey, {
                        animationKey,
                        dataIndex: dIdx,
                        datum,
                        rawValue: yVal as number,
                        xKey,
                        xValue: xVal
                    });
                }
                seriesRecordsMap.set(s.id, sRecords);
            }

            let sortedXKeys: readonly ChartInteractionXKey[];
            if (
                groupIndepAxisType === "linear" ||
                groupIndepAxisType === "log" ||
                groupIndepAxisType === "symlog" ||
                groupIndepAxisType === "pow" ||
                groupIndepAxisType === "sqrt" ||
                groupIndepAxisType === "time" ||
                groupIndepAxisType === "utc"
            ) {
                sortedXKeys = [...groupXKeyOrder].sort((a, b) => Number(a) - Number(b));
            } else {
                sortedXKeys = groupXKeyOrder;
            }

            let groupHasPositive = false;
            let groupHasNegative = false;

            for (const s of visibleMembers) {
                if (!bySeriesId.has(s.id)) {
                    bySeriesId.set(s.id, new Map());
                }
                if (!orderedBySeriesId.has(s.id)) {
                    orderedBySeriesId.set(s.id, []);
                }
            }

            for (const xKey of sortedXKeys) {
                let positiveSum = 0;
                let negativeAbsSum = 0;

                for (const s of visibleMembers) {
                    const record = seriesRecordsMap.get(s.id)?.get(xKey);
                    if (record) {
                        if (record.rawValue > 0) {
                            positiveSum += record.rawValue;
                            groupHasPositive = true;
                            visibleHasPositive = true;
                            axisEntry.hasPos = true;
                        } else if (record.rawValue < 0) {
                            negativeAbsSum += Math.abs(record.rawValue);
                            groupHasNegative = true;
                            visibleHasNegative = true;
                            axisEntry.hasNeg = true;
                        }
                    }
                }

                let posAccum = 0;
                let negAccum = 0;
                const segmentEntriesAtX: { entry: CartesianStackEntry; isPositive: boolean; seriesId: string }[] = [];

                for (const s of visibleMembers) {
                    const record = seriesRecordsMap.get(s.id)?.get(xKey);
                    let entry: CartesianStackEntry;

                    if (record) {
                        const rawVal = record.rawValue;
                        const isPositive = rawVal >= 0;
                        let stackStart = 0;
                        let stackEnd = 0;
                        let stackPercentage: number | undefined;
                        let stackTotal: number | undefined;

                        if (groupMode === "percent") {
                            const bucketSum = isPositive ? positiveSum : negativeAbsSum;
                            stackTotal = bucketSum;
                            const share = bucketSum > 0 ? (Math.abs(rawVal) / bucketSum) * 100 : 0;
                            stackPercentage = isPositive ? share : -share;

                            if (isPositive) {
                                stackStart = posAccum;
                                stackEnd = posAccum + share;
                                posAccum += share;
                            } else {
                                stackStart = negAccum === 0 ? 0 : -negAccum;
                                stackEnd = negAccum + share === 0 ? 0 : -(negAccum + share);
                                negAccum += share;
                            }
                        } else {
                            stackTotal = isPositive ? positiveSum : negativeAbsSum;
                            if (isPositive) {
                                stackStart = posAccum;
                                stackEnd = posAccum + rawVal;
                                posAccum += rawVal;
                            } else {
                                stackStart = negAccum === 0 ? 0 : -negAccum;
                                stackEnd = negAccum + Math.abs(rawVal) === 0 ? 0 : -(negAccum + Math.abs(rawVal));
                                negAccum += Math.abs(rawVal);
                            }
                        }

                        entry = {
                            animationKey: record.animationKey,
                            dataIndex: record.dataIndex,
                            datum: record.datum,
                            defined: true,
                            rawValue: rawVal,
                            stackEnd,
                            stackPercentage,
                            stackStart,
                            stackTotal,
                            synthetic: false,
                            visualValue: rawVal,
                            xKey,
                            xValue: record.xValue
                        };
                        segmentEntriesAtX.push({ entry, isPositive, seriesId: s.id });
                    } else {
                        // Synthetic gap entry
                        const synthKey = JSON.stringify([s.id, "stack-synthetic", typeof xKey, xKey]);
                        if (geometryType === "area") {
                            entry = {
                                animationKey: synthKey,
                                dataIndex: -1,
                                datum: undefined,
                                defined: true,
                                rawValue: 0,
                                stackEnd: posAccum,
                                stackPercentage: 0,
                                stackPosition: "single",
                                stackStart: posAccum,
                                stackTotal: 0,
                                synthetic: true,
                                visualValue: 0,
                                xKey,
                                xValue: xKey
                            };
                        } else {
                            entry = {
                                animationKey: synthKey,
                                dataIndex: -1,
                                datum: undefined,
                                defined: false,
                                rawValue: 0,
                                stackEnd: 0,
                                stackPercentage: 0,
                                stackPosition: "single",
                                stackStart: 0,
                                stackTotal: 0,
                                synthetic: true,
                                visualValue: 0,
                                xKey,
                                xValue: xKey
                            };
                        }
                    }

                    bySeriesId.get(s.id)!.set(xKey, entry);
                    orderedBySeriesId.get(s.id)!.push(entry);
                }

                const posSegments = segmentEntriesAtX.filter(e => e.isPositive);
                const negSegments = segmentEntriesAtX.filter(e => !e.isPositive);

                for (const segList of [posSegments, negSegments]) {
                    if (segList.length === 1) {
                        (segList[0].entry as MutableStackPosition).stackPosition = "single";
                    } else if (segList.length > 1) {
                        (segList[0].entry as MutableStackPosition).stackPosition = "inner";
                        for (let i = 1; i < segList.length - 1; i++) {
                            (segList[i].entry as MutableStackPosition).stackPosition = "inner";
                        }
                        (segList[segList.length - 1].entry as MutableStackPosition).stackPosition = "outer";
                    }
                }

                if (groupMode === "percent") {
                    if (positiveSum > 0) {
                        globalMaxY = Math.max(globalMaxY, 100);
                        axisEntry.max = Math.max(axisEntry.max, 100);
                    }
                    if (negativeAbsSum > 0) {
                        globalMinY = Math.min(globalMinY, -100);
                        axisEntry.min = Math.min(axisEntry.min, -100);
                    }
                } else {
                    globalMaxY = Math.max(globalMaxY, posAccum);
                    globalMinY = Math.min(globalMinY, negAccum === 0 ? 0 : -negAccum);
                    axisEntry.max = Math.max(axisEntry.max, posAccum);
                    axisEntry.min = Math.min(axisEntry.min, negAccum === 0 ? 0 : -negAccum);
                }
            }

            const stackGroup: CartesianStackGroup = {
                geometryType,
                hasNegative: groupHasNegative,
                hasPositive: groupHasPositive,
                id: groupKey,
                mode: groupMode,
                name,
                seriesIds: visibleMembers.map(s => s.id),
                xAxisId,
                xKeys: sortedXKeys,
                yAxisId
            };
            visibleGroups.push(stackGroup);

            for (const s of visibleMembers) {
                groupBySeriesId.set(s.id, stackGroup);
            }
        }

        // 3. Determine value axis states per actual value axis (X in horizontal, Y in vertical)
        const xValueAxisState = new Map<string, CartesianValueAxisStackState>();
        const yValueAxisState = new Map<string, CartesianValueAxisStackState>();

        const valueAxes =
            orientation === "horizontal"
                ? Array.from(
                      new Set(
                          series.map(
                              s =>
                                  ("xAxisId" in s && typeof (s as SeriesWithOptionalAxisId).xAxisId === "function"
                                      ? (s as SeriesWithOptionalAxisId).xAxisId!()
                                      : undefined) ??
                                  options.primaryXAxisId ??
                                  "default-x"
                          )
                      )
                  )
                : Array.from(
                      new Set(
                          series.map(
                              s =>
                                  ("yAxisId" in s && typeof (s as SeriesWithOptionalAxisId).yAxisId === "function"
                                      ? (s as SeriesWithOptionalAxisId).yAxisId!()
                                      : undefined) ??
                                  options.primaryYAxisId ??
                                  "default-y"
                          )
                      )
                  );

        for (const vAxisId of valueAxes) {
            const seriesOnAxis = series.filter(s => {
                const sAxisId =
                    orientation === "horizontal"
                        ? (("xAxisId" in s && typeof (s as SeriesWithOptionalAxisId).xAxisId === "function"
                              ? (s as SeriesWithOptionalAxisId).xAxisId!()
                              : undefined) ??
                          options.primaryXAxisId ??
                          "default-x")
                        : (("yAxisId" in s && typeof (s as SeriesWithOptionalAxisId).yAxisId === "function"
                              ? (s as SeriesWithOptionalAxisId).yAxisId!()
                              : undefined) ??
                          options.primaryYAxisId ??
                          "default-y");
                return sAxisId === vAxisId;
            });
            const visibleSeriesOnAxis = seriesOnAxis.filter(s => s.visible());
            const visibleStackable = visibleSeriesOnAxis.filter(s => s.type === "bar" || s.type === "area");

            let vUnitMode: "invalid" | "none" | "percent" | "raw" = "none";
            const axisEntry = axisMinMax.get(vAxisId);
            const groupsOnAxis = visibleGroups.filter(
                g => (orientation === "horizontal" ? g.xAxisId : g.yAxisId) === vAxisId
            );

            if (visibleStackable.length > 0) {
                const visiblePercent = visibleStackable.filter(s => {
                    const mem = membershipBySeriesId.get(s.id);
                    return mem?.valid && mem.mode === "percent";
                });
                const visibleRaw = visibleStackable.filter(s => {
                    const mem = membershipBySeriesId.get(s.id);
                    return !mem || !mem.valid || mem.mode !== "percent";
                });

                if (visiblePercent.length > 0 && visibleRaw.length > 0) {
                    vUnitMode = "invalid";
                    for (const s of visibleStackable) {
                        invalidSeriesIds.add(s.id);
                    }
                    const dimLabel = orientation === "horizontal" ? "X" : "Y";
                    diagnostics.push({
                        code: "mixed-y-axis-units",
                        message: `Percent stacked series and raw value series cannot share the same ${dimLabel} value axis "${vAxisId}". Conflicting series geometry was omitted.`,
                        severity: "warning",
                        signature: `unit-mix:percent-raw:${vAxisId}`
                    });
                } else if (visiblePercent.length > 0) {
                    vUnitMode = "percent";
                } else if (groupsOnAxis.some(g => g.mode === "normal")) {
                    vUnitMode = "raw";
                } else {
                    vUnitMode = "raw";
                }
            } else if (visibleSeriesOnAxis.length > 0) {
                vUnitMode = "raw";
            } else {
                const regPercent = registeredGroups.filter(
                    g =>
                        g.valid &&
                        g.mode === "percent" &&
                        (orientation === "horizontal" ? g.xAxisId : g.yAxisId) === vAxisId
                );
                if (regPercent.length > 0) {
                    vUnitMode = "percent";
                }
            }

            const axisExtent: [number, number] = axisEntry
                ? [axisEntry.min === 0 ? 0 : axisEntry.min, axisEntry.max === 0 ? 0 : axisEntry.max]
                : [0, 0];

            const state: CartesianValueAxisStackState = {
                extent: axisExtent,
                groupIds: groupsOnAxis.map(g => g.id),
                hasNegative: axisEntry?.hasNeg ?? false,
                hasPositive: axisEntry?.hasPos ?? false,
                unitMode: vUnitMode
            };

            if (orientation === "horizontal") {
                xValueAxisState.set(vAxisId, state);
            } else {
                yValueAxisState.set(vAxisId, state);
            }
        }

        const layout: CartesianStackLayout = {
            bySeriesId,
            groupBySeriesId,
            groups: visibleGroups,
            hasNormalStacks,
            hasPercentStacks,
            orderedBySeriesId,
            visibleHasNegative,
            visibleHasPositive,
            yExtent: [globalMinY === 0 ? 0 : globalMinY, globalMaxY === 0 ? 0 : globalMaxY]
        };

        const analysisByGroupId = new Map<string, CartesianStackAnalysis>();
        const analysisBySeriesId = new Map<string, CartesianStackAnalysis>();

        for (const g of registeredGroups) {
            const vAxisId = orientation === "horizontal" ? g.xAxisId : g.yAxisId;
            const vState = (orientation === "horizontal"
                ? xValueAxisState.get(vAxisId)
                : yValueAxisState.get(vAxisId)) ?? {
                extent: [0, 0] as [number, number],
                groupIds: [],
                hasNegative: false,
                hasPositive: false,
                unitMode: "raw" as const
            };
            const seriesOnAxis = series.filter(s => {
                const sAxisId =
                    orientation === "horizontal"
                        ? (("xAxisId" in s && typeof (s as SeriesWithOptionalAxisId).xAxisId === "function"
                              ? (s as SeriesWithOptionalAxisId).xAxisId!()
                              : undefined) ??
                          options.primaryXAxisId ??
                          "default-x")
                        : (("yAxisId" in s && typeof (s as SeriesWithOptionalAxisId).yAxisId === "function"
                              ? (s as SeriesWithOptionalAxisId).yAxisId!()
                              : undefined) ??
                          options.primaryYAxisId ??
                          "default-y");
                return sAxisId === vAxisId;
            });
            const visibleSeriesOnAxis = seriesOnAxis.filter(s => s.visible());

            const axisUnitMode: CartesianAxisUnitMode = vState.unitMode === "percent" ? "percent" : "raw";
            const visibleYUnitMode: CartesianVisibleYUnitMode =
                visibleSeriesOnAxis.length === 0
                    ? "none"
                    : vState.unitMode === "percent"
                      ? "percent-stack"
                      : vState.unitMode === "invalid"
                        ? "invalid"
                        : layout.hasNormalStacks
                          ? "normal-stack"
                          : "raw";

            const groupAnalysis: CartesianStackAnalysis = {
                axisUnitMode,
                configuration,
                diagnostics,
                invalidGroupIds,
                invalidSeriesIds,
                layout,
                visibleLayout: layout,
                visibleYUnitMode,
                yUnitMode:
                    vState.unitMode === "percent" ? "percent" : vState.unitMode === "invalid" ? "invalid" : "normal"
            };
            analysisByGroupId.set(g.id, groupAnalysis);
            for (const sId of g.registeredSeriesIds) {
                analysisBySeriesId.set(sId, groupAnalysis);
            }
        }

        return {
            analysisByGroupId,
            analysisBySeriesId,
            configuration,
            diagnostics,
            invalidGroupIds,
            invalidSeriesIds,
            layout,
            valueAxisState: {
                x: xValueAxisState,
                y: yValueAxisState
            },
            visibleLayout: layout
        };
    }

    public static computeLayout(options: CartesianStackEngineOptions): CartesianStackLayout {
        return this.computeAnalysis(options).layout;
    }

    public static resolveNormalizedXKey(
        xVal: unknown,
        dataIndex: number,
        xAxisType: ChartXAxisType | ResolvedChartCartesianAxisType
    ): ChartInteractionXKey | undefined {
        if (xAxisType === "category") {
            return xVal !== undefined && xVal !== null ? String(xVal) : String(dataIndex);
        }
        if (
            xAxisType === "linear" ||
            xAxisType === "log" ||
            xAxisType === "symlog" ||
            xAxisType === "pow" ||
            xAxisType === "sqrt"
        ) {
            return isFiniteNumber(xVal) ? Number(xVal) : undefined;
        }
        if (xAxisType === "time" || xAxisType === "utc") {
            return resolveCartesianTemporalValue(xVal)?.epochMs;
        }
        return xVal !== undefined && xVal !== null ? String(xVal) : String(dataIndex);
    }
}
