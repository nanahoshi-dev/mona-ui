import { Component, signal, viewChild } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChartComponent } from "./chart.component";
import { BarSeriesComponent } from "../bar-series/bar-series.component";
import { ChartXAxisComponent } from "../chart-x-axis/chart-x-axis.component";
import { ChartYAxisComponent } from "../chart-y-axis/chart-y-axis.component";
import { ChartBrushComponent } from "../chart-brush/chart-brush.component";
import { ChartSelectionComponent } from "../chart-selection/chart-selection.component";
import { ChartDataLabelTemplateDirective } from "../../directives/chart-data-label-template.directive";
import { ChartLayoutEngine } from "../../internal/layout/chart-layout-engine";
import { CartesianLayoutEngine } from "../../internal/layout/cartesian-layout-engine";
import { ChartInvalidationReason } from "../../internal/context/chart-registration-context";
import type { ChartBrushChangeEvent } from "../../models/chart-brush.models";
import type { ChartSelectionChangeEvent } from "../../models/chart-selection.models";
import type { ChartDataLabelOptions, ChartDataLabelPosition } from "../../models/chart-data-label.models";

@Component({
    imports: [
        ChartComponent,
        BarSeriesComponent,
        ChartXAxisComponent,
        ChartYAxisComponent,
        ChartBrushComponent,
        ChartSelectionComponent,
        ChartDataLabelTemplateDirective
    ],
    template: `
        <mona-chart
            [animation]="false"
            [data]="data()"
            [xField]="'name'"
            [style.width.px]="600"
            [style.height.px]="400">
            <mona-chart-x-axis />
            <mona-chart-y-axis />
            <mona-bar-series
                [field]="'value'"
                [name]="'Bars'"
                [dataLabels]="dataLabelOptions()">
                @if (showTemplate()) {
                    <ng-template monaChartDataLabel let-ctx>
                        <span class="test-label">{{ ctx.formattedValue }}</span>
                    </ng-template>
                }
            </mona-bar-series>
            <mona-chart-selection
                [mode]="'multiple'"
                [selectedMarkIds]="controlledSelectedIds()"
                [color]="selectionColor()"
                [fillOpacity]="selectionFillOpacity()"
                [strokeWidth]="selectionStrokeWidth()"
                (selectionChange)="onSelectionChange($event)" />
            <mona-chart-brush
                [enabled]="brushEnabled()"
                [activation]="'drag'"
                [selectionBehavior]="'add'"
                [fillColor]="brushFillColor()"
                [fillOpacity]="brushFillOpacity()"
                [borderColor]="brushBorderColor()"
                [borderWidth]="brushBorderWidth()"
                [lineStyle]="brushLineStyle()"
                (brushChange)="onBrushChange($event)" />
        </mona-chart>
    `
})
class PresentationStageContractHostComponent {
    public readonly chart = viewChild.required(ChartComponent);
    public readonly data = signal([
        { name: "A", value: 10 },
        { name: "B", value: 20 },
        { name: "C", value: 30 }
    ]);
    public readonly controlledSelectedIds = signal<readonly string[] | undefined>(undefined);
    public readonly selectionColor = signal<string | undefined>(undefined);
    public readonly selectionFillOpacity = signal<number | undefined>(undefined);
    public readonly selectionStrokeWidth = signal<number | undefined>(undefined);

    public readonly dataLabelOptions = signal<boolean | ChartDataLabelOptions>(true);
    public readonly showTemplate = signal(false);

    public readonly brushEnabled = signal(true);
    public readonly brushFillColor = signal<string | undefined>(undefined);
    public readonly brushFillOpacity = signal<number | undefined>(undefined);
    public readonly brushBorderColor = signal<string | undefined>(undefined);
    public readonly brushBorderWidth = signal<number | undefined>(undefined);
    public readonly brushLineStyle = signal<"solid" | "dashed" | "dotted" | undefined>(undefined);

    public brushEvents: ChartBrushChangeEvent[] = [];
    public selectionEvents: ChartSelectionChangeEvent[] = [];

    public onBrushChange(evt: ChartBrushChangeEvent): void {
        this.brushEvents.push(evt);
    }

