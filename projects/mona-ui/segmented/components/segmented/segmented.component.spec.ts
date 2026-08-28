import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { disabled as fieldDisabled, form, FormField } from "@angular/forms/signals";
import { By } from "@angular/platform-browser";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SegmentedOption } from "../../models/SegmentedOption";
import { SegmentedComponent } from "./segmented.component";

const stringOptions = [
    { label: "Discover", value: "discover" },
    { label: "My courses", value: "courses" }
] as const satisfies readonly SegmentedOption[];

const numberOptions = [
    { label: "Day", value: 1 },
    { label: "Week", value: 7 },
    { label: "Month", value: 30 }
] as const satisfies readonly SegmentedOption[];

const mixedOptions = [
    { label: "List", value: "list" },
    { label: "Grid", value: "grid" },
    { label: "Archived", value: "archived", disabled: true }
] as const satisfies readonly SegmentedOption[];

@Component({
    template: `
        <mona-segmented
            [alignment]="alignment()"
            [animate]="animate()"
            [aria-label]="ariaLabel()"
            [aria-labelledby]="ariaLabelledBy()"
            [disabled]="disabled()"
            [invalid]="invalid()"
            [options]="options()"
            [rounded]="rounded()"
            [size]="size()"
            [touched]="touched()"
            [(value)]="value"></mona-segmented>
    `,
    imports: [SegmentedComponent]
})
class HostComponent {
    public readonly alignment = signal<"start" | "center" | "end" | "stretch">("stretch");
    public readonly animate = signal(true);
    public readonly ariaLabel = signal<string | null>(null);
    public readonly ariaLabelledBy = signal<string | null>(null);
    public readonly disabled = signal(false);
    public readonly invalid = signal(false);
    public readonly options = signal<readonly SegmentedOption[]>(stringOptions);
    public readonly rounded = signal<"none" | "small" | "medium" | "large" | "full">("medium");
    public readonly size = signal<"small" | "medium" | "large">("medium");
    public readonly touched = signal(false);
    public readonly value = signal<string | number | null>("discover");
}

@Component({
    template: `
        <mona-segmented [formField]="form.section" [options]="options"></mona-segmented>
    `,
    imports: [SegmentedComponent, FormField]
})
class SignalFormHostComponent {
    readonly #model = signal<FormModel>({ section: "courses" });
    public readonly disabled = signal(false);
    public readonly form = form(this.#model, schema => {
        fieldDisabled(schema.section, { when: () => this.disabled() });
    });
    public readonly options = stringOptions;
}

async function waitForStable(fixture: ComponentFixture<unknown>): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
}

function getHostElement(fixture: ComponentFixture<HostComponent>): HTMLElement {
    return fixture.debugElement.query(By.directive(SegmentedComponent)).nativeElement as HTMLElement;
}

function getIndicator(fixture: ComponentFixture<unknown>): HTMLDivElement | null {
    return (
        (fixture.debugElement.query(By.css("div[aria-hidden='true']"))?.nativeElement as HTMLDivElement | undefined) ??
        null
    );
}

function getRadios(fixture: ComponentFixture<unknown>): HTMLInputElement[] {
    return fixture.debugElement
        .queryAll(By.css('input[type="radio"]'))
        .map(element => element.nativeElement as HTMLInputElement);
}

function getLabels(fixture: ComponentFixture<unknown>): HTMLLabelElement[] {
    return fixture.debugElement
        .queryAll(By.css("label"))
        .map(element => element.nativeElement as HTMLLabelElement);
}

function selectRadio(fixture: ComponentFixture<unknown>, index: number): void {
    const radio = getRadios(fixture)[index];
    radio.click();
    fixture.detectChanges();
}

function mockOptionBounds(
    fixture: ComponentFixture<HostComponent>,
    bounds: { height: number; left: number; top: number; width: number }[]
): void {
    const host = getHostElement(fixture);
    vi.spyOn(host, "getBoundingClientRect").mockReturnValue({
        bottom: 40,
        height: 40,
        left: 0,
        right: 300,
        top: 0,
        width: 300,
        x: 0,
        y: 0,
        toJSON: () => ({})
    });
    const labels = getLabels(fixture);
    labels.forEach((label, i) => {
        const bound = bounds[i] ?? { height: 32, left: 4 + i * 140, top: 4, width: 140 };
        vi.spyOn(label, "getBoundingClientRect").mockReturnValue({
            bottom: bound.top + bound.height,
            height: bound.height,
            left: bound.left,
            right: bound.left + bound.width,
            top: bound.top,
            width: bound.width,
            x: bound.left,
            y: bound.top,
            toJSON: () => ({})
        });
    });
}

