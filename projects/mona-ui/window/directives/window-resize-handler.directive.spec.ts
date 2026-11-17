import { OverlayContainer } from "@angular/cdk/overlay";
import { ApplicationRef } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { MONA_DEFAULT_LOCALE, MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ResizeEvent } from "../models/ResizeEvent";
import type { WindowRef } from "../models/WindowRef";
import type { WindowResizeHandlerDirection } from "../models/WindowResizeHandlerDirection";
import type { WindowSettings } from "../models/WindowSettings";
import { WindowService } from "../services/window.service";

/** The test viewport is 1024 by 768; every window starts 400 by 300 with its corner at (100, 100). */
describe("WindowResizeHandlerDirective", () => {
    let overlayContainer: HTMLElement;
    let service: WindowService;

    beforeEach(() => {
        TestBed.inject(MonaI18nService).use(MONA_DEFAULT_LOCALE);
        overlayContainer = TestBed.inject(OverlayContainer).getContainerElement();
        service = TestBed.inject(WindowService);
    });

    afterEach(() => {
        overlayContainer.replaceChildren();
        vi.restoreAllMocks();
    });

    function open(settings: Partial<WindowSettings> = {}): { resizes: ResizeEvent[]; windowRef: WindowRef<unknown> } {
        const windowRef = service.open({ resizable: true, title: "Resizable", ...settings });
        TestBed.inject(ApplicationRef).tick();
        vi.spyOn(windowRef.element, "getBoundingClientRect").mockReturnValue(new DOMRect(100, 100, 400, 300));
        const resizes: ResizeEvent[] = [];
        windowRef.resize$.subscribe(event => resizes.push(event));
        return { resizes, windowRef };
    }

    function handle(windowRef: WindowRef<unknown>, direction: WindowResizeHandlerDirection): HTMLElement {
        const element = windowRef.element.querySelector<HTMLElement>(`[data-direction="${direction}"]`);
        if (element == null) {
            throw new Error(`No ${direction} handle`);
        }
        return element;
    }

    function pointer(
        target: EventTarget,
        type: string,
        init: MouseEventInit & { isPrimary?: boolean; pointerId?: number } = {}
    ): MouseEvent {
        const event = new MouseEvent(type, { bubbles: true, cancelable: true, button: 0, ...init });
        Object.defineProperties(event, {
            isPrimary: { value: init.isPrimary ?? true },
            pointerId: { value: init.pointerId ?? 1 }
        });
        target.dispatchEvent(event);
        return event;
    }

    /** Drags a handle from (300, 250) by the given amounts, in one move, and lets go. */
    function drag(
        windowRef: WindowRef<unknown>,
        direction: WindowResizeHandlerDirection,
        dx: number,
        dy: number
    ): void {
        pointer(handle(windowRef, direction), "pointerdown", { clientX: 300, clientY: 250 });
        pointer(document, "pointermove", { clientX: 300 + dx, clientY: 250 + dy });
        pointer(document, "pointerup");
    }

    function last(resizes: ResizeEvent[]): ResizeEvent | undefined {
        return resizes[resizes.length - 1];
    }

    describe("each edge and corner", () => {
        const cases: Array<[WindowResizeHandlerDirection, number, number, ResizeEvent]> = [
            ["east", 50, 0, { height: 300, left: 100, top: 100, width: 450 }],
            ["west", -50, 0, { height: 300, left: 50, top: 100, width: 450 }],
            ["south", 0, 40, { height: 340, left: 100, top: 100, width: 400 }],
            ["north", 0, -40, { height: 340, left: 100, top: 60, width: 400 }],
            ["northeast", 30, -20, { height: 320, left: 100, top: 80, width: 430 }],
            ["northwest", -30, -20, { height: 320, left: 70, top: 80, width: 430 }],
            ["southeast", 30, 20, { height: 320, left: 100, top: 100, width: 430 }],
            ["southwest", -30, 20, { height: 320, left: 70, top: 100, width: 430 }]
        ];

        it.each(cases)("resizes from the %s handle", (direction, dx, dy, expected) => {
            const { resizes, windowRef } = open();
            drag(windowRef, direction, dx, dy);

            expect(last(resizes)).toEqual(expected);
            const style = windowRef.element.style;
            expect(style.marginLeft).toBe(`${expected.left}px`);
            expect(style.marginTop).toBe(`${expected.top}px`);
            if (dx !== 0) {
                expect(style.width).toBe(`${expected.width}px`);
            }
            if (dy !== 0) {
                expect(style.height).toBe(`${expected.height}px`);
            }
        });

        it("sizes only the axis of the edge it drags", () => {
            const { windowRef } = open();
            const height = windowRef.element.style.height;
            drag(windowRef, "east", 50, 80);

            expect(windowRef.element.style.width).toBe("450px");
            expect(windowRef.element.style.height).toBe(height);
        });
    });

    describe("limits", () => {
        it("stops at the minimum size when one move goes past it", () => {
            const { resizes, windowRef } = open({ minHeight: 120, minWidth: 200 });

            drag(windowRef, "east", -300, 0);
            expect(last(resizes)).toEqual({ height: 300, left: 100, top: 100, width: 200 });

            drag(windowRef, "north", 0, 250);
            expect(last(resizes)).toEqual({ height: 120, left: 100, top: 280, width: 400 });
        });

        it("stops at the maximum size when one move goes past it", () => {
            const { resizes, windowRef } = open({ maxHeight: 360, maxWidth: 500 });

            drag(windowRef, "west", -300, 0);
            expect(last(resizes)).toEqual({ height: 300, left: 0, top: 100, width: 500 });

            drag(windowRef, "south", 0, 200);
            expect(last(resizes)).toEqual({ height: 360, left: 100, top: 100, width: 400 });
        });

        it("stops at the edges of the viewport", () => {
            const { resizes, windowRef } = open();

            drag(windowRef, "east", 900, 0);
            expect(last(resizes)?.width).toBe(924);
            drag(windowRef, "south", 0, 900);
            expect(last(resizes)?.height).toBe(668);
            drag(windowRef, "northwest", -500, -500);
            expect(last(resizes)).toEqual({ height: 400, left: 0, top: 0, width: 500 });
        });

        it("uses the default minimum of 50 when none is set", () => {
            const { resizes, windowRef } = open();

            drag(windowRef, "southwest", 600, -600);
            expect(last(resizes)).toEqual({ height: 50, left: 450, top: 100, width: 50 });
        });

        it("resizes a corner on the axis still in range when the other has reached its limit", () => {
            const { resizes, windowRef } = open({ minHeight: 280 });

            drag(windowRef, "southeast", 60, -100);
            expect(last(resizes)).toEqual({ height: 280, left: 100, top: 100, width: 460 });
        });
    });

    describe("pointer handling", () => {
        it("follows only the primary button and the pointer that started", () => {
            const { resizes, windowRef } = open();

            pointer(handle(windowRef, "east"), "pointerdown", { button: 2, clientX: 300 });
            pointer(document, "pointermove", { clientX: 350 });
            pointer(handle(windowRef, "east"), "pointerdown", { clientX: 300, isPrimary: false });
            pointer(document, "pointermove", { clientX: 350 });
            expect(resizes).toEqual([]);

            pointer(handle(windowRef, "east"), "pointerdown", { clientX: 300, pointerId: 7 });
            pointer(document, "pointermove", { clientX: 380, pointerId: 8 });
            expect(resizes).toEqual([]);
            pointer(document, "pointermove", { clientX: 320, pointerId: 7 });
            pointer(document, "pointerup", { pointerId: 8 });
            pointer(document, "pointermove", { clientX: 340, pointerId: 7 });
            expect(resizes.map(event => event.width)).toEqual([420, 440]);
        });

        it("stops on pointerup or pointercancel, and restores text selection", () => {
            const { resizes, windowRef } = open();
            const selectStart = (): boolean => true;
            document.onselectstart = selectStart;

            const down = pointer(handle(windowRef, "east"), "pointerdown", { clientX: 300 });
            expect(down.defaultPrevented).toBe(true);
            expect(document.onselectstart).not.toBe(selectStart);
            pointer(document, "pointercancel");
            pointer(document, "pointermove", { clientX: 400 });

            expect(resizes).toEqual([]);
            expect(document.onselectstart).toBe(selectStart);
            document.onselectstart = null;
        });

        it("stops listening when the window closes during a resize", () => {
            const { resizes, windowRef } = open();
            pointer(handle(windowRef, "east"), "pointerdown", { clientX: 300 });

            windowRef.close();
            TestBed.inject(ApplicationRef).tick();
            overlayContainer
                .querySelectorAll<HTMLElement>(".mona-popup-wrapper > div")
                .forEach(element => element.dispatchEvent(new Event("animationend", { bubbles: true })));
            TestBed.inject(ApplicationRef).tick();

            pointer(document, "pointermove", { clientX: 400 });
            expect(resizes).toEqual([]);
            expect(document.onselectstart).toBeNull();
        });
    });
});
