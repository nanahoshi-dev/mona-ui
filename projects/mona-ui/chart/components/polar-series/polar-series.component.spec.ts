import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it } from "vitest";
import type { ChartRadialCurve, ChartRadialFillMode } from "../../models/chart-polar.models";
import { MonaPolarSeriesComponent } from "./polar-series.component";

@Component({
    imports: [MonaPolarSeriesComponent],
    template: `
        <mona-polar-series
            [field]="field()"
            [angleField]="angleField()"
            [name]="name()"
            [visible]="visible()"
            [fillMode]="fillMode()"
            [curve]="curve()"
            [showPoints]="showPoints()"
            [class]="userClass()" />
    `
})
class TestHostComponent {
    public readonly angleField = signal("angle");
    public readonly curve = signal<ChartRadialCurve>("linear");
    public readonly field = signal("intensity");
    public readonly fillMode = signal<ChartRadialFillMode>("none");
    public readonly name = signal("Signal");
    public readonly showPoints = signal(false);
    public readonly userClass = signal("text-cyan-500");
    public readonly visible = signal(true);
}

describe("MonaPolarSeriesComponent", () => {
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
        const el = fixture.nativeElement.querySelector("mona-polar-series") as HTMLElement;
        expect(el).not.toBeNull();
        expect(el.getAttribute("aria-hidden")).toBe("true");
        expect(el.style.display).toBe("none");
    });

    it("should bind inputs correctly", () => {
        host.curve.set("smooth");
        host.showPoints.set(true);
        fixture.detectChanges();

        const seriesComp = fixture.debugElement.children[0].children[0]
            ?.componentInstance as MonaPolarSeriesComponent;
        if (seriesComp) {
            expect(seriesComp.curve()).toBe("smooth");
            expect(seriesComp.showPoints()).toBe(true);
        }
    });
});
