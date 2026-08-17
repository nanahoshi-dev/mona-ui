import { ComponentFixture, TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it } from "vitest";
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

        component.setTab("custom");
        fixture.detectChanges();
        expect(fixture.nativeElement.textContent).toContain("Custom Angular Templates");
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
});
