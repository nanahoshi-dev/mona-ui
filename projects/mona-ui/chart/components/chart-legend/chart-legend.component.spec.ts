import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { describe, expect, it, vi } from "vitest";
import { ChartLegendItemTemplateDirective } from "../../directives/chart-legend-item-template.directive";
import { CHART_CONTEXT } from "../../internal/context/chart-context.token";
import type { ChartRegistrationContext } from "../../internal/context/chart-registration-context";
import type { ChartLegendItem } from "../../models/chart-series.models";
import { MonaChartLegendComponent } from "./chart-legend.component";

@Component({
    imports: [MonaChartLegendComponent, ChartLegendItemTemplateDirective],
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
    const toggleSeriesVisibilitySpy = vi.fn((_id: string) => {});

    const mockLegendItems = signal<readonly ChartLegendItem[]>([
        { color: "#3b82f6", name: "Series A", seriesId: "s1", seriesType: "line", visible: true },
        { color: "#10b981", name: "Series B", seriesId: "s2", seriesType: "bar", visible: false }
    ]);

    const mockChartContext: Partial<ChartRegistrationContext> = {
        invalidate: () => {},
        legendItems: mockLegendItems,
        registerLegend: () => () => {},
        toggleSeriesVisibility: toggleSeriesVisibilitySpy
    };

    beforeEach(async () => {
        toggleSeriesVisibilitySpy.mockClear();
        await TestBed.configureTestingModule({
            imports: [TestHostComponent],
            providers: [{ provide: CHART_CONTEXT, useValue: mockChartContext }]
        }).compileComponents();

        fixture = TestBed.createComponent(TestHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should render default legend buttons for all items", () => {
        const buttons = fixture.debugElement.queryAll(By.css("button"));
        expect(buttons.length).toBe(2);
        expect(buttons[0].nativeElement.textContent.trim()).toBe("Series A");
        expect(buttons[1].nativeElement.textContent.trim()).toBe("Series B");
    });

    it("should toggle series visibility on button click when interactive", () => {
        const buttons = fixture.debugElement.queryAll(By.css("button"));
        buttons[0].nativeElement.click();
        expect(toggleSeriesVisibilitySpy).toHaveBeenCalledWith("s1");
    });

    it("should not toggle series visibility when interactive is false", () => {
        host.interactive.set(false);
        fixture.detectChanges();

        const buttons = fixture.debugElement.queryAll(By.css("button"));
        expect(buttons[0].nativeElement.disabled).toBe(true);
        buttons[0].nativeElement.click();
        expect(toggleSeriesVisibilitySpy).not.toHaveBeenCalled();
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
        expect(toggleSeriesVisibilitySpy).toHaveBeenCalledWith("s2");
    });
});
