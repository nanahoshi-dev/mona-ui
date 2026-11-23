import { Component } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { MONA_DEFAULT_LOCALE, MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { provideRipple } from "@nanahoshi/mona-ui/ripple";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { StepperComponent } from "../components/stepper/stepper.component";
import type { StepOptions } from "../models/Step";

@Component({
    imports: [StepperComponent],
    template: `<mona-stepper aria-label="Checkout" [steps]="steps"></mona-stepper>`
})
class StepperRippleHostComponent {
    public readonly steps: StepOptions[] = [{ label: "Cart" }, { label: "Shipping" }, { label: "Payment" }];
}

const animateDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, "animate");

describe("StepperComponent ripple", () => {
    let fixture: ComponentFixture<StepperRippleHostComponent>;
    const indicator = (index: number): HTMLElement =>
        fixture.nativeElement.querySelectorAll("button[monaStepperIndicator]")[index] as HTMLElement;
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
        TestBed.configureTestingModule({ imports: [StepperRippleHostComponent], providers: [provideRipple()] });
        TestBed.inject(MonaI18nService).use(MONA_DEFAULT_LOCALE);
        fixture = TestBed.createComponent(StepperRippleHostComponent);
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

    it("should ripple the indicator of a step that can be reached", () => {
        press(indicator(1));
        expect(layer(indicator(1))).not.toBeNull();
    });

    it("should not ripple the indicator of a locked step", () => {
        // A linear stepper reaches only the steps next to the current one.
        press(indicator(2));
        expect(layer(indicator(2))).toBeNull();
    });
});