    public onSelectionChange(evt: ChartSelectionChangeEvent): void {
        this.selectionEvents.push(evt);
    }
}

describe("Chart Presentation Stage Contract Invalidation Boundaries (GDSB-R4-002)", () => {
    let fixture: ComponentFixture<PresentationStageContractHostComponent>;
    let host: PresentationStageContractHostComponent;
    let stageASpy: ReturnType<typeof vi.spyOn>;
    let stageBSpy: ReturnType<typeof vi.spyOn>;
    let stageCSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(async () => {
        vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
            bottom: 400,
            height: 400,
            left: 0,
            right: 600,
            top: 0,
            width: 600,
            x: 0,
            y: 0,
            toJSON: () => {}
        });
        vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
            arc: vi.fn(),
            beginPath: vi.fn(),
            bezierCurveTo: vi.fn(),
            clearRect: vi.fn(),
            clip: vi.fn(),
            closePath: vi.fn(),
            createLinearGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
            createRadialGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
            fill: vi.fn(),
            fillRect: vi.fn(),
            fillText: vi.fn(),
            lineTo: vi.fn(),
            measureText: vi.fn().mockReturnValue({ width: 20 }),
            moveTo: vi.fn(),
            quadraticCurveTo: vi.fn(),
            rect: vi.fn(),
            restore: vi.fn(),
            save: vi.fn(),
            setLineDash: vi.fn(),
            setTransform: vi.fn(),
            stroke: vi.fn(),
            strokeRect: vi.fn(),
            strokeText: vi.fn()
        } as any);

        stageASpy = vi.spyOn(ChartLayoutEngine, "prepareStructural");
        stageBSpy = vi.spyOn(CartesianLayoutEngine, "recomputeChrome");
        stageCSpy = vi.spyOn(CartesianLayoutEngine, "projectRuntime");

        await TestBed.configureTestingModule({
            imports: [PresentationStageContractHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(PresentationStageContractHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();
    });

    function expectStageDeltas(
        beforeA: number,
        beforeB: number,
        beforeC: number,
        expected: { a: number; b: number; c: number }
    ): void {
        expect(stageASpy.mock.calls.length - beforeA).toBe(expected.a);
        expect(stageBSpy.mock.calls.length - beforeB).toBe(expected.b);
        expect(stageCSpy.mock.calls.length - beforeC).toBe(expected.c);
    }

    describe("Positive Controls", () => {
        it("invokes Stage C (A0 / B0 / C1) on viewport invalidation", () => {
            const beforeA = stageASpy.mock.calls.length;
            const beforeB = stageBSpy.mock.calls.length;
            const beforeC = stageCSpy.mock.calls.length;

            host.chart().recomputeScene(ChartInvalidationReason.Viewport);
            fixture.detectChanges();

            expectStageDeltas(beforeA, beforeB, beforeC, { a: 0, b: 0, c: 1 });
        });

        it("invokes Stage A (Stage A > 0) on structural data change", () => {
            const beforeA = stageASpy.mock.calls.length;

            host.data.set([
                { name: "A", value: 15 },
                { name: "B", value: 25 },
                { name: "C", value: 35 },
                { name: "D", value: 45 }
            ]);
            fixture.detectChanges();

            expect(stageASpy.mock.calls.length - beforeA).toBeGreaterThan(0);
        });
    });

    describe("Persistent Selection Matrix (A0 / B0 / C0)", () => {
        it("pointer click selection mutation does not invoke Stage A, B, or C", () => {
            const chartEl = fixture.nativeElement.querySelector("canvas") as HTMLCanvasElement;
            const beforeA = stageASpy.mock.calls.length;
            const beforeB = stageBSpy.mock.calls.length;
            const beforeC = stageCSpy.mock.calls.length;

            chartEl.dispatchEvent(
                new MouseEvent("click", {
                    clientX: 100,
                    clientY: 200,
                    bubbles: true
                })
            );
            fixture.detectChanges();

            expectStageDeltas(beforeA, beforeB, beforeC, { a: 0, b: 0, c: 0 });
        });

        it("keyboard Space selection mutation does not invoke Stage A, B, or C", () => {
            const container = fixture.nativeElement.querySelector("mona-chart") as HTMLElement;

            container.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }));
            fixture.detectChanges();

            const beforeA = stageASpy.mock.calls.length;
            const beforeB = stageBSpy.mock.calls.length;
            const beforeC = stageCSpy.mock.calls.length;

            container.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: " " }));
            fixture.detectChanges();

            expectStageDeltas(beforeA, beforeB, beforeC, { a: 0, b: 0, c: 0 });
        });

        it("controlled selection adoption does not invoke Stage A, B, or C", () => {
            const beforeA = stageASpy.mock.calls.length;
            const beforeB = stageBSpy.mock.calls.length;
            const beforeC = stageCSpy.mock.calls.length;

            host.controlledSelectedIds.set(["s0:0", "s0:1"]);
            fixture.detectChanges();

            expectStageDeltas(beforeA, beforeB, beforeC, { a: 0, b: 0, c: 0 });
        });

        it("selection style options change does not invoke Stage A, B, or C", () => {
            const beforeA = stageASpy.mock.calls.length;
            const beforeB = stageBSpy.mock.calls.length;
            const beforeC = stageCSpy.mock.calls.length;

            host.selectionColor.set("#ef4444");
            host.selectionFillOpacity.set(0.6);
            host.selectionStrokeWidth.set(3);
            fixture.detectChanges();

            expectStageDeltas(beforeA, beforeB, beforeC, { a: 0, b: 0, c: 0 });
        });
    });

    describe("Generic Data Labels Matrix (A0 / B0 / C0)", () => {
        it("toggling dataLabels enabled does not invoke Stage A, B, or C", () => {
            const beforeA = stageASpy.mock.calls.length;
            const beforeB = stageBSpy.mock.calls.length;
            const beforeC = stageCSpy.mock.calls.length;

            host.dataLabelOptions.set(false);
            fixture.detectChanges();

            expectStageDeltas(beforeA, beforeB, beforeC, { a: 0, b: 0, c: 0 });

            host.dataLabelOptions.set(true);
            fixture.detectChanges();

            expectStageDeltas(beforeA, beforeB, beforeC, { a: 0, b: 0, c: 0 });
        });

        it("changing dataLabel position and collision options does not invoke Stage A, B, or C", () => {
            const beforeA = stageASpy.mock.calls.length;
            const beforeB = stageBSpy.mock.calls.length;
            const beforeC = stageCSpy.mock.calls.length;

            host.dataLabelOptions.set({
                collisionPadding: 4,
                maxLabels: 10,
                overflow: "hide",
                position: "inside-end"
            });
            fixture.detectChanges();

            expectStageDeltas(beforeA, beforeB, beforeC, { a: 0, b: 0, c: 0 });
        });

        it("changing dataLabel formatter and color does not invoke Stage A, B, or C", () => {
            const beforeA = stageASpy.mock.calls.length;
            const beforeB = stageBSpy.mock.calls.length;
            const beforeC = stageCSpy.mock.calls.length;

            host.dataLabelOptions.set({
                color: "#10b981",
                formatter: (ctx: any) => `${ctx.value} pts`
            });
            fixture.detectChanges();

            expectStageDeltas(beforeA, beforeB, beforeC, { a: 0, b: 0, c: 0 });
        });

        it("custom template rendering and measurement does not invoke Stage A, B, or C", () => {
            const beforeA = stageASpy.mock.calls.length;
            const beforeB = stageBSpy.mock.calls.length;
            const beforeC = stageCSpy.mock.calls.length;

            host.showTemplate.set(true);
            fixture.detectChanges();

            expectStageDeltas(beforeA, beforeB, beforeC, { a: 0, b: 0, c: 0 });
        });
    });

    describe("Brush Matrix (A0 / B0 / C0)", () => {
        it("threshold start and pointermove update do not invoke Stage A, B, or C", () => {
            const chartEl = fixture.nativeElement.querySelector("canvas") as HTMLCanvasElement;

            const beforeA = stageASpy.mock.calls.length;
            const beforeB = stageBSpy.mock.calls.length;
            const beforeC = stageCSpy.mock.calls.length;

            chartEl.dispatchEvent(
                new PointerEvent("pointerdown", {
                    clientX: 60,
                    clientY: 60,
                    pointerType: "mouse",
                    bubbles: true
                })
            );
            chartEl.dispatchEvent(
                new PointerEvent("pointermove", {
                    clientX: 250,
                    clientY: 250,
                    pointerType: "mouse",
                    bubbles: true
                })
            );
            host.chart().flushPendingRender();
            fixture.detectChanges();

            expect(host.brushEvents.length).toBe(1);
            expect(host.brushEvents[0].phase).toBe("start");
            expectStageDeltas(beforeA, beforeB, beforeC, { a: 0, b: 0, c: 0 });

            chartEl.dispatchEvent(
                new PointerEvent("pointermove", {
                    clientX: 300,
                    clientY: 300,
                    pointerType: "mouse",
                    bubbles: true
                })
            );
            host.chart().flushPendingRender();
            fixture.detectChanges();

            expect(host.brushEvents.length).toBe(2);
            expect(host.brushEvents[1].phase).toBe("update");
            expectStageDeltas(beforeA, beforeB, beforeC, { a: 0, b: 0, c: 0 });
        });

        it("brush end and synchronization to selection do not invoke Stage A, B, or C", () => {
            const chartEl = fixture.nativeElement.querySelector("canvas") as HTMLCanvasElement;

            chartEl.dispatchEvent(
                new PointerEvent("pointerdown", {
                    clientX: 60,
                    clientY: 60,
                    pointerType: "mouse",
                    bubbles: true
                })
            );
            chartEl.dispatchEvent(
                new PointerEvent("pointermove", {
                    clientX: 300,
                    clientY: 300,
                    pointerType: "mouse",
                    bubbles: true
                })
            );
            host.chart().flushPendingRender();
            fixture.detectChanges();

            const beforeA = stageASpy.mock.calls.length;
            const beforeB = stageBSpy.mock.calls.length;
            const beforeC = stageCSpy.mock.calls.length;

            chartEl.dispatchEvent(
                new PointerEvent("pointerup", {
                    clientX: 300,
                    clientY: 300,
                    pointerType: "mouse",
                    bubbles: true
                })
            );
            fixture.detectChanges();

            expect(host.brushEvents.length).toBe(2);
            expect(host.brushEvents[1].phase).toBe("end");
            expectStageDeltas(beforeA, beforeB, beforeC, { a: 0, b: 0, c: 0 });
        });

        it("brush cancellation via Escape key does not invoke Stage A, B, or C", () => {
            const chartEl = fixture.nativeElement.querySelector("canvas") as HTMLCanvasElement;

            chartEl.dispatchEvent(
                new PointerEvent("pointerdown", {
                    clientX: 60,
                    clientY: 60,
                    pointerType: "mouse",
                    bubbles: true
                })
            );
            chartEl.dispatchEvent(
                new PointerEvent("pointermove", {
                    clientX: 200,
                    clientY: 200,
                    pointerType: "mouse",
                    bubbles: true
                })
            );
            host.chart().flushPendingRender();
            fixture.detectChanges();

            const beforeA = stageASpy.mock.calls.length;
            const beforeB = stageBSpy.mock.calls.length;
            const beforeC = stageCSpy.mock.calls.length;

            const container = fixture.nativeElement.querySelector("mona-chart") as HTMLElement;
            container.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
            fixture.detectChanges();

            expect(host.brushEvents.length).toBe(2);
            expect(host.brushEvents[1].phase).toBe("cancel");
            expectStageDeltas(beforeA, beforeB, beforeC, { a: 0, b: 0, c: 0 });
        });

        it("brush presentation styling changes do not invoke Stage A, B, or C", () => {
            const beforeA = stageASpy.mock.calls.length;
            const beforeB = stageBSpy.mock.calls.length;
            const beforeC = stageCSpy.mock.calls.length;

            host.brushFillColor.set("rgba(59, 130, 246, 0.2)");
            host.brushFillOpacity.set(0.3);
            host.brushBorderColor.set("#2563eb");
            host.brushBorderWidth.set(2);
            host.brushLineStyle.set("dashed");
            fixture.detectChanges();

            expectStageDeltas(beforeA, beforeB, beforeC, { a: 0, b: 0, c: 0 });
        });
    });
});
