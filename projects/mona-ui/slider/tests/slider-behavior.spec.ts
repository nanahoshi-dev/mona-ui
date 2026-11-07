import { Component, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { MONA_DEFAULT_LOCALE, MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { MONA_DE_DE_LOCALE } from "@nanahoshi/mona-ui/locales/de-de";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RangeSliderComponent } from "../components/range-slider/range-slider.component";
import { SliderComponent } from "../components/slider/slider.component";

async function settle<T>(fixture: ComponentFixture<T>): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
}

async function axeViolations(element: Element): Promise<string[]> {
    const result = await axe.run(
        { include: [element] },
        { rules: { "color-contrast": { enabled: false }, region: { enabled: false } } }
    );
    return result.violations.map(violation => violation.id);
}

function press(handle: Element, key: string): void {
    handle.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
}

/** A 100 px wide host, so a pointer at x is at x percent of the range. */
function stubHostRect(host: HTMLElement): void {
    host.getBoundingClientRect = () =>
        ({
            left: 0,
            right: 100,
            top: 0,
            bottom: 20,
            width: 100,
            height: 20,
            x: 0,
            y: 0,
            toJSON: () => ({})
        }) as DOMRect;
}

function pointer(type: string, options: PointerEventInit = {}): PointerEvent {
    return new PointerEvent(type, { bubbles: true, button: 0, isPrimary: true, pointerId: 1, ...options });
}

@Component({
    template: `
        <mona-slider
            aria-label="Volume"
            [maxValue]="max()"
            [minValue]="min()"
            [showLabels]="ticks()"
            [showTicks]="ticks()"
            [step]="step()"
            [(value)]="value"
            aria-describedby="help" />
        <span id="help">Help</span>
    `,
    imports: [SliderComponent]
})
class SliderHostComponent {
    public readonly max = signal(10);
    public readonly min = signal(0);
    public readonly step = signal(1);
    public readonly ticks = signal(false);
    public readonly value = signal(0);
}

@Component({
    template: `
        <mona-range-slider
            aria-describedby="help"
            aria-label="Price"
            [maxValue]="10"
            [minValue]="0"
            [(value)]="value" />
        <span id="help">Help</span>
    `,
    imports: [RangeSliderComponent]
})
class RangeHostComponent {
    public readonly value = signal<[number, number]>([2, 8]);
}

