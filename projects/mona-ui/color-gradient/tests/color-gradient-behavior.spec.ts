import { LiveAnnouncer } from "@angular/cdk/a11y";
import { Clipboard } from "@angular/cdk/clipboard";
import { Component, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import type { ColorOutputFormat } from "@nanahoshi/mona-ui/common";
import { LabelComponent } from "@nanahoshi/mona-ui/label";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ColorGradientComponent } from "../components/color-gradient/color-gradient.component";
import {
    colorGradientHsvRectangleHandleThemeVariants,
    colorGradientHsvRectangleThemeVariants,
    colorGradientPreviewThemeVariants
} from "../styles/color-gradient.styles";

async function settle<T>(fixture: ComponentFixture<T>): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
}

function press(target: Element, key: string, init: KeyboardEventInit = {}): KeyboardEvent {
    const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key, ...init });
    target.dispatchEvent(event);
    return event;
}

/**
 * A canvas that, like a browser's, ignores what isn't a color. The one in the test setup accepts anything.
 */
function useCanvas(colors: Readonly<Record<string, string>> = {}): void {
    let current = "#000000";
    const context = {
        get fillStyle(): string {
            return current;
        },
        set fillStyle(color: string) {
            current = color.startsWith("#") ? color : (colors[color] ?? current);
        }
    };
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context as never);
}

function pointer(type: string, init: PointerEventInit = {}): PointerEvent {
    return new PointerEvent(type, {
        bubbles: true,
        button: 0,
        cancelable: true,
        isPrimary: true,
        pointerId: 1,
        ...init
    });
}

@Component({
    template: `
        <div [attr.dir]="dir()">
            <mona-color-gradient
                [disabled]="disabled()"
                [format]="format()"
                [readonly]="isReadonly()"
                [showButtons]="showButtons()"
                [value]="value()"
                (valueChange)="onValueChange($event)"
                (apply)="applied = applied + 1"
                (cancel)="canceled = canceled + 1" />
        </div>
    `,
    imports: [ColorGradientComponent]
})
class HostComponent {
    public readonly dir = signal<"ltr" | "rtl" | null>(null);
    public readonly disabled = signal(false);
    public readonly emitted: (string | null | undefined)[] = [];
    public readonly format = signal<ColorOutputFormat>("hex");
    public readonly isReadonly = signal(false);
    public readonly showButtons = signal(true);
    public readonly value = signal<string | null | undefined>("#336699");
    public applied = 0;
    public canceled = 0;

    public onValueChange(value: string | null | undefined): void {
        this.emitted.push(value);
        this.value.set(value);
    }
}

@Component({
    template: `
        <mona-label text="Fill">
            <mona-color-gradient />
        </mona-label>
    `,
    imports: [ColorGradientComponent, LabelComponent]
})
class WrappedHostComponent {}

