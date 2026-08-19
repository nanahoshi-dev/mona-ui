import { describe, expect, it } from "vitest";
import { signal } from "@angular/core";
import { CartesianAxisResolvedContextBuilder } from "./cartesian-axis-resolved-context";
import { CartesianAxisRegistryResolver } from "./cartesian-axis-registry-resolver";
import { CartesianSeriesAxisBindingResolver } from "./cartesian-series-axis-binding-resolver";
import type { ChartXAxisRegistration, ChartYAxisRegistration, ChartBarSeriesRegistration } from "../context/chart-registration-context";

function createMockXAxis(options?: Partial<{
    axisId: string;
    max: number | Date;
    min: number | Date;
    nice: boolean;
    position: "bottom" | "top";
    tickCount: number;
    title: string;
    type: "auto" | "category" | "linear" | "time" | "utc";
}>): ChartXAxisRegistration {
    return {
        axisId: signal(options?.axisId),
        axisLine: signal(true),
        formatter: signal(undefined),
        gridLines: signal(true),
        labelTemplate: signal(undefined),
        max: signal(options?.max),
        min: signal(options?.min),
        nice: signal(options?.nice ?? true),
        position: signal(options?.position ?? "bottom"),
        registrationId: "mock-x",
        tickCount: signal(options?.tickCount),
        title: signal(options?.title ?? ""),
        type: signal(options?.type ?? "auto"),
        visible: signal(true)
    };
}

function createMockYAxis(options?: Partial<{
    axisId: string;
    max: number;
    min: number;
    nice: boolean;
    position: "left" | "right";
    tickCount: number;
    title: string;
    type: "auto" | "category" | "linear" | "log" | "symlog" | "pow" | "sqrt";
}>): ChartYAxisRegistration {
    return {
        axisId: signal(options?.axisId),
        axisLine: signal(true),
        formatter: signal(undefined),
        gridLines: signal(true),
        labelTemplate: signal(undefined),
        max: signal(options?.max),
        min: signal(options?.min),
        nice: signal(options?.nice ?? true),
        position: signal(options?.position ?? "left"),
        registrationId: "mock-y",
        tickCount: signal(options?.tickCount),
        title: signal(options?.title ?? ""),
        type: signal((options?.type ?? "auto") as import("../../models/chart-axis.models").ChartYAxisType),
        visible: signal(true)
    };
}

function createMockBarSeries(options?: Partial<{
    id: string;
    xAxisId: string;
    yAxisId: string;
}>): ChartBarSeriesRegistration {
    return {
        borderRadius: signal(undefined),
        color: signal("#3f6be2"),
        data: signal([{ month: "Jan", val: 10 }]),
        element: { nativeElement: {} as HTMLElement },
        field: signal("val"),
        fillOpacity: signal(1),
        id: options?.id ?? "series-1",
        maxBarWidth: signal(undefined),
        name: signal("Series 1"),
        stack: signal(undefined),
        stackMode: signal("normal"),
        type: "bar",
        valueFormatter: signal(undefined),
        visible: signal(true),
        xAxisId: signal(options?.xAxisId),
        xField: signal("month"),
        yAxisId: signal(options?.yAxisId)
    };
}

describe("CartesianAxisResolvedContextBuilder", () => {
    it("should build dimension-separated axis maps and avoid ID collisions between X and Y axes (MAX3-001)", () => {
        const xAxis = createMockXAxis({ axisId: "shared-id", type: "category" });
        const yAxis = createMockYAxis({ axisId: "shared-id", type: "log" });
        const series = createMockBarSeries({ xAxisId: "shared-id", yAxisId: "shared-id" });

        const axisResolution = CartesianAxisRegistryResolver.resolve([xAxis], [yAxis]);
        const bindingResolution = CartesianSeriesAxisBindingResolver.resolve([series], axisResolution);

        const context = CartesianAxisResolvedContextBuilder.create({
            axisResolution,
            bindingResolution,
            orientation: "vertical",
            resolvedXTypeByAxisId: new Map([["shared-id", "category"]]),
            resolvedYTypeByAxisId: new Map([["shared-id", "log"]]),
            rootXField: "month"
        });

        expect(context.axisValidity.x.get("shared-id")?.valid).toBe(true);
        expect(context.axisValidity.y.get("shared-id")?.valid).toBe(true);
        expect(context.resolvedTypes.x.get("shared-id")).toBe("category");
        expect(context.resolvedTypes.y.get("shared-id")).toBe("log");

        expect(context.resolvedXTypeByAxisId.get("shared-id")).toBe("category");
        expect(context.resolvedYTypeByAxisId.get("shared-id")).toBe("log");
    });

    it("should resolve series context validity with dimension safety", () => {
        const xAxis = createMockXAxis({ axisId: "x-1" });
        const yAxis = createMockYAxis({ axisId: "y-1" });
        const series = createMockBarSeries({ xAxisId: "x-1", yAxisId: "y-1" });

        const axisResolution = CartesianAxisRegistryResolver.resolve([xAxis], [yAxis]);
        const bindingResolution = CartesianSeriesAxisBindingResolver.resolve([series], axisResolution);

        const context = CartesianAxisResolvedContextBuilder.create({
            axisResolution,
            bindingResolution,
            orientation: "vertical",
            resolvedXTypeByAxisId: new Map([["x-1", "category"]]),
            resolvedYTypeByAxisId: new Map([["y-1", "linear"]]),
            rootXField: "month"
        });

        const sCtx = context.resolvedSeriesContextById.get("series-1");
        expect(sCtx).toBeDefined();
        expect(sCtx?.valid).toBe(true);
        expect(sCtx?.xType).toBe("category");
        expect(sCtx?.yType).toBe("linear");
    });
});
