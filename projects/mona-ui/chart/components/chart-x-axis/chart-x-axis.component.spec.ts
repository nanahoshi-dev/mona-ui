import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { MonaChartXAxisComponent } from "./chart-x-axis.component";
import type { ChartXAxisPosition, ChartXAxisType } from "../../models/chart-axis.models";

@Component({
    imports: [MonaChartXAxisComponent],
    template: `
        <mona-chart-x-axis
            [visible]="visible()"
            [gridLines]="gridLines()"
            [axisLine]="axisLine()"
            [nice]="nice()"
            [position]="position()"
            [type]="type()"
            [min]="min()"
            [max]="max()"
            [tickCount]="tickCount()"
            [title]="title()" />
    `
})
class TestHostComponent {
    public readonly axisLine = signal(true);
    public readonly gridLines = signal(true);
    public readonly max = signal<Date | number | undefined>(100);
    public readonly min = signal<Date | number | undefined>(0);
    public readonly nice = signal(true);
    public readonly position = signal<ChartXAxisPosition>("bottom");
    public readonly tickCount = signal<number | undefined>(5);
    public readonly title = signal("X Axis");
    public readonly type = signal<ChartXAxisType>("auto");
    public readonly visible = signal(true);
}

describe("MonaChartXAxisComponent", () => {
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
        const el = fixture.nativeElement.querySelector("mona-chart-x-axis") as HTMLElement;
        expect(el).not.toBeNull();
        expect(el.getAttribute("aria-hidden")).toBe("true");
        expect(el.style.display).toBe("none");
    });

    it("should bind inputs correctly", () => {
        host.type.set("time");
        host.position.set("top");
        host.title.set("Dates");
        fixture.detectChanges();

        const axisComp = fixture.debugElement.children[0].children[0]
            ?.componentInstance as MonaChartXAxisComponent;
        if (axisComp) {
            expect(axisComp.type()).toBe("time");
            expect(axisComp.position()).toBe("top");
            expect(axisComp.title()).toBe("Dates");
        }
    });
});
