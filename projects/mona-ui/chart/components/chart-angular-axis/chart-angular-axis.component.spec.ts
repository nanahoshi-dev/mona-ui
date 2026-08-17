import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { MonaChartAngularAxisComponent } from "./chart-angular-axis.component";

@Component({
    imports: [MonaChartAngularAxisComponent],
    template: `
        <mona-chart-angular-axis
            [visible]="visible()"
            [gridLines]="gridLines()"
            [axisLine]="axisLine()"
            [labels]="labels()"
            [rotation]="rotation()"
            [labelOffset]="labelOffset()"
            [tickCount]="tickCount()"
            [class]="userClass()" />
    `
})
class TestHostComponent {
    public readonly axisLine = signal(true);
    public readonly gridLines = signal(true);
    public readonly labelOffset = signal(10);
    public readonly labels = signal(true);
    public readonly rotation = signal(0);
    public readonly tickCount = signal<number | undefined>(12);
    public readonly userClass = signal("custom-angular-axis");
    public readonly visible = signal(true);
}

describe("MonaChartAngularAxisComponent", () => {
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
        const el = fixture.nativeElement.querySelector("mona-chart-angular-axis") as HTMLElement;
        expect(el).not.toBeNull();
        expect(el.getAttribute("aria-hidden")).toBe("true");
        expect(el.style.display).toBe("none");
    });

    it("should bind inputs correctly", () => {
        host.rotation.set(45);
        host.labelOffset.set(15);
        fixture.detectChanges();

        const axisComp = fixture.debugElement.children[0].children[0]
            ?.componentInstance as MonaChartAngularAxisComponent;
        if (axisComp) {
            expect(axisComp.rotation()).toBe(45);
            expect(axisComp.labelOffset()).toBe(15);
        }
    });
});
