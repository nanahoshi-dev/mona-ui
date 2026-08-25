import type { ResolvedChartCartesianAxisType } from "../scale/chart-scale";

export interface ParsedCartesianAxisMeasurementKey {
    readonly axis: "x" | "y";
    readonly axisId: string;
    readonly resolvedType: ResolvedChartCartesianAxisType;
    readonly valueString: string;
}

const AXIS_PREFIX = "axis:";

export function createCartesianAxisMeasurementKey(
    axis: "x" | "y",
    axisId: string,
    resolvedType: ResolvedChartCartesianAxisType,
    value: unknown
): string {
    const encodedId = encodeURIComponent(axisId);
    return `${AXIS_PREFIX}${axis}:${encodedId}:${resolvedType}:${String(value)}`;
}

export function parseCartesianAxisMeasurementKey(key: string): ParsedCartesianAxisMeasurementKey | null {
    if (!key.startsWith(AXIS_PREFIX)) {
        return null;
    }

    const rest = key.slice(AXIS_PREFIX.length);
    const firstColon = rest.indexOf(":");
    if (firstColon === -1) {
        return null;
    }

    const axisStr = rest.slice(0, firstColon);
    if (axisStr !== "x" && axisStr !== "y") {
        return null;
    }
    const axis = axisStr as "x" | "y";

    const secondColon = rest.indexOf(":", firstColon + 1);
    if (secondColon === -1) {
        return null;
    }
    const encodedAxisId = rest.slice(firstColon + 1, secondColon);
    let axisId: string;
    try {
        axisId = decodeURIComponent(encodedAxisId);
    } catch {
        axisId = encodedAxisId;
    }

    const thirdColon = rest.indexOf(":", secondColon + 1);
    if (thirdColon === -1) {
        return null;
    }
    const resolvedTypeStr = rest.slice(secondColon + 1, thirdColon);
    const validTypes: readonly string[] = ["category", "linear", "log", "symlog", "pow", "sqrt", "time", "utc"];
    if (!validTypes.includes(resolvedTypeStr)) {
        return null;
    }
    const resolvedType = resolvedTypeStr as ResolvedChartCartesianAxisType;

    const valueString = rest.slice(thirdColon + 1);

    return {
        axis,
        axisId,
        resolvedType,
        valueString
    };
}

export function createSectorLabelMeasurementKey(sliceId: string): string {
    return `sector:${sliceId}`;
}

export function createAngularLabelMeasurementKey(tickKey: string): string {
    return `angular:${tickKey}`;
}

export function createRadialLabelMeasurementKey(tickKey: string): string {
    return `radial:${tickKey}`;
}
