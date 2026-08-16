import { ComponentFixture, TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
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

    it("should switch tabs", () => {
        component.setTab("time");
        fixture.detectChanges();
        expect(fixture.nativeElement.textContent).toContain("Continuous System Telemetry");

        component.setTab("grouped");
        fixture.detectChanges();
        expect(fixture.nativeElement.textContent).toContain("Multi-Series Grouped Bar Comparison");

        component.setTab("custom");
        fixture.detectChanges();
        expect(fixture.nativeElement.textContent).toContain("Custom Angular Templates");
    });

    it("should append and randomize data", () => {
        component.appendDataPoint();
        expect(component.eventLogs().length).toBeGreaterThan(0);
        expect(component.eventLogs()[0].eventType).toBe("dataUpdate");

        component.randomizeData();
        expect(component.eventLogs()[0].details).toContain("Randomized");

        component.clearLogs();
        expect(component.eventLogs().length).toBe(0);
    });
});
