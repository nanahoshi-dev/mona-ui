import { Component } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRipple } from "@nanahoshi/mona-ui/ripple";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { SwitchComponent } from "../components/switch/switch.component";

@Component({
    imports: [SwitchComponent],
    template: `
        <mona-switch id="plain" aria-label="Plain"></mona-switch>
        <mona-switch id="disabled" aria-label="Disabled" disabled></mona-switch>
        <mona-switch id="read-only" aria-label="Read only" readonly></mona-switch>
        <mona-switch id="opted-out" aria-label="Opted out" monaRippleDisabled></mona-switch>
    `
})
class SwitchRippleHostComponent {}

const animateDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, "animate");

describe("SwitchComponent ripple", () => {
    let fixture: ComponentFixture<SwitchRippleHostComponent>;
    const toggle = (id: string): HTMLElement => fixture.nativeElement.querySelector(`#${id}`);
    const handle = (id: string): HTMLElement => toggle(id).querySelector(":scope > div") as HTMLElement;
    const halo = (id: string): HTMLElement | null => toggle(id).querySelector("span[dir='ltr']");
    const press = (target: Element): void => {
        target.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0, clientX: 4, clientY: 4 }));
    };

    beforeEach(async () => {
        Object.defineProperty(Element.prototype, "animate", {
            configurable: true,
            writable: true,
            value: (): Animation => ({ finished: Promise.resolve() }) as unknown as Animation
        });
        TestBed.configureTestingModule({ imports: [SwitchRippleHostComponent], providers: [provideRipple()] });
        fixture = TestBed.createComponent(SwitchRippleHostComponent);
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

    it("should draw a halo in the handle, so that it moves with the handle", () => {
        press(toggle("plain"));

        expect(halo("plain")?.parentElement).toBe(handle("plain"));
        expect(toggle("plain").style.isolation).toBe("isolate");
    });

    it("should not draw a halo for a switch that can't change", () => {
        press(toggle("disabled"));
        press(toggle("read-only"));
        press(toggle("opted-out"));
        expect(halo("disabled")).toBeNull();
        expect(halo("read-only")).toBeNull();
        expect(halo("opted-out")).toBeNull();
    });
});
