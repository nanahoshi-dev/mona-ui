import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CHART_CONTEXT } from "../../internal/context/chart-context.token";
import {
    ChartInvalidationReason,
    type ChartAnnotationRegistration,
    type ChartRegistrationContext
} from "../../internal/context/chart-registration-context";
import { ChartAnnotationComponent } from "./chart-annotation.component";
import { ChartAnnotationLabelTemplateDirective } from "../../directives/chart-annotation-label-template.directive";
import type { ChartAnnotationMarker } from "../../models/chart-annotation.models";

@Component({
    imports: [ChartAnnotationComponent, ChartAnnotationLabelTemplateDirective],
    template: `
        <mona-chart-annotation
            [x]="x()"
            [y]="y()"
            [label]="label()"
            [data]="data()"
            [marker]="marker()"
            [color]="'#8b5cf6'">
            @if (useTemplate()) {
                <ng-template monaChartAnnotationLabel let-d>
                    <span class="custom-ann">{{ d.note }}</span>
                </ng-template>
            }
        </mona-chart-annotation>
    `
})
class TestHostComponent {
    public readonly x = signal<number | string>(50);
    public readonly y = signal<number | string>(200);
    public readonly label = signal("Milestone");
    public readonly data = signal({ note: "Launch" });
    public readonly marker = signal<ChartAnnotationMarker>("circle");
    public readonly useTemplate = signal(false);
}

describe("ChartAnnotationComponent", () => {
    let fixture: ComponentFixture<TestHostComponent>;
    let host: TestHostComponent;
    let registeredAnnotation: ChartAnnotationRegistration | null = null;
    let unregisterFn = vi.fn();
    let invalidateFn = vi.fn();

    beforeEach(async () => {
        registeredAnnotation = null;
        unregisterFn = vi.fn();
        invalidateFn = vi.fn();

        const mockContext: Partial<ChartRegistrationContext> = {
            invalidate: (reason?: ChartInvalidationReason) => {
                invalidateFn(reason);
            },
            registerAnnotation: (reg: ChartAnnotationRegistration) => {
                registeredAnnotation = reg;
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

    it("registers annotation with anchor and properties on init", () => {
        expect(registeredAnnotation).not.toBeNull();
        expect(registeredAnnotation?.x()).toBe(50);
        expect(registeredAnnotation?.y()).toBe(200);
        expect(registeredAnnotation?.label()).toBe("Milestone");
        expect(registeredAnnotation?.marker()).toBe("circle");
        expect(registeredAnnotation?.data()).toEqual({ note: "Launch" });
    });

    it("triggers invalidation on input change", async () => {
        invalidateFn.mockClear();
        host.y.set(300);
        fixture.detectChanges();
        await fixture.whenStable();

        expect(invalidateFn).toHaveBeenCalledWith(ChartInvalidationReason.Interaction);
    });

    it("captures custom annotation label template directive", async () => {
        expect(registeredAnnotation?.template?.()).toBeUndefined();

        host.useTemplate.set(true);
        fixture.detectChanges();
        await fixture.whenStable();

        expect(registeredAnnotation?.template?.()).toBeDefined();
    });

    it("unregisters on destroy", () => {
        fixture.destroy();
        expect(unregisterFn).toHaveBeenCalled();
    });
});
