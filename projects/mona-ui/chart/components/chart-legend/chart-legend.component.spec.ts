import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { describe, expect, it, vi } from "vitest";
import { ChartLegendItemTemplateDirective } from "../../directives/chart-legend-item-template.directive";
import { CHART_CONTEXT } from "../../internal/context/chart-context.token";
import type { ChartRegistrationContext } from "../../internal/context/chart-registration-context";
import type { ChartLegendItem } from "../../models/chart-series.models";
import { ChartLegendComponent } from "./chart-legend.component";

@Component({
    imports: [ChartLegendComponent, ChartLegendItemTemplateDirective],
    template: `
        <mona-chart-legend [interactive]="interactive()" [position]="position()">
            @if (useCustomTemplate()) {
                <ng-template monaChartLegendItemTemplate let-item>
                    <span class="custom-item">{{ item.name }} ({{ item.seriesType }})</span>
                </ng-template>
            }
        </mona-chart-legend>
    `
})
class TestHostComponent {
    public readonly interactive = signal(true);
    public readonly position = signal<"bottom" | "left" | "right" | "top">("bottom");
    public readonly useCustomTemplate = signal(false);
}

describe("MonaChartLegendComponent", () => {
    let fixture: ComponentFixture<TestHostComponent>;
    let host: TestHostComponent;
    const toggleLegendItemSpy = vi.fn((_item: ChartLegendItem) => {});

    const mockLegendItems = signal<readonly ChartLegendItem[]>([
        {
            color: "#3b82f6",
            itemId: "s1",
            kind: "series",
            name: "Series A",
            seriesId: "s1",
            seriesType: "line",
            visible: true
        },
        {
            color: "#10b981",
            itemId: "s2",
            kind: "series",
            name: "Series B",
            seriesId: "s2",
            seriesType: "bar",
            visible: false
        }
    ]);

    const mockChartContext: Partial<ChartRegistrationContext> = {
        invalidate: () => {},
        legendItems: mockLegendItems,
        registerLegend: () => () => {},
        toggleLegendItem: toggleLegendItemSpy,
        toggleSeriesVisibility: () => {}
    };

    beforeEach(async () => {
        toggleLegendItemSpy.mockClear();
        await TestBed.configureTestingModule({
            imports: [TestHostComponent],
            providers: [{ provide: CHART_CONTEXT, useValue: mockChartContext }]
        }).compileComponents();

        fixture = TestBed.createComponent(TestHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should render default legend buttons for all items when interactive", () => {
        const buttons = fixture.debugElement.queryAll(By.css("button"));
        expect(buttons.length).toBe(2);
        expect(buttons[0].nativeElement.textContent.trim()).toBe("Series A");
        expect(buttons[1].nativeElement.textContent.trim()).toBe("Series B");
    });

    it("should toggle legend item on button click when interactive", () => {
        const buttons = fixture.debugElement.queryAll(By.css("button"));
        buttons[0].nativeElement.click();
        expect(toggleLegendItemSpy).toHaveBeenCalledWith(mockLegendItems()[0]);
    });

    it("should render inert elements when interactive is false", () => {
        host.interactive.set(false);
        fixture.detectChanges();

        const buttons = fixture.debugElement.queryAll(By.css("button"));
        expect(buttons.length).toBe(0);

        const items = fixture.debugElement.queryAll(By.css("mona-chart-legend > div > div"));
        expect(items.length).toBe(2);
        expect(items[0].nativeElement.textContent.trim()).toBe("Series A");
    });

    it("should render custom template with seriesType and handle keyboard interaction", () => {
        host.useCustomTemplate.set(true);
        fixture.detectChanges();

        const customItems = fixture.debugElement.queryAll(By.css(".custom-item"));
        expect(customItems.length).toBe(2);
        expect(customItems[0].nativeElement.textContent).toBe("Series A (line)");
        expect(customItems[1].nativeElement.textContent).toBe("Series B (bar)");

        const containerDivs = fixture.debugElement.queryAll(By.css("mona-chart-legend > div > div"));
        expect(containerDivs.length).toBe(2);

        // Test enter key
        containerDivs[1].nativeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
        expect(toggleLegendItemSpy).toHaveBeenCalledWith(mockLegendItems()[1]);
    });

    it("should render color scale gradient bar when legendScale is present in auto mode", async () => {
        const mockScale = signal({
            formattedMax: "100",
            formattedMin: "0",
            kind: "color" as const,
            mode: "sequential" as const,
            stops: [
                { color: "#eff6ff", offset: 0, value: 0 },
                { color: "#3b82f6", offset: 1, value: 100 }
            ],
            ticks: [
                { formattedValue: "0", offset: 0, value: 0 },
                { formattedValue: "100", offset: 1, value: 100 }
            ],
            title: "Intensity"
        });

        const colorChartContext: Partial<ChartRegistrationContext> = {
            invalidate: () => {},
            legendItems: mockLegendItems,
            legendScale: mockScale,
            registerLegend: () => () => {},
            toggleLegendItem: () => {},
            toggleSeriesVisibility: () => {}
        };

        TestBed.resetTestingModule();
        await TestBed.configureTestingModule({
            imports: [TestHostComponent],
            providers: [{ provide: CHART_CONTEXT, useValue: colorChartContext }]
        }).compileComponents();

        const colorFixture = TestBed.createComponent(TestHostComponent);
        colorFixture.detectChanges();

        const textContent = colorFixture.nativeElement.textContent;
        expect(textContent).toContain("Intensity");
        expect(textContent).toContain("0");
        expect(textContent).toContain("100");
    });
});
