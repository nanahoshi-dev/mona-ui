import { Component, input, signal, viewChild } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { By } from "@angular/platform-browser";
import { beforeEach, describe, expect, it } from "vitest";
import { SliderHandleTemplateDirective } from "../../directives/slider-handle-template.directive";
import { SliderTickValueTemplateDirective } from "../../directives/slider-tick-value-template.directive";
import type { SliderVariantProps } from "../../styles/slider.styles";
import { SliderComponent } from "./slider.component";

// =============================================================================
// Test Host Components
// =============================================================================

@Component({
    template: `
        <mona-slider
            [formControl]="ctrl"
            [min]="min()"
            [max]="max()"
            [step]="step()"
            [orientation]="orientation()"
            [rounded]="rounded()"
            [showTicks]="showTicks()"
            [showLabels]="showLabels()">
        </mona-slider>
    `,
    imports: [SliderComponent, ReactiveFormsModule]
})
class TestSliderHostComponent {
    ctrl = new FormControl<number>({ value: 0, disabled: false });
    disabled = signal(false);
    max = signal(10);
    min = signal(0);
    orientation = signal<"horizontal" | "vertical">("horizontal");
    rounded = signal<SliderVariantProps["rounded"]>("full");
    showLabels = signal(false);
    showTicks = signal(false);
    step = signal(1);
}

@Component({
    template: ` <mona-slider [formControl]="ctrl" [min]="0" [max]="10" [ranged]="true"> </mona-slider> `,
    imports: [SliderComponent, ReactiveFormsModule]
})
class TestRangedSliderHostComponent {
    ctrl = new FormControl<[number, number]>([0, 10]);
}

@Component({
    template: `
        <mona-slider
            [formControl]="ctrl"
            [min]="min()"
            [max]="max()"
            [step]="step()"
            [showTicks]="true"
            [showLabels]="showLabels()">
        </mona-slider>
    `,
    imports: [SliderComponent, ReactiveFormsModule]
})
class TestTickSliderHostComponent {
    ctrl = new FormControl<number>(0);
    max = signal(10);
    min = signal(0);
    showLabels = signal(false);
    step = signal(1);
}

@Component({
    template: `
        <mona-slider [formControl]="ctrl" [min]="0" [max]="10">
            <ng-template monaSliderHandleTemplate let-value>
                <span class="custom-handle">{{ value }}</span>
            </ng-template>
        </mona-slider>
    `,
    imports: [SliderComponent, SliderHandleTemplateDirective, ReactiveFormsModule]
})
class TestHandleTemplateHostComponent {
    ctrl = new FormControl<number>(5);
}

@Component({
    template: `
        <mona-slider [formControl]="ctrl" [min]="0" [max]="10" [step]="5" [showTicks]="true" [showLabels]="true">
            <ng-template monaSliderTickValueTemplate let-value>
                <span class="custom-tick-value">{{ value }}!</span>
            </ng-template>
        </mona-slider>
    `,
    imports: [SliderComponent, SliderTickValueTemplateDirective, ReactiveFormsModule]
})
class TestTickValueTemplateHostComponent {
    ctrl = new FormControl<number>(0);
}

// =============================================================================
// Helper Functions
// =============================================================================

async function waitForStable(fixture: ComponentFixture<unknown>): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
}

function getSliderElement(fixture: ComponentFixture<unknown>): HTMLElement {
    return fixture.debugElement.query(By.directive(SliderComponent)).nativeElement as HTMLElement;
}

function getSliderInstance(fixture: ComponentFixture<unknown>): SliderComponent {
    return fixture.debugElement.query(By.directive(SliderComponent)).componentInstance as SliderComponent;
}

function getPrimaryHandle(fixture: ComponentFixture<unknown>): HTMLElement {
    return fixture.debugElement.queryAll(By.css("[role='slider']"))[0].nativeElement as HTMLElement;
}

function getSecondaryHandle(fixture: ComponentFixture<unknown>): HTMLElement {
    return fixture.debugElement.queryAll(By.css("[role='slider']"))[1].nativeElement as HTMLElement;
}

function dispatchKeydown(element: HTMLElement, key: string, shift = false): void {
    element.dispatchEvent(new KeyboardEvent("keydown", { key, shiftKey: shift, bubbles: true, cancelable: true }));
}

