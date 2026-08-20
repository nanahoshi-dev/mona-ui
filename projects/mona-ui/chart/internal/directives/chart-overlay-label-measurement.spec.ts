import { describe, expect, it, vi } from "vitest";
import { ChartOverlayLabelMeasureDirective } from "./chart-overlay-label-measure.directive";
import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { CHART_CONTEXT } from "../context/chart-context.token";
import type { ChartRegistrationContext } from "../context/chart-registration-context";

@Component({
    imports: [ChartOverlayLabelMeasureDirective],
    template: `<div [monaChartOverlayLabelMeasure]="labelId()">Overlay Badge</div>`
})
class TestHostComponent {
    public readonly labelId = signal("crosshair:x");
}

describe("ChartOverlayLabelMeasureDirective (CAA-R3-005)", () => {
    it("registers and unregisters with chart registration context", () => {
        const mockContext: Partial<ChartRegistrationContext> = {
            observeOverlayLabelElement: vi.fn(),
            unobserveOverlayLabelElement: vi.fn()
        };

        TestBed.configureTestingModule({
            imports: [TestHostComponent],
            providers: [{ provide: CHART_CONTEXT, useValue: mockContext }]
        });

        const fixture: ComponentFixture<TestHostComponent> = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();

        expect(mockContext.observeOverlayLabelElement).toHaveBeenCalledTimes(1);
        expect(mockContext.observeOverlayLabelElement).toHaveBeenCalledWith(
            expect.any(HTMLElement),
            "crosshair:x"
        );

        fixture.destroy();
        expect(mockContext.unobserveOverlayLabelElement).toHaveBeenCalledTimes(1);
        expect(mockContext.unobserveOverlayLabelElement).toHaveBeenCalledWith(
            expect.any(HTMLElement),
            "crosshair:x"
        );
    });
});
