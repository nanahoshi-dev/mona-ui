import { Component, signal, viewChildren } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SplitterPaneComponent } from "../components/splitter-pane/splitter-pane.component";
import { SplitterComponent } from "../components/splitter/splitter.component";

interface PaneSpec {
    readonly collapsed?: boolean;
    readonly collapsible?: boolean;
    readonly label?: string;
    readonly max?: string | number | null;
    readonly min?: string | number | null;
    readonly resizable?: boolean;
    readonly size?: string;
}

@Component({
    template: `
        <mona-splitter [keyboardStep]="step()" [orientation]="orientation()" (resizeEnd)="ends.push($event)">
            @for (pane of panes(); track $index) {
                <mona-splitter-pane
                    [(collapsed)]="collapsedFlags()[$index].value"
                    [collapsible]="!!pane.collapsible"
                    [label]="pane.label ?? ''"
                    [max]="pane.max ?? null"
                    [min]="pane.min ?? null"
                    [resizable]="pane.resizable ?? true"
                    [size]="pane.size ?? '200px'">
                    <input [attr.aria-label]="'Field ' + $index" />
                </mona-splitter-pane>
            }
        </mona-splitter>
        <button type="button" id="outside">Outside</button>
    `,
    imports: [SplitterComponent, SplitterPaneComponent]
})
class HostComponent {
    public readonly collapsedFlags = signal<{ value: boolean }[]>([]);
    public readonly ends: (readonly (string | number)[])[] = [];
    public readonly orientation = signal<"horizontal" | "vertical">("horizontal");
    public readonly paneComponents = viewChildren(SplitterPaneComponent);
    public readonly panes = signal<readonly PaneSpec[]>([{}, {}]);
    public readonly step = signal(10);
}

function pointer(type: string, options: PointerEventInit = {}): PointerEvent {
    return new PointerEvent(type, { bubbles: true, cancelable: true, button: 0, pointerId: 1, ...options });
}

function rect(start: number, size: number): DOMRect {
    return {
        bottom: start + size,
        height: size,
        left: start,
        right: start + size,
        top: start,
        width: size,
        x: start,
        y: start,
        toJSON: () => ({})
    };
}

