import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { disabled, form, FormField, readonly } from "@angular/forms/signals";
import { MONA_DEFAULT_LOCALE, MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { TimeSelectorComponent } from "./time-selector.component";

describe("TimeSelectorComponent", () => {
    let fixture: ComponentFixture<TimeSelectorHostComponent>;

    beforeEach(() => {
        HTMLElement.prototype.scrollIntoView = vi.fn();
        TestBed.configureTestingModule({
            imports: [TimeSelectorHostComponent]
        });
        fixture = TestBed.createComponent(TimeSelectorHostComponent);
        fixture.detectChanges();
    });

    it("renders the signal-form value as the selected time", () => {
        expect(getSelectedOption("Hours").textContent?.trim()).toBe("09");
        expect(getSelectedOption("Minutes").textContent?.trim()).toBe("30");
    });

    it("uses muted structure and neutral selected time values", () => {
        const host = getHost();
        const header = host.firstElementChild as HTMLElement;
        const selectedHour = getSelectedOption("Hours");
        const hourList = host.querySelector("ol[aria-label='Hours']") as HTMLElement;

        expect(header.classList.contains("bg-surface-muted")).toBe(true);
        expect(header.classList.contains("border-border-subtle")).toBe(true);
        expect(selectedHour.classList.contains("bg-active")).toBe(true);
        expect(selectedHour.classList.contains("bg-primary")).toBe(false);
        expect(hourList.classList.contains("h-32")).toBe(true);
        expect(hourList.classList.contains("focus-visible:bg-(--color-focus-surface)")).toBe(true);
        expect(hourList.classList.contains("focus-within:bg-(--color-focus-surface)")).toBe(true);
    });

    it("updates the signal-form value when an option is selected without a footer", () => {
        getOption("Minutes", "45").click();
        fixture.detectChanges();

        expect(fixture.componentInstance.form.time().value()?.getMinutes()).toBe(45);
    });

    it("does not update the signal-form value while disabled", () => {
        fixture.componentInstance.disabled.set(true);
        fixture.detectChanges();

        getOption("Minutes", "45").click();
        fixture.detectChanges();

        expect(fixture.componentInstance.form.time().value()?.getMinutes()).toBe(30);
        expect(getHost().getAttribute("aria-disabled")).toBe("true");
    });

    it("does not update the signal-form value while readonly", () => {
        fixture.componentInstance.readonly.set(true);
        fixture.detectChanges();

        getOption("Minutes", "45").click();
        fixture.detectChanges();

        expect(fixture.componentInstance.form.time().value()?.getMinutes()).toBe(30);
        expect(getHost().getAttribute("aria-readonly")).toBe("true");
    });

    it("renders default english accessible labels and messages", () => {
        const host = getHost();
        expect(host.getAttribute("aria-label")).toBe("Time selector");

        const headerDivs = host.querySelectorAll(".flex.text-xs > div");
        expect(headerDivs[0]?.textContent?.trim()).toBe("Hr");
        expect(headerDivs[1]?.textContent?.trim()).toBe("Min");

        const nowBtn = host.querySelector("button[monaButton]") as HTMLButtonElement;
        expect(nowBtn?.textContent?.trim()).toBe("Now");

        expect(host.querySelector("ol[aria-label='Hours']")).not.toBeNull();
        expect(host.querySelector("ol[aria-label='Minutes']")).not.toBeNull();

        fixture.componentInstance.footer.set(true);
        fixture.detectChanges();
        const setBtn = host.querySelectorAll("button[monaButton]")[1] as HTMLButtonElement;
        expect(setBtn?.textContent?.trim()).toBe("Set");
    });

    it("updates messages dynamically when locale changes", () => {
        const i18n = TestBed.inject(MonaI18nService);
        i18n.use({
            ...MONA_DEFAULT_LOCALE,
            messages: {
                timeSelector: {
                    am: "ÖÖ",
                    amPm: "ÖÖ/ÖS",
                    headerHours: "Sa",
                    headerMinutes: "Dk",
                    headerSeconds: "Sn",
                    hours: "Saatler",
                    minutes: "Dakikalar",
                    now: "Şimdi",
                    pm: "ÖS",
                    seconds: "Saniyeler",
                    set: "Ayarla",
                    timeSelector: "Zaman seçici"
                }
            }
        });
        fixture.componentInstance.footer.set(true);
        fixture.detectChanges();

        const host = getHost();
        expect(host.getAttribute("aria-label")).toBe("Zaman seçici");

        const headerDivs = host.querySelectorAll(".flex.text-xs > div");
        expect(headerDivs[0]?.textContent?.trim()).toBe("Sa");
        expect(headerDivs[1]?.textContent?.trim()).toBe("Dk");

        const buttons = host.querySelectorAll("button[monaButton]");
        expect(buttons[0]?.textContent?.trim()).toBe("Şimdi");
        expect(buttons[1]?.textContent?.trim()).toBe("Ayarla");

        expect(host.querySelector("ol[aria-label='Saatler']")).not.toBeNull();
        expect(host.querySelector("ol[aria-label='Dakikalar']")).not.toBeNull();

        i18n.use(MONA_DEFAULT_LOCALE);
    });

    it("respects consumer ariaLabel input", () => {
        fixture.componentInstance.ariaLabel.set("Meeting start time");
        fixture.detectChanges();

        expect(getHost().getAttribute("aria-label")).toBe("Meeting start time");
    });

    it("inverts horizontal arrow navigation in RTL mode", () => {
        const i18n = TestBed.inject(MonaI18nService);
        const host = getHost();
        const hourList = host.querySelector("ol[aria-label='Hours']") as HTMLElement;

        hourList.focus();
        host.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
        fixture.detectChanges();
        const minuteList = host.querySelector("ol[aria-label='Minutes']") as HTMLElement;
        expect(document.activeElement).toBe(minuteList);

        i18n.use({
            ...MONA_DEFAULT_LOCALE,
            direction: "rtl"
        });
        fixture.detectChanges();

        host.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
        fixture.detectChanges();
        expect(document.activeElement).toBe(hourList);

        host.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
        fixture.detectChanges();
        expect(document.activeElement).toBe(minuteList);

        i18n.use(MONA_DEFAULT_LOCALE);
    });

    function getHost(): HTMLElement {
        const host = fixture.nativeElement.querySelector("mona-time-selector");
        if (!(host instanceof HTMLElement)) {
            throw new Error("Expected time selector host");
        }
        return host;
    }

    function getOption(listLabel: string, value: string): HTMLLIElement {
        const option = fixture.nativeElement.querySelector(`ol[aria-label="${listLabel}"] li[data-value="${value}"]`);
        if (!(option instanceof HTMLLIElement)) {
            throw new Error(`Expected ${listLabel} option ${value}`);
        }
        return option;
    }

    function getSelectedOption(listLabel: string): HTMLLIElement {
        const option = fixture.nativeElement.querySelector(`ol[aria-label="${listLabel}"] li[aria-selected="true"]`);
        if (!(option instanceof HTMLLIElement)) {
            throw new Error(`Expected selected ${listLabel} option`);
        }
        return option;
    }
});

interface TimeSelectorFormModel {
    time: Date | null;
}

@Component({
    imports: [TimeSelectorComponent, FormField],
    template: `
        <mona-time-selector
            [formField]="form.time"
            [focusOnMount]="false"
            [footer]="footer()"
            [ariaLabel]="ariaLabel()"></mona-time-selector>
    `
})
class TimeSelectorHostComponent {
    readonly #model = signal<TimeSelectorFormModel>({ time: new Date(2026, 0, 2, 9, 30) });

    public readonly ariaLabel = signal("");
    public readonly disabled = signal(false);
    public readonly footer = signal(false);
    public readonly form = form(this.#model, schema => {
        disabled(schema.time, { when: () => this.disabled() });
        readonly(schema.time, { when: () => this.readonly() });
    });
    public readonly readonly = signal(false);
}
