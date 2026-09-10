import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import {
    getNumberFormatter,
    getNumberSymbols,
    MonaI18nService,
    type MonaLocale,
    parseLocalizedNumber
} from "@nanahoshi/mona-ui/i18n";
import { describe, expect, it } from "vitest";
import { NumericTextBoxComponent } from "./numeric-text-box.component";

@Component({
    template: `
        <mona-numeric-text-box
            [(value)]="value"
            [decimals]="decimals()">
        </mona-numeric-text-box>
    `,
    imports: [NumericTextBoxComponent]
})
class NumericTextBoxI18nTestHostComponent {
    public readonly decimals = signal(2);
    public readonly value = signal<number | null>(null);
}

async function waitForStable(fixture: ComponentFixture<unknown>): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
}

function getInput(fixture: ComponentFixture<unknown>): HTMLInputElement {
    return fixture.debugElement.query(By.css("input")).nativeElement as HTMLInputElement;
}

function focusInput(input: HTMLInputElement): void {
    input.dispatchEvent(new FocusEvent("focus", { bubbles: true }));
}

function blurInput(input: HTMLInputElement): void {
    input.dispatchEvent(new FocusEvent("blur", { bubbles: true }));
}

function updateInputValue(fixture: ComponentFixture<unknown>, value: string): void {
    const input = getInput(fixture);
    input.value = value;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    fixture.detectChanges();
}

const TR_LOCALE: MonaLocale = {
    direction: "ltr",
    id: "tr-TR",
    messages: {
        numericTextBox: {
            decrease: "Değeri azalt",
            increase: "Değeri artır"
        }
    }
};

const DE_LOCALE: MonaLocale = {
    direction: "ltr",
    id: "de-DE",
    messages: {
        numericTextBox: {
            decrease: "Wert verringern",
            increase: "Wert erhöhen"
        }
    }
};

const FR_LOCALE: MonaLocale = {
    direction: "ltr",
    id: "fr-FR",
    messages: {
        numericTextBox: {
            decrease: "Diminuer la valeur",
            increase: "Augmenter la valeur"
        }
    }
};

