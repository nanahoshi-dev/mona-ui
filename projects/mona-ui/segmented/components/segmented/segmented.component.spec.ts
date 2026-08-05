import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { disabled as fieldDisabled, form, FormField } from "@angular/forms/signals";
import { By } from "@angular/platform-browser";
import { beforeEach, describe, expect, it } from "vitest";
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
    public readonly ariaLabel = signal<string | null>(null);
    public readonly ariaLabelledBy = signal<string | null>(null);
    public readonly disabled = signal(false);
    public readonly invalid = signal(false);
    public readonly options = signal<readonly SegmentedOption[]>(stringOptions);
    public readonly rounded = signal<"none" | "small" | "medium" | "large" | "full">("large");
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
        });

        it("defaults to the large roundness preset", () => {
            expect(getHostElement(fixture).classList.contains("rounded-lg")).toBe(true);
            getLabels(fixture).forEach(label => {
                expect(label.classList.contains("rounded-md")).toBe(true);
            });
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
