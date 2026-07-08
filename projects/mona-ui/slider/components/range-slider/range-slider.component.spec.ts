import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { disabled as fieldDisabled, form, FormField } from "@angular/forms/signals";
import { By } from "@angular/platform-browser";
import { beforeEach, describe, expect, it } from "vitest";
import { SliderHandleTemplateDirective } from "../../directives/slider-handle-template.directive";
import { RangeSliderComponent } from "./range-slider.component";

@Component({
    template: `
        <mona-range-slider
            [formField]="$any(form.value)"
            [minValue]="minValue()"
            [maxValue]="maxValue()"
            [step]="step()"
            [orientation]="orientation()"
            [showTicks]="showTicks()"
            [showLabels]="showLabels()">
        </mona-range-slider>
    `,
    imports: [RangeSliderComponent, FormField]
})
class SignalFormRangeSliderHostComponent {
    readonly #formModel = signal<RangeSliderFormModel>({ value: [0, 10] });
    public readonly disabled = signal(false);
    public readonly form = form(this.#formModel, schema => {
        fieldDisabled(schema.value, { when: () => this.disabled() });
    });
    public readonly maxValue = signal(10);
    public readonly minValue = signal(0);
    public readonly orientation = signal<"horizontal" | "vertical">("horizontal");
    public readonly showLabels = signal(false);
    public readonly showTicks = signal(false);
    public readonly step = signal(1);
}

@Component({
    template: `<mona-range-slider [(value)]="value" [minValue]="0" [maxValue]="10"></mona-range-slider>`,
    imports: [RangeSliderComponent]
})
class ValueBindingRangeSliderHostComponent {
    public readonly value = signal<[number, number]>([2, 8]);
}

@Component({
    template: `
        <mona-range-slider [value]="[2, 8]" [minValue]="0" [maxValue]="10">
            <ng-template monaSliderHandleTemplate let-value>
                <span class="custom-handle">{{ value }}</span>
            </ng-template>
        </mona-range-slider>
    `,
    imports: [RangeSliderComponent, SliderHandleTemplateDirective]
})
class HandleTemplateRangeSliderHostComponent {}

async function waitForStable(fixture: ComponentFixture<unknown>): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
}

