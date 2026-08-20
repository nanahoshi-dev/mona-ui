import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CHART_CONTEXT } from "../../internal/context/chart-context.token";
import {
    ChartInvalidationReason,
    type ChartReferenceLineRegistration,
    type ChartRegistrationContext
} from "../../internal/context/chart-registration-context";
import { ChartReferenceLineComponent } from "./chart-reference-line.component";
import { ChartReferenceLabelTemplateDirective } from "../../directives/chart-reference-label-template.directive";
import type { ChartOverlayLayer, ChartReferenceLineStyle } from "../../models/chart-annotation.models";

@Component({
    imports: [ChartReferenceLineComponent, ChartReferenceLabelTemplateDirective],
    template: `
        <mona-chart-reference-line
            [axis]="'y'"
            [value]="value()"
            [label]="label()"
            [layer]="layer()"
            [lineStyle]="lineStyle()"
            [color]="'#ef4444'">
            @if (useTemplate()) {
                <ng-template monaChartReferenceLabel let-val>
                    <span class="custom-ref">{{ val }}</span>
                </ng-template>
            }
        </mona-chart-reference-line>
    `
})
class TestHostComponent {
    public readonly value = signal<number | string>(500);
    public readonly label = signal("Threshold");
    public readonly layer = signal<ChartOverlayLayer>("underlay");
    public readonly lineStyle = signal<ChartReferenceLineStyle>("dashed");
    public readonly useTemplate = signal(false);
}

describe("ChartReferenceLineComponent", () => {
    let fixture: ComponentFixture<TestHostComponent>;
    let host: TestHostComponent;
    let registeredLine: ChartReferenceLineRegistration | null = null;
    let unregisterFn = vi.fn();
    let invalidateFn = vi.fn();

    beforeEach(async () => {
        registeredLine = null;
        unregisterFn = vi.fn();
        invalidateFn = vi.fn();

        const mockContext: Partial<ChartRegistrationContext> = {
            invalidate: (reason?: ChartInvalidationReason) => {
                invalidateFn(reason);
            },
            registerReferenceLine: (reg: ChartReferenceLineRegistration) => {
                registeredLine = reg;
                return () => {
                    unregisterFn();
                };
            }
        };

        await TestBed.configureTestingModule({
            imports: [TestHostComponent],
            providers: [{ provide: CHART_CONTEXT, useValue: mockContext }]
        }).compileComponents();

        fixture = TestBed.createComponent(TestHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("registers reference line with properties on init", () => {
        expect(registeredLine).not.toBeNull();
        expect(registeredLine?.axis()).toBe("y");
        expect(registeredLine?.value()).toBe(500);
        expect(registeredLine?.label()).toBe("Threshold");
        expect(registeredLine?.layer()).toBe("underlay");
        expect(registeredLine?.lineStyle()).toBe("dashed");
    });

    it("triggers invalidation on input change", async () => {
        invalidateFn.mockClear();
        host.value.set(750);
        fixture.detectChanges();
        await fixture.whenStable();

        expect(invalidateFn).toHaveBeenCalledWith(ChartInvalidationReason.Interaction);
    });

    it("captures custom reference label template directive", async () => {
        expect(registeredLine?.template?.()).toBeUndefined();

        host.useTemplate.set(true);
        fixture.detectChanges();
        await fixture.whenStable();

        expect(registeredLine?.template?.()).toBeDefined();
    });

    it("unregisters on destroy", () => {
        fixture.destroy();
        expect(unregisterFn).toHaveBeenCalled();
    });
});
