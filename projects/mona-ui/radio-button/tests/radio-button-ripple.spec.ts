import { Component } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRipple } from "@nanahoshi/mona-ui/ripple";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { RadioButtonComponent } from "../components/radio-button/radio-button.component";

@Component({
    imports: [RadioButtonComponent],
    template: `
        <mona-radio-button id="plain" name="size" label="Small" radioValue="small"></mona-radio-button>
        <mona-radio-button id="disabled" name="size" label="Large" radioValue="large" disabled></mona-radio-button>
        <mona-radio-button id="read-only" name="tone" label="Warm" radioValue="warm" readonly></mona-radio-button>
        <mona-radio-button
            id="opted-out"
            name="tone"
            label="Cool"
            radioValue="cool"
            monaRippleDisabled></mona-radio-button>
    `
})
class RadioButtonRippleHostComponent {}

const animateDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, "animate");

describe("RadioButtonComponent ripple", () => {
    let fixture: ComponentFixture<RadioButtonRippleHostComponent>;
    const radio = (id: string): HTMLElement => fixture.nativeElement.querySelector(`#${id}`);
    const circle = (id: string): HTMLElement => radio(id).querySelector("input + span") as HTMLElement;
    const halo = (id: string): HTMLElement | null => radio(id).querySelector("span[dir='ltr']");
    const press = (target: Element): void => {
        target.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0, clientX: 4, clientY: 4 }));
    };

    beforeEach(async () => {
        Object.defineProperty(Element.prototype, "animate", {
            configurable: true,
            writable: true,
            value: (): Animation => ({ finished: Promise.resolve() }) as unknown as Animation
        });
        TestBed.configureTestingModule({ imports: [RadioButtonRippleHostComponent], providers: [provideRipple()] });
        fixture = TestBed.createComponent(RadioButtonRippleHostComponent);
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

    it("should draw a halo around the circle for a press of its label", () => {
        press(radio("plain").querySelector("label > span:last-child") as Element);

        const layer = halo("plain");
        expect(layer?.parentElement).toBe(circle("plain"));
        expect(circle("plain").classList).not.toContain("overflow-hidden");
    });

    it("should not draw a halo for a radio button that can't change", () => {
        press(circle("disabled"));
        press(circle("read-only"));
        press(circle("opted-out"));
        expect(halo("disabled")).toBeNull();
        expect(halo("read-only")).toBeNull();
        expect(halo("opted-out")).toBeNull();
    });
});
