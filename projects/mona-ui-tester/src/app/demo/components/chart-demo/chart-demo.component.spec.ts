import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { beforeEach, describe, expect, it } from "vitest";
import { ChartComponent } from "@nanahoshi/mona-ui/chart";
import { ChartDemoComponent } from "./chart-demo.component";

describe("ChartDemoComponent", () => {
    let component: ChartDemoComponent;
    let fixture: ComponentFixture<ChartDemoComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ChartDemoComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(ChartDemoComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should switch tabs including pie and donut", () => {
        component.setTab("pie");
        fixture.detectChanges();
        expect(fixture.nativeElement.textContent).toContain("Desktop Browser Usage Distribution");

        component.setTab("donut");
        fixture.detectChanges();
        expect(fixture.nativeElement.textContent).toContain("Cloud Infrastructure Revenue");

        component.setTab("time");
        fixture.detectChanges();
        expect(fixture.nativeElement.textContent).toContain("Continuous System Telemetry");

        component.setTab("grouped");
        fixture.detectChanges();
        expect(fixture.nativeElement.textContent).toContain("Multi-Series Grouped Bar Comparison");

        component.setTab("stacked-bar");
        fixture.detectChanges();
        expect(fixture.nativeElement.textContent).toContain("Cumulative Stacked Bar Chart");

        component.setTab("percent-bar");
        fixture.detectChanges();
        expect(fixture.nativeElement.textContent).toContain("100% Stacked Bar Chart");

        component.setTab("stacked-area");
        fixture.detectChanges();
        expect(fixture.nativeElement.textContent).toContain("Cumulative Stacked Area Chart");

        component.setTab("percent-area");
        fixture.detectChanges();
        expect(fixture.nativeElement.textContent).toContain("100% Stacked Area Chart");

        component.setTab("pan-zoom");
        fixture.detectChanges();
        expect(fixture.nativeElement.textContent).toContain("Interactive Pan & Zoom Studio");

        component.setTab("multi-axis");
        fixture.detectChanges();
        expect(fixture.nativeElement.textContent).toContain("Enterprise Performance Dashboard");

        component.setTab("custom");
        fixture.detectChanges();
        expect(fixture.nativeElement.textContent).toContain("Custom Angular Templates");
    });

    it("should handle Pan & Zoom actions and telemetry data randomization", () => {
        component.setTab("pan-zoom");
        fixture.detectChanges();

        component.zoomInPanZoom();
        expect(component.eventLogs()[0].details).toContain("Zoom In");

        component.zoomOutPanZoom();
        expect(component.eventLogs()[0].details).toContain("Zoom Out");

        component.panLeftPanZoom();
        expect(component.eventLogs()[0].details).toContain("Pan Left");

        component.panRightPanZoom();
        expect(component.eventLogs()[0].details).toContain("Pan Right");

        component.panUpPanZoom();
        expect(component.eventLogs()[0].details).toContain("Pan Up");

        component.panDownPanZoom();
        expect(component.eventLogs()[0].details).toContain("Pan Down");

        component.onPanZoomAxisTargetChange("x");
        expect(component.eventLogs()[0].details).toContain("Pan & Zoom Target Axes: x");

        component.fitPanZoomWindow();
        expect(component.eventLogs()[0].details).toContain("Fit Viewport Window");

        component.resetPanZoom();
        expect(component.eventLogs()[0].details).toContain("Reset Viewport");

        component.randomizeTelemetryData();
        expect(component.eventLogs()[0].details).toContain("Telemetry dataset");
    });

    it("should expose the certified step-density caps and renderer choices", () => {
        const stepDensity = component as unknown as {
            stepDensityCurveOptions: readonly { value: string }[];
            stepDensityMaxPointsOptions: readonly { value: number }[];
            stepDensityRenderer: () => string;
            stepDensityRendererOptions: readonly { value: string }[];
        };

        expect(stepDensity.stepDensityCurveOptions.map(option => option.value)).toEqual(["step", "step-after"]);
        expect(stepDensity.stepDensityMaxPointsOptions.map(option => option.value)).toEqual([1, 2, 3, 4, 16, 160]);
        expect(stepDensity.stepDensityRendererOptions.map(option => option.value)).toEqual(["canvas", "svg"]);
        expect(stepDensity.stepDensityRenderer()).toBe("svg");

        component.setTab("pan-zoom");
        fixture.detectChanges();
        expect(fixture.nativeElement.textContent).toContain("Step Density Fixture");
        expect(fixture.nativeElement.textContent).toContain("Renderer:");
    });

    it("should handle Multi-Axis actions and metric randomization", () => {
        component.setTab("multi-axis");
        fixture.detectChanges();

        component.randomizeMultiAxisData();
        expect(component.eventLogs()[0].details).toContain("Randomized multi-axis metrics");
    });

    it("should append and randomize data for Cartesian and Polar series", () => {
        component.appendDataPoint();
        expect(component.eventLogs().length).toBeGreaterThan(0);
        expect(component.eventLogs()[0].eventType).toBe("dataUpdate");

        component.appendPieSlice();
        expect(component.eventLogs()[0].details).toContain("pie slice");

        component.appendDonutSlice();
        expect(component.eventLogs()[0].details).toContain("donut service");

        component.randomizePieData();
        expect(component.eventLogs()[0].details).toContain("pie chart");

        component.randomizeDonutData();
        expect(component.eventLogs()[0].details).toContain("donut");

        component.clearLogs();
        expect(component.eventLogs().length).toBe(0);
    });

    it("should switch to treemap tab and handle tiling algorithm and sort updates", () => {
        component.setTab("treemap");
        fixture.detectChanges();
        expect(fixture.nativeElement.textContent).toContain("Tech Stack & Ecosystem Footprint");

        component.onTreemapTileChange("dice");
        fixture.detectChanges();
        expect(component.eventLogs()[0].details).toContain("Treemap Tile Algorithm: dice");

        component.onTreemapSortChange("ascending");
        fixture.detectChanges();
        expect(component.eventLogs()[0].details).toContain("Treemap Sibling Sort: ascending");
    });

    it("should switch to funnel tab and handle orientation and label updates", () => {
        component.setTab("funnel");
        fixture.detectChanges();
        expect(fixture.nativeElement.textContent).toContain("Conversion Funnel & Drop-off Analysis");

        component.onFunnelOrientationChange("horizontal");
        fixture.detectChanges();
        expect(component.eventLogs()[0].details).toContain("Funnel Orientation: horizontal");

        component.onFunnelLabelContentChange("category-value");
        fixture.detectChanges();
        expect(component.eventLogs()[0].details).toContain("Funnel Label Content: category-value");

        component.randomizeFunnelData();
        fixture.detectChanges();
        expect(component.eventLogs()[0].details).toContain("Randomized Funnel stages");
    });

    it("should switch to waterfall tab and handle cash flow randomization", () => {
        component.setTab("waterfall");
        fixture.detectChanges();
        expect(fixture.nativeElement.textContent).toContain("Corporate Cash Flow Breakdown");

        component.randomizeWaterfallData();
        fixture.detectChanges();
        expect(component.eventLogs()[0].details).toContain("Randomized Waterfall cashflow");
    });

    it("should render mixed tab with bar, area, and line series in any combination even if barOrientation is horizontal", () => {
        // Set barOrientation to horizontal (as if user changed it in Grouped tab)
        (component as any).barOrientation.set("horizontal");
        component.setTab("mixed");
        fixture.detectChanges();
        expect(fixture.nativeElement.textContent).toContain("Mixed Series Comparison");

        const chartDe = fixture.debugElement.query(By.directive(ChartComponent));
        expect(chartDe).toBeTruthy();
        const chart = chartDe.componentInstance as ChartComponent;

        // 1. All three active: Bar + Area + Line
        let scene = chart.scene();
        expect(scene).toBeDefined();
        expect(scene?.hasRenderableData).toBe(true);
        expect(scene?.series.length).toBe(3);
        expect(scene?.series.map(s => s.type)).toEqual(["bar", "area", "line"]);

        // 2. Bar + Area only
        (component as any).showLine.set(false);
        fixture.detectChanges();
        scene = chart.scene();
        expect(scene?.hasRenderableData).toBe(true);
        expect(scene?.series.length).toBe(2);
        expect(scene?.series.map(s => s.type)).toEqual(["bar", "area"]);

        // 3. Bar + Line only
        (component as any).showArea.set(false);
        (component as any).showLine.set(true);
        fixture.detectChanges();
        scene = chart.scene();
        expect(scene?.hasRenderableData).toBe(true);
        expect(scene?.series.length).toBe(2);
        expect(scene?.series.map(s => s.type)).toEqual(["bar", "line"]);

        // 4. Bar only
        (component as any).showLine.set(false);
        fixture.detectChanges();
        scene = chart.scene();
        expect(scene?.hasRenderableData).toBe(true);
        expect(scene?.series.length).toBe(1);
        expect(scene?.series[0].type).toBe("bar");

        // 5. Area + Line only
        (component as any).showBars.set(false);
        (component as any).showArea.set(true);
        (component as any).showLine.set(true);
        fixture.detectChanges();
        scene = chart.scene();
        expect(scene?.hasRenderableData).toBe(true);
        expect(scene?.series.length).toBe(2);
        expect(scene?.series.map(s => s.type)).toEqual(["area", "line"]);
    });

    it("should render custom and horizontal tabs consistently regardless of barOrientation signal", () => {
        (component as any).barOrientation.set("horizontal");
        component.setTab("custom");
        fixture.detectChanges();

        const customChartDe = fixture.debugElement.query(By.directive(ChartComponent));
        const customChart = customChartDe.componentInstance as ChartComponent;
        expect(customChart.scene()?.hasRenderableData).toBe(true);
        expect(customChart.scene()?.series.map(s => s.type)).toEqual(["bar", "line"]);

        (component as any).barOrientation.set("vertical");
        component.setTab("horizontal");
        fixture.detectChanges();

        const horizChartDe = fixture.debugElement.query(By.directive(ChartComponent));
        const horizChart = horizChartDe.componentInstance as ChartComponent;
        expect(horizChart.scene()?.hasRenderableData).toBe(true);
        expect((horizChart.scene() as any)?.orientation).toBe("horizontal");
    });

    it("should switch to selection-brush tab and perform selection and brush marquee", async () => {
        (component as any).animationEnabled.set(false);
        component.setTab("selection-brush");
        fixture.detectChanges();
        await fixture.whenStable();

        expect(fixture.nativeElement.textContent).toContain("Cartesian Data Labels, Persistent Mark Selection");

        const chartDe = fixture.debugElement.query(By.directive(ChartComponent));
        expect(chartDe).toBeTruthy();
        const chart = chartDe.componentInstance as ChartComponent;
        const canvasEl = chartDe.nativeElement.querySelector("canvas") as HTMLCanvasElement;
        expect(canvasEl).toBeTruthy();

        canvasEl.getBoundingClientRect = () => ({
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

        // Test Brush Marquee
        canvasEl.dispatchEvent(
            new PointerEvent("pointerdown", {
                clientX: 150,
                clientY: 150,
                pointerId: 1,
                pointerType: "mouse",
                bubbles: true
            })
        );
        canvasEl.dispatchEvent(
            new PointerEvent("pointermove", {
                clientX: 350,
                clientY: 300,
                pointerId: 1,
                pointerType: "mouse",
                bubbles: true
            })
        );
        fixture.detectChanges();

        canvasEl.dispatchEvent(
            new PointerEvent("pointerup", {
                clientX: 350,
                clientY: 300,
                pointerId: 1,
                pointerType: "mouse",
                bubbles: true
            })
        );
        fixture.detectChanges();
        await fixture.whenStable();

        const brushLogs = component.eventLogs().filter(l => l.eventType === "brushChange");
        expect(brushLogs.length).toBeGreaterThan(0);
    });
});
