import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { beforeEach, describe, expect, it } from "vitest";
import { ChartSliceLabelTemplateDirective } from "../../directives/chart-slice-label-template.directive";
import type { ChartPolarFillMode, ChartPolarLabelPosition, ChartSliceVisibilityEvent } from "../../models/chart-polar.models";
import type { ChartField } from "../../models/chart.models";
import { ChartInvalidationReason } from "../../internal/context/chart-registration-context";
import { MonaChartComponent } from "../chart/chart.component";
import { MonaPieSeriesComponent } from "./pie-series.component";

@Component({
    imports: [MonaChartComponent, MonaPieSeriesComponent, ChartSliceLabelTemplateDirective],
    template: `
        <mona-chart [data]="data()">
            <mona-pie-series
                [field]="field()"
                [categoryField]="categoryField()"
                [name]="name()"
                [fillMode]="fillMode()"
                [outerRadiusRatio]="outerRadiusRatio()"
                [startAngle]="startAngle()"
                [endAngle]="endAngle()"
                [padAngle]="padAngle()"
                [cornerRadius]="cornerRadius()"
                [showLabels]="showLabels()"
                [labelPosition]="labelPosition()"
                (sliceVisibilityChange)="onSliceVisibilityChange($event)">
                @if (useCustomLabelTemplate()) {
                    <ng-template monaChartSliceLabelTemplate let-slice>
                        <span class="custom-slice-label">{{ slice.formattedPercentage }}</span>
                    </ng-template>
                }
            </mona-pie-series>
        </mona-chart>
    `
})
class TestHostComponent {
    public readonly categoryField = signal<ChartField>("browser");
    public readonly cornerRadius = signal<number | undefined>(undefined);
    public readonly data = signal<readonly unknown[]>([
        { browser: "Chrome", share: 60 },
        { browser: "Safari", share: 30 },
        { browser: "Firefox", share: 10 }
    ]);
    public readonly endAngle = signal(360);
    public readonly field = signal("share");
    public readonly fillMode = signal<ChartPolarFillMode>("solid");
    public readonly labelPosition = signal<ChartPolarLabelPosition>("outside");
    public readonly name = signal("Browser Market Share");
    public readonly outerRadiusRatio = signal(0.9);
    public readonly padAngle = signal(0);
    public readonly showLabels = signal(false);
    public readonly startAngle = signal(0);
    public readonly useCustomLabelTemplate = signal(false);

    public lastVisibilityEvent: ChartSliceVisibilityEvent | null = null;

    public onSliceVisibilityChange(event: ChartSliceVisibilityEvent): void {
        this.lastVisibilityEvent = event;
    }
}

