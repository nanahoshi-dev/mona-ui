import { Component, signal, viewChild } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChartComponent } from "../components/chart/chart.component";
import { BarSeriesComponent } from "../components/bar-series/bar-series.component";
import { ChartXAxisComponent } from "../components/chart-x-axis/chart-x-axis.component";
import { ChartYAxisComponent } from "../components/chart-y-axis/chart-y-axis.component";
import { ChartSelectionComponent } from "../components/chart-selection/chart-selection.component";
import type { ChartPointEvent } from "../models/chart-event.models";
import type { ChartSelectionChangeEvent } from "../models/chart-selection.models";

@Component({
    imports: [ChartComponent, BarSeriesComponent, ChartXAxisComponent, ChartYAxisComponent, ChartSelectionComponent],
    template: `
        <mona-chart
            [animation]="false"
            [data]="data()"
            [xField]="'name'"
            [style.width.px]="600"
            [style.height.px]="400"
            (pointClick)="onPointClick($event)">
            <mona-chart-x-axis />
            <mona-chart-y-axis />
            <mona-bar-series [field]="'value'" [name]="'Bars'" />
            <mona-chart-selection [enabled]="selectionEnabled()" (selectionChange)="onSelectionChange($event)" />
        </mona-chart>
    `
})
class KeyboardSelectionHostComponent {
    public readonly chart = viewChild.required(ChartComponent);
    public readonly data = signal([
        { name: "A", value: 10 },
        { name: "B", value: 20 }
    ]);
    public readonly selectionEnabled = signal(true);
    public clickEvents: ChartPointEvent[] = [];
    public selectionEvents: ChartSelectionChangeEvent[] = [];

    public onPointClick(evt: ChartPointEvent): void {
        this.clickEvents.push(evt);
    }

    public onSelectionChange(evt: ChartSelectionChangeEvent): void {
        this.selectionEvents.push(evt);
    }
}

describe("Chart Keyboard Selection vs Activation", () => {
    let fixture: ComponentFixture<KeyboardSelectionHostComponent>;
    let host: KeyboardSelectionHostComponent;

    beforeEach(async () => {
        vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
            bottom: 400,
            height: 400,
            left: 0,
            right: 600,
            top: 0,
            width: 600,
            x: 0,
            y: 0,
            toJSON: () => {}
        });

        await TestBed.configureTestingModule({
            imports: [KeyboardSelectionHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(KeyboardSelectionHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();
    });

    it("emits pointClick and toggles selection on Enter key", () => {
        const container = fixture.nativeElement.querySelector("mona-chart") as HTMLElement;

        // Focus first bucket
        container.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }));
        fixture.detectChanges();

        // Press Enter
        container.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));
        fixture.detectChanges();

        // Enter must emit pointClick
        expect(host.clickEvents.length).toBe(1);
        expect(host.clickEvents[0].seriesName).toBe("Bars");

        // Enter must also toggle selection
        expect(host.selectionEvents.length).toBe(1);
        expect(host.selectionEvents[0].source).toBe("keyboard");
        expect(host.selectionEvents[0].addedMarkIds.length).toBe(1);
    });

    it("toggles selection and announces state on Space key WITHOUT emitting pointClick", () => {
        const container = fixture.nativeElement.querySelector("mona-chart") as HTMLElement;

        // Focus first bucket
        container.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }));
        fixture.detectChanges();

        // Press Space
        const spaceEvt = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: " " });
        const preventDefaultSpy = vi.spyOn(spaceEvt, "preventDefault");
        container.dispatchEvent(spaceEvt);
        fixture.detectChanges();

        expect(preventDefaultSpy).toHaveBeenCalled();

        // Space must NOT emit pointClick
        expect(host.clickEvents.length).toBe(0);

        // Space MUST mutate selection
        expect(host.selectionEvents.length).toBe(1);
        expect(host.selectionEvents[0].source).toBe("keyboard");
        expect(host.selectionEvents[0].addedMarkIds.length).toBe(1);

        // Must update live region announcement
        const liveText = (
            host.chart() as unknown as { activeAccessibilityText: () => string }
        ).activeAccessibilityText();
        expect(liveText).toContain("selected");
    });
});
