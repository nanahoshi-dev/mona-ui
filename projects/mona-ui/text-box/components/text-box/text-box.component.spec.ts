import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { form, FormField, maxLength, required } from "@angular/forms/signals";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { LabelComponent } from "@nanahoshi/mona-ui/label";
import axe from "axe-core";
import { TextBoxPrefixTemplateDirective } from "../../directives/text-box-prefix-template.directive";
import { TextBoxSuffixTemplateDirective } from "../../directives/text-box-suffix-template.directive";
import { TextBoxComponent } from "./text-box.component";

@Component({
    template: `
        <mona-text-box [clearButton]="true" value="Hello">
            <ng-template monaTextBoxPrefixTemplate><span data-testid="prefix">$</span></ng-template>
            <ng-template monaTextBoxSuffixTemplate><button type="button" data-testid="suffix">Go</button></ng-template>
        </mona-text-box>
    `,
    imports: [TextBoxComponent, TextBoxPrefixTemplateDirective, TextBoxSuffixTemplateDirective]
})
class AffixHostComponent {}

@Component({
    template: `<mona-text-box clearButton disabled readonly required value="abc" />`,
    imports: [TextBoxComponent]
})
class BareAttributeHostComponent {}

@Component({
    template: `
        <mona-label for="email" text="Email"></mona-label>
        <mona-text-box
            inputId="email"
            type="email"
            aria-describedby="email-hint"
            [clearButton]="true"
            value="ada@example.com" />
        <p id="email-hint">We never share it.</p>
        <span id="search-label">Search</span>
        <mona-text-box aria-labelledby="search-label" type="search" />
        <mona-text-box aria-label="Code" />
    `,
    imports: [TextBoxComponent, LabelComponent]
})
class LabelledHostComponent {}

@Component({
    template: `<mona-text-box [formField]="form.code" />`,
    imports: [TextBoxComponent, FormField]
})
class MaxLengthFormHostComponent {
    readonly #model = signal({ code: "" });
    public readonly form = form(this.#model, schema => maxLength(schema.code, 6));
}

@Component({
    template: `
        <mona-text-box [formField]="form.name" />
        <button type="button">Next</button>
    `,
    imports: [TextBoxComponent, FormField]
})
class SignalFormHostComponent {
    readonly #model = signal({ name: "" });
    public readonly form = form(this.#model, schema => required(schema.name));
}

@Component({
    template: `
        <mona-text-box [(ngModel)]="text" />
        <button type="button">Next</button>
    `,
    imports: [TextBoxComponent, FormsModule]
})
class NgModelHostComponent {
    public text = "";
}

describe("TextBoxComponent", () => {
    let component: TextBoxComponent;
    let fixture: ComponentFixture<TextBoxComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [TextBoxComponent]
        });
        fixture = TestBed.createComponent(TextBoxComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    function getHost(): HTMLElement {
        return fixture.nativeElement as HTMLElement;
    }

    function getInput(): HTMLInputElement {
        return getHost().querySelector("input") as HTMLInputElement;
    }

    function getClearButton(): HTMLButtonElement | null {
        return getHost().querySelector("button");
    }

    function type(input: HTMLInputElement, text: string): void {
        input.value = text;
        input.dispatchEvent(new Event("input", { bubbles: true }));
    }

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should use the shared input shell and semantic state precedence", () => {
        const element = getHost();

        expect(
            element.classList.contains(
                "[background-color:var(--mona-effect-control-background-color,var(--color-input-background))]"
            )
        ).toBe(true);
        expect(element.classList.contains("border-input-border")).toBe(true);
        expect(element.classList.contains("shadow-(--shadow-control)")).toBe(true);
        expect(element.classList.contains("focus-within:border-focus-indicator")).toBe(true);
        expect(element.classList.contains("focus-within:ring-focus-indicator/35")).toBe(true);
        expect(element.classList.contains("data-[disabled='true']:bg-disabled-background")).toBe(true);
        expect(element.classList.contains("data-[invalid='true']:focus-within:ring-error/35")).toBe(true);
        expect(element.classList.contains("opacity-50")).toBe(false);
    });

