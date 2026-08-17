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
import { resolveData, resolveValue } from "./chart-value-resolver";

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

export interface CartesianStackLayout {
    readonly bySeriesId: ReadonlyMap<string, ReadonlyMap<ChartInteractionXKey, CartesianStackEntry>>;
    readonly groups: readonly CartesianStackGroup[];
    readonly hasNormalStacks: boolean;
    readonly hasPercentStacks: boolean;
    readonly orderedBySeriesId: ReadonlyMap<string, readonly CartesianStackEntry[]>;
    readonly yExtent: readonly [number, number];
}

export interface CartesianStackEngineOptions {
    readonly rootData: readonly unknown[];
    readonly rootXField?: ChartField;
    readonly series: readonly ChartCartesianSeriesRegistration[];
    readonly xAxisType: ChartXAxisType;
}

interface RawDatumRecord {
    readonly dataIndex: number;
    readonly datum: unknown;
    readonly rawValue: number | undefined;
    readonly xKey: ChartInteractionXKey;
    readonly xValue: unknown;
}

export class CartesianStackEngine {
    public static computeLayout(options: CartesianStackEngineOptions): CartesianStackLayout {
        const { rootData, rootXField, series, xAxisType } = options;

        const visibleSeries = series.filter(s => s.visible());
        const stackGroupMap = new Map<
            string,
            { geometryType: "area" | "bar"; name: string; seriesList: StackableCartesianSeriesRegistration[] }
        >();

        for (const s of visibleSeries) {
            if (s.type !== "bar" && s.type !== "area") {
                continue;
            }
            const stackable = s as StackableCartesianSeriesRegistration;
            const rawStack = stackable.stack?.()?.trim();
            if (!rawStack) {
                continue;
            }
            const groupKey = `${stackable.type}:${rawStack}`;
            let groupRecord = stackGroupMap.get(groupKey);
            if (!groupRecord) {
                groupRecord = {
                    geometryType: stackable.type,
                    name: rawStack,
                    seriesList: []
                };
                stackGroupMap.set(groupKey, groupRecord);
            }
            groupRecord.seriesList.push(stackable);
        }

        const validGroups: CartesianStackGroup[] = [];
        const bySeriesId = new Map<string, Map<ChartInteractionXKey, CartesianStackEntry>>();
        const orderedBySeriesId = new Map<string, CartesianStackEntry[]>();

        let globalMinY = 0;
        let globalMaxY = 0;
        let hasNormalStacks = false;
        let hasPercentStacks = false;

        const warnedDuplicateKeys = new Set<string>();

        for (const [groupKey, groupInfo] of stackGroupMap) {
            const { geometryType, name, seriesList } = groupInfo;
            if (seriesList.length === 0) {
                continue;
            }

            // Validate stack mode consistency across group members
            const firstMode: ChartStackMode = seriesList[0].stackMode?.() ?? "normal";
            const hasConflict = seriesList.some(s => (s.stackMode?.() ?? "normal") !== firstMode);
            if (hasConflict) {
                console.warn(
                    `[MonaChart] Stack group "${name}" (${geometryType}) contains conflicting stackMode values among series [${seriesList.map(s => s.name()).join(", ")}]. Stack geometry for this group was omitted.`
                );
                continue;
            }

            const groupMode = firstMode;
            if (groupMode === "percent") {
                hasPercentStacks = true;
            } else {
                hasNormalStacks = true;
            }

            // Extract per-series records with duplicate-X filtering
            const seriesRecordsMap = new Map<string, Map<ChartInteractionXKey, RawDatumRecord>>();
            const groupXKeyOrder: ChartInteractionXKey[] = [];
            const groupXKeySet = new Set<ChartInteractionXKey>();

            for (const s of seriesList) {
                const sData = resolveData(s.data(), rootData);
                const sXField = s.xField() ?? rootXField;
                const sField = s.field();
                const sRecords = new Map<ChartInteractionXKey, RawDatumRecord>();

                for (let dIdx = 0; dIdx < sData.length; dIdx++) {
                    const datum = sData[dIdx];
                    const xVal = resolveValue(datum, sXField, dIdx);
                    const yVal = resolveValue(datum, sField, dIdx);

                    const xKey = this.resolveNormalizedXKey(xVal, dIdx, xAxisType);
                    if (xKey === undefined) {
                        continue;
                    }

                    if (sRecords.has(xKey)) {
                        const warnId = `${s.id}:${String(xKey)}`;
                        if (!warnedDuplicateKeys.has(warnId)) {
                            warnedDuplicateKeys.add(warnId);
                            console.warn(
                                `[MonaChart] Series "${s.name()}" has duplicate X coordinate "${String(xKey)}". Later duplicates are skipped for stack layout.`
                            );
                        }
                        continue;
                    }

                    const numY = isFiniteNumber(yVal) ? yVal : undefined;
                    const record: RawDatumRecord = {
                        dataIndex: dIdx,
                        datum,
                        rawValue: numY,
                        xKey,
                        xValue: xVal
                    };
                    sRecords.set(xKey, record);

                    if (!groupXKeySet.has(xKey)) {
                        groupXKeySet.add(xKey);
                        groupXKeyOrder.push(xKey);
                    }
                }
                seriesRecordsMap.set(s.id, sRecords);
            }

            // Sort X lattice if continuous
            let sortedXKeys: readonly ChartInteractionXKey[];
            if (xAxisType === "linear") {
                sortedXKeys = [...groupXKeyOrder].sort((a, b) => Number(a) - Number(b));
            } else if (xAxisType === "time" || xAxisType === "utc") {
                sortedXKeys = [...groupXKeyOrder].sort((a, b) => Number(a) - Number(b));
            } else {
                sortedXKeys = groupXKeyOrder;
            }

            let groupHasPositive = false;
            let groupHasNegative = false;

            // Initialize entries map for each series
            for (const s of seriesList) {
                if (!bySeriesId.has(s.id)) {
                    bySeriesId.set(s.id, new Map());
                }
                if (!orderedBySeriesId.has(s.id)) {
                    orderedBySeriesId.set(s.id, []);
                }
            }

            for (const xKey of sortedXKeys) {
                // Calculate denominators for percent mode if applicable
                let positiveSum = 0;
                let negativeAbsSum = 0;

                for (const s of seriesList) {
                    const record = seriesRecordsMap.get(s.id)?.get(xKey);
                    if (record?.rawValue !== undefined) {
                        if (record.rawValue > 0) {
                            positiveSum += record.rawValue;
                            groupHasPositive = true;
                        } else if (record.rawValue < 0) {
                            negativeAbsSum += Math.abs(record.rawValue);
                            groupHasNegative = true;
                        }
                    }
                }

                let posAccum = 0;
                let negAccum = 0;

                // Temporary list for assigning corner / cap positions at this X coordinate
                const segmentEntriesAtX: { entry: CartesianStackEntry; isPositive: boolean; seriesId: string }[] = [];

                for (const s of seriesList) {
                    const keyResolver = new ChartMarkKeyResolver(s.id, s.keyField?.());
                    const record = seriesRecordsMap.get(s.id)?.get(xKey);

                    let entry: CartesianStackEntry;

                    if (record && record.rawValue !== undefined) {
                        const rawVal = record.rawValue;
                        const isPositive = rawVal >= 0;
                        let stackStart = 0;
                        let stackEnd = 0;
                        let visualVal = 0;
                        let stackPercentage: number | undefined;
                        let stackTotal: number | undefined;

                        if (groupMode === "normal") {
                            visualVal = rawVal;
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

                        const animationKey = keyResolver.resolveKey(record.datum, String(xKey), record.dataIndex);
                        entry = {
                            animationKey,
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
                        // Missing datum or non-finite value
                        if (geometryType === "area") {
                            const stackStart = posAccum;
                            const stackEnd = posAccum;
                            const animationKey = `${s.id}:${String(xKey)}:stack-synthetic`;

                            entry = {
                                animationKey,
                                dataIndex: -1,
                                datum: undefined,
                                defined: false,
                                rawValue: 0,
                                stackEnd,
                                stackPercentage: groupMode === "percent" ? 0 : undefined,
                                stackStart,
                                stackTotal: groupMode === "percent" ? 0 : undefined,
                                synthetic: true,
                                visualValue: 0,
                                xKey,
                                xValue: record?.xValue ?? xKey
                            };
                        } else {
                            // Bar series without datum at this category
                            continue;
                        }
                    }

                    globalMinY = Math.min(globalMinY, entry.stackStart, entry.stackEnd);
                    globalMaxY = Math.max(globalMaxY, entry.stackStart, entry.stackEnd);

                    bySeriesId.get(s.id)!.set(xKey, entry);
                    orderedBySeriesId.get(s.id)!.push(entry);
                }

                // Determine stackPosition (inner/outer/single) for bar segments at this X
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

            validGroups.push({
                geometryType,
                hasNegative: groupHasNegative,
                hasPositive: groupHasPositive,
                id: groupKey,
                mode: groupMode,
                name,
                seriesIds: seriesList.map(s => s.id),
                xKeys: sortedXKeys
            });
        }

        return {
            bySeriesId,
            groups: validGroups,
            hasNormalStacks,
            hasPercentStacks,
            orderedBySeriesId,
            yExtent: [globalMinY, globalMaxY]
        };
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
