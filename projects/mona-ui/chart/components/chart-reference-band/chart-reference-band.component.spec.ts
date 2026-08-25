import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CHART_CONTEXT } from "../../internal/context/chart-context.token";
import {
    ChartInvalidationReason,
    type ChartReferenceBandRegistration,
    type ChartRegistrationContext
} from "../../internal/context/chart-registration-context";
import { ChartReferenceBandComponent } from "./chart-reference-band.component";
import { ChartReferenceLabelTemplateDirective } from "../../directives/chart-reference-label-template.directive";
import type { ChartOverlayLayer } from "../../models/chart-annotation.models";

@Component({
    imports: [ChartReferenceBandComponent, ChartReferenceLabelTemplateDirective],
    template: `
        <mona-chart-reference-band
            [axis]="'x'"
            [from]="from()"
            [to]="to()"
            [label]="label()"
            [layer]="layer()"
            [fillColor]="'#bfdbfe'">
            @if (useTemplate()) {
                <ng-template monaChartReferenceLabel let-ctx>
                    <span class="custom-band">{{ ctx.from }} - {{ ctx.to }}</span>
                </ng-template>
            }
        </mona-chart-reference-band>
    `
})
class TestHostComponent {
    public readonly from = signal<number | string>(20);
    public readonly label = signal("Optimal Range");
    public readonly layer = signal<ChartOverlayLayer>("underlay");
    public readonly to = signal<number | string>(60);
    public readonly useTemplate = signal(false);
}

describe("ChartReferenceBandComponent", () => {
    let fixture: ComponentFixture<TestHostComponent>;
    let host: TestHostComponent;
    let registeredBand: ChartReferenceBandRegistration | null = null;
    let unregisterFn = vi.fn();
    let invalidateFn = vi.fn();

    beforeEach(async () => {
        registeredBand = null;
        unregisterFn = vi.fn();
        invalidateFn = vi.fn();

        const mockContext: Partial<ChartRegistrationContext> = {
            invalidate: (reason?: ChartInvalidationReason) => {
                invalidateFn(reason);
            },
            registerReferenceBand: (reg: ChartReferenceBandRegistration) => {
                registeredBand = reg;
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

    it("registers reference band with properties on init", () => {
        expect(registeredBand).not.toBeNull();
        expect(registeredBand?.axis()).toBe("x");
        expect(registeredBand?.from()).toBe(20);
        expect(registeredBand?.to()).toBe(60);
        expect(registeredBand?.label()).toBe("Optimal Range");
        expect(registeredBand?.layer()).toBe("underlay");
    });

    it("triggers invalidation on input change", async () => {
        invalidateFn.mockClear();
        host.to.set(80);
        fixture.detectChanges();
        await fixture.whenStable();

        expect(invalidateFn).toHaveBeenCalledWith(ChartInvalidationReason.Interaction);
    });

    it("captures custom template directive", async () => {
        expect(registeredBand?.template?.()).toBeUndefined();

        host.useTemplate.set(true);
        fixture.detectChanges();
        await fixture.whenStable();

        expect(registeredBand?.template?.()).toBeDefined();
    });

    it("unregisters on destroy", () => {
        fixture.destroy();
        expect(unregisterFn).toHaveBeenCalled();
    });
});
