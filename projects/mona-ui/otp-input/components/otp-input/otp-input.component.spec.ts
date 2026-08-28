import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { disabled, form, FormField, readonly, required } from "@angular/forms/signals";
import { By } from "@angular/platform-browser";
import axe from "axe-core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OtpInputSeparatorTemplateDirective } from "../../directives/otp-input-separator-template.directive";
import { OtpInputType } from "../../models/OtpInputType";
import { OtpInputComponent } from "./otp-input.component";

@Component({
    imports: [OtpInputComponent, OtpInputSeparatorTemplateDirective],
    template: `
        <mona-otp-input
            [value]="value()"
            (valueChange)="value.set($event)"
            [length]="length()"
            [type]="type()"
            [pattern]="pattern()"
            [placeholder]="placeholder()"
            [groupLength]="groupLength()"
            [separator]="separator()"
            [spacing]="spacing()"
            [size]="size()"
            [rounded]="rounded()"
            [disabled]="disabled()"
            [readonly]="readonly()"
            [required]="required()"
            [invalid]="invalid()"
            [touched]="touched()"
            [ariaLabel]="ariaLabel()"
            [inputAttributes]="inputAttributes()"
            [slotClass]="slotClass()"
            [separatorClass]="separatorClass()"
            [class]="userClass()"
            (complete)="onComplete($event)"
            (touch)="onTouch()"
            (inputFocus)="onFocus($event)"
            (inputBlur)="onBlur($event)">
            @if (useCustomSeparator()) {
                <ng-template monaOtpInputSeparatorTemplate let-groupIndex="groupIndex">
                    <span class="custom-sep">/{{ groupIndex }}</span>
                </ng-template>
            }
        </mona-otp-input>
    `
})
class TestHostComponent {
    public readonly ariaLabel = signal("Verification code");
    public readonly blurEvents: FocusEvent[] = [];
    public readonly completeEvents: string[] = [];
    public readonly disabled = signal(false);
    public readonly focusEvents: FocusEvent[] = [];
    public readonly groupLength = signal<number | number[] | null>(null);
    public readonly inputAttributes = signal<Record<string, unknown>>({});
    public readonly invalid = signal(false);
    public readonly length = signal(4);
    public readonly pattern = signal<RegExp | readonly RegExp[] | string | null>(null);
    public readonly placeholder = signal("");
    public readonly readonly = signal(false);
    public readonly required = signal(false);
    public readonly rounded = signal<"none" | "small" | "medium" | "large" | "full">("medium");
    public readonly separator = signal("");
    public readonly separatorClass = signal<string | string[]>("");
    public readonly size = signal<"small" | "medium" | "large">("medium");
    public readonly slotClass = signal<string | string[]>("");
    public readonly spacing = signal(true);
    public readonly touched = signal(false);
    public readonly type = signal<OtpInputType>("text");
    public readonly useCustomSeparator = signal(false);
    public readonly userClass = signal("");
    public readonly value = signal("");
    public touchCount = 0;

    public onBlur(event: FocusEvent): void {
        this.blurEvents.push(event);
    }

    public onComplete(value: string): void {
        this.completeEvents.push(value);
    }

    public onFocus(event: FocusEvent): void {
        this.focusEvents.push(event);
    }

    public onTouch(): void {
        this.touchCount++;
    }
}

interface FormTestModel {
    code: string;
}

@Component({
    imports: [OtpInputComponent, FormField],
    template: `
        <mona-otp-input [formField]="form.code" [length]="6" (complete)="onComplete($event)"></mona-otp-input>
    `
})
class SignalFormHostComponent {
    public readonly completeEvents: string[] = [];
    public readonly form;
    public readonly formModel = signal<FormTestModel>({ code: "" });
    public readonly isFieldDisabled = signal(false);
    public readonly isFieldReadonly = signal(false);
    public readonly isFieldRequired = signal(false);

    public constructor() {
        this.form = form(this.formModel, schema => {
            disabled(schema.code, { when: () => this.isFieldDisabled() });
            readonly(schema.code, { when: () => this.isFieldReadonly() });
            required(schema.code, { when: () => this.isFieldRequired() });
        });
    }

    public onComplete(value: string): void {
        this.completeEvents.push(value);
    }
}

