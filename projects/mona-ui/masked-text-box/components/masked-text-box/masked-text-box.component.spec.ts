import { LiveAnnouncer } from "@angular/cdk/a11y";
import { Component, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { form, FormField, validate } from "@angular/forms/signals";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isMaskComplete } from "../../utils/mask";
import { MaskedTextBoxComponent } from "./masked-text-box.component";

const PHONE = "(000) 000-0000";

@Component({
    template: `
        <label for="phone">Phone</label>
        <mona-masked-text-box
            inputId="phone"
            [mask]="mask()"
            [includeLiterals]="includeLiterals()"
            [placeholder]="placeholder()"
            [readonly]="readonly()"
            [clearButton]="true"
            [inputAttributes]="attributes()"
            [(value)]="value" />
        <button type="button">Next</button>
    `,
    imports: [MaskedTextBoxComponent]
})
class HostComponent {
    public readonly attributes = signal<Record<string, string>>({});
    public readonly includeLiterals = signal(false);
    public readonly mask = signal(PHONE);
    public readonly placeholder = signal("");
    public readonly readonly = signal(false);
    public readonly value = signal("");
}

@Component({
    template: `<mona-masked-text-box aria-label="Phone" mask="(000) 000-0000" [formField]="form.phone" />`,
    imports: [MaskedTextBoxComponent, FormField]
})
class SignalFormHostComponent {
    readonly #model = signal({ phone: "555" });
    public readonly form = form(this.#model, path =>
        validate(path.phone, ({ value }) =>
            isMaskComplete(value(), PHONE) ? undefined : { kind: "mask", message: "Enter all 10 digits" }
        )
    );
}

@Component({
    template: `<mona-masked-text-box aria-label="Phone" mask="(000) 000-0000" [(ngModel)]="phone" />`,
    imports: [MaskedTextBoxComponent, FormsModule]
})
class NgModelHostComponent {
    public phone: string | null = null;
}

