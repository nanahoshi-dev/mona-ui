import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { BubbleSeriesComponent } from "./bubble-series.component";

@Component({
    imports: [BubbleSeriesComponent],
    template: `
        <mona-bubble-series
            [field]="field()"
            [xField]="xField()"
            [sizeField]="sizeField()"
            [name]="name()"
            [visible]="visible()"
            [minRadius]="minRadius()"
            [maxRadius]="maxRadius()"
            [fillOpacity]="fillOpacity()"
            [strokeColor]="strokeColor()"
            [strokeWidth]="strokeWidth()"
            [color]="color()"
            [class]="userClass()" />
    `
})
class TestHostComponent {
    public readonly color = signal("#10b981");
    public readonly field = signal("y");
    public readonly fillOpacity = signal<number | undefined>(0.6);
    public readonly maxRadius = signal(30);
    public readonly minRadius = signal(5);
    public readonly name = signal("Bubble Test");
    public readonly sizeField = signal("magnitude");
    public readonly strokeColor = signal("#059669");
    public readonly strokeWidth = signal<number | undefined>(1.5);
    public readonly userClass = signal("bubble-custom");
    public readonly visible = signal(true);
    public readonly xField = signal<string | undefined>("x");
}

describe("MonaBubbleSeriesComponent", () => {
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
        const el = fixture.nativeElement.querySelector("mona-bubble-series") as HTMLElement;
        expect(el).not.toBeNull();
        expect(el.getAttribute("aria-hidden")).toBe("true");
        expect(el.style.display).toBe("none");
    });

    it("should bind inputs correctly and reflect updates", () => {
        const el = fixture.nativeElement.querySelector("mona-bubble-series") as HTMLElement;
        expect(el.classList.contains("bubble-custom")).toBe(true);

        host.minRadius.set(8);
        host.maxRadius.set(40);
        host.sizeField.set("pop");
        fixture.detectChanges();

        const seriesComp = fixture.debugElement.children[0]?.componentInstance as BubbleSeriesComponent;
        if (seriesComp) {
            expect(seriesComp.minRadius()).toBe(8);
            expect(seriesComp.maxRadius()).toBe(40);
            expect(seriesComp.sizeField()).toBe("pop");
            expect(seriesComp.field()).toBe("y");
            expect(seriesComp.xField()).toBe("x");
        }
    });
});
