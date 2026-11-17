import { Component } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { AutoCompleteComponent } from "@nanahoshi/mona-ui/auto-complete";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { ButtonGroupComponent } from "@nanahoshi/mona-ui/button-group";
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
import { DecimalTextBoxComponent, NumericTextBoxComponent } from "@nanahoshi/mona-ui/numeric-text-box";
import { OtpInputComponent } from "@nanahoshi/mona-ui/otp-input";
import { RadioButtonComponent, RadioGroupComponent } from "@nanahoshi/mona-ui/radio-button";
import { RatingComponent } from "@nanahoshi/mona-ui/rating";
import { SegmentedComponent } from "@nanahoshi/mona-ui/segmented";
import { RangeSliderComponent, SliderComponent } from "@nanahoshi/mona-ui/slider";
import { SwitchComponent } from "@nanahoshi/mona-ui/switch";
import { TextAreaDirective } from "@nanahoshi/mona-ui/text-area";
import { TextBoxComponent, TextBoxDirective } from "@nanahoshi/mona-ui/text-box";
import { TimePickerComponent } from "@nanahoshi/mona-ui/time-picker";
import axe from "axe-core";
import { FormFieldComponent } from "../components/form-field/form-field.component";

async function settle<T>(fixture: ComponentFixture<T>): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
}

function ids(element: Element, attribute: string): string[] {
    return (element.getAttribute(attribute) ?? "").split(/\s+/).filter(id => id !== "");
}

const OPTIONS = [
    { label: "Small", value: "s" },
    { label: "Large", value: "l" }
];

/**
 * Each control in the host, by its form field's label, with the elements that carry its role. A range slider's group
 * and both handles are named by the label; only the handles are described.
 */
interface ControlCase {
    readonly caption: string;
    readonly named?: string;
    readonly role: string;
}

const CONTROLS: readonly ControlCase[] = [
    { caption: "Name", role: "mona-text-box input" },
    { caption: "Amount", role: "mona-numeric-text-box input" },
    { caption: "Price", role: "mona-decimal-text-box input" },
    { caption: "Birthday", role: "mona-date-picker input" },
    { caption: "Alarm", role: "mona-time-picker input" },
    { caption: "Meeting", role: "mona-datetime-picker input" },
    { caption: "Fruit", role: "mona-dropdown-list" },
    { caption: "Vegetable", role: "mona-combo-box input" },
    { caption: "Search", role: "mona-auto-complete input" },
    { caption: "Toppings", role: "mona-multi-select" },
    { caption: "Code", role: "mona-otp-input input" },
    { caption: "Wi-Fi", role: "mona-switch" },
    { caption: "Volume", role: "mona-slider [role=slider]" },
    {
        caption: "Budget",
        named: "mona-range-slider, mona-range-slider [role=slider]",
        role: "mona-range-slider [role=slider]"
    },
    { caption: "Stars", role: "mona-rating [role=slider]" },
    { caption: "Size", role: "mona-segmented" },
    { caption: "Season", role: "mona-radio-group" },
    { caption: "Swatch", role: "mona-color-palette" },
    { caption: "Color", role: "mona-color-picker" },
    { caption: "Shade", role: "mona-color-gradient" },
    { caption: "Align", role: "mona-button-group" },
    { caption: "Notes", role: "mona-editor [role=textbox]" },
    { caption: "Bio", role: "textarea" },
    { caption: "City", role: "input#city" },
    { caption: "Country", role: "select" }
];