describe("MaskedTextBoxComponent", () => {
    let fixture: ComponentFixture<HostComponent>;
    let host: HostComponent;
    let input: HTMLInputElement;

    const element = (): HTMLElement => fixture.nativeElement.querySelector("mona-masked-text-box");
    const ghost = (): string | null => element().querySelector("[aria-hidden='true']")?.textContent ?? null;
    const caret = (): number | null => input.selectionStart;
    const beforeInput = (inputType: string, data: string | null = null): InputEvent => {
        const event = new InputEvent("beforeinput", { bubbles: true, cancelable: true, data, inputType });
        input.dispatchEvent(event);
        fixture.detectChanges();
        return event;
    };
    const type = (text: string): void => {
        for (const char of text) {
            beforeInput("insertText", char);
        }
    };
    const select = (start: number, end = start): void => input.setSelectionRange(start, end);
    const key = (init: KeyboardEventInit): KeyboardEvent => {
        const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ...init });
        input.dispatchEvent(event);
        fixture.detectChanges();
        return event;
    };

    beforeEach(async () => {
        fixture = TestBed.createComponent(HostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();
        input = element().querySelector("input") as HTMLInputElement;
        input.focus();
        fixture.detectChanges();
    });

    afterEach(() => vi.restoreAllMocks());

    describe("typing", () => {
        it("fills the slots, adds the literals and shows the rest of the mask after the text", () => {
            expect(ghost()).toBe("(___) ___-____");
            type("555");
            expect(input.value).toBe("(555) ");
            expect(caret()).toBe(6);
            expect(ghost()).toBe("(555) ___-____");
            type("1234567");
            expect(input.value).toBe("(555) 123-4567");
            expect(host.value()).toBe("5551234567");
            expect(element().hasAttribute("data-complete")).toBe(true);
        });

        it("emits the literals with includeLiterals", () => {
            host.includeLiterals.set(true);
            fixture.detectChanges();
            type("5551");
            expect(host.value()).toBe("(555) 1");
        });

        it("takes over every beforeinput it handles, so the browser doesn't edit the text too", () => {
            expect(beforeInput("insertText", "5").defaultPrevented).toBe(true);
            expect(beforeInput("deleteContentBackward").defaultPrevented).toBe(true);
            expect(beforeInput("insertCompositionText", "あ").defaultPrevented).toBe(false);
        });

        it("turns down a character a slot doesn't take, and says what the slot takes", () => {
            const announce = vi.spyOn(TestBed.inject(LiveAnnouncer), "announce").mockResolvedValue();
            type("55x");
            expect(host.value()).toBe("55");
            expect(announce).toHaveBeenCalledWith("Only a digit fits here", "polite");
        });

        it("overwrites the slot at the caret", () => {
            host.value.set("5551234567");
            fixture.detectChanges();
            select(1);
            type("9");
            expect(input.value).toBe("(955) 123-4567");
            expect(caret()).toBe(2);
        });

        it("fits pasted text, skipping what doesn't fit", () => {
            const paste = new Event("paste", { bubbles: true, cancelable: true }) as ClipboardEvent;
            Object.defineProperty(paste, "clipboardData", { value: { getData: () => "555.123.4567" } });
            input.dispatchEvent(paste);
            fixture.detectChanges();
            expect(paste.defaultPrevented).toBe(true);
            expect(host.value()).toBe("5551234567");
            expect(input.value).toBe("(555) 123-4567");
        });
    });

    describe("deleting", () => {
        beforeEach(() => {
            host.value.set("5551234567");
            fixture.detectChanges();
        });

        it("empties the slot before the caret with Backspace, past the literals, leaving the rest in place", () => {
            select(6);
            beforeInput("deleteContentBackward");
            expect(input.value).toBe("(55_) 123-4567");
            expect(host.value()).toBe("55 1234567");
            expect(caret()).toBe(3);
        });

        it("empties the selected slots", () => {
            select(0, 14);
            beforeInput("deleteContentBackward");
            expect(input.value).toBe("");
            expect(host.value()).toBe("");
        });

        it("cuts the selection as it shows, then empties its slots", () => {
            select(1, 4);
            const setData = vi.fn();
            const cut = new Event("cut", { bubbles: true, cancelable: true }) as ClipboardEvent;
            Object.defineProperty(cut, "clipboardData", { value: { setData } });
            input.dispatchEvent(cut);
            fixture.detectChanges();
            expect(setData).toHaveBeenCalledWith("text/plain", "555");
            expect(host.value()).toBe("   1234567");
        });

        it("clears everything with the clear button", () => {
            const clear = element().querySelector<HTMLButtonElement>("button[aria-label='Clear']");
            clear?.click();
            fixture.detectChanges();
            expect(host.value()).toBe("");
            expect(element().querySelector("button[aria-label='Clear']")).toBeNull();
        });
    });

    describe("undo", () => {
        it("takes back a run of typing in one step, and redoes it", () => {
            type("555");
            select(6);
            beforeInput("deleteContentBackward");
            expect(host.value()).toBe("55");
            key({ ctrlKey: true, key: "z" });
            expect(host.value()).toBe("555");
            key({ ctrlKey: true, key: "z" });
            expect(host.value()).toBe("");
            key({ ctrlKey: true, key: "y" });
            expect(host.value()).toBe("555");
            key({ key: "z", metaKey: true, shiftKey: true });
            expect(host.value()).toBe("55");
        });

        it("starts over when the value is set from outside", () => {
            type("555");
            host.value.set("123");
            fixture.detectChanges();
            key({ ctrlKey: true, key: "z" });
            expect(host.value()).toBe("123");
        });
    });

    describe("changes the browser makes itself", () => {
        it("fits text an input method composed", () => {
            type("55");
            input.dispatchEvent(new CompositionEvent("compositionstart"));
            input.value = "(555";
            input.dispatchEvent(new InputEvent("input", { inputType: "insertCompositionText", isComposing: true }));
            expect(host.value()).toBe("55");
            input.dispatchEvent(new CompositionEvent("compositionend"));
            fixture.detectChanges();
            expect(host.value()).toBe("555");
            expect(input.value).toBe("(555) ");
        });

        it("fits a value autofill wrote, and puts the text back for one that doesn't fit", () => {
            input.value = "555-123-4567";
            input.dispatchEvent(new Event("input"));
            fixture.detectChanges();
            expect(host.value()).toBe("5551234567");
            input.value = "(555) 123-4567x";
            input.dispatchEvent(new Event("input"));
            fixture.detectChanges();
            expect(input.value).toBe("(555) 123-4567");
        });
    });

    describe("values from outside", () => {
        it("shows a value, and writes one that doesn't line up back as it reads", () => {
            host.value.set("555-123-4567");
            fixture.detectChanges();
            TestBed.tick();
            fixture.detectChanges();
            expect(input.value).toBe("(555) 123-4567");
            expect(host.value()).toBe("5551234567");
        });

        it("shows an empty slot inside the value as the prompt", () => {
            host.value.set("55 1");
            fixture.detectChanges();
            expect(input.value).toBe("(55_) 1");
        });
    });

    describe("display", () => {
        it("shows the placeholder in place of the mask while empty and unfocused", () => {
            host.placeholder.set("Phone number");
            input.blur();
            fixture.detectChanges();
            expect(input.getAttribute("placeholder")).toBe("Phone number");
            expect(ghost()).toBeNull();
            input.focus();
            fixture.detectChanges();
            expect(input.hasAttribute("placeholder")).toBe(false);
            expect(ghost()).toBe("(___) ___-____");
        });

        it("asks for a number keyboard for a mask of digits, unless inputAttributes says otherwise", () => {
            expect(input.getAttribute("inputmode")).toBe("numeric");
            host.mask.set("LL-0000");
            fixture.detectChanges();
            expect(input.hasAttribute("inputmode")).toBe(false);
            host.mask.set(PHONE);
            host.attributes.set({ inputmode: "tel" });
            fixture.detectChanges();
            expect(input.getAttribute("inputmode")).toBe("tel");
        });

        it("keeps the text left to right in a right-to-left page", () => {
            expect(input.closest("[dir]")?.getAttribute("dir")).toBe("ltr");
        });
    });

    it("ignores edits while read-only", () => {
        host.value.set("555");
        host.readonly.set(true);
        fixture.detectChanges();
        type("1");
        expect(host.value()).toBe("555");
    });

    it("passes axe", async () => {
        host.value.set("555");
        fixture.detectChanges();
        const result = await axe.run(fixture.nativeElement, { rules: { "color-contrast": { enabled: false } } });
        expect(result.violations).toEqual([]);
    });

    it("warns in development when the mask has no slots", async () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
        const other = TestBed.createComponent(HostComponent);
        other.componentInstance.mask.set("()");
        other.detectChanges();
        await other.whenStable();
        expect(warn).toHaveBeenCalledWith(expect.stringContaining("[Mona MaskedTextBox]"), expect.anything());
    });
});

