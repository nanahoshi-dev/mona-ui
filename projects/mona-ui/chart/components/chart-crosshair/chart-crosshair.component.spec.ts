import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CHART_CONTEXT } from "../../internal/context/chart-context.token";
import {
    ChartInvalidationReason,
    type ChartCrosshairRegistration,
    type ChartRegistrationContext
} from "../../internal/context/chart-registration-context";
import { ChartCrosshairComponent } from "./chart-crosshair.component";
import { ChartCrosshairLabelTemplateDirective } from "../../directives/chart-crosshair-label-template.directive";
import type { ChartCrosshairMode, ChartCrosshairSnapMode } from "../../models/chart-crosshair.models";

@Component({
    imports: [ChartCrosshairComponent, ChartCrosshairLabelTemplateDirective],
    template: `
        <mona-chart-crosshair
            [enabled]="enabled()"
            [mode]="mode()"
            [snap]="snap()"
            [color]="color()"
            [lineStyle]="'dotted'">
            @if (useTemplate()) {
                <ng-template monaChartCrosshairLabel let-ctx>
                    <span class="custom-badge">{{ ctx.formattedValue }}</span>
                </ng-template>
            }
        </mona-chart-crosshair>
    `
})
class TestHostComponent {
    public readonly enabled = signal(true);
    public readonly mode = signal<ChartCrosshairMode>("xy");
    public readonly snap = signal<ChartCrosshairSnapMode>("pointer");
    public readonly color = signal<string | undefined>("#3b82f6");
    public readonly useTemplate = signal(false);
}

describe("ChartCrosshairComponent", () => {
    let fixture: ComponentFixture<TestHostComponent>;
    let host: TestHostComponent;
    let registeredCrosshair: ChartCrosshairRegistration | null = null;
    let unregisterFn = vi.fn();
    let invalidateFn = vi.fn();

    beforeEach(async () => {
        registeredCrosshair = null;
        unregisterFn = vi.fn();
        invalidateFn = vi.fn();

        const mockContext: Partial<ChartRegistrationContext> = {
            invalidate: (reason?: ChartInvalidationReason) => {
                invalidateFn(reason);
            },
            registerCrosshair: (reg: ChartCrosshairRegistration) => {
                registeredCrosshair = reg;
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

    it("registers crosshair with context on init", () => {
        expect(registeredCrosshair).not.toBeNull();
        expect(registeredCrosshair?.enabled()).toBe(true);
        expect(registeredCrosshair?.mode()).toBe("xy");
        expect(registeredCrosshair?.snap()).toBe("pointer");
        expect(registeredCrosshair?.color()).toBe("#3b82f6");
        expect(registeredCrosshair?.lineStyle()).toBe("dotted");
    });

    it("triggers invalidation when inputs change", async () => {
        invalidateFn.mockClear();
        host.mode.set("auto");
        fixture.detectChanges();
        await fixture.whenStable();

        expect(invalidateFn).toHaveBeenCalledWith(ChartInvalidationReason.Interaction);
    });

    it("captures custom label template directive when provided", async () => {
        expect(registeredCrosshair?.template?.()).toBeUndefined();

        host.useTemplate.set(true);
        fixture.detectChanges();
        await fixture.whenStable();

        expect(registeredCrosshair?.template?.()).toBeDefined();
    });

    it("unregisters on component destruction", () => {
        fixture.destroy();
        expect(unregisterFn).toHaveBeenCalled();
    });
});