describe("SegmentedComponent", () => {
    describe("rendering", () => {
        let fixture: ComponentFixture<HostComponent>;
        let component: HostComponent;

        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [HostComponent]
            }).compileComponents();

            fixture = TestBed.createComponent(HostComponent);
            component = fixture.componentInstance;
            await waitForStable(fixture);
        });

        it("renders all options with visible labels", () => {
            const labels = getLabels(fixture);
            expect(labels.length).toBe(stringOptions.length);
            labels.forEach((label, index) => {
                expect(label.textContent?.trim()).toBe(stringOptions[index].label);
            });
        });

        it("renders one native radio input per option", () => {
            const radios = getRadios(fixture);
            expect(radios.length).toBe(stringOptions.length);
            radios.forEach(radio => {
                expect(radio.type).toBe("radio");
            });
        });

        it("shares one internally generated name across all radios in a single instance", () => {
            const radios = getRadios(fixture);
            const names = new Set(radios.map(radio => radio.name));
            expect(names.size).toBe(1);
            expect(radios[0].name).toMatch(/^mona-:/);
        });

        it("uses different generated names across component instances", async () => {
            const first = getRadios(fixture)[0].name;

            await TestBed.resetTestingModule();
            await TestBed.configureTestingModule({
                imports: [HostComponent]
            }).compileComponents();

            const secondFixture = TestBed.createComponent(HostComponent);
            await waitForStable(secondFixture);
            const second = getRadios(secondFixture)[0].name;

            expect(first).not.toBe(second);
        });

        it("sets role=radiogroup on the host", () => {
            expect(getHostElement(fixture).getAttribute("role")).toBe("radiogroup");
        });

        it("renders exactly one selection indicator element", () => {
            const indicator = getIndicator(fixture);
            expect(indicator).not.toBeNull();
        });

        it("keeps exactly one indicator regardless of option count", async () => {
            component.options.set(numberOptions);
            await waitForStable(fixture);

            const allIndicators = fixture.debugElement.queryAll(By.css("div[aria-hidden='true']"));
            expect(allIndicators.length).toBe(0); // value "discover" is unmatched, so 0

            component.value.set(7);
            await waitForStable(fixture);

            const matchingIndicators = fixture.debugElement.queryAll(By.css("div[aria-hidden='true']"));
            expect(matchingIndicators.length).toBe(1);
        });

        it("sets aria-hidden=true and pointer-events-none on the indicator", () => {
            const indicator = getIndicator(fixture);
            expect(indicator?.getAttribute("aria-hidden")).toBe("true");
            expect(indicator?.classList.contains("pointer-events-none")).toBe(true);
        });

        it("owns selected surface styling on the indicator", () => {
            const indicator = getIndicator(fixture);
            expect(indicator?.classList.contains("bg-primary")).toBe(true);
            expect(indicator?.classList.contains("shadow-sm")).toBe(true);
            expect(indicator?.classList.contains("ring-1")).toBe(true);
            expect(indicator?.classList.contains("ring-selected-border")).toBe(true);
        });

        it("does not apply selected background, shadow, or ring directly to option labels", () => {
            const labels = getLabels(fixture);
            labels.forEach(label => {
                expect(label.classList.contains("bg-primary")).toBe(false);
                expect(label.classList.contains("shadow-sm")).toBe(false);
                expect(label.classList.contains("ring-1")).toBe(false);
                expect(label.classList.contains("ring-selected-border")).toBe(false);
            });
        });

        it("drives selected and unselected text colors on option labels", () => {
            const labels = getLabels(fixture);
            expect(labels[0].getAttribute("data-selected")).toBe("true");
            expect(labels[0].classList.contains("data-[selected='true']:text-primary-foreground")).toBe(true);
            expect(labels[1].getAttribute("data-selected")).toBe("false");
            expect(labels[1].classList.contains("data-[selected='false']:text-muted-foreground")).toBe(true);
        });
    });

    describe("animate input", () => {
        let fixture: ComponentFixture<HostComponent>;
        let component: HostComponent;

        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [HostComponent]
            }).compileComponents();

            fixture = TestBed.createComponent(HostComponent);
            component = fixture.componentInstance;
            await waitForStable(fixture);
        });

        it("defaults animate to true", () => {
            const componentInstance = fixture.debugElement
                .query(By.directive(SegmentedComponent))
                .componentInstance as SegmentedComponent;
            expect(componentInstance.animate()).toBe(true);
        });

        it("disables indicator transition when animate is false", async () => {
            component.animate.set(false);
            await waitForStable(fixture);

            selectRadio(fixture, 1);
            await waitForStable(fixture);

            const indicator = getIndicator(fixture);
            expect(indicator?.classList.contains("transition-none")).toBe(true);
        });

        it("supports toggling animate at runtime", async () => {
            component.animate.set(false);
            await waitForStable(fixture);

            let indicator = getIndicator(fixture);
            expect(indicator?.classList.contains("transition-none")).toBe(true);

            component.animate.set(true);
            await waitForStable(fixture);

            selectRadio(fixture, 1);
            await waitForStable(fixture);

            indicator = getIndicator(fixture);
            expect(
                indicator?.classList.contains("transition-[transform,width,height]") ||
                    !indicator?.classList.contains("transition-none")
            ).toBe(true);
        });
    });

    describe("roundness", () => {
        let fixture: ComponentFixture<HostComponent>;
        let component: HostComponent;

        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [HostComponent]
            }).compileComponents();

            fixture = TestBed.createComponent(HostComponent);
            component = fixture.componentInstance;
            await waitForStable(fixture);
        });

        it.each([
            ["none", "rounded-none", "rounded-none"],
            ["small", "rounded-sm", "rounded-xs"],
            ["medium", "rounded-md", "rounded-sm"],
            ["large", "rounded-lg", "rounded-md"],
            ["full", "rounded-full", "rounded-full"]
        ] as const)("applies the %s roundness preset", (rounded, containerClass, optionClass) => {
            component.rounded.set(rounded);
            fixture.detectChanges();

            expect(getHostElement(fixture).classList.contains(containerClass)).toBe(true);
            getLabels(fixture).forEach(label => {
                expect(label.classList.contains(optionClass)).toBe(true);
            });
            const indicator = getIndicator(fixture);
            expect(indicator?.classList.contains(optionClass)).toBe(true);
        });

        it("defaults to the medium roundness preset", () => {
            const componentInstance = fixture.debugElement
                .query(By.directive(SegmentedComponent))
                .componentInstance as SegmentedComponent;
            expect(componentInstance.rounded()).toBe("medium");

            expect(getHostElement(fixture).classList.contains("rounded-md")).toBe(true);
            getLabels(fixture).forEach(label => {
                expect(label.classList.contains("rounded-sm")).toBe(true);
            });
            const indicator = getIndicator(fixture);
            expect(indicator?.classList.contains("rounded-sm")).toBe(true);
        });

        it("keeps the focus ring on the option label radius", () => {
            const label = getLabels(fixture)[0];
            const span = label.querySelector("span") as HTMLSpanElement | null;

            expect(span?.classList.contains("peer-focus-visible:ring-2")).toBe(true);
            expect(span?.classList.contains("peer-focus-visible:ring-focus-indicator/35")).toBe(true);
            expect(span?.classList.contains("[border-radius:inherit]")).toBe(true);
        });
    });

    describe("alignment", () => {
        let fixture: ComponentFixture<HostComponent>;
        let component: HostComponent;

        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [HostComponent]
            }).compileComponents();

            fixture = TestBed.createComponent(HostComponent);
            component = fixture.componentInstance;
            await waitForStable(fixture);
        });

        it("defaults alignment to stretch", () => {
            const componentInstance = fixture.debugElement
                .query(By.directive(SegmentedComponent))
                .componentInstance as SegmentedComponent;
            expect(componentInstance.alignment()).toBe("stretch");

            expect(getHostElement(fixture).classList.contains("justify-stretch")).toBe(true);
            getLabels(fixture).forEach(label => {
                expect(label.classList.contains("flex-1")).toBe(true);
            });
        });

        it.each([
            ["start", "justify-start"],
            ["center", "justify-center"],
            ["end", "justify-end"]
        ] as const)("positions options at %s and sizes them to content", (alignment, containerClass) => {
            component.alignment.set(alignment);
            fixture.detectChanges();

            expect(getHostElement(fixture).classList.contains(containerClass)).toBe(true);
            getLabels(fixture).forEach(label => {
                expect(label.classList.contains("flex-none")).toBe(true);
                expect(label.classList.contains("flex-1")).toBe(false);
            });
        });
    });

    describe("selection and indicator geometry", () => {
        let fixture: ComponentFixture<HostComponent>;
        let component: HostComponent;

        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [HostComponent]
            }).compileComponents();

            fixture = TestBed.createComponent(HostComponent);
            component = fixture.componentInstance;
        });

        it("positions the indicator over the initial selected option without transition", async () => {
            fixture.detectChanges();
            mockOptionBounds(fixture, [
                { height: 32, left: 4, top: 4, width: 140 },
                { height: 32, left: 148, top: 4, width: 140 }
            ]);
            component.options.set([...stringOptions]);
            await waitForStable(fixture);

            const indicator = getIndicator(fixture);
            expect(indicator).not.toBeNull();
            expect(indicator?.style.transform).toBe("translate3d(4px, 4px, 0)");
            expect(indicator?.style.width).toBe("140px");
            expect(indicator?.style.height).toBe("32px");
            expect(indicator?.classList.contains("transition-none")).toBe(true);
        });

        it("updates indicator geometry when selection changes via radio click", async () => {
            fixture.detectChanges();
            mockOptionBounds(fixture, [
                { height: 32, left: 4, top: 4, width: 140 },
                { height: 32, left: 148, top: 4, width: 140 }
            ]);
            component.options.set([...stringOptions]);
            await waitForStable(fixture);

            selectRadio(fixture, 1);
            await waitForStable(fixture);

            const indicator = getIndicator(fixture);
            expect(indicator?.style.transform).toBe("translate3d(148px, 4px, 0)");
            expect(indicator?.classList.contains("transition-[transform,width,height]")).toBe(true);
        });

        it("updates indicator geometry when value changes programmatically", async () => {
            fixture.detectChanges();
            mockOptionBounds(fixture, [
                { height: 32, left: 4, top: 4, width: 140 },
                { height: 32, left: 148, top: 4, width: 140 }
            ]);
            component.options.set([...stringOptions]);
            await waitForStable(fixture);

            component.value.set("courses");
            await waitForStable(fixture);

            const indicator = getIndicator(fixture);
            expect(indicator?.style.transform).toBe("translate3d(148px, 4px, 0)");
        });

        it("hides indicator when value is null", async () => {
            await waitForStable(fixture);
            component.value.set(null);
            await waitForStable(fixture);

            expect(getIndicator(fixture)).toBeNull();
        });

        it("hides indicator when value is unmatched", async () => {
            await waitForStable(fixture);
            component.value.set("non-existent");
            await waitForStable(fixture);

            expect(getIndicator(fixture)).toBeNull();
            expect(component.value()).toBe("non-existent");
        });

        it("hides indicator when selected option disappears from options", async () => {
            await waitForStable(fixture);
            expect(getIndicator(fixture)).not.toBeNull();

            component.options.set(numberOptions);
            await waitForStable(fixture);

            expect(getIndicator(fixture)).toBeNull();
            expect(component.value()).toBe("discover");
        });

        it("restores indicator when matching option reappears without sliding from stale coords", async () => {
            component.value.set("archived");
            component.options.set(stringOptions);
            await waitForStable(fixture);
            expect(getIndicator(fixture)).toBeNull();

            component.options.set(mixedOptions);
            await waitForStable(fixture);
            mockOptionBounds(fixture, [
                { height: 32, left: 4, top: 4, width: 90 },
                { height: 32, left: 98, top: 4, width: 90 },
                { height: 32, left: 192, top: 4, width: 90 }
            ]);
            component.options.set([...mixedOptions]);
            await waitForStable(fixture);

            const indicator = getIndicator(fixture);
            expect(indicator).not.toBeNull();
            expect(indicator?.style.transform).toBe("translate3d(192px, 4px, 0)");
            expect(indicator?.classList.contains("transition-none")).toBe(true);
        });
    });

    describe("disabled state", () => {
        let fixture: ComponentFixture<HostComponent>;
        let component: HostComponent;

        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [HostComponent]
            }).compileComponents();

            fixture = TestBed.createComponent(HostComponent);
            component = fixture.componentInstance;
            await waitForStable(fixture);
        });

        it("disables every radio when the group is disabled", () => {
            component.disabled.set(true);
            fixture.detectChanges();

            getRadios(fixture).forEach(radio => {
                expect(radio.disabled).toBe(true);
            });
        });

        it("disables only the matching option when an option is disabled", () => {
            component.options.set(mixedOptions);
            fixture.detectChanges();

            const radios = getRadios(fixture);
            expect(radios[0].disabled).toBe(false);
            expect(radios[1].disabled).toBe(false);
            expect(radios[2].disabled).toBe(true);
        });

        it("does not change the value when a disabled option is selected", () => {
            component.options.set(mixedOptions);
            fixture.detectChanges();

            selectRadio(fixture, 2);
            expect(component.value()).toBe("discover");
        });

        it("does not change the value when the group is disabled", () => {
            component.disabled.set(true);
            fixture.detectChanges();

            selectRadio(fixture, 1);
            expect(component.value()).toBe("discover");
        });

        it("exposes aria-disabled and data attributes for the group", () => {
            component.disabled.set(true);
            fixture.detectChanges();

            const host = getHostElement(fixture);
            expect(host.getAttribute("aria-disabled")).toBe("true");
            expect(host.getAttribute("data-disabled")).toBe("true");
        });

        it("applies disabled styling to the indicator when the entire group is disabled", async () => {
            component.disabled.set(true);
            await waitForStable(fixture);

            const indicator = getIndicator(fixture);
            expect(indicator?.getAttribute("data-disabled")).toBe("true");
            expect(indicator?.classList.contains("data-[disabled='true']:opacity-50")).toBe(true);
        });

        it("applies disabled styling to the indicator when selected option is individually disabled", async () => {
            component.options.set(mixedOptions);
            component.value.set("archived");
            await waitForStable(fixture);

            const indicator = getIndicator(fixture);
            expect(indicator?.getAttribute("data-disabled")).toBe("true");
            expect(indicator?.classList.contains("data-[disabled='true']:opacity-50")).toBe(true);
        });
    });

    describe("value", () => {
        let fixture: ComponentFixture<HostComponent>;
        let component: HostComponent;

        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [HostComponent]
            }).compileComponents();

            fixture = TestBed.createComponent(HostComponent);
            component = fixture.componentInstance;
            await waitForStable(fixture);
        });

        it("renders no selected option when the value is null", () => {
            component.value.set(null);
            fixture.detectChanges();

            getRadios(fixture).forEach(radio => {
                expect(radio.checked).toBe(false);
            });
        });

        it("checks the input matching the current value", () => {
            const radios = getRadios(fixture);
            expect(radios[0].checked).toBe(true);
            expect(radios[1].checked).toBe(false);
        });

        it("updates value when a radio is selected", () => {
            selectRadio(fixture, 1);
            expect(component.value()).toBe("courses");
        });

        it("emits valueChange through the model", () => {
            const componentInstance = fixture.debugElement
                .query(By.directive(SegmentedComponent))
                .componentInstance as SegmentedComponent;
            let emitted: unknown;
            const subscription = componentInstance.value.subscribe(value => {
                emitted = value;
            });
            selectRadio(fixture, 1);
            subscription.unsubscribe();

            expect(emitted).toBe("courses");
        });

        it("does not clear the value when selecting the active option again", () => {
            selectRadio(fixture, 0);
            expect(component.value()).toBe("discover");
        });

        it("supports number values and keeps them numeric", () => {
            component.options.set(numberOptions);
            component.value.set(7);
            fixture.detectChanges();

            const radios = getRadios(fixture);
            expect(radios[1].checked).toBe(true);

            selectRadio(fixture, 2);
            expect(component.value()).toBe(30);
            expect(typeof component.value()).toBe("number");
        });

        it("does not select an option when the external value matches none", () => {
            component.value.set("unmatched");
            fixture.detectChanges();

            getRadios(fixture).forEach(radio => {
                expect(radio.checked).toBe(false);
            });
            expect(component.value()).toBe("unmatched");
        });

        it("does not rewrite the value when options change and the selection disappears", () => {
            component.value.set("archived");
            component.options.set(numberOptions);
            fixture.detectChanges();

            expect(component.value()).toBe("archived");
            getRadios(fixture).forEach(radio => {
                expect(radio.checked).toBe(false);
            });
        });
    });

    describe("form-control state", () => {
        let fixture: ComponentFixture<HostComponent>;
        let component: HostComponent;

        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [HostComponent]
            }).compileComponents();

            fixture = TestBed.createComponent(HostComponent);
            component = fixture.componentInstance;
            await waitForStable(fixture);
        });

        it("does not show invalid styling before touch", () => {
            component.invalid.set(true);
            fixture.detectChanges();

            const host = getHostElement(fixture);
            expect(host.getAttribute("aria-invalid")).toBeNull();
            expect(host.getAttribute("data-invalid")).toBeNull();
        });

        it("applies invalid state when touched and invalid", () => {
            component.touched.set(true);
            component.invalid.set(true);
            fixture.detectChanges();

            const host = getHostElement(fixture);
            expect(host.getAttribute("aria-invalid")).toBe("true");
            expect(host.getAttribute("data-invalid")).toBe("true");
        });

        it("emits touch when the selection changes", () => {
            const componentInstance = fixture.debugElement
                .query(By.directive(SegmentedComponent))
                .componentInstance as SegmentedComponent;
            let touches = 0;
            componentInstance.touch.subscribe(() => {
                touches++;
            });

            selectRadio(fixture, 1);
            expect(touches).toBe(1);
        });

        it("emits touch when focus leaves a radio input", () => {
            const componentInstance = fixture.debugElement
                .query(By.directive(SegmentedComponent))
                .componentInstance as SegmentedComponent;
            let touches = 0;
            componentInstance.touch.subscribe(() => {
                touches++;
            });

            const radio = getRadios(fixture)[0];
            radio.dispatchEvent(new FocusEvent("blur"));
            fixture.detectChanges();

            expect(touches).toBe(1);
        });
    });

    describe("signal forms integration", () => {
        let fixture: ComponentFixture<SignalFormHostComponent>;
        let component: SignalFormHostComponent;

        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [SignalFormHostComponent]
            }).compileComponents();

            fixture = TestBed.createComponent(SignalFormHostComponent);
            component = fixture.componentInstance;
            await waitForStable(fixture);
        });

        it("reflects the signal form field value", () => {
            const radios = getRadios(fixture);
            expect(radios[1].checked).toBe(true);
        });

        it("updates the signal form field value on selection", () => {
            selectRadio(fixture, 0);
            expect(component.form.section().value()).toBe("discover");
        });

        it("respects the disabled signal-form state", () => {
            component.disabled.set(true);
            fixture.detectChanges();

            getRadios(fixture).forEach(radio => {
                expect(radio.disabled).toBe(true);
            });
        });
    });

    describe("accessibility", () => {
        let fixture: ComponentFixture<HostComponent>;
        let component: HostComponent;

        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [HostComponent]
            }).compileComponents();

            fixture = TestBed.createComponent(HostComponent);
            component = fixture.componentInstance;
            await waitForStable(fixture);
        });

        it("forwards aria-label to the host", () => {
            component.ariaLabel.set("Course section");
            fixture.detectChanges();

            expect(getHostElement(fixture).getAttribute("aria-label")).toBe("Course section");
        });

        it("forwards aria-labelledby to the host", () => {
            component.ariaLabelledBy.set("section-label");
            fixture.detectChanges();

            expect(getHostElement(fixture).getAttribute("aria-labelledby")).toBe("section-label");
        });

        it("reflects invalid state through aria-invalid", () => {
            component.touched.set(true);
            component.invalid.set(true);
            fixture.detectChanges();

            expect(getHostElement(fixture).getAttribute("aria-invalid")).toBe("true");
        });

        it("associates every radio with its visible label", () => {
            const radios = getRadios(fixture);
            const labels = getLabels(fixture);

            radios.forEach((radio, index) => {
                expect(radio.labels?.[0]).toBe(labels[index]);
            });
        });
    });
});

interface FormModel {
    section: string | null;
}