@Component({
    template: `
        <mona-form-field label="Name" hint="Hint for Name"><mona-text-box /></mona-form-field>
        <mona-form-field label="Amount" hint="Hint for Amount"><mona-numeric-text-box /></mona-form-field>
        <mona-form-field label="Price" hint="Hint for Price"><mona-decimal-text-box /></mona-form-field>
        <mona-form-field label="Birthday" hint="Hint for Birthday"><mona-date-picker /></mona-form-field>
        <mona-form-field label="Alarm" hint="Hint for Alarm"><mona-time-picker /></mona-form-field>
        <mona-form-field label="Meeting" hint="Hint for Meeting"><mona-datetime-picker /></mona-form-field>
        <mona-form-field label="Fruit" hint="Hint for Fruit"><mona-dropdown-list [data]="fruits" /></mona-form-field>
        <mona-form-field label="Vegetable" hint="Hint for Vegetable">
            <mona-combo-box [data]="fruits" />
        </mona-form-field>
        <mona-form-field label="Search" hint="Hint for Search"><mona-auto-complete [data]="fruits" /></mona-form-field>
        <mona-form-field label="Toppings" hint="Hint for Toppings"><mona-multi-select [data]="fruits" /></mona-form-field>
        <mona-form-field label="Code" hint="Hint for Code"><mona-otp-input /></mona-form-field>
        <mona-form-field label="Wi-Fi" hint="Hint for Wi-Fi"><mona-switch /></mona-form-field>
        <mona-form-field label="Volume" hint="Hint for Volume"><mona-slider /></mona-form-field>
        <mona-form-field label="Budget" hint="Hint for Budget"><mona-range-slider /></mona-form-field>
        <mona-form-field label="Stars" hint="Hint for Stars"><mona-rating /></mona-form-field>
        <mona-form-field label="Size" hint="Hint for Size"><mona-segmented [options]="options" /></mona-form-field>
        <mona-form-field label="Season" hint="Hint for Season">
            <mona-radio-group>
                <mona-radio-button label="Autumn" radioValue="autumn" />
                <mona-radio-button label="Winter" radioValue="winter" />
            </mona-radio-group>
        </mona-form-field>
        <mona-form-field label="Swatch" hint="Hint for Swatch"><mona-color-palette /></mona-form-field>
        <mona-form-field label="Color" hint="Hint for Color"><mona-color-picker /></mona-form-field>
        <mona-form-field label="Shade" hint="Hint for Shade"><mona-color-gradient /></mona-form-field>
        <mona-form-field label="Align" hint="Hint for Align">
            <mona-button-group>
                <button monaButton>Left</button>
                <button monaButton>Right</button>
            </mona-button-group>
        </mona-form-field>
        <mona-form-field label="Notes" hint="Hint for Notes"><mona-editor /></mona-form-field>
        <mona-form-field label="Bio" hint="Hint for Bio"><textarea monaTextArea></textarea></mona-form-field>
        <mona-form-field label="City" hint="Hint for City"><input id="city" monaTextBox /></mona-form-field>
        <mona-form-field label="Country" hint="Hint for Country">
            <select>
                <option>Japan</option>
                <option>Poland</option>
            </select>
        </mona-form-field>
        <mona-form-field label="Terms" hint="Hint for Terms"><mona-check-box label="I agree" /></mona-form-field>
    `,
    imports: [
        AutoCompleteComponent,
        ButtonDirective,
        ButtonGroupComponent,
        CheckBoxComponent,
        ColorGradientComponent,
        ColorPaletteComponent,
        ColorPickerComponent,
        ComboBoxComponent,
        DatePickerComponent,
        DateTimePickerComponent,
        DecimalTextBoxComponent,
        DropdownListComponent,
        EditorComponent,
        FormFieldComponent,
        MultiSelectComponent,
        NumericTextBoxComponent,
        OtpInputComponent,
        RadioButtonComponent,
        RadioGroupComponent,
        RangeSliderComponent,
        RatingComponent,
        SegmentedComponent,
        SliderComponent,
        SwitchComponent,
        TextAreaDirective,
        TextBoxComponent,
        TextBoxDirective,
        TimePickerComponent
    ]
})
class EveryControlHostComponent {
    public readonly fruits = ["Apple", "Pear"];
    public readonly options = OPTIONS;
}

describe("the form field contract", () => {
    let fixture: ComponentFixture<EveryControlHostComponent>;
    let root: HTMLElement;

    beforeEach(async () => {
        fixture = TestBed.createComponent(EveryControlHostComponent);
        root = fixture.nativeElement;
        document.body.appendChild(root);
        await settle(fixture);
    });

    afterEach(() => {
        root.remove();
    });

    function fieldOf(caption: string): HTMLElement {
        const field = Array.from(root.querySelectorAll<HTMLElement>("mona-form-field")).find(
            candidate => candidate.querySelector("label")?.textContent?.trim() === caption
        );
        expect(field, caption).toBeDefined();
        return field!;
    }

    it.each(CONTROLS)("names and describes $caption", ({ caption, role }) => {
        const field = fieldOf(caption);
        const captionId = field.querySelector("label")!.id;
        const hintId = Array.from(field.querySelectorAll<HTMLElement>("[id]")).find(
            element => element.textContent?.trim() === `Hint for ${caption}`
        )!.id;
        const elements = Array.from(field.querySelectorAll(role));
        expect(elements.length, role).toBeGreaterThan(0);
        for (const element of elements) {
            expect(ids(element, "aria-labelledby"), `${role} name`).toContain(captionId);
            expect(ids(element, "aria-describedby"), `${role} description`).toContain(hintId);
        }
    });

    it.each(CONTROLS)("keeps $caption's label and hint off the parts inside it", ({ caption, named, role }) => {
        const field = fieldOf(caption);
        const captionId = field.querySelector("label")!.id;
        const labelled = Array.from(field.querySelectorAll("[aria-labelledby]")).filter(element =>
            ids(element, "aria-labelledby").includes(captionId)
        );
        expect(labelled).toEqual(Array.from(field.querySelectorAll(named ?? role)));
        const described = Array.from(field.querySelectorAll("[aria-describedby]")).filter(
            element => ids(element, "aria-describedby").length > 0 && element.closest("mona-form-field") === field
        );
        expect(described.filter(element => !element.matches(role))).toEqual([]);
    });

    it.each(CONTROLS)("moves focus into $caption from its label", async ({ caption }) => {
        const field = fieldOf(caption);
        field.querySelector("label")!.click();
        // The editor focuses its content on the next frame.
        await new Promise(resolve => setTimeout(resolve, 50));
        expect(field.contains(document.activeElement), caption).toBe(true);
        expect(field.querySelector("label")!.contains(document.activeElement)).toBe(false);
    });

    it("describes a check box and leaves its own label as its name", () => {
        const field = fieldOf("Terms");
        const input = field.querySelector("mona-check-box input")!;
        expect(ids(input, "aria-labelledby")).not.toContain(field.querySelector("label")!.id);
        expect(input.getAttribute("aria-describedby")).toBeTruthy();
    });

    it("has no accessibility violations", async () => {
        const result = await axe.run(
            { include: [root] },
            { rules: { "color-contrast": { enabled: false }, region: { enabled: false } } }
        );
        expect(result.violations.map(violation => `${violation.id}: ${violation.nodes[0]?.html}`)).toEqual([]);
    });
});
