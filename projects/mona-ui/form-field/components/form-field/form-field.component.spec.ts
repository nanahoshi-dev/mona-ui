import { Component, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { email, form, FormField, minDate, minLength, required, validate } from "@angular/forms/signals";
import { CheckBoxComponent } from "@nanahoshi/mona-ui/check-box";
import { ColorGradientComponent } from "@nanahoshi/mona-ui/color-gradient";
import { DatePickerComponent } from "@nanahoshi/mona-ui/date-picker";
import { DropdownListComponent } from "@nanahoshi/mona-ui/dropdown-list";
import { RadioButtonComponent, RadioGroupComponent } from "@nanahoshi/mona-ui/radio-button";
import { SwitchComponent } from "@nanahoshi/mona-ui/switch";
import { TextAreaDirective } from "@nanahoshi/mona-ui/text-area";
import { TextBoxComponent, TextBoxDirective } from "@nanahoshi/mona-ui/text-box";
import axe from "axe-core";
import { FormFieldErrorTemplateDirective } from "../../directives/form-field-error-template.directive";
import { FormFieldHintTemplateDirective } from "../../directives/form-field-hint-template.directive";
import { FormFieldLabelTemplateDirective } from "../../directives/form-field-label-template.directive";
import type { FormFieldOrientation } from "../../models/FormFieldOrientation";
import { FormFieldComponent } from "./form-field.component";

async function settle<T>(fixture: ComponentFixture<T>): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
}

async function axeViolations(element: Element): Promise<string[]> {
    const result = await axe.run(
        { include: [element] },
        { rules: { "color-contrast": { enabled: false }, region: { enabled: false } } }
    );
    return result.violations.map(violation => violation.id);
}

function ids(element: Element, attribute: string): string[] {
    return (element.getAttribute(attribute) ?? "").split(/\s+/).filter(id => id !== "");
}

/** The text of each element the attribute points at, without hidden parts, joined with " | ". */
function textOf(element: Element, attribute: string): string {
    return ids(element, attribute)
        .map(id => {
            const target = element.ownerDocument.getElementById(id)?.cloneNode(true) as Element | undefined;
            target?.querySelectorAll("[aria-hidden=true]").forEach(hidden => hidden.remove());
            return target?.textContent?.replace(/\s+/g, " ").trim() ?? "";
        })
        .join(" | ");
}

/** The name an aria-labelledby gives: the label's visible pieces, which are flex items, joined with spaces. */
function nameOf(element: Element): string {
    return ids(element, "aria-labelledby")
        .map(id => {
            const target = element.ownerDocument.getElementById(id);
            if (!target) {
                return "";
            }
            const walker = element.ownerDocument.createTreeWalker(target, NodeFilter.SHOW_TEXT);
            const parts: string[] = [];
            for (let node = walker.nextNode(); node; node = walker.nextNode()) {
                if (!node.parentElement?.closest("[aria-hidden=true]") && node.textContent!.trim()) {
                    parts.push(node.textContent!.trim());
                }
            }
            return parts.join(" ");
        })
        .join(" | ");
}

@Component({
    template: `
        <mona-form-field
            label="Email"
            hint="We never share it."
            [error]="serverError()"
            [optional]="optional()"
            [orientation]="orientation()"
            [showRequiredMarker]="showRequiredMarker()">
            <mona-text-box [formField]="profile.email" />
        </mona-form-field>
    `,
    imports: [FormField, FormFieldComponent, TextBoxComponent]
})
class SignalFormHostComponent {
    public readonly model = signal({ email: "" });
    public readonly optional = signal(false);
    public readonly orientation = signal<FormFieldOrientation>("vertical");
    public readonly profile = form(this.model, path => {
        required(path.email);
        email(path.email);
        minLength(path.email, 5);
    });
    public readonly serverError = signal("");
    public readonly showRequiredMarker = signal(true);
}

@Component({
    template: `
        <mona-form-field label="Start" hint="The first day.">
            <mona-date-picker [formField]="trip.start" />
        </mona-form-field>
        <mona-form-field label="Code">
            <mona-text-box [formField]="trip.code" />
        </mona-form-field>
    `,
    imports: [DatePickerComponent, FormField, FormFieldComponent, TextBoxComponent]
})
class ValidatorMessagesHostComponent {
    public readonly model = signal({ code: "x", start: new Date(2026, 0, 1) as Date | null });
    public readonly trip = form(this.model, path => {
        minDate(path.start, new Date(2026, 10, 17));
        validate(path.code, () => ({ kind: "taken", message: "That code is taken." }));
    });
}

