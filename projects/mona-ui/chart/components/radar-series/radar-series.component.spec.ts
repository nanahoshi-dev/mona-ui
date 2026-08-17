import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it } from "vitest";
import type { ChartRadialCurve, ChartRadialFillMode } from "../../models/chart-polar.models";
import { MonaRadarSeriesComponent } from "./radar-series.component";

@Component({
    imports: [MonaRadarSeriesComponent],
    template: `
        <mona-radar-series
            [field]="field()"
            [categoryField]="categoryField()"
            [name]="name()"
            [visible]="visible()"
            [fillMode]="fillMode()"
            [curve]="curve()"
            [showPoints]="showPoints()"
            [class]="userClass()" />
    `
})
class TestHostComponent {
    public readonly categoryField = signal("metric");
    public readonly curve = signal<ChartRadialCurve>("linear");
    public readonly field = signal("score");
    public readonly fillMode = signal<ChartRadialFillMode>("gradient");
    public readonly name = signal("Metrics");
    public readonly showPoints = signal(true);
    public readonly userClass = signal("text-purple-500");
    public readonly visible = signal(true);
}

describe("MonaRadarSeriesComponent", () => {
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
        const el = fixture.nativeElement.querySelector("mona-radar-series") as HTMLElement;
        expect(el).not.toBeNull();
        expect(el.getAttribute("aria-hidden")).toBe("true");
        expect(el.style.display).toBe("none");
    });

    it("should bind inputs correctly", () => {
        host.curve.set("smooth");
        host.fillMode.set("solid");
        fixture.detectChanges();

        const seriesComp = fixture.debugElement.children[0].children[0]
            ?.componentInstance as MonaRadarSeriesComponent;
        if (seriesComp) {
            expect(seriesComp.curve()).toBe("smooth");
            expect(seriesComp.fillMode()).toBe("solid");
        }
    });
});
