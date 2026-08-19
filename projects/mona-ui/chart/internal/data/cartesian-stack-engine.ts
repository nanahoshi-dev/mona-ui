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
        const {
            orientation = "vertical",
            rootData,
            rootXField,
            series,
            xAxisType = "category"
        } = options;
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
            const indepType = orientation === "horizontal"
                ? (options.resolvedYAxisTypeByAxisId?.get(yAxisId) ?? "category")
                : (options.resolvedXAxisTypeByAxisId?.get(xAxisId) ?? xAxisType ?? "category");

            if (!isCartesianSeriesCompatibleWithXAxisType(s.type, indepType as any)) {
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

            // Enforce linear scale on actual value axis (MAXR-023)
            const valueAxisId = orientation === "horizontal" ? xAxisId : yAxisId;
            const valueAxisType = orientation === "horizontal"
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

            const groupIndepAxisType = orientation === "horizontal"
                ? (options.resolvedYAxisTypeByAxisId?.get(yAxisId) ?? "category")
                : (options.resolvedXAxisTypeByAxisId?.get(xAxisId) ?? xAxisType ?? "category");

            // Extract records per series
            const seriesRecordsMap = new Map<string, Map<ChartInteractionXKey, RawDatumRecord>>();
            const groupXKeyOrder: ChartInteractionXKey[] = [];
            const groupXKeySet = new Set<ChartInteractionXKey>();

            for (const s of visibleMembers) {
                const sData = resolveData(s.data(), rootData);
                const sXField = orientation === "horizontal"
                    ? (s.xField?.() ?? rootXField)
                    : (s.xField?.() ?? rootXField);
                const sField = s.field();
                const keyResolver = new ChartMarkKeyResolver(s.id, s.keyField?.());
                const sRecords = new Map<ChartInteractionXKey, RawDatumRecord>();

                for (let dIdx = 0; dIdx < sData.length; dIdx++) {
                    const datum = sData[dIdx];
                    const xVal = resolveValue(datum, sXField, dIdx);
                    const yVal = resolveValue(datum, sField, dIdx);

                    const xKey = this.resolveNormalizedXKey(xVal, dIdx, groupIndepAxisType as any);
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
                        let stackStart: number;
                        let stackEnd: number;
                        let stackPercentage: number | undefined;
                        let stackTotal: number | undefined;

                        if (groupMode === "percent") {
                            const total = isPositive ? positiveSum : negativeAbsSum;
                            stackTotal = total;
                            if (total === 0) {
                                stackStart = 0;
                                stackEnd = 0;
                                stackPercentage = 0;
                            } else {
                                const currentAccum = isPositive ? posAccum : negAccum;
                                const valAbs = Math.abs(rawVal);
                                const startPct = (currentAccum / total) * 100;
                                const endPct = ((currentAccum + valAbs) / total) * 100;

                                stackStart = isPositive ? startPct : startPct === 0 ? 0 : -startPct;
                                stackEnd = isPositive ? endPct : endPct === 0 ? 0 : -endPct;
                                stackPercentage = isPositive ? (valAbs / total) * 100 : -((valAbs / total) * 100);

                                if (isPositive) posAccum += valAbs;
                                else negAccum += valAbs;
                            }
                        } else {
                            stackTotal = isPositive ? positiveSum : -negativeAbsSum;
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
                        // Synthetic gap entry for unaligned series
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

                // Compute inner/outer/single positions for rounded corners
                const posSegments = segmentEntriesAtX.filter(e => e.isPositive);
                const negSegments = segmentEntriesAtX.filter(e => !e.isPositive);

                for (const segList of [posSegments, negSegments]) {
                    if (segList.length === 1) {
                        (segList[0].entry as any).stackPosition = "single";
                    } else if (segList.length > 1) {
                        (segList[0].entry as any).stackPosition = "inner";
                        for (let i = 1; i < segList.length - 1; i++) {
                            (segList[i].entry as any).stackPosition = "inner";
                        }
                        (segList[segList.length - 1].entry as any).stackPosition = "outer";
                    }
                }

                if (groupMode === "percent") {
                    if (positiveSum > 0) globalMaxY = Math.max(globalMaxY, 100);
                    if (negativeAbsSum > 0) globalMinY = Math.min(globalMinY, -100);
                } else {
                    globalMaxY = Math.max(globalMaxY, posAccum);
                    globalMinY = Math.min(globalMinY, negAccum === 0 ? 0 : -negAccum);
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

        // 4. Determine value axis unit mode & validate (STK-009, STK-010)
        let visibleYUnitMode: CartesianVisibleYUnitMode = "none";
        let axisUnitMode: CartesianAxisUnitMode = "raw";

        const visibleSeriesList = series.filter(s => s.visible());
        const visibleStackableSeries = visibleSeriesList.filter(s => s.type === "bar" || s.type === "area");
        if (visibleStackableSeries.length > 0) {
            const visiblePercentSeries = visibleStackableSeries.filter(s => {
                const membership = membershipBySeriesId.get(s.id);
                return membership?.valid && membership.mode === "percent";
            });
            const visibleRawSeries = visibleStackableSeries.filter(s => {
                const membership = membershipBySeriesId.get(s.id);
                return !membership || !membership.valid || membership.mode !== "percent";
            });

            if (visiblePercentSeries.length > 0 && visibleRawSeries.length > 0) {
                visibleYUnitMode = "invalid";
                axisUnitMode = "raw";
                for (const s of visibleStackableSeries) {
                    invalidSeriesIds.add(s.id);
                }
                const valueDim = orientation === "horizontal" ? "X" : "Y";
                diagnostics.push({
                    code: "mixed-y-axis-units",
                    message: `Percent stacked series and raw value series cannot share the same ${valueDim} value axis. Conflicting series geometry was omitted.`,
                    severity: "warning",
                    signature: `unit-mix:percent-raw:${valueDim}`
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
        } else if (visibleSeriesList.length > 0) {
            visibleYUnitMode = "raw";
            axisUnitMode = "raw";
        } else {
            const regPercentGroups = registeredGroups.filter(g => g.valid && g.mode === "percent");
            if (regPercentGroups.length > 0) {
                axisUnitMode = "percent";
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
            yExtent: [globalMinY === 0 ? 0 : globalMinY, globalMaxY === 0 ? 0 : globalMaxY]
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
            if (xVal instanceof Date && !Number.isNaN(xVal.getTime())) {
                return xVal.getTime();
            }
            if (typeof xVal === "number" && Number.isFinite(xVal)) {
                return xVal;
            }
            if (typeof xVal === "string" && xVal.trim().length > 0) {
                if (!/^\s*-?\d+(\.\d+)?\s*$/.test(xVal)) {
                    const parsed = Date.parse(xVal);
                    if (!Number.isNaN(parsed)) {
                        return parsed;
                    }
                }
            }
            return undefined;
        }
        return xVal !== undefined && xVal !== null ? String(xVal) : String(dataIndex);
    }
}