@Component({
    template: `
        <mona-form-field [hint]="hint()" [label]="label()">
            <textarea monaTextArea [formField]="note.text" aria-describedby="counter"></textarea>
        </mona-form-field>
        <span id="counter">0 / 200</span>
        <mona-form-field label="City" hint="Where you live.">
            <input monaTextBox aria-label="Town" />
        </mona-form-field>
    `,
    imports: [FormField, FormFieldComponent, TextAreaDirective, TextBoxDirective]
})
class NativeHostComponent {
    public readonly hint = signal("Keep it short.");
    public readonly label = signal("Note");
    public readonly model = signal({ text: "" });
    public readonly note = form(this.model, path => {
        required(path.text);
    });
}

@Component({
    template: `
        <mona-form-field label="Wi-Fi" hint="Turns the radio on.">
            <mona-switch [(checked)]="on" />
        </mona-form-field>
        <mona-form-field label="Fruit">
            <mona-dropdown-list [data]="fruits" />
        </mona-form-field>
        <mona-form-field label="Terms" hint="Read them first.">
            <mona-check-box label="I agree" />
        </mona-form-field>
        <mona-form-field label="Season" hint="Pick one.">
            <mona-radio-group>
                <mona-radio-button label="Autumn" radioValue="autumn" />
                <mona-radio-button label="Winter" radioValue="winter" />
            </mona-radio-group>
        </mona-form-field>
        <mona-form-field label="Brand color" hint="Used for buttons.">
            <mona-color-gradient />
        </mona-form-field>
    `,
    imports: [
        CheckBoxComponent,
        ColorGradientComponent,
        DropdownListComponent,
        FormFieldComponent,
        RadioButtonComponent,
        RadioGroupComponent,
        SwitchComponent
    ]
})
class ControlsHostComponent {
    public readonly fruits = ["Apple", "Pear"];
    public readonly on = signal(false);
}

@Component({
    template: `
        <mona-form-field error="Server says no.">
            <ng-template monaFormFieldLabelTemplate><strong>Handle</strong></ng-template>
            <ng-template monaFormFieldHintTemplate>See <a href="#rules">the rules</a>.</ng-template>
            <ng-template monaFormFieldErrorTemplate let-message let-error="error">
                <span class="custom-error" [attr.data-kind]="error?.kind ?? 'own'">{{ message }}</span>
            </ng-template>
            <mona-text-box [formField]="account.handle" />
        </mona-form-field>
    `,
    imports: [
        FormField,
        FormFieldComponent,
        FormFieldErrorTemplateDirective,
        FormFieldHintTemplateDirective,
        FormFieldLabelTemplateDirective,
        TextBoxComponent
    ]
})
class TemplatesHostComponent {
    readonly #model = signal({ handle: "" });
    public readonly account = form(this.#model, path => {
        required(path.handle);
    });
}

