import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { StepperComponent } from "../components/stepper/stepper.component";
import {
    stepperStepIndicatorThemeVariants,
    stepperTrackLineThemeVariants,
    stepperTrackThemeVariants
} from "../styles/stepper.styles";

@Component({
    template: ` <mona-stepper [steps]="steps"></mona-stepper> `,
    imports: [StepperComponent]
})
class TestHostComponent {
    public steps = [{ label: "Step 1" }, { label: "Step 2" }, { label: "Step 3" }];
}

describe("StepperIndicatorDirective", () => {
    let hostComponent: TestHostComponent;
    let hostFixture: ComponentFixture<TestHostComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TestHostComponent, StepperComponent]
        }).compileComponents();

        hostFixture = TestBed.createComponent(TestHostComponent);
        hostComponent = hostFixture.componentInstance;
        hostFixture.detectChanges();
    });

    it("should create", () => {
        expect(hostComponent).toBeTruthy();
    });

    it("keeps inactive structure neutral while reserving primary for progress", () => {
        const inactive = stepperStepIndicatorThemeVariants({
            invalid: false,
            rounded: "medium",
            state: "upcoming"
        }).split(/\s+/);
        const active = stepperStepIndicatorThemeVariants({
            invalid: false,
            rounded: "medium",
            state: "current"
        }).split(/\s+/);
        const track = stepperTrackThemeVariants({ orientation: "horizontal" }).split(/\s+/);
        const progress = stepperTrackLineThemeVariants({ orientation: "horizontal" }).split(/\s+/);

        expect(inactive).toContain("bg-surface-raised");
        expect(inactive).toContain("text-foreground");
        expect(inactive).not.toContain("bg-[var(--mona-indicator-color,var(--color-primary))]");
        expect(inactive).not.toContain("text-[var(--mona-indicator-foreground,var(--color-primary-foreground))]");
        expect(active).toContain("bg-[var(--mona-indicator-color,var(--color-primary))]");
        expect(active).toContain("text-[var(--mona-indicator-foreground,var(--color-primary-foreground))]");
        expect(active).not.toContain("bg-surface-raised");
        expect(active).not.toContain("text-foreground");
        expect(active).toContain("focus-visible:outline-focus-indicator");
        expect(track).toContain("bg-surface-muted");
        expect(track).toContain("border-border-subtle");
        expect(progress).toContain("bg-[var(--mona-indicator-color,var(--color-primary))]");
    });
});
