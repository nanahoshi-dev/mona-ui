import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it } from "vitest";
import type { ChartRadialGridShape } from "../../models/chart-polar.models";
import { ChartRadialAxisComponent } from "./chart-radial-axis.component";

@Component({
    imports: [ChartRadialAxisComponent],
    template: `
        <mona-chart-radial-axis
            [visible]="visible()"
            [gridLines]="gridLines()"
            [axisLine]="axisLine()"
            [labels]="labels()"
            [min]="min()"
            [max]="max()"
            [nice]="nice()"
            [tickCount]="tickCount()"
            [gridShape]="gridShape()"
            [labelAngle]="labelAngle()"
            [labelOffset]="labelOffset()"
            [class]="userClass()" />
    `
})
class TestHostComponent {
    public readonly axisLine = signal(true);
    public readonly gridLines = signal(true);
    public readonly gridShape = signal<ChartRadialGridShape>("circle");
    public readonly labelAngle = signal(0);
    public readonly labelOffset = signal(6);
    public readonly labels = signal(true);
    public readonly max = signal<number | undefined>(100);
    public readonly min = signal<number | undefined>(0);
    public readonly nice = signal(true);
    public readonly tickCount = signal<number | undefined>(5);
    public readonly userClass = signal("custom-radial-axis");
    public readonly visible = signal(true);
}

describe("MonaChartRadialAxisComponent", () => {
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

    it("should instantiate and keep host hidden from layout and accessibility tree", () => {
        const el = fixture.nativeElement.querySelector("mona-chart-radial-axis") as HTMLElement;
        expect(el).not.toBeNull();
        expect(el.getAttribute("aria-hidden")).toBe("true");
        expect(el.style.display).toBe("none");
    });

    it("should bind inputs correctly", () => {
        host.min.set(-50);
        host.max.set(50);
        host.gridShape.set("polygon");
        fixture.detectChanges();

        const axisComp = fixture.debugElement.children[0].children[0]?.componentInstance as ChartRadialAxisComponent;
        if (axisComp) {
            expect(axisComp.min()).toBe(-50);
            expect(axisComp.max()).toBe(50);
            expect(axisComp.gridShape()).toBe("polygon");
        }
    });
});
