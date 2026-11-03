import { Overlay, OverlayContainer } from "@angular/cdk/overlay";
import {
    ApplicationRef,
    Component,
    createEnvironmentInjector,
    ElementRef,
    EnvironmentInjector,
    inject,
    InjectionToken
} from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { PopupCloseSource } from "../models/PopupCloseEvent";
import { PopupRef } from "../models/PopupRef";
import type { PopupSettings } from "../models/PopupSettings";

import { PopupService } from "./popup.service";

@Component({
    template: "<div>Popup content</div>"
})
class PopupTestContentComponent {}

@Component({
    template: `<input aria-label="Popup field" />`
})
class PopupTestInputContentComponent {}

const FEATURE_TOKEN = new InjectionToken<string>("FEATURE_TOKEN");

@Component({
    template: "{{ value }}"
})
class FeatureContentComponent {
    protected readonly value = inject(FEATURE_TOKEN);
}

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

    describe("lang", () => {
        it("gives the overlay pane the nearest lang above the anchor", () => {
            const container = document.createElement("div");
            container.setAttribute("lang", "de-CH");
            const anchor = createAnchor();
            container.appendChild(anchor);
            document.body.appendChild(container);
            testElements.push(container);

            popupRef = service.create({ anchor, animation: false, content: PopupTestContentComponent });

            expect(popupRef.overlayRef.overlayElement.getAttribute("lang")).toBe("de-CH");
        });

        it("falls back to the active Mona locale when nothing above the anchor sets lang", () => {
            const documentLang = document.documentElement.getAttribute("lang");
            document.documentElement.removeAttribute("lang");
            try {
                TestBed.inject(MonaI18nService).use({ direction: "ltr", id: "ja_JP", messages: {} });
                const anchor = createAnchor();

                popupRef = service.create({ anchor, animation: false, content: PopupTestContentComponent });

                expect(popupRef.overlayRef.overlayElement.getAttribute("lang")).toBe("ja-JP");
            } finally {
                if (documentLang != null) {
                    document.documentElement.setAttribute("lang", documentLang);
                }
            }
        });
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

    describe("Escape with several popups open", () => {
        let outerRef: PopupRef;
        let innerAnchor: HTMLElement;
        let outerClosed: boolean;
        let innerClosed: boolean;

        beforeEach(() => {
            outerClosed = false;
            innerClosed = false;
        });

        afterEach(() => {
            outerRef.close(undefined, 0);
        });

        function openNested(outer: Partial<PopupSettings> = {}, inner: Partial<PopupSettings> = {}): void {
            outerRef = service.create({
                anchor: document.body,
                animation: false,
                content: PopupTestInputContentComponent,
                positionStrategy: "global",
                ...outer
            });
            innerAnchor = outerRef.overlayRef.overlayElement.querySelector("input") as HTMLElement;
            popupRef = service.create({
                anchor: innerAnchor,
                animation: false,
                content: PopupTestContentComponent,
                ...inner
            });
            outerRef.closed.subscribe(() => (outerClosed = true));
            popupRef.closed.subscribe(() => (innerClosed = true));
        }

        function pressEscape(target: EventTarget, init: KeyboardEventInit = {}): KeyboardEvent {
            const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape", ...init });
            target.dispatchEvent(event);
            return event;
        }

        it("closes only the topmost popup", () => {
            openNested();

            pressEscape(innerAnchor);

            expect(innerClosed).toBe(true);
            expect(outerClosed).toBe(false);

            pressEscape(innerAnchor);

            expect(outerClosed).toBe(true);
        });

        it("gives a second Escape to the popup underneath while the top one plays its leave animation", () => {
            openNested({}, { animation: { enter: "mona-popup-enter", leave: "mona-popup-leave" } });
            TestBed.inject(ApplicationRef).tick();

            pressEscape(innerAnchor);
            expect(popupRef?.overlayRef.hasAttached()).toBe(true);
            expect(outerClosed).toBe(false);

            pressEscape(innerAnchor);

            expect(outerClosed).toBe(true);
        });

        it("does not let Escape through a topmost popup that does not close on Escape", () => {
            openNested({}, { closeOnEscape: false });

            pressEscape(innerAnchor);

            expect(innerClosed).toBe(false);
            expect(outerClosed).toBe(false);
        });

        it("does not close the popup underneath when a control closes the top popup on Escape itself", () => {
            openNested();
            innerAnchor.addEventListener("keydown", event => {
                if (event.key === "Escape") {
                    popupRef?.close();
                }
            });

            pressEscape(innerAnchor);

            expect(innerClosed).toBe(true);
            expect(outerClosed).toBe(false);
        });

        it("ignores an Escape whose propagation a control stopped", () => {
            openNested();
            innerAnchor.addEventListener("keydown", event => event.stopPropagation());

            pressEscape(innerAnchor);

            expect(innerClosed).toBe(false);
            expect(outerClosed).toBe(false);
        });

        // Menus call preventDefault() on every navigation key, Escape included, and still expect to close.
        it("closes the topmost popup on an Escape whose default a control prevented", () => {
            openNested();
            innerAnchor.addEventListener("keydown", event => event.preventDefault());

            pressEscape(innerAnchor);

            expect(innerClosed).toBe(true);
            expect(outerClosed).toBe(false);
        });

        it("ignores an Escape that ends an IME composition", () => {
            openNested();

            pressEscape(innerAnchor, { isComposing: true });

            expect(innerClosed).toBe(false);
            expect(outerClosed).toBe(false);
        });

        it("reports Escape as the close source", () => {
            openNested();
            let via: PopupCloseSource | undefined;
            popupRef?.closed.subscribe(event => (via = event.via));

            pressEscape(innerAnchor);

            expect(via).toBe(PopupCloseSource.Escape);
        });
    });

    describe("focus restoration", () => {
        let otherField: HTMLInputElement;

        beforeEach(() => {
            otherField = document.createElement("input");
            otherField.setAttribute("aria-label", "Other field");
            document.body.append(otherField);
            testElements.push(otherField);
        });

        it("leaves focus in a field the user moved it to", () => {
            const anchor = createAnchor();
            anchor.focus();
            popupRef = service.create({ anchor, animation: false, content: PopupTestContentComponent });

            otherField.focus();
            popupRef.close();

            expect(document.activeElement).toBe(otherField);
        });

        it("returns focus to the anchor when focus is on the page", () => {
            const anchor = createAnchor();
            anchor.focus();
            popupRef = service.create({ anchor, animation: false, content: PopupTestContentComponent });

            anchor.blur();
            popupRef.close();

            expect(document.activeElement).toBe(anchor);
        });

        it("returns focus to the anchor when focus is inside the popup", () => {
            const anchor = createAnchor();
            anchor.focus();
            popupRef = service.create({ anchor, animation: false, content: PopupTestInputContentComponent });

            popupRef.overlayRef.overlayElement.querySelector("input")?.focus();
            popupRef.close();

            expect(document.activeElement).toBe(anchor);
        });

        it("returns focus to the element inside the anchor that had it", () => {
            const anchor = document.createElement("div");
            const button = document.createElement("button");
            button.textContent = "Filter";
            anchor.append(button);
            document.body.append(anchor);
            testElements.push(anchor);
            button.focus();
            popupRef = service.create({ anchor, animation: false, content: PopupTestContentComponent });

            button.blur();
            popupRef.close();

            expect(document.activeElement).toBe(button);
        });

        it("does not focus an anchor that was not focused when the popup opened, by default", () => {
            const anchor = createAnchor();
            otherField.focus();
            popupRef = service.create({ anchor, animation: false, content: PopupTestContentComponent });

            otherField.blur();
            popupRef.close();

            expect(document.activeElement).not.toBe(anchor);
        });

        it("does not take focus from another field with restoreFocus: true", () => {
            const anchor = createAnchor();
            popupRef = service.create({
                anchor,
                animation: false,
                content: PopupTestContentComponent,
                restoreFocus: true
            });

            otherField.focus();
            popupRef.close();

            expect(document.activeElement).toBe(otherField);
        });

        it("focuses the anchor with restoreFocus: true when focus is on the page", () => {
            const anchor = createAnchor();
            popupRef = service.create({
                anchor,
                animation: false,
                content: PopupTestContentComponent,
                restoreFocus: true
            });

            popupRef.close();

            expect(document.activeElement).toBe(anchor);
        });
    });

    describe("backdrop clicks", () => {
        function clickBackdrop(ref: PopupRef): void {
            const backdrop = ref.overlayRef.backdropElement as HTMLElement;
            backdrop.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
            backdrop.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        }

        it("does not close when closeOnBackdropClick is false", () => {
            const anchor = createAnchor();
            popupRef = service.create({
                anchor,
                animation: false,
                closeOnBackdropClick: false,
                content: PopupTestContentComponent,
                hasBackdrop: true
            });
            let closed = false;
            popupRef.closed.subscribe(() => (closed = true));

            clickBackdrop(popupRef);

            expect(closed).toBe(false);
        });

        it("reports a backdrop click as BackdropClick", () => {
            const anchor = createAnchor();
            popupRef = service.create({
                anchor,
                animation: false,
                content: PopupTestContentComponent,
                hasBackdrop: true
            });
            let via: PopupCloseSource | undefined;
            popupRef.closed.subscribe(event => (via = event.via));

            clickBackdrop(popupRef);

            expect(via).toBe(PopupCloseSource.BackdropClick);
            popupRef = null;
        });
    });

    describe("injector", () => {
        it("resolves component content from the given injector", () => {
            const anchor = createAnchor();
            const injector = createEnvironmentInjector(
                [{ provide: FEATURE_TOKEN, useValue: "from the feature" }],
                TestBed.inject(EnvironmentInjector)
            );

            popupRef = service.create({ anchor, animation: false, content: FeatureContentComponent, injector });

            expect(popupRef.overlayRef.overlayElement.textContent).toContain("from the feature");
            injector.destroy();
        });

        it("still provides the popup's own tokens and providers over the given injector", () => {
            const anchor = createAnchor();
            const injector = createEnvironmentInjector(
                [{ provide: FEATURE_TOKEN, useValue: "from the feature" }],
                TestBed.inject(EnvironmentInjector)
            );

            popupRef = service.create({
                anchor,
                animation: false,
                content: FeatureContentComponent,
                injector,
                providers: [{ provide: FEATURE_TOKEN, useValue: "from providers" }]
            });

            expect(popupRef.overlayRef.overlayElement.textContent).toContain("from providers");
            injector.destroy();
        });
    });

    describe("overlay detached directly", () => {
        it("emits closeStart and closed when the overlay is disposed", () => {
            const anchor = createAnchor();
            popupRef = service.create({ anchor, animation: false, content: PopupTestContentComponent });
            const events: string[] = [];
            popupRef.closeStart.subscribe(() => events.push("closeStart"));
            popupRef.closed.subscribe(event => events.push(`closed:${event.via}`));

            popupRef.overlayRef.dispose();

            expect(events).toEqual(["closeStart", `closed:${PopupCloseSource.Programmatic}`]);
            popupRef = null;
        });

        it("returns focus to the anchor when the overlay is detached", () => {
            const anchor = createAnchor();
            anchor.focus();
            popupRef = service.create({ anchor, animation: false, content: PopupTestInputContentComponent });
            popupRef.overlayRef.overlayElement.querySelector("input")?.focus();

            popupRef.overlayRef.detach();

            expect(document.activeElement).toBe(anchor);
        });
    });

    describe("closeOnScroll", () => {
        it("closes on page scroll when the anchor also sits in a scrollable container", () => {
            const { anchor } = createScrollableAnchor();
            popupRef = service.create({
                anchor,
                animation: false,
                closeOnScroll: true,
                content: PopupTestContentComponent
            });
            let closed = false;
            popupRef.closed.subscribe(() => (closed = true));

            window.dispatchEvent(new Event("scroll"));

            expect(closed).toBe(true);
            popupRef = null;
        });

        it("closes when the scrollable container scrolls", () => {
            const { anchor, scrollContainer } = createScrollableAnchor();
            popupRef = service.create({
                anchor,
                animation: false,
                closeOnScroll: true,
                content: PopupTestContentComponent
            });
            let closed = false;
            popupRef.closed.subscribe(() => (closed = true));

            scrollContainer.dispatchEvent(new Event("scroll"));

            expect(closed).toBe(true);
            popupRef = null;
        });
    });

    describe("close()", () => {
        it("returns true when the popup closes", () => {
            popupRef = service.create({ anchor: createAnchor(), animation: false, content: PopupTestContentComponent });

            expect(popupRef.close()).toBe(true);
            popupRef = null;
        });

        it("returns false when preventClose stops it, and when the popup is already closing", () => {
            let prevent = true;
            popupRef = service.create({
                anchor: createAnchor(),
                content: PopupTestContentComponent,
                preventClose: () => prevent
            });

            expect(popupRef.close()).toBe(false);
            prevent = false;
            expect(popupRef.close()).toBe(true);
            expect(popupRef.close()).toBe(false);
        });
    });

    describe("selector anchors", () => {
        let container: HTMLElement;
        let selectorRef: PopupRef;

        beforeEach(() => {
            container = document.createElement("div");
            container.innerHTML = `<span class="tip-target">One <b>bold</b></span><span class="tip-target">Two</span>`;
            document.body.append(container);
            testElements.push(container);
            selectorRef = service.create({
                anchor: ".tip-target",
                animation: false,
                content: PopupTestContentComponent
            });
        });

        afterEach(() => selectorRef.close());

        function contentPanes(): number {
            return document.querySelectorAll(".mona-popup-content mona-popup-wrapper").length;
        }

        function pointer(
            type: "pointerover" | "pointerout",
            target: Element,
            relatedTarget: Element | null = null
        ): void {
            target.dispatchEvent(new PointerEvent(type, { bubbles: true, relatedTarget }));
        }

        it("opens a popup over a matching element and closes it when the pointer leaves", () => {
            const [first] = Array.from(container.querySelectorAll(".tip-target"));

            pointer("pointerover", first);
            expect(contentPanes()).toBe(1);

            pointer("pointerout", first, document.body);
            expect(contentPanes()).toBe(0);
        });

        it("keeps the popup open while the pointer moves inside the element", () => {
            const first = container.querySelector(".tip-target") as HTMLElement;
            const bold = first.querySelector("b") as HTMLElement;

            pointer("pointerover", first);
            pointer("pointerout", first, bold);
            pointer("pointerover", bold);

            expect(contentPanes()).toBe(1);
        });

        it("moves the popup from one element to the next", () => {
            const [first, second] = Array.from(container.querySelectorAll(".tip-target"));

            pointer("pointerover", first);
            pointer("pointerout", first, second);
            pointer("pointerover", second);

            expect(contentPanes()).toBe(1);
        });

        it("opens for elements added after the popup was created", () => {
            const late = document.createElement("span");
            late.className = "tip-target";
            container.append(late);

            pointer("pointerover", late);

            expect(contentPanes()).toBe(1);
        });

        it("closes the popup that is showing when the returned ref closes", () => {
            pointer("pointerover", container.querySelector(".tip-target") as HTMLElement);
            expect(contentPanes()).toBe(1);

            selectorRef.close();

            expect(contentPanes()).toBe(0);
            pointer("pointerover", container.querySelector(".tip-target") as HTMLElement);
            expect(contentPanes()).toBe(0);
        });
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

    it("updates overlay direction and position when anchor direction changes dynamically while open", async () => {
        const anchor = createAnchor();
        anchor.setAttribute("dir", "ltr");

        popupRef = service.create({
            anchor,
            animation: false,
            content: PopupTestContentComponent
        });

        expect(popupRef.overlayRef.getDirection()).toBe("ltr");
        const updatePositionSpy = vi.spyOn(popupRef.overlayRef, "updatePosition");

        anchor.setAttribute("dir", "rtl");
        await new Promise(resolve => setTimeout(resolve, 20));

        expect(popupRef.overlayRef.getDirection()).toBe("rtl");
        expect(updatePositionSpy).toHaveBeenCalled();
    });

    it("updates overlay direction when ancestor documentElement dir changes while open", async () => {
        const anchor = createAnchor();

        popupRef = service.create({
            anchor,
            animation: false,
            content: PopupTestContentComponent
        });

        const initialDir = popupRef.overlayRef.getDirection();
        expect(initialDir).toBe("ltr");

        document.documentElement.setAttribute("dir", "rtl");
        await new Promise(resolve => setTimeout(resolve, 20));

        expect(popupRef.overlayRef.getDirection()).toBe("rtl");

        document.documentElement.removeAttribute("dir");
        await new Promise(resolve => setTimeout(resolve, 20));
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
