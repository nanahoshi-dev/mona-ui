import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { beforeEach, describe, expect, it } from "vitest";
import { StepperIndicatorTemplateDirective } from "../../directives/stepper-indicator-template.directive";
import { StepperLabelTemplateDirective } from "../../directives/stepper-label-template.directive";
import { StepperStepTemplateDirective } from "../../directives/stepper-step-template.directive";
import type { StepOptions } from "../../models/Step";
import { StepperComponent } from "./stepper.component";

// =============================================================================
// Test Host Components
// =============================================================================

@Component({
    template: `
        <mona-stepper
            [steps]="steps()"
            [step]="step()"
            [linear]="linear()"
            [orientation]="orientation()"
            [rounded]="rounded()">
        </mona-stepper>
    `,
    imports: [StepperComponent]
})
class TestStepperHostComponent {
    linear = signal(true);
    orientation = signal<"horizontal" | "vertical">("horizontal");
    rounded = signal<"small" | "medium" | "large" | "full" | "none">("full");
    step = signal(0);
    steps = signal<StepOptions[]>([{ label: "Step 1" }, { label: "Step 2" }, { label: "Step 3" }]);
}

@Component({
    template: `
        <mona-stepper [steps]="steps()" [step]="step()" [linear]="false">
        </mona-stepper>
    `,
    imports: [StepperComponent]
})
class TestNonLinearStepperHostComponent {
    step = signal(0);
    steps = signal<StepOptions[]>([{ label: "Step 1" }, { label: "Step 2" }, { label: "Step 3" }]);
}

@Component({
    template: `
        <mona-stepper [steps]="steps()">
            <ng-template monaStepperIndicatorTemplate let-opt let-i="index">
                <span class="custom-indicator">custom-{{ i }}</span>
            </ng-template>
        </mona-stepper>
    `,
    imports: [StepperComponent, StepperIndicatorTemplateDirective]
})
class TestIndicatorTemplateHostComponent {
    steps = signal<StepOptions[]>([{ label: "Step 1" }, { label: "Step 2" }]);
}

@Component({
    template: `
        <mona-stepper [steps]="steps()">
            <ng-template monaStepperLabelTemplate let-opt>
                <span class="custom-label">custom-{{ opt.label }}</span>
            </ng-template>
        </mona-stepper>
    `,
    imports: [StepperComponent, StepperLabelTemplateDirective]
})
class TestLabelTemplateHostComponent {
    steps = signal<StepOptions[]>([{ label: "Step 1" }, { label: "Step 2" }]);
}

@Component({
    template: `
        <mona-stepper [steps]="steps()">
            <ng-template monaStepperStepTemplate let-opt let-i="index">
                <div class="custom-step">step-{{ i }}</div>
            </ng-template>
        </mona-stepper>
    `,
    imports: [StepperComponent, StepperStepTemplateDirective]
})
class TestStepTemplateHostComponent {
    steps = signal<StepOptions[]>([{ label: "Step 1" }, { label: "Step 2" }]);
}

// =============================================================================
// Helper Functions
// =============================================================================

async function waitForStable(fixture: ComponentFixture<unknown>): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
}

function getStepperElement(fixture: ComponentFixture<unknown>): HTMLElement {
    return fixture.debugElement.query(By.directive(StepperComponent)).nativeElement as HTMLElement;
}

function getIndicators(fixture: ComponentFixture<unknown>): HTMLElement[] {
    return fixture.debugElement
        .queryAll(By.css("[role='button']"))
        .map(de => de.nativeElement as HTMLElement);
}

function getLabelSpans(fixture: ComponentFixture<unknown>): HTMLElement[] {
    return fixture.debugElement
        .queryAll(By.css("li > span:not([role='button'])"))
        .map(de => de.nativeElement as HTMLElement);
}

function dispatchKeydown(element: HTMLElement, key: string): void {
    element.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
}

// =============================================================================
// Test Suite
// =============================================================================

