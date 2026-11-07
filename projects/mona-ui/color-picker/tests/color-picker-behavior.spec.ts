import { Component, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { form, FormField, required } from "@angular/forms/signals";
import type { ColorOutputFormat, ColorPaletteItem } from "@nanahoshi/mona-ui/common";
import { LabelComponent } from "@nanahoshi/mona-ui/label";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ColorPickerComponent } from "../components/color-picker/color-picker.component";
import { ColorPickerValueTemplateDirective } from "../directives/color-picker-value-template.directive";

async function settle<T>(fixture: ComponentFixture<T>): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    await new Promise(resolve => setTimeout(resolve));
    fixture.detectChanges();
}

async function until<T>(fixture: ComponentFixture<T>, predicate: () => boolean): Promise<void> {
    const start = Date.now();
    while (!predicate()) {
        if (Date.now() - start > 2000) {
            throw new Error("Timed out waiting for condition.");
        }
        await settle(fixture);
    }
}

function press(target: Element, key: string, init: KeyboardEventInit = {}): KeyboardEvent {
    const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key, ...init });
    target.dispatchEvent(event);
    return event;
}

@Component({
    template: `
        <input id="other" aria-label="Other" />
        @if (shown()) {
            <mona-color-picker
                [aria-label]="'Fill'"
                [closeOnSelect]="closeOnSelect()"
                [disabled]="disabled()"
                [format]="format()"
                [palette]="palette()"
                [readonly]="isReadonly()"
                [showButtons]="showButtons()"
                [showClearButton]="showClearButton()"
                [tileSize]="tileSize()"
                [view]="view()"
                [(value)]="value"
                (touch)="touches = touches + 1" />
        }
    `,
    imports: [ColorPickerComponent]
})
class HostComponent {
    public readonly closeOnSelect = signal(true);
    public readonly disabled = signal(false);
    public readonly format = signal<ColorOutputFormat>("hex");
    public readonly isReadonly = signal(false);
    public readonly palette = signal<Iterable<string | ColorPaletteItem>>(["#111111", "#222222", "#333333"]);
    public readonly showButtons = signal(true);
    public readonly showClearButton = signal(false);
    public readonly shown = signal(true);
    public readonly tileSize = signal(24);
    public readonly value = signal<string | null>("#222222");
    public readonly view = signal<"gradient" | "palette">("palette");
    public touches = 0;
}

