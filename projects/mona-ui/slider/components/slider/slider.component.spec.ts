import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { disabled as fieldDisabled, form, FormField } from "@angular/forms/signals";
import { By } from "@angular/platform-browser";
import { beforeEach, describe, expect, it } from "vitest";
import { SliderHandleTemplateDirective } from "../../directives/slider-handle-template.directive";
import { SliderTickValueTemplateDirective } from "../../directives/slider-tick-value-template.directive";
import type { SliderVariantProps } from "../../styles/slider.styles";
import { SliderComponent } from "./slider.component";

@Component({
    template: `
        <mona-slider
            [formField]="$any(form.value)"
            [minValue]="minValue()"
            [maxValue]="maxValue()"
            [step]="step()"
            [orientation]="orientation()"
            [rounded]="rounded()"
            [showTicks]="showTicks()"
            [showLabels]="showLabels()">
        </mona-slider>
    `,
    imports: [SliderComponent, FormField]
})
class SignalFormSliderHostComponent {
    readonly #formModel = signal<SliderFormModel>({ value: 0 });
    public readonly disabled = signal(false);
    public readonly form = form(this.#formModel, schema => {
        fieldDisabled(schema.value, { when: () => this.disabled() });
    });
    public readonly maxValue = signal(10);
    public readonly minValue = signal(0);
    public readonly orientation = signal<"horizontal" | "vertical">("horizontal");
    public readonly rounded = signal<SliderVariantProps["rounded"]>("full");
    public readonly showLabels = signal(false);
    public readonly showTicks = signal(false);
    public readonly step = signal(1);
}

@Component({
    template: `<mona-slider [(value)]="value" [minValue]="0" [maxValue]="10"></mona-slider>`,
    imports: [SliderComponent]
})
class ValueBindingSliderHostComponent {
    public readonly value = signal(5);
}

@Component({
    template: `
        <mona-slider [value]="5" [minValue]="0" [maxValue]="10">
            <ng-template monaSliderHandleTemplate let-value>
                <span class="custom-handle">{{ value }}</span>
            </ng-template>
        </mona-slider>
    `,
    imports: [SliderComponent, SliderHandleTemplateDirective]
})
class HandleTemplateSliderHostComponent {}

@Component({
    template: `
        <mona-slider [value]="0" [minValue]="0" [maxValue]="10" [step]="5" [showTicks]="true" [showLabels]="true">
            <ng-template monaSliderTickValueTemplate let-value>
                <span class="custom-tick-value">{{ value }}!</span>
            </ng-template>
        </mona-slider>
    `,
    imports: [SliderComponent, SliderTickValueTemplateDirective]
})
class TickValueTemplateSliderHostComponent {}

async function waitForStable(fixture: ComponentFixture<unknown>): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
}

function getSliderElement(fixture: ComponentFixture<unknown>): HTMLElement {
    return fixture.debugElement.query(By.directive(SliderComponent)).nativeElement as HTMLElement;
}

function getHandle(fixture: ComponentFixture<unknown>): HTMLElement {
    return fixture.debugElement.query(By.css("[role='slider']")).nativeElement as HTMLElement;
}

function dispatchKeydown(element: HTMLElement, key: string, shift = false): void {
    element.dispatchEvent(new KeyboardEvent("keydown", { key, shiftKey: shift, bubbles: true, cancelable: true }));
}