function createPasteEvent(text: string): ClipboardEvent {
    const event = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "clipboardData", {
        value: {
            getData: (format: string) => (format === "text" ? text : "")
        }
    });
    return event as ClipboardEvent;
}

describe("OtpInputComponent", () => {
    let fixture: ComponentFixture<TestHostComponent>;
    let host: TestHostComponent;

    const getNativeInput = (): HTMLInputElement => {
        const inputDebug = fixture.debugElement.query(By.css("input"));
        if (!inputDebug) {
            throw new Error("Native input not found");
        }
        return inputDebug.nativeElement as HTMLInputElement;
    };

    const getSlots = (): HTMLElement[] => {
        return fixture.debugElement
            .queryAll(By.css(".otp-slot"))
            .map(de => de.nativeElement as HTMLElement);
    };

    const getHostElement = (): HTMLElement => {
        const hostDebug = fixture.debugElement.query(By.css("mona-otp-input"));
        if (!hostDebug) {
            throw new Error("Host element not found");
        }
        return hostDebug.nativeElement as HTMLElement;
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TestHostComponent, SignalFormHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(TestHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
    });

    describe("Construction and Defaults", () => {
        it("creates exactly one real native input", () => {
            const inputs = fixture.debugElement.queryAll(By.css("input"));
            expect(inputs.length).toBe(1);
        });

        it("renders 4 visual slots by default", () => {
            const slots = getSlots();
            expect(slots.length).toBe(4);
            slots.forEach(slot => {
                expect(slot.getAttribute("aria-hidden")).toBe("true");
            });
        });

        it("has accessible name on the real input and is not aria-hidden", () => {
            const input = getNativeInput();
            expect(input.getAttribute("aria-label")).toBe("Verification code");
            expect(input.getAttribute("aria-hidden")).toBeNull();
            expect(input.getAttribute("autocomplete")).toBe("one-time-code");
            expect(input.getAttribute("inputmode")).toBe("text");
            expect(input.getAttribute("maxlength")).toBe("4");
        });

        it("does not render separators when no grouping is configured", () => {
            const separators = fixture.debugElement.queryAll(By.css(".custom-sep"));
            expect(separators.length).toBe(0);
        });
    });

    describe("External Value and Normalization", () => {
        it("renders characters in corresponding slots", async () => {
            host.value.set("1234");
            fixture.detectChanges();
            await fixture.whenStable();

            const slots = getSlots();
            expect(slots[0].textContent?.trim()).toBe("1");
            expect(slots[1].textContent?.trim()).toBe("2");
            expect(slots[2].textContent?.trim()).toBe("3");
            expect(slots[3].textContent?.trim()).toBe("4");
        });

        it("preserves leading zeroes", async () => {
            host.value.set("0042");
            fixture.detectChanges();
            await fixture.whenStable();

            const slots = getSlots();
            expect(slots[0].textContent?.trim()).toBe("0");
            expect(slots[1].textContent?.trim()).toBe("0");
            expect(slots[2].textContent?.trim()).toBe("4");
            expect(slots[3].textContent?.trim()).toBe("2");
            expect(getNativeInput().value).toBe("0042");
        });

        it("truncates overlong external value to length", async () => {
            host.value.set("12345678");
            fixture.detectChanges();
            await fixture.whenStable();
            fixture.detectChanges();

            expect(host.value()).toBe("1234");
            const slots = getSlots();
            expect(slots.map(s => s.textContent?.trim())).toEqual(["1", "2", "3", "4"]);
        });

        it("masks characters when type is password", async () => {
            host.type.set("password");
            host.value.set("AB12");
            fixture.detectChanges();
            await fixture.whenStable();

            const slots = getSlots();
            slots.forEach(slot => {
                expect(slot.textContent?.trim()).toBe("•");
                expect(slot.getAttribute("data-character")).toBeNull();
                expect(slot.getAttribute("title")).toBeNull();
            });
            expect(getNativeInput().type).toBe("password");
            expect(getNativeInput().value).toBe("AB12");
        });

        it("renders placeholder in unfilled slots", async () => {
            host.placeholder.set("○");
            host.value.set("12");
            fixture.detectChanges();
            await fixture.whenStable();

            const slots = getSlots();
            expect(slots[0].textContent?.trim()).toBe("1");
            expect(slots[1].textContent?.trim()).toBe("2");
            expect(slots[2].textContent?.trim()).toBe("○");
            expect(slots[3].textContent?.trim()).toBe("○");
            expect(slots[2].getAttribute("data-placeholder")).toBe("true");
        });
    });

    describe("Runtime Length Changes", () => {
        it("truncates value when length shrinks", async () => {
            host.length.set(6);
            host.value.set("123456");
            fixture.detectChanges();
            await fixture.whenStable();

            expect(getSlots().length).toBe(6);

            host.length.set(4);
            fixture.detectChanges();
            await fixture.whenStable();
            fixture.detectChanges();

            expect(getSlots().length).toBe(4);
            expect(host.value()).toBe("1234");
        });

        it("preserves value when length increases", async () => {
            host.value.set("12");
            host.length.set(6);
            fixture.detectChanges();
            await fixture.whenStable();

            expect(getSlots().length).toBe(6);
            expect(host.value()).toBe("12");
        });

        it("handles invalid length values gracefully", async () => {
            host.length.set(0);
            fixture.detectChanges();
            await fixture.whenStable();

            expect(getSlots().length).toBe(4);
        });
    });

    describe("Type Filtering and Custom Pattern", () => {
        it("accepts only numbers when type=number and sets inputmode=numeric", async () => {
            host.type.set("number");
            host.value.set("12AB-9");
            fixture.detectChanges();
            await fixture.whenStable();
            fixture.detectChanges();

            expect(host.value()).toBe("129");
            expect(getNativeInput().getAttribute("inputmode")).toBe("numeric");
        });

        it("uses custom pattern to filter characters", async () => {
            host.pattern.set(/^[A-F0-9]$/);
            host.value.set("A1Z9F");
            fixture.detectChanges();
            await fixture.whenStable();
            fixture.detectChanges();

            expect(host.value()).toBe("A19F");
        });
    });

    describe("Typing and Input Events", () => {
        it("updates value and emits touch on typing", () => {
            const input = getNativeInput();
            input.value = "12";
            input.dispatchEvent(new Event("input"));
            fixture.detectChanges();

            expect(host.value()).toBe("12");
            expect(host.touchCount).toBe(1);
            expect(host.completeEvents.length).toBe(0);
        });

        it("emits complete once when user typing reaches full length", () => {
            const input = getNativeInput();
            input.value = "1234";
            input.dispatchEvent(new Event("input"));
            fixture.detectChanges();

            expect(host.value()).toBe("1234");
            expect(host.completeEvents).toEqual(["1234"]);

            // Subsequent event while already complete should not duplicate complete emit
            input.dispatchEvent(new Event("input"));
            expect(host.completeEvents.length).toBe(1);
        });

        it("emits complete again after making value incomplete and completing it again", () => {
            const input = getNativeInput();
            input.value = "1234";
            input.dispatchEvent(new Event("input"));
            fixture.detectChanges();

            expect(host.completeEvents.length).toBe(1);

            input.value = "123";
            input.dispatchEvent(new Event("input"));
            fixture.detectChanges();

            input.value = "1235";
            input.dispatchEvent(new Event("input"));
            fixture.detectChanges();

            expect(host.completeEvents).toEqual(["1234", "1235"]);
        });

        it("overwrites subsequent slots when typing at an earlier slot in a full code", async () => {
            host.length.set(6);
            host.value.set("123456");
            fixture.detectChanges();
            await fixture.whenStable();

            const input = getNativeInput();
            const slots = getSlots();

            // Click first slot (0)
            slots[0].dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true }));
            fixture.detectChanges();
            expect(input.selectionStart).toBe(0);
            expect(input.selectionEnd).toBe(1);

            // Type '9' replacing slot 0
            const keydown9 = new KeyboardEvent("keydown", { key: "9", bubbles: true, cancelable: true });
            input.dispatchEvent(keydown9);
            input.value = "923456";
            input.setSelectionRange(1, 1);
            input.dispatchEvent(new Event("input"));
            fixture.detectChanges();

            expect(host.value()).toBe("923456");
            expect(input.selectionStart).toBe(1);
            expect(input.selectionEnd).toBe(1);

            // Type '8' at collapsed caret (1, 1) — keydown should select slot 1 for overwrite
            const keydown8 = new KeyboardEvent("keydown", { key: "8", bubbles: true, cancelable: true });
            input.dispatchEvent(keydown8);

            expect(input.selectionStart).toBe(1);
            expect(input.selectionEnd).toBe(2);

            input.value = "983456";
            input.setSelectionRange(2, 2);
            input.dispatchEvent(new Event("input"));
            fixture.detectChanges();

            expect(host.value()).toBe("983456");

            // Type '7' at collapsed caret (2, 2)
            const keydown7 = new KeyboardEvent("keydown", { key: "7", bubbles: true, cancelable: true });
            input.dispatchEvent(keydown7);

            expect(input.selectionStart).toBe(2);
            expect(input.selectionEnd).toBe(3);

            input.value = "987456";
            input.setSelectionRange(3, 3);
            input.dispatchEvent(new Event("input"));
            fixture.detectChanges();

            expect(host.value()).toBe("987456");
        });

        it("prevents invalid character insertion via keydown", () => {
            host.type.set("number");
            fixture.detectChanges();

            const input = getNativeInput();
            const keydownA = new KeyboardEvent("keydown", { key: "a", bubbles: true, cancelable: true });
            const notCancelled = input.dispatchEvent(keydownA);

            expect(notCancelled).toBe(false);
            expect(keydownA.defaultPrevented).toBe(true);
        });

        it("prevents keydown when input is full and caret is at end", async () => {
            host.length.set(4);
            host.value.set("1234");
            fixture.detectChanges();
            await fixture.whenStable();

            const input = getNativeInput();
            input.setSelectionRange(4, 4);

            const keydown5 = new KeyboardEvent("keydown", { key: "5", bubbles: true, cancelable: true });
            const notCancelled = input.dispatchEvent(keydown5);

            expect(notCancelled).toBe(false);
            expect(keydown5.defaultPrevented).toBe(true);
        });

        it("handles beforeinput insertText overwrite mode", async () => {
            host.length.set(4);
            host.value.set("1234");
            fixture.detectChanges();
            await fixture.whenStable();

            const input = getNativeInput();
            input.setSelectionRange(1, 1);

            const beforeInputEvent = new InputEvent("beforeinput", {
                bubbles: true,
                cancelable: true,
                data: "9",
                inputType: "insertText"
            });
            input.dispatchEvent(beforeInputEvent);

            expect(input.selectionStart).toBe(1);
            expect(input.selectionEnd).toBe(2);
        });
    });

    describe("Paste Behavior", () => {
        it("handles complete paste and emits complete", () => {
            const input = getNativeInput();
            const pasteEvent = createPasteEvent("9876");

            input.dispatchEvent(pasteEvent);
            fixture.detectChanges();

            expect(host.value()).toBe("9876");
            expect(host.touchCount).toBe(1);
            expect(host.completeEvents).toEqual(["9876"]);
        });

        it("sanitizes formatted paste payload before truncating", () => {
            const input = getNativeInput();
            const pasteEvent = createPasteEvent("1-2-3-4-5-6");

            input.dispatchEvent(pasteEvent);
            fixture.detectChanges();

            expect(host.value()).toBe("1234");
        });

        it("replaces selected range during paste", () => {
            host.value.set("1234");
            fixture.detectChanges();

            const input = getNativeInput();
            input.setSelectionRange(1, 3); // selected "23"

            const pasteEvent = createPasteEvent("98");

            input.dispatchEvent(pasteEvent);
            fixture.detectChanges();

            expect(host.value()).toBe("1984");
        });

        it("ignores paste when disabled or readonly", () => {
            host.disabled.set(true);
            fixture.detectChanges();

            const input = getNativeInput();
            const pasteEvent = createPasteEvent("9876");

            input.dispatchEvent(pasteEvent);
            fixture.detectChanges();

            expect(host.value()).toBe("");
        });
    });

    describe("Composition / IME", () => {
        it("buffers during composition and normalizes on compositionend", () => {
            const input = getNativeInput();
            input.dispatchEvent(new Event("compositionstart"));
            fixture.detectChanges();

            input.value = "abc1";
            input.dispatchEvent(new Event("input"));
            fixture.detectChanges();

            // While composing, value should not be prematurely altered
            const compEndEvent = new Event("compositionend", { bubbles: true });
            input.dispatchEvent(compEndEvent);
            fixture.detectChanges();

            expect(host.value()).toBe("abc1");
        });
    });

    describe("Pointer Interaction and Focus", () => {
        it("clicking a filled slot selects that character and focuses input", () => {
            host.value.set("1234");
            fixture.detectChanges();

            const slots = getSlots();
            const input = getNativeInput();
            const focusSpy = vi.spyOn(input, "focus");

            slots[1].dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true }));
            fixture.detectChanges();

            expect(focusSpy).toHaveBeenCalled();
            expect(input.selectionStart).toBe(1);
            expect(input.selectionEnd).toBe(2);
        });

        it("clicking an empty slot positions caret at current value length", () => {
            host.value.set("12");
            fixture.detectChanges();

            const slots = getSlots();
            const input = getNativeInput();

            slots[3].dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true }));
            fixture.detectChanges();

            expect(input.selectionStart).toBe(2);
            expect(input.selectionEnd).toBe(2);
        });

        it("public focus(index) clamps index and focuses input", () => {
            const otpComponentDebug = fixture.debugElement.query(By.directive(OtpInputComponent));
            const otpComponent = otpComponentDebug.componentInstance as OtpInputComponent;
            const input = getNativeInput();

            otpComponent.focus(2);
            fixture.detectChanges();

            expect(document.activeElement).toBe(input);
        });

        it("public blur() blurs native input and emits blur and touch", () => {
            const otpComponentDebug = fixture.debugElement.query(By.directive(OtpInputComponent));
            const otpComponent = otpComponentDebug.componentInstance as OtpInputComponent;
            const input = getNativeInput();

            input.focus();
            fixture.detectChanges();

            expect(host.focusEvents.length).toBe(1);

            otpComponent.blur();
            fixture.detectChanges();

            expect(host.blurEvents.length).toBe(1);
            expect(host.touchCount).toBeGreaterThan(0);
        });
    });

    describe("Grouping and Separators", () => {
        it("renders uniform number groups and separators", async () => {
            host.length.set(6);
            host.groupLength.set(2);
            host.separator.set("-");
            host.value.set("123456");
            fixture.detectChanges();
            await fixture.whenStable();

            const groupContainers = fixture.debugElement.queryAll(By.css("[data-group-index]"));
            expect(groupContainers.length).toBe(3);

            const separatorSpans = fixture.debugElement.queryAll(By.css("span.text-muted-foreground"));
            expect(separatorSpans.length).toBe(2);
            separatorSpans.forEach(sep => {
                expect(sep.nativeElement.textContent.trim()).toBe("-");
                expect(sep.nativeElement.getAttribute("aria-hidden")).toBe("true");
            });
        });

        it("renders unequal array groups", async () => {
            host.length.set(6);
            host.groupLength.set([2, 4]);
            host.separator.set("/");
            fixture.detectChanges();
            await fixture.whenStable();

            const groupContainers = fixture.debugElement.queryAll(By.css("[data-group-index]"));
            expect(groupContainers.length).toBe(2);
            expect(groupContainers[0].queryAll(By.css(".otp-slot")).length).toBe(2);
            expect(groupContainers[1].queryAll(By.css(".otp-slot")).length).toBe(4);
        });

        it("renders custom separator template directive", async () => {
            host.length.set(6);
            host.groupLength.set(3);
            host.useCustomSeparator.set(true);
            fixture.detectChanges();
            await fixture.whenStable();

            const customSeps = fixture.debugElement.queryAll(By.css(".custom-sep"));
            expect(customSeps.length).toBe(1);
            expect(customSeps[0].nativeElement.textContent.trim()).toBe("/0");
        });
    });

    describe("Appearance and Joined Layout", () => {
        it("applies joined border and rounded classes when spacing=false", async () => {
            host.length.set(4);
            host.spacing.set(false);
            host.rounded.set("medium");
            fixture.detectChanges();
            await fixture.whenStable();

            const slots = getSlots();
            expect(slots[0].className).toContain("rounded-s-md");
            expect(slots[1].className).toContain("rounded-none");
            expect(slots[2].className).toContain("rounded-none");
            expect(slots[3].className).toContain("rounded-e-md");
        });

        it("merges userClass and slotClass correctly", async () => {
            host.userClass.set("custom-host-class");
            host.slotClass.set("custom-slot-class");
            fixture.detectChanges();
            await fixture.whenStable();

            const hostEl = getHostElement();
            expect(hostEl.className).toContain("custom-host-class");

            const slots = getSlots();
            slots.forEach(slot => {
                expect(slot.className).toContain("custom-slot-class");
            });
        });
    });

    describe("States: Disabled, Readonly, Required, Invalid", () => {
        it("reflects disabled state on native input, host, and slots", () => {
            host.disabled.set(true);
            fixture.detectChanges();

            const input = getNativeInput();
            expect(input.disabled).toBe(true);

            const hostEl = getHostElement();
            expect(hostEl.getAttribute("data-disabled")).toBe("true");

            const slots = getSlots();
            slots.forEach(slot => {
                expect(slot.getAttribute("data-disabled")).toBe("true");
            });
        });

        it("reflects readonly state without disabling native input", () => {
            host.readonly.set(true);
            fixture.detectChanges();

            const input = getNativeInput();
            expect(input.readOnly).toBe(true);
            expect(input.disabled).toBe(false);

            const hostEl = getHostElement();
            expect(hostEl.getAttribute("data-readonly")).toBe("true");
        });

        it("reflects invalid state when touched and required incomplete", () => {
            host.required.set(true);
            host.touched.set(true);
            host.value.set("12");
            fixture.detectChanges();

            const hostEl = getHostElement();
            expect(hostEl.getAttribute("data-invalid")).toBe("true");

            const input = getNativeInput();
            expect(input.getAttribute("aria-invalid")).toBe("true");
        });
    });

    describe("Attribute Forwarding and Sanitization", () => {
        it("forwards safe custom attributes to native input", () => {
            host.inputAttributes.set({
                "aria-describedby": "otp-help-text",
                id: "test-otp-input",
                name: "otpName"
            });
            fixture.detectChanges();

            const input = getNativeInput();
            expect(input.id).toBe("test-otp-input");
            expect(input.name).toBe("otpName");
            expect(input.getAttribute("aria-describedby")).toBe("otp-help-text");
        });

        it("does not allow reserved attributes to override component mechanics", () => {
            host.inputAttributes.set({
                disabled: false,
                maxlength: 99,
                type: "checkbox",
                value: "hacked"
            });
            host.disabled.set(true);
            fixture.detectChanges();

            const input = getNativeInput();
            expect(input.type).toBe("text");
            expect(input.disabled).toBe(true);
            expect(input.maxLength).toBe(4);
        });
    });

    describe("Accessibility (axe-core)", () => {
        it("passes axe accessibility checks on default configuration", async () => {
            const results = await axe.run(getHostElement());
            expect(results.violations).toEqual([]);
        });

        it("passes axe checks with disabled, readonly, and required states", async () => {
            host.disabled.set(true);
            fixture.detectChanges();
            let results = await axe.run(getHostElement());
            expect(results.violations).toEqual([]);

            host.disabled.set(false);
            host.readonly.set(true);
            fixture.detectChanges();
            results = await axe.run(getHostElement());
            expect(results.violations).toEqual([]);

            host.readonly.set(false);
            host.required.set(true);
            host.touched.set(true);
            fixture.detectChanges();
            results = await axe.run(getHostElement());
            expect(results.violations).toEqual([]);
        });
    });
});

describe("OtpInputComponent with Signal Forms", () => {
    let fixture: ComponentFixture<SignalFormHostComponent>;
    let host: SignalFormHostComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SignalFormHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(SignalFormHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("binds initial form value and updates form on user input", () => {
        const inputDebug = fixture.debugElement.query(By.css("input"));
        const input = inputDebug.nativeElement as HTMLInputElement;

        input.value = "123456";
        input.dispatchEvent(new Event("input"));
        fixture.detectChanges();

        expect(host.form.code().value()).toBe("123456");
        expect(host.form.code().touched()).toBe(true);
        expect(host.completeEvents).toEqual(["123456"]);
    });

    it("propagates disabled, readonly, and required form field states", () => {
        const inputDebug = fixture.debugElement.query(By.css("input"));
        const input = inputDebug.nativeElement as HTMLInputElement;

        host.isFieldDisabled.set(true);
        fixture.detectChanges();
        expect(input.disabled).toBe(true);

        host.isFieldDisabled.set(false);
        host.isFieldReadonly.set(true);
        fixture.detectChanges();
        expect(input.readOnly).toBe(true);
    });
});