@Component({
    template: `
        <mona-color-picker [formField]="form.color" view="palette" [palette]="palette">
            <ng-template monaColorPickerValueTemplate let-color>
                <span class="typed">{{ color?.toUpperCase() ?? "none" }}</span>
            </ng-template>
        </mona-color-picker>
    `,
    imports: [ColorPickerComponent, ColorPickerValueTemplateDirective, FormField]
})
class FormHostComponent {
    readonly #model = signal<{ color: string | null }>({ color: null });
    protected readonly palette = ["#111111"];
    public readonly form = form(this.#model, schema => required(schema.color));
}

@Component({
    template: `
        <mona-label text="Fill">
            <mona-color-picker />
        </mona-label>
    `,
    imports: [ColorPickerComponent, LabelComponent]
})
class WrappedHostComponent {}

describe("color picker behavior", () => {
    let fixture: ComponentFixture<HostComponent>;
    let host: HostComponent;

    const picker = (): HTMLElement => fixture.nativeElement.querySelector("mona-color-picker");
    const dialog = (): HTMLElement | null => document.body.querySelector("[role='dialog']");
    const tiles = (): HTMLElement[] => [...document.body.querySelectorAll<HTMLElement>("[data-color-index]")];
    const stops = (): HTMLElement[] =>
        [
            ...(dialog() as HTMLElement).querySelectorAll<HTMLElement>(
                "button:not([disabled]), input:not([disabled]), [tabindex]"
            )
        ].filter(element => element.tabIndex >= 0);

    async function open(): Promise<void> {
        picker().focus();
        picker().click();
        await until(fixture, () => dialog() !== null && dialog()?.contains(document.activeElement) === true);
    }

    async function closed(): Promise<void> {
        await until(fixture, () => dialog() === null);
        await settle(fixture);
    }

    beforeEach(async () => {
        fixture = TestBed.createComponent(HostComponent);
        host = fixture.componentInstance;
        await settle(fixture);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        document.querySelectorAll(".cdk-overlay-container").forEach(element => element.remove());
    });

    describe("Tab in the gradient popup", () => {
        beforeEach(async () => {
            host.view.set("gradient");
            await settle(fixture);
            await open();
        });

        it("reaches every control, with the saturation handle first", () => {
            const controls = stops();

            expect(document.activeElement).toBe(controls[0]);
            expect(controls[0].getAttribute("role")).toBe("slider");
            expect(controls.map(control => control.textContent?.trim())).toContain("Apply");
            expect(controls.length).toBeGreaterThan(8);
        });

        it("leaves the popup open and Tab to the browser in between", async () => {
            const event = press(stops()[0], "Tab");
            await settle(fixture);

            expect(event.defaultPrevented).toBe(false);
            expect(dialog()).not.toBeNull();
        });

        it("leaves Shift+Tab to the browser in between", async () => {
            const controls = stops();
            controls[3].focus();

            const event = press(controls[3], "Tab", { shiftKey: true });
            await settle(fixture);

            expect(event.defaultPrevented).toBe(false);
            expect(dialog()).not.toBeNull();
        });

        it("closes past the last control, with focus back on the picker", async () => {
            const controls = stops();
            const last = controls[controls.length - 1];
            last.focus();

            const event = press(last, "Tab");

            expect(event.defaultPrevented).toBe(true);
            await closed();
            expect(document.activeElement).toBe(picker());
        });

        it("closes before the first control, with focus back on the picker", async () => {
            const event = press(stops()[0], "Tab", { shiftKey: true });

            expect(event.defaultPrevented).toBe(true);
            await closed();
            expect(document.activeElement).toBe(picker());
        });

        it("discards an edit when Tab closes it", async () => {
            press(stops()[0], "ArrowDown");
            press(stops()[0], "Tab", { shiftKey: true });
            await closed();

            expect(host.value()).toBe("#222222");
        });

        it("lets a keyboard user apply a color", async () => {
            press(stops()[0], "PageUp");
            await settle(fixture);
            const apply = stops().find(control => control.textContent?.trim() === "Apply") as HTMLElement;
            apply.focus();

            apply.click();
            await closed();

            expect(host.value()).toBe("#626262");
            expect(document.activeElement).toBe(picker());
        });

        it("Cancel closes without a change", async () => {
            press(stops()[0], "PageUp");
            await settle(fixture);
            const cancel = stops().find(control => control.textContent?.trim() === "Cancel") as HTMLElement;

            cancel.click();
            await closed();

            expect(host.value()).toBe("#222222");
        });

        it("Apply with no edit keeps the value as written", async () => {
            const apply = stops().find(control => control.textContent?.trim() === "Apply") as HTMLElement;

            apply.click();
            await closed();

            expect(host.value()).toBe("#222222");
        });
    });

    describe("palette popup", () => {
        it("opens on the selected color", async () => {
            await open();

            expect(document.activeElement).toBe(tiles()[1]);
        });

        it("opens on the first color with no value", async () => {
            host.value.set(null);
            await settle(fixture);

            await open();

            expect(document.activeElement).toBe(tiles()[0]);
        });

        it("has no Tab stop of its own", async () => {
            await open();

            expect(dialog()?.getAttribute("tabindex")).toBe("-1");
            expect(stops()).toEqual([tiles()[1]]);
        });

        it("closes on Tab from the only stop", async () => {
            await open();

            press(tiles()[1], "Tab");

            await closed();
            expect(document.activeElement).toBe(picker());
        });

        describe("with a clear button", () => {
            let clear: HTMLButtonElement;

            beforeEach(async () => {
                host.showClearButton.set(true);
                await settle(fixture);
                await open();
                clear = dialog()?.querySelector("button") as HTMLButtonElement;
            });

            it("reaches the button with Shift+Tab", async () => {
                const event = press(tiles()[1], "Tab", { shiftKey: true });
                await settle(fixture);

                expect(event.defaultPrevented).toBe(false);
                expect(dialog()).not.toBeNull();
            });

            it.each(["Enter", " "])("leaves %j on the button to the button", async key => {
                clear.focus();

                const event = press(clear, key);
                await settle(fixture);

                expect(event.defaultPrevented).toBe(false);
                expect(document.activeElement).toBe(clear);
                expect(host.value()).toBe("#222222");
            });

            it("closes before the button", async () => {
                clear.focus();

                press(clear, "Tab", { shiftKey: true });

                await closed();
            });

            it("clears on activation", async () => {
                clear.click();

                await closed();
                expect(host.value()).toBeNull();
            });
        });

        it("keeps the color and closes when the current color is chosen again", async () => {
            await open();

            tiles()[1].click();

            await closed();
            expect(host.value()).toBe("#222222");
        });

        it("keeps the popup open on the same color with closeOnSelect off", async () => {
            host.closeOnSelect.set(false);
            await settle(fixture);
            await open();

            tiles()[1].click();
            await settle(fixture);

            expect(dialog()).not.toBeNull();
            expect(host.value()).toBe("#222222");
        });

        it("renders a generator, and still names the value from it", async () => {
            function* colors(): Generator<ColorPaletteItem> {
                yield { color: "#222222", name: "Graphite" };
                yield { color: "#333333", name: "Coal" };
            }
            host.palette.set(colors());
            await settle(fixture);

            expect(picker().querySelector(".sr-only")?.textContent).toBe("Graphite");

            await open();
            expect(tiles()).toHaveLength(2);
            expect(tiles()[0].getAttribute("aria-label")).toBe("Graphite, #222222");
        });

        it("passes the tile size on", async () => {
            host.tileSize.set(32);
            await settle(fixture);

            await open();

            expect(dialog()?.querySelector<HTMLElement>("mona-color-palette")?.style.gridAutoRows).toBe("32px");
        });

        it("can scroll instead of overflowing a narrow screen", async () => {
            await open();

            expect(dialog()?.className).toContain("overflow-auto");
            expect(dialog()?.className).toContain("max-w-[calc(100vw-1rem)]");
        });
    });

    describe("current color", () => {
        const text = (): string | null | undefined => picker().querySelector(".sr-only")?.textContent;

        it("exposes the value", () => {
            expect(text()).toBe("#222222");
        });

        it("says when there is none", async () => {
            host.value.set(null);
            await settle(fixture);

            expect(text()).toBe("No color");
        });

        it("uses the palette's name, for any spelling of the color", async () => {
            host.palette.set([{ color: "#ABCDEF", name: "Sky" }]);
            host.value.set("rgb(171, 205, 239)");
            await settle(fixture);

            expect(text()).toBe("Sky");
        });

        it("falls back to the value for a color the palette doesn't name", async () => {
            host.palette.set([{ color: "#ABCDEF" }, "#222222"]);
            await settle(fixture);

            expect(text()).toBe("#222222");
        });
    });

    describe("closing", () => {
        it("leaves focus on what the user clicked", async () => {
            await open();
            const other: HTMLInputElement = fixture.nativeElement.querySelector("#other");

            other.focus();
            other.click();
            document.body.click();
            await closed();

            expect(document.activeElement).toBe(other);
        });

        it("returns focus after Escape", async () => {
            await open();

            press(document.activeElement as Element, "Escape");

            await closed();
            expect(document.activeElement).toBe(picker());
        });

        it("marks the field touched once, on closing", async () => {
            await open();
            expect(host.touches).toBe(0);

            press(document.activeElement as Element, "Escape");
            await closed();

            expect(host.touches).toBe(1);
        });

        it("closes with its host, without an error", async () => {
            await open();

            host.shown.set(false);
            await closed();

            expect(host.touches).toBe(0);
        });

        it("closes when the whole view is destroyed", async () => {
            await open();

            fixture.destroy();

            await vi.waitFor(() => expect(dialog()).toBeNull());
        });

        it("doesn't emit from a destroyed picker", async () => {
            await open();
            const warn = vi.spyOn(console, "warn");

            fixture.destroy();
            await vi.waitFor(() => expect(dialog()).toBeNull());

            expect(warn).not.toHaveBeenCalled();
        });

        it.each([
            ["disabled", (): void => host.disabled.set(true)],
            ["read-only", (): void => host.isReadonly.set(true)]
        ])("closes on becoming %s", async (_name, change) => {
            await open();

            change();

            await closed();
        });

        it("doesn't reopen on becoming enabled again", async () => {
            host.disabled.set(true);
            await settle(fixture);
            host.disabled.set(false);
            await settle(fixture);

            expect(dialog()).toBeNull();
        });
    });

    describe("Escape", () => {
        it("reaches an overlay around a closed picker", async () => {
            const onDocument = vi.fn();
            document.addEventListener("keydown", onDocument);
            picker().focus();

            const event = press(picker(), "Escape");
            document.removeEventListener("keydown", onDocument);

            expect(event.defaultPrevented).toBe(false);
            expect(onDocument).toHaveBeenCalledTimes(1);
        });
    });

    describe("ARIA", () => {
        it("only points at the popup while it's open", async () => {
            expect(picker().hasAttribute("aria-controls")).toBe(false);

            await open();
            expect(picker().getAttribute("aria-controls")).toBe(dialog()?.id);

            press(document.activeElement as Element, "Escape");
            await closed();
            expect(picker().hasAttribute("aria-controls")).toBe(false);
        });

        it.each([
            ["closed", false, "palette"],
            ["with the palette open", true, "palette"],
            ["with the gradient open", true, "gradient"]
        ] as const)("has no axe violations %s", async (_name, opened, view) => {
            host.view.set(view);
            await settle(fixture);
            if (opened) {
                await open();
            }

            const result = await axe.run(document.body, {
                rules: { "color-contrast": { enabled: false }, region: { enabled: false } }
            });

            expect(result.violations.map(violation => violation.id)).toEqual([]);
        });

        it("takes its name from a wrapping label", async () => {
            const wrapped = TestBed.createComponent(WrappedHostComponent);
            await settle(wrapped);
            const element: HTMLElement = wrapped.nativeElement.querySelector("mona-color-picker");

            const caption = wrapped.nativeElement.querySelector(`[id="${element.getAttribute("aria-labelledby")}"]`);

            expect(caption?.textContent).toContain("Fill");
            expect(element.hasAttribute("aria-label")).toBe(false);
        });

        it("focuses from the label", async () => {
            const wrapped = TestBed.createComponent(WrappedHostComponent);
            await settle(wrapped);
            const element: HTMLElement = wrapped.nativeElement.querySelector("mona-color-picker");
            const caption: HTMLElement = wrapped.nativeElement.querySelector(
                `[id="${element.getAttribute("aria-labelledby")}"]`
            );

            caption.click();

            expect(document.activeElement).toBe(element);
        });
    });

    describe("gradient options", () => {
        beforeEach(async () => {
            host.view.set("gradient");
            await settle(fixture);
        });

        it("writes the chosen format", async () => {
            host.format.set("rgb");
            await settle(fixture);
            await open();
            press(stops()[0], "PageUp");
            await settle(fixture);

            (stops().find(control => control.textContent?.trim() === "Apply") as HTMLElement).click();
            await closed();

            expect(host.value()).toBe("rgba(98, 98, 98, 1)");
        });

        it("writes at once without buttons", async () => {
            host.showButtons.set(false);
            await settle(fixture);
            await open();

            expect(stops().find(control => control.textContent?.trim() === "Apply")).toBeUndefined();

            press(stops()[0], "PageUp");
            await settle(fixture);

            expect(host.value()).toBe("#626262");
        });
    });

    describe("value template", () => {
        it("gets null, and marks the form field touched only on closing", async () => {
            const formFixture = TestBed.createComponent(FormHostComponent);
            await settle(formFixture);
            const element: HTMLElement = formFixture.nativeElement.querySelector("mona-color-picker");

            expect(formFixture.nativeElement.querySelector(".typed").textContent).toBe("none");

            element.focus();
            element.click();
            await until(formFixture, () => dialog()?.contains(document.activeElement) === true);
            expect(element.hasAttribute("aria-invalid")).toBe(false);

            press(document.activeElement as Element, "Escape");
            await until(formFixture, () => dialog() === null);
            await settle(formFixture);
            expect(element.getAttribute("aria-invalid")).toBe("true");
        });
    });
});
