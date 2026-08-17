import type {
    ChartAreaSeriesRegistration,
    ChartBarSeriesRegistration,
    ChartCartesianSeriesRegistration
} from "../context/chart-registration-context";
import type { ChartXAxisType } from "../../models/chart-axis.models";
import type { ChartField } from "../../models/chart.models";
import type { ChartStackMode } from "../../models/chart-stack.models";
import type { ChartInteractionXKey } from "../scene/scene-geometry";
import { ChartMarkKeyResolver } from "../animation/animation-identity";
import { isFiniteNumber } from "../utils/number-utils";
import type { ChartDiagnostic } from "../utils/chart-diagnostics";
import { resolveData, resolveValue } from "./chart-value-resolver";
import { isCartesianSeriesCompatibleWithXAxisType } from "./chart-domain";

export type StackableCartesianSeriesRegistration = ChartAreaSeriesRegistration | ChartBarSeriesRegistration;

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
    readonly xKeys: readonly ChartInteractionXKey[];
}

export interface RegisteredStackMembership {
    readonly geometryType: "area" | "bar";
    readonly groupId: string;
    readonly groupName: string;
    readonly mode: ChartStackMode;
    readonly seriesId: string;
    readonly valid: boolean;
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

export type CartesianVisibleYUnitMode =
    | "invalid"
    | "none"
    | "normal-stack"
    | "percent-stack"
    | "raw";

export type CartesianAxisUnitMode = "percent" | "raw";

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

export interface CartesianStackEngineOptions {
    readonly rootData: readonly unknown[];
    readonly rootXField?: ChartField;
    readonly series: readonly ChartCartesianSeriesRegistration[];
    readonly xAxisType: ChartXAxisType;
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
        const { rootData, rootXField, series, xAxisType } = options;
        const diagnostics: ChartDiagnostic[] = [];

        // 1. Filter series by X-axis compatibility (STK-002)
        const compatibleSeries = series.filter(s =>
            isCartesianSeriesCompatibleWithXAxisType(s.type, xAxisType)
        );

        // 2. Discover registered stack groups across ALL compatible series (visible + hidden) (STK-007, STK-016)
        const registeredGroupMap = new Map<
            string,
            {
                geometryType: "area" | "bar";
                name: string;
                seriesList: StackableCartesianSeriesRegistration[];
            }
        >();

