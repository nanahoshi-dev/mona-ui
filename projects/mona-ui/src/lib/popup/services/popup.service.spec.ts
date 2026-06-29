import { Component, ElementRef } from "@angular/core";
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
