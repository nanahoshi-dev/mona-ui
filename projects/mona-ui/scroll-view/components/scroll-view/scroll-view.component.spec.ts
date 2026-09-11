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
                expect(mockList.scrollBy).toHaveBeenCalledTimes(3);
            } finally {
                vi.useRealTimers();
            }
        });

        it("executes two rapid primary short clicks as two independent scroll steps", () => {
            const mockList = { scrollBy: vi.fn() } as unknown as HTMLUListElement;
            const down1 = new PointerEvent("pointerdown", { isPrimary: true, button: 0, pointerId: 1 });
            const up1 = new PointerEvent("pointerup", { isPrimary: true, button: 0, pointerId: 1 });
            const click1 = new MouseEvent("click", { detail: 1, button: 0 });

            const down2 = new PointerEvent("pointerdown", { isPrimary: true, button: 0, pointerId: 1 });
            const up2 = new PointerEvent("pointerup", { isPrimary: true, button: 0, pointerId: 1 });
            const click2 = new MouseEvent("click", { detail: 1, button: 0 });

            component["onPagerPointerDown"](down1, mockList, "right");
            document.dispatchEvent(up1);
            component["onPagerClick"](click1, mockList, "right");

            component["onPagerPointerDown"](down2, mockList, "right");
            document.dispatchEvent(up2);
            component["onPagerClick"](click2, mockList, "right");

            expect(mockList.scrollBy).toHaveBeenCalledTimes(2);
        });

        it("executes rapid alternating arrow clicks without losing steps and respects RTL inversion", () => {
            const mockList = { scrollBy: vi.fn() } as unknown as HTMLUListElement;
            const clickRight = new MouseEvent("click", { detail: 1, button: 0 });
            const clickLeft = new MouseEvent("click", { detail: 1, button: 0 });

            // In LTR: right = +100, left = -100
            component["onPagerClick"](clickRight, mockList, "right");
            component["onPagerClick"](clickLeft, mockList, "left");

            expect(mockList.scrollBy).toHaveBeenNthCalledWith(1, { behavior: "smooth", left: 100 });
            expect(mockList.scrollBy).toHaveBeenNthCalledWith(2, { behavior: "smooth", left: -100 });

            // In RTL: right = -100, left = +100
            vi.spyOn(component as unknown as { isRtl: () => boolean }, "isRtl").mockReturnValue(true);
            component["onPagerClick"](clickRight, mockList, "right");
            component["onPagerClick"](clickLeft, mockList, "left");

            expect(mockList.scrollBy).toHaveBeenNthCalledWith(3, { behavior: "smooth", left: -100 });
            expect(mockList.scrollBy).toHaveBeenNthCalledWith(4, { behavior: "smooth", left: 100 });
        });

        it("executes rapid keyboard activations immediately and independently", () => {
            const mockList = { scrollBy: vi.fn() } as unknown as HTMLUListElement;
            const keyboardClick1 = new MouseEvent("click", { detail: 0, button: 0 });
            const keyboardClick2 = new MouseEvent("click", { detail: 0, button: 0 });

            component["onPagerClick"](keyboardClick1, mockList, "right");
            component["onPagerClick"](keyboardClick2, mockList, "right");

            expect(mockList.scrollBy).toHaveBeenCalledTimes(2);
        });

        it("preserves accepted short click when followed immediately by a continuous hold", () => {
            vi.useFakeTimers();
            try {
                const mockList = { scrollBy: vi.fn() } as unknown as HTMLUListElement;
                const click = new MouseEvent("click", { detail: 1, button: 0 });
                const holdDown = new PointerEvent("pointerdown", { isPrimary: true, button: 0, pointerId: 5 });
                const holdUp = new PointerEvent("pointerup", { pointerId: 5 });
                const trailingClick = new MouseEvent("click", { detail: 1, button: 0 });

                // Short click executes immediately
                component["onPagerClick"](click, mockList, "right");
                expect(mockList.scrollBy).toHaveBeenCalledTimes(1);

                // Immediate hold start
                component["onPagerPointerDown"](holdDown, mockList, "right");
                vi.advanceTimersByTime(180); // 3 interval ticks
                expect(mockList.scrollBy).toHaveBeenCalledTimes(4); // 1 click + 3 hold ticks

                // Hold release
                document.dispatchEvent(holdUp);
                component["onPagerClick"](trailingClick, mockList, "right");
                vi.advanceTimersByTime(100);

                // Trailing click was suppressed, so still 4
                expect(mockList.scrollBy).toHaveBeenCalledTimes(4);
            } finally {
                vi.useRealTimers();
            }
        });

        it("rejects cross-pointer acquisition while an active hold exists and suppresses rejected pointer click", () => {
            vi.useFakeTimers();
            try {
                const mockList = { scrollTo: vi.fn(), scrollBy: vi.fn(), scrollLeft: 0 } as unknown as HTMLUListElement;
                const pointerADown = new PointerEvent("pointerdown", {
                    isPrimary: true,
                    button: 0,
                    pointerId: 10,
                    pointerType: "mouse"
                });
                const pointerBDown = new PointerEvent("pointerdown", {
                    isPrimary: true,
                    button: 0,
                    pointerId: 20,
                    pointerType: "touch"
                });
                const pointerBUp = new PointerEvent("pointerup", { pointerId: 20 });
                const pointerBClick = new PointerEvent("click", {
                    pointerId: 20,
                    pointerType: "touch",
                    isPrimary: true,
                    button: 0,
                    detail: 1
                });
                const pointerAUp = new PointerEvent("pointerup", { pointerId: 10 });
                const pointerAClick = new PointerEvent("click", {
                    pointerId: 10,
                    pointerType: "mouse",
                    isPrimary: true,
                    button: 0,
                    detail: 1
                });

                // Pointer A starts hold
                component["onPagerPointerDown"](pointerADown, mockList, "right");
                vi.advanceTimersByTime(120); // 2 ticks
                expect(mockList.scrollTo).toHaveBeenCalledTimes(2);

                // Pointer B attempts to acquire hold while A is active -> rejected
                component["onPagerPointerDown"](pointerBDown, mockList, "right");
                vi.advanceTimersByTime(60); // 3rd tick belongs to A
                expect(mockList.scrollTo).toHaveBeenCalledTimes(3);

                // Pointer B release does not stop A
                document.dispatchEvent(pointerBUp);
                vi.advanceTimersByTime(60); // 4th tick belongs to A
                expect(mockList.scrollTo).toHaveBeenCalledTimes(4);

                // Pointer B click arrives -> rejected and produces zero additional steps
                component["onPagerClick"](pointerBClick, mockList, "right");
                expect(mockList.scrollTo).toHaveBeenCalledTimes(4);

                // Pointer A release stops hold
                document.dispatchEvent(pointerAUp);
                vi.advanceTimersByTime(120);
                expect(mockList.scrollTo).toHaveBeenCalledTimes(4);

                // Trailing click from A is suppressed
                component["onPagerClick"](pointerAClick, mockList, "right");
                expect(mockList.scrollTo).toHaveBeenCalledTimes(4);
            } finally {
                vi.useRealTimers();
            }
        });

        it("does not allow an unrelated pointer click to consume owner trailing-click suppression", () => {
            vi.useFakeTimers();
            try {
                const mockList = { scrollTo: vi.fn(), scrollBy: vi.fn(), scrollLeft: 0 } as unknown as HTMLUListElement;
                const pointerADown = new PointerEvent("pointerdown", {
                    isPrimary: true,
                    button: 0,
                    pointerId: 10,
                    pointerType: "mouse"
                });
                const pointerAUp = new PointerEvent("pointerup", { pointerId: 10 });
                const pointerAClick = new PointerEvent("click", {
                    pointerId: 10,
                    detail: 1,
                    button: 0
                });
                const pointerCClick = new PointerEvent("click", {
                    pointerId: 30,
                    detail: 1,
                    button: 0
                });

                // Pointer A earns trailing-click suppression
                component["onPagerPointerDown"](pointerADown, mockList, "right");
                vi.advanceTimersByTime(120); // 2 repeat ticks
                expect(mockList.scrollTo).toHaveBeenCalledTimes(2);
                document.dispatchEvent(pointerAUp);

                // An unrelated pointer C click arrives before A's click:
                // C is not suppressed (executes 1 step) and does NOT consume A's suppression!
                component["onPagerClick"](pointerCClick, mockList, "right");
                expect(mockList.scrollTo).toHaveBeenCalledTimes(3);

                // Pointer A's trailing click arrives: it IS suppressed!
                component["onPagerClick"](pointerAClick, mockList, "right");
                expect(mockList.scrollTo).toHaveBeenCalledTimes(3);
            } finally {
                vi.useRealTimers();
            }
        });

        it("accumulates intended scroll target across rapid consecutive clicks", () => {
            const mockList = { scrollTo: vi.fn(), scrollBy: vi.fn(), scrollLeft: 0 } as unknown as HTMLUListElement;
            const click1 = new PointerEvent("click", { pointerId: 1, detail: 1, button: 0 });
            const click2 = new PointerEvent("click", { pointerId: 1, detail: 1, button: 0 });

            component["onPagerClick"](click1, mockList, "right");
            component["onPagerClick"](click2, mockList, "right");

            expect(mockList.scrollTo).toHaveBeenNthCalledWith(1, { behavior: "smooth", left: 100 });
            expect(mockList.scrollTo).toHaveBeenNthCalledWith(2, { behavior: "smooth", left: 200 });
        });

        it("accumulates intended scroll target across rapid alternating Next and Previous clicks", () => {
            const mockList = { scrollTo: vi.fn(), scrollBy: vi.fn(), scrollLeft: 0 } as unknown as HTMLUListElement;
            const clickNext = new PointerEvent("click", { pointerId: 1, detail: 1, button: 0 });
            const clickPrev = new PointerEvent("click", { pointerId: 1, detail: 1, button: 0 });

            // Next -> target 100, then Prev -> target 0
            component["onPagerClick"](clickNext, mockList, "right");
            component["onPagerClick"](clickPrev, mockList, "left");

            expect(mockList.scrollTo).toHaveBeenNthCalledWith(1, { behavior: "smooth", left: 100 });
            expect(mockList.scrollTo).toHaveBeenNthCalledWith(2, { behavior: "smooth", left: 0 });

            // In RTL: Next -> target -100, then Prev -> target 0
            vi.spyOn(component as unknown as { isRtl: () => boolean }, "isRtl").mockReturnValue(true);
            component["onPagerClick"](clickNext, mockList, "right");
            component["onPagerClick"](clickPrev, mockList, "left");

            expect(mockList.scrollTo).toHaveBeenNthCalledWith(3, { behavior: "smooth", left: -100 });
            expect(mockList.scrollTo).toHaveBeenNthCalledWith(4, { behavior: "smooth", left: 0 });
        });

        it("accumulates intended scroll target during continuous hold ticks", () => {
            vi.useFakeTimers();
            try {
                const mockList = { scrollTo: vi.fn(), scrollBy: vi.fn(), scrollLeft: 0 } as unknown as HTMLUListElement;
                const downEvent = new PointerEvent("pointerdown", { isPrimary: true, button: 0, pointerId: 1 });
                const upEvent = new PointerEvent("pointerup", { pointerId: 1 });

                component["onPagerPointerDown"](downEvent, mockList, "right");
                vi.advanceTimersByTime(180); // 3 ticks

                expect(mockList.scrollTo).toHaveBeenNthCalledWith(1, { behavior: "smooth", left: 100 });
                expect(mockList.scrollTo).toHaveBeenNthCalledWith(2, { behavior: "smooth", left: 200 });
                expect(mockList.scrollTo).toHaveBeenNthCalledWith(3, { behavior: "smooth", left: 300 });

                document.dispatchEvent(upEvent);
            } finally {
                vi.useRealTimers();
            }
        });

        it("allows a new pointer to acquire hold after prior pointer completes", () => {
            vi.useFakeTimers();
            try {
                const mockList = { scrollBy: vi.fn() } as unknown as HTMLUListElement;
                const pointerADown = new PointerEvent("pointerdown", { isPrimary: true, button: 0, pointerId: 10 });
                const pointerAUp = new PointerEvent("pointerup", { pointerId: 10 });
                const pointerBDown = new PointerEvent("pointerdown", { isPrimary: true, button: 0, pointerId: 20 });
                const pointerBUp = new PointerEvent("pointerup", { pointerId: 20 });

                // Pointer A completes
                component["onPagerPointerDown"](pointerADown, mockList, "right");
                vi.advanceTimersByTime(60);
                expect(mockList.scrollBy).toHaveBeenCalledTimes(1);
                document.dispatchEvent(pointerAUp);

                // Pointer B can acquire hold
                component["onPagerPointerDown"](pointerBDown, mockList, "right");
                vi.advanceTimersByTime(120);
                expect(mockList.scrollBy).toHaveBeenCalledTimes(3);
                document.dispatchEvent(pointerBUp);
            } finally {
                vi.useRealTimers();
            }
        });

        it("allows a new pointer to acquire hold after prior pointer is canceled", () => {
            vi.useFakeTimers();
            try {
                const mockList = { scrollBy: vi.fn() } as unknown as HTMLUListElement;
                const pointerADown = new PointerEvent("pointerdown", { isPrimary: true, button: 0, pointerId: 10 });
                const pointerACancel = new PointerEvent("pointercancel", { pointerId: 10 });
                const pointerBDown = new PointerEvent("pointerdown", { isPrimary: true, button: 0, pointerId: 20 });
                const pointerBUp = new PointerEvent("pointerup", { pointerId: 20 });

                // Pointer A cancels
                component["onPagerPointerDown"](pointerADown, mockList, "right");
                vi.advanceTimersByTime(60);
                expect(mockList.scrollBy).toHaveBeenCalledTimes(1);
                document.dispatchEvent(pointerACancel);

                // Pointer B can acquire hold
                component["onPagerPointerDown"](pointerBDown, mockList, "right");
                vi.advanceTimersByTime(120);
                expect(mockList.scrollBy).toHaveBeenCalledTimes(3);
                document.dispatchEvent(pointerBUp);
            } finally {
                vi.useRealTimers();
            }
        });

        it("resynchronizes cumulative target from actual scrollLeft when semantic direction changes to RTL", () => {
            const mockList = {
                clientWidth: 200,
                scrollBy: vi.fn(),
                scrollLeft: 0,
                scrollTo: vi.fn(),
                scrollWidth: 500
            };
            const listElement = mockList as unknown as HTMLUListElement;

            const clickRight = new PointerEvent("click", { button: 0, detail: 1, pointerId: 1 });

            // In LTR: Next -> target +100
            component["onPagerClick"](clickRight, listElement, "right");
            expect(mockList.scrollTo).toHaveBeenNthCalledWith(1, { behavior: "smooth", left: 100 });

            // Switch direction to RTL before target cleanup, and update scrollLeft to current RTL position e.g. -50
            vi.spyOn(component as unknown as { isRtl: () => boolean }, "isRtl").mockReturnValue(true);
            mockList.scrollLeft = -50;

            // In RTL: Next -> base is now -50 (not +100), offset is -100 -> target is -150
            component["onPagerClick"](clickRight, listElement, "right");
            expect(mockList.scrollTo).toHaveBeenNthCalledWith(2, { behavior: "smooth", left: -150 });
        });

        it("resynchronizes cumulative target from actual scrollLeft when semantic direction changes to LTR (symmetry)", () => {
            const mockList = {
                clientWidth: 200,
                scrollBy: vi.fn(),
                scrollLeft: 0,
                scrollTo: vi.fn(),
                scrollWidth: 500
            };
            const listElement = mockList as unknown as HTMLUListElement;

            const clickRight = new PointerEvent("click", { button: 0, detail: 1, pointerId: 1 });

            // In RTL: Next -> target -100
            vi.spyOn(component as unknown as { isRtl: () => boolean }, "isRtl").mockReturnValue(true);
            component["onPagerClick"](clickRight, listElement, "right");
            expect(mockList.scrollTo).toHaveBeenNthCalledWith(1, { behavior: "smooth", left: -100 });

            // Switch direction to LTR before target cleanup, and update scrollLeft to current LTR position e.g. 50
            vi.spyOn(component as unknown as { isRtl: () => boolean }, "isRtl").mockReturnValue(false);
            mockList.scrollLeft = 50;

            // In LTR: Next -> base is now 50 (not -100), offset is +100 -> target is 150
            component["onPagerClick"](clickRight, listElement, "right");
            expect(mockList.scrollTo).toHaveBeenNthCalledWith(2, { behavior: "smooth", left: 150 });
        });

        it("resynchronizes cumulative target when pager element changes", () => {
            const mockListA = {
                clientWidth: 200,
                scrollBy: vi.fn(),
                scrollLeft: 0,
                scrollTo: vi.fn(),
                scrollWidth: 500
            } as unknown as HTMLUListElement;
            const mockListB = {
                clientWidth: 200,
                scrollBy: vi.fn(),
                scrollLeft: 0,
                scrollTo: vi.fn(),
                scrollWidth: 500
            } as unknown as HTMLUListElement;

            const clickRight = new PointerEvent("click", { button: 0, detail: 1, pointerId: 1 });

            // First step on element A -> target 100
            component["onPagerClick"](clickRight, mockListA, "right");
            expect(mockListA.scrollTo).toHaveBeenNthCalledWith(1, { behavior: "smooth", left: 100 });

            // First step on element B -> target 100 (NOT 200)
            component["onPagerClick"](clickRight, mockListB, "right");
            expect(mockListB.scrollTo).toHaveBeenNthCalledWith(1, { behavior: "smooth", left: 100 });
        });

        it("accumulates intended scroll target across 3 rapid consecutive steps", () => {
            const mockList = { scrollBy: vi.fn(), scrollLeft: 0, scrollTo: vi.fn() } as unknown as HTMLUListElement;
            const click1 = new PointerEvent("click", { button: 0, detail: 1, pointerId: 1 });
            const click2 = new PointerEvent("click", { button: 0, detail: 1, pointerId: 1 });
            const click3 = new PointerEvent("click", { button: 0, detail: 1, pointerId: 1 });

            component["onPagerClick"](click1, mockList, "right");
            component["onPagerClick"](click2, mockList, "right");
            component["onPagerClick"](click3, mockList, "right");

            expect(mockList.scrollTo).toHaveBeenNthCalledWith(1, { behavior: "smooth", left: 100 });
            expect(mockList.scrollTo).toHaveBeenNthCalledWith(2, { behavior: "smooth", left: 200 });
            expect(mockList.scrollTo).toHaveBeenNthCalledWith(3, { behavior: "smooth", left: 300 });
        });

        it("preserves rejected pointer state across a later owner acquisition and rejects trailing click", () => {
            vi.useFakeTimers();
            try {
                const mockList = { scrollBy: vi.fn(), scrollLeft: 0, scrollTo: vi.fn() } as unknown as HTMLUListElement;
                const pointerADown = new PointerEvent("pointerdown", { button: 0, isPrimary: true, pointerId: 10 });
                const pointerBDown = new PointerEvent("pointerdown", { button: 0, isPrimary: true, pointerId: 20 });
                const pointerAUp = new PointerEvent("pointerup", { pointerId: 10 });
                const pointerAClick = new PointerEvent("click", { button: 0, detail: 1, pointerId: 10 });

                const pointerCDown = new PointerEvent("pointerdown", { button: 0, isPrimary: true, pointerId: 30 });
                const pointerCUp = new PointerEvent("pointerup", { pointerId: 30 });
                const pointerCClick = new PointerEvent("click", { button: 0, detail: 1, pointerId: 30 });

                const pointerBUp = new PointerEvent("pointerup", { pointerId: 20 });
                const pointerBClick = new PointerEvent("click", { button: 0, detail: 1, pointerId: 20 });

                // Pointer A acquires hold
                component["onPagerPointerDown"](pointerADown, mockList, "right");
                vi.advanceTimersByTime(120); // 2 ticks
                expect(mockList.scrollTo).toHaveBeenCalledTimes(2);

                // Pointer B rejected while A is active
                component["onPagerPointerDown"](pointerBDown, mockList, "right");
                vi.advanceTimersByTime(60); // 3rd tick belongs to A
                expect(mockList.scrollTo).toHaveBeenCalledTimes(3);

                // Pointer A releases and trailing click is suppressed
                document.dispatchEvent(pointerAUp);
                component["onPagerClick"](pointerAClick, mockList, "right");
                expect(mockList.scrollTo).toHaveBeenCalledTimes(3);

                // Pointer C acquires as new owner while B is still down
                component["onPagerPointerDown"](pointerCDown, mockList, "right");
                document.dispatchEvent(pointerCUp);
                component["onPagerClick"](pointerCClick, mockList, "right"); // C short click executes 1 step
                expect(mockList.scrollTo).toHaveBeenCalledTimes(4);

                // Pointer B finally releases and synthesizes click: MUST STILL BE REJECTED (0 steps)
                document.dispatchEvent(pointerBUp);
                component["onPagerClick"](pointerBClick, mockList, "right");
                expect(mockList.scrollTo).toHaveBeenCalledTimes(4);
            } finally {
                vi.useRealTimers();
            }
        });

        it("removes only itself when rejected pointer receives pointercancel while another remains tracked", () => {
            vi.useFakeTimers();
            try {
                const mockList = { scrollBy: vi.fn(), scrollLeft: 0, scrollTo: vi.fn() } as unknown as HTMLUListElement;
                const pointerADown = new PointerEvent("pointerdown", { button: 0, isPrimary: true, pointerId: 10 });
                const pointerBDown = new PointerEvent("pointerdown", { button: 0, isPrimary: true, pointerId: 20 });
                const pointerDDown = new PointerEvent("pointerdown", { button: 0, isPrimary: true, pointerId: 40 });
                const pointerBCancel = new PointerEvent("pointercancel", { pointerId: 20 });
                const pointerDClick = new PointerEvent("click", { button: 0, detail: 1, pointerId: 40 });

                // Pointer A acquires hold
                component["onPagerPointerDown"](pointerADown, mockList, "right");
                vi.advanceTimersByTime(60); // 1 tick
                expect(mockList.scrollTo).toHaveBeenCalledTimes(1);

                // Pointer B and D are rejected
                component["onPagerPointerDown"](pointerBDown, mockList, "right");
                component["onPagerPointerDown"](pointerDDown, mockList, "right");

                // Pointer B is canceled -> only B is removed
                document.dispatchEvent(pointerBCancel);
                vi.advanceTimersByTime(60); // 2nd tick belongs to A
                expect(mockList.scrollTo).toHaveBeenCalledTimes(2);

                // Pointer D click arrives -> D is still tracked in rejected set and produces 0 steps
                component["onPagerClick"](pointerDClick, mockList, "right");
                expect(mockList.scrollTo).toHaveBeenCalledTimes(2);
            } finally {
                vi.useRealTimers();
            }
        });

        it("does not allow a new owner to erase a pending pointer trailing-click suppression", () => {
            vi.useFakeTimers();
            try {
                const mockList = { scrollBy: vi.fn(), scrollLeft: 0, scrollTo: vi.fn() } as unknown as HTMLUListElement;
                const pointerADown = new PointerEvent("pointerdown", { button: 0, isPrimary: true, pointerId: 10 });
                const pointerAUp = new PointerEvent("pointerup", { pointerId: 10 });
                const pointerBDown = new PointerEvent("pointerdown", { button: 0, isPrimary: true, pointerId: 20 });
                const pointerAClick = new PointerEvent("click", { button: 0, detail: 1, pointerId: 10 });

                // A earns trailing-click suppression
                component["onPagerPointerDown"](pointerADown, mockList, "right");
                vi.advanceTimersByTime(120); // 2 ticks
                expect(mockList.scrollTo).toHaveBeenCalledTimes(2);
                document.dispatchEvent(pointerAUp);

                // B is accepted as new owner before A's click arrives
                component["onPagerPointerDown"](pointerBDown, mockList, "right");

                // A's click arrives: must STILL be suppressed
                component["onPagerClick"](pointerAClick, mockList, "right");
                expect(mockList.scrollTo).toHaveBeenCalledTimes(2);
            } finally {
                vi.useRealTimers();
            }
        });

        it("safely clears stale suppression/rejection for the same pointerId when reused for a fresh press", () => {
            vi.useFakeTimers();
            try {
                const mockList = { scrollBy: vi.fn(), scrollLeft: 0, scrollTo: vi.fn() } as unknown as HTMLUListElement;
                const down1 = new PointerEvent("pointerdown", { button: 0, isPrimary: true, pointerId: 10 });
                const up1 = new PointerEvent("pointerup", { pointerId: 10 });

                // Pointer 10 earns suppression
                component["onPagerPointerDown"](down1, mockList, "right");
                vi.advanceTimersByTime(120);
                expect(mockList.scrollTo).toHaveBeenCalledTimes(2);
                document.dispatchEvent(up1);

                // Pointer 10 starts a fresh short click interaction (pointerdown -> up -> click)
                const down2 = new PointerEvent("pointerdown", { button: 0, isPrimary: true, pointerId: 10 });
                const up2 = new PointerEvent("pointerup", { pointerId: 10 });
                const click2 = new PointerEvent("click", { button: 0, detail: 1, pointerId: 10 });

                component["onPagerPointerDown"](down2, mockList, "right");
                vi.advanceTimersByTime(30); // before first repeat tick
                document.dispatchEvent(up2);

                // Fresh short click executes 1 step (stale suppression was safely cleared on pointerdown)
                component["onPagerClick"](click2, mockList, "right");
                expect(mockList.scrollTo).toHaveBeenCalledTimes(3);
            } finally {
                vi.useRealTimers();
            }
        });

        it("scrollend support path does not use wall-clock expiry and clears on scrollend", () => {
            vi.useFakeTimers();
            try {
                const listeners: Record<string, (e?: unknown) => void> = {};
                const mockList = {
                    addEventListener: vi.fn((event: string, handler: (e?: unknown) => void) => {
                        listeners[event] = handler;
                    }),
                    clientWidth: 200,
                    onscrollend: null, // signifies scrollend support
                    removeEventListener: vi.fn((event: string) => {
                        delete listeners[event];
                    }),
                    scrollBy: vi.fn(),
                    scrollLeft: 0,
                    scrollTo: vi.fn(),
                    scrollWidth: 1000
                };
                const listElement = mockList as unknown as HTMLUListElement;

                const click = new PointerEvent("click", { button: 0, detail: 1, pointerId: 1 });

                // Step 1: target 100
                component["onPagerClick"](click, listElement, "right");
                expect(mockList.scrollTo).toHaveBeenNthCalledWith(1, { behavior: "smooth", left: 100 });
                expect(mockList.addEventListener).toHaveBeenCalledWith("scrollend", expect.any(Function), { once: true });

                // Advance time far beyond 600 ms (e.g. 2000 ms) without dispatching scrollend
                vi.advanceTimersByTime(2000);

                // Step 2: must still accumulate from the intended target 100 -> target 200
                component["onPagerClick"](click, listElement, "right");
                expect(mockList.scrollTo).toHaveBeenNthCalledWith(2, { behavior: "smooth", left: 200 });

                // Now dispatch scrollend (simulating completion)
                mockList.scrollLeft = 200;
                listeners["scrollend"]?.();

                // Step 3: after scrollend, base resynchronizes from actual scrollLeft
                mockList.scrollLeft = 250;
                component["onPagerClick"](click, listElement, "right");
                expect(mockList.scrollTo).toHaveBeenNthCalledWith(3, { behavior: "smooth", left: 350 });
            } finally {
                vi.useRealTimers();
            }
        });

        it("fallback inactivity path maintains target during continuous scroll events and resets after debounce", () => {
            vi.useFakeTimers();
            try {
                const listeners: Record<string, (e?: unknown) => void> = {};
                const mockList = {
                    addEventListener: vi.fn((event: string, handler: (e?: unknown) => void) => {
                        listeners[event] = handler;
                    }),
                    clientWidth: 200,
                    removeEventListener: vi.fn((event: string) => {
                        delete listeners[event];
                    }),
                    scrollBy: vi.fn(),
                    scrollLeft: 0,
                    scrollTo: vi.fn(),
                    scrollWidth: 500
                };
                const listElement = mockList as unknown as HTMLUListElement;

                const click = new PointerEvent("click", { button: 0, detail: 1, pointerId: 1 });

                // Step 1: target 100
                component["onPagerClick"](click, listElement, "right");
                expect(mockList.scrollTo).toHaveBeenNthCalledWith(1, { behavior: "smooth", left: 100 });
                expect(mockList.addEventListener).toHaveBeenCalledWith("scroll", expect.any(Function), { passive: true });

                // Emit multiple scroll events separated by 100ms (< 150ms debounce) for 800ms total
                for (let i = 0; i < 8; i++) {
                    vi.advanceTimersByTime(100);
                    listeners["scroll"]?.();
                }

                // Step 2: during active scroll events beyond 800ms, target must NOT have reset -> accumulates to 200
                component["onPagerClick"](click, listElement, "right");
                expect(mockList.scrollTo).toHaveBeenNthCalledWith(2, { behavior: "smooth", left: 200 });

                // Stop emitting scroll events and advance beyond inactivity debounce (150ms)
                vi.advanceTimersByTime(200);

                // Target has now reset to actual scrollLeft
                mockList.scrollLeft = 200;
                component["onPagerClick"](click, listElement, "right");
                expect(mockList.scrollTo).toHaveBeenNthCalledWith(3, { behavior: "smooth", left: 300 });
            } finally {
                vi.useRealTimers();
            }
        });

        it("cleans up pending completion listeners and timers on component destruction", () => {
            vi.useFakeTimers();
            try {
                const removeEventListenerSpy = vi.fn();
                const mockList = {
                    addEventListener: vi.fn(),
                    clientWidth: 200,
                    removeEventListener: removeEventListenerSpy,
                    scrollBy: vi.fn(),
                    scrollLeft: 0,
                    scrollTo: vi.fn(),
                    scrollWidth: 500
                } as unknown as HTMLUListElement;

                const localFixture = TestBed.createComponent(ScrollViewComponent);
                localFixture.componentRef.setInput("width", 500);
                localFixture.componentRef.setInput("height", 375);
                localFixture.detectChanges();
                const localComp = localFixture.componentInstance;

                const click = new PointerEvent("click", { button: 0, detail: 1, pointerId: 1 });
                localComp["onPagerClick"](click, mockList, "right");

                // Destroy component
                localFixture.destroy();

                expect(removeEventListenerSpy).toHaveBeenCalledWith("scroll", expect.any(Function));
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

        it("uses instant behavior when prefers-reduced-motion matches", () => {
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

                expect(localComp["scrollBehavior"]()).toBe("instant");

                const mockList = { scrollBy: vi.fn() } as unknown as HTMLUListElement;
                const mockButton = { scrollIntoView: vi.fn() } as unknown as HTMLButtonElement;

                vi.useFakeTimers();
                try {
                    localComp["onPagerClick"](new MouseEvent("click", { detail: 1, button: 0 }), mockList, "right");
                    vi.advanceTimersByTime(60);
                    expect(mockList.scrollBy).toHaveBeenCalledWith({ behavior: "instant", left: 100 });

                    localComp["onPageClick"](1, mockButton);
                    expect(mockButton.scrollIntoView).toHaveBeenCalledWith({
                        behavior: "instant",
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
                    addEventListener: vi.fn((event: string, listener: (e: MediaQueryListEvent) => void) => {
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

                expect(localComp["scrollBehavior"]()).toBe("instant");

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
