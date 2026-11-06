import { Component, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { form, FormField, min, readonly, required } from "@angular/forms/signals";
import { AutoCompleteComponent } from "@nanahoshi/mona-ui/auto-complete";
import { CalendarComponent } from "@nanahoshi/mona-ui/calendar";
import { CheckBoxComponent } from "@nanahoshi/mona-ui/check-box";
import { ColorGradientComponent } from "@nanahoshi/mona-ui/color-gradient";
import { ColorPaletteComponent } from "@nanahoshi/mona-ui/color-palette";
import { ColorPickerComponent } from "@nanahoshi/mona-ui/color-picker";
import { ComboBoxComponent } from "@nanahoshi/mona-ui/combo-box";
import { DatePickerComponent } from "@nanahoshi/mona-ui/date-picker";
import { DateTimePickerComponent } from "@nanahoshi/mona-ui/datetime-picker";
import { DropdownListComponent } from "@nanahoshi/mona-ui/dropdown-list";
import { EditorComponent } from "@nanahoshi/mona-ui/editor";
import { MultiSelectComponent } from "@nanahoshi/mona-ui/multi-select";
import { NumericTextBoxComponent } from "@nanahoshi/mona-ui/numeric-text-box";
import { OtpInputComponent } from "@nanahoshi/mona-ui/otp-input";
import { RadioButtonComponent } from "@nanahoshi/mona-ui/radio-button";
import { RatingComponent } from "@nanahoshi/mona-ui/rating";
import { SegmentedComponent } from "@nanahoshi/mona-ui/segmented";
import { RangeSliderComponent, SliderComponent } from "@nanahoshi/mona-ui/slider";
import { SwitchComponent } from "@nanahoshi/mona-ui/switch";
import { TextBoxComponent } from "@nanahoshi/mona-ui/text-box";
import { TimePickerComponent } from "@nanahoshi/mona-ui/time-picker";
import { TimeSelectorComponent } from "@nanahoshi/mona-ui/time-selector";
import axe from "axe-core";
import { vi } from "vitest";
import { FieldsetComponent } from "../components/fieldset/fieldset.component";

function key(target: Element, name: string): KeyboardEvent {
    const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: name });
    target.dispatchEvent(event);
    return event;
}

function pointer(target: EventTarget, type: string, clientX = 50): void {
    target.dispatchEvent(new MouseEvent(type, { bubbles: true, button: 0, clientX, clientY: 5 }));
}

function focusOut(target: Element, relatedTarget: Element | null): void {
    target.dispatchEvent(new FocusEvent("blur", { relatedTarget }));
    target.dispatchEvent(new FocusEvent("focusout", { bubbles: true, relatedTarget }));
}

function sizeOf(element: HTMLElement): void {
    vi.spyOn(element, "getBoundingClientRect").mockReturnValue({
        bottom: 10,
        height: 10,
        left: 0,
        right: 100,
        toJSON: () => ({}),
        top: 0,
        width: 100,
        x: 0,
        y: 0
    });
}

async function settle<T>(fixture: ComponentFixture<T>): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
}

async function axeViolations(element: Element): Promise<string[]> {
    const result = await axe.run(element, {
        rules: { "color-contrast": { enabled: false }, region: { enabled: false } }
    });
    return result.violations.map(violation => violation.id);
}

const OPTIONS = [
    { label: "One", value: "a" },
    { label: "Two", value: "b" }
];

