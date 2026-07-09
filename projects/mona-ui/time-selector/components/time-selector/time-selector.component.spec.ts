import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { disabled, form, FormField, readonly } from "@angular/forms/signals";
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

@Component({
    imports: [TimeSelectorComponent, FormField],
    template: `
        <mona-time-selector [formField]="form.time" [focusOnMount]="false" [footer]="false"></mona-time-selector>
    `
})
class TimeSelectorHostComponent {
    public readonly disabled = signal(false);
    public readonly readonly = signal(false);
    readonly #model = signal<TimeSelectorFormModel>({ time: new Date(2026, 0, 2, 9, 30) });
    public readonly form = form(this.#model, schema => {
        disabled(schema.time, { when: () => this.disabled() });
        readonly(schema.time, { when: () => this.readonly() });
    });
}

interface TimeSelectorFormModel {
    time: Date | null;
}