describe("SliderComponent", () => {
    describe("signal forms", () => {
        let fixture: ComponentFixture<SignalFormSliderHostComponent>;
        let component: SignalFormSliderHostComponent;

        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [SignalFormSliderHostComponent]
            }).compileComponents();

            fixture = TestBed.createComponent(SignalFormSliderHostComponent);
            component = fixture.componentInstance;
            await waitForStable(fixture);
        });

        it("should create a single slider handle", () => {
            expect(fixture.debugElement.query(By.directive(SliderComponent))).toBeTruthy();
            expect(fixture.debugElement.queryAll(By.css("[role='slider']")).length).toBe(1);
        });

        it("should expose single-value ARIA attributes", () => {
            expect(getHandle(fixture).getAttribute("aria-label")).toBe("Slider value");
            expect(getHandle(fixture).getAttribute("aria-valuemin")).toBe("0");
            expect(getHandle(fixture).getAttribute("aria-valuemax")).toBe("10");
            expect(getHandle(fixture).getAttribute("aria-valuenow")).toBe("0");
        });

        it("should reflect signal form value changes", async () => {
            component.form.value().value.set(5);
            await waitForStable(fixture);

            expect(getHandle(fixture).getAttribute("aria-valuenow")).toBe("5");
        });

        it("should clamp displayed form values to min and max", async () => {
            component.form.value().value.set(-99);
            await waitForStable(fixture);
            expect(getHandle(fixture).getAttribute("aria-valuenow")).toBe("0");

            component.form.value().value.set(999);
            await waitForStable(fixture);
            expect(getHandle(fixture).getAttribute("aria-valuenow")).toBe("10");
        });

        it("should update the signal form value from keyboard navigation", async () => {
            component.form.value().value.set(5);
            await waitForStable(fixture);

            dispatchKeydown(getHandle(fixture), "ArrowRight");
            await waitForStable(fixture);

            expect(component.form.value().value()).toBe(6);
        });

        it("should honor vertical orientation keyboard navigation", async () => {
            component.orientation.set("vertical");
            component.form.value().value.set(5);
            await waitForStable(fixture);

            dispatchKeydown(getHandle(fixture), "ArrowUp");
            await waitForStable(fixture);

            expect(getHandle(fixture).getAttribute("aria-orientation")).toBe("vertical");
            expect(component.form.value().value()).toBe(6);
            expect(getSliderElement(fixture).getAttribute("data-orientation")).toBe("vertical");
        });

        it("should apply rounded variants", async () => {
            component.rounded.set("small");
            await waitForStable(fixture);

            expect(getHandle(fixture).classList.contains("rounded-sm")).toBe(true);
            expect(fixture.debugElement.query(By.css(".bg-surface-muted")).classes["rounded-sm"]).toBe(true);
        });

        it("should use a muted track, primary progress, and a neutral semantic-focus handle", async () => {
            await waitForStable(fixture);

            const track = fixture.debugElement.query(By.css(".bg-surface-muted")).nativeElement as HTMLElement;
            const selection = fixture.debugElement.query(By.css(".bg-primary")).nativeElement as HTMLElement;
            const handle = getHandle(fixture);

            expect(track.classList.contains("border-input-border")).toBe(false);
            expect(track.classList.contains("rounded-full")).toBe(true);
            expect(selection).toBeTruthy();
            expect(
                handle.classList.contains(
                    "[background-color:var(--mona-effect-raised-background-color,var(--color-surface-raised))]"
                )
            ).toBe(true);
            expect(handle.classList.contains('data-[focused="true"]:ring-focus-indicator/35')).toBe(true);
            expect(handle.classList.contains('data-[invalid="true"]:data-[focused="true"]:ring-error/35')).toBe(true);
        });

        it("should disable focus and keyboard updates when the form field is disabled", async () => {
            component.form.value().value.set(5);
            component.disabled.set(true);
            await waitForStable(fixture);

            dispatchKeydown(getHandle(fixture), "ArrowRight");
            await waitForStable(fixture);

            expect(getHandle(fixture).getAttribute("tabindex")).toBe("-1");
            expect(getSliderElement(fixture).getAttribute("data-disabled")).toBe("true");
            expect(component.form.value().value()).toBe(5);
        });

        it("should render ticks and labels", async () => {
            component.showTicks.set(true);
            component.showLabels.set(true);
            component.step.set(5);
            await waitForStable(fixture);

            expect(fixture.debugElement.queryAll(By.css("[monaSliderTick]")).length).toBe(3);
            expect(fixture.debugElement.queryAll(By.css("[data-label-position]")).length).toBe(1);
        });
    });

    describe("value model binding", () => {
        it("should support two-way value binding", async () => {
            await TestBed.configureTestingModule({
                imports: [ValueBindingSliderHostComponent]
            }).compileComponents();

            const fixture = TestBed.createComponent(ValueBindingSliderHostComponent);
            await waitForStable(fixture);

            dispatchKeydown(getHandle(fixture), "ArrowRight");
            await waitForStable(fixture);

            expect(fixture.componentInstance.value()).toBe(6);
        });
    });

    describe("custom templates", () => {
        it("should render a custom handle template", async () => {
            await TestBed.configureTestingModule({
                imports: [HandleTemplateSliderHostComponent]
            }).compileComponents();

            const fixture = TestBed.createComponent(HandleTemplateSliderHostComponent);
            await waitForStable(fixture);

            const handle = fixture.debugElement.query(By.css(".custom-handle")).nativeElement as HTMLElement;
            expect(handle.textContent?.trim()).toBe("5");
        });

        it("should render custom tick value templates", async () => {
            await TestBed.configureTestingModule({
                imports: [TickValueTemplateSliderHostComponent]
            }).compileComponents();

            const fixture = TestBed.createComponent(TickValueTemplateSliderHostComponent);
            await waitForStable(fixture);

            const tickValue = fixture.debugElement.query(By.css(".custom-tick-value")).nativeElement as HTMLElement;
            expect(tickValue.textContent?.trim()).toBe("0!");
        });
    });
});

interface SliderFormModel {
    value: number;
}