describe("StepperComponent", () => {
    // =========================================================================
    // Basic Functionality
    // =========================================================================
    describe("basic functionality", () => {
        let fixture: ComponentFixture<TestStepperHostComponent>;
        let component: TestStepperHostComponent;

        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [TestStepperHostComponent]
            }).compileComponents();

            fixture = TestBed.createComponent(TestStepperHostComponent);
            component = fixture.componentInstance;
            await waitForStable(fixture);
        });

        // =====================================================================
        // Initialization
        // =====================================================================
        describe("initialization", () => {
            it("should create the component", () => {
                const stepper = fixture.debugElement.query(By.directive(StepperComponent));
                expect(stepper).toBeTruthy();
            });

            it("should render the correct number of steps", () => {
                expect(fixture.debugElement.queryAll(By.css("li")).length).toBe(3);
            });

            it("should render a progressbar element", () => {
                expect(fixture.debugElement.query(By.css("[role='progressbar']"))).toBeTruthy();
            });

            it("should render an ordered list for steps", () => {
                expect(fixture.debugElement.query(By.css("ol"))).toBeTruthy();
            });
        });

        // =====================================================================
        // Default Values
        // =====================================================================
        describe("default values", () => {
            it("should have step 0 marked as current by default", () => {
                const indicators = getIndicators(fixture);
                expect(indicators[0].getAttribute("aria-current")).toBe("step");
            });

            it("should have progressbar aria-valuenow=0 by default", () => {
                const pb = fixture.debugElement.query(By.css("[role='progressbar']")).nativeElement;
                expect(pb.getAttribute("aria-valuenow")).toBe("0");
            });
        });
    });

    // =========================================================================
    // Step Rendering
    // =========================================================================
    describe("step rendering", () => {
        let fixture: ComponentFixture<TestStepperHostComponent>;
        let component: TestStepperHostComponent;

        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [TestStepperHostComponent]
            }).compileComponents();

            fixture = TestBed.createComponent(TestStepperHostComponent);
            component = fixture.componentInstance;
            await waitForStable(fixture);
        });

        it("should display step labels in label spans", () => {
            const labels = getLabelSpans(fixture);
            expect(labels[0].textContent?.trim()).toBe("Step 1");
            expect(labels[1].textContent?.trim()).toBe("Step 2");
            expect(labels[2].textContent?.trim()).toBe("Step 3");
        });

        it("should display 1-based step indices inside indicators", () => {
            const indicators = getIndicators(fixture);
            expect(indicators[0].textContent?.trim()).toBe("1");
            expect(indicators[1].textContent?.trim()).toBe("2");
            expect(indicators[2].textContent?.trim()).toBe("3");
        });

        it("should update rendered step count when steps input changes", async () => {
            component.steps.set([{ label: "A" }, { label: "B" }]);
            await waitForStable(fixture);
            expect(fixture.debugElement.queryAll(By.css("li")).length).toBe(2);
        });

        it("should update step labels when steps input changes", async () => {
            component.steps.set([{ label: "Alpha" }, { label: "Beta" }]);
            await waitForStable(fixture);
            const labels = getLabelSpans(fixture);
            expect(labels[0].textContent?.trim()).toBe("Alpha");
            expect(labels[1].textContent?.trim()).toBe("Beta");
        });

        it("should not crash with empty steps", async () => {
            component.steps.set([]);
            await waitForStable(fixture);
            expect(fixture.debugElement.queryAll(By.css("li")).length).toBe(0);
        });
    });

    // =========================================================================
    // Active Step (step model)
    // =========================================================================
    describe("active step (step input)", () => {
        let fixture: ComponentFixture<TestStepperHostComponent>;
        let component: TestStepperHostComponent;

        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [TestStepperHostComponent]
            }).compileComponents();

            fixture = TestBed.createComponent(TestStepperHostComponent);
            component = fixture.componentInstance;
            await waitForStable(fixture);
        });

        it("should mark only step 0 as aria-current='step' by default", () => {
            const indicators = getIndicators(fixture);
            expect(indicators[0].getAttribute("aria-current")).toBe("step");
            expect(indicators[1].getAttribute("aria-current")).toBeNull();
            expect(indicators[2].getAttribute("aria-current")).toBeNull();
        });

        it("should update aria-current when step changes to 1", async () => {
            component.step.set(1);
            await waitForStable(fixture);
            const indicators = getIndicators(fixture);
            expect(indicators[0].getAttribute("aria-current")).toBeNull();
            expect(indicators[1].getAttribute("aria-current")).toBe("step");
            expect(indicators[2].getAttribute("aria-current")).toBeNull();
        });

        it("should have exactly one aria-current='step' when step changes to last step", async () => {
            component.step.set(2);
            await waitForStable(fixture);
            const indicators = getIndicators(fixture);
            const current = indicators.filter(el => el.getAttribute("aria-current") === "step");
            expect(current.length).toBe(1);
            expect(indicators[2].getAttribute("aria-current")).toBe("step");
        });

        it("should clamp step below 0 to the first step", async () => {
            component.step.set(-5);
            await waitForStable(fixture);
            const indicators = getIndicators(fixture);
            expect(indicators[0].getAttribute("aria-current")).toBe("step");
        });

        it("should clamp step above max to the last step", async () => {
            component.step.set(999);
            await waitForStable(fixture);
            const indicators = getIndicators(fixture);
            expect(indicators[2].getAttribute("aria-current")).toBe("step");
        });

        it("should update progressbar aria-valuenow when step changes", async () => {
            const pb = fixture.debugElement.query(By.css("[role='progressbar']")).nativeElement;

            component.step.set(1);
            await waitForStable(fixture);
            expect(pb.getAttribute("aria-valuenow")).toBe("1");

            component.step.set(2);
            await waitForStable(fixture);
            expect(pb.getAttribute("aria-valuenow")).toBe("2");
        });
    });

    // =========================================================================
    // Orientation Input
    // =========================================================================
    describe("orientation input", () => {
        let fixture: ComponentFixture<TestStepperHostComponent>;
        let component: TestStepperHostComponent;

        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [TestStepperHostComponent]
            }).compileComponents();

            fixture = TestBed.createComponent(TestStepperHostComponent);
            component = fixture.componentInstance;
            await waitForStable(fixture);
        });

        it("should use ArrowDown to advance highlight in vertical mode", async () => {
            component.orientation.set("vertical");
            await waitForStable(fixture);

            dispatchKeydown(getStepperElement(fixture), "ArrowDown");
            await waitForStable(fixture);

            const indicators = getIndicators(fixture);
            expect(indicators[1].getAttribute("tabindex")).toBe("0");
        });

        it("should use ArrowUp to move highlight backward in vertical mode", async () => {
            component.orientation.set("vertical");
            component.step.set(1);
            await waitForStable(fixture);

            dispatchKeydown(getStepperElement(fixture), "ArrowUp");
            await waitForStable(fixture);

            const indicators = getIndicators(fixture);
            expect(indicators[0].getAttribute("tabindex")).toBe("0");
        });

        it("should NOT respond to ArrowDown in horizontal mode", async () => {
            dispatchKeydown(getStepperElement(fixture), "ArrowDown");
            await waitForStable(fixture);

            const indicators = getIndicators(fixture);
            expect(indicators[0].getAttribute("tabindex")).toBe("0");
        });

        it("should NOT respond to ArrowUp in horizontal mode", async () => {
            component.step.set(1);
            await waitForStable(fixture);

            dispatchKeydown(getStepperElement(fixture), "ArrowUp");
            await waitForStable(fixture);

            const indicators = getIndicators(fixture);
            expect(indicators[1].getAttribute("tabindex")).toBe("0");
        });
    });

    // =========================================================================
    // Rounded Input
    // =========================================================================
    describe("rounded input", () => {
        let fixture: ComponentFixture<TestStepperHostComponent>;
        let component: TestStepperHostComponent;

        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [TestStepperHostComponent]
            }).compileComponents();

            fixture = TestBed.createComponent(TestStepperHostComponent);
            component = fixture.componentInstance;
            await waitForStable(fixture);
        });

        it("should apply rounded-full class when rounded='full'", async () => {
            component.rounded.set("full");
            await waitForStable(fixture);
            getIndicators(fixture).forEach(el => {
                expect(el.classList.contains("rounded-full")).toBe(true);
            });
        });

        it("should apply rounded-sm class when rounded='small'", async () => {
            component.rounded.set("small");
            await waitForStable(fixture);
            getIndicators(fixture).forEach(el => {
                expect(el.classList.contains("rounded-sm")).toBe(true);
            });
        });

        it("should apply rounded-md class when rounded='medium'", async () => {
            component.rounded.set("medium");
            await waitForStable(fixture);
            getIndicators(fixture).forEach(el => {
                expect(el.classList.contains("rounded-md")).toBe(true);
            });
        });

        it("should apply rounded-lg class when rounded='large'", async () => {
            component.rounded.set("large");
            await waitForStable(fixture);
            getIndicators(fixture).forEach(el => {
                expect(el.classList.contains("rounded-lg")).toBe(true);
            });
        });

        it("should apply rounded-none class when rounded='none'", async () => {
            component.rounded.set("none");
            await waitForStable(fixture);
            getIndicators(fixture).forEach(el => {
                expect(el.classList.contains("rounded-none")).toBe(true);
            });
        });
    });

    // =========================================================================
    // Keyboard Navigation
    // =========================================================================
    describe("keyboard navigation", () => {
        let fixture: ComponentFixture<TestStepperHostComponent>;
        let component: TestStepperHostComponent;
        let stepper: HTMLElement;

        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [TestStepperHostComponent]
            }).compileComponents();

            fixture = TestBed.createComponent(TestStepperHostComponent);
            component = fixture.componentInstance;
            await waitForStable(fixture);
            stepper = getStepperElement(fixture);
        });

        // =====================================================================
        // ArrowRight / ArrowLeft
        // =====================================================================
        describe("ArrowRight / ArrowLeft (horizontal)", () => {
            it("should move highlight to step 1 on ArrowRight from step 0", async () => {
                dispatchKeydown(stepper, "ArrowRight");
                await waitForStable(fixture);
                expect(getIndicators(fixture)[1].getAttribute("tabindex")).toBe("0");
            });

            it("should move highlight back to step 0 on ArrowLeft when step is 1", async () => {
                component.step.set(1);
                await waitForStable(fixture);

                dispatchKeydown(stepper, "ArrowLeft");
                await waitForStable(fixture);
                expect(getIndicators(fixture)[0].getAttribute("tabindex")).toBe("0");
            });

            it("should not move highlight before step 0 on ArrowLeft", async () => {
                dispatchKeydown(stepper, "ArrowLeft");
                await waitForStable(fixture);
                expect(getIndicators(fixture)[0].getAttribute("tabindex")).toBe("0");
            });

            it("should not move highlight past last step on ArrowRight (non-linear)", async () => {
                component.linear.set(false);
                component.step.set(2);
                await waitForStable(fixture);

                dispatchKeydown(stepper, "ArrowRight");
                await waitForStable(fixture);
                expect(getIndicators(fixture)[2].getAttribute("tabindex")).toBe("0");
            });

            it("should keep only the highlighted indicator with tabindex=0", async () => {
                dispatchKeydown(stepper, "ArrowRight");
                await waitForStable(fixture);

                const indicators = getIndicators(fixture);
                expect(indicators[0].getAttribute("tabindex")).toBe("-1");
                expect(indicators[1].getAttribute("tabindex")).toBe("0");
                expect(indicators[2].getAttribute("tabindex")).toBe("-1");
            });
        });

        // =====================================================================
        // Home / End
        // =====================================================================
        describe("Home / End keys", () => {
            it("should move highlight to step 0 on Home regardless of active step", async () => {
                component.step.set(2);
                await waitForStable(fixture);

                dispatchKeydown(stepper, "Home");
                await waitForStable(fixture);
                expect(getIndicators(fixture)[0].getAttribute("tabindex")).toBe("0");
            });

            it("should move highlight to last step on End regardless of active step", async () => {
                dispatchKeydown(stepper, "End");
                await waitForStable(fixture);
                expect(getIndicators(fixture)[2].getAttribute("tabindex")).toBe("0");
            });

            it("should move to last step on End even in linear mode", async () => {
                // linear=true, step=0 — End bypasses the ±1 restriction
                dispatchKeydown(stepper, "End");
                await waitForStable(fixture);
                expect(getIndicators(fixture)[2].getAttribute("tabindex")).toBe("0");
            });
        });

        // =====================================================================
        // Enter / Space
        // =====================================================================
        describe("Enter / Space keys", () => {
            it("should activate the highlighted step on Enter", async () => {
                // Move highlight to adjacent step 1 then activate
                dispatchKeydown(stepper, "ArrowRight");
                await waitForStable(fixture);

                dispatchKeydown(stepper, "Enter");
                await waitForStable(fixture);

                expect(getIndicators(fixture)[1].getAttribute("aria-current")).toBe("step");
            });

            it("should activate the highlighted step on Space", async () => {
                dispatchKeydown(stepper, "ArrowRight");
                await waitForStable(fixture);

                dispatchKeydown(stepper, " ");
                await waitForStable(fixture);

                expect(getIndicators(fixture)[1].getAttribute("aria-current")).toBe("step");
            });

            it("should not activate a non-adjacent step on Enter in linear mode", async () => {
                // End key moves highlight to 2, but activating from 0 in linear mode
                // should not allow it (more than 1 away).
                dispatchKeydown(stepper, "End");
                await waitForStable(fixture);

                dispatchKeydown(stepper, "Enter");
                await waitForStable(fixture);

                // Step 0 should still be the active step
                expect(getIndicators(fixture)[0].getAttribute("aria-current")).toBe("step");
                expect(getIndicators(fixture)[2].getAttribute("aria-current")).toBeNull();
            });
        });

        // =====================================================================
        // Linear Mode Keyboard Restriction
        // =====================================================================
        describe("linear mode keyboard restriction", () => {
            it("should restrict highlight to activeStep ± 1 in linear mode", async () => {
                // activeStep=0; maxHighlight=1. Pressing ArrowRight twice should stay at 1.
                dispatchKeydown(stepper, "ArrowRight");
                await waitForStable(fixture);
                expect(getIndicators(fixture)[1].getAttribute("tabindex")).toBe("0");

                dispatchKeydown(stepper, "ArrowRight");
                await waitForStable(fixture);
                expect(getIndicators(fixture)[1].getAttribute("tabindex")).toBe("0");
            });

            it("should allow unrestricted highlight movement in non-linear mode", async () => {
                component.linear.set(false);
                await waitForStable(fixture);

                dispatchKeydown(stepper, "ArrowRight");
                await waitForStable(fixture);
                dispatchKeydown(stepper, "ArrowRight");
                await waitForStable(fixture);

                expect(getIndicators(fixture)[2].getAttribute("tabindex")).toBe("0");
            });
        });
    });

    // =========================================================================
    // Step Click Behavior
    // =========================================================================
    describe("step click behavior", () => {
        // =====================================================================
        // Linear Mode
        // =====================================================================
        describe("linear mode", () => {
            let fixture: ComponentFixture<TestStepperHostComponent>;
            let component: TestStepperHostComponent;

            beforeEach(async () => {
                await TestBed.configureTestingModule({
                    imports: [TestStepperHostComponent]
                }).compileComponents();

                fixture = TestBed.createComponent(TestStepperHostComponent);
                component = fixture.componentInstance;
                await waitForStable(fixture);
            });

            it("should activate the next step when clicking it", async () => {
                getIndicators(fixture)[1].click();
                await waitForStable(fixture);
                expect(getIndicators(fixture)[1].getAttribute("aria-current")).toBe("step");
            });

            it("should activate the previous step when clicking it", async () => {
                component.step.set(1);
                await waitForStable(fixture);

                getIndicators(fixture)[0].click();
                await waitForStable(fixture);
                expect(getIndicators(fixture)[0].getAttribute("aria-current")).toBe("step");
            });

            it("should not activate a non-adjacent step", async () => {
                getIndicators(fixture)[2].click();
                await waitForStable(fixture);
                expect(getIndicators(fixture)[0].getAttribute("aria-current")).toBe("step");
                expect(getIndicators(fixture)[2].getAttribute("aria-current")).toBeNull();
            });

            it("should activate step when clicking the label span", async () => {
                const labels = getLabelSpans(fixture);
                labels[1].click();
                await waitForStable(fixture);
                expect(getIndicators(fixture)[1].getAttribute("aria-current")).toBe("step");
            });
        });

        // =====================================================================
        // Non-Linear Mode
        // =====================================================================
        describe("non-linear mode", () => {
            let fixture: ComponentFixture<TestNonLinearStepperHostComponent>;

            beforeEach(async () => {
                await TestBed.configureTestingModule({
                    imports: [TestNonLinearStepperHostComponent]
                }).compileComponents();

                fixture = TestBed.createComponent(TestNonLinearStepperHostComponent);
                await waitForStable(fixture);
            });

            it("should allow clicking any step", async () => {
                getIndicators(fixture)[2].click();
                await waitForStable(fixture);
                expect(getIndicators(fixture)[2].getAttribute("aria-current")).toBe("step");
            });

            it("should allow jumping from step 0 to step 2 directly", async () => {
                getIndicators(fixture)[2].click();
                await waitForStable(fixture);
                const indicators = getIndicators(fixture);
                expect(indicators[0].getAttribute("aria-current")).toBeNull();
                expect(indicators[1].getAttribute("aria-current")).toBeNull();
                expect(indicators[2].getAttribute("aria-current")).toBe("step");
            });

            it("should allow clicking a non-adjacent previous step", async () => {
                getIndicators(fixture)[2].click();
                await waitForStable(fixture);

                getIndicators(fixture)[0].click();
                await waitForStable(fixture);
                expect(getIndicators(fixture)[0].getAttribute("aria-current")).toBe("step");
            });
        });
    });

    // =========================================================================
    // Accessibility (WCAG 2.2)
    // =========================================================================
    describe("accessibility (WCAG 2.2)", () => {
        let fixture: ComponentFixture<TestStepperHostComponent>;
        let component: TestStepperHostComponent;

        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [TestStepperHostComponent]
            }).compileComponents();

            fixture = TestBed.createComponent(TestStepperHostComponent);
            component = fixture.componentInstance;
            await waitForStable(fixture);
        });

        // =====================================================================
        // Host Element
        // =====================================================================
        describe("host element", () => {
            it("should have role='group'", () => {
                expect(getStepperElement(fixture).getAttribute("role")).toBe("group");
            });

            it("should have aria-label='Progress'", () => {
                expect(getStepperElement(fixture).getAttribute("aria-label")).toBe("Progress");
            });
        });

        // =====================================================================
        // List Items (li)
        // =====================================================================
        describe("list items (li)", () => {
            it("should have role='presentation' on all list items", () => {
                fixture.debugElement.queryAll(By.css("li")).forEach(li => {
                    expect(li.nativeElement.getAttribute("role")).toBe("presentation");
                });
            });
        });

        // =====================================================================
        // Indicators (span[role="button"])
        // =====================================================================
        describe("indicators", () => {
            it("should have role='button' on all indicators", () => {
                getIndicators(fixture).forEach(el => {
                    expect(el.getAttribute("role")).toBe("button");
                });
            });

            it("should set aria-label from the step's label property", () => {
                const indicators = getIndicators(fixture);
                expect(indicators[0].getAttribute("aria-label")).toBe("Step 1");
                expect(indicators[1].getAttribute("aria-label")).toBe("Step 2");
                expect(indicators[2].getAttribute("aria-label")).toBe("Step 3");
            });

            it("should set aria-current='step' on the active indicator only (step 0)", () => {
                const indicators = getIndicators(fixture);
                const current = indicators.filter(el => el.getAttribute("aria-current") === "step");
                expect(current.length).toBe(1);
                expect(indicators[0].getAttribute("aria-current")).toBe("step");
            });

            it("should set aria-current='step' on the active indicator only (step 2)", async () => {
                component.step.set(2);
                await waitForStable(fixture);
                const indicators = getIndicators(fixture);
                const current = indicators.filter(el => el.getAttribute("aria-current") === "step");
                expect(current.length).toBe(1);
                expect(indicators[2].getAttribute("aria-current")).toBe("step");
            });

            it("should not set aria-current on inactive indicators", () => {
                const indicators = getIndicators(fixture);
                expect(indicators[1].getAttribute("aria-current")).toBeNull();
                expect(indicators[2].getAttribute("aria-current")).toBeNull();
            });

            it("should use roving tabindex: highlighted has 0, others have -1 (default step 0)", () => {
                const indicators = getIndicators(fixture);
                expect(indicators[0].getAttribute("tabindex")).toBe("0");
                expect(indicators[1].getAttribute("tabindex")).toBe("-1");
                expect(indicators[2].getAttribute("tabindex")).toBe("-1");
            });

            it("should update roving tabindex when active step changes", async () => {
                component.step.set(2);
                await waitForStable(fixture);
                const indicators = getIndicators(fixture);
                expect(indicators[0].getAttribute("tabindex")).toBe("-1");
                expect(indicators[1].getAttribute("tabindex")).toBe("-1");
                expect(indicators[2].getAttribute("tabindex")).toBe("0");
            });
        });

        // =====================================================================
        // Label Spans
        // =====================================================================
        describe("label spans", () => {
            it("should have aria-hidden=true on all default label spans", () => {
                getLabelSpans(fixture).forEach(el => {
                    expect(el.getAttribute("aria-hidden")).toBe("true");
                });
            });
        });

        // =====================================================================
        // Progressbar
        // =====================================================================
        describe("progressbar", () => {
            it("should have role='progressbar'", () => {
                expect(fixture.debugElement.query(By.css("[role='progressbar']"))).toBeTruthy();
            });

            it("should have aria-valuemin='0'", () => {
                const pb = fixture.debugElement.query(By.css("[role='progressbar']")).nativeElement;
                expect(pb.getAttribute("aria-valuemin")).toBe("0");
            });

            it("should have aria-valuemax equal to steps.length - 1", () => {
                const pb = fixture.debugElement.query(By.css("[role='progressbar']")).nativeElement;
                expect(pb.getAttribute("aria-valuemax")).toBe("2");
            });

            it("should have aria-valuenow='0' initially", () => {
                const pb = fixture.debugElement.query(By.css("[role='progressbar']")).nativeElement;
                expect(pb.getAttribute("aria-valuenow")).toBe("0");
            });

            it("should have a descriptive aria-label", () => {
                const pb = fixture.debugElement.query(By.css("[role='progressbar']")).nativeElement;
                expect(pb.getAttribute("aria-label")).toBe("Step progress");
            });
        });

        // =====================================================================
        // Linear Mode — aria-disabled
        // =====================================================================
        describe("linear mode aria-disabled", () => {
            it("should set aria-disabled=true on steps more than 1 away from active step", () => {
                // active=0, so step 2 is 2 away → locked
                const indicators = getIndicators(fixture);
                expect(indicators[0].getAttribute("aria-disabled")).toBeNull();
                expect(indicators[1].getAttribute("aria-disabled")).toBeNull();
                expect(indicators[2].getAttribute("aria-disabled")).toBe("true");
            });

            it("should update aria-disabled when active step changes", async () => {
                component.step.set(1);
                await waitForStable(fixture);
                // active=1: step 0 (diff=1) and step 2 (diff=1) are adjacent, step 1 is active
                const indicators = getIndicators(fixture);
                expect(indicators[0].getAttribute("aria-disabled")).toBeNull();
                expect(indicators[1].getAttribute("aria-disabled")).toBeNull();
                expect(indicators[2].getAttribute("aria-disabled")).toBeNull();
            });

            it("should not set aria-disabled in non-linear mode", async () => {
                component.linear.set(false);
                await waitForStable(fixture);
                const indicators = getIndicators(fixture);
                indicators.forEach(el => {
                    expect(el.getAttribute("aria-disabled")).toBeNull();
                });
            });

            it("should not set aria-disabled on the adjacent steps in linear mode", () => {
                // active=0: step 1 is +1, not locked
                const indicators = getIndicators(fixture);
                expect(indicators[1].getAttribute("aria-disabled")).toBeNull();
            });
        });
    });

    // =========================================================================
    // Empty State
    // =========================================================================
    describe("empty state", () => {
        let fixture: ComponentFixture<TestStepperHostComponent>;
        let component: TestStepperHostComponent;

        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [TestStepperHostComponent]
            }).compileComponents();

            fixture = TestBed.createComponent(TestStepperHostComponent);
            component = fixture.componentInstance;
            component.steps.set([]);
            await waitForStable(fixture);
        });

        it("should not render any list items", () => {
            expect(fixture.debugElement.queryAll(By.css("li")).length).toBe(0);
        });

        it("should not render any indicators", () => {
            expect(getIndicators(fixture).length).toBe(0);
        });

        it("should set progressbar aria-valuemax to 0", () => {
            const pb = fixture.debugElement.query(By.css("[role='progressbar']")).nativeElement;
            expect(pb.getAttribute("aria-valuemax")).toBe("0");
        });

        it("should not crash when keyboard keys are pressed", async () => {
            const stepper = getStepperElement(fixture);
            expect(() => {
                dispatchKeydown(stepper, "ArrowRight");
                dispatchKeydown(stepper, "Home");
                dispatchKeydown(stepper, "End");
            }).not.toThrow();
        });
    });

    // =========================================================================
    // Disabled Steps (N-1)
    // =========================================================================
    describe("disabled steps", () => {
        let fixture: ComponentFixture<TestNonLinearStepperHostComponent>;
        let component: TestNonLinearStepperHostComponent;

        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [TestNonLinearStepperHostComponent]
            }).compileComponents();

            fixture = TestBed.createComponent(TestNonLinearStepperHostComponent);
            component = fixture.componentInstance;
            component.steps.set([{ label: "Step 1" }, { label: "Step 2", disabled: true }, { label: "Step 3" }]);
            await waitForStable(fixture);
        });

        it("should set aria-disabled=true on a disabled step", () => {
            const indicators = getIndicators(fixture);
            expect(indicators[1].getAttribute("aria-disabled")).toBe("true");
        });

        it("should not set aria-disabled on non-disabled steps", () => {
            const indicators = getIndicators(fixture);
            expect(indicators[0].getAttribute("aria-disabled")).toBeNull();
            expect(indicators[2].getAttribute("aria-disabled")).toBeNull();
        });

        it("should not activate a disabled step on click", async () => {
            getIndicators(fixture)[1].click();
            await waitForStable(fixture);
            expect(getIndicators(fixture)[0].getAttribute("aria-current")).toBe("step");
            expect(getIndicators(fixture)[1].getAttribute("aria-current")).toBeNull();
        });

        it("should not activate a disabled step via keyboard Enter", async () => {
            // moveHighlight skips disabled step 1 and lands on step 2.
            // Pressing Enter then activates step 2 — the disabled step 1 must never become current.
            const stepper = getStepperElement(fixture);
            dispatchKeydown(stepper, "ArrowRight");
            await waitForStable(fixture);
            dispatchKeydown(stepper, "Enter");
            await waitForStable(fixture);
            expect(getIndicators(fixture)[1].getAttribute("aria-current")).toBeNull();
        });

        it("should skip disabled steps when using ArrowRight in non-linear mode", async () => {
            // step 1 is disabled; ArrowRight from step 0 should skip to step 2
            const stepper = getStepperElement(fixture);
            dispatchKeydown(stepper, "ArrowRight");
            await waitForStable(fixture);
            const indicators = getIndicators(fixture);
            // Highlight should be on step 2 (index 2), skipping the disabled step 1
            expect(indicators[2].getAttribute("tabindex")).toBe("0");
        });
    });

    // =========================================================================
    // Custom Templates
    // =========================================================================
    describe("custom templates", () => {
        // =====================================================================
        // Indicator Template
        // =====================================================================
        describe("indicatorTemplate", () => {
            let fixture: ComponentFixture<TestIndicatorTemplateHostComponent>;

            beforeEach(async () => {
                await TestBed.configureTestingModule({
                    imports: [TestIndicatorTemplateHostComponent]
                }).compileComponents();

                fixture = TestBed.createComponent(TestIndicatorTemplateHostComponent);
                await waitForStable(fixture);
            });

            it("should render custom indicator content", () => {
                expect(fixture.debugElement.queryAll(By.css(".custom-indicator")).length).toBe(2);
            });

            it("should pass the correct 0-based index to the indicator template", () => {
                const items = fixture.debugElement.queryAll(By.css(".custom-indicator"));
                expect(items[0].nativeElement.textContent?.trim()).toBe("custom-0");
                expect(items[1].nativeElement.textContent?.trim()).toBe("custom-1");
            });

            it("should still render the indicator span wrapper", () => {
                expect(getIndicators(fixture).length).toBe(2);
            });

            it("should not render default numeric index content", () => {
                getIndicators(fixture).forEach(el => {
                    expect(el.textContent?.trim()).not.toMatch(/^[0-9]+$/);
                });
            });
        });

        // =====================================================================
        // Label Template
        // =====================================================================
        describe("labelTemplate", () => {
            let fixture: ComponentFixture<TestLabelTemplateHostComponent>;

            beforeEach(async () => {
                await TestBed.configureTestingModule({
                    imports: [TestLabelTemplateHostComponent]
                }).compileComponents();

                fixture = TestBed.createComponent(TestLabelTemplateHostComponent);
                await waitForStable(fixture);
            });

            it("should render custom label content", () => {
                expect(fixture.debugElement.queryAll(By.css(".custom-label")).length).toBe(2);
            });

            it("should pass step options to the label template context", () => {
                const labels = fixture.debugElement.queryAll(By.css(".custom-label"));
                expect(labels[0].nativeElement.textContent?.trim()).toBe("custom-Step 1");
                expect(labels[1].nativeElement.textContent?.trim()).toBe("custom-Step 2");
            });

            it("should not render default aria-hidden label spans", () => {
                expect(fixture.debugElement.queryAll(By.css("li > span[aria-hidden='true']")).length).toBe(0);
            });
        });

        // =====================================================================
        // Step Template
        // =====================================================================
        describe("stepTemplate", () => {
            let fixture: ComponentFixture<TestStepTemplateHostComponent>;

            beforeEach(async () => {
                await TestBed.configureTestingModule({
                    imports: [TestStepTemplateHostComponent]
                }).compileComponents();

                fixture = TestBed.createComponent(TestStepTemplateHostComponent);
                await waitForStable(fixture);
            });

            it("should render custom step content", () => {
                expect(fixture.debugElement.queryAll(By.css(".custom-step")).length).toBe(2);
            });

            it("should pass the correct 0-based index to the step template context", () => {
                const steps = fixture.debugElement.queryAll(By.css(".custom-step"));
                expect(steps[0].nativeElement.textContent?.trim()).toBe("step-0");
                expect(steps[1].nativeElement.textContent?.trim()).toBe("step-1");
            });

            it("should still have a focusable role=button element per step", () => {
                const buttons = fixture.debugElement.queryAll(By.css("[role='button']"));
                expect(buttons.length).toBe(2);
                buttons.forEach(btn => {
                    expect(btn.nativeElement.getAttribute("tabindex")).not.toBeNull();
                });
            });

            it("should still render default label spans", () => {
                expect(getLabelSpans(fixture).length).toBe(2);
            });

            it("keyboard navigation should work when stepTemplate is provided", async () => {
                const stepper = fixture.debugElement.query(By.directive(StepperComponent))
                    .nativeElement as HTMLElement;
                dispatchKeydown(stepper, "ArrowRight");
                await waitForStable(fixture);
                const buttons = fixture.debugElement
                    .queryAll(By.css("[role='button']"))
                    .map(de => de.nativeElement as HTMLElement);
                expect(buttons[1].getAttribute("tabindex")).toBe("0");
            });
        });
    });
});