describe("FormFieldComponent", () => {
    describe("with a signal form field", () => {
        let fixture: ComponentFixture<SignalFormHostComponent>;
        let host: SignalFormHostComponent;
        let root: HTMLElement;
        let field: HTMLElement;
        let input: HTMLInputElement;

        beforeEach(async () => {
            fixture = TestBed.createComponent(SignalFormHostComponent);
            host = fixture.componentInstance;
            root = fixture.nativeElement;
            document.body.appendChild(root);
            await settle(fixture);
            field = root.querySelector("mona-form-field")!;
            input = root.querySelector("input")!;
        });

        afterEach(() => {
            root.remove();
        });

        it("names the control with its label and describes it with its hint", () => {
            expect(nameOf(input)).toBe("Email");
            expect(textOf(input, "aria-describedby")).toBe("We never share it.");
            expect(field.querySelector("label")!.id).toBe(input.getAttribute("aria-labelledby"));
        });

        it("marks a field required by its rule, hidden from assistive technology", () => {
            const marker = field.querySelector("label [aria-hidden=true]")!;
            expect(marker.textContent).toBe("*");
            expect(field.getAttribute("data-required")).toBe("true");
            expect(input.required).toBe(true);
        });

        it("hides the required marker when asked", async () => {
            host.showRequiredMarker.set(false);
            await settle(fixture);
            expect(field.querySelector("label [aria-hidden=true]")).toBeNull();
            expect(field.hasAttribute("data-required")).toBe(false);
        });

        it("shows no error before the control is touched", () => {
            const region = field.querySelector("[aria-live=polite]")!;
            expect(region.textContent!.trim()).toBe("");
            expect(ids(input, "aria-describedby")).not.toContain(region.id);
            expect(field.hasAttribute("data-invalid")).toBe(false);
        });

        it("shows the locale's message once the control is touched", async () => {
            host.profile.email().markAsTouched();
            await settle(fixture);
            const region = field.querySelector("[aria-live=polite]")!;
            expect(region.textContent!.trim()).toBe("This field is required.");
            expect(textOf(input, "aria-describedby")).toBe("We never share it. | This field is required.");
            expect(field.getAttribute("data-invalid")).toBe("true");
            expect(input.getAttribute("aria-invalid")).toBe("true");
        });

        it("shows every error of the field, one per line", async () => {
            host.model.set({ email: "a@" });
            host.profile.email().markAsTouched();
            await settle(fixture);
            const lines = Array.from(field.querySelectorAll("[aria-live=polite] > div")).map(line =>
                line.textContent!.trim()
            );
            expect(lines).toEqual(["Enter a valid email address.", "Enter at least 5 characters."]);
        });

        it("clears the error once the value is valid", async () => {
            host.profile.email().markAsTouched();
            await settle(fixture);
            host.model.set({ email: "ana@example.com" });
            await settle(fixture);
            expect(field.querySelector("[aria-live=polite]")!.textContent!.trim()).toBe("");
            expect(textOf(input, "aria-describedby")).toBe("We never share it.");
        });

        it("shows its own error before the field's, even untouched", async () => {
            host.serverError.set("That address is already registered.");
            await settle(fixture);
            expect(field.querySelector("[aria-live=polite]")!.textContent!.trim()).toBe(
                "That address is already registered."
            );
            host.profile.email().markAsTouched();
            await settle(fixture);
            const lines = Array.from(field.querySelectorAll("[aria-live=polite] > div")).map(line =>
                line.textContent!.trim()
            );
            expect(lines).toEqual(["That address is already registered.", "This field is required."]);
        });

        it("shows optional text after the label", async () => {
            host.optional.set(true);
            await settle(fixture);
            expect(nameOf(input)).toBe("Email Optional");
        });

        it("focuses the control when the label is clicked", () => {
            field.querySelector("label")!.click();
            expect(document.activeElement).toBe(input);
        });

        it("puts the label beside the control when horizontal", async () => {
            host.orientation.set("horizontal");
            await settle(fixture);
            expect(field.getAttribute("data-orientation")).toBe("horizontal");
            expect(field.className).toContain("grid-cols-[var(--mona-form-field-label-width,10rem)_minmax(0,1fr)]");
            expect(field.querySelector("label")!.className).toContain("col-start-1");
        });

        it("has no accessibility violations, with or without errors", async () => {
            expect(await axeViolations(root)).toEqual([]);
            host.profile.email().markAsTouched();
            host.orientation.set("horizontal");
            await settle(fixture);
            expect(await axeViolations(root)).toEqual([]);
        });
    });

    describe("validator messages", () => {
        it("formats dates in the locale and keeps a validator's own message", async () => {
            const fixture = TestBed.createComponent(ValidatorMessagesHostComponent);
            const host = fixture.componentInstance;
            await settle(fixture);
            host.trip.start().markAsTouched();
            host.trip.code().markAsTouched();
            await settle(fixture);
            const [start, code] = Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll("mona-form-field"));
            expect(start.querySelector("[aria-live=polite]")!.textContent!.trim()).toBe(
                "The date must be on or after November 17, 2026."
            );
            expect(code.querySelector("[aria-live=polite]")!.textContent!.trim()).toBe("That code is taken.");
        });
    });

    describe("with a native control", () => {
        let fixture: ComponentFixture<NativeHostComponent>;
        let host: NativeHostComponent;
        let root: HTMLElement;
        let textarea: HTMLTextAreaElement;

        beforeEach(async () => {
            fixture = TestBed.createComponent(NativeHostComponent);
            host = fixture.componentInstance;
            root = fixture.nativeElement;
            document.body.appendChild(root);
            await settle(fixture);
            textarea = root.querySelector("textarea")!;
        });

        afterEach(() => {
            root.remove();
        });

        it("names and describes it, after its own description", () => {
            expect(nameOf(textarea)).toBe("Note");
            expect(textOf(textarea, "aria-describedby")).toBe("0 / 200 | Keep it short.");
        });

        it("marks it invalid while it shows an error, and removes only what it added", async () => {
            host.note.text().markAsTouched();
            await settle(fixture);
            expect(textarea.getAttribute("aria-invalid")).toBe("true");
            expect(textOf(textarea, "aria-describedby")).toBe("0 / 200 | Keep it short. | This field is required.");
            host.model.set({ text: "Hello" });
            host.hint.set("");
            await settle(fixture);
            expect(textarea.hasAttribute("aria-invalid")).toBe(false);
            expect(textOf(textarea, "aria-describedby")).toBe("0 / 200");
        });

        it("focuses it when the label is clicked", () => {
            root.querySelector("label")!.click();
            expect(document.activeElement).toBe(textarea);
        });

        it("finds a native input without a form binding, and leaves a name of its own alone", () => {
            const city = root.querySelector<HTMLInputElement>("input")!;
            expect(city.hasAttribute("aria-labelledby")).toBe(false);
            expect(city.getAttribute("aria-label")).toBe("Town");
            expect(textOf(city, "aria-describedby")).toBe("Where you live.");
        });

        it("has no accessibility violations", async () => {
            expect(await axeViolations(root)).toEqual([]);
        });
    });

    describe("with other controls", () => {
        let fixture: ComponentFixture<ControlsHostComponent>;
        let host: ControlsHostComponent;
        let root: HTMLElement;

        beforeEach(async () => {
            fixture = TestBed.createComponent(ControlsHostComponent);
            host = fixture.componentInstance;
            root = fixture.nativeElement;
            document.body.appendChild(root);
            await settle(fixture);
        });

        afterEach(() => {
            root.remove();
        });

        function fieldOf(caption: string): HTMLElement {
            return Array.from(root.querySelectorAll<HTMLElement>("mona-form-field")).find(
                field => field.querySelector("label")?.textContent?.trim() === caption
            )!;
        }

        it("activates a switch from its label, as a native label would", async () => {
            fieldOf("Wi-Fi").querySelector("label")!.click();
            await settle(fixture);
            expect(host.on()).toBe(true);
            const control = root.querySelector("mona-switch")!;
            expect(nameOf(control)).toBe("Wi-Fi");
            expect(textOf(control, "aria-describedby")).toBe("Turns the radio on.");
        });

        it("names a dropdown list and focuses it from the label", () => {
            const dropdown = root.querySelector<HTMLElement>("mona-dropdown-list")!;
            expect(nameOf(dropdown)).toBe("Fruit");
            expect(dropdown.hasAttribute("aria-describedby")).toBe(false);
            fieldOf("Fruit").querySelector("label")!.click();
            expect(document.activeElement).toBe(dropdown);
        });

        it("describes a check box but leaves it named by its own label", () => {
            const checkbox = root.querySelector("mona-check-box input")!;
            expect(nameOf(checkbox)).not.toContain("Terms");
            expect(textOf(checkbox, "aria-describedby")).toBe("Read them first.");
        });

        it("names and describes a radio group, not each radio", () => {
            const group = root.querySelector("mona-radio-group")!;
            expect(nameOf(group)).toBe("Season");
            expect(textOf(group, "aria-describedby")).toBe("Pick one.");
            for (const radio of Array.from(root.querySelectorAll("mona-radio-button input"))) {
                expect(radio.hasAttribute("aria-describedby")).toBe(false);
            }
        });

        it("names and describes a composite control, not the controls inside it", () => {
            const gradient = root.querySelector("mona-color-gradient")!;
            const field = fieldOf("Brand color");
            const captionId = field.querySelector("label")!.id;
            const hintId = field.querySelector("label ~ div ~ div")!.id;
            expect(gradient.getAttribute("aria-labelledby")).toBe(captionId);
            expect(gradient.getAttribute("aria-describedby")).toBe(hintId);
            const inner = Array.from(gradient.querySelectorAll("input, [role=slider]"));
            expect(inner.length).toBeGreaterThan(0);
            for (const element of inner) {
                expect(ids(element, "aria-labelledby")).not.toContain(captionId);
                expect(ids(element, "aria-describedby")).not.toContain(hintId);
            }
        });

        it("has no accessibility violations", async () => {
            expect(await axeViolations(root)).toEqual([]);
        });
    });

    describe("templates", () => {
        it("renders the label, hint and error templates", async () => {
            const fixture = TestBed.createComponent(TemplatesHostComponent);
            await settle(fixture);
            const root: HTMLElement = fixture.nativeElement;
            const input = root.querySelector("input")!;
            expect(nameOf(input)).toBe("Handle");
            expect(root.querySelector("label strong")!.textContent).toBe("Handle");
            expect(textOf(input, "aria-describedby")).toBe("See the rules. | Server says no.");
            fixture.componentInstance.account.handle().markAsTouched();
            await settle(fixture);
            const errors = Array.from(root.querySelectorAll(".custom-error")).map(error => [
                error.getAttribute("data-kind"),
                error.textContent
            ]);
            expect(errors).toEqual([
                ["own", "Server says no."],
                ["required", "This field is required."]
            ]);
        });
    });
});