function getRangeSliderElement(fixture: ComponentFixture<unknown>): HTMLElement {
    return fixture.debugElement.query(By.directive(RangeSliderComponent)).nativeElement as HTMLElement;
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

describe("RangeSliderComponent", () => {
    describe("signal forms", () => {
        let fixture: ComponentFixture<SignalFormRangeSliderHostComponent>;
        let component: SignalFormRangeSliderHostComponent;

        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [SignalFormRangeSliderHostComponent]
            }).compileComponents();

            fixture = TestBed.createComponent(SignalFormRangeSliderHostComponent);
            component = fixture.componentInstance;
            await waitForStable(fixture);
        });

        it("should create two slider handles", () => {
            expect(fixture.debugElement.query(By.directive(RangeSliderComponent))).toBeTruthy();
            expect(fixture.debugElement.queryAll(By.css("[role='slider']")).length).toBe(2);
        });

        it("should expose range ARIA attributes", async () => {
            component.form.value().value.set([2, 8]);
            await waitForStable(fixture);

            expect(getPrimaryHandle(fixture).getAttribute("aria-label")).toBe("Minimum value");
            expect(getSecondaryHandle(fixture).getAttribute("aria-label")).toBe("Maximum value");
            expect(getPrimaryHandle(fixture).getAttribute("aria-valuenow")).toBe("2");
            expect(getSecondaryHandle(fixture).getAttribute("aria-valuenow")).toBe("8");
        });

        it("should sort and clamp displayed form values", async () => {
            component.form.value().value.set([99, -5]);
            await waitForStable(fixture);

            expect(getPrimaryHandle(fixture).getAttribute("aria-valuenow")).toBe("0");
            expect(getSecondaryHandle(fixture).getAttribute("aria-valuenow")).toBe("10");
        });

        it("should update the primary value from keyboard navigation", async () => {
            component.form.value().value.set([2, 8]);
            await waitForStable(fixture);

            dispatchKeydown(getPrimaryHandle(fixture), "ArrowRight");
            await waitForStable(fixture);

            expect(component.form.value().value()).toEqual([3, 8]);
        });

        it("should update the secondary value from keyboard navigation", async () => {
            component.form.value().value.set([2, 8]);
            await waitForStable(fixture);

            dispatchKeydown(getSecondaryHandle(fixture), "ArrowRight");
            await waitForStable(fixture);

            expect(component.form.value().value()).toEqual([2, 9]);
        });

        it("should honor vertical orientation", async () => {
            component.orientation.set("vertical");
            component.form.value().value.set([2, 8]);
            await waitForStable(fixture);

            expect(getPrimaryHandle(fixture).getAttribute("aria-orientation")).toBe("vertical");
            expect(getRangeSliderElement(fixture).getAttribute("data-orientation")).toBe("vertical");
        });

        it("should disable both handles when the form field is disabled", async () => {
            component.form.value().value.set([2, 8]);
            component.disabled.set(true);
            await waitForStable(fixture);

            dispatchKeydown(getSecondaryHandle(fixture), "ArrowRight");
            await waitForStable(fixture);

            expect(getPrimaryHandle(fixture).getAttribute("tabindex")).toBe("-1");
            expect(getSecondaryHandle(fixture).getAttribute("tabindex")).toBe("-1");
            expect(component.form.value().value()).toEqual([2, 8]);
        });

        it("should keep the secondary handle on top when values overlap by default", async () => {
            component.form.value().value.set([5, 5]);
            await waitForStable(fixture);

            expect(getPrimaryHandle(fixture).style.zIndex).toBe("1");
            expect(getSecondaryHandle(fixture).style.zIndex).toBe("2");
        });

        it("should choose the secondary handle when clicking above an overlapped value", async () => {
            component.form.value().value.set([5, 5]);
            await waitForStable(fixture);

            const host = getRangeSliderElement(fixture);
            host.getBoundingClientRect = () =>
                ({
                    left: 0,
                    top: 0,
                    width: 100,
                    height: 20,
                    right: 100,
                    bottom: 20,
                    x: 0,
                    y: 0,
                    toJSON: () => ({})
                }) as DOMRect;

            host.dispatchEvent(new MouseEvent("click", { clientX: 90, clientY: 10, bubbles: true }));
            await waitForStable(fixture);

            expect(component.form.value().value()).toEqual([5, 9]);
        });
    });

    describe("value model binding", () => {
        it("should support two-way value binding", async () => {
            await TestBed.configureTestingModule({
                imports: [ValueBindingRangeSliderHostComponent]
            }).compileComponents();

            const fixture = TestBed.createComponent(ValueBindingRangeSliderHostComponent);
            await waitForStable(fixture);

            dispatchKeydown(getSecondaryHandle(fixture), "ArrowRight");
            await waitForStable(fixture);

            expect(fixture.componentInstance.value()).toEqual([2, 9]);
        });
    });

    describe("custom templates", () => {
        it("should render a custom handle template for both handles", async () => {
            await TestBed.configureTestingModule({
                imports: [HandleTemplateRangeSliderHostComponent]
            }).compileComponents();

            const fixture = TestBed.createComponent(HandleTemplateRangeSliderHostComponent);
            await waitForStable(fixture);

            const handles = fixture.debugElement.queryAll(By.css(".custom-handle"));
            expect(handles.length).toBe(2);
            expect((handles[0].nativeElement as HTMLElement).textContent?.trim()).toBe("2");
            expect((handles[1].nativeElement as HTMLElement).textContent?.trim()).toBe("8");
        });
    });
});

interface RangeSliderFormModel {
    value: [number, number];
}
