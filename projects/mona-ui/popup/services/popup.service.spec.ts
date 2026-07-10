import { Overlay } from "@angular/cdk/overlay";
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
