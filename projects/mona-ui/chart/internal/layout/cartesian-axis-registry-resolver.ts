import type { ChartAxisLabelTemplateDirective } from "../../directives/chart-axis-label-template.directive";
import type { ChartXAxisRegistration, ChartYAxisRegistration } from "../context/chart-registration-context";
import type {
    ChartAxisFormatter,
    ChartAxisLabelRotation,
    ChartAxisPosition,
    ChartXAxisPosition,
    ChartXAxisType,
    ChartYAxisPosition,
    ChartYAxisType
} from "../../models/chart-axis.models";
import type { ChartField } from "../../models/chart.models";
import { CartesianStageTracker } from "./cartesian-stage-instrumentation";

export interface ResolvedCartesianAxisDescriptor<D extends "x" | "y" = "x" | "y"> {
    readonly axisId: string;
    readonly axisLine: boolean;
    readonly dimension: D;
    readonly explicitMax?: Date | number;
    readonly explicitMin?: Date | number;
    readonly exponent?: number;
    readonly field?: ChartField;
    readonly formatter?: ChartAxisFormatter;
    readonly gridLines?: boolean;
    readonly isPrimary: boolean;
    readonly isSynthetic: boolean;
    readonly labelMaxWidth?: number;
    readonly labelPadding?: number;
    readonly labelRotation?: ChartAxisLabelRotation;
    readonly labelTemplate?: ChartAxisLabelTemplateDirective;
    readonly labels?: boolean;
    readonly logBase?: number;
    readonly nice: boolean;
    readonly order: number;
    readonly position: D extends "x" ? ChartXAxisPosition : ChartYAxisPosition;
    readonly registration?: D extends "x" ? ChartXAxisRegistration : ChartYAxisRegistration;
    readonly registrationId: string;
    readonly stackIndex: number;
    readonly symlogConstant?: number;
    readonly tickCount?: number;
    readonly tickMarks?: boolean;
    readonly tickSize?: number;
    readonly title: string;
    readonly titlePadding?: number;
    readonly type: D extends "x" ? ChartXAxisType : ChartYAxisType;
    readonly userClass?: string;
    readonly visible: boolean;
}

export interface CartesianAxisRegistryResolution {
    getAxis(dimension: "x", axisId: string): ResolvedCartesianAxisDescriptor<"x"> | undefined;
    getAxis(dimension: "y", axisId: string): ResolvedCartesianAxisDescriptor<"y"> | undefined;
    getAxis(dimension: "x" | "y", axisId: string): ResolvedCartesianAxisDescriptor | undefined;
    readonly primaryXAxisId: string;
    readonly primaryYAxisId: string;
    readonly warnings: readonly string[];
    readonly xAxes: readonly ResolvedCartesianAxisDescriptor<"x">[];
    readonly xAxisById: ReadonlyMap<string, ResolvedCartesianAxisDescriptor<"x">>;
    readonly yAxes: readonly ResolvedCartesianAxisDescriptor<"y">[];
    readonly yAxisById: ReadonlyMap<string, ResolvedCartesianAxisDescriptor<"y">>;
}