    it("renders clear button with default English aria-label and updates dynamically on locale change", () => {
        const i18n = TestBed.inject(MonaI18nService);
        fixture.componentRef.setInput("clearButton", true);
        fixture.componentRef.setInput("value", "Hello");
        fixture.detectChanges();

        let button = getClearButton();
        expect(button).toBeTruthy();
        expect(button?.getAttribute("aria-label")).toBe("Clear");

        i18n.use({
            id: "tr-TR",
            direction: "ltr",
            messages: {
                textBox: {
                    clear: "Temizle"
                }
            }
        });
        fixture.detectChanges();

        button = getClearButton();
        expect(button?.getAttribute("aria-label")).toBe("Temizle");
    });

    describe("value and state binding", () => {
        it("writes the value and the disabled state to the input in the same change detection", () => {
            fixture.componentRef.setInput("value", "Hello");
            fixture.componentRef.setInput("disabled", true);
            fixture.detectChanges();

            expect(getInput().value).toBe("Hello");
            expect(getInput().disabled).toBe(true);
        });

        it("updates the value as the user types", () => {
            const values: string[] = [];
            component.value.subscribe(value => values.push(value));

            type(getInput(), "a");
            type(getInput(), "ab");

            expect(component.value()).toBe("ab");
            expect(values).toEqual(["a", "ab"]);
        });

        it("accepts bare boolean attributes", () => {
            const host = TestBed.createComponent(BareAttributeHostComponent);
            host.detectChanges();
            const textBox = host.nativeElement.querySelector("mona-text-box") as HTMLElement;
            const input = textBox.querySelector("input") as HTMLInputElement;

            expect(textBox.getAttribute("data-disabled")).toBe("true");
            expect(input.disabled).toBe(true);
            expect(input.readOnly).toBe(true);
            expect(input.required).toBe(true);
        });
    });

    describe("clear button", () => {
        beforeEach(() => {
            fixture.componentRef.setInput("clearButton", true);
            fixture.componentRef.setInput("value", "Hello");
            fixture.detectChanges();
        });

        it("clears the value and returns focus to the input", () => {
            getClearButton()?.click();
            fixture.detectChanges();

            expect(component.value()).toBe("");
            expect(getInput().value).toBe("");
            expect(document.activeElement).toBe(getInput());
            expect(getClearButton()).toBeNull();
        });

        it("is hidden while the value is empty", () => {
            fixture.componentRef.setInput("value", "");
            fixture.detectChanges();

            expect(getClearButton()).toBeNull();
        });

        it("is hidden on a read-only text box", () => {
            fixture.componentRef.setInput("readonly", true);
            fixture.detectChanges();

            expect(getClearButton()).toBeNull();
        });

        it("is hidden on a disabled text box", () => {
            fixture.componentRef.setInput("disabled", true);
            fixture.detectChanges();

            expect(getClearButton()).toBeNull();
        });
    });

    describe("touch", () => {
        let touches: number;

        beforeEach(() => {
            touches = 0;
            component.touch.subscribe(() => touches++);
            document.body.appendChild(getHost());
        });

        afterEach(() => {
            getHost().remove();
        });

        it("is not emitted while the user types", () => {
            type(getInput(), "a");

            expect(touches).toBe(0);
        });

        it("is not emitted when the value is cleared", () => {
            fixture.componentRef.setInput("clearButton", true);
            fixture.componentRef.setInput("value", "Hello");
            fixture.detectChanges();

            getClearButton()?.click();

            expect(touches).toBe(0);
        });

        it("is emitted when focus leaves the text box", () => {
            const outside = document.createElement("button");
            document.body.appendChild(outside);

            getInput().focus();
            outside.focus();

            expect(touches).toBe(1);
            outside.remove();
        });

        it("is not emitted when focus moves to the clear button", () => {
            fixture.componentRef.setInput("clearButton", true);
            fixture.componentRef.setInput("value", "Hello");
            fixture.detectChanges();

            getInput().focus();
            getClearButton()?.focus();

            expect(touches).toBe(0);
        });
    });