@Component({
    template: `
        <mona-check-box [formField]="form.check" label="Check" />
        <mona-radio-button [formField]="form.radio" radioValue="a" label="A" />
        <mona-radio-button [formField]="form.radio" radioValue="b" label="B" />
        <mona-switch [formField]="form.on" aria-label="On" />
        <mona-slider [formField]="form.level" aria-label="Level" />
        <mona-range-slider [formField]="form.span" />
        <mona-segmented [formField]="form.segment" [options]="options" aria-label="Segment" />
        <mona-color-gradient [formField]="form.color" />
    `,
    imports: [
        CheckBoxComponent,
        ColorGradientComponent,
        FormField,
        RadioButtonComponent,
        RangeSliderComponent,
        SegmentedComponent,
        SliderComponent,
        SwitchComponent
    ]
})
class ReadonlyHostComponent {
    readonly #model = signal({
        check: false,
        color: "#336699" as string | null,
        level: 3,
        on: false,
        radio: "a",
        segment: "a" as string | null,
        span: [1, 5] as [number, number]
    });
    public readonly form = form(this.#model, schema => {
        readonly(schema.check);
        readonly(schema.color);
        readonly(schema.level);
        readonly(schema.on);
        readonly(schema.radio);
        readonly(schema.segment);
        readonly(schema.span);
    });
    public readonly model = this.#model;
    public readonly options = OPTIONS;
}

@Component({
    template: `
        <mona-check-box [formField]="form.check" label="Check" />
        <mona-radio-button [formField]="form.radio" radioValue="a" label="A" />
        <mona-switch [formField]="form.on" aria-label="On" />
        <mona-segmented [formField]="form.segment" [options]="options" aria-label="Segment" />
        <mona-otp-input [formField]="form.code" />
        <mona-rating [formField]="form.stars" aria-label="Stars" />
        <mona-slider [formField]="form.level" aria-label="Level" />
        <mona-color-gradient [formField]="form.color" />
        <button type="button" id="after">After</button>
    `,
    imports: [
        CheckBoxComponent,
        ColorGradientComponent,
        FormField,
        OtpInputComponent,
        RadioButtonComponent,
        RatingComponent,
        SegmentedComponent,
        SliderComponent,
        SwitchComponent
    ]
})
class FormHostComponent {
    readonly #model = signal({
        check: false,
        code: "",
        color: null as string | null,
        level: 3,
        on: false,
        radio: "",
        segment: null as string | null,
        stars: 0
    });
    public readonly form = form(this.#model, schema => {
        required(schema.check);
        required(schema.code);
        min(schema.level, 5);
        required(schema.on);
        required(schema.radio);
        required(schema.segment);
        required(schema.stars);
    });
    public readonly model = this.#model;
    public readonly options = OPTIONS;
}

@Component({
    template: `
        <mona-fieldset legend="Section" [disabled]="off()">
            <mona-check-box [(checked)]="check" label="Check" />
            <mona-radio-button [(value)]="radio" radioValue="b" label="B" />
            <mona-switch [(checked)]="on" aria-label="On" />
            <mona-slider [(value)]="level" aria-label="Level" />
            <mona-range-slider [(value)]="span" />
            <mona-rating [(value)]="stars" aria-label="Stars" />
            <mona-segmented [(value)]="segment" [options]="options" aria-label="Segment" />
            <mona-color-palette [(value)]="color" [palette]="colors" aria-label="Palette" />
            <mona-color-picker [(value)]="picked" aria-label="Picker" />
            <mona-color-gradient [(value)]="gradient" />
            <mona-dropdown-list [data]="items" aria-label="List" />
            <mona-multi-select [data]="items" aria-label="Many" />
            <mona-text-box aria-label="Text" />
            <mona-otp-input aria-label="Code" />
        </mona-fieldset>
    `,
    imports: [
        CheckBoxComponent,
        ColorGradientComponent,
        ColorPaletteComponent,
        ColorPickerComponent,
        DropdownListComponent,
        FieldsetComponent,
        MultiSelectComponent,
        OtpInputComponent,
        RadioButtonComponent,
        RangeSliderComponent,
        RatingComponent,
        SegmentedComponent,
        SliderComponent,
        SwitchComponent,
        TextBoxComponent
    ]
})
class FieldsetHostComponent {
    public readonly check = signal(false);
    public readonly color = signal<string | null>(null);
    public readonly colors = ["#111111", "#222222"];
    public readonly gradient = signal<string | null | undefined>("#336699");
    public readonly items = ["One", "Two"];
    public readonly level = signal(3);
    public readonly off = signal(true);
    public readonly on = signal(false);
    public readonly options = OPTIONS;
    public readonly picked = signal<string | null>(null);
    public readonly radio = signal<unknown>("a");
    public readonly segment = signal<string | null>("a");
    public readonly span = signal<[number, number]>([1, 5]);
    public readonly stars = signal(1);
}