export class CartesianAxisRegistryResolver {
    public static resolve(
        xRegistrations?: readonly ChartXAxisRegistration[],
        yRegistrations?: readonly ChartYAxisRegistration[]
    ): CartesianAxisRegistryResolution {
        CartesianStageTracker.current?.onAxisRegistry?.();
        const warnings: string[] = [];
        const seenXIds = new Set<string>();
        const seenYIds = new Set<string>();
        const sideCounts: Record<ChartAxisPosition, number> = {
            bottom: 0,
            left: 0,
            right: 0,
            top: 0
        };

        const resolvedX: ResolvedCartesianAxisDescriptor<"x">[] = [];
        const resolvedY: ResolvedCartesianAxisDescriptor<"y">[] = [];
        const xAxisById = new Map<string, ResolvedCartesianAxisDescriptor<"x">>();
        const yAxisById = new Map<string, ResolvedCartesianAxisDescriptor<"y">>();

        const rawX = xRegistrations && xRegistrations.length > 0 ? xRegistrations : [];
        const rawY = yRegistrations && yRegistrations.length > 0 ? yRegistrations : [];

        // Resolve X axes
        if (rawX.length === 0) {
            const syntheticX: ResolvedCartesianAxisDescriptor<"x"> = {
                axisId: "default-x",
                axisLine: true,
                dimension: "x",
                isPrimary: true,
                isSynthetic: true,
                nice: true,
                order: 0,
                position: "bottom",
                registrationId: "synthetic-x-0",
                stackIndex: 0,
                title: "",
                type: "auto",
                visible: true
            };
            resolvedX.push(syntheticX);
            xAxisById.set("default-x", syntheticX);
            sideCounts.bottom++;
        } else {
            for (let i = 0; i < rawX.length; i++) {
                const reg = rawX[i];
                const rawExplicitId = reg.axisId?.()?.trim();
                let id = rawExplicitId;
                if (!id) {
                    const regId = reg.registrationId ?? `mona-x-${i}`;
                    id = i === 0 ? "default-x" : `__mona_x_${encodeURIComponent(regId)}__`;
                }

                if (rawExplicitId && seenXIds.has(rawExplicitId)) {
                    warnings.push(
                        `[MonaChart] Duplicate X axis ID "${rawExplicitId}" detected. Later duplicate axis remains inactive.`
                    );
                    continue;
                }
                seenXIds.add(id);

                const pos = reg.position?.() ?? "bottom";
                const stackIndex = sideCounts[pos]++;

                const desc: ResolvedCartesianAxisDescriptor<"x"> = {
                    axisId: id,
                    axisLine: reg.axisLine?.() ?? true,
                    dimension: "x",
                    explicitMax: reg.max?.(),
                    explicitMin: reg.min?.(),
                    exponent: reg.exponent?.(),
                    field: reg.field?.(),
                    formatter: reg.formatter?.(),
                    gridLines: reg.gridLines?.(),
                    isPrimary: resolvedX.length === 0,
                    isSynthetic: false,
                    labelMaxWidth: reg.labelMaxWidth?.(),
                    labelPadding: reg.labelPadding?.(),
                    labelRotation: reg.labelRotation?.(),
                    labels: reg.labels?.(),
                    labelTemplate: reg.labelTemplate?.(),
                    logBase: reg.logBase?.(),
                    nice: reg.nice?.() ?? true,
                    order: resolvedX.length,
                    position: pos,
                    registration: reg,
                    registrationId: reg.registrationId ?? `mona-x-${i}`,
                    stackIndex,
                    symlogConstant: reg.symlogConstant?.(),
                    tickCount: reg.tickCount?.(),
                    tickMarks: reg.tickMarks?.(),
                    tickSize: reg.tickSize?.(),
                    title: reg.title?.() ?? "",
                    titlePadding: reg.titlePadding?.(),
                    type: reg.type?.() ?? "auto",
                    userClass: reg.userClass?.(),
                    visible: reg.visible?.() ?? true
                };
                resolvedX.push(desc);
                xAxisById.set(id, desc);
            }
        }

        // Resolve Y axes
        if (rawY.length === 0) {
            const syntheticY: ResolvedCartesianAxisDescriptor<"y"> = {
                axisId: "default-y",
                axisLine: true,
                dimension: "y",
                isPrimary: true,
                isSynthetic: true,
                nice: true,
                order: resolvedX.length,
                position: "left",
                registrationId: "synthetic-y-0",
                stackIndex: 0,
                title: "",
                type: "auto",
                visible: true
            };
            resolvedY.push(syntheticY);
            yAxisById.set("default-y", syntheticY);
            sideCounts.left++;
        } else {
            for (let i = 0; i < rawY.length; i++) {
                const reg = rawY[i];
                const rawExplicitId = reg.axisId?.()?.trim();
                let id = rawExplicitId;
                if (!id) {
                    const regId = reg.registrationId ?? `mona-y-${i}`;
                    id = i === 0 ? "default-y" : `__mona_y_${encodeURIComponent(regId)}__`;
                }

                if (rawExplicitId && seenYIds.has(rawExplicitId)) {
                    warnings.push(
                        `[MonaChart] Duplicate Y axis ID "${rawExplicitId}" detected. Later duplicate axis remains inactive.`
                    );
                    continue;
                }
                seenYIds.add(id);

                const pos = reg.position?.() ?? "left";
                const stackIndex = sideCounts[pos]++;

                const desc: ResolvedCartesianAxisDescriptor<"y"> = {
                    axisId: id,
                    axisLine: reg.axisLine?.() ?? true,
                    dimension: "y",
                    explicitMax: reg.max?.(),
                    explicitMin: reg.min?.(),
                    exponent: reg.exponent?.(),
                    formatter: reg.formatter?.(),
                    gridLines: reg.gridLines?.(),
                    isPrimary: resolvedY.length === 0,
                    isSynthetic: false,
                    labelMaxWidth: reg.labelMaxWidth?.(),
                    labelPadding: reg.labelPadding?.(),
                    labelRotation: reg.labelRotation?.(),
                    labels: reg.labels?.(),
                    labelTemplate: reg.labelTemplate?.(),
                    logBase: reg.logBase?.(),
                    nice: reg.nice?.() ?? true,
                    order: resolvedX.length + resolvedY.length,
                    position: pos,
                    registration: reg,
                    registrationId: reg.registrationId ?? `mona-y-${i}`,
                    stackIndex,
                    symlogConstant: reg.symlogConstant?.(),
                    tickCount: reg.tickCount?.(),
                    tickMarks: reg.tickMarks?.(),
                    tickSize: reg.tickSize?.(),
                    title: reg.title?.() ?? "",
                    titlePadding: reg.titlePadding?.(),
                    type: reg.type?.() ?? "auto",
                    userClass: reg.userClass?.(),
                    visible: reg.visible?.() ?? true
                };
                resolvedY.push(desc);
                yAxisById.set(id, desc);
            }
        }

        const primaryXAxisId = resolvedX.find(a => a.isPrimary)?.axisId ?? resolvedX[0].axisId;
        const primaryYAxisId = resolvedY.find(a => a.isPrimary)?.axisId ?? resolvedY[0].axisId;

        const getAxis = ((dimension: "x" | "y", axisId: string) => {
            return dimension === "x" ? xAxisById.get(axisId) : yAxisById.get(axisId);
        }) as CartesianAxisRegistryResolution["getAxis"];

        return {
            getAxis,
            primaryXAxisId,
            primaryYAxisId,
            warnings,
            xAxes: resolvedX,
            xAxisById,
            yAxes: resolvedY,
            yAxisById
        };
    }
}
