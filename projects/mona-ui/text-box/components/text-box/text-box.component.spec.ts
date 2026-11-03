import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { form, FormField, required } from "@angular/forms/signals";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { TextBoxComponent } from "./text-box.component";

@Component({
    template: `<mona-text-box clearButton disabled readonly required value="abc" />`,
    imports: [TextBoxComponent]
})
class BareAttributeHostComponent {}

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
});
