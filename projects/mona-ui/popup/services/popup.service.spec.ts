import { Overlay, OverlayContainer } from "@angular/cdk/overlay";
import { ApplicationRef, Component, ElementRef } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { PopupRef } from "../models/PopupRef";

import { PopupService } from "./popup.service";

@Component({
    template: "<div>Popup content</div>"
})
class PopupTestContentComponent {}

describe("PopupService", () => {
    let service: PopupService;
    let popupRef: PopupRef | null = null;
    let testElements: HTMLElement[] = [];

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [PopupTestContentComponent]
        });
        service = TestBed.inject(PopupService);
        testElements = [];
    });

    afterEach(() => {
        popupRef?.close(undefined, 0);
        popupRef = null;
        testElements.forEach(element => element.remove());
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });

    it("uses the CDK block scroll strategy when requested", () => {
        const anchor = createAnchor();
        const overlay = TestBed.inject(Overlay);
        const blockScrollStrategy = overlay.scrollStrategies.block();
        const blockSpy = vi.spyOn(overlay.scrollStrategies, "block").mockReturnValue(blockScrollStrategy);

        popupRef = service.create({
            anchor,
            animation: false,
            blockScroll: true,
            content: PopupTestContentComponent
        });

        expect(blockSpy).toHaveBeenCalledOnce();
        expect(popupRef.overlayRef.getConfig().scrollStrategy).toBe(blockScrollStrategy);
    });

    it("should update position when a plain scrollable ancestor scrolls", () => {
        const { anchor, scrollContainer } = createScrollableAnchor();

        popupRef = service.create({
            anchor,
            animation: false,
            content: PopupTestContentComponent
        });
        const updatePositionSpy = vi.spyOn(popupRef.overlayRef, "updatePosition");

        scrollContainer.dispatchEvent(new Event("scroll"));

        expect(updatePositionSpy).toHaveBeenCalledTimes(1);
    });

    it("should not update position on ancestor scroll when scroll tracking is disabled", () => {
        const { anchor, scrollContainer } = createScrollableAnchor();

        popupRef = service.create({
            anchor,
            animation: false,
            content: PopupTestContentComponent,
            withScrollTracking: false
        });
        const updatePositionSpy = vi.spyOn(popupRef.overlayRef, "updatePosition");

        scrollContainer.dispatchEvent(new Event("scroll"));

        expect(updatePositionSpy).not.toHaveBeenCalled();
    });

    it("should update position for ElementRef anchors when a plain scrollable ancestor scrolls", () => {
        const { anchor, scrollContainer } = createScrollableAnchor();

        popupRef = service.create({
            anchor: new ElementRef(anchor),
            animation: false,
            content: PopupTestContentComponent
        });
        const updatePositionSpy = vi.spyOn(popupRef.overlayRef, "updatePosition");

        scrollContainer.dispatchEvent(new Event("scroll"));

        expect(updatePositionSpy).toHaveBeenCalledTimes(1);
    });

    it("should close the popup when Escape is pressed", async () => {
        const anchor = createAnchor();

        popupRef = service.create({
            anchor,
            animation: false,
            content: PopupTestContentComponent
        });
        await TestBed.inject(ApplicationRef).tick();

        let closed = false;
        popupRef.closed.subscribe(() => (closed = true));

        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));

        expect(closed).toBe(true);
        popupRef = null;
    });

    it("should not close the popup on Escape when closeOnEscape is false", async () => {
        const anchor = createAnchor();

        popupRef = service.create({
            anchor,
            animation: false,
            content: PopupTestContentComponent,
            closeOnEscape: false
        });
        await TestBed.inject(ApplicationRef).tick();

        let closed = false;
        popupRef.closed.subscribe(() => (closed = true));

        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));

        expect(closed).toBe(false);
    });

    it("should close the popup on an outside click", async () => {
        const anchor = createAnchor();

        popupRef = service.create({
            anchor,
            animation: false,
            content: PopupTestContentComponent
        });
        await TestBed.inject(ApplicationRef).tick();

        let closed = false;
        popupRef.closed.subscribe(() => (closed = true));

        const outsideElement = document.createElement("div");
        document.body.append(outsideElement);
        testElements.push(outsideElement);
        outsideElement.dispatchEvent(new PointerEvent("click", { bubbles: true }));

        expect(closed).toBe(true);
        popupRef = null;
    });

    it("should not close the popup when clicking the anchor element", () => {
        const anchor = createAnchor();

        popupRef = service.create({
            anchor,
            animation: false,
            content: PopupTestContentComponent
        });

        let closed = false;
        popupRef.closed.subscribe(() => (closed = true));

        anchor.dispatchEvent(new PointerEvent("click", { bubbles: true }));

        expect(closed).toBe(false);
    });

    /*
     * The backdrop is detached at the start of the close so it fades out alongside the leave animation
     * instead of vanishing in one frame when the overlay is disposed. It must not wait for the animation.
     */
    it("detaches the backdrop when the close starts, before the popup is disposed", () => {
        const anchor = createAnchor();
        const overlayContainer = TestBed.inject(OverlayContainer).getContainerElement();

        popupRef = service.create({
            anchor,
            animation: { enter: "mona-popup-enter", leave: "mona-popup-leave" },
            content: PopupTestContentComponent,
            hasBackdrop: true
        });
        TestBed.inject(ApplicationRef).tick();

        const backdrop = overlayContainer.querySelector<HTMLElement>(".cdk-overlay-backdrop");
        expect(backdrop).not.toBeNull();
        expect(backdrop?.style.pointerEvents).toBe("");

        popupRef.close();
        TestBed.inject(ApplicationRef).tick();

        // CDK keeps the element until its own fade-out finishes; detaching is what starts that fade.
        expect(backdrop?.style.pointerEvents).toBe("none");
        expect(popupRef.overlayRef.hasAttached()).toBe(true);
    });

    /*
     * An `animationcancel` is also raised when the enter animation is replaced by the leave animation, so
     * it must not be treated as the leave having completed — the fallback timer owns that case instead.
     */
    it("does not dispose the popup when the leave animation is cancelled", async () => {
        const anchor = createAnchor();
        const overlayContainer = TestBed.inject(OverlayContainer).getContainerElement();
        let closed = false;

        popupRef = service.create({
            anchor,
            animation: { enter: "mona-popup-enter", leave: "mona-popup-leave" },
            content: PopupTestContentComponent
        });
        popupRef.closed.subscribe(() => (closed = true));
        TestBed.inject(ApplicationRef).tick();

        popupRef.close();
        const animationElement = overlayContainer.querySelector(".mona-popup-wrapper > div");
        animationElement?.dispatchEvent(new Event("animationcancel", { bubbles: true }));
        TestBed.inject(ApplicationRef).tick();

        expect(closed).toBe(false);

        await new Promise(resolve => setTimeout(resolve));
        TestBed.inject(ApplicationRef).tick();

        expect(closed).toBe(true);
    });

    it("should use custom positions array when provided", () => {
        const anchor = createAnchor();
        const customPositions = [
            {
                originX: "start" as const,
                originY: "top" as const,
                overlayX: "end" as const,
                overlayY: "bottom" as const
            }
        ];

        const overlay = TestBed.inject(Overlay);
        const flexStrategyBuilder = overlay.position().flexibleConnectedTo(anchor);
        const withPositionsSpy = vi.spyOn(flexStrategyBuilder, "withPositions");
        vi.spyOn(overlay.position(), "flexibleConnectedTo").mockReturnValue(flexStrategyBuilder);

        popupRef = service.create({
            anchor,
            animation: false,
            content: PopupTestContentComponent,
            positions: customPositions
        });

        expect(withPositionsSpy).toHaveBeenCalledWith(customPositions);
    });

    function createAnchor(): HTMLElement {
        const anchor = document.createElement("button");
        anchor.textContent = "Open popup";
        document.body.append(anchor);
        testElements.push(anchor);
        return anchor;
    }

    function createScrollableAnchor(): { anchor: HTMLElement; scrollContainer: HTMLElement } {
        const scrollContainer = document.createElement("div");
        scrollContainer.style.overflowY = "auto";
        Object.defineProperties(scrollContainer, {
            clientHeight: { configurable: true, value: 100 },
            scrollHeight: { configurable: true, value: 200 }
        });

        const anchor = document.createElement("button");
        anchor.textContent = "Open popup";
        scrollContainer.append(anchor);
        document.body.append(scrollContainer);
        testElements.push(scrollContainer);

        return { anchor, scrollContainer };
    }
});