@Component({
    template: `
        <mona-check-box disabled indeterminate invalid readonly required touched label="Check" />
        <mona-radio-button disabled invalid readonly required touched label="Radio" />
        <mona-switch disabled invalid readonly required touched aria-label="Switch" />
        <mona-slider disabled invalid readonly showLabels showTicks touched aria-label="Slider" />
        <mona-range-slider disabled invalid readonly touched />
        <mona-rating disabled invalid readonly required touched aria-label="Rating" />
        <mona-otp-input disabled invalid readonly required touched />
        <mona-segmented disabled invalid readonly required touched [options]="options" aria-label="Segmented" />
        <mona-color-palette disabled invalid readonly required touched aria-label="Palette" />
        <mona-color-picker disabled invalid readonly required touched aria-label="Picker" />
        <mona-color-gradient disabled invalid readonly required touched />
        <mona-fieldset disabled legend="Empty" />
    `,
    imports: [
        CheckBoxComponent,
        ColorGradientComponent,
        ColorPaletteComponent,
        ColorPickerComponent,
        FieldsetComponent,
        OtpInputComponent,
        RadioButtonComponent,
        RangeSliderComponent,
        RatingComponent,
        SegmentedComponent,
        SliderComponent,
        SwitchComponent
    ]
})
class BareAttributeHostComponent {
    public readonly options = OPTIONS;
}

@Component({
    template: `
        <mona-color-picker [formField]="form.color" view="palette" [palette]="colors" aria-label="Picker" />
        <mona-color-palette [formField]="form.tile" [palette]="colors" aria-label="Palette" />
        <button type="button" id="after">After</button>
    `,
    imports: [ColorPaletteComponent, ColorPickerComponent, FormField]
})
class ColorFormHostComponent {
    readonly #model = signal({ color: null as string | null, tile: null as string | null });
    public readonly colors = ["#111111", "#222222"];
    public readonly form = form(this.#model, schema => {
        required(schema.color);
        required(schema.tile);
    });
    public readonly model = this.#model;
}

@Component({
    template: `
        <mona-fieldset legend="Section" disabled>
            <mona-auto-complete [data]="items" aria-label="Auto" />
            <mona-calendar />
            <mona-combo-box [data]="items" aria-label="Combo" />
            <mona-date-picker aria-label="Date" />
            <mona-datetime-picker aria-label="Date and time" />
            <mona-editor aria-label="Editor" />
            <mona-numeric-text-box aria-label="Number" />
            <mona-time-picker aria-label="Time" />
            <mona-time-selector />
        </mona-fieldset>
    `,
    imports: [
        AutoCompleteComponent,
        CalendarComponent,
        ComboBoxComponent,
        DatePickerComponent,
        DateTimePickerComponent,
        EditorComponent,
        FieldsetComponent,
        NumericTextBoxComponent,
        TimePickerComponent,
        TimeSelectorComponent
    ]
})
class FieldsetEarlierControlsHostComponent {
    public readonly items = ["One", "Two"];
}

@Component({
    template: `
        <mona-fieldset legend="Outer" [disabled]="outer()">
            <mona-fieldset legend="Inner" [disabled]="inner()">
                <mona-switch aria-label="Nested" />
            </mona-fieldset>
        </mona-fieldset>
    `,
    imports: [FieldsetComponent, SwitchComponent]
})
class NestedFieldsetHostComponent {
    public readonly inner = signal(false);
    public readonly outer = signal(true);
}