// =============================================================================
// Test Suite
// =============================================================================

describe("SliderComponent", () => {
    // =========================================================================
    // Basic Rendering
    // =========================================================================
    describe("Basic Rendering", () => {
        let fixture: ComponentFixture<TestSliderHostComponent>;

        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [TestSliderHostComponent]
            }).compileComponents();

            fixture = TestBed.createComponent(TestSliderHostComponent);
            await waitForStable(fixture);
        });

        it("should create the component", () => {
            expect(fixture.debugElement.query(By.directive(SliderComponent))).toBeTruthy();
        });

        it("should render exactly one handle in non-ranged mode", () => {
            expect(fixture.debugElement.queryAll(By.css("[role='slider']")).length).toBe(1);
        });

        it("should set data-orientation='horizontal' on the host by default", () => {
            expect(getSliderElement(fixture).getAttribute("data-orientation")).toBe("horizontal");
        });

        it("should not show tick list by default", () => {
            expect(fixture.debugElement.query(By.css("[monaSliderTick]"))).toBeNull();
        });

        it("should not show label list by default", () => {
            expect(fixture.debugElement.queryAll(By.css("[data-label-position]")).length).toBe(0);
        });
    });

    // =========================================================================
    // CVA — Single Value
    // =========================================================================
    describe("CVA — Single Value", () => {
        let fixture: ComponentFixture<TestSliderHostComponent>;
        let component: TestSliderHostComponent;

        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [TestSliderHostComponent]
            }).compileComponents();

            fixture = TestBed.createComponent(TestSliderHostComponent);
            component = fixture.componentInstance;
            await waitForStable(fixture);
        });

        it("should reflect ctrl.setValue(5) in aria-valuenow", async () => {
            component.ctrl.setValue(5);
            await waitForStable(fixture);
            expect(getPrimaryHandle(fixture).getAttribute("aria-valuenow")).toBe("5");
        });

        it("should clamp a value below min to min", async () => {
            component.ctrl.setValue(-99);
            await waitForStable(fixture);
            expect(getPrimaryHandle(fixture).getAttribute("aria-valuenow")).toBe("0");
        });

        it("should clamp a value above max to max", async () => {
            component.ctrl.setValue(999);
            await waitForStable(fixture);
            expect(getPrimaryHandle(fixture).getAttribute("aria-valuenow")).toBe("10");
        });

        it("should ignore writeValue(NaN) and not corrupt state", async () => {
            component.ctrl.setValue(3);
            await waitForStable(fixture);
            getSliderInstance(fixture).writeValue(NaN);
            await waitForStable(fixture);
            expect(getPrimaryHandle(fixture).getAttribute("aria-valuenow")).toBe("3");
        });

        it("should ignore writeValue(array) in non-ranged mode", async () => {
            component.ctrl.setValue(3);
            await waitForStable(fixture);
            getSliderInstance(fixture).writeValue([1, 9] as unknown as number);
            await waitForStable(fixture);
            expect(getPrimaryHandle(fixture).getAttribute("aria-valuenow")).toBe("3");
        });
    });

    // =========================================================================
    // CVA — Change Propagation
    // =========================================================================
    describe("CVA — Change Propagation", () => {
        let fixture: ComponentFixture<TestSliderHostComponent>;
        let component: TestSliderHostComponent;

        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [TestSliderHostComponent]
            }).compileComponents();

            fixture = TestBed.createComponent(TestSliderHostComponent);
            component = fixture.componentInstance;
            component.ctrl.setValue(5);
            await waitForStable(fixture);
        });

        it("should update ctrl value when ArrowRight is pressed", async () => {
            dispatchKeydown(getPrimaryHandle(fixture), "ArrowRight");
            await waitForStable(fixture);
            expect(component.ctrl.value).toBe(6);
        });

        it("should update ctrl value when ArrowLeft is pressed", async () => {
            dispatchKeydown(getPrimaryHandle(fixture), "ArrowLeft");
            await waitForStable(fixture);
            expect(component.ctrl.value).toBe(4);
        });
    });

    // =========================================================================
    // Keyboard Navigation — Horizontal
    // =========================================================================
    describe("Keyboard Navigation (Horizontal)", () => {
        let fixture: ComponentFixture<TestSliderHostComponent>;
        let component: TestSliderHostComponent;

        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [TestSliderHostComponent]
            }).compileComponents();

            fixture = TestBed.createComponent(TestSliderHostComponent);
            component = fixture.componentInstance;
            component.ctrl.setValue(5);
            await waitForStable(fixture);
        });

        it("should increase value by step on ArrowRight", async () => {
            dispatchKeydown(getPrimaryHandle(fixture), "ArrowRight");
            await waitForStable(fixture);
            expect(getPrimaryHandle(fixture).getAttribute("aria-valuenow")).toBe("6");
        });

        it("should decrease value by step on ArrowLeft", async () => {
            dispatchKeydown(getPrimaryHandle(fixture), "ArrowLeft");
            await waitForStable(fixture);
            expect(getPrimaryHandle(fixture).getAttribute("aria-valuenow")).toBe("4");
        });

        it("should set value to max on End", async () => {
            dispatchKeydown(getPrimaryHandle(fixture), "End");
            await waitForStable(fixture);
            expect(getPrimaryHandle(fixture).getAttribute("aria-valuenow")).toBe("10");
        });

        it("should set value to min on Home", async () => {
            dispatchKeydown(getPrimaryHandle(fixture), "Home");
            await waitForStable(fixture);
            expect(getPrimaryHandle(fixture).getAttribute("aria-valuenow")).toBe("0");
        });

        it("should increase value by step*10 on Shift+ArrowRight", async () => {
            component.ctrl.setValue(0);
            await waitForStable(fixture);
            dispatchKeydown(getPrimaryHandle(fixture), "ArrowRight", true);
            await waitForStable(fixture);
            expect(getPrimaryHandle(fixture).getAttribute("aria-valuenow")).toBe("10");
        });

        it("should decrease value by step*10 on Shift+ArrowLeft", async () => {
            component.ctrl.setValue(10);
            await waitForStable(fixture);
            dispatchKeydown(getPrimaryHandle(fixture), "ArrowLeft", true);
            await waitForStable(fixture);
            expect(getPrimaryHandle(fixture).getAttribute("aria-valuenow")).toBe("0");
        });

        it("should clamp at min — ArrowLeft at 0 stays 0", async () => {
            component.ctrl.setValue(0);
            await waitForStable(fixture);
            dispatchKeydown(getPrimaryHandle(fixture), "ArrowLeft");
            await waitForStable(fixture);
            expect(getPrimaryHandle(fixture).getAttribute("aria-valuenow")).toBe("0");
        });

        it("should clamp at max — ArrowRight at max stays max", async () => {
            component.ctrl.setValue(10);
            await waitForStable(fixture);
            dispatchKeydown(getPrimaryHandle(fixture), "ArrowRight");
            await waitForStable(fixture);
            expect(getPrimaryHandle(fixture).getAttribute("aria-valuenow")).toBe("10");
        });
    });

    // =========================================================================
    // Keyboard Navigation — Vertical
    // =========================================================================
    describe("Keyboard Navigation (Vertical)", () => {
        let fixture: ComponentFixture<TestSliderHostComponent>;
        let component: TestSliderHostComponent;

        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [TestSliderHostComponent]
            }).compileComponents();

            fixture = TestBed.createComponent(TestSliderHostComponent);
            component = fixture.componentInstance;
            component.orientation.set("vertical");
            component.ctrl.setValue(5);
            await waitForStable(fixture);
        });

        it("should increase value on ArrowUp in vertical mode", async () => {
            dispatchKeydown(getPrimaryHandle(fixture), "ArrowUp");
            await waitForStable(fixture);
            expect(getPrimaryHandle(fixture).getAttribute("aria-valuenow")).toBe("6");
        });

        it("should decrease value on ArrowDown in vertical mode", async () => {
            dispatchKeydown(getPrimaryHandle(fixture), "ArrowDown");
            await waitForStable(fixture);
            expect(getPrimaryHandle(fixture).getAttribute("aria-valuenow")).toBe("4");
        });

        it("should also respond to ArrowLeft as step-back in vertical mode", async () => {
            dispatchKeydown(getPrimaryHandle(fixture), "ArrowLeft");
            await waitForStable(fixture);
            expect(getPrimaryHandle(fixture).getAttribute("aria-valuenow")).toBe("4");
        });

        it("should also respond to ArrowRight as step-forward in vertical mode", async () => {
            dispatchKeydown(getPrimaryHandle(fixture), "ArrowRight");
            await waitForStable(fixture);
            expect(getPrimaryHandle(fixture).getAttribute("aria-valuenow")).toBe("6");
        });
    });

    // =========================================================================
    // Orientation
    // =========================================================================
    describe("Orientation Input", () => {
        let fixture: ComponentFixture<TestSliderHostComponent>;
        let component: TestSliderHostComponent;

        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [TestSliderHostComponent]
            }).compileComponents();

            fixture = TestBed.createComponent(TestSliderHostComponent);
            component = fixture.componentInstance;
            await waitForStable(fixture);
        });

        it("should set aria-orientation='horizontal' by default", () => {
            expect(getPrimaryHandle(fixture).getAttribute("aria-orientation")).toBe("horizontal");
        });

        it("should update aria-orientation to 'vertical' when changed", async () => {
            component.orientation.set("vertical");
            await waitForStable(fixture);
            expect(getPrimaryHandle(fixture).getAttribute("aria-orientation")).toBe("vertical");
        });

        it("should set data-orientation on the host in vertical mode", async () => {
            component.orientation.set("vertical");
            await waitForStable(fixture);
            expect(getSliderElement(fixture).getAttribute("data-orientation")).toBe("vertical");
        });
    });

    // =========================================================================
    // Rounded Variants
    // =========================================================================
    describe("Rounded Input", () => {
        let fixture: ComponentFixture<TestSliderHostComponent>;
        let component: TestSliderHostComponent;

        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [TestSliderHostComponent]
            }).compileComponents();

            fixture = TestBed.createComponent(TestSliderHostComponent);
            component = fixture.componentInstance;
            await waitForStable(fixture);
        });

        it("should apply rounded-full when rounded='full'", async () => {
            component.rounded.set("full");
            await waitForStable(fixture);
            expect(getPrimaryHandle(fixture).classList.contains("rounded-full")).toBe(true);
        });

        it("should apply rounded-sm when rounded='small'", async () => {
            component.rounded.set("small");
            await waitForStable(fixture);
            expect(getPrimaryHandle(fixture).classList.contains("rounded-sm")).toBe(true);
        });

        it("should apply rounded-md when rounded='medium'", async () => {
            component.rounded.set("medium");
            await waitForStable(fixture);
            expect(getPrimaryHandle(fixture).classList.contains("rounded-md")).toBe(true);
        });

        it("should apply rounded-lg when rounded='large'", async () => {
            component.rounded.set("large");
            await waitForStable(fixture);
            expect(getPrimaryHandle(fixture).classList.contains("rounded-lg")).toBe(true);
        });

        it("should apply rounded-none when rounded='none'", async () => {
            component.rounded.set("none");
            await waitForStable(fixture);
            expect(getPrimaryHandle(fixture).classList.contains("rounded-none")).toBe(true);
        });
    });

    // =========================================================================
    // Disabled State
    // =========================================================================
    describe("Disabled State", () => {
        let fixture: ComponentFixture<TestSliderHostComponent>;
        let component: TestSliderHostComponent;

        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [TestSliderHostComponent]
            }).compileComponents();

            fixture = TestBed.createComponent(TestSliderHostComponent);
            component = fixture.componentInstance;
            component.ctrl.setValue(5);
            component.ctrl.disable();
            await waitForStable(fixture);
        });

        it("should set tabindex='-1' on the handle when disabled", () => {
            expect(getPrimaryHandle(fixture).getAttribute("tabindex")).toBe("-1");
        });

        it("should set data-disabled='true' on the host element", () => {
            expect(getSliderElement(fixture).getAttribute("data-disabled")).toBe("true");
        });

        it("should not change value on ArrowRight when disabled", async () => {
            dispatchKeydown(getPrimaryHandle(fixture), "ArrowRight");
            await waitForStable(fixture);
            expect(getPrimaryHandle(fixture).getAttribute("aria-valuenow")).toBe("5");
        });

        it("should not change value on ArrowLeft when disabled", async () => {
            dispatchKeydown(getPrimaryHandle(fixture), "ArrowLeft");
            await waitForStable(fixture);
            expect(getPrimaryHandle(fixture).getAttribute("aria-valuenow")).toBe("5");
        });
    });

    // =========================================================================
    // aria-disabled Attribute
    // =========================================================================
    describe("aria-disabled attribute", () => {
        let fixture: ComponentFixture<TestSliderHostComponent>;
        let component: TestSliderHostComponent;

        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [TestSliderHostComponent]
            }).compileComponents();

            fixture = TestBed.createComponent(TestSliderHostComponent);
            component = fixture.componentInstance;
            await waitForStable(fixture);
        });

        it("should NOT render aria-disabled attribute when enabled", () => {
            expect(getPrimaryHandle(fixture).hasAttribute("aria-disabled")).toBe(false);
        });

        it("should render aria-disabled='true' when disabled", async () => {
            component.ctrl.disable();
            await waitForStable(fixture);
            expect(getPrimaryHandle(fixture).getAttribute("aria-disabled")).toBe("true");
        });
    });

    // =========================================================================
    // Ranged Mode
    // =========================================================================
    describe("Ranged Mode", () => {
        let fixture: ComponentFixture<TestRangedSliderHostComponent>;
        let component: TestRangedSliderHostComponent;

        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [TestRangedSliderHostComponent]
            }).compileComponents();

            fixture = TestBed.createComponent(TestRangedSliderHostComponent);
            component = fixture.componentInstance;
            await waitForStable(fixture);
        });

        it("should render two handles in ranged mode", () => {
            expect(fixture.debugElement.queryAll(By.css("[role='slider']")).length).toBe(2);
        });

        it("should reflect min value in primary handle aria-valuenow", async () => {
            component.ctrl.setValue([2, 8]);
            await waitForStable(fixture);
            expect(getPrimaryHandle(fixture).getAttribute("aria-valuenow")).toBe("2");
        });

        it("should reflect max value in secondary handle aria-valuenow", async () => {
            component.ctrl.setValue([2, 8]);
            await waitForStable(fixture);
            expect(getSecondaryHandle(fixture).getAttribute("aria-valuenow")).toBe("8");
        });

        it("should label primary handle as 'Minimum value'", () => {
            expect(getPrimaryHandle(fixture).getAttribute("aria-label")).toBe("Minimum value");
        });

        it("should label secondary handle as 'Maximum value'", () => {
            expect(getSecondaryHandle(fixture).getAttribute("aria-label")).toBe("Maximum value");
        });

        it("should update primary handle value on ArrowRight", async () => {
            component.ctrl.setValue([2, 8]);
            await waitForStable(fixture);
            dispatchKeydown(getPrimaryHandle(fixture), "ArrowRight");
            await waitForStable(fixture);
            expect(getPrimaryHandle(fixture).getAttribute("aria-valuenow")).toBe("3");
        });

        it("should update secondary handle value on ArrowRight", async () => {
            component.ctrl.setValue([2, 8]);
            await waitForStable(fixture);
            dispatchKeydown(getSecondaryHandle(fixture), "ArrowRight");
            await waitForStable(fixture);
            expect(getSecondaryHandle(fixture).getAttribute("aria-valuenow")).toBe("9");
        });

        it("should ignore writeValue(scalar) in ranged mode", async () => {
            component.ctrl.setValue([2, 8]);
            await waitForStable(fixture);
            getSliderInstance(fixture).writeValue(5 as unknown as [number, number]);
            await waitForStable(fixture);
            expect(getPrimaryHandle(fixture).getAttribute("aria-valuenow")).toBe("2");
            expect(getSecondaryHandle(fixture).getAttribute("aria-valuenow")).toBe("8");
        });

        it("should ignore writeValue([NaN, 5]) in ranged mode", async () => {
            component.ctrl.setValue([2, 8]);
            await waitForStable(fixture);
            getSliderInstance(fixture).writeValue([NaN, 5]);
            await waitForStable(fixture);
            expect(getPrimaryHandle(fixture).getAttribute("aria-valuenow")).toBe("2");
        });
    });

    // =========================================================================
    // Tick Display
    // =========================================================================
    describe("Tick Display", () => {
        let fixture: ComponentFixture<TestTickSliderHostComponent>;
        let component: TestTickSliderHostComponent;

        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [TestTickSliderHostComponent]
            }).compileComponents();

            fixture = TestBed.createComponent(TestTickSliderHostComponent);
            component = fixture.componentInstance;
            await waitForStable(fixture);
        });

        it("should render tick elements when showTicks=true", () => {
            expect(fixture.debugElement.queryAll(By.css("[monaSliderTick]")).length).toBeGreaterThan(0);
        });

        it("should render (max-min)/step + 1 ticks for step=1, range 0-10", () => {
            // (10 - 0) / 1 + 1 = 11
            expect(fixture.debugElement.queryAll(By.css("[monaSliderTick]")).length).toBe(11);
        });

        it("should render fewer ticks when step is larger", async () => {
            component.step.set(2);
            await waitForStable(fixture);
            // (10 - 0) / 2 + 1 = 6
            expect(fixture.debugElement.queryAll(By.css("[monaSliderTick]")).length).toBe(6);
        });

        it("should not render label list when showLabels=false", () => {
            expect(fixture.debugElement.queryAll(By.css("[data-label-position]")).length).toBe(0);
        });

        it("should render label list when showLabels=true", async () => {
            component.showLabels.set(true);
            await waitForStable(fixture);
            expect(fixture.debugElement.queryAll(By.css("[data-label-position]")).length).toBe(1);
        });
    });

    // =========================================================================
    // Label Display
    // =========================================================================
    describe("Label Display", () => {
        let fixture: ComponentFixture<TestSliderHostComponent>;
        let component: TestSliderHostComponent;

        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [TestSliderHostComponent]
            }).compileComponents();

            fixture = TestBed.createComponent(TestSliderHostComponent);
            component = fixture.componentInstance;
            await waitForStable(fixture);
        });

        it("should not render label list when showTicks=false even if showLabels=true", async () => {
            component.showTicks.set(false);
            component.showLabels.set(true);
            await waitForStable(fixture);
            expect(fixture.debugElement.queryAll(By.css("[data-label-position]")).length).toBe(0);
        });

        it("should render label list when both showTicks=true and showLabels=true", async () => {
            component.showTicks.set(true);
            component.showLabels.set(true);
            await waitForStable(fixture);
            expect(fixture.debugElement.queryAll(By.css("[data-label-position]")).length).toBe(1);
        });

        it("should render default tick value text in label spans", async () => {
            component.showTicks.set(true);
            component.showLabels.set(true);
            await waitForStable(fixture);
            const spans = fixture.debugElement.queryAll(By.css("[data-label-position] span span"));
            expect(spans.length).toBeGreaterThan(0);
            expect(spans[0].nativeElement.textContent.trim()).toBe("0");
        });
    });

    // =========================================================================
    // Custom Templates
    // =========================================================================
    describe("custom templates", () => {
        // =====================================================================
        // Handle Template
        // =====================================================================
        describe("handleTemplate", () => {
            let fixture: ComponentFixture<TestHandleTemplateHostComponent>;

            beforeEach(async () => {
                await TestBed.configureTestingModule({
                    imports: [TestHandleTemplateHostComponent]
                }).compileComponents();

                fixture = TestBed.createComponent(TestHandleTemplateHostComponent);
                await waitForStable(fixture);
            });

            it("should render the custom handle template content", () => {
                expect(fixture.debugElement.queryAll(By.css(".custom-handle")).length).toBe(1);
            });

            it("should pass the current value as $implicit context", () => {
                const span = fixture.debugElement.query(By.css(".custom-handle"));
                expect(span.nativeElement.textContent.trim()).toBe("5");
            });

            it("should still render the outer handle div wrapper", () => {
                expect(fixture.debugElement.queryAll(By.css("[role='slider']")).length).toBe(1);
            });
        });

        // =====================================================================
        // Tick Value Template
        // =====================================================================
        describe("tickValueTemplate", () => {
            let fixture: ComponentFixture<TestTickValueTemplateHostComponent>;

            beforeEach(async () => {
                await TestBed.configureTestingModule({
                    imports: [TestTickValueTemplateHostComponent]
                }).compileComponents();

                fixture = TestBed.createComponent(TestTickValueTemplateHostComponent);
                await waitForStable(fixture);
            });

            it("should render custom tick value content", () => {
                expect(fixture.debugElement.queryAll(By.css(".custom-tick-value")).length).toBeGreaterThan(0);
            });

            it("should pass tick value as $implicit context with custom format", () => {
                const items = fixture.debugElement.queryAll(By.css(".custom-tick-value"));
                expect(items[0].nativeElement.textContent.trim()).toBe("0!");
            });

            it("should not render default plain-number text alongside custom template", () => {
                // In the @if branch, plain numbers like "0", "5", "10" would be rendered.
                // In the @else branch, the custom template renders "0!", "5!", etc.
                // Verify no span contains only a plain number (no "!" suffix).
                const allInnerSpans = fixture.debugElement.queryAll(By.css("[data-label-position] span span"));
                const plainNumberSpans = allInnerSpans.filter(span =>
                    /^\d+$/.test(span.nativeElement.textContent.trim())
                );
                expect(plainNumberSpans.length).toBe(0);
            });
        });
    });

    // =========================================================================
    // Accessibility (WCAG 2.2)
    // =========================================================================
    describe("Accessibility (WCAG 2.2)", () => {
        let fixture: ComponentFixture<TestSliderHostComponent>;
        let component: TestSliderHostComponent;

        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [TestSliderHostComponent]
            }).compileComponents();

            fixture = TestBed.createComponent(TestSliderHostComponent);
            component = fixture.componentInstance;
            await waitForStable(fixture);
        });

        // =====================================================================
        // Handle ARIA
        // =====================================================================
        describe("Handle ARIA Attributes", () => {
            it("should have role='slider' on the handle", () => {
                expect(getPrimaryHandle(fixture).getAttribute("role")).toBe("slider");
            });

            it("should have aria-valuemin matching the min input", () => {
                expect(getPrimaryHandle(fixture).getAttribute("aria-valuemin")).toBe("0");
            });

            it("should have aria-valuemax matching the max input", () => {
                expect(getPrimaryHandle(fixture).getAttribute("aria-valuemax")).toBe("10");
            });

            it("should update aria-valuemin when min input changes", async () => {
                component.min.set(2);
                await waitForStable(fixture);
                expect(getPrimaryHandle(fixture).getAttribute("aria-valuemin")).toBe("2");
            });

            it("should update aria-valuemax when max input changes", async () => {
                component.max.set(20);
                await waitForStable(fixture);
                expect(getPrimaryHandle(fixture).getAttribute("aria-valuemax")).toBe("20");
            });

            it("should have aria-valuenow='0' by default", () => {
                expect(getPrimaryHandle(fixture).getAttribute("aria-valuenow")).toBe("0");
            });

            it("should update aria-valuenow after value change", async () => {
                component.ctrl.setValue(7);
                await waitForStable(fixture);
                expect(getPrimaryHandle(fixture).getAttribute("aria-valuenow")).toBe("7");
            });

            it("should have aria-orientation='horizontal' by default", () => {
                expect(getPrimaryHandle(fixture).getAttribute("aria-orientation")).toBe("horizontal");
            });

            it("should have aria-label='Slider value' in non-ranged mode", () => {
                expect(getPrimaryHandle(fixture).getAttribute("aria-label")).toBe("Slider value");
            });

            it("should have tabindex='0' when enabled", () => {
                expect(getPrimaryHandle(fixture).getAttribute("tabindex")).toBe("0");
            });

            it("should have tabindex='-1' when disabled", async () => {
                component.ctrl.disable();
                await waitForStable(fixture);
                expect(getPrimaryHandle(fixture).getAttribute("tabindex")).toBe("-1");
            });
        });

        // =====================================================================
        // Host Element
        // =====================================================================
        describe("Host Element", () => {
            it("should set data-disabled='false' when enabled", () => {
                expect(getSliderElement(fixture).getAttribute("data-disabled")).toBe("false");
            });

            it("should update data-disabled to 'true' when disabled", async () => {
                component.ctrl.disable();
                await waitForStable(fixture);
                expect(getSliderElement(fixture).getAttribute("data-disabled")).toBe("true");
            });
        });
    });
});