describe("slider behavior", () => {
    let warn: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    });

    afterEach(() => {
        warn.mockRestore();
        TestBed.inject(MonaI18nService).use(MONA_DEFAULT_LOCALE);
    });

    describe("single slider", () => {
        let fixture: ComponentFixture<SliderHostComponent>;
        let host: SliderHostComponent;
        let element: HTMLElement;
        let handle: HTMLElement;

        beforeEach(async () => {
            fixture = TestBed.createComponent(SliderHostComponent);
            host = fixture.componentInstance;
            await settle(fixture);
            element = fixture.nativeElement.querySelector("mona-slider");
            handle = fixture.nativeElement.querySelector("[role='slider']");
            stubHostRect(element);
        });

        describe("fractional steps", () => {
            it("keeps float noise out of the model and the announced value", async () => {
                host.step.set(0.1);
                host.max.set(1);
                await settle(fixture);

                for (let i = 0; i < 3; i++) {
                    press(handle, "ArrowRight");
                    await settle(fixture);
                }

                expect(host.value()).toBe(0.3);
                expect(handle.getAttribute("aria-valuenow")).toBe("0.3");
            });

            it("counts the decimals of the minimum as well as the step", async () => {
                host.min.set(0.05);
                host.value.set(0.05);
                host.step.set(0.1);
                host.max.set(1);
                await settle(fixture);

                press(handle, "ArrowRight");
                press(handle, "ArrowRight");
                await settle(fixture);

                expect(host.value()).toBe(0.25);
            });

            it("keeps float noise out of the ticks, and ends on the maximum", async () => {
                host.min.set(1);
                host.value.set(1);
                host.max.set(1.2);
                host.step.set(0.2);
                host.ticks.set(true);
                await settle(fixture);

                const values = [...fixture.nativeElement.querySelectorAll("[data-slider-tick]")].map((tick: Element) =>
                    tick.getAttribute("data-value")
                );

                expect(values).toEqual(["1", "1.2"]);
            });
        });

        describe("page keys", () => {
            it("moves by at least one step when a tenth of the range is smaller", async () => {
                host.max.set(100);
                host.step.set(25);
                host.value.set(25);
                await settle(fixture);

                press(handle, "PageUp");
                await settle(fixture);
                expect(host.value()).toBe(50);

                press(handle, "PageDown");
                press(handle, "PageDown");
                await settle(fixture);
                expect(host.value()).toBe(0);
            });

            it("still moves by a tenth of the range when that's larger", async () => {
                host.max.set(100);
                host.value.set(50);
                await settle(fixture);

                press(handle, "PageUp");
                await settle(fixture);

                expect(host.value()).toBe(60);
            });
        });

        describe("a maximum off the step grid", () => {
            beforeEach(async () => {
                host.step.set(3);
                await settle(fixture);
            });

            it("can be reached with End and with the arrow keys", async () => {
                press(handle, "End");
                await settle(fixture);
                expect(host.value()).toBe(10);

                press(handle, "ArrowLeft");
                await settle(fixture);
                expect(host.value()).toBe(9);

                press(handle, "ArrowRight");
                await settle(fixture);
                expect(host.value()).toBe(10);
            });

            it("can be reached by clicking the end of the track", async () => {
                element.dispatchEvent(new MouseEvent("click", { bubbles: true, clientX: 100, clientY: 5 }));
                await settle(fixture);

                expect(host.value()).toBe(10);
            });
        });

        describe("a value the slider can't show", () => {
            it("shows the nearest value and leaves the model alone", async () => {
                host.value.set(15);
                await settle(fixture);

                expect(handle.getAttribute("aria-valuenow")).toBe("10");
                expect(host.value()).toBe(15);
            });

            it("keeps saved data when the maximum loads late", async () => {
                host.max.set(0.5);
                host.value.set(50);
                await settle(fixture);
                expect(host.value()).toBe(50);

                host.max.set(100);
                await settle(fixture);

                expect(handle.getAttribute("aria-valuenow")).toBe("50");
                expect(host.value()).toBe(50);
            });

            it("saves a corrected value on the next user change", async () => {
                host.value.set(15);
                await settle(fixture);

                press(handle, "ArrowLeft");
                await settle(fixture);

                expect(host.value()).toBe(9);
            });

            it("warns once, even when the value goes bad again", async () => {
                host.value.set(15);
                await settle(fixture);
                host.value.set(5);
                await settle(fixture);
                host.value.set(16);
                await settle(fixture);

                expect(warn).toHaveBeenCalledTimes(1);
                expect(warn.mock.calls[0][0]).toContain("out of range");
            });

            it("doesn't warn about a value it can show", async () => {
                host.value.set(5);
                await settle(fixture);

                expect(warn).not.toHaveBeenCalled();
            });

            it("treats NaN as the minimum", async () => {
                host.value.set(Number.NaN);
                await settle(fixture);

                expect(handle.getAttribute("aria-valuenow")).toBe("0");
            });

            it("warns when the bounds are reversed", async () => {
                host.min.set(10);
                host.max.set(0);
                host.value.set(10);
                await settle(fixture);

                expect(warn.mock.calls[0][0]).toContain("must be lower");
            });
        });

        describe("dragging", () => {
            it("follows the primary button, and stops when it's released", async () => {
                const capture = vi.fn();
                handle.setPointerCapture = capture;

                handle.dispatchEvent(pointer("pointerdown"));
                document.dispatchEvent(pointer("pointermove", { clientX: 50 }));
                await settle(fixture);

                expect(capture).toHaveBeenCalledWith(1);
                expect(document.activeElement).toBe(handle);
                expect(host.value()).toBe(5);
                expect(handle.getAttribute("data-dragging")).toBe("true");

                document.dispatchEvent(pointer("pointerup"));
                document.dispatchEvent(pointer("pointermove", { clientX: 70 }));
                await settle(fixture);

                expect(host.value()).toBe(5);
                expect(handle.getAttribute("data-dragging")).toBe("false");
            });

            it.each([
                ["pointercancel", () => document],
                ["lostpointercapture", () => null]
            ])("stops on %s", async (type, target) => {
                handle.dispatchEvent(pointer("pointerdown"));
                document.dispatchEvent(pointer("pointermove", { clientX: 20 }));
                (target() ?? handle).dispatchEvent(pointer(type));
                document.dispatchEvent(pointer("pointermove", { clientX: 70 }));
                await settle(fixture);

                expect(host.value()).toBe(2);
                expect(handle.getAttribute("data-dragging")).toBe("false");
            });

            it.each([
                ["the secondary button", { button: 2 }],
                ["a second finger", { isPrimary: false }],
                ["a control click on a Mac", { ctrlKey: true }]
            ])("doesn't start with %s", async (_name, options) => {
                handle.dispatchEvent(pointer("pointerdown", options));
                document.dispatchEvent(pointer("pointermove", { clientX: 50 }));
                await settle(fixture);

                expect(host.value()).toBe(0);
                expect(handle.getAttribute("data-dragging")).toBe("false");
            });

            it("ignores other pointers during a drag", async () => {
                handle.dispatchEvent(pointer("pointerdown"));
                document.dispatchEvent(pointer("pointermove", { clientX: 50, pointerId: 2 }));
                document.dispatchEvent(pointer("pointerup", { pointerId: 2 }));
                await settle(fixture);

                expect(host.value()).toBe(0);
                expect(handle.getAttribute("data-dragging")).toBe("true");
            });

            it("stops listening to the document when destroyed mid-drag", () => {
                handle.dispatchEvent(pointer("pointerdown"));
                const remove = vi.spyOn(document, "removeEventListener");

                fixture.destroy();

                expect(remove).toHaveBeenCalledWith("pointermove", expect.anything(), undefined);
                remove.mockRestore();
            });

            it("leaves the gesture to the handle on touch", () => {
                expect(handle.classList.contains("touch-none")).toBe(true);
            });

            it("doesn't move the value on the click that ends a drag", async () => {
                host.value.set(5);
                await settle(fixture);

                handle.dispatchEvent(new MouseEvent("click", { bubbles: true, clientX: 90, clientY: 5 }));
                await settle(fixture);

                expect(host.value()).toBe(5);
                expect(document.activeElement).toBe(handle);
            });
        });

        describe("tick labels", () => {
            it("follow the library locale", async () => {
                host.max.set(2000);
                host.step.set(1000);
                host.ticks.set(true);
                TestBed.inject(MonaI18nService).use(MONA_DE_DE_LOCALE);
                await settle(fixture);

                expect(fixture.nativeElement.textContent).toContain("1.000");
            });

            it("keep the decimals of a fractional step", async () => {
                host.max.set(0.25);
                host.step.set(0.0625);
                host.ticks.set(true);
                await settle(fixture);

                expect(fixture.nativeElement.textContent).toContain("0.0625");
            });
        });

        describe("naming", () => {
            it("puts the description on the handle and not on the host", () => {
                expect(handle.getAttribute("aria-describedby")).toBe("help");
                expect(element.hasAttribute("aria-describedby")).toBe(false);
                expect(element.hasAttribute("aria-label")).toBe(false);
            });

            it("has no axe violations", async () => {
                expect(await axeViolations(fixture.nativeElement)).toEqual([]);
            });

            it("has no axe violations with ticks", async () => {
                host.ticks.set(true);
                await settle(fixture);

                expect(await axeViolations(fixture.nativeElement)).toEqual([]);
            });
        });
    });

    describe("range slider", () => {
        let fixture: ComponentFixture<RangeHostComponent>;
        let host: RangeHostComponent;
        let element: HTMLElement;
        let lower: HTMLElement;
        let upper: HTMLElement;

        beforeEach(async () => {
            fixture = TestBed.createComponent(RangeHostComponent);
            host = fixture.componentInstance;
            await settle(fixture);
            element = fixture.nativeElement.querySelector("mona-range-slider");
            [lower, upper] = fixture.nativeElement.querySelectorAll("[role='slider']");
            stubHostRect(element);
        });

        it("ties each handle's limit to the other handle", () => {
            expect(lower.getAttribute("aria-valuemin")).toBe("0");
            expect(lower.getAttribute("aria-valuemax")).toBe("8");
            expect(upper.getAttribute("aria-valuemin")).toBe("2");
            expect(upper.getAttribute("aria-valuemax")).toBe("10");
        });

        it("stops the upper handle at the lower one while dragging", async () => {
            upper.dispatchEvent(pointer("pointerdown"));
            document.dispatchEvent(pointer("pointermove", { clientX: 10 }));
            await settle(fixture);

            expect(host.value()).toEqual([2, 2]);

            document.dispatchEvent(pointer("pointermove", { clientX: 50 }));
            await settle(fixture);

            expect(host.value()).toEqual([2, 5]);
        });

        it("stops the lower handle at the upper one while dragging", async () => {
            lower.dispatchEvent(pointer("pointerdown"));
            document.dispatchEvent(pointer("pointermove", { clientX: 90 }));
            await settle(fixture);

            expect(host.value()).toEqual([8, 8]);
        });

        it.each([
            ["up, from the lower handle", () => lower, 80, [5, 8]],
            ["down, from the upper handle", () => upper, 20, [2, 5]]
        ])("can drag stacked handles apart %s", async (_name, handle, clientX, expected) => {
            host.value.set([5, 5]);
            await settle(fixture);

            handle().dispatchEvent(pointer("pointerdown"));
            document.dispatchEvent(pointer("pointermove", { clientX }));
            await settle(fixture);

            expect(host.value()).toEqual(expected);
            expect(document.activeElement).toBe(clientX > 50 ? upper : lower);
        });

        it("doesn't move a handle on the click that ends a drag", async () => {
            upper.dispatchEvent(new MouseEvent("click", { bubbles: true, clientX: 10, clientY: 5 }));
            await settle(fixture);

            expect(host.value()).toEqual([2, 8]);
        });

        it("still moves the closest handle on a click on the track", async () => {
            const track = element.firstElementChild as HTMLElement;
            lower.getBoundingClientRect = () => ({ left: 20, top: 0, width: 0, height: 0 }) as DOMRect;
            upper.getBoundingClientRect = () => ({ left: 80, top: 0, width: 0, height: 0 }) as DOMRect;

            track.dispatchEvent(new MouseEvent("click", { bubbles: true, clientX: 70, clientY: 0 }));
            await settle(fixture);

            expect(host.value()).toEqual([2, 7]);
        });

        it("doesn't write a value it can't show, and warns", async () => {
            host.value.set([8, 2]);
            await settle(fixture);

            expect(lower.getAttribute("aria-valuenow")).toBe("2");
            expect(host.value()).toEqual([8, 2]);
            expect(warn.mock.calls[0][0]).toContain("out of range");
        });

        it("describes each handle, and has no data-disabled while enabled", () => {
            expect(lower.getAttribute("aria-describedby")).toBe("help");
            expect(upper.getAttribute("aria-describedby")).toBe("help");
            expect(element.hasAttribute("aria-describedby")).toBe(false);
            expect(element.hasAttribute("data-disabled")).toBe(false);
        });

        it("has no axe violations", async () => {
            expect(await axeViolations(fixture.nativeElement)).toEqual([]);
        });
    });
});
