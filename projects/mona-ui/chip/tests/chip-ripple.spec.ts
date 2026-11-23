import { Component } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRipple } from "@nanahoshi/mona-ui/ripple";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ChipComponent } from "../component/chip.component";

@Component({
    template: `
        <mona-chip id="static" label="Static"></mona-chip>
        <mona-chip id="toggle" label="Toggle" toggleable></mona-chip>
        <mona-chip id="toggle-removable" label="Toggle and remove" toggleable removable></mona-chip>
        <mona-chip id="disabled" label="Disabled" toggleable disabled></mona-chip>
        <mona-chip id="opted-out" label="Opted out" toggleable monaRippleDisabled></mona-chip>
    `,
    imports: [ChipComponent]
})
class ChipRippleHostComponent {}

const animateDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, "animate");

describe("ChipComponent ripple", () => {
    let fixture: ComponentFixture<ChipRippleHostComponent>;
    const chip = (id: string): HTMLElement => fixture.nativeElement.querySelector(`#${id}`);
    const layer = (element: Element): Element | null => element.querySelector(":scope > span[aria-hidden='true']");
    const press = (target: Element): void => {
        target.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0, clientX: 4, clientY: 4 }));
    };

    beforeEach(async () => {
        Object.defineProperty(Element.prototype, "animate", {
            configurable: true,
            writable: true,
            value: (): Animation => ({ finished: Promise.resolve() }) as unknown as Animation
        });
        TestBed.configureTestingModule({ imports: [ChipRippleHostComponent], providers: [provideRipple()] });
        fixture = TestBed.createComponent(ChipRippleHostComponent);
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

    it("should ripple a chip that toggles", () => {
        press(chip("toggle"));
        expect(layer(chip("toggle"))).not.toBeNull();
    });

    it("should not ripple a chip that does nothing when pressed", () => {
        press(chip("static"));
        expect(layer(chip("static"))).toBeNull();
    });

    it("should ripple a removable toggle's body, but not for its remove button", () => {
        const removable = chip("toggle-removable");
        press(removable.querySelector("button[data-chip-remove]") as Element);
        expect(layer(removable)).toBeNull();

        press(removable.querySelector("[role='checkbox']") as Element);
        expect(layer(removable)).not.toBeNull();
    });

    it("should not ripple a disabled chip, or one with the ripple turned off", () => {
        press(chip("disabled"));
        press(chip("opted-out"));
        expect(layer(chip("disabled"))).toBeNull();
        expect(layer(chip("opted-out"))).toBeNull();
    });
});