    describe("forms", () => {
        it("marks a signal-form field touched when focus leaves, not while typing", () => {
            const host = TestBed.createComponent(SignalFormHostComponent);
            host.detectChanges();
            document.body.appendChild(host.nativeElement);
            const input = host.nativeElement.querySelector("input") as HTMLInputElement;
            const field = host.componentInstance.form.name();

            input.focus();
            type(input, "a");
            host.detectChanges();
            expect(field.value()).toBe("a");
            expect(field.touched()).toBe(false);

            (host.nativeElement.querySelector("button[type=button]") as HTMLButtonElement).focus();
            host.detectChanges();
            expect(field.touched()).toBe(true);
            host.nativeElement.remove();
        });

        it("marks an ngModel control touched when focus leaves, not while typing", async () => {
            const host = TestBed.createComponent(NgModelHostComponent);
            host.detectChanges();
            await host.whenStable();
            document.body.appendChild(host.nativeElement);
            const textBox = host.nativeElement.querySelector("mona-text-box") as HTMLElement;
            const input = textBox.querySelector("input") as HTMLInputElement;

            input.focus();
            type(input, "a");
            host.detectChanges();
            await host.whenStable();
            expect(host.componentInstance.text).toBe("a");
            expect(textBox.classList.contains("ng-untouched")).toBe(true);

            (host.nativeElement.querySelector("button[type=button]") as HTMLButtonElement).focus();
            host.detectChanges();
            expect(textBox.classList.contains("ng-touched")).toBe(true);
            host.nativeElement.remove();
        });
    });

    describe("labelling", () => {
        let host: ComponentFixture<LabelledHostComponent>;

        beforeEach(() => {
            host = TestBed.createComponent(LabelledHostComponent);
            host.detectChanges();
        });

        function getTextBoxes(): HTMLElement[] {
            return Array.from(host.nativeElement.querySelectorAll("mona-text-box"));
        }

        it("gives the inner input a unique generated id by default", () => {
            const other = TestBed.createComponent(TextBoxComponent);
            other.detectChanges();
            const id = getInput().id;

            expect(id).toMatch(/^mona-/);
            expect(other.nativeElement.querySelector("input").id).not.toBe(id);
        });

        it("names the input through a label pointed at inputId", () => {
            const input = getTextBoxes()[0].querySelector("input") as HTMLInputElement;

            expect(input.id).toBe("email");
            expect(input.labels?.[0]?.textContent).toContain("Email");
        });

        it("moves the ARIA attributes from the host to the inner input", () => {
            const [email, search, code] = getTextBoxes();

            expect(email.querySelector("input")?.getAttribute("aria-describedby")).toBe("email-hint");
            expect(search.querySelector("input")?.getAttribute("aria-labelledby")).toBe("search-label");
            expect(code.querySelector("input")?.getAttribute("aria-label")).toBe("Code");
            expect(email.hasAttribute("aria-describedby")).toBe(false);
            expect(search.hasAttribute("aria-labelledby")).toBe(false);
            expect(code.hasAttribute("aria-label")).toBe(false);
        });

        it("leaves the ARIA attributes off the input when they aren't set", () => {
            const input = getInput();

            expect(input.hasAttribute("aria-label")).toBe(false);
            expect(input.hasAttribute("aria-labelledby")).toBe(false);
            expect(input.hasAttribute("aria-describedby")).toBe(false);
        });

        it("has no AXE violations when labelled", async () => {
            const results = await axe.run(host.nativeElement as HTMLElement, {
                rules: { "color-contrast": { enabled: false } }
            });

            expect(results.violations).toEqual([]);
        });
    });

    describe("form attributes", () => {
        it("forwards name, maxLength and minLength to the inner input", () => {
            fixture.componentRef.setInput("name", "postcode");
            fixture.componentRef.setInput("maxLength", 8);
            fixture.componentRef.setInput("minLength", 3);
            fixture.detectChanges();

            expect(getInput().name).toBe("postcode");
            expect(getInput().maxLength).toBe(8);
            expect(getInput().minLength).toBe(3);
        });

        it("leaves them off when they aren't set", () => {
            expect(getInput().hasAttribute("name")).toBe(false);
            expect(getInput().hasAttribute("maxlength")).toBe(false);
            expect(getInput().hasAttribute("minlength")).toBe(false);
        });

        it("receives the maxLength rule and the field name from a signal form", () => {
            const host = TestBed.createComponent(MaxLengthFormHostComponent);
            host.detectChanges();
            const input = host.nativeElement.querySelector("input") as HTMLInputElement;

            expect(input.maxLength).toBe(6);
            expect(input.name).not.toBe("");
        });
    });

