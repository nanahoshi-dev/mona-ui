import { Component, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { form, FormField } from "@angular/forms/signals";
import type { HourFormat } from "@nanahoshi/mona-ui/date-input";
import { MONA_DEFAULT_LOCALE, MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TimeSelectorComponent } from "./time-selector.component";

@Component({
    template: `
        <mona-time-selector
            aria-label="Start time"
            [footer]="footer()"
            [hourFormat]="hourFormat()"
            [max]="max()"
            [min]="min()"
            [minuteStep]="minuteStep()"
            [required]="required()"
            [(value)]="value"></mona-time-selector>
    `,
    imports: [TimeSelectorComponent]
})
class SelectorHostComponent {
    public readonly footer = signal(true);
    public readonly hourFormat = signal<HourFormat | null>("24");
    public readonly max = signal<Date | undefined>(undefined);
    public readonly min = signal<Date | undefined>(undefined);
    public readonly minuteStep = signal(1);
    public readonly required = signal(false);
    public readonly value = signal<Date | null>(new Date(2025, 0, 1, 10, 0));
}

@Component({
    template: `<mona-time-selector aria-label="Start time" [formField]="form.time"></mona-time-selector>`,
    imports: [TimeSelectorComponent, FormField]
})
class FormHostComponent {
    readonly #model = signal<{ time: Date | null }>({ time: new Date(2025, 0, 1, 10, 0) });
    public readonly form = form(this.#model);
}

@Component({
    template: `<mona-time-selector aria-label="Start time" showSeconds readonly></mona-time-selector>`,
    imports: [TimeSelectorComponent]
})
class BareAttributeHostComponent {}

async function create<T>(type: new () => T, setup?: (host: T) => void): Promise<ComponentFixture<T>> {
    TestBed.configureTestingModule({ imports: [type] });
    const fixture = TestBed.createComponent(type);
    setup?.(fixture.componentInstance);
    document.body.appendChild(fixture.nativeElement as HTMLElement);
    await stable(fixture);
    return fixture;
}

function getHost(fixture: ComponentFixture<unknown>): HTMLElement {
    return (fixture.nativeElement as HTMLElement).querySelector("mona-time-selector") as HTMLElement;
}

function getList(fixture: ComponentFixture<unknown>, label: string): HTMLElement {
    return getHost(fixture).querySelector(`ol[aria-label='${label}']`) as HTMLElement;
}

function getOption(fixture: ComponentFixture<unknown>, label: string, text: string): HTMLElement {
    const option = Array.from(getList(fixture, label).querySelectorAll("li")).find(li => li.textContent?.trim() === text);
    if (!option) {
        throw new Error(`Option ${text} isn't in the ${label} list.`);
    }
    return option;
}

function getButton(fixture: ComponentFixture<unknown>, text: string): HTMLButtonElement {
    return Array.from(getHost(fixture).querySelectorAll("button")).find(
        button => button.textContent?.trim() === text
    ) as HTMLButtonElement;
}

function key(target: HTMLElement, keyName: string): KeyboardEvent {
    const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: keyName });
    target.dispatchEvent(event);
    return event;
}

async function stable(fixture: ComponentFixture<unknown>): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
}

function time(date: Date | null): string | null {
    return date ? `${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}` : null;
}