describe("Numeric locale infrastructure", () => {
    describe("getNumberSymbols", () => {
        it("returns correct symbols for standard locales", () => {
            const enSymbols = getNumberSymbols("en-US");
            expect(enSymbols.decimal).toBe(".");
            expect(enSymbols.group).toBe(",");

            const deSymbols = getNumberSymbols("de-DE");
            expect(deSymbols.decimal).toBe(",");
            expect(deSymbols.group).toBe(".");

            const trSymbols = getNumberSymbols("tr-TR");
            expect(trSymbols.decimal).toBe(",");
            expect(trSymbols.group).toBe(".");
        });
    });

    describe("parseLocalizedNumber", () => {
        it("parses en-US numbers with commas as grouping", () => {
            expect(parseLocalizedNumber("1,234.5", "en-US")).toBe(1234.5);
            expect(parseLocalizedNumber("1234.5", "en-US")).toBe(1234.5);
            expect(parseLocalizedNumber("-12.5", "en-US")).toBe(-12.5);
        });

        it("parses de-DE numbers without confusing decimal comma with grouping", () => {
            expect(parseLocalizedNumber("1.234,5", "de-DE")).toBe(1234.5);
            expect(parseLocalizedNumber("12,5", "de-DE")).toBe(12.5);
            expect(parseLocalizedNumber("12,5", "de-DE")).not.toBe(125);
            // In strict locale mode, "12.5" is rejected as non-canonical paste; in edit mode it is accepted
            expect(parseLocalizedNumber("12.5", "de-DE", { mode: "locale" })).toBeNull();
            expect(parseLocalizedNumber("12.5", "de-DE", { mode: "edit" })).toBe(12.5);
        });

        it("parses tr-TR decimal comma numbers accurately", () => {
            expect(parseLocalizedNumber("12,5", "tr-TR")).toBe(12.5);
            expect(parseLocalizedNumber("1.234,5", "tr-TR")).toBe(1234.5);
            expect(parseLocalizedNumber("\u221212,5", "tr-TR")).toBe(-12.5);
            expect(parseLocalizedNumber("12.5", "tr-TR", { mode: "locale" })).toBeNull();
            expect(parseLocalizedNumber("12.5", "tr-TR", { mode: "edit" })).toBe(12.5);
        });

        it("parses fr-FR numbers with space/narrow-space grouping", () => {
            expect(parseLocalizedNumber("1 234,5", "fr-FR")).toBe(1234.5);
            expect(parseLocalizedNumber("1\u202F234,5", "fr-FR")).toBe(1234.5);
            expect(parseLocalizedNumber("1\u00A0234,5", "fr-FR")).toBe(1234.5);
        });

        it("handles null, empty, and invalid strings gracefully", () => {
            expect(parseLocalizedNumber(null, "en-US")).toBeNull();
            expect(parseLocalizedNumber("", "en-US")).toBeNull();
            expect(parseLocalizedNumber("-", "en-US")).toBeNull();
            expect(parseLocalizedNumber("abc", "en-US")).toBeNull();
        });
    });

    describe("getNumberFormatter options normalization", () => {
        it("returns identical formatter instance regardless of option key order", () => {
            const f1 = getNumberFormatter("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
            const f2 = getNumberFormatter("en-US", { maximumFractionDigits: 4, minimumFractionDigits: 2 });
            expect(f1).toBe(f2);
        });
    });
});

describe("NumericTextBoxComponent i18n integration", () => {
    it("parses and displays values correctly across en-US, de-DE, tr-TR, and fr-FR", async () => {
        await TestBed.configureTestingModule({
            imports: [NumericTextBoxI18nTestHostComponent]
        }).compileComponents();

        const fixture = TestBed.createComponent(NumericTextBoxI18nTestHostComponent);
        const host = fixture.componentInstance;
        const i18n = TestBed.inject(MonaI18nService);
        await waitForStable(fixture);

        const input = getInput(fixture);

        // 1. en-US test
        focusInput(input);
        await waitForStable(fixture);
        updateInputValue(fixture, "1,234.5");
        await waitForStable(fixture);
        expect(host.value()).toBe(1234.5);
        blurInput(input);
        await waitForStable(fixture);
        expect(input.value).toBe("1234.50");

        // 2. de-DE test
        i18n.use(DE_LOCALE);
        await waitForStable(fixture);
        expect(input.value).toBe("1234,50");

        focusInput(input);
        await waitForStable(fixture);
        expect(input.value).toBe("1234,5");

        updateInputValue(fixture, "12,5");
        await waitForStable(fixture);
        expect(host.value()).toBe(12.5);
        expect(host.value()).not.toBe(125);

        updateInputValue(fixture, "1.234,5");
        await waitForStable(fixture);
        expect(host.value()).toBe(1234.5);

        blurInput(input);
        await waitForStable(fixture);
        expect(input.value).toBe("1234,50");

        // 3. tr-TR test
        i18n.use(TR_LOCALE);
        await waitForStable(fixture);
        expect(input.value).toBe("1234,50");

        focusInput(input);
        await waitForStable(fixture);
        updateInputValue(fixture, "12,5");
        await waitForStable(fixture);
        expect(host.value()).toBe(12.5);

        blurInput(input);
        await waitForStable(fixture);
        expect(input.value).toBe("12,50");

        // 4. fr-FR test
        i18n.use(FR_LOCALE);
        await waitForStable(fixture);
        expect(input.value).toBe("12,50");

        focusInput(input);
        await waitForStable(fixture);
        updateInputValue(fixture, "1 234,5");
        await waitForStable(fixture);
        expect(host.value()).toBe(1234.5);

        blurInput(input);
        await waitForStable(fixture);
        expect(input.value).toBe("1234,50");
    });

    it("updates input value reactively on dynamic locale switch while focused and blurred", async () => {
        await TestBed.configureTestingModule({
            imports: [NumericTextBoxI18nTestHostComponent]
        }).compileComponents();

        const fixture = TestBed.createComponent(NumericTextBoxI18nTestHostComponent);
        const host = fixture.componentInstance;
        const i18n = TestBed.inject(MonaI18nService);
        host.value.set(12.5);
        await waitForStable(fixture);

        const input = getInput(fixture);

        // While blurred: en-US -> 12.50
        expect(input.value).toBe("12.50");

        // Dynamic switch while blurred: de-DE -> 12,50
        i18n.use(DE_LOCALE);
        await waitForStable(fixture);
        expect(input.value).toBe("12,50");

        // Focus input: shows edit representation 12,5
        focusInput(input);
        await waitForStable(fixture);
        expect(input.value).toBe("12,5");

        // Dynamic switch while focused: en-US -> 12.5
        i18n.use({ id: "en-US", direction: "ltr", messages: {} });
        await waitForStable(fixture);
        expect(input.value).toBe("12.5");

        // Blur input: en-US -> 12.50
        blurInput(input);
        await waitForStable(fixture);
        expect(input.value).toBe("12.50");
    });

    it("renders inputmode='decimal' when decimals > 0 and inputmode='numeric' when decimals === 0", async () => {
        await TestBed.configureTestingModule({
            imports: [NumericTextBoxI18nTestHostComponent]
        }).compileComponents();

        const fixture = TestBed.createComponent(NumericTextBoxI18nTestHostComponent);
        const host = fixture.componentInstance;
        await waitForStable(fixture);

        const input = getInput(fixture);
        expect(input.getAttribute("inputmode")).toBe("decimal");

        host.decimals.set(0);
        await waitForStable(fixture);
        expect(input.getAttribute("inputmode")).toBe("numeric");
    });

    it("supports sequential typing with alternate dot in comma-decimal locales without corrupting semantic value", async () => {
        await TestBed.configureTestingModule({
            imports: [NumericTextBoxI18nTestHostComponent]
        }).compileComponents();

        const fixture = TestBed.createComponent(NumericTextBoxI18nTestHostComponent);
        const host = fixture.componentInstance;
        const i18n = TestBed.inject(MonaI18nService);
        host.decimals.set(3);
        i18n.use(DE_LOCALE);
        await waitForStable(fixture);

        const input = getInput(fixture);
        focusInput(input);
        await waitForStable(fixture);

        async function typeChar(char: string): Promise<void> {
            const start = input.selectionStart ?? input.value.length;
            const end = input.selectionEnd ?? input.value.length;
            const event = new InputEvent("beforeinput", {
                bubbles: true,
                cancelable: true,
                data: char,
                inputType: "insertText"
            });
            const allowed = input.dispatchEvent(event);
            if (allowed && !event.defaultPrevented) {
                input.value = input.value.slice(0, start) + char + input.value.slice(end);
                input.selectionStart = input.selectionEnd = start + char.length;
                input.dispatchEvent(new Event("input", { bubbles: true }));
                await waitForStable(fixture);
            }
        }

        // Type 1 . 2 3 4 in de-DE
        await typeChar("1");
        expect(host.value()).toBe(1);
        await typeChar(".");
        expect(host.value()).toBe(1);
        await typeChar("2");
        expect(host.value()).toBe(1.2);
        await typeChar("3");
        expect(host.value()).toBe(1.23);
        await typeChar("4");
        // Must be 1.234 and NEVER silently become 1234
        expect(host.value()).toBe(1.234);
        expect(host.value()).not.toBe(1234);

        // Test tr-TR with 0 . 1 2 3
        i18n.use(TR_LOCALE);
        host.value.set(null);
        await waitForStable(fixture);
        focusInput(input);
        await waitForStable(fixture);

        await typeChar("0");
        expect(host.value()).toBe(0);
        await typeChar(".");
        expect(host.value()).toBe(0);
        await typeChar("1");
        expect(host.value()).toBe(0.1);
        await typeChar("2");
        expect(host.value()).toBe(0.12);
        await typeChar("3");
        // Must be 0.123 and NEVER 123
        expect(host.value()).toBe(0.123);
        expect(host.value()).not.toBe(123);

        // Test native comma in de-DE
        i18n.use(DE_LOCALE);
        host.value.set(null);
        await waitForStable(fixture);
        focusInput(input);
        await waitForStable(fixture);

        await typeChar("1");
        await typeChar(",");
        await typeChar("2");
        await typeChar("3");
        await typeChar("4");
        expect(host.value()).toBe(1.234);
    });

    it("supports pasting localized grouped numbers across locales and validates decimals", async () => {
        await TestBed.configureTestingModule({
            imports: [NumericTextBoxI18nTestHostComponent]
        }).compileComponents();

        const fixture = TestBed.createComponent(NumericTextBoxI18nTestHostComponent);
        const host = fixture.componentInstance;
        const i18n = TestBed.inject(MonaI18nService);
        host.decimals.set(2);
        await waitForStable(fixture);

        const input = getInput(fixture);
        focusInput(input);
        await waitForStable(fixture);

        function paste(text: string): boolean {
            input.value = "";
            input.selectionStart = input.selectionEnd = 0;
            const event = new InputEvent("beforeinput", {
                bubbles: true,
                cancelable: true,
                data: text,
                inputType: "insertFromPaste"
            });
            const allowed = input.dispatchEvent(event);
            if (allowed && !event.defaultPrevented) {
                input.value = text;
                input.selectionStart = input.selectionEnd = text.length;
                input.dispatchEvent(new Event("input", { bubbles: true }));
                fixture.detectChanges();
                return true;
            }
            return false;
        }

        // en-US paste
        expect(paste("1,234.5")).toBe(true);
        expect(host.value()).toBe(1234.5);

        // de-DE paste
        i18n.use(DE_LOCALE);
        await waitForStable(fixture);
        expect(paste("1.234,5")).toBe(true);
        expect(host.value()).toBe(1234.5);

        // fr-FR paste
        i18n.use(FR_LOCALE);
        await waitForStable(fixture);
        expect(paste("1 234,5")).toBe(true);
        expect(host.value()).toBe(1234.5);

        // ar-SA paste
        i18n.use({ id: "ar-SA", direction: "rtl", messages: {} });
        await waitForStable(fixture);
        expect(paste("١٢٬٣٤٥٫٦")).toBe(true);
        expect(host.value()).toBe(12345.6);

        // Reject paste that exceeds decimals limit (decimals is 2, paste has 3 decimals)
        i18n.use({ id: "en-US", direction: "ltr", messages: {} });
        await waitForStable(fixture);
        expect(paste("1,234.567")).toBe(false);

        // Reject paste with fractional decimals when decimals is 0
        host.decimals.set(0);
        await waitForStable(fixture);
        expect(paste("1,234.5")).toBe(false);
        // But integer paste is allowed
        expect(paste("1,234")).toBe(true);
        expect(host.value()).toBe(1234);

        // de-DE grouped integer paste at decimals=0, 2, 3
        i18n.use(DE_LOCALE);
        await waitForStable(fixture);

        host.decimals.set(0);
        await waitForStable(fixture);
        expect(paste("1.234")).toBe(true);
        expect(host.value()).toBe(1234);

        host.decimals.set(2);
        await waitForStable(fixture);
        expect(paste("1.234")).toBe(true);
        expect(host.value()).toBe(1234);

        host.decimals.set(3);
        await waitForStable(fixture);
        expect(paste("1.234")).toBe(true);
        expect(host.value()).toBe(1234);

        expect(paste("12,5")).toBe(true);
        expect(host.value()).toBe(12.5);

        // Sequential typing of 1.234 in de-DE with decimals=3 interprets '.' as alternate decimal
        function typeChar(char: string): boolean {
            const start = input.selectionStart ?? input.value.length;
            const end = input.selectionEnd ?? input.value.length;
            const event = new InputEvent("beforeinput", {
                bubbles: true,
                cancelable: true,
                data: char,
                inputType: "insertText"
            });
            const allowed = input.dispatchEvent(event);
            if (allowed && !event.defaultPrevented) {
                input.value = input.value.slice(0, start) + char + input.value.slice(end);
                input.selectionStart = input.selectionEnd = start + char.length;
                input.dispatchEvent(new Event("input", { bubbles: true }));
                fixture.detectChanges();
                return true;
            }
            return false;
        }

        input.value = "";
        input.selectionStart = input.selectionEnd = 0;
        expect(typeChar("1")).toBe(true);
        expect(typeChar(".")).toBe(true);
        expect(typeChar("2")).toBe(true);
        expect(typeChar("3")).toBe(true);
        expect(typeChar("4")).toBe(true);
        expect(host.value()).toBe(1.234);

        // Unicode paste precision validation
        host.decimals.set(2);
        await waitForStable(fixture);

        // bn-BD (Bengali digits)
        i18n.use({ id: "bn-BD", direction: "ltr", messages: {} });
        await waitForStable(fixture);
        expect(paste("১২.৩৪")).toBe(true);
        expect(host.value()).toBe(12.34);
        expect(paste("১২.৩৪৫")).toBe(false);

        // mr-IN (Devanagari digits)
        i18n.use({ id: "mr-IN", direction: "ltr", messages: {} });
        await waitForStable(fixture);
        expect(paste("१२.३४")).toBe(true);
        expect(host.value()).toBe(12.34);
        expect(paste("१२.३४५")).toBe(false);
    });

    it("handles realistic browser paste event sequence with null beforeinput.data and validates precision", async () => {
        await TestBed.configureTestingModule({
            imports: [NumericTextBoxI18nTestHostComponent]
        }).compileComponents();

        const fixture = TestBed.createComponent(NumericTextBoxI18nTestHostComponent);
        const host = fixture.componentInstance;
        const i18n = TestBed.inject(MonaI18nService);
        host.decimals.set(2);
        await waitForStable(fixture);

        const input = getInput(fixture);
        focusInput(input);
        await waitForStable(fixture);

        // Helper that simulates real browser paste sequence:
        // 1. paste event with ClipboardEvent.clipboardData
        // 2. beforeinput event with data: null and inputType: "insertFromPaste"
        // 3. input change event
        function simulateBrowserPaste(clipboardText: string): boolean {
            const pasteEvent = new Event("paste", { bubbles: true, cancelable: true }) as any;
            pasteEvent.clipboardData = {
                getData: (format: string) => (format === "text/plain" ? clipboardText : "")
            };
            const pasteAllowed = input.dispatchEvent(pasteEvent);
            if (!pasteAllowed || pasteEvent.defaultPrevented) {
                return false;
            }

            const beforeInputEvent = new InputEvent("beforeinput", {
                bubbles: true,
                cancelable: true,
                data: null,
                inputType: "insertFromPaste"
            });
            const beforeInputAllowed = input.dispatchEvent(beforeInputEvent);
            if (!beforeInputAllowed || beforeInputEvent.defaultPrevented) {
                return false;
            }

            const start = input.selectionStart ?? 0;
            const end = input.selectionEnd ?? input.value.length;
            input.value = input.value.slice(0, start) + clipboardText + input.value.slice(end);
            input.dispatchEvent(new Event("input", { bubbles: true }));
            fixture.detectChanges();
            return true;
        }

        // Case 1: en-US, decimals=2, clipboard="1.234", beforeinput.data=null -> rejected, model unchanged
        input.value = "";
        input.selectionStart = input.selectionEnd = 0;
        host.value.set(null);
        await waitForStable(fixture);
        expect(simulateBrowserPaste("1.234")).toBe(false);
        expect(host.value()).toBeNull();

        // Case 2: en-US, decimals=2, clipboard="1.23", beforeinput.data=null -> accepted as 1.23
        expect(simulateBrowserPaste("1.23")).toBe(true);
        expect(host.value()).toBe(1.23);

        // Case 3: de-DE, decimals=2, clipboard="1.234" -> accepted as 1234
        i18n.use(DE_LOCALE);
        input.value = "";
        input.selectionStart = input.selectionEnd = 0;
        host.value.set(null);
        await waitForStable(fixture);
        expect(simulateBrowserPaste("1.234")).toBe(true);
        expect(host.value()).toBe(1234);

        // Case 3b: de-DE, decimals=2, clipboard="12.5" -> rejected under strict paste
        input.value = "";
        input.selectionStart = input.selectionEnd = 0;
        host.value.set(null);
        await waitForStable(fixture);
        expect(simulateBrowserPaste("12.5")).toBe(false);
        expect(host.value()).toBeNull();

        // Case 4: Unicode digit scripts
        // bn-BD: Bengali digits (১২.৩৪ -> 12.34, ১২.৩৪৫ -> reject)
        i18n.use({ id: "bn-BD", direction: "ltr", messages: {} });
        input.value = "";
        input.selectionStart = input.selectionEnd = 0;
        host.value.set(null);
        await waitForStable(fixture);
        expect(simulateBrowserPaste("১২.৩৪")).toBe(true);
        expect(host.value()).toBe(12.34);
        expect(simulateBrowserPaste("১২.৩৪৫")).toBe(false);

        // mr-IN: Devanagari digits (१२.३४ -> 12.34, १२.३४५ -> reject)
        i18n.use({ id: "mr-IN", direction: "ltr", messages: {} });
        input.value = "";
        input.selectionStart = input.selectionEnd = 0;
        host.value.set(null);
        await waitForStable(fixture);
        expect(simulateBrowserPaste("१२.३४")).toBe(true);
        expect(host.value()).toBe(12.34);
        expect(simulateBrowserPaste("१२.३४५")).toBe(false);

        // Case 5: Partial selection replacement
        // Input has "100", select "00", paste "23" -> proposed "123"
        i18n.use({ id: "en-US", direction: "ltr", messages: {} });
        host.decimals.set(2);
        input.value = "100";
        input.selectionStart = 1;
        input.selectionEnd = 3;
        expect(simulateBrowserPaste("23")).toBe(true);
        expect(host.value()).toBe(123);

        // Multi-character non-paste input (e.g. IME or text replacement) is not treated as paste
        input.value = "";
        input.selectionStart = input.selectionEnd = 0;
        const nonPasteEvent = new InputEvent("beforeinput", {
            bubbles: true,
            cancelable: true,
            data: "12",
            inputType: "insertText"
        });
        const nonPasteAllowed = input.dispatchEvent(nonPasteEvent);
        expect(nonPasteAllowed).toBe(true);
        expect(nonPasteEvent.defaultPrevented).toBe(false);
    });

    describe("parseLocalizedNumber ambiguity contract", () => {
        it("documents generic locale parser interpretation of 1.234 in de-DE vs edit mode", () => {
            // In public generic parser, 1.234 without edit mode treats single dot with 3 digits as grouping
            expect(parseLocalizedNumber("1.234", "de-DE")).toBe(1234);

            // In edit mode with alternateDecimal enabled, 1.234 is treated as decimal 1.234
            expect(parseLocalizedNumber("1.234", "de-DE", { alternateDecimal: true })).toBe(1.234);
            expect(parseLocalizedNumber("0.123", "tr-TR", { alternateDecimal: true })).toBe(0.123);
        });
    });
});