describe("mona-splitter behavior", () => {
    let fixture: ComponentFixture<HostComponent>;
    let host: HostComponent;

    async function settle(): Promise<void> {
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    }

    async function setup(panes: readonly PaneSpec[] = [{}, {}]): Promise<void> {
        fixture = TestBed.createComponent(HostComponent);
        host = fixture.componentInstance;
        host.panes.set(panes);
        host.collapsedFlags.set(panes.map(pane => ({ value: !!pane.collapsed })));
        await settle();
        measure();
        await settle();
    }

    function separators(): HTMLElement[] {
        return Array.from(fixture.nativeElement.querySelectorAll("[role='separator']"));
    }

    function paneElements(): HTMLElement[] {
        return Array.from(fixture.nativeElement.querySelectorAll("[data-pid]"));
    }

    function resizer(index = 0): HTMLElement {
        return fixture.nativeElement.querySelectorAll("mona-splitter-resizer")[index];
    }

    /** jsdom has no layout, so each pane reports the size it has been given, or 200 pixels. */
    function measure(): void {
        paneElements().forEach((element, index) => {
            vi.spyOn(element, "getBoundingClientRect").mockImplementation(() => {
                const pane = host.paneComponents()[index];
                const size = pane.collapsible() && pane.collapsed() ? 0 : Number.parseFloat(String(pane.size())) || 200;
                return rect(index * 200, size);
            });
        });
    }

    function press(key: string, options: KeyboardEventInit = {}, index = 0): KeyboardEvent {
        const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...options });
        separators()[index].dispatchEvent(event);
        return event;
    }

    function drag(to: number, options: PointerEventInit = {}): void {
        separators()[0].dispatchEvent(pointer("pointerdown", options));
        document.dispatchEvent(pointer("pointermove", { clientX: to, clientY: to, ...options }));
    }

    function sizeOf(index: number): string | number {
        return host.paneComponents()[index].size();
    }

    beforeEach(() => {
        Element.prototype.setPointerCapture = vi.fn();
        Element.prototype.releasePointerCapture = vi.fn();
        Element.prototype.hasPointerCapture = vi.fn(() => true);
        TestBed.configureTestingModule({ imports: [HostComponent] });
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    describe("Tab", () => {
        it("leaves Tab to the browser, so a middle pane's content can be reached", async () => {
            await setup([{}, {}, {}]);
            expect(press("Tab").defaultPrevented).toBe(false);
            expect(press("Tab", { shiftKey: true }, 1).defaultPrevented).toBe(false);
            expect(document.activeElement).not.toBe(separators()[1]);
        });
    });

    describe("dragging", () => {
        it("resizes both panes, and ends on pointerup", async () => {
            await setup();
            drag(250);
            expect(sizeOf(0)).toBe("250px");
            expect(sizeOf(1)).toBe("150px");

            separators()[0].dispatchEvent(pointer("pointerup"));
            document.dispatchEvent(pointer("pointermove", { clientX: 300 }));
            expect(sizeOf(0)).toBe("250px");
        });

        it("takes focus when pressed, since cancelling the press cancels the browser's own", async () => {
            await setup();
            separators()[0].dispatchEvent(pointer("pointerdown"));
            expect(document.activeElement).toBe(separators()[0]);
        });

        it("follows the vertical axis in a vertical splitter", async () => {
            await setup();
            host.orientation.set("vertical");
            await settle();
            drag(120);
            expect(sizeOf(0)).toBe("120px");
        });

        it("listens on the document only during a drag", async () => {
            const add = vi.spyOn(document, "addEventListener");
            const remove = vi.spyOn(document, "removeEventListener");
            const moves = (spy: typeof add | typeof remove): number =>
                spy.mock.calls.filter(call => call[0] === "pointermove").length;
            await setup();
            expect(moves(add)).toBe(0);

            drag(250);
            expect(moves(add)).toBe(1);
            separators()[0].dispatchEvent(pointer("pointerup"));
            expect(moves(remove)).toBe(1);
        });

        it("stops listening when destroyed in the middle of a drag", async () => {
            const remove = vi.spyOn(document, "removeEventListener");
            await setup();
            drag(250);
            const pane = host.paneComponents()[0];
            fixture.destroy();

            expect(remove.mock.calls.filter(call => call[0] === "pointermove").length).toBe(1);
            document.dispatchEvent(pointer("pointermove", { clientX: 300 }));
            expect(pane.size()).toBe("250px");
        });

        it.each(["pointercancel", "lostpointercapture"])("ends on %s", async type => {
            await setup();
            drag(250);
            await settle();
            expect(separators()[0].classList.contains("bg-border-control-hover")).toBe(true);

            separators()[0].dispatchEvent(pointer(type));
            await settle();
            document.dispatchEvent(pointer("pointermove", { clientX: 300 }));
            expect(sizeOf(0)).toBe("250px");
            expect(separators()[0].classList.contains("bg-border-control-hover")).toBe(false);
        });

        it("captures the pointer, and releases it at the end", async () => {
            await setup();
            drag(250);
            expect(Element.prototype.setPointerCapture).toHaveBeenCalledWith(1);
            separators()[0].dispatchEvent(pointer("pointerup"));
            expect(Element.prototype.releasePointerCapture).toHaveBeenCalledWith(1);
        });

        it.each([1, 2])("ignores button %s", async button => {
            await setup();
            drag(250, { button });
            expect(sizeOf(0)).toBe("200px");
        });

        it("ignores another pointer during a drag", async () => {
            await setup();
            drag(250);
            separators()[0].dispatchEvent(pointer("pointerdown", { pointerId: 2 }));
            document.dispatchEvent(pointer("pointermove", { clientX: 300, pointerId: 2 }));
            expect(sizeOf(0)).toBe("250px");

            separators()[0].dispatchEvent(pointer("pointerup", { pointerId: 2 }));
            document.dispatchEvent(pointer("pointermove", { clientX: 270 }));
            expect(sizeOf(0)).toBe("270px");
        });

        it("doesn't start when a pane isn't resizable", async () => {
            await setup([{ resizable: false }, {}]);
            drag(250);
            expect(sizeOf(0)).toBe("200px");
        });

        it("keeps the browser from taking a touch drag", async () => {
            await setup();
            expect(separators()[0].classList.contains("touch-none")).toBe(true);
        });
    });

    describe("resizeEnd", () => {
        it("fires once when a drag ends, with every pane's size", async () => {
            await setup();
            drag(250);
            document.dispatchEvent(pointer("pointermove", { clientX: 260 }));
            expect(host.ends).toEqual([]);

            separators()[0].dispatchEvent(pointer("pointerup"));
            expect(host.ends).toEqual([["260px", "140px"]]);
        });

        it("fires when a touch drag is cancelled, since the panes did move", async () => {
            await setup();
            drag(250);
            separators()[0].dispatchEvent(pointer("pointercancel"));
            expect(host.ends.length).toBe(1);
        });

        it("doesn't fire for a press that moved nothing", async () => {
            await setup();
            separators()[0].dispatchEvent(pointer("pointerdown"));
            separators()[0].dispatchEvent(pointer("pointerup"));
            expect(host.ends).toEqual([]);
        });

        it("doesn't fire when destroyed in the middle of a drag", async () => {
            await setup();
            drag(250);
            expect(() => fixture.destroy()).not.toThrow();
            expect(host.ends).toEqual([]);
        });

        it("fires after a resizing key", async () => {
            await setup();
            press("ArrowRight");
            expect(host.ends).toEqual([["210px", "190px"]]);
        });

        it("doesn't fire for a key that does nothing", async () => {
            await setup();
            press("a");
            expect(host.ends).toEqual([]);
        });
    });

    describe("collapsed panes", () => {
        const COLLAPSED: readonly PaneSpec[] = [{ collapsible: true, collapsed: true }, {}];

        it("makes a collapsed pane inert, so nothing in it can take focus", async () => {
            await setup(COLLAPSED);
            expect(paneElements()[0].hasAttribute("inert")).toBe(true);
            expect(paneElements()[0].getAttribute("aria-hidden")).toBe("true");
            expect(paneElements()[1].hasAttribute("inert")).toBe(false);
            expect(paneElements()[1].hasAttribute("aria-hidden")).toBe(false);
        });

        it("doesn't treat a pane that can't collapse as collapsed", async () => {
            await setup([{ collapsed: true }, {}]);
            expect(paneElements()[0].hasAttribute("inert")).toBe(false);
        });

        it("brings a collapsed pane back at the size it had when a key points out of it", async () => {
            await setup([{ collapsible: true, size: "300px" }, { size: "300px" }]);
            press("Enter");
            await settle();
            expect(host.paneComponents()[0].collapsed()).toBe(true);

            press("ArrowRight");
            await settle();
            expect(host.paneComponents()[0].collapsed()).toBe(false);
            expect(sizeOf(0)).toBe("300px");
        });

        it("ignores a key pointing further into a collapsed pane", async () => {
            await setup(COLLAPSED);
            press("ArrowLeft");
            await settle();
            expect(host.paneComponents()[0].collapsed()).toBe(true);
            expect(host.ends).toEqual([]);
        });

        it("does the same for a collapsed pane after the separator", async () => {
            await setup([{}, { collapsible: true, collapsed: true }]);
            press("ArrowRight");
            await settle();
            expect(host.paneComponents()[1].collapsed()).toBe(true);

            press("ArrowLeft");
            await settle();
            expect(host.paneComponents()[1].collapsed()).toBe(false);
        });

        it("still collapses when it measures nothing, as in a hidden tab", async () => {
            await setup([{ collapsible: true }, {}]);
            vi.spyOn(paneElements()[0], "getBoundingClientRect").mockReturnValue(rect(0, 0));
            press("Enter");
            await settle();
            expect(host.paneComponents()[0].collapsed()).toBe(true);
        });

        it("doesn't remember a size of nothing", async () => {
            await setup([{ collapsible: true, size: "300px" }, { size: "300px" }]);
            const element = paneElements()[0];
            const spy = vi.spyOn(element, "getBoundingClientRect").mockReturnValue(rect(0, 0));
            press("Enter");
            await settle();
            spy.mockReturnValue(rect(0, 120));
            press("Enter");
            await settle();
            expect(host.paneComponents()[0].collapsed()).toBe(false);
            expect(sizeOf(0)).toBe("120px");
        });
    });

    describe("separator semantics", () => {
        it("says which way the bar runs, across the panes", async () => {
            await setup();
            expect(separators()[0].getAttribute("aria-orientation")).toBe("vertical");
            host.orientation.set("vertical");
            await settle();
            expect(separators()[0].getAttribute("aria-orientation")).toBe("horizontal");
        });

        it("controls the pane before it", async () => {
            await setup();
            const id = separators()[0].getAttribute("aria-controls");
            expect(id).toBeTruthy();
            expect(id).toBe(paneElements()[0].id);
        });

        it("is named after that pane", async () => {
            await setup([{ label: "Navigation" }, { label: "Editor" }, {}]);
            expect(separators()[0].getAttribute("aria-label")).toBe("Navigation");
            expect(separators()[1].getAttribute("aria-label")).toBe("Editor");
        });

        it("falls back to the generic name", async () => {
            await setup();
            expect(separators()[0].getAttribute("aria-label")).toBe("Resizer");
        });

        it("reports its value and limits", async () => {
            await setup([{ min: 50, max: 350, size: "200px" }, {}]);
            press("ArrowLeft");
            await settle();
            expect(separators()[0].getAttribute("aria-valuenow")).toBe("190");
            expect(separators()[0].getAttribute("aria-valuemin")).toBe("50");
            expect(separators()[0].getAttribute("aria-valuemax")).toBe("350");
        });

        it("updates its value when a pane resizes on its own", async () => {
            const observers: ResizeObserverCallback[] = [];
            vi.stubGlobal(
                "ResizeObserver",
                class {
                    public constructor(callback: ResizeObserverCallback) {
                        observers.push(callback);
                    }
                    public disconnect(): void {}
                    public observe(): void {}
                }
            );
            await setup();
            vi.spyOn(paneElements()[0], "getBoundingClientRect").mockReturnValue(rect(0, 80));
            observers[0]([], {} as ResizeObserver);
            await settle();
            expect(separators()[0].getAttribute("aria-valuenow")).toBe("80");
        });

        it("disconnects its observer when destroyed", async () => {
            const disconnect = vi.fn();
            vi.stubGlobal(
                "ResizeObserver",
                class {
                    public disconnect = disconnect;
                    public observe(): void {}
                }
            );
            await setup();
            fixture.destroy();
            expect(disconnect).toHaveBeenCalled();
        });

        it("is a plain separator, out of the tab order, when it can't do anything", async () => {
            await setup([{ resizable: false }, {}]);
            const separator = separators()[0];
            expect(separator.hasAttribute("tabindex")).toBe(false);
            expect(separator.hasAttribute("aria-valuenow")).toBe(false);
            expect(separator.hasAttribute("aria-controls")).toBe(false);
        });

        it("stays focusable when it can still collapse a pane", async () => {
            await setup([{ resizable: false, collapsible: true }, {}]);
            expect(separators()[0].getAttribute("tabindex")).toBe("0");
        });

        it("passes axe, collapsed or not", async () => {
            await setup([{ collapsible: true, label: "One" }, { collapsed: false, label: "Two" }, {}]);
            expect((await axe.run(fixture.nativeElement)).violations).toEqual([]);
            press("Enter");
            await settle();
            expect((await axe.run(fixture.nativeElement)).violations).toEqual([]);
        });
    });

    describe("keys", () => {
        it("sends Home and End to the limits", async () => {
            await setup([{ min: 50, max: 350 }, {}]);
            expect(press("End").defaultPrevented).toBe(true);
            expect(sizeOf(0)).toBe("350px");
            expect(press("Home").defaultPrevented).toBe(true);
            expect(sizeOf(0)).toBe("50px");
        });

        it("takes its step from keyboardStep", async () => {
            await setup();
            host.step.set(25);
            await settle();
            press("ArrowRight");
            expect(sizeOf(0)).toBe("225px");
            press("ArrowLeft");
            expect(sizeOf(0)).toBe("200px");
        });

        it("uses Up and Down in a vertical splitter, not Left and Right", async () => {
            await setup();
            host.orientation.set("vertical");
            await settle();
            press("ArrowDown");
            expect(sizeOf(0)).toBe("210px");
            press("ArrowUp");
            expect(sizeOf(0)).toBe("200px");
            expect(press("ArrowRight").defaultPrevented).toBe(false);
        });

        it.each([
            [{ resizable: false }, {}],
            [{}, { resizable: false }]
        ])("doesn't resize when either pane can't: %j %j", async (first: PaneSpec, second: PaneSpec) => {
            await setup([{ ...first, collapsible: true }, second]);
            expect(press("ArrowRight").defaultPrevented).toBe(false);
            expect(press("Home").defaultPrevented).toBe(false);
            expect(sizeOf(0)).toBe("200px");
        });

        it.each(["ctrlKey", "metaKey", "shiftKey"])("leaves %s with an arrow to the browser", async modifier => {
            await setup();
            expect(press("ArrowRight", { [modifier]: true }).defaultPrevented).toBe(false);
            expect(sizeOf(0)).toBe("200px");
        });

        it("leaves Alt+arrow to the browser when nothing can collapse, so Back still works", async () => {
            await setup();
            expect(press("ArrowLeft", { altKey: true }).defaultPrevented).toBe(false);
        });

        it("uses Alt+arrow when a pane can collapse", async () => {
            await setup([{ collapsible: true }, {}]);
            expect(press("ArrowLeft", { altKey: true }).defaultPrevented).toBe(true);
            await settle();
            expect(host.paneComponents()[0].collapsed()).toBe(true);
        });

        it("leaves Enter alone when nothing can collapse", async () => {
            await setup();
            expect(press("Enter").defaultPrevented).toBe(false);
        });

        it("toggles on a double click", async () => {
            await setup([{ collapsible: true }, {}]);
            separators()[0].dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
            await settle();
            expect(host.paneComponents()[0].collapsed()).toBe(true);
        });
    });

    describe("collapse buttons", () => {
        const COLLAPSIBLE: readonly PaneSpec[] = [{ collapsible: true }, { collapsible: true }];

        function buttons(): HTMLButtonElement[] {
            return Array.from(fixture.nativeElement.querySelectorAll("mona-splitter-resizer button"));
        }

        it("aren't inside the separator", async () => {
            await setup(COLLAPSIBLE);
            resizer().dispatchEvent(new PointerEvent("pointerenter"));
            await settle();
            expect(buttons().length).toBe(2);
            expect(buttons()[0].closest("[role='separator']")).toBeNull();
            expect(separators()[0].children.length).toBe(0);
        });

        it("pass axe while showing", async () => {
            await setup(COLLAPSIBLE);
            resizer().dispatchEvent(new PointerEvent("pointerenter"));
            await settle();
            expect((await axe.run(fixture.nativeElement)).violations).toEqual([]);
        });

        it("show on hover and go when the pointer leaves", async () => {
            await setup(COLLAPSIBLE);
            expect(buttons().length).toBe(0);
            resizer().dispatchEvent(new PointerEvent("pointerenter"));
            await settle();
            expect(buttons().length).toBe(2);
            resizer().dispatchEvent(new PointerEvent("pointerleave"));
            await settle();
            expect(buttons().length).toBe(0);
        });

        it("show on focus, and stay while focus is on one of them", async () => {
            await setup(COLLAPSIBLE);
            separators()[0].focus();
            await settle();
            expect(buttons().length).toBe(2);

            buttons()[0].focus();
            await settle();
            expect(buttons().length).toBe(2);

            (fixture.nativeElement.querySelector("#outside") as HTMLElement).focus();
            await settle();
            expect(buttons().length).toBe(0);
        });

        it("stay while focus is there, even once the pointer has left", async () => {
            await setup(COLLAPSIBLE);
            separators()[0].focus();
            resizer().dispatchEvent(new PointerEvent("pointerenter"));
            resizer().dispatchEvent(new PointerEvent("pointerleave"));
            await settle();
            expect(buttons().length).toBe(2);
        });

        it("collapse, and hand focus to the separator before going away", async () => {
            await setup(COLLAPSIBLE);
            separators()[0].focus();
            await settle();
            buttons()[0].focus();
            buttons()[0].click();
            await settle();
            expect(host.paneComponents()[0].collapsed()).toBe(true);
            expect(document.activeElement).toBe(separators()[0]);
        });

        it("hand focus to the separator from the other side too", async () => {
            await setup(COLLAPSIBLE);
            separators()[0].focus();
            await settle();
            buttons()[1].focus();
            buttons()[1].click();
            await settle();
            expect(host.paneComponents()[1].collapsed()).toBe(true);
            expect(document.activeElement).toBe(separators()[0]);
        });

        it("stay through the moment focus moves onto one of them, when a render could otherwise take it away", async () => {
            await setup(COLLAPSIBLE);
            separators()[0].focus();
            await settle();
            // Zone-based apps render between the focusout and the focusin that follows it.
            separators()[0].dispatchEvent(new FocusEvent("focusout", { bubbles: true, relatedTarget: buttons()[0] }));
            fixture.detectChanges();
            expect(buttons().length).toBe(2);
        });

        it("collapse the pane on their own side", async () => {
            await setup(COLLAPSIBLE);
            resizer().dispatchEvent(new PointerEvent("pointerenter"));
            await settle();
            buttons()[1].click();
            await settle();
            expect(host.paneComponents()[1].collapsed()).toBe(true);
            expect(host.paneComponents()[0].collapsed()).toBe(false);
        });

        it("don't start a drag", async () => {
            await setup(COLLAPSIBLE);
            resizer().dispatchEvent(new PointerEvent("pointerenter"));
            await settle();
            buttons()[0].dispatchEvent(pointer("pointerdown"));
            document.dispatchEvent(pointer("pointermove", { clientX: 250 }));
            expect(sizeOf(0)).toBe("200px");
        });

        it("are real buttons that don't submit a form", async () => {
            await setup(COLLAPSIBLE);
            resizer().dispatchEvent(new PointerEvent("pointerenter"));
            await settle();
            expect(buttons()[0].type).toBe("button");
        });
    });

    describe("size limits on the pane", () => {
        it("holds min and max for the layout, not just for a drag", async () => {
            await setup([{ min: 50, max: "300px" }, {}]);
            expect(paneElements()[0].style.minWidth).toBe("50px");
            expect(paneElements()[0].style.maxWidth).toBe("300px");
            expect(paneElements()[1].style.minWidth).toBe("");
        });

        it("uses height in a vertical splitter", async () => {
            await setup([{ min: 50, max: 300 }, {}]);
            host.orientation.set("vertical");
            await settle();
            expect(paneElements()[0].style.minHeight).toBe("50px");
            expect(paneElements()[0].style.maxHeight).toBe("300px");
            expect(paneElements()[0].style.minWidth).toBe("");
        });

        it("drops them while collapsed, or the pane couldn't close", async () => {
            await setup([{ min: 50, collapsible: true, collapsed: true }, {}]);
            expect(paneElements()[0].style.minWidth).toBe("");
        });

        it("ignores a percentage instead of reading it as pixels, and warns once", async () => {
            const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
            await setup([{ min: "37%" }, {}]);
            expect(paneElements()[0].style.minWidth).toBe("");
            press("Home");
            expect(sizeOf(0)).toBe("0px");
            expect(warn.mock.calls.filter(call => String(call[0]).includes("37%")).length).toBe(1);
        });

        it("reads pixels with or without the unit", async () => {
            await setup([{ min: " 40PX " }, { max: "120" }]);
            expect(paneElements()[0].style.minWidth).toBe("40px");
            expect(paneElements()[1].style.maxWidth).toBe("120px");
        });
    });

    describe("styles", () => {
        it("gives the bar a hit area and a solid outline", async () => {
            await setup();
            const classes = separators()[0].className;
            expect(classes).toContain("before:-inset-x-[5px]");
            expect(classes).toContain("pointer-coarse:before:-inset-x-[11px]");
            expect(classes).toContain("focus-visible:outline-2");
            expect(classes).toContain("focus-visible:outline-focus-indicator");
            expect(classes).not.toContain("outline-none");
            expect(classes).not.toContain("ring-focus-indicator/35");
        });

        it("keeps the bar in forced colors", async () => {
            await setup();
            expect(separators()[0].className).toContain("forced-colors:bg-[CanvasText]");
        });

        it("runs the hit area along the other axis in a vertical splitter", async () => {
            await setup();
            host.orientation.set("vertical");
            await settle();
            expect(separators()[0].className).toContain("before:-inset-y-[5px]");
        });
    });
});