describe("TimeSelectorComponent interaction", () => {
    afterEach(() => {
        document.body.querySelectorAll("div[id^='root']").forEach(node => node.remove());
    });

    describe("keyboard", () => {
        it("moves through the minute options by the step", async () => {
            const fixture = await create(SelectorHostComponent, host => host.minuteStep.set(15));
            const minutes = getList(fixture, "Minutes");
            minutes.focus();

            key(minutes, "ArrowRight");
            key(getList(fixture, "Minutes"), "ArrowDown");
            await stable(fixture);
            key(getList(fixture, "Minutes"), "Enter");
            await stable(fixture);

            expect(time(fixture.componentInstance.value())).toBe("10:15");
            expect(minutes.getAttribute("aria-activedescendant")).toBe(getOption(fixture, "Minutes", "15").id);
        });

        it("steps from a time between options to the nearest option, and points at no option meanwhile", async () => {
            const fixture = await create(SelectorHostComponent, host => {
                host.minuteStep.set(15);
                host.value.set(new Date(2025, 0, 1, 10, 7));
            });
            const minutes = getList(fixture, "Minutes");
            expect(minutes.hasAttribute("aria-activedescendant")).toBe(false);

            getList(fixture, "Hours").focus();
            key(getList(fixture, "Hours"), "ArrowRight");
            key(minutes, "ArrowDown");
            await stable(fixture);
            key(minutes, "Enter");
            await stable(fixture);

            expect(time(fixture.componentInstance.value())).toBe("10:15");
        });

        it("keeps the keyboard within min and max", async () => {
            const fixture = await create(SelectorHostComponent, host => {
                host.min.set(new Date(2025, 0, 1, 9, 0));
                host.max.set(new Date(2025, 0, 1, 11, 0));
                host.value.set(new Date(2025, 0, 1, 9, 0));
            });
            const hours = getList(fixture, "Hours");
            hours.focus();

            key(hours, "ArrowUp");
            key(hours, "ArrowUp");
            await stable(fixture);
            key(hours, "Enter");
            await stable(fixture);
            expect(time(fixture.componentInstance.value())).toBe("9:00");

            key(hours, "End");
            await stable(fixture);
            key(hours, "Enter");
            await stable(fixture);
            expect(time(fixture.componentInstance.value())).toBe("11:00");
        });

        it("brings a time picked with the mouse back within min before it is set", async () => {
            const fixture = await create(SelectorHostComponent, host => {
                host.min.set(new Date(2025, 0, 1, 9, 30));
                host.value.set(new Date(2025, 0, 1, 10, 15));
            });

            getOption(fixture, "Hours", "09").click();
            await stable(fixture);
            getButton(fixture, "Set").click();
            await stable(fixture);

            expect(time(fixture.componentInstance.value())).toBe("9:30");
        });

        it("leaves Enter and Space on the Now button to the button", async () => {
            const fixture = await create(SelectorHostComponent);
            const now = getButton(fixture, "Now");

            key(now, "Enter");
            key(now, " ");
            await stable(fixture);

            expect(time(fixture.componentInstance.value())).toBe("10:00");
        });

        it("doesn't let Space scroll the focused list", async () => {
            const fixture = await create(SelectorHostComponent);
            const hours = getList(fixture, "Hours");
            hours.focus();

            expect(key(hours, " ").defaultPrevented).toBe(true);
        });
    });

    describe("value", () => {
        it("doesn't write a value on its own without a footer", async () => {
            const fixture = await create(SelectorHostComponent, host => {
                host.footer.set(false);
                host.value.set(null);
            });
            await stable(fixture);

            expect(fixture.componentInstance.value()).toBeNull();

            getOption(fixture, "Minutes", "45").click();
            await stable(fixture);
            expect(fixture.componentInstance.value()?.getMinutes()).toBe(45);
        });
    });

    describe("hour format", () => {
        it("follows the locale's clock when hourFormat isn't set", async () => {
            const fixture = await create(SelectorHostComponent, host => host.hourFormat.set(null));
            expect(getList(fixture, "AM/PM")).not.toBeNull();

            TestBed.inject(MonaI18nService).use({ ...MONA_DEFAULT_LOCALE, id: "de-DE" });
            await stable(fixture);
            expect(getList(fixture, "AM/PM")).toBeNull();
            expect(getList(fixture, "Hours").querySelectorAll("li").length).toBe(24);
        });

        it("lets an explicit hourFormat win over the locale", async () => {
            const fixture = await create(SelectorHostComponent, host => host.hourFormat.set("24"));

            expect(getList(fixture, "AM/PM")).toBeNull();
        });
    });

    describe("forms and accessibility", () => {
        it("marks the field touched only when focus leaves the selector", async () => {
            const fixture = await create(FormHostComponent);
            const field = fixture.componentInstance.form.time;

            getOption(fixture, "Minutes", "30").click();
            getButton(fixture, "Set").click();
            await stable(fixture);
            expect(field().value()?.getMinutes()).toBe(30);
            expect(field().touched()).toBe(false);

            getList(fixture, "Minutes").dispatchEvent(
                new FocusEvent("focusout", { bubbles: true, relatedTarget: getList(fixture, "Hours") })
            );
            await stable(fixture);
            expect(field().touched()).toBe(false);

            getList(fixture, "Minutes").dispatchEvent(new FocusEvent("focusout", { bubbles: true, relatedTarget: null }));
            await stable(fixture);
            expect(field().touched()).toBe(true);
        });

        it("puts required and read-only state on the listboxes and passes axe", async () => {
            const fixture = await create(SelectorHostComponent, host => host.required.set(true));
            const host = getHost(fixture);

            expect(host.hasAttribute("aria-required")).toBe(false);
            expect(host.hasAttribute("aria-readonly")).toBe(false);
            expect(getList(fixture, "Hours").getAttribute("aria-required")).toBe("true");

            const results = await axe.run(fixture.nativeElement as HTMLElement, { rules: { region: { enabled: false } } });
            expect(results.violations.map(violation => violation.id)).toEqual([]);
        });

        it("accepts bare boolean attributes", async () => {
            const fixture = await create(BareAttributeHostComponent);

            expect(getList(fixture, "Seconds")).not.toBeNull();
            expect(getList(fixture, "Hours").getAttribute("aria-readonly")).toBe("true");
        });

        it("passes focus options on to the active list", async () => {
            const fixture = await create(SelectorHostComponent);
            const hours = getList(fixture, "Hours");
            const focusSpy = vi.spyOn(hours, "focus");

            (fixture.debugElement.children[0].componentInstance as TimeSelectorComponent).focus({ preventScroll: true });

            expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
        });
    });
});
