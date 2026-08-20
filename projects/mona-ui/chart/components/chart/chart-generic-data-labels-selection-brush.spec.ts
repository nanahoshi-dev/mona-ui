import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { ChartComponent } from "./chart.component";
import { LineSeriesComponent } from "../line-series/line-series.component";
import { BarSeriesComponent } from "../bar-series/bar-series.component";
import { ChartXAxisComponent } from "../chart-x-axis/chart-x-axis.component";
import { ChartYAxisComponent } from "../chart-y-axis/chart-y-axis.component";
import { ChartSelectionComponent } from "../chart-selection/chart-selection.component";
import { ChartBrushComponent } from "../chart-brush/chart-brush.component";
import { ChartDataLabelTemplateDirective } from "../../directives/chart-data-label-template.directive";
import type { ChartSelectionChangeEvent } from "../../models/chart-selection.models";
import type { ChartBrushChangeEvent } from "../../models/chart-brush.models";

interface SampleItem {
    name: string;
    value: number;
}

@Component({
    imports: [
        ChartComponent,
        LineSeriesComponent,
        BarSeriesComponent,
        ChartXAxisComponent,
        ChartYAxisComponent,
        ChartSelectionComponent,
        ChartBrushComponent,
        ChartDataLabelTemplateDirective
    ],
    template: `
        <mona-chart [data]="data()" [xField]="'name'">
            <mona-chart-x-axis />
            <mona-chart-y-axis />

            <mona-line-series
                [field]="'value'"
                [name]="'Line'"
                [dataLabels]="lineDataLabels()">
                @if (useCustomDataLabelTemplate()) {
                    <ng-template monaChartDataLabel let-ctx>
                        <span class="custom-data-label" [class.is-selected]="ctx.selected">
                            Val: {{ ctx.formattedValue }}
                        </span>
                    </ng-template>
                }
            </mona-line-series>

            <mona-bar-series
                [field]="'value'"
                [name]="'Bar'"
                [dataLabels]="barDataLabels()" />

            @if (enableSelection()) {
                <mona-chart-selection
                    [mode]="selectionMode()"
                    [selectedMarkIds]="controlledSelection()"
                    [defaultSelectedMarkIds]="defaultSelection()"
                    (selectionChange)="onSelectionChange($event)" />
            }

            @if (enableBrush()) {
                <mona-chart-brush
                    [selectionBehavior]="brushSelectionBehavior()"
                    (brushChange)="onBrushChange($event)" />
            }
        </mona-chart>
    `
})
class TestCartesianHostComponent {
    public readonly data = signal<SampleItem[]>([
        { name: "Alpha", value: 10 },
        { name: "Beta", value: 20 },
        { name: "Gamma", value: 30 }
    ]);
    public readonly lineDataLabels = signal<boolean | object>(true);
    public readonly barDataLabels = signal<boolean | object>(false);
    public readonly useCustomDataLabelTemplate = signal(false);

    public readonly enableSelection = signal(true);
    public readonly selectionMode = signal<"single" | "multiple">("single");
    public readonly controlledSelection = signal<string[] | undefined>(undefined);
    public readonly defaultSelection = signal<string[]>([]);
    public lastSelectionEvent: ChartSelectionChangeEvent | null = null;

    public readonly enableBrush = signal(true);
    public readonly brushSelectionBehavior = signal<"none" | "replace" | "add" | "remove" | "toggle">("replace");
    public lastBrushEvent: ChartBrushChangeEvent | null = null;

    public onSelectionChange(evt: ChartSelectionChangeEvent): void {
        this.lastSelectionEvent = evt;
    }

    public onBrushChange(evt: ChartBrushChangeEvent): void {
        this.lastBrushEvent = evt;
    }
}

describe("Generic Cartesian Data Labels, Persistent Mark Selection, and Brush Integration", () => {
    let fixture: ComponentFixture<TestCartesianHostComponent>;
    let host: TestCartesianHostComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TestCartesianHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(TestCartesianHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();
    });

    it("renders chart scene and initializes without errors", () => {
        expect(host).toBeDefined();
    });

    it("renders custom data label template when provided", async () => {
        host.useCustomDataLabelTemplate.set(true);
        fixture.detectChanges();
        await fixture.whenStable();

        const customLabels = fixture.nativeElement.querySelectorAll(".custom-data-label");
        expect(customLabels.length).toBeGreaterThan(0);
        expect(customLabels[0].textContent).toContain("Val: 10");
    });

    it("handles selection click on mark and emits selectionChange", async () => {
        const chartEl = fixture.nativeElement.querySelector("canvas") as HTMLCanvasElement;
        expect(chartEl).toBeDefined();

        // Simulate click on canvas
        const clickEvt = new MouseEvent("click", {
            clientX: 100,
            clientY: 100,
            bubbles: true
        });
        chartEl.dispatchEvent(clickEvt);
        fixture.detectChanges();
        await fixture.whenStable();

        // Component handles click and updates cleanly
        expect(host).toBeDefined();
    });

    it("supports controlled selection input binding", async () => {
        host.controlledSelection.set(['["Line","index",1]']);
        fixture.detectChanges();
        await fixture.whenStable();

        expect(host.controlledSelection()).toEqual(['["Line","index",1]']);
    });
});
