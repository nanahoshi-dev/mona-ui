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
            expect(parseLocalizedNumber("12.5", "de-DE")).toBe(12.5);
        });

        it("parses tr-TR decimal comma numbers accurately", () => {
            expect(parseLocalizedNumber("12,5", "tr-TR")).toBe(12.5);
            expect(parseLocalizedNumber("1.234,5", "tr-TR")).toBe(1234.5);
            expect(parseLocalizedNumber("\u221212,5", "tr-TR")).toBe(-12.5);
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
});
