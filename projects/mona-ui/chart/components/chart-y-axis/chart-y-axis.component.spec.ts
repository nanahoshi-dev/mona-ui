import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { MonaChartYAxisComponent } from "./chart-y-axis.component";
import type { ChartYAxisType } from "../../models/chart-axis.models";

@Component({
    imports: [MonaChartYAxisComponent],
    template: `
        <mona-chart-y-axis
            [visible]="visible()"
            [gridLines]="gridLines()"
            [axisLine]="axisLine()"
            [nice]="nice()"
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
    public readonly max = signal<number | undefined>(100);
    public readonly min = signal<number | undefined>(0);
    public readonly nice = signal(true);
    public readonly tickCount = signal<number | undefined>(5);
    public readonly title = signal("Y Axis");
    public readonly type = signal<ChartYAxisType>("auto");
    public readonly visible = signal(true);
}

describe("MonaChartYAxisComponent", () => {
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
        const el = fixture.nativeElement.querySelector("mona-chart-y-axis") as HTMLElement;
        expect(el).not.toBeNull();
        expect(el.getAttribute("aria-hidden")).toBe("true");
        expect(el.style.display).toBe("none");
    });

    it("should bind inputs correctly including type", () => {
        host.type.set("category");
        host.title.set("Categories");
        fixture.detectChanges();

        const axisComp = fixture.debugElement.children[0].children[0]
            ?.componentInstance as MonaChartYAxisComponent;
        if (axisComp) {
            expect(axisComp.type()).toBe("category");
            expect(axisComp.title()).toBe("Categories");
            expect(axisComp.visible()).toBe(true);
        }
    });
});
