import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { disabled as fieldDisabled, form, FormField } from "@angular/forms/signals";
import { By } from "@angular/platform-browser";
import { beforeEach, describe, expect, it } from "vitest";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { SliderHandleTemplateDirective } from "../../directives/slider-handle-template.directive";
import type { SliderVariantProps } from "../../styles/slider.styles";
import { RangeSliderComponent } from "./range-slider.component";

@Component({
    template: `
        <mona-range-slider
            [formField]="$any(form.value)"
            [minValue]="minValue()"
            [maxValue]="maxValue()"
            [step]="step()"
            [orientation]="orientation()"
            [rounded]="rounded()"
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
    public readonly rounded = signal<SliderVariantProps["rounded"]>("full");
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

        it("should use a rounded muted track with primary range fill", () => {
            const track = fixture.debugElement.query(By.css(".bg-surface-muted")).nativeElement as HTMLElement;
            const selection = fixture.debugElement.query(By.css(".bg-primary")).nativeElement as HTMLElement;

            expect(track.classList.contains("rounded-full")).toBe(true);
            expect(selection).toBeTruthy();
        });

        it("should apply the rounded input to the track and both handles", async () => {
            component.rounded.set("none");
            await waitForStable(fixture);

            const track = fixture.debugElement.query(By.css(".bg-surface-muted")).nativeElement as HTMLElement;

            expect(track.classList.contains("rounded-none")).toBe(true);
            expect(getPrimaryHandle(fixture).classList.contains("rounded-none")).toBe(true);
            expect(getSecondaryHandle(fixture).classList.contains("rounded-none")).toBe(true);
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

    describe("i18n and RTL", () => {
        it("renders default English aria-labels on handles", async () => {
            await TestBed.configureTestingModule({
                imports: [ValueBindingRangeSliderHostComponent]
            }).compileComponents();

            const fixture = TestBed.createComponent(ValueBindingRangeSliderHostComponent);
            await waitForStable(fixture);

            expect(getPrimaryHandle(fixture).getAttribute("aria-label")).toBe("Minimum value");
            expect(getSecondaryHandle(fixture).getAttribute("aria-label")).toBe("Maximum value");
        });

        it("updates aria-labels dynamically when locale changes", async () => {
            await TestBed.configureTestingModule({
                imports: [ValueBindingRangeSliderHostComponent]
            }).compileComponents();

            const fixture = TestBed.createComponent(ValueBindingRangeSliderHostComponent);
            const i18nService = TestBed.inject(MonaI18nService);
            i18nService.use({
                direction: "ltr",
                id: "tr-TR",
                messages: {
                    slider: {
                        maximumValue: "Maksimum değer",
                        minimumValue: "Minimum değer",
                        sliderValue: "Sürgü değeri"
                    }
                }
            });
            await waitForStable(fixture);

            expect(getPrimaryHandle(fixture).getAttribute("aria-label")).toBe("Minimum değer");
            expect(getSecondaryHandle(fixture).getAttribute("aria-label")).toBe("Maksimum değer");
        });

        it("inverts horizontal arrow key navigation in RTL direction", async () => {
            await TestBed.configureTestingModule({
                imports: [ValueBindingRangeSliderHostComponent]
            }).compileComponents();

            const fixture = TestBed.createComponent(ValueBindingRangeSliderHostComponent);
            const i18nService = TestBed.inject(MonaI18nService);
            i18nService.use({
                direction: "rtl",
                id: "ar-EG",
                messages: {
                    slider: {
                        maximumValue: "القيمة القصوى",
                        minimumValue: "القيمة الدنيا",
                        sliderValue: "قيمة شريط التمرير"
                    }
                }
            });
            await waitForStable(fixture);

            // Case 2: RTL locale + LTR DOM -> ArrowRight still increases value (normal LTR)
            dispatchKeydown(getSecondaryHandle(fixture), "ArrowRight");
            await waitForStable(fixture);
            expect(fixture.componentInstance.value()).toEqual([2, 9]);

            dispatchKeydown(getSecondaryHandle(fixture), "ArrowLeft");
            await waitForStable(fixture);
            expect(fixture.componentInstance.value()).toEqual([2, 8]);

            // Case 4: RTL locale + RTL DOM -> inverts horizontal navigation
            fixture.nativeElement.setAttribute("dir", "rtl");
            await waitForStable(fixture);

            // In RTL, ArrowRight decreases value, ArrowLeft increases value
            dispatchKeydown(getSecondaryHandle(fixture), "ArrowRight");
            await waitForStable(fixture);
            expect(fixture.componentInstance.value()).toEqual([2, 7]);

            dispatchKeydown(getSecondaryHandle(fixture), "ArrowLeft");
            await waitForStable(fixture);
            expect(fixture.componentInstance.value()).toEqual([2, 8]);
        });

        it("maintains coherent LTR keyboard navigation and handle geometry under CSS-only direction override", async () => {
            await TestBed.configureTestingModule({
                imports: [ValueBindingRangeSliderHostComponent]
            }).compileComponents();

            const fixture = TestBed.createComponent(ValueBindingRangeSliderHostComponent);
            fixture.nativeElement.setAttribute("dir", "ltr");
            fixture.nativeElement.style.direction = "rtl";
            await waitForStable(fixture);

            const primaryHandle = getPrimaryHandle(fixture);
            const secondaryHandle = getSecondaryHandle(fixture);

            expect(primaryHandle.matches(":dir(ltr)")).toBe(true);
            expect(primaryHandle.matches(":dir(rtl)")).toBe(false);
            expect(secondaryHandle.matches(":dir(ltr)")).toBe(true);
            expect(secondaryHandle.matches(":dir(rtl)")).toBe(false);

            // Initial positions for value [2, 8] with min 0, max 10
            expect(primaryHandle.style.insetInlineStart).toBe("20%");
            expect(secondaryHandle.style.insetInlineStart).toBe("80%");

            // Secondary handle: ArrowRight increases in LTR
            dispatchKeydown(secondaryHandle, "ArrowRight");
            await waitForStable(fixture);
            expect(fixture.componentInstance.value()).toEqual([2, 9]);
            expect(secondaryHandle.style.insetInlineStart).toBe("90%");

            dispatchKeydown(secondaryHandle, "ArrowLeft");
            await waitForStable(fixture);
            expect(fixture.componentInstance.value()).toEqual([2, 8]);
            expect(secondaryHandle.style.insetInlineStart).toBe("80%");

            // Primary handle: ArrowRight increases in LTR
            dispatchKeydown(primaryHandle, "ArrowRight");
            await waitForStable(fixture);
            expect(fixture.componentInstance.value()).toEqual([3, 8]);
            expect(primaryHandle.style.insetInlineStart).toBe("30%");

            dispatchKeydown(primaryHandle, "ArrowLeft");
            await waitForStable(fixture);
            expect(fixture.componentInstance.value()).toEqual([2, 8]);
            expect(primaryHandle.style.insetInlineStart).toBe("20%");
        });

        it("maintains coherent RTL keyboard navigation and handle geometry under CSS-only direction override", async () => {
            await TestBed.configureTestingModule({
                imports: [ValueBindingRangeSliderHostComponent]
            }).compileComponents();

            const fixture = TestBed.createComponent(ValueBindingRangeSliderHostComponent);
            fixture.nativeElement.setAttribute("dir", "rtl");
            fixture.nativeElement.style.direction = "ltr";
            await waitForStable(fixture);

            const primaryHandle = getPrimaryHandle(fixture);
            const secondaryHandle = getSecondaryHandle(fixture);

            expect(primaryHandle.matches(":dir(rtl)")).toBe(true);
            expect(primaryHandle.matches(":dir(ltr)")).toBe(false);
            expect(secondaryHandle.matches(":dir(rtl)")).toBe(true);
            expect(secondaryHandle.matches(":dir(ltr)")).toBe(false);

            // Initial positions for value [2, 8] with min 0, max 10
            expect(primaryHandle.style.insetInlineStart).toBe("20%");
            expect(secondaryHandle.style.insetInlineStart).toBe("80%");

            // Secondary handle: ArrowRight decreases in RTL
            dispatchKeydown(secondaryHandle, "ArrowRight");
            await waitForStable(fixture);
            expect(fixture.componentInstance.value()).toEqual([2, 7]);
            expect(secondaryHandle.style.insetInlineStart).toBe("70%");

            dispatchKeydown(secondaryHandle, "ArrowLeft");
            await waitForStable(fixture);
            expect(fixture.componentInstance.value()).toEqual([2, 8]);
            expect(secondaryHandle.style.insetInlineStart).toBe("80%");

            // Primary handle: ArrowRight decreases in RTL
            dispatchKeydown(primaryHandle, "ArrowRight");
            await waitForStable(fixture);
            expect(fixture.componentInstance.value()).toEqual([1, 8]);
            expect(primaryHandle.style.insetInlineStart).toBe("10%");

            dispatchKeydown(primaryHandle, "ArrowLeft");
            await waitForStable(fixture);
            expect(fixture.componentInstance.value()).toEqual([2, 8]);
            expect(primaryHandle.style.insetInlineStart).toBe("20%");
        });
    });
});

interface RangeSliderFormModel {
    value: [number, number];
}
