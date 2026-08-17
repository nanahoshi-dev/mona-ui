import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { MonaScatterSeriesComponent } from "./scatter-series.component";

@Component({
    imports: [MonaScatterSeriesComponent],
    template: `
        <mona-scatter-series
            [field]="field()"
            [xField]="xField()"
            [name]="name()"
            [visible]="visible()"
            [pointRadius]="pointRadius()"
            [fillOpacity]="fillOpacity()"
            [strokeColor]="strokeColor()"
            [strokeWidth]="strokeWidth()"
            [color]="color()"
            [class]="userClass()" />
    `
})
class TestHostComponent {
    public readonly color = signal("#3b82f6");
    public readonly field = signal("y");
    public readonly fillOpacity = signal<number | undefined>(0.8);
    public readonly name = signal("Scatter Test");
    public readonly pointRadius = signal<number | undefined>(6);
    public readonly strokeColor = signal("#ffffff");
    public readonly strokeWidth = signal<number | undefined>(2);
    public readonly userClass = signal("scatter-custom");
    public readonly visible = signal(true);
    public readonly xField = signal<string | undefined>("x");
}

describe("MonaScatterSeriesComponent", () => {
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

    it("should instantiate without throwing and keep host element hidden", () => {
        const el = fixture.nativeElement.querySelector("mona-scatter-series") as HTMLElement;
        expect(el).not.toBeNull();
        expect(el.getAttribute("aria-hidden")).toBe("true");
        expect(el.style.display).toBe("none");
    });

    it("should bind inputs correctly and reflect updates", () => {
        const el = fixture.nativeElement.querySelector("mona-scatter-series") as HTMLElement;
        expect(el.classList.contains("scatter-custom")).toBe(true);

        host.pointRadius.set(8);
        host.fillOpacity.set(0.5);
        host.name.set("Updated Scatter");
        fixture.detectChanges();

        const seriesComp = fixture.debugElement.children[0]?.componentInstance as MonaScatterSeriesComponent;
        if (seriesComp) {
            expect(seriesComp.pointRadius()).toBe(8);
            expect(seriesComp.fillOpacity()).toBe(0.5);
            expect(seriesComp.name()).toBe("Updated Scatter");
            expect(seriesComp.field()).toBe("y");
            expect(seriesComp.xField()).toBe("x");
        }
    });
});