describe("MonaPieSeriesComponent", () => {
    let fixture: ComponentFixture<TestHostComponent>;
    let host: TestHostComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TestHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(TestHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should register pie series and compute polar scene", () => {
        const chart = fixture.debugElement.children[0].componentInstance as MonaChartComponent;
        const scene = chart.scene();

        expect(scene).not.toBeNull();
        expect(scene?.coordinateSystem).toBe("polar");
        expect(scene?.series.length).toBe(1);
        expect(scene?.series[0].type).toBe("pie");
        if (scene && scene.coordinateSystem === "polar" && scene.polarKind === "sector") {
            expect(scene.series[0].slices.length).toBe(3);
        }
    });

    it("should toggle slice visibility and emit sliceVisibilityChange", () => {
        const pieDebugEl = fixture.debugElement.query(By.directive(MonaPieSeriesComponent));
        const pieComponent = pieDebugEl?.componentInstance as MonaPieSeriesComponent;

        expect(pieComponent).toBeDefined();

        const isVisible = pieComponent.toggleSlice(0);
        fixture.detectChanges();

        expect(isVisible).toBe(false);
        expect(host.lastVisibilityEvent).not.toBeNull();
        expect(host.lastVisibilityEvent?.dataIndex).toBe(0);
        expect(host.lastVisibilityEvent?.seriesType).toBe("pie");
        expect(host.lastVisibilityEvent?.visible).toBe(false);

        const chart = fixture.debugElement.children[0].componentInstance as MonaChartComponent;
        chart.recomputeScene();
        const scene = chart.scene();
        // Slices visible in geometry should now be 2
        if (scene && scene.coordinateSystem === "polar" && scene.polarKind === "sector") {
            expect(scene.series[0].slices.length).toBe(2);
        }
    });

    it("should support outside and inside labelPosition", () => {
        host.showLabels.set(true);
        host.labelPosition.set("outside");
        fixture.detectChanges();

        const chart = fixture.debugElement.children[0].componentInstance as MonaChartComponent;
        chart.recomputeScene();
        const scene = chart.scene();

        if (scene && scene.coordinateSystem === "polar" && scene.polarKind === "sector") {
            expect(scene.series[0].labelPosition).toBe("outside");
            expect(scene.series[0].slices[0].label).toBeDefined();
            expect(scene.series[0].slices[0].label?.visible).toBe(true);
        }

        // Switch to inside
        host.labelPosition.set("inside");
        fixture.detectChanges();
        chart.recomputeScene();
        const insideScene = chart.scene();

        if (insideScene && insideScene.coordinateSystem === "polar" && insideScene.polarKind === "sector") {
            expect(insideScene.series[0].labelPosition).toBe("inside");
        }
    });

    it("should support solid and gradient fillMode", () => {
        const chart = fixture.debugElement.children[0].componentInstance as MonaChartComponent;
        chart.recomputeScene();
        let scene = chart.scene();

        if (scene && scene.coordinateSystem === "polar" && scene.polarKind === "sector") {
            expect(scene.series[0].fillMode).toBe("solid");
        }

        host.fillMode.set("gradient");
        fixture.detectChanges();
        chart.recomputeScene();
        scene = chart.scene();

        if (scene && scene.coordinateSystem === "polar" && scene.polarKind === "sector") {
            expect(scene.series[0].fillMode).toBe("gradient");
        }
    });

    it("should support custom slice label template", () => {
        host.showLabels.set(true);
        host.useCustomLabelTemplate.set(true);
        fixture.detectChanges();

        const chart = fixture.debugElement.children[0].componentInstance as MonaChartComponent;
        chart.recomputeScene();
        fixture.detectChanges();

        const customLabels = fixture.nativeElement.querySelectorAll(".custom-slice-label");
        expect(customLabels.length).toBe(3);
    });

    it("should prune hidden indices when dataset shrinks", () => {
        const pieDebugEl = fixture.debugElement.query(By.directive(MonaPieSeriesComponent));
        const pieComponent = pieDebugEl?.componentInstance as MonaPieSeriesComponent;

        // Hide index 2 (Firefox)
        pieComponent.toggleSlice(2);
        fixture.detectChanges();

        // Shrink data to length 2
        host.data.set([
            { browser: "Chrome", share: 70 },
            { browser: "Safari", share: 30 }
        ]);
        fixture.detectChanges();

        const chart = fixture.debugElement.children[0].componentInstance as MonaChartComponent;
        chart.recomputeScene();
        const scene = chart.scene();

        // All 2 remaining slices should be visible
        if (scene && scene.coordinateSystem === "polar" && scene.polarKind === "sector") {
            expect(scene.series[0].slices.length).toBe(2);
        }
    });

    it("should resolve category and emit sliceVisibilityChange with function accessor", () => {
        host.categoryField.set(
            (d: unknown) =>
                typeof d === "object" && d !== null && "browser" in d
                    ? `Browser: ${(d as { browser: string }).browser}`
                    : ""
        );
        fixture.detectChanges();

        const pieDebugEl = fixture.debugElement.query(By.directive(MonaPieSeriesComponent));
        const pieComponent = pieDebugEl?.componentInstance as MonaPieSeriesComponent;

        pieComponent.toggleSlice(0);
        fixture.detectChanges();

        expect(host.lastVisibilityEvent?.category).toBe("Browser: Chrome");
    });

    it("should trigger animation when toggling slice visibility", () => {
        const chart = fixture.debugElement.children[0].componentInstance as MonaChartComponent;
        chart.recomputeScene();

        const pieDebugEl = fixture.debugElement.query(By.directive(MonaPieSeriesComponent));
        const pieComponent = pieDebugEl?.componentInstance as MonaPieSeriesComponent;

        pieComponent.toggleSlice(1);
        fixture.detectChanges();
        chart.recomputeScene(ChartInvalidationReason.Visibility);

        expect(chart.isAnimating()).toBe(true);
    });
});
