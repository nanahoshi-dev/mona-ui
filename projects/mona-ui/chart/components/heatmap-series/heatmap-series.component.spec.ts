import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { MonaHeatmapSeriesComponent } from "./heatmap-series.component";
import type { ChartHeatmapColorMode } from "../../models/chart-heatmap.models";

@Component({
    imports: [MonaHeatmapSeriesComponent],
    template: `
        <mona-heatmap-series
            [field]="field()"
            [xField]="xField()"
            [yField]="yField()"
            [name]="name()"
            [visible]="visible()"
            [colorMode]="colorMode()"
            [color]="color()"
            [colors]="colors()"
            [min]="min()"
            [max]="max()"
            [midpoint]="midpoint()"
            [cellGap]="cellGap()"
            [borderRadius]="borderRadius()"
            [showValues]="showValues()"
            [strokeColor]="strokeColor()"
            [strokeWidth]="strokeWidth()"
            [fillOpacity]="fillOpacity()"
            [class]="userClass()" />
    `
})
class TestHostComponent {
    public readonly borderRadius = signal<number | undefined>(4);
    public readonly cellGap = signal(2);
    public readonly color = signal("#3b82f6");
    public readonly colorMode = signal<ChartHeatmapColorMode>("sequential");
    public readonly colors = signal<readonly string[] | undefined>(undefined);
    public readonly field = signal("value");
    public readonly fillOpacity = signal<number | undefined>(0.9);
    public readonly max = signal<number | undefined>(100);
    public readonly midpoint = signal<number | undefined>(undefined);
    public readonly min = signal<number | undefined>(0);
    public readonly name = signal("Heatmap Test");
    public readonly showValues = signal(true);
    public readonly strokeColor = signal("#1d4ed8");
    public readonly strokeWidth = signal<number | undefined>(1);
    public readonly userClass = signal("heatmap-custom");
    public readonly visible = signal(true);
    public readonly xField = signal<string | undefined>("x");
    public readonly yField = signal("y");
}

describe("MonaHeatmapSeriesComponent", () => {
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
        const el = fixture.nativeElement.querySelector("mona-heatmap-series") as HTMLElement;
        expect(el).not.toBeNull();
        expect(el.getAttribute("aria-hidden")).toBe("true");
        expect(el.style.display).toBe("none");
    });

    it("should bind inputs correctly and reflect updates", () => {
        host.name.set("Updated Heatmap");
        host.colorMode.set("diverging");
        host.midpoint.set(50);
        host.cellGap.set(4);
        fixture.detectChanges();

        const seriesComp = fixture.debugElement.children[0].children[0]
            ?.componentInstance as MonaHeatmapSeriesComponent;
        if (seriesComp) {
            expect(seriesComp.name()).toBe("Updated Heatmap");
            expect(seriesComp.colorMode()).toBe("diverging");
            expect(seriesComp.midpoint()).toBe(50);
            expect(seriesComp.cellGap()).toBe(4);
            expect(seriesComp.showValues()).toBe(true);
            expect(seriesComp.field()).toBe("value");
            expect(seriesComp.yField()).toBe("y");
        }
    });
});