describe("color gradient behavior", () => {
    let fixture: ComponentFixture<HostComponent>;
    let host: HostComponent;

    const hexInput = (): HTMLInputElement => fixture.debugElement.query(By.css("mona-text-box input")).nativeElement;
    const sliders = (): HTMLElement[] => [...fixture.nativeElement.querySelectorAll("[role='slider']")];
    const area = (): HTMLElement => sliders()[0];
    const hue = (): HTMLElement => sliders()[1];
    const alpha = (): HTMLElement => sliders()[2];
    const rectangle = (): HTMLElement => area().parentElement as HTMLElement;
    const swatch = (): HTMLElement => fixture.nativeElement.querySelector("mona-color-gradient [role='button']");
    const channelInputs = (): HTMLInputElement[] => [
        ...fixture.nativeElement.querySelectorAll("mona-numeric-text-box input")
    ];

    function button(text: string): HTMLButtonElement {
        const buttons: HTMLButtonElement[] = [...fixture.nativeElement.querySelectorAll("button")];
        return buttons.find(item => item.textContent?.trim() === text) as HTMLButtonElement;
    }

    const clearButton = (): HTMLButtonElement =>
        fixture.nativeElement.querySelector("button[aria-label='Clear color']");

    async function type(text: string): Promise<void> {
        const input = hexInput();
        input.value = text;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        await settle(fixture);
    }

    async function clickButton(text: string): Promise<void> {
        button(text).click();
        await settle(fixture);
    }

    async function setValue(value: string | null | undefined): Promise<void> {
        host.value.set(value);
        await settle(fixture);
    }

    function layOut(width = 200, height = 100): void {
        rectangle().getBoundingClientRect = () =>
            ({
                bottom: height,
                height,
                left: 0,
                right: width,
                top: 0,
                width,
                x: 0,
                y: 0,
                toJSON: () => ({})
            }) as DOMRect;
    }

    function saturationAndValue(): string | null {
        return area().getAttribute("aria-valuetext");
    }

    beforeEach(async () => {
        fixture = TestBed.createComponent(HostComponent);
        host = fixture.componentInstance;
        await settle(fixture);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("applied colors are never dropped", () => {
        it("applies a color the parent replaced, when it's chosen again", async () => {
            await type("#ff0000");
            await clickButton("Apply");
            await setValue("#00ff00");

            await type("#ff0000");
            await clickButton("Apply");

            expect(host.value()).toBe("#ff0000");
        });

        it("writes a color again after the form was reset, without buttons", async () => {
            host.showButtons.set(false);
            await settle(fixture);
            await type("#ff0000");
            await setValue(null);

            await type("#ff0000");

            expect(host.value()).toBe("#ff0000");
        });

        it("takes the same hue again after a typed color moved it", async () => {
            press(hue(), "End");
            await settle(fixture);
            expect(hue().getAttribute("aria-valuenow")).toBe("360");

            await type("#3366cc");
            expect(hue().getAttribute("aria-valuenow")).toBe("220");

            press(hue(), "End");
            await settle(fixture);
            expect(hue().getAttribute("aria-valuenow")).toBe("360");
        });

        it("doesn't report a value it already holds", async () => {
            host.showButtons.set(false);
            await settle(fixture);

            await type("#336699");

            expect(host.emitted).toEqual([]);
        });
    });

    describe("every way to edit counts for Apply", () => {
        function typeChannel(index: number, text: string): void {
            const input = channelInputs()[index];
            input.focus();
            input.value = text;
            input.dispatchEvent(new Event("input", { bubbles: true }));
            input.dispatchEvent(new Event("change", { bubbles: true }));
            input.blur();
        }

        async function showHsvInputs(): Promise<void> {
            (fixture.nativeElement.querySelector("button[aria-label='Switch color mode']") as HTMLElement).click();
            await settle(fixture);
        }

        it("the alpha slider", async () => {
            press(alpha(), "ArrowLeft");
            await settle(fixture);

            await clickButton("Apply");

            expect(host.emitted).toEqual(["#336699fe"]);
        });

        it("the hue slider", async () => {
            press(hue(), "End");
            await settle(fixture);

            await clickButton("Apply");

            expect(host.emitted.length).toBe(1);
        });

        it("a red, green or blue input", async () => {
            typeChannel(0, "10");
            await settle(fixture);

            await clickButton("Apply");

            expect(host.emitted).toEqual(["#0a6699"]);
        });

        it("a hue, saturation or value input", async () => {
            await showHsvInputs();
            typeChannel(2, "10");
            await settle(fixture);

            await clickButton("Apply");

            expect(host.emitted.length).toBe(1);
        });
    });

    describe("names", () => {
        it("leaves the letter prefixes out of what's read", () => {
            const prefixes: HTMLElement[] = [...fixture.nativeElement.querySelectorAll("span.select-none")];

            expect(prefixes.map(prefix => prefix.textContent?.trim())).toEqual(["R", "G", "B", "A", "HEX"]);
            expect(prefixes.every(prefix => prefix.getAttribute("aria-hidden") === "true")).toBe(true);
        });

        it("names every input", async () => {
            expect(channelInputs().map(input => input.getAttribute("aria-label"))).toEqual([
                "Red",
                "Green",
                "Blue",
                "Alpha"
            ]);
            expect(hexInput().getAttribute("aria-label")).toBe("Hex color");
        });

        it("names the hue, saturation and value inputs in HSV mode", async () => {
            (fixture.nativeElement.querySelector("button[aria-label='Switch color mode']") as HTMLElement).click();
            await settle(fixture);

            expect(channelInputs().map(input => input.getAttribute("aria-label"))).toEqual([
                "Hue",
                "Saturation",
                "Value",
                "Alpha"
            ]);
        });

        it("tells the two sliders apart, and reads alpha as a percentage", async () => {
            await setValue("#33669980");

            expect(hue().getAttribute("aria-label")).toBe("Hue");
            expect(alpha().getAttribute("aria-label")).toBe("Alpha");
            expect(alpha().getAttribute("aria-valuetext")).toBe("Opacity 50%");
        });

        it("is a named group", () => {
            const gradient: HTMLElement = fixture.nativeElement.querySelector("mona-color-gradient");

            expect(gradient.getAttribute("role")).toBe("group");
            expect(gradient.getAttribute("aria-label")).toBe("Color gradient");
        });

        it("takes its name from a wrapping label", async () => {
            const wrapped = TestBed.createComponent(WrappedHostComponent);
            await settle(wrapped);
            const gradient: HTMLElement = wrapped.nativeElement.querySelector("mona-color-gradient");

            const caption = wrapped.nativeElement.querySelector(`[id="${gradient.getAttribute("aria-labelledby")}"]`);

            expect(caption?.textContent).toContain("Fill");
            expect(gradient.hasAttribute("aria-label")).toBe(false);
        });

        it.each([
            ["with a value", "#336699"],
            ["with no value", null],
            ["with a value it can't read", "not-a-color"]
        ])("has no axe violations %s", async (_name, value) => {
            useCanvas();
            vi.spyOn(console, "warn").mockImplementation(() => undefined);
            await setValue(value);

            const result = await axe.run(fixture.nativeElement, {
                rules: { "color-contrast": { enabled: false }, region: { enabled: false } }
            });

            expect(result.violations.map(violation => violation.id)).toEqual([]);
        });

        it("keeps a value on the handle with no color", async () => {
            await setValue(null);

            expect(area().getAttribute("aria-valuenow")).toBe("0");
            expect(saturationAndValue()).toBe("Saturation 0%, Value 0%");
        });
    });

    describe("disabled", () => {
        beforeEach(async () => {
            host.disabled.set(true);
            await settle(fixture);
        });

        it("disables every control", () => {
            const controls: (HTMLInputElement | HTMLButtonElement)[] = [
                ...fixture.nativeElement.querySelectorAll("input, button")
            ];

            expect(controls.length).toBeGreaterThan(5);
            expect(controls.filter(control => !control.disabled).map(control => control.outerHTML)).toEqual([]);
            expect(sliders().map(slider => slider.getAttribute("tabindex"))).toEqual(["-1", "-1", "-1"]);
        });

        it("takes the previous color out of the Tab order", () => {
            expect(swatch().hasAttribute("tabindex")).toBe(false);
            expect(swatch().getAttribute("aria-disabled")).toBe("true");
        });

        it("ignores a click that gets through", async () => {
            clearButton().click();
            swatch().click();
            press(swatch(), "Enter");
            button("Apply").click();
            await settle(fixture);

            expect(host.emitted).toEqual([]);
            expect(host.applied).toBe(0);
        });
    });

    describe("read-only", () => {
        beforeEach(async () => {
            host.isReadonly.set(true);
            await settle(fixture);
        });

        it("ignores every way of changing the color", async () => {
            layOut();
            press(area(), "ArrowRight");
            press(hue(), "End");
            rectangle().dispatchEvent(pointer("pointerdown", { clientX: 50, clientY: 50 }));
            clearButton().click();
            swatch().click();
            await settle(fixture);

            expect(hexInput().value).toBe("#336699");
            expect(host.emitted).toEqual([]);
        });

        it("keeps the controls focusable, and copy working", () => {
            expect(area().getAttribute("tabindex")).toBe("0");
            expect(area().getAttribute("aria-readonly")).toBe("true");
            expect(hexInput().disabled).toBe(false);
            expect(fixture.nativeElement.querySelector("mona-dropdown-button button").disabled).toBe(false);
            expect(button("Apply").disabled).toBe(true);
        });
    });

    describe("Cancel", () => {
        it("puts the controls back on the value, so Apply commits nothing", async () => {
            await type("#235e99");

            await clickButton("Cancel");
            expect(hexInput().value).toBe("#336699");
            expect(host.canceled).toBe(1);

            await clickButton("Apply");
            expect(host.value()).toBe("#336699");
            expect(host.emitted).toEqual([]);
        });

        it("brings back everything an edit moved", async () => {
            press(area(), "ArrowDown");
            press(hue(), "End");
            press(alpha(), "Home");
            await settle(fixture);

            await clickButton("Cancel");

            expect(hexInput().value).toBe("#336699");
            expect(hue().getAttribute("aria-valuenow")).toBe("210");
            expect(alpha().getAttribute("aria-valuenow")).toBe("255");
            expect(saturationAndValue()).toBe("Saturation 67%, Value 60%");
        });

        it("undoes Clear, and the previous color stays", async () => {
            clearButton().click();
            await settle(fixture);
            expect(hexInput().value).toBe("");
            expect(swatch().style.backgroundColor).toBe("rgb(51, 102, 153)");

            await clickButton("Cancel");

            expect(hexInput().value).toBe("#336699");
            expect(host.emitted).toEqual([]);
        });

        it("goes back to the default with no value", async () => {
            await setValue(undefined);
            await clickButton("Cancel");
            await type("#123456");

            await clickButton("Cancel");

            expect(hexInput().value).toBe("#ffffff");
            expect(saturationAndValue()).toBe("Saturation 0%, Value 100%");
            expect(host.emitted).toEqual([]);
        });

        it("stays empty when the value is empty", async () => {
            await setValue(null);
            await type("#123456");

            await clickButton("Cancel");

            expect(hexInput().value).toBe("");
        });

        it("Clear writes null at once with no buttons", async () => {
            host.showButtons.set(false);
            await settle(fixture);

            clearButton().click();
            await settle(fixture);

            expect(host.emitted).toEqual([null]);
        });

        it("Clear and Apply writes null", async () => {
            clearButton().click();
            await settle(fixture);

            await clickButton("Apply");

            expect(host.value()).toBeNull();
        });

        it("the previous color doesn't move until Apply", async () => {
            await type("#111111");
            expect(swatch().style.backgroundColor).toBe("rgb(51, 102, 153)");

            await clickButton("Apply");
            expect(swatch().style.backgroundColor).toBe("rgb(17, 17, 17)");
        });

        it("with no previous color, the swatch does nothing", async () => {
            await setValue(null);
            await type("#123456");

            swatch().click();
            await settle(fixture);

            expect(hexInput().value).toBe("#123456");
        });
    });

    describe("colors", () => {
        it.each([
            ["rgb(0 0 0 / 50%)", "#00000080"],
            ["rgba(0,0,0,1.0)", "#000000"],
            ["rgba(0,0,0,50%)", "#00000080"],
            ["hsl(210.5, 50%, 40%)", "#336599"]
        ])("reads %s", async (value, hex) => {
            await setValue(value);

            expect(hexInput().value).toBe(hex);
        });

        it.each([
            "rgb(0 0 0 / 50%)",
            "rgba(51, 102, 153, 0.5)",
            "hsl(210.5, 50%, 40%)",
            "#336699CC",
            "not-a-color",
            "var(--brand)"
        ])("keeps %s as written when Apply follows no edit", async value => {
            useCanvas();
            vi.spyOn(console, "warn").mockImplementation(() => undefined);
            await setValue(value);

            await clickButton("Apply");

            expect(host.value()).toBe(value);
            expect(host.emitted).toEqual([]);
            expect(host.applied).toBe(1);
        });

        it("reads what only the browser knows", async () => {
            useCanvas({ rebeccapurple: "#663399" });

            await setValue("rebeccapurple");

            expect(hexInput().value).toBe("#663399");
        });

        it("shows a value it can't read as empty, warns once, and can still be edited", async () => {
            useCanvas();
            const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

            await setValue("not-a-color");

            expect(hexInput().value).toBe("");
            expect(warn).toHaveBeenCalledTimes(1);
            expect(String(warn.mock.calls[0][0])).toContain("not-a-color");

            await type("#123456");
            await clickButton("Apply");

            expect(host.value()).toBe("#123456");
        });

        it("doesn't warn about an empty string", async () => {
            const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

            await setValue("");

            expect(warn).not.toHaveBeenCalled();
        });

        it("writes the default color when Apply follows no value at all", async () => {
            const gradient = TestBed.createComponent(ColorGradientComponent);
            await settle(gradient);
            const buttons: HTMLButtonElement[] = [...gradient.nativeElement.querySelectorAll("button")];

            (buttons.find(item => item.textContent?.trim() === "Apply") as HTMLButtonElement).click();

            expect(gradient.componentInstance.value()).toBe("#ffffff");
        });
    });

    describe("right to left", () => {
        beforeEach(async () => {
            host.dir.set("rtl");
            await settle(fixture);
        });

        it("keeps the sliders left to right, so each handle sits over its color", async () => {
            press(hue(), "Home");
            await settle(fixture);
            const handle = hue();

            expect(handle.closest("mona-slider")?.getAttribute("dir")).toBe("ltr");
            expect(handle.style.left).toBe("0%");
            expect(handle.style.right).toBe("");
            expect(handle.hasAttribute("data-rtl")).toBe(false);
            expect(alpha().closest("mona-slider")?.getAttribute("dir")).toBe("ltr");
        });

        it("has a track to show with no color", async () => {
            await setValue(null);
            const track = alpha().closest("mona-slider")?.firstElementChild as HTMLElement;

            expect(track.style.background).toContain("rgb(0, 0, 0)");
        });

        it("moves up the scale with the right arrow, as the track shows", async () => {
            const before = Number(hue().getAttribute("aria-valuenow"));

            press(hue(), "ArrowRight");
            await settle(fixture);

            expect(Number(hue().getAttribute("aria-valuenow"))).toBe(before + 1);
        });
    });

    describe("default state", () => {
        it("agrees with itself", () => {
            const gradient = TestBed.createComponent(ColorGradientComponent);
            gradient.detectChanges();
            const handle: HTMLElement = gradient.nativeElement.querySelector("[role='slider']");

            expect(handle.getAttribute("aria-valuenow")).toBe("0");
            expect(handle.getAttribute("aria-valuetext")).toBe("Saturation 0%, Value 100%");
            expect(handle.style.left).toBe("0%");
            expect(handle.style.top).toBe("0%");
        });

        it("stays white on the first key press", async () => {
            const gradient = TestBed.createComponent(ColorGradientComponent);
            await settle(gradient);
            const handle: HTMLElement = gradient.nativeElement.querySelector("[role='slider']");

            press(handle, "ArrowDown");
            await settle(gradient);

            expect(gradient.debugElement.query(By.css("mona-text-box input")).nativeElement.value).toBe("#fcfcfc");
        });
    });

    describe("hex input", () => {
        it("keeps its text when focused with no value", async () => {
            const gradient = TestBed.createComponent(ColorGradientComponent);
            await settle(gradient);
            const input: HTMLInputElement = gradient.nativeElement.querySelector("mona-text-box input");

            input.dispatchEvent(new FocusEvent("focus"));
            await settle(gradient);

            expect(input.value).toBe("#ffffff");
        });

        it("shows what's being typed while focused, and the color after", async () => {
            const input = hexInput();
            input.dispatchEvent(new FocusEvent("focus"));
            await type("#12");
            expect(input.value).toBe("#12");

            input.dispatchEvent(new FocusEvent("blur"));
            await settle(fixture);
            expect(input.value).toBe("#336699");
        });
    });

    describe("no drift", () => {
        it.each(["#336699", "#123456", "#fa8072", "#9c4e4e"])("%s survives a step away and back", async color => {
            await setValue(color);

            press(area(), "ArrowRight");
            press(area(), "ArrowLeft");
            press(area(), "ArrowUp");
            press(area(), "ArrowDown");
            await settle(fixture);

            expect(hexInput().value).toBe(color);
        });

        it("writes a short alpha that reads back the same", async () => {
            host.format.set("rgb");
            await setValue("rgba(51, 102, 153, 0.5)");

            await type("#33669a80");
            await clickButton("Apply");

            expect(host.value()).toBe("rgba(51, 102, 154, 0.5)");
        });

        it("writes HSL that reads back as the same color", async () => {
            host.format.set("hsl");
            await setValue("#123456");

            press(area(), "ArrowRight");
            press(area(), "ArrowLeft");
            await settle(fixture);
            await clickButton("Apply");

            expect(host.value()).toBe("hsla(210, 65.4%, 20.4%, 1)");

            await setValue(host.value());
            expect(hexInput().value).toBe("#123456");
        });

        it("shows whole numbers, whatever it keeps inside", () => {
            expect(area().getAttribute("aria-valuenow")).toBe("67");
            expect(hue().getAttribute("aria-valuenow")).toBe("210");
            expect(saturationAndValue()).toBe("Saturation 67%, Value 60%");
        });
    });

    describe("pointer", () => {
        beforeEach(() => {
            layOut();
        });

        it("starts from a press anywhere in the area, and focuses the handle", async () => {
            rectangle().dispatchEvent(pointer("pointerdown", { clientX: 100, clientY: 50 }));
            await settle(fixture);

            expect(saturationAndValue()).toBe("Saturation 50%, Value 50%");
            expect(document.activeElement).toBe(area());
        });

        it("starts from a press on the handle too", async () => {
            area().dispatchEvent(pointer("pointerdown", { clientX: 100, clientY: 50 }));
            await settle(fixture);

            expect(saturationAndValue()).toBe("Saturation 50%, Value 50%");
        });

        it("keeps the handle focused through the press", () => {
            const event = new MouseEvent("mousedown", { bubbles: true, button: 0, cancelable: true });

            rectangle().dispatchEvent(event);

            expect(event.defaultPrevented).toBe(true);
        });

        it("follows the pointer and clamps to the area", async () => {
            rectangle().dispatchEvent(pointer("pointerdown", { clientX: 100, clientY: 50 }));
            rectangle().dispatchEvent(pointer("pointermove", { clientX: 500, clientY: -20 }));
            await settle(fixture);

            expect(saturationAndValue()).toBe("Saturation 100%, Value 100%");
        });

        it.each([
            ["the secondary button", { button: 2 }],
            ["the middle button", { button: 1 }],
            ["control-click", { ctrlKey: true }],
            ["another finger", { isPrimary: false }]
        ])("ignores %s", async (_name, init) => {
            const before = saturationAndValue();

            rectangle().dispatchEvent(pointer("pointerdown", { clientX: 10, clientY: 10, ...init }));
            rectangle().dispatchEvent(pointer("pointermove", { clientX: 20, clientY: 20, ...init }));
            await settle(fixture);

            expect(saturationAndValue()).toBe(before);
        });

        it.each(["pointerup", "pointercancel", "lostpointercapture"])("stops following after %s", async type => {
            rectangle().dispatchEvent(pointer("pointerdown", { clientX: 100, clientY: 50 }));
            rectangle().dispatchEvent(pointer(type));

            rectangle().dispatchEvent(pointer("pointermove", { clientX: 10, clientY: 10 }));
            await settle(fixture);

            expect(saturationAndValue()).toBe("Saturation 50%, Value 50%");
        });

        it("doesn't follow another pointer, or stop for one", async () => {
            rectangle().dispatchEvent(pointer("pointerdown", { clientX: 100, clientY: 50 }));
            rectangle().dispatchEvent(pointer("pointermove", { clientX: 10, clientY: 10, pointerId: 2 }));
            rectangle().dispatchEvent(pointer("pointerup", { pointerId: 2 }));
            await settle(fixture);
            expect(saturationAndValue()).toBe("Saturation 50%, Value 50%");

            rectangle().dispatchEvent(pointer("pointermove", { clientX: 200, clientY: 0 }));
            await settle(fixture);
            expect(saturationAndValue()).toBe("Saturation 100%, Value 100%");
        });

        it("captures the pointer", () => {
            const capture = vi.fn();
            rectangle().setPointerCapture = capture;

            rectangle().dispatchEvent(pointer("pointerdown", { clientX: 100, clientY: 50, pointerId: 7 }));

            expect(capture).toHaveBeenCalledWith(7);
        });

        it("stops listening when destroyed", () => {
            const remove = vi.spyOn(rectangle(), "removeEventListener");
            rectangle().dispatchEvent(pointer("pointerdown", { clientX: 100, clientY: 50 }));

            fixture.destroy();

            expect(remove).toHaveBeenCalledWith("pointermove", expect.any(Function), undefined);
        });

        it("does nothing in an area with no size", async () => {
            layOut(0, 0);
            const before = saturationAndValue();

            rectangle().dispatchEvent(pointer("pointerdown", { clientX: 10, clientY: 10 }));
            await settle(fixture);

            expect(saturationAndValue()).toBe(before);
            expect(hexInput().value).toBe("#336699");
        });
    });

    describe("handle position", () => {
        it("is a percentage, so it follows the area when it resizes", async () => {
            await setValue("#808080");

            expect(area().style.left).toBe("0%");
            expect(Number.parseFloat(area().style.top)).toBeCloseTo(49.8, 1);
        });

        it("reads no layout when a value loads", async () => {
            const width = vi.spyOn(rectangle(), "offsetWidth", "get");
            const rect = vi.spyOn(rectangle(), "getBoundingClientRect");

            await setValue("#808080");

            expect(width).not.toHaveBeenCalled();
            expect(rect).not.toHaveBeenCalled();
        });

        it("goes to the corner when cleared", async () => {
            clearButton().click();
            await settle(fixture);

            expect(area().style.left).toBe("0%");
            expect(area().style.top).toBe("0%");
        });
    });

    describe("copy", () => {
        let announce: ReturnType<typeof vi.spyOn>;

        beforeEach(() => {
            announce = vi.spyOn(TestBed.inject(LiveAnnouncer), "announce").mockResolvedValue();
        });

        function componentOf(): ColorGradientComponent {
            return fixture.debugElement.query(By.directive(ColorGradientComponent)).componentInstance;
        }

        function copy(mode: "hex" | "rgb"): void {
            (componentOf() as unknown as { onCopyColorSelect(mode: string): void }).onCopyColorSelect(mode);
        }

        it("copies and announces it", async () => {
            const clipboard = vi.spyOn(TestBed.inject(Clipboard), "copy").mockReturnValue(true);
            await setValue("#33669980");

            copy("hex");
            expect(clipboard).toHaveBeenLastCalledWith("#33669980");

            copy("rgb");
            expect(clipboard).toHaveBeenLastCalledWith("rgba(51, 102, 153, 0.5)");

            expect(announce).toHaveBeenLastCalledWith("Color copied");
        });

        it("says so when copying fails", () => {
            vi.spyOn(TestBed.inject(Clipboard), "copy").mockReturnValue(false);

            copy("hex");

            expect(announce).toHaveBeenCalledWith("Couldn't copy the color");
        });

        it("copies the color, not half-typed text", async () => {
            const clipboard = vi.spyOn(TestBed.inject(Clipboard), "copy").mockReturnValue(true);
            hexInput().dispatchEvent(new FocusEvent("focus"));
            await type("#12");

            copy("hex");

            expect(clipboard).toHaveBeenCalledWith("#336699");
        });

        it("has nothing to copy with no color", async () => {
            await setValue(null);

            expect(fixture.nativeElement.querySelector("mona-dropdown-button button").disabled).toBe(true);
        });
    });

    describe("styles", () => {
        it("gives the handle a focus state that shows on any color", () => {
            const classes = colorGradientHsvRectangleHandleThemeVariants({ rounded: "full" });

            expect(classes).toContain("focus-visible:outline-2");
            expect(classes).toContain("focus-visible:shadow-[0_0_0_4px_rgb(0_0_0/0.9)]");
            expect(classes).not.toContain("ring-focus-indicator/35");
        });

        it("centers the handle on its position", () => {
            const classes = colorGradientHsvRectangleHandleThemeVariants({ rounded: "full" });

            expect(classes).toContain("-translate-x-1/2");
            expect(classes).toContain("-translate-y-1/2");
        });

        it("keeps a drag on the area from scrolling the page", () => {
            expect(colorGradientHsvRectangleThemeVariants({ rounded: "medium" })).toContain("touch-none");
        });

        it("keeps the colors in forced colors", () => {
            expect(colorGradientHsvRectangleThemeVariants({ rounded: "medium" })).toContain("forced-color-adjust-none");
            expect(colorGradientPreviewThemeVariants({ rounded: "medium" })).toContain("forced-color-adjust-none");
        });
    });
});