    describe("focus()", () => {
        beforeEach(() => {
            document.body.appendChild(getHost());
        });

        afterEach(() => {
            getHost().remove();
        });

        it("focuses the input with the caret after the value", () => {
            fixture.componentRef.setInput("value", "Hello world");
            fixture.detectChanges();
            getInput().setSelectionRange(0, 0);

            component.focus();

            expect(document.activeElement).toBe(getInput());
            expect(getInput().selectionStart).toBe(11);
            expect(getInput().selectionEnd).toBe(11);
        });

        it("passes focus options to the input", () => {
            const focusSpy = vi.spyOn(getInput(), "focus");

            component.focus({ preventScroll: true });

            expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
        });

        it("focuses an email input without moving the caret", () => {
            fixture.componentRef.setInput("type", "email");
            fixture.componentRef.setInput("value", "ada@example.com");
            fixture.detectChanges();

            expect(() => component.focus()).not.toThrow();
            expect(document.activeElement).toBe(getInput());
        });
    });

    describe("clear button size", () => {
        it("is a 24 px target with a full-opacity muted icon", () => {
            fixture.componentRef.setInput("clearButton", true);
            fixture.componentRef.setInput("value", "Hello");
            fixture.detectChanges();
            const button = getClearButton() as HTMLButtonElement;

            expect(button.classList.contains("size-6")).toBe(true);
            expect(button.classList.contains("text-muted-foreground")).toBe(true);
            expect(button.querySelector("svg")?.classList.contains("opacity-50")).toBe(false);
        });
    });

    describe("invalid state", () => {
        function isInvalid(): boolean {
            return (
                getHost().getAttribute("data-invalid") === "true" && getInput().getAttribute("aria-invalid") === "true"
            );
        }

        it("isn't shown before the field is touched", () => {
            fixture.componentRef.setInput("required", true);
            fixture.componentRef.setInput("invalid", true);
            fixture.detectChanges();

            expect(getHost().hasAttribute("data-invalid")).toBe(false);
            expect(getInput().hasAttribute("aria-invalid")).toBe(false);
        });

        it("is shown for an empty required field once touched", () => {
            fixture.componentRef.setInput("required", true);
            fixture.componentRef.setInput("touched", true);
            fixture.detectChanges();

            expect(isInvalid()).toBe(true);
        });

        it("clears when a required field gets a value", () => {
            fixture.componentRef.setInput("required", true);
            fixture.componentRef.setInput("touched", true);
            fixture.componentRef.setInput("value", "a");
            fixture.detectChanges();

            expect(getHost().hasAttribute("data-invalid")).toBe(false);
        });

        it("follows the invalid input once touched", () => {
            fixture.componentRef.setInput("invalid", true);
            fixture.componentRef.setInput("touched", true);
            fixture.detectChanges();

            expect(isInvalid()).toBe(true);
        });
    });

    describe("affixes", () => {
        it("renders the prefix before the input and the suffix after the clear button", () => {
            const host = TestBed.createComponent(AffixHostComponent);
            host.detectChanges();
            const textBox = host.nativeElement.querySelector("mona-text-box") as HTMLElement;
            const order = Array.from(textBox.querySelectorAll("[data-testid], input, button[aria-label]")).map(
                element => element.getAttribute("data-testid") ?? element.tagName.toLowerCase()
            );

            expect(order).toEqual(["prefix", "input", "button", "suffix"]);
        });

        it("doesn't count focus moving into the suffix as leaving", () => {
            const host = TestBed.createComponent(AffixHostComponent);
            host.detectChanges();
            document.body.appendChild(host.nativeElement);
            const textBox = host.debugElement.children[0].componentInstance as TextBoxComponent;
            let touches = 0;
            textBox.touch.subscribe(() => touches++);

            (host.nativeElement.querySelector("input") as HTMLInputElement).focus();
            (host.nativeElement.querySelector("[data-testid=suffix]") as HTMLButtonElement).focus();

            expect(touches).toBe(0);
            host.nativeElement.remove();
        });
    });

    describe("sizes", () => {
        it("uses text-base for the large size", () => {
            fixture.componentRef.setInput("size", "large");
            fixture.detectChanges();

            expect(getHost().classList.contains("text-base")).toBe(true);
        });
    });
});