        for (const s of compatibleSeries) {
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

            const groupKey = `${stackable.type}:${trimmedStack}`;
            let groupRecord = registeredGroupMap.get(groupKey);
            if (!groupRecord) {
                groupRecord = {
                    geometryType: stackable.type,
                    name: trimmedStack,
                    seriesList: []
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
            const { geometryType, name, seriesList } = groupInfo;
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
                valid: !hasConflict
            };
            registeredGroups.push(regGroup);

            for (const s of seriesList) {
                membershipBySeriesId.set(s.id, {
                    geometryType,
                    groupId: groupKey,
                    groupName: name,
                    mode: firstMode,
                    seriesId: s.id,
                    valid: !hasConflict
                });
            }
        }

        const configSignature = JSON.stringify(
            registeredGroups.map(g => ({
                id: g.id,
                mode: g.mode,
                series: g.registeredSeriesIds,
                valid: g.valid
            }))
        );

        const configuration: CartesianStackConfiguration = {
            groups: registeredGroups,
            membershipBySeriesId,
            signature: configSignature
        };

        // 3. Process visible layout for valid groups
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

        for (const [groupKey, groupInfo] of registeredGroupMap) {
            if (invalidGroupIds.has(groupKey)) {
                continue;
            }

            const { geometryType, name, seriesList } = groupInfo;
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

            // Extract records per series with 1 resolver per series (STK-005) & first-valid duplicate (STK-006)
            const seriesRecordsMap = new Map<string, Map<ChartInteractionXKey, RawDatumRecord>>();
            const groupXKeyOrder: ChartInteractionXKey[] = [];
            const groupXKeySet = new Set<ChartInteractionXKey>();

            for (const s of visibleMembers) {
                const sData = resolveData(s.data(), rootData);
                const sXField = s.xField() ?? rootXField;
                const sField = s.field();
                const keyResolver = new ChartMarkKeyResolver(s.id, s.keyField?.());
                const sRecords = new Map<ChartInteractionXKey, RawDatumRecord>();

                for (let dIdx = 0; dIdx < sData.length; dIdx++) {
                    const datum = sData[dIdx];
                    const xVal = resolveValue(datum, sXField, dIdx);
                    const yVal = resolveValue(datum, sField, dIdx);

                    const xKey = this.resolveNormalizedXKey(xVal, dIdx, xAxisType);
                    if (xKey === undefined) {
                        continue;
                    }

                    // Add to group X lattice
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
                                message: `Series "${s.name()}" has duplicate valid X coordinate "${String(xKey)}". Later duplicates are skipped for stack layout.`,
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
            if (xAxisType === "linear" || xAxisType === "time" || xAxisType === "utc") {
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
                        } else if (record.rawValue < 0) {
                            negativeAbsSum += Math.abs(record.rawValue);
                            groupHasNegative = true;
                            visibleHasNegative = true;
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
                        let visualVal = 0;
                        let stackPercentage: number | undefined;
                        let stackTotal: number | undefined;

                        if (groupMode === "normal") {
                            visualVal = rawVal;
                            stackTotal = isPositive ? positiveSum : -negativeAbsSum;
                            if (isPositive) {
                                stackStart = posAccum;
                                stackEnd = posAccum + rawVal;
                                posAccum = stackEnd;
                            } else {
                                stackStart = negAccum;
                                stackEnd = negAccum + rawVal;
                                negAccum = stackEnd;
                            }
                        } else {
                            // Percent mode
                            if (rawVal > 0) {
                                stackPercentage = positiveSum > 0 ? (rawVal / positiveSum) * 100 : 0;
                                stackTotal = positiveSum;
                                visualVal = stackPercentage;
                                stackStart = posAccum;
                                stackEnd = Math.min(100, posAccum + stackPercentage);
                                posAccum = stackEnd;
                            } else if (rawVal < 0) {
                                stackPercentage = negativeAbsSum > 0 ? -((Math.abs(rawVal) / negativeAbsSum) * 100) : 0;
                                stackTotal = negativeAbsSum;
                                visualVal = stackPercentage;
                                stackStart = negAccum;
                                stackEnd = Math.max(-100, negAccum + stackPercentage);
                                negAccum = stackEnd;
                            } else {
                                visualVal = 0;
                                stackPercentage = 0;
                                stackTotal = positiveSum > 0 ? positiveSum : 0;
                                stackStart = 0;
                                stackEnd = 0;
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
                            visualValue: visualVal,
                            xKey,
                            xValue: record.xValue
                        };

                        segmentEntriesAtX.push({ entry, isPositive, seriesId: s.id });
                    } else {
                        if (geometryType === "area") {
                            const stackStart = posAccum;
                            const stackEnd = posAccum;
                            const animationKey = JSON.stringify([s.id, "stack-synthetic", typeof xKey, xKey]);

                            entry = {
                                animationKey,
                                dataIndex: -1,
                                datum: undefined,
                                defined: true,
                                rawValue: 0,
                                stackEnd,
                                stackPercentage: groupMode === "percent" ? 0 : undefined,
                                stackStart,
                                stackTotal: groupMode === "percent" ? 0 : undefined,
                                synthetic: true,
                                visualValue: 0,
                                xKey,
                                xValue: xKey
                            };
                        } else {
                            continue;
                        }
                    }

                    globalMinY = Math.min(globalMinY, entry.stackStart, entry.stackEnd);
                    globalMaxY = Math.max(globalMaxY, entry.stackStart, entry.stackEnd);

                    bySeriesId.get(s.id)!.set(xKey, entry);
                    orderedBySeriesId.get(s.id)!.push(entry);
                }

                // Corner caps assignment for bar segments (STK-004, STK-011)
                if (geometryType === "bar" && segmentEntriesAtX.length > 0) {
                    const posSegments = segmentEntriesAtX.filter(s => s.isPositive && s.entry.rawValue > 0);
                    const negSegments = segmentEntriesAtX.filter(s => !s.isPositive && s.entry.rawValue < 0);

                    if (posSegments.length === 1) {
                        (posSegments[0].entry as { stackPosition?: "inner" | "outer" | "single" }).stackPosition = "single";
                    } else if (posSegments.length > 1) {
                        for (let i = 0; i < posSegments.length; i++) {
                            const pos = i === posSegments.length - 1 ? "outer" : "inner";
                            (posSegments[i].entry as { stackPosition?: "inner" | "outer" | "single" }).stackPosition = pos;
                        }
                    }

                    if (negSegments.length === 1) {
                        (negSegments[0].entry as { stackPosition?: "inner" | "outer" | "single" }).stackPosition = "single";
                    } else if (negSegments.length > 1) {
                        for (let i = 0; i < negSegments.length; i++) {
                            const pos = i === negSegments.length - 1 ? "outer" : "inner";
                            (negSegments[i].entry as { stackPosition?: "inner" | "outer" | "single" }).stackPosition = pos;
                        }
                    }
                }
            }

            const visibleGroup: CartesianStackGroup = {
                geometryType,
                hasNegative: groupHasNegative,
                hasPositive: groupHasPositive,
                id: groupKey,
                mode: groupMode,
                name,
                seriesIds: visibleMembers.map(s => s.id),
                xKeys: sortedXKeys
            };
            visibleGroups.push(visibleGroup);

            for (const s of visibleMembers) {
                groupBySeriesId.set(s.id, visibleGroup);
            }
        }

        // 4. Validate Single-Y-Axis Percent vs Raw Unit Integrity (STK-001, PRE-001, PRE-002, PRE-003, PRE-004)
        const visibleCompatibleSeries = compatibleSeries.filter(s => s.visible());
        let visibleYUnitMode: CartesianVisibleYUnitMode = "none";
        let axisUnitMode: CartesianAxisUnitMode = "raw";

        if (visibleCompatibleSeries.length === 0) {
            visibleYUnitMode = "none";
            const regPercentGroups = registeredGroups.filter(g => g.valid && g.mode === "percent");
            if (regPercentGroups.length > 0) {
                axisUnitMode = "percent";
            } else {
                axisUnitMode = "raw";
            }
        } else {
            const visiblePercentSeries = visibleCompatibleSeries.filter(s => {
                const membership = membershipBySeriesId.get(s.id);
                return membership?.valid && membership.mode === "percent";
            });
            const visibleRawSeries = visibleCompatibleSeries.filter(s => {
                const membership = membershipBySeriesId.get(s.id);
                return !membership || !membership.valid || membership.mode !== "percent";
            });

            if (visiblePercentSeries.length > 0 && visibleRawSeries.length > 0) {
                visibleYUnitMode = "invalid";
                axisUnitMode = "raw";
                for (const s of visibleCompatibleSeries) {
                    invalidSeriesIds.add(s.id);
                }
                diagnostics.push({
                    code: "mixed-y-axis-units",
                    message: `Percent stacked series and raw value series cannot share the same Y axis. Conflicting series geometry was omitted.`,
                    severity: "warning",
                    signature: "unit-mix:percent-raw"
                });
            } else if (visiblePercentSeries.length > 0) {
                visibleYUnitMode = "percent-stack";
                axisUnitMode = "percent";
            } else if (hasNormalStacks) {
                visibleYUnitMode = "normal-stack";
                axisUnitMode = "raw";
            } else {
                visibleYUnitMode = "raw";
                axisUnitMode = "raw";
            }
        }

        const yUnitMode: "invalid" | "normal" | "percent" | "raw" =
            visibleYUnitMode === "percent-stack"
                ? "percent"
                : visibleYUnitMode === "normal-stack"
                  ? "normal"
                  : visibleYUnitMode === "invalid"
                    ? "invalid"
                    : "raw";

        const layout: CartesianStackLayout = {
            bySeriesId,
            groupBySeriesId,
            groups: visibleGroups,
            hasNormalStacks,
            hasPercentStacks,
            orderedBySeriesId,
            visibleHasNegative,
            visibleHasPositive,
            yExtent: [globalMinY, globalMaxY]
        };

        return {
            axisUnitMode,
            configuration,
            diagnostics,
            invalidGroupIds,
            invalidSeriesIds,
            layout,
            visibleLayout: layout,
            visibleYUnitMode,
            yUnitMode
        };
    }

    public static computeLayout(options: CartesianStackEngineOptions): CartesianStackLayout {
        return this.computeAnalysis(options).layout;
    }

    public static resolveNormalizedXKey(
        xVal: unknown,
        dataIndex: number,
        xAxisType: ChartXAxisType
    ): ChartInteractionXKey | undefined {
        if (xAxisType === "category") {
            return xVal !== undefined && xVal !== null ? String(xVal) : String(dataIndex);
        }
        if (xAxisType === "linear") {
            return isFiniteNumber(xVal) ? Number(xVal) : undefined;
        }
        if (xAxisType === "time" || xAxisType === "utc") {
            if (xVal instanceof Date && !Number.isNaN(xVal.getTime())) {
                return xVal.getTime();
            }
            if (typeof xVal === "number" && Number.isFinite(xVal)) {
                return xVal;
            }
            if (typeof xVal === "string") {
                const parsed = Date.parse(xVal);
                if (!Number.isNaN(parsed)) {
                    return parsed;
                }
            }
            return undefined;
        }
        return xVal !== undefined && xVal !== null ? String(xVal) : String(dataIndex);
    }
}
