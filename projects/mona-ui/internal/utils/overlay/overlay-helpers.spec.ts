import { addAriaReference, removeAriaReference } from "../core/ariaReferences";
import { HOVER_GRACE, HoverIntent, listenForHover, onDisconnect } from "./hoverIntent";
import { overlaySidePositions, resolveOverlaySide, sideOfPosition } from "./overlaySide";

describe("overlay helpers", () => {
    afterEach(() => vi.useRealTimers());

    describe("aria references", () => {
        it("adds and removes one id, keeping the others", () => {
            const element = document.createElement("button");
            element.setAttribute("aria-describedby", "help  hint");
            addAriaReference(element, "aria-describedby", "tip");
            addAriaReference(element, "aria-describedby", "tip");
            expect(element.getAttribute("aria-describedby")).toBe("help hint tip");
            removeAriaReference(element, "aria-describedby", "tip");
            expect(element.getAttribute("aria-describedby")).toBe("help hint");
            removeAriaReference(element, "aria-describedby", "help");
            removeAriaReference(element, "aria-describedby", "hint");
            expect(element.hasAttribute("aria-describedby")).toBe(false);
        });
    });

    describe("overlay sides", () => {
        it("resolves start and end against the direction, and keeps left and right physical", () => {
            expect(resolveOverlaySide("start", "ltr")).toBe("left");
            expect(resolveOverlaySide("start", "rtl")).toBe("right");
            expect(resolveOverlaySide("end", "rtl")).toBe("left");
            expect(resolveOverlaySide("left", "rtl")).toBe("left");
        });

        it.each([
            ["top", "ltr"],
            ["bottom", "ltr"],
            ["left", "ltr"],
            ["right", "ltr"],
            ["left", "rtl"],
            ["right", "rtl"]
        ] as const)(
            "places %s in %s with its flip on the opposite side, and reads the side back",
            (side, direction) => {
                const [primary, flipped] = overlaySidePositions(side, 12, direction);
                expect(sideOfPosition(primary, direction)).toBe(side);
                const opposite = { bottom: "top", left: "right", right: "left", top: "bottom" }[side];
                expect(sideOfPosition(flipped, direction)).toBe(opposite);
                const gap = (primary.offsetX ?? 0) + (primary.offsetY ?? 0);
                const flippedGap = (flipped.offsetX ?? 0) + (flipped.offsetY ?? 0);
                expect(gap).toBe(side === "top" || side === "left" ? -12 : 12);
                expect(flippedGap).toBe(-gap);
            }
        );
    });

    describe("HoverIntent", () => {
        function setup(showDelay = 0, hideDelay = 0) {
            const log: string[] = [];
            const intent: HoverIntent = new HoverIntent({
                hide: () => log.push("hide"),
                hideDelay: () => hideDelay,
                show: anchor => {
                    log.push(`show ${anchor.id}`);
                    intent.opened(anchor, null);
                },
                showDelay: () => showDelay
            });
            const a = Object.assign(document.createElement("button"), { id: "a" });
            const b = Object.assign(document.createElement("button"), { id: "b" });
            return { a, b, intent, log };
        }

        it("keeps the popup while focus stays, even when the pointer leaves", () => {
            vi.useFakeTimers();
            const { a, intent, log } = setup();
            intent.enter(a, "focus");
            intent.enter(a, "pointer");
            intent.leave(a, "pointer");
            vi.advanceTimersByTime(HOVER_GRACE * 2);
            expect(log).toEqual(["show a"]);
            intent.leave(a, "focus");
            expect(log).toEqual(["show a", "hide"]);
        });

        it("replaces the popup when another anchor is entered", () => {
            const { a, b, intent, log } = setup();
            intent.enter(a, "pointer");
            intent.enter(b, "pointer");
            expect(log).toEqual(["show a", "hide", "show b"]);
            expect(intent.anchor).toBe(b);
        });

        it("stays closed after a dismissal until the anchor is left", () => {
            const { a, intent, log } = setup();
            intent.enter(a, "pointer");
            intent.closed(a, true);
            intent.enter(a, "pointer");
            expect(log).toEqual(["show a"]);
            intent.leave(a, "pointer");
            intent.enter(a, "pointer");
            expect(log).toEqual(["show a", "show a"]);
        });

        it("delegates pointer and focus from a root, ignoring touch and moves inside the anchor", () => {
            const { a, intent, log } = setup();
            const child = document.createElement("span");
            a.append(child);
            document.body.append(a);
            const stop = listenForHover(document, node => node.closest<HTMLElement>("#a"), intent);

            child.dispatchEvent(new PointerEvent("pointerover", { bubbles: true, pointerType: "touch" }));
            expect(log).toEqual([]);
            child.dispatchEvent(new PointerEvent("pointerover", { bubbles: true, pointerType: "mouse" }));
            child.dispatchEvent(
                new PointerEvent("pointerout", { bubbles: true, pointerType: "mouse", relatedTarget: a })
            );
            expect(log).toEqual(["show a"]);
            expect(intent.anchor).toBe(a);

            stop();
            a.remove();
        });
    });

    it("reports when an element leaves the document", async () => {
        const element = document.createElement("div");
        document.body.append(element);
        const callback = vi.fn();
        onDisconnect(element, callback);
        element.remove();
        await Promise.resolve();
        expect(callback).toHaveBeenCalledTimes(1);
    });
});
