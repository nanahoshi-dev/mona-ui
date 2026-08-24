import {
    type ChartSynchronizationAxisMapping,
    type ChartSynchronizationInput,
    type ChartSynchronizationOptions,
    type ChartCrosshairSynchronizationOptions,
    type ChartViewportSynchronizationOptions
} from "../../models/chart-synchronization.models";
import type { ChartViewportAxisRef } from "../../models/chart-viewport.models";
import { ChartDiagnostics } from "../utils/chart-diagnostics";

export interface NormalizedChartCrosshairSynchronizationOptions {
    readonly axes: "auto" | "x" | "xy" | "y";
    readonly clearOnLeave: boolean;
    readonly enabled: boolean;
    readonly match: "axis-value" | "nearest-point";
    readonly mode: "domain" | "relative";
    readonly showTooltip: boolean;
}

export interface NormalizedChartViewportSynchronizationOptions {
    readonly axes: "auto" | "x" | "xy" | "y" | readonly ChartViewportAxisRef[];
    readonly enabled: boolean;
    readonly mode: "domain" | "relative";
    readonly phase: "continuous" | "end";
}

export interface NormalizedChartSynchronizationOptions {
    readonly axisMappings: readonly ChartSynchronizationAxisMapping[];
    readonly crosshair: NormalizedChartCrosshairSynchronizationOptions;
    readonly group: string;
    readonly viewport: NormalizedChartViewportSynchronizationOptions;
}

const defaultCrosshairOptions: NormalizedChartCrosshairSynchronizationOptions = {
    axes: "auto",
    clearOnLeave: true,
    enabled: true,
    match: "axis-value",
    mode: "domain",
    showTooltip: false
};

const defaultViewportOptions: NormalizedChartViewportSynchronizationOptions = {
    axes: "auto",
    enabled: true,
    mode: "domain",
    phase: "continuous"
};

export const synchronizationDisabled: NormalizedChartSynchronizationOptions | null = null;

function normalizeViewportOptions(
    raw: boolean | ChartViewportSynchronizationOptions | undefined,
    _warned: Set<string>
): NormalizedChartViewportSynchronizationOptions {
    if (raw === undefined || raw === true) {
        return defaultViewportOptions;
    }
    if (raw === false) {
        return { ...defaultViewportOptions, enabled: false };
    }
    const mode = raw.mode === "relative" ? "relative" : "domain";
    return {
        axes: raw.axes ?? defaultViewportOptions.axes,
        enabled: raw.enabled !== false,
        mode,
        phase: raw.phase === "end" ? "end" : "continuous"
    };
}

function normalizeCrosshairOptions(
    raw: boolean | ChartCrosshairSynchronizationOptions | undefined,
    _warned: Set<string>
): NormalizedChartCrosshairSynchronizationOptions {
    if (raw === undefined || raw === true) {
        return defaultCrosshairOptions;
    }
    if (raw === false) {
        return { ...defaultCrosshairOptions, enabled: false };
    }
    return {
        axes: raw.axes ?? defaultCrosshairOptions.axes,
        clearOnLeave: raw.clearOnLeave !== false,
        enabled: raw.enabled !== false,
        match: raw.match === "nearest-point" ? "nearest-point" : "axis-value",
        mode: raw.mode === "relative" ? "relative" : "domain",
        showTooltip: raw.showTooltip === true
    };
}

function normalizeAxisMappings(
    raw: readonly ChartSynchronizationAxisMapping[] | undefined,
    group: string,
    warned: Set<string>
): readonly ChartSynchronizationAxisMapping[] {
    if (!raw || raw.length === 0) {
        return [];
    }
    const bySource = new Map<string, ChartSynchronizationAxisMapping>();
    const targetsByDimension = new Map<string, Set<string>>();
    for (const mapping of raw) {
        if (!mapping || typeof mapping !== "object") {
            continue;
        }
        const source = mapping.source;
        const target = mapping.target;
        if (!source || !target || (source.axis !== "x" && source.axis !== "y") || (target.axis !== "x" && target.axis !== "y")) {
            ChartDiagnostics.warnOnce(
                warned,
                `Invalid synchronization axis mapping in group "${group}". Mapping ignored.`,
                `sync-mapping-invalid-${group}`
            );
            continue;
        }
        const sourceKey = `${source.axis}:${source.axisId}`;
        if (bySource.has(sourceKey)) {
            ChartDiagnostics.warnOnce(
                warned,
                `Duplicate synchronization source mapping for axis "${sourceKey}" in group "${group}". Only the first mapping is used.`,
                `sync-mapping-duplicate-source-${group}-${sourceKey}`
            );
            continue;
        }
        const targetKey = `${target.axis}:${target.axisId}`;
        let dimensionTargets = targetsByDimension.get(target.axis);
        if (!dimensionTargets) {
            dimensionTargets = new Set<string>();
            targetsByDimension.set(target.axis, dimensionTargets);
        }
        if (dimensionTargets.has(targetKey)) {
            ChartDiagnostics.warnOnce(
                warned,
                `Duplicate synchronization target axis "${targetKey}" in group "${group}". Mapping for "${sourceKey}" ignored.`,
                `sync-mapping-duplicate-target-${group}-${targetKey}`
            );
            continue;
        }
        dimensionTargets.add(targetKey);
        bySource.set(sourceKey, { source: { ...source }, target: { ...target } });
    }
    return Array.from(bySource.values());
}

export function normalizeChartSynchronizationOptions(
    input: ChartSynchronizationInput | undefined | null,
    warned?: Set<string>
): NormalizedChartSynchronizationOptions | null {
    if (input === false || input === undefined || input === null) {
        return null;
    }

    let rawOptions: ChartSynchronizationOptions;
    if (typeof input === "string") {
        rawOptions = { group: input };
    } else {
        rawOptions = input;
    }

    const group = typeof rawOptions.group === "string" ? rawOptions.group.trim() : "";
    if (!group) {
        ChartDiagnostics.warnOnce(
            warned ?? new Set<string>(),
            'Chart synchronization requires a non-empty "group". Synchronization is disabled for this chart.',
            "synchronization-invalid-group"
        );
        return null;
    }

    const normalized: NormalizedChartSynchronizationOptions = {
        axisMappings: normalizeAxisMappings(rawOptions.axisMappings, group, warned ?? new Set<string>()),
        crosshair: normalizeCrosshairOptions(rawOptions.crosshair, warned ?? new Set<string>()),
        group,
        viewport: normalizeViewportOptions(rawOptions.viewport, warned ?? new Set<string>())
    };

    if (!normalized.viewport.enabled && !normalized.crosshair.enabled) {
        ChartDiagnostics.warnOnce(
            warned ?? new Set<string>(),
            `Chart synchronization group "${group}" has both viewport and crosshair channels disabled.`,
            `synchronization-all-channels-disabled-${group}`
        );
    }

    return normalized;
}