describe("MaskedTextBoxComponent in forms", () => {
    it("works as a signal form control, which shows as invalid once touched while incomplete", async () => {
        const fixture = TestBed.createComponent(SignalFormHostComponent);
        fixture.detectChanges();
        await fixture.whenStable();
        const element: HTMLElement = fixture.nativeElement.querySelector("mona-masked-text-box");
        const input = element.querySelector("input") as HTMLInputElement;
        expect(input.value).toBe("(555) ");
        expect(fixture.componentInstance.form.phone().valid()).toBe(false);
        input.focus();
        input.setSelectionRange(6, 6);
        for (const char of "1234567") {
            input.dispatchEvent(
                new InputEvent("beforeinput", { bubbles: true, cancelable: true, data: char, inputType: "insertText" })
            );
        }
        fixture.detectChanges();
        expect(fixture.componentInstance.form.phone().value()).toBe("5551234567");
        expect(fixture.componentInstance.form.phone().valid()).toBe(true);
        input.setSelectionRange(14, 14);
        input.dispatchEvent(
            new InputEvent("beforeinput", { bubbles: true, cancelable: true, inputType: "deleteContentBackward" })
        );
        input.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
        fixture.detectChanges();
        expect(fixture.componentInstance.form.phone().touched()).toBe(true);
        expect(input.getAttribute("aria-invalid")).toBe("true");
    });

    it("takes ngModel's first null as empty, without writing to the model", async () => {
        const fixture = TestBed.createComponent(NgModelHostComponent);
        fixture.detectChanges();
        await fixture.whenStable();
        const input = fixture.nativeElement.querySelector("input") as HTMLInputElement;
        expect(input.value).toBe("");
        expect(fixture.componentInstance.phone).toBeNull();
    });
});
