import { Component, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRipple } from "@nanahoshi/mona-ui/ripple";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { SegmentedComponent } from "../components/segmented/segmented.component";
import type { SegmentedOption } from "../models/SegmentedOption";

@Component({
    imports: [SegmentedComponent],
    template: `
        <mona-segmented
            aria-label="View"
            [options]="options"
            [readonly]="readonly()"
            [(value)]="value"></mona-segmented>
    `
})
class SegmentedRippleHostComponent {
    public readonly options: SegmentedOption<string>[] = [
        { label: "Day", value: "day" },
        { label: "Week", value: "week" },
        { label: "Month", value: "month", disabled: true }
    ];
    public readonly readonly = signal(false);
    public readonly value = signal("day");
}

const animateDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, "animate");

describe("SegmentedComponent ripple", () => {
    let fixture: ComponentFixture<SegmentedRippleHostComponent>;
    const option = (index: number): HTMLLabelElement =>
        fixture.nativeElement.querySelectorAll("label")[index] as HTMLLabelElement;
    const layer = (element: Element): Element | null => element.querySelector(":scope > span[dir='ltr']");
    // The option's radio lies over the whole option, so it is what a press lands on.
    const press = (target: HTMLLabelElement): void => {
        target
            .querySelector("input")
            ?.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0, clientX: 4, clientY: 4 }));
    };

    beforeEach(async () => {
        Object.defineProperty(Element.prototype, "animate", {
            configurable: true,
            writable: true,
            value: (): Animation => ({ finished: Promise.resolve() }) as unknown as Animation
        });
        TestBed.configureTestingModule({ imports: [SegmentedRippleHostComponent], providers: [provideRipple()] });
        fixture = TestBed.createComponent(SegmentedRippleHostComponent);
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

    it("should ripple an option when its radio is pressed", () => {
        press(option(1));
        expect(layer(option(1))).not.toBeNull();
    });

    it("should not ripple a disabled option", () => {
        press(option(2));
        expect(layer(option(2))).toBeNull();
    });

    it("should not ripple the options of a read-only segmented control", async () => {
        fixture.componentInstance.readonly.set(true);
        fixture.detectChanges();
        await fixture.whenStable();
        press(option(1));
        expect(layer(option(1))).toBeNull();
    });
});
