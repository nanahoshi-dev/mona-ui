import { Component } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { MONA_DEFAULT_LOCALE, MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { provideRipple } from "@nanahoshi/mona-ui/ripple";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CalendarComponent } from "../components/calendar/calendar.component";

@Component({
    imports: [CalendarComponent],
    template: `<mona-calendar aria-label="Date" [value]="value" [disabledDates]="disabledDates"></mona-calendar>`
})
class CalendarRippleHostComponent {
    public readonly value = new Date(2026, 10, 12);
    public readonly disabledDates = (date: Date): boolean => date.getDate() === 20;
}

const animateDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, "animate");

describe("CalendarComponent ripple", () => {
    let fixture: ComponentFixture<CalendarRippleHostComponent>;
    const day = (date: number): HTMLElement => {
        const found = Array.from(
            fixture.nativeElement.querySelectorAll("[monaMonthDay]") as NodeListOf<HTMLElement>
        ).find(cell => cell.getAttribute("aria-label")?.includes(`November ${date},`));
        if (!found) {
            throw new Error(`No day ${date}`);
        }
        return found;
    };
    const layer = (element: Element): Element | null => element.querySelector(":scope > span[dir='ltr']");
    const press = (target: Element): void => {
        target.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0, clientX: 4, clientY: 4 }));
    };

    beforeEach(async () => {
        Object.defineProperty(Element.prototype, "animate", {
            configurable: true,
            writable: true,
            value: (): Animation => ({ finished: Promise.resolve() }) as unknown as Animation
        });
        TestBed.configureTestingModule({ imports: [CalendarRippleHostComponent], providers: [provideRipple()] });
        TestBed.inject(MonaI18nService).use(MONA_DEFAULT_LOCALE);
        fixture = TestBed.createComponent(CalendarRippleHostComponent);
        fixture.detectChanges();
        await fixture.whenStable();
    });

    afterEach(() => {
        if (animateDescriptor) {
            Object.defineProperty(Element.prototype, "animate", animateDescriptor);
        } else {
            Reflect.deleteProperty(Element.prototype, "animate");
        }
    });

    it("should ripple a pressed day", () => {
        press(day(14));
        expect(layer(day(14))).not.toBeNull();
    });

    it("should not ripple a day that can't be picked", () => {
        press(day(20));
        expect(layer(day(20))).toBeNull();
    });
});
