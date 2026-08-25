import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CHART_CONTEXT } from "../../internal/context/chart-context.token";
import {
    ChartInvalidationReason,
    type ChartBrushRegistration,
    type ChartRegistrationContext
} from "../../internal/context/chart-registration-context";
import { ChartBrushComponent } from "./chart-brush.component";
import type {
    ChartBrushActivation,
    ChartBrushChangeEvent,
    ChartBrushHitPolicy,
    ChartBrushMode,
    ChartBrushSelectionBehavior
} from "../../models/chart-brush.models";

@Component({
    imports: [ChartBrushComponent],
    template: `
        <mona-chart-brush
            [activation]="activation()"
            [fillColor]="fillColor()"
            [borderColor]="borderColor()"
            [enabled]="enabled()"
            [hitPolicy]="hitPolicy()"
            [mode]="mode()"
            [selectionBehavior]="selectionBehavior()"
            (brushChange)="onBrushChange($event)" />
    `
})
class TestHostComponent {
    public readonly activation = signal<ChartBrushActivation>("drag");
    public readonly borderColor = signal("#3b82f6");
    public readonly enabled = signal(true);
    public readonly fillColor = signal("#3b82f6");
    public readonly hitPolicy = signal<ChartBrushHitPolicy>("center");
    public readonly mode = signal<ChartBrushMode>("xy");
    public readonly selectionBehavior = signal<ChartBrushSelectionBehavior>("replace");
    public lastEvent: ChartBrushChangeEvent | null = null;

    public onBrushChange(event: ChartBrushChangeEvent): void {
        this.lastEvent = event;
    }
}

describe("ChartBrushComponent", () => {
    let fixture: ComponentFixture<TestHostComponent>;
    let host: TestHostComponent;
    let registeredBrush: ChartBrushRegistration | null = null;
    let unregisterFn = vi.fn();
    let invalidateFn = vi.fn();

    beforeEach(async () => {
        registeredBrush = null;
        unregisterFn = vi.fn();
        invalidateFn = vi.fn();

        const mockContext: Partial<ChartRegistrationContext> = {
            invalidate: (reason?: ChartInvalidationReason) => {
                invalidateFn(reason);
            },
            registerBrush: (reg: ChartBrushRegistration) => {
                registeredBrush = reg;
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

    it("registers brush on init with provided inputs", () => {
        expect(registeredBrush).not.toBeNull();
        expect(registeredBrush?.activation?.()).toBe("drag");
        expect(registeredBrush?.fillColor?.()).toBe("#3b82f6");
        expect(registeredBrush?.borderColor?.()).toBe("#3b82f6");
        expect(registeredBrush?.enabled?.()).toBe(true);
        expect(registeredBrush?.hitPolicy?.()).toBe("center");
        expect(registeredBrush?.mode?.()).toBe("xy");
        expect(registeredBrush?.selectionBehavior?.()).toBe("replace");
    });

    it("triggers invalidation on input change", async () => {
        invalidateFn.mockClear();
        host.mode.set("x");
        fixture.detectChanges();
        await fixture.whenStable();

        expect(invalidateFn).toHaveBeenCalledWith(ChartInvalidationReason.Interaction);
    });

    it("emits brushChange output when registration callback is triggered", () => {
        const dummyEvent: ChartBrushChangeEvent = {
            mode: "xy",
            phase: "start",
            pixelBounds: { x: 10, y: 10, width: 50, height: 50 }
        };

        registeredBrush?.emitBrushChange?.(dummyEvent);
        expect(host.lastEvent).toEqual(dummyEvent);
    });

    it("unregisters on destroy", () => {
        fixture.destroy();
        expect(unregisterFn).toHaveBeenCalled();
    });
});
