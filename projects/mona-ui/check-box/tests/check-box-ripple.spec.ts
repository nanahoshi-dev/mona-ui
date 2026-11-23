import { Component } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRipple } from "@nanahoshi/mona-ui/ripple";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CheckBoxComponent } from "../components/check-box/check-box.component";

@Component({
    imports: [CheckBoxComponent],
    template: `
        <mona-check-box id="plain" label="Plain"></mona-check-box>
        <mona-check-box id="disabled" label="Disabled" disabled></mona-check-box>
        <mona-check-box id="read-only" label="Read only" readonly></mona-check-box>
        <mona-check-box id="opted-out" label="Opted out" monaRippleDisabled></mona-check-box>
    `
})
class CheckBoxRippleHostComponent {}

const animateDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, "animate");

describe("CheckBoxComponent ripple", () => {
    let fixture: ComponentFixture<CheckBoxRippleHostComponent>;
    const checkBox = (id: string): HTMLElement => fixture.nativeElement.querySelector(`#${id}`);
    const box = (id: string): HTMLElement =>
        checkBox(id).querySelector("label > span[aria-hidden='true']") as HTMLElement;
    const halo = (id: string): HTMLElement | null => checkBox(id).querySelector("span[dir='ltr']");
    const press = (target: Element): void => {
        target.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0, clientX: 4, clientY: 4 }));
    };

    beforeEach(async () => {
        Object.defineProperty(Element.prototype, "animate", {
            configurable: true,
            writable: true,
            value: (): Animation => ({ finished: Promise.resolve() }) as unknown as Animation
        });
        TestBed.configureTestingModule({ imports: [CheckBoxRippleHostComponent], providers: [provideRipple()] });
        fixture = TestBed.createComponent(CheckBoxRippleHostComponent);
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

    it("should draw a halo around the box for a press of its label", () => {
        press(checkBox("plain").querySelector("label > span:not([aria-hidden])") as Element);

        const layer = halo("plain");
        expect(layer?.parentElement).toBe(box("plain"));
        expect(layer?.classList).toContain("text-foreground");
        expect(layer?.classList).not.toContain("overflow-hidden");
    });

    it("should not clip the halo to the box", () => {
        expect(box("plain").classList).not.toContain("overflow-hidden");
    });

    it("should not draw a halo for a check box that can't change", () => {
        press(box("disabled"));
        press(box("read-only"));
        press(box("opted-out"));
        expect(halo("disabled")).toBeNull();
        expect(halo("read-only")).toBeNull();
        expect(halo("opted-out")).toBeNull();
    });
});
