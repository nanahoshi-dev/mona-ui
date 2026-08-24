import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CHART_CONTEXT } from "../../internal/context/chart-context.token";
import {
    ChartInvalidationReason,
    type ChartRegistrationContext,
    type ChartSelectionRegistration
} from "../../internal/context/chart-registration-context";
import { ChartSelectionComponent } from "./chart-selection.component";
import type { ChartSelectionChangeEvent, ChartSelectionMode } from "../../models/chart-selection.models";

@Component({
    imports: [ChartSelectionComponent],
    template: `
        <mona-chart-selection
            [color]="color()"
            [enabled]="enabled()"
            [mode]="mode()"
            [selectedMarkIds]="selectedMarkIds()"
            [defaultSelectedMarkIds]="defaultSelectedMarkIds()"
            [retainOnDataChange]="retainOnDataChange()"
            (selectionChange)="onSelectionChange($event)" />
    `
})
class TestHostComponent {
    public readonly color = signal("#3b82f6");
    public readonly defaultSelectedMarkIds = signal<string[]>(["mark-1"]);
    public readonly enabled = signal(true);
    public readonly mode = signal<ChartSelectionMode>("single");
    public readonly retainOnDataChange = signal(true);
    public readonly selectedMarkIds = signal<string[] | undefined>(undefined);
    public lastEvent: ChartSelectionChangeEvent | null = null;

    public onSelectionChange(event: ChartSelectionChangeEvent): void {
        this.lastEvent = event;
    }
}

describe("ChartSelectionComponent", () => {
    let fixture: ComponentFixture<TestHostComponent>;
    let host: TestHostComponent;
    let registeredSelection: ChartSelectionRegistration | null = null;
    let unregisterFn = vi.fn();
    let invalidateFn = vi.fn();

    beforeEach(async () => {
        registeredSelection = null;
        unregisterFn = vi.fn();
        invalidateFn = vi.fn();

        const mockContext: Partial<ChartRegistrationContext> = {
            invalidate: (reason?: ChartInvalidationReason) => {
                invalidateFn(reason);
            },
            registerSelection: (reg: ChartSelectionRegistration) => {
                registeredSelection = reg;
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

    it("registers selection on init with provided inputs", () => {
        expect(registeredSelection).not.toBeNull();
        expect(registeredSelection?.color?.()).toBe("#3b82f6");
        expect(registeredSelection?.enabled?.()).toBe(true);
        expect(registeredSelection?.mode?.()).toBe("single");
        expect(registeredSelection?.defaultSelectedMarkIds?.()).toEqual(["mark-1"]);
        expect(registeredSelection?.retainOnDataChange?.()).toBe(true);
    });

    it("triggers invalidation on input change", async () => {
        invalidateFn.mockClear();
        host.mode.set("multiple");
        fixture.detectChanges();
        await fixture.whenStable();

        expect(invalidateFn).toHaveBeenCalledWith(ChartInvalidationReason.Interaction);
    });

    it("emits selectionChange output when registration callback is triggered", () => {
        const dummyEvent: ChartSelectionChangeEvent = {
            addedMarkIds: ["m2"],
            changedPoints: [],
            previousSelectedMarkIds: [],
            removedMarkIds: [],
            selectedMarkIds: ["m2"],
            source: "click",
            visibleSelectedPoints: []
        };

        registeredSelection?.emitSelectionChange?.(dummyEvent);
        expect(host.lastEvent).toEqual(dummyEvent);
    });

    it("unregisters on destroy", () => {
        fixture.destroy();
        expect(unregisterFn).toHaveBeenCalled();
    });
});
