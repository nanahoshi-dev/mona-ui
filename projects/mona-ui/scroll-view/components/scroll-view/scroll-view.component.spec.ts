import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MONA_DEFAULT_LOCALE, MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { afterEach, vi } from "vitest";
import { ScrollViewComponent } from "./scroll-view.component";

describe("ScrollViewComponent", () => {
    let component: ScrollViewComponent;
    let fixture: ComponentFixture<ScrollViewComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [ScrollViewComponent]
        });
        fixture = TestBed.createComponent(ScrollViewComponent);
        component = fixture.componentInstance;

        fixture.componentRef.setInput("width", 500);
        fixture.componentRef.setInput("height", 375);

        fixture.detectChanges();
    });

    afterEach(() => {
        TestBed.inject(MonaI18nService).use(MONA_DEFAULT_LOCALE);
        TestBed.resetTestingModule();
    });

    async function waitForStable(fixture: ComponentFixture<unknown>): Promise<void> {
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    }

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("uses a soft surface boundary and neutral carousel controls with physical left/right positioning", () => {
        fixture.componentRef.setInput("arrows", true);
        fixture.componentRef.setInput("data", ["First", "Second"]);
        fixture.componentRef.setInput("infinite", true);
        fixture.componentRef.setInput("pageable", true);
        fixture.detectChanges();

        const host = fixture.nativeElement as HTMLElement;
        const prevArrow = host.querySelector("[data-navigate-prev]") as HTMLButtonElement;
        const nextArrow = host.querySelector("[data-navigate-next]") as HTMLButtonElement;
        const activePage = host.querySelector("[data-active-page='true']") as HTMLButtonElement;
        const pager = activePage.closest(".inset-x-0") as HTMLElement;

        expect(host.classList.contains("bg-surface")).toBe(true);
        expect(host.classList.contains("border-border-subtle")).toBe(true);
        expect(host.classList.contains("border-2")).toBe(false);

        // Physical positioning utilities in LTR
        expect(prevArrow.classList.contains("left-0")).toBe(true);
        expect(prevArrow.classList.contains("right-0")).toBe(false);
        expect(nextArrow.classList.contains("right-0")).toBe(true);
        expect(nextArrow.classList.contains("left-0")).toBe(false);
        expect(pager?.classList.contains("inset-x-0")).toBe(true);
        expect(pager?.classList.contains("bottom-0")).toBe(true);
        expect(pager?.style.direction).toBe("ltr");

        expect(prevArrow.classList.contains("bg-surface-overlay/65")).toBe(true);
        expect(prevArrow.classList.contains("hover:bg-hover/90")).toBe(true);
        expect(prevArrow.classList.contains("focus-visible:ring-focus-indicator/35")).toBe(true);
        expect(activePage.classList.contains("!bg-foreground")).toBe(true);
        expect(activePage.classList.contains("hover:!bg-foreground")).toBe(true);
        expect(activePage.classList.contains("!bg-primary")).toBe(false);
        expect(activePage.classList.contains("bg-white")).toBe(false);
    });

    it("renders default English accessible labels on slides, navigation buttons, and pager", () => {
        fixture.componentRef.setInput("arrows", true);
        fixture.componentRef.setInput("data", ["First", "Second", "Third"]);
        fixture.componentRef.setInput("infinite", true);
        fixture.componentRef.setInput("pageable", true);
        fixture.detectChanges();

        const host = fixture.nativeElement as HTMLElement;
        expect(host.getAttribute("aria-label")).toBe("Page 1 of 3");

        const prevArrow = host.querySelector("[data-navigate-prev]") as HTMLButtonElement;
        const nextArrow = host.querySelector("[data-navigate-next]") as HTMLButtonElement;
        expect(prevArrow.getAttribute("aria-label")).toBe("Previous page");
        expect(nextArrow.getAttribute("aria-label")).toBe("Next page");

        const slide = host.querySelector("li[role='group']") as HTMLLIElement;
        expect(slide.getAttribute("aria-label")).toBe("Page 1 of 3");

        const pageButtons = host.querySelectorAll("button[monascrollviewactivepage]");
        expect(pageButtons.length).toBe(3);
        expect(pageButtons[0].getAttribute("aria-label")).toBe("Page 1");
        expect(pageButtons[1].getAttribute("aria-label")).toBe("Page 2");
        expect(pageButtons[2].getAttribute("aria-label")).toBe("Page 3");
    });

    it("updates accessible labels dynamically when locale is changed", () => {
        fixture.componentRef.setInput("arrows", true);
        fixture.componentRef.setInput("data", ["First", "Second"]);
        fixture.componentRef.setInput("infinite", true);
        fixture.componentRef.setInput("pageable", true);
        fixture.detectChanges();

        const i18n = TestBed.inject(MonaI18nService);
        i18n.use({
            direction: "ltr",
            id: "de-DE",
            messages: {
                scrollView: {
                    nextPage: "Nächste Seite",
                    page: (c: number) => `Seite ${c}`,
                    pageOf: (c: number, t: number) => `Seite ${c} von ${t}`,
                    previousPage: "Vorherige Seite",
                    scrollPagerNext: "Pager rechts",
                    scrollPagerPrevious: "Pager links"
                }
            }
        });
        fixture.detectChanges();

        const host = fixture.nativeElement as HTMLElement;
        expect(host.getAttribute("aria-label")).toBe("Seite 1 von 2");

        const prevArrow = host.querySelector("[data-navigate-prev]") as HTMLButtonElement;
        const nextArrow = host.querySelector("[data-navigate-next]") as HTMLButtonElement;
        expect(prevArrow.getAttribute("aria-label")).toBe("Vorherige Seite");
        expect(nextArrow.getAttribute("aria-label")).toBe("Nächste Seite");

        const pageButtons = host.querySelectorAll("button[monascrollviewactivepage]");
        expect(pageButtons[0].getAttribute("aria-label")).toBe("Seite 1");
        expect(pageButtons[1].getAttribute("aria-label")).toBe("Seite 2");
    });

    it("navigates with ArrowRight and ArrowLeft in LTR mode", () => {
        fixture.componentRef.setInput("data", ["Item 1", "Item 2", "Item 3"]);
        fixture.componentRef.setInput("index", 0);
        fixture.detectChanges();

        const host = fixture.nativeElement as HTMLElement;
        host.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
        fixture.detectChanges();
        expect(component.index()).toBe(1);

        host.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft" }));
        fixture.detectChanges();
        expect(component.index()).toBe(0);
    });

    it("maintains LTR keyboard navigation when locale is RTL but DOM is LTR (direction mismatch)", () => {
        const i18n = TestBed.inject(MonaI18nService);
        i18n.use({ direction: "rtl", id: "ar-EG", messages: {} });

        fixture.componentRef.setInput("data", ["Item 1", "Item 2", "Item 3"]);
        fixture.componentRef.setInput("index", 0);
        fixture.detectChanges();

        const host = fixture.nativeElement as HTMLElement;
        // In LTR DOM, ArrowRight navigates forward even with RTL locale
        host.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
        fixture.detectChanges();
        expect(component.index()).toBe(1);

        host.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft" }));
        fixture.detectChanges();
        expect(component.index()).toBe(0);
    });

    it("inverts horizontal keyboard navigation when DOM is RTL", async () => {
        fixture.componentRef.setInput("data", ["Item 1", "Item 2", "Item 3"]);
        fixture.componentRef.setInput("index", 0);

        const host = fixture.nativeElement as HTMLElement;
        host.setAttribute("dir", "rtl");
        await waitForStable(fixture);

        // In RTL DOM, ArrowLeft navigates forward (next)
        host.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft" }));
        fixture.detectChanges();
        expect(component.index()).toBe(1);

        // In RTL DOM, ArrowRight navigates backward (previous)
        host.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
        fixture.detectChanges();
        expect(component.index()).toBe(0);
    });

    it("includes rtl:rotate-180 class on chevron navigation icons", () => {
        fixture.componentRef.setInput("arrows", true);
        fixture.componentRef.setInput("data", ["Item 1", "Item 2"]);
        fixture.componentRef.setInput("infinite", true);
        fixture.detectChanges();

        const host = fixture.nativeElement as HTMLElement;
        const prevChevron = host.querySelector("[data-navigate-prev] svg") as SVGElement;
        const nextChevron = host.querySelector("[data-navigate-next] svg") as SVGElement;

        expect(prevChevron.classList.contains("rtl:rotate-180")).toBe(true);
        expect(nextChevron.classList.contains("rtl:rotate-180")).toBe(true);
    });

    it("maintains coherent LTR keyboard navigation, Prev/Next click scrolling, animation direction, and icon state under CSS-only direction override", () => {
        fixture.componentRef.setInput("arrows", true);
        fixture.componentRef.setInput("data", ["Item 1", "Item 2", "Item 3"]);
        fixture.componentRef.setInput("index", 0);

        const host = fixture.nativeElement as HTMLElement;
        host.setAttribute("dir", "ltr");
        host.style.direction = "rtl";
        fixture.detectChanges();

        // Under semantic Option A, Mona behavior stays LTR and matches Tailwind's :dir(ltr) / inactive rtl:
        expect(host.matches(":dir(rtl)")).toBe(false);
        expect(host.matches(":dir(ltr)")).toBe(true);

        const prevChevron = host.querySelector("[data-navigate-prev] svg") as SVGElement;
        const nextChevron = host.querySelector("[data-navigate-next] svg") as SVGElement;
        expect(prevChevron.matches(":dir(rtl)")).toBe(false);
        expect(prevChevron.matches(":dir(ltr)")).toBe(true);
        expect(nextChevron.matches(":dir(rtl)")).toBe(false);
        expect(nextChevron.matches(":dir(ltr)")).toBe(true);

        // ArrowRight navigates next (LTR behavior)
        host.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
        fixture.detectChanges();
        expect(component.index()).toBe(1);

        // ArrowLeft navigates prev (LTR behavior)
        host.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft" }));
        fixture.detectChanges();
        expect(component.index()).toBe(0);

        // Prev / Next button clicks with animation direction verification
        const nextArrow = host.querySelector("[data-navigate-next]") as HTMLButtonElement;
        const prevArrow = host.querySelector("[data-navigate-prev]") as HTMLButtonElement;

        // In LTR, prevArrow is anchored at left-0 and nextArrow at right-0
        expect(prevArrow.classList.contains("left-0")).toBe(true);
        expect(prevArrow.classList.contains("right-0")).toBe(false);
        expect(nextArrow.classList.contains("right-0")).toBe(true);
        expect(nextArrow.classList.contains("left-0")).toBe(false);

        // Click Next arrow advances to index 1 with LTR slide-in-from-right animation
        nextArrow.click();
        fixture.detectChanges();
        expect(component.index()).toBe(1);
        expect(component["enterAnimation"]()).toBe("slide-in-from-right");
        expect(component["leaveAnimation"]()).toBe("slide-out-to-left");

        // Click Prev arrow returns to index 0 with LTR slide-in-from-left animation
        prevArrow.click();
        fixture.detectChanges();
        expect(component.index()).toBe(0);
        expect(component["enterAnimation"]()).toBe("slide-in-from-left");
        expect(component["leaveAnimation"]()).toBe("slide-out-to-right");

        // Pager scroll delta maintains LTR semantics (negative for left, positive for right)
        vi.useFakeTimers();
        try {
            const mockList = { scrollBy: vi.fn() } as unknown as HTMLUListElement;
            component["onPagerClick"](new MouseEvent("click", { detail: 1, button: 0 }), mockList, "left");
            vi.advanceTimersByTime(60);
            expect(mockList.scrollBy).toHaveBeenCalledWith({ behavior: "smooth", left: -100 });

            component["onPagerClick"](new MouseEvent("click", { detail: 1, button: 0 }), mockList, "right");
            vi.advanceTimersByTime(60);
            expect(mockList.scrollBy).toHaveBeenCalledWith({ behavior: "smooth", left: 100 });
        } finally {
            vi.useRealTimers();
        }
    });

    it("maintains coherent RTL keyboard navigation, Prev/Next click scrolling, animation direction, and icon state under CSS-only direction override", async () => {
        fixture.componentRef.setInput("arrows", true);
        fixture.componentRef.setInput("data", ["Item 1", "Item 2", "Item 3"]);
        fixture.componentRef.setInput("index", 0);

        const host = fixture.nativeElement as HTMLElement;
        host.setAttribute("dir", "rtl");
        host.style.direction = "ltr";
        await waitForStable(fixture);

        expect(host.matches(":dir(rtl)")).toBe(true);
        expect(host.matches(":dir(ltr)")).toBe(false);

        const prevChevron = host.querySelector("[data-navigate-prev] svg") as SVGElement;
        const nextChevron = host.querySelector("[data-navigate-next] svg") as SVGElement;

        // Rendered icon state matches semantic RTL (:dir(rtl)), not CSS direction: ltr
        expect(prevChevron.matches(":dir(rtl)")).toBe(true);
        expect(prevChevron.matches(":dir(ltr)")).toBe(false);
        expect(nextChevron.matches(":dir(rtl)")).toBe(true);
        expect(nextChevron.matches(":dir(ltr)")).toBe(false);
        expect(prevChevron.classList.contains("rtl:rotate-180")).toBe(true);
        expect(nextChevron.classList.contains("rtl:rotate-180")).toBe(true);

        // In RTL, ArrowLeft navigates forward (next)
        host.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft" }));
        fixture.detectChanges();
        expect(component.index()).toBe(1);

        // In RTL, ArrowRight navigates backward (previous)
        host.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
        fixture.detectChanges();
        expect(component.index()).toBe(0);

        // Prev / Next button clicks with animation direction verification
        const nextArrow = host.querySelector("[data-navigate-next]") as HTMLButtonElement;
        const prevArrow = host.querySelector("[data-navigate-prev]") as HTMLButtonElement;

        // In RTL, prevArrow is anchored at physical right-0 and nextArrow at physical left-0
        expect(prevArrow.classList.contains("right-0")).toBe(true);
        expect(prevArrow.classList.contains("left-0")).toBe(false);
        expect(nextArrow.classList.contains("left-0")).toBe(true);
        expect(nextArrow.classList.contains("right-0")).toBe(false);

        // In RTL, clicking Next arrow advances index to 1 with RTL slide-in-from-left animation
        nextArrow.click();
        fixture.detectChanges();
        expect(component.index()).toBe(1);
        expect(component["enterAnimation"]()).toBe("slide-in-from-left");
        expect(component["leaveAnimation"]()).toBe("slide-out-to-right");

        // In RTL, clicking Prev arrow returns index to 0 with RTL slide-in-from-right animation
        prevArrow.click();
        fixture.detectChanges();
        expect(component.index()).toBe(0);
        expect(component["enterAnimation"]()).toBe("slide-in-from-right");
        expect(component["leaveAnimation"]()).toBe("slide-out-to-left");

        // Pager scroll delta inverts in RTL (positive for left, negative for right)
        vi.useFakeTimers();
        try {
            const mockList = { scrollBy: vi.fn() } as unknown as HTMLUListElement;
            component["onPagerClick"](new MouseEvent("click", { detail: 1, button: 0 }), mockList, "left");
            vi.advanceTimersByTime(60);
            expect(mockList.scrollBy).toHaveBeenCalledWith({ behavior: "smooth", left: 100 });

            component["onPagerClick"](new MouseEvent("click", { detail: 1, button: 0 }), mockList, "right");
            vi.advanceTimersByTime(60);
            expect(mockList.scrollBy).toHaveBeenCalledWith({ behavior: "smooth", left: -100 });
        } finally {
            vi.useRealTimers();
        }
    });

    it("unifies keyboard navigation, transforms, and animation direction under semantic RTL", async () => {
        fixture.componentRef.setInput("arrows", true);
        fixture.componentRef.setInput("data", ["Item 1", "Item 2", "Item 3"]);
        fixture.componentRef.setInput("index", 0);

        const host = fixture.nativeElement as HTMLElement;
        host.setAttribute("dir", "rtl");
        await waitForStable(fixture);

        expect(host.matches(":dir(rtl)")).toBe(true);

        const prevChevron = host.querySelector("[data-navigate-prev] svg") as SVGElement;
        const nextChevron = host.querySelector("[data-navigate-next] svg") as SVGElement;

        // Visual icon mirror matches semantic RTL state
        expect(prevChevron.matches(":dir(rtl)")).toBe(true);
        expect(nextChevron.matches(":dir(rtl)")).toBe(true);
        expect(prevChevron.classList.contains("rtl:rotate-180")).toBe(true);

        const prevArrow = host.querySelector("[data-navigate-prev]") as HTMLButtonElement;
        const nextArrow = host.querySelector("[data-navigate-next]") as HTMLButtonElement;
        expect(prevArrow.classList.contains("right-0")).toBe(true);
        expect(prevArrow.classList.contains("left-0")).toBe(false);
        expect(nextArrow.classList.contains("left-0")).toBe(true);
        expect(nextArrow.classList.contains("right-0")).toBe(false);

        // ArrowLeft navigates next (RTL behavior)
        host.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft" }));
        fixture.detectChanges();
        expect(component.index()).toBe(1);

        // ArrowRight navigates prev (RTL behavior)
        host.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
        fixture.detectChanges();
        expect(component.index()).toBe(0);
    });

    describe("animation duration and reduced motion", () => {
        it("sets the --mona-scroll-view-animation-duration CSS variable based on animate input", () => {
            fixture.componentRef.setInput("data", ["Item 1", "Item 2"]);
            fixture.componentRef.setInput("animate", true);
            fixture.detectChanges();

            const host = fixture.nativeElement as HTMLElement;
            const slide = host.querySelector("li[role='group']") as HTMLLIElement;
            expect(slide.style.getPropertyValue("--mona-scroll-view-animation-duration")).toBe("500ms");
            expect(component["animationDuration"]()).toBe(500);

            fixture.componentRef.setInput("animate", 1200);
            fixture.detectChanges();
            expect(slide.style.getPropertyValue("--mona-scroll-view-animation-duration")).toBe("1200ms");
            expect(component["animationDuration"]()).toBe(1200);

            fixture.componentRef.setInput("animate", false);
            fixture.detectChanges();
            expect(slide.style.getPropertyValue("--mona-scroll-view-animation-duration")).toBe("0ms");
            expect(component["animationDuration"]()).toBe(0);
        });
    });

    describe("pager pointer hold arbitration", () => {
        it("executes single scroll on primary pointer short click", () => {
            vi.useFakeTimers();
            try {
                const mockList = { scrollBy: vi.fn() } as unknown as HTMLUListElement;
                const downEvent = new PointerEvent("pointerdown", { isPrimary: true, button: 0, pointerId: 1 });
                const upEvent = new PointerEvent("pointerup", { isPrimary: true, button: 0, pointerId: 1 });
                const clickEvent = new MouseEvent("click", { detail: 1, button: 0 });

                component["onPagerPointerDown"](downEvent, mockList, "right");
                vi.advanceTimersByTime(30); // <60ms, before first repeat tick
                document.dispatchEvent(upEvent);
                component["onPagerClick"](clickEvent, mockList, "right");
                vi.advanceTimersByTime(60);

                expect(mockList.scrollBy).toHaveBeenCalledTimes(1);
            } finally {
                vi.useRealTimers();
            }
        });

        it("executes repeated hold scrolling and suppresses trailing pointer click", () => {
            vi.useFakeTimers();
            try {
                const mockList = { scrollBy: vi.fn() } as unknown as HTMLUListElement;
                const downEvent = new PointerEvent("pointerdown", { isPrimary: true, button: 0, pointerId: 1 });
                const upEvent = new PointerEvent("pointerup", { isPrimary: true, button: 0, pointerId: 1 });
                const clickEvent = new MouseEvent("click", { detail: 1, button: 0 });

                component["onPagerPointerDown"](downEvent, mockList, "right");
                vi.advanceTimersByTime(180); // 3 interval ticks
                expect(mockList.scrollBy).toHaveBeenCalledTimes(3);

                document.dispatchEvent(upEvent);
                component["onPagerClick"](clickEvent, mockList, "right");
                vi.advanceTimersByTime(200); // verify no trailing single scroll

                expect(mockList.scrollBy).toHaveBeenCalledTimes(3);
            } finally {
                vi.useRealTimers();
            }
        });

        it("rejects non-primary mouse button on pointerdown and click", () => {
            vi.useFakeTimers();
            try {
                const mockList = { scrollBy: vi.fn() } as unknown as HTMLUListElement;
                const rightDown = new PointerEvent("pointerdown", { isPrimary: true, button: 2, pointerId: 1 });
                const middleDown = new PointerEvent("pointerdown", { isPrimary: true, button: 1, pointerId: 1 });
                const rightClick = new MouseEvent("click", { detail: 1, button: 2 });

                component["onPagerPointerDown"](rightDown, mockList, "right");
                vi.advanceTimersByTime(180);
                expect(mockList.scrollBy).not.toHaveBeenCalled();

                component["onPagerPointerDown"](middleDown, mockList, "right");
                vi.advanceTimersByTime(180);
                expect(mockList.scrollBy).not.toHaveBeenCalled();

                component["onPagerClick"](rightClick, mockList, "right");
                vi.advanceTimersByTime(100);
                expect(mockList.scrollBy).not.toHaveBeenCalled();
            } finally {
                vi.useRealTimers();
            }
        });

        it("rejects non-primary pointer", () => {
            vi.useFakeTimers();
            try {
                const mockList = { scrollBy: vi.fn() } as unknown as HTMLUListElement;
                const nonPrimaryDown = new PointerEvent("pointerdown", { isPrimary: false, button: 0, pointerId: 2 });

                component["onPagerPointerDown"](nonPrimaryDown, mockList, "right");
                vi.advanceTimersByTime(180);
                expect(mockList.scrollBy).not.toHaveBeenCalled();
            } finally {
                vi.useRealTimers();
            }
        });

        it("respects pointerId ownership during hold release", () => {
            vi.useFakeTimers();
            try {
                const mockList = { scrollBy: vi.fn() } as unknown as HTMLUListElement;
                const downEvent = new PointerEvent("pointerdown", { isPrimary: true, button: 0, pointerId: 10 });
                const wrongUp = new PointerEvent("pointerup", { pointerId: 11 });
                const matchingUp = new PointerEvent("pointerup", { pointerId: 10 });

                component["onPagerPointerDown"](downEvent, mockList, "right");
                vi.advanceTimersByTime(120); // 2 ticks
                expect(mockList.scrollBy).toHaveBeenCalledTimes(2);

                // Unrelated pointerup does not stop hold
                document.dispatchEvent(wrongUp);
                vi.advanceTimersByTime(60); // 3rd tick occurs
                expect(mockList.scrollBy).toHaveBeenCalledTimes(3);

                // Matching pointerup stops hold
                document.dispatchEvent(matchingUp);
                vi.advanceTimersByTime(120);
                expect(mockList.scrollBy).toHaveBeenCalledTimes(3);
            } finally {
                vi.useRealTimers();
            }
        });

        it("stops hold on pointercancel and preserves subsequent keyboard activation", () => {
            vi.useFakeTimers();
            try {
                const mockList = { scrollBy: vi.fn() } as unknown as HTMLUListElement;
                const downEvent = new PointerEvent("pointerdown", { isPrimary: true, button: 0, pointerId: 10 });
                const cancelEvent = new PointerEvent("pointercancel", { pointerId: 10 });
                const keyboardClick = new MouseEvent("click", { detail: 0, button: 0 });

                component["onPagerPointerDown"](downEvent, mockList, "right");
                vi.advanceTimersByTime(120);
                expect(mockList.scrollBy).toHaveBeenCalledTimes(2);

                document.dispatchEvent(cancelEvent);
                vi.advanceTimersByTime(120);
                expect(mockList.scrollBy).toHaveBeenCalledTimes(2);

                // Keyboard click (detail=0) executes normally
                component["onPagerClick"](keyboardClick, mockList, "right");
                vi.advanceTimersByTime(60);
                expect(mockList.scrollBy).toHaveBeenCalledTimes(3);
            } finally {
                vi.useRealTimers();
            }
        });

        it("preserves keyboard activation even after pointer release without generated click", () => {
            vi.useFakeTimers();
            try {
                const mockList = { scrollBy: vi.fn() } as unknown as HTMLUListElement;
                const downEvent = new PointerEvent("pointerdown", { isPrimary: true, button: 0, pointerId: 10 });
                const upEvent = new PointerEvent("pointerup", { pointerId: 10 });
                const keyboardClick = new MouseEvent("click", { detail: 0, button: 0 });

                component["onPagerPointerDown"](downEvent, mockList, "right");
                vi.advanceTimersByTime(120);
                expect(mockList.scrollBy).toHaveBeenCalledTimes(2);

                document.dispatchEvent(upEvent);
                vi.advanceTimersByTime(50);

                // Keyboard activation arrives instead of a pointer click
                component["onPagerClick"](keyboardClick, mockList, "right");
                vi.advanceTimersByTime(60);
                expect(mockList.scrollBy).toHaveBeenCalledTimes(3);
            } finally {
                vi.useRealTimers();
            }
        });
    });

    describe("reduced-motion scrolling behavior", () => {
        it("uses smooth behavior under default no-preference", () => {
            const mockList = { scrollBy: vi.fn() } as unknown as HTMLUListElement;
            const mockButton = { scrollIntoView: vi.fn() } as unknown as HTMLButtonElement;

            vi.useFakeTimers();
            try {
                component["onPagerClick"](new MouseEvent("click", { detail: 1, button: 0 }), mockList, "right");
                vi.advanceTimersByTime(60);
                expect(mockList.scrollBy).toHaveBeenCalledWith({ behavior: "smooth", left: 100 });

                component["onPageClick"](1, mockButton);
                expect(mockButton.scrollIntoView).toHaveBeenCalledWith({
                    behavior: "smooth",
                    block: "nearest",
                    inline: "center"
                });
            } finally {
                vi.useRealTimers();
            }
        });

        it("uses auto behavior when prefers-reduced-motion matches", () => {
            const originalMatchMedia = window.matchMedia;
            try {
                window.matchMedia = vi.fn().mockImplementation((query: string) => ({
                    matches: true,
                    media: query,
                    onchange: null,
                    addEventListener: vi.fn(),
                    removeEventListener: vi.fn(),
                    dispatchEvent: vi.fn()
                }));

                const localFixture = TestBed.createComponent(ScrollViewComponent);
                localFixture.componentRef.setInput("width", 500);
                localFixture.componentRef.setInput("height", 375);
                localFixture.detectChanges();
                const localComp = localFixture.componentInstance;

                expect(localComp["scrollBehavior"]()).toBe("auto");

                const mockList = { scrollBy: vi.fn() } as unknown as HTMLUListElement;
                const mockButton = { scrollIntoView: vi.fn() } as unknown as HTMLButtonElement;

                vi.useFakeTimers();
                try {
                    localComp["onPagerClick"](new MouseEvent("click", { detail: 1, button: 0 }), mockList, "right");
                    vi.advanceTimersByTime(60);
                    expect(mockList.scrollBy).toHaveBeenCalledWith({ behavior: "auto", left: 100 });

                    localComp["onPageClick"](1, mockButton);
                    expect(mockButton.scrollIntoView).toHaveBeenCalledWith({
                        behavior: "auto",
                        block: "nearest",
                        inline: "center"
                    });
                } finally {
                    vi.useRealTimers();
                    localFixture.destroy();
                }
            } finally {
                window.matchMedia = originalMatchMedia;
            }
        });

        it("reactively updates scrollBehavior when motion preference changes at runtime", () => {
            let changeListener: ((e: MediaQueryListEvent) => void) | null = null;
            const originalMatchMedia = window.matchMedia;
            try {
                window.matchMedia = vi.fn().mockImplementation((query: string) => ({
                    matches: false,
                    media: query,
                    onchange: null,
                    addEventListener: vi.fn((event: string, listener: any) => {
                        if (event === "change") {
                            changeListener = listener;
                        }
                    }),
                    removeEventListener: vi.fn(),
                    dispatchEvent: vi.fn()
                }));

                const localFixture = TestBed.createComponent(ScrollViewComponent);
                localFixture.componentRef.setInput("width", 500);
                localFixture.componentRef.setInput("height", 375);
                localFixture.detectChanges();
                const localComp = localFixture.componentInstance;

                expect(localComp["scrollBehavior"]()).toBe("smooth");

                // Trigger runtime preference change to reduced motion
                expect(changeListener).not.toBeNull();
                changeListener!({ matches: true } as MediaQueryListEvent);
                localFixture.detectChanges();

                expect(localComp["scrollBehavior"]()).toBe("auto");

                // Trigger runtime preference change back to no-preference
                changeListener!({ matches: false } as MediaQueryListEvent);
                localFixture.detectChanges();

                expect(localComp["scrollBehavior"]()).toBe("smooth");

                localFixture.destroy();
            } finally {
                window.matchMedia = originalMatchMedia;
            }
        });
    });
});