describe("form control contract", () => {
    describe("read-only form fields", () => {
        let fixture: ComponentFixture<ReadonlyHostComponent>;
        let host: ReadonlyHostComponent;
        let root: HTMLElement;

        beforeEach(async () => {
            fixture = TestBed.createComponent(ReadonlyHostComponent);
            host = fixture.componentInstance;
            root = fixture.nativeElement;
            await settle(fixture);
        });

        it("keeps a check box's value and native state, and reports it", async () => {
            const input = root.querySelector<HTMLInputElement>("mona-check-box input")!;
            input.click();
            await settle(fixture);
            expect(host.model().check).toBe(false);
            expect(input.checked).toBe(false);
            expect(input.getAttribute("aria-readonly")).toBe("true");
            expect(root.querySelector("mona-check-box")!.getAttribute("data-readonly")).toBe("true");
        });

        it("keeps the selected radio", async () => {
            // jsdom doesn't restore the previously checked radio after a canceled click, as browsers do.
            const second = root.querySelectorAll<HTMLInputElement>("mona-radio-button input")[1];
            second.click();
            await settle(fixture);
            expect(host.model().radio).toBe("a");
            expect(second.checked).toBe(false);
            expect(root.querySelector("mona-radio-button")!.getAttribute("data-readonly")).toBe("true");
        });

        it("keeps a switch off under click, Space and Enter, and reports it", async () => {
            const element = root.querySelector<HTMLElement>("mona-switch")!;
            element.click();
            key(element, " ");
            key(element, "Enter");
            await settle(fixture);
            expect(host.model().on).toBe(false);
            expect(element.getAttribute("aria-readonly")).toBe("true");
            expect(element.getAttribute("tabindex")).toBe("0");
        });

        it("keeps a slider's value under keys, track clicks and drags", async () => {
            const element = root.querySelector<HTMLElement>("mona-slider")!;
            const handle = element.querySelector<HTMLElement>("[role=slider]")!;
            sizeOf(element);
            key(handle, "ArrowRight");
            key(handle, "End");
            pointer(element, "click", 90);
            pointer(handle, "pointerdown");
            pointer(document, "pointermove", 90);
            pointer(document, "pointerup");
            await settle(fixture);
            expect(host.model().level).toBe(3);
            expect(handle.getAttribute("aria-readonly")).toBe("true");
            expect(handle.getAttribute("tabindex")).toBe("0");
        });

        it("keeps a range slider's value and marks both handles", async () => {
            const element = root.querySelector<HTMLElement>("mona-range-slider")!;
            const [start, end] = Array.from(element.querySelectorAll<HTMLElement>("[role=slider]"));
            sizeOf(element);
            key(start, "ArrowRight");
            key(end, "ArrowRight");
            pointer(element, "click", 90);
            pointer(end, "pointerdown");
            pointer(document, "pointermove", 90);
            pointer(document, "pointerup");
            await settle(fixture);
            expect(host.model().span).toEqual([1, 5]);
            expect(start.getAttribute("aria-readonly")).toBe("true");
            expect(end.getAttribute("aria-readonly")).toBe("true");
        });

        it("keeps a segmented value when a change arrives without a click", async () => {
            const second = root.querySelectorAll<HTMLInputElement>("mona-segmented input")[1];
            second.dispatchEvent(new Event("change", { bubbles: true }));
            await settle(fixture);
            expect(host.model().segment).toBe("a");
        });

        it("keeps a segmented value and reports it on the group", async () => {
            const element = root.querySelector<HTMLElement>("mona-segmented")!;
            const second = element.querySelectorAll<HTMLInputElement>("input")[1];
            second.click();
            await settle(fixture);
            expect(host.model().segment).toBe("a");
            expect(second.checked).toBe(false);
            expect(element.getAttribute("aria-readonly")).toBe("true");
        });

        it("keeps a color gradient's value and leaves its controls focusable", async () => {
            const element = root.querySelector<HTMLElement>("mona-color-gradient")!;
            const handle = element.querySelector<HTMLElement>("[role=slider]")!;
            key(handle, "ArrowRight");
            const sliders = element.querySelectorAll<HTMLElement>("mona-slider [role=slider]");
            key(sliders[0], "ArrowRight");
            const clear = element.querySelector<HTMLButtonElement>("button[aria-label]")!;
            clear.click();
            const apply = Array.from(element.querySelectorAll("button")).find(b => b.textContent?.includes("Apply"));
            apply?.click();
            await settle(fixture);
            expect(host.model().color).toBe("#336699");
            expect(handle.getAttribute("tabindex")).toBe("0");
            expect(sliders[0].getAttribute("aria-readonly")).toBe("true");
            expect(element.querySelector<HTMLInputElement>("mona-text-box input")!.readOnly).toBe(true);
        });

        it("passes axe", async () => {
            expect(await axeViolations(root)).toEqual([]);
        });
    });

    describe("what a form passes to the control", () => {
        let fixture: ComponentFixture<FormHostComponent>;
        let host: FormHostComponent;
        let root: HTMLElement;

        beforeEach(async () => {
            fixture = TestBed.createComponent(FormHostComponent);
            host = fixture.componentInstance;
            root = fixture.nativeElement;
            await settle(fixture);
        });

        it("reaches a radio as native required", () => {
            expect(root.querySelector<HTMLInputElement>("mona-radio-button input")!.required).toBe(true);
        });

        it("reaches a segmented group as aria-required", () => {
            expect(root.querySelector("mona-segmented")!.getAttribute("aria-required")).toBe("true");
        });

        it("gives the check box and the OTP input a field name", () => {
            expect(root.querySelector<HTMLInputElement>("mona-check-box input")!.name).toContain("check");
            expect(root.querySelector<HTMLInputElement>("mona-otp-input input")!.name).toContain("code");
        });

        it("moves focus into each control through focusBoundControl", () => {
            const cases: [() => void, string][] = [
                [() => host.form.check().focusBoundControl(), "mona-check-box input"],
                [() => host.form.radio().focusBoundControl(), "mona-radio-button input"],
                [() => host.form.on().focusBoundControl(), "mona-switch"],
                [() => host.form.segment().focusBoundControl(), "mona-segmented input"],
                [() => host.form.code().focusBoundControl(), "mona-otp-input input"],
                [() => host.form.stars().focusBoundControl(), "mona-rating [role=slider]"],
                [() => host.form.level().focusBoundControl(), "mona-slider [role=slider]"],
                [() => host.form.color().focusBoundControl(), "mona-color-gradient [role=slider]"]
            ];
            document.body.appendChild(root);
            for (const [focus, selector] of cases) {
                (document.activeElement as HTMLElement | null)?.blur();
                focus();
                expect(document.activeElement, selector).toBe(root.querySelector(selector));
            }
            root.remove();
        });

        it("doesn't show a slider's rule as invalid until it's touched, and bounds it by the rule", async () => {
            const handle = root.querySelector<HTMLElement>("mona-slider [role=slider]")!;
            expect(handle.getAttribute("aria-invalid")).toBeNull();
            expect(handle.getAttribute("aria-valuemin")).toBe("5");
            handle.dispatchEvent(new FocusEvent("blur"));
            await settle(fixture);
            expect(host.form.level().touched()).toBe(true);
        });

        it("treats an unrated rating as empty when required, once touched", async () => {
            const control = root.querySelector<HTMLElement>("mona-rating [role=slider]")!;
            expect(control.getAttribute("aria-invalid")).toBeNull();
            control.dispatchEvent(new FocusEvent("blur"));
            await settle(fixture);
            expect(control.getAttribute("aria-invalid")).toBe("true");
            host.model.update(model => ({ ...model, stars: 2 }));
            await settle(fixture);
            expect(control.getAttribute("aria-invalid")).toBeNull();
        });

        it("doesn't mark the OTP input touched or invalid while typing", async () => {
            const input = root.querySelector<HTMLInputElement>("mona-otp-input input")!;
            input.value = "1";
            input.dispatchEvent(new Event("input", { bubbles: true }));
            await settle(fixture);
            expect(host.form.code().touched()).toBe(false);
            expect(input.getAttribute("aria-invalid")).toBeNull();
            input.dispatchEvent(new FocusEvent("blur"));
            await settle(fixture);
            expect(host.form.code().touched()).toBe(true);
            expect(input.getAttribute("aria-invalid")).toBe("true");
        });

        it("doesn't mark a slider or a rating touched by keys, only on leaving", async () => {
            const slider = root.querySelector<HTMLElement>("mona-slider [role=slider]")!;
            key(slider, "ArrowRight");
            const rating = root.querySelector<HTMLElement>("mona-rating [role=slider]")!;
            key(rating, "ArrowRight");
            await settle(fixture);
            expect(host.form.level().touched()).toBe(false);
            expect(host.form.stars().touched()).toBe(false);
            rating.dispatchEvent(new FocusEvent("blur"));
            await settle(fixture);
            expect(host.form.stars().touched()).toBe(true);
        });

        it("marks a slider touched by a track click, through focus on the handle", async () => {
            const element = root.querySelector<HTMLElement>("mona-slider")!;
            document.body.appendChild(root);
            sizeOf(element);
            pointer(element, "click", 90);
            await settle(fixture);
            expect(document.activeElement).toBe(element.querySelector("[role=slider]"));
            root.remove();
        });

        it("doesn't mark a segmented group touched while focus stays inside it", async () => {
            const [first, second] = Array.from(root.querySelectorAll<HTMLElement>("mona-segmented input"));
            focusOut(first, second);
            await settle(fixture);
            expect(host.form.segment().touched()).toBe(false);
            focusOut(second, root.querySelector("#after"));
            await settle(fixture);
            expect(host.form.segment().touched()).toBe(true);
        });

        it("doesn't mark a color gradient touched while focus stays inside it", async () => {
            const element = root.querySelector<HTMLElement>("mona-color-gradient")!;
            const handle = element.querySelector<HTMLElement>("[role=slider]")!;
            const hex = element.querySelector<HTMLElement>("mona-text-box input");
            focusOut(handle, hex);
            await settle(fixture);
            expect(host.form.color().touched()).toBe(false);
            focusOut(handle, root.querySelector("#after"));
            await settle(fixture);
            expect(host.form.color().touched()).toBe(true);
        });

        it("still marks one-shot toggles touched when they change", async () => {
            root.querySelector<HTMLInputElement>("mona-check-box input")!.click();
            root.querySelector<HTMLElement>("mona-switch")!.click();
            await settle(fixture);
            expect(host.form.check().touched()).toBe(true);
            expect(host.form.on().touched()).toBe(true);
        });

        it("passes axe once touched and invalid", async () => {
            for (const selector of ["mona-otp-input input", "mona-rating [role=slider]", "mona-switch"]) {
                root.querySelector(selector)!.dispatchEvent(new FocusEvent("blur"));
            }
            await settle(fixture);
            expect(await axeViolations(root)).toEqual([]);
        });
    });

    describe("color controls in a form", () => {
        let fixture: ComponentFixture<ColorFormHostComponent>;
        let host: ColorFormHostComponent;
        let root: HTMLElement;

        beforeEach(async () => {
            fixture = TestBed.createComponent(ColorFormHostComponent);
            host = fixture.componentInstance;
            root = fixture.nativeElement;
            document.body.appendChild(root);
            await settle(fixture);
        });

        afterEach(() => root.remove());

        it("doesn't mark a picker touched when focus moves into its popup, only when the popup closes", async () => {
            const picker = root.querySelector<HTMLElement>("mona-color-picker")!;
            picker.click();
            await settle(fixture);
            expect(picker.getAttribute("aria-expanded")).toBe("true");
            picker.dispatchEvent(new FocusEvent("blur"));
            await settle(fixture);
            expect(host.form.color().touched()).toBe(false);
            expect(picker.getAttribute("aria-invalid")).toBeNull();
            const popup = document.querySelector<HTMLElement>("[data-palette-container]")!;
            key(popup, "Escape");
            await settle(fixture);
            expect(host.form.color().touched()).toBe(true);
        });

        it("marks a closed picker touched on blur", async () => {
            const picker = root.querySelector<HTMLElement>("mona-color-picker")!;
            picker.dispatchEvent(new FocusEvent("blur"));
            await settle(fixture);
            expect(host.form.color().touched()).toBe(true);
        });

        it("doesn't mark a palette touched while focus moves between its tiles", async () => {
            const [first, second] = Array.from(
                root.querySelectorAll<HTMLElement>("mona-color-palette [data-color-index]")
            );
            focusOut(first, second);
            await settle(fixture);
            expect(host.form.tile().touched()).toBe(false);
            focusOut(second, root.querySelector("#after"));
            await settle(fixture);
            expect(host.form.tile().touched()).toBe(true);
        });

        it("moves focus to the palette's active tile through focusBoundControl", () => {
            host.form.tile().focusBoundControl();
            expect(document.activeElement).toBe(root.querySelector("mona-color-palette [data-color-index='0']"));
        });
    });

    describe("bare boolean attributes", () => {
        it("compile and read as true", async () => {
            const fixture = TestBed.createComponent(BareAttributeHostComponent);
            const root: HTMLElement = fixture.nativeElement;
            await settle(fixture);
            expect(root.querySelector("mona-check-box input")!.getAttribute("aria-readonly")).toBe("true");
            expect(root.querySelector<HTMLInputElement>("mona-radio-button input")!.required).toBe(true);
            expect(root.querySelector("mona-switch")!.getAttribute("aria-disabled")).toBe("true");
            expect(root.querySelector("mona-slider [role=slider]")!.getAttribute("aria-readonly")).toBe("true");
            expect(root.querySelector("mona-segmented")!.getAttribute("aria-required")).toBe("true");
        });
    });

    describe("mona-fieldset disabled", () => {
        let fixture: ComponentFixture<FieldsetHostComponent>;
        let host: FieldsetHostComponent;
        let root: HTMLElement;

        beforeEach(async () => {
            fixture = TestBed.createComponent(FieldsetHostComponent);
            host = fixture.componentInstance;
            root = fixture.nativeElement;
            await settle(fixture);
        });

        it("takes a switch out of the Tab order and ignores its keys", async () => {
            const element = root.querySelector<HTMLElement>("mona-switch")!;
            expect(element.getAttribute("tabindex")).toBe("-1");
            expect(element.getAttribute("aria-disabled")).toBe("true");
            key(element, " ");
            element.click();
            await settle(fixture);
            expect(host.on()).toBe(false);
        });

        it("takes both sliders out of the Tab order and ignores their keys", async () => {
            const handles = root.querySelectorAll<HTMLElement>(
                "mona-slider [role=slider], mona-range-slider [role=slider]"
            );
            for (const handle of Array.from(handles).slice(0, 3)) {
                expect(handle.getAttribute("tabindex")).toBe("-1");
                expect(handle.getAttribute("aria-disabled")).toBe("true");
                key(handle, "ArrowRight");
            }
            await settle(fixture);
            expect(host.level()).toBe(3);
            expect(host.span()).toEqual([1, 5]);
        });

        it("takes a rating out of the Tab order and ignores its keys", async () => {
            const control = root.querySelector<HTMLElement>("mona-rating [role=slider]")!;
            expect(control.getAttribute("tabindex")).toBe("-1");
            expect(control.getAttribute("aria-disabled")).toBe("true");
            key(control, "ArrowRight");
            await settle(fixture);
            expect(host.stars()).toBe(1);
        });

        it("reaches the color controls", async () => {
            const tile = root.querySelector<HTMLElement>("mona-color-palette [data-color-index]")!;
            expect(tile.getAttribute("tabindex")).toBe("-1");
            tile.click();
            const picker = root.querySelector<HTMLElement>("mona-color-picker")!;
            expect(picker.getAttribute("tabindex")).toBe("-1");
            expect(picker.getAttribute("aria-disabled")).toBe("true");
            const gradient = root.querySelector<HTMLElement>("mona-color-gradient")!;
            expect(gradient.querySelector("[role=slider]")!.getAttribute("tabindex")).toBe("-1");
            key(gradient.querySelector("[role=slider]")!, "ArrowRight");
            await settle(fixture);
            expect(host.color()).toBeNull();
            expect(host.gradient()).toBe("#336699");
        });

        it("reaches the dropdown controls", () => {
            for (const selector of ["mona-dropdown-list", "mona-multi-select"]) {
                const element = root.querySelector<HTMLElement>(selector)!;
                expect(element.getAttribute("aria-disabled"), selector).toBe("true");
                expect(element.getAttribute("tabindex"), selector).not.toBe("0");
            }
        });

        it("draws native controls as disabled too", () => {
            for (const selector of [
                "mona-check-box",
                "mona-radio-button",
                "mona-segmented",
                "mona-text-box",
                "mona-otp-input"
            ]) {
                expect(root.querySelector(selector)!.getAttribute("data-disabled"), selector).toBe("true");
            }
        });

        it("gives controls back when the fieldset is enabled", async () => {
            host.off.set(false);
            await settle(fixture);
            const element = root.querySelector<HTMLElement>("mona-switch")!;
            expect(element.getAttribute("tabindex")).toBe("0");
            key(element, " ");
            await settle(fixture);
            expect(host.on()).toBe(true);
        });

        it("passes axe", async () => {
            expect(await axeViolations(root)).toEqual([]);
        });
    });

    describe("mona-fieldset disabled around the other form controls", () => {
        let fixture: ComponentFixture<FieldsetEarlierControlsHostComponent>;
        let root: HTMLElement;

        beforeEach(async () => {
            fixture = TestBed.createComponent(FieldsetEarlierControlsHostComponent);
            root = fixture.nativeElement;
            await settle(fixture);
        });

        it("disables their inputs through the binding, not only the native fieldset", () => {
            for (const selector of [
                "mona-auto-complete",
                "mona-combo-box",
                "mona-date-picker",
                "mona-datetime-picker",
                "mona-numeric-text-box",
                "mona-time-picker"
            ]) {
                expect(root.querySelector<HTMLInputElement>(selector + " input")!.disabled, selector).toBe(true);
            }
        });

        it("disables the calendar, the time selector and the editor", async () => {
            expect(root.querySelector("mona-time-selector")!.getAttribute("aria-disabled")).toBe("true");
            expect(root.querySelector("mona-editor")!.getAttribute("data-disabled")).toBe("true");
            const days = root.querySelectorAll(
                "mona-calendar [role=gridcell] [tabindex='0'], mona-calendar [role=gridcell][tabindex='0']"
            );
            expect(days.length).toBe(0);
        });
    });

    describe("nested mona-fieldset", () => {
        it("disables a control when either fieldset is disabled", async () => {
            const fixture = TestBed.createComponent(NestedFieldsetHostComponent);
            const root: HTMLElement = fixture.nativeElement;
            await settle(fixture);
            const element = root.querySelector("mona-switch")!;
            expect(element.getAttribute("aria-disabled")).toBe("true");
            fixture.componentInstance.outer.set(false);
            await settle(fixture);
            expect(element.getAttribute("aria-disabled")).toBeNull();
            fixture.componentInstance.inner.set(true);
            await settle(fixture);
            expect(element.getAttribute("aria-disabled")).toBe("true");
        });
    });
});
