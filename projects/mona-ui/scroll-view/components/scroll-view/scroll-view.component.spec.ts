import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MONA_DEFAULT_LOCALE, MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { afterEach } from "vitest";
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

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("uses a soft surface boundary and neutral carousel controls with logical start/end positioning", () => {
        fixture.componentRef.setInput("arrows", true);
        fixture.componentRef.setInput("data", ["First", "Second"]);
        fixture.componentRef.setInput("infinite", true);
        fixture.componentRef.setInput("pageable", true);
        fixture.detectChanges();

        const host = fixture.nativeElement as HTMLElement;
        const prevArrow = host.querySelector("[data-navigate-prev]") as HTMLButtonElement;
        const nextArrow = host.querySelector("[data-navigate-next]") as HTMLButtonElement;
        const activePage = host.querySelector("[data-active-page='true']") as HTMLButtonElement;
        const pager = activePage.closest(".inset-x-0");

        expect(host.classList.contains("bg-surface")).toBe(true);
        expect(host.classList.contains("border-border-subtle")).toBe(true);
        expect(host.classList.contains("border-2")).toBe(false);

        // Logical positioning utilities
        expect(prevArrow.classList.contains("start-0")).toBe(true);
        expect(prevArrow.classList.contains("left-0")).toBe(false);
        expect(nextArrow.classList.contains("end-0")).toBe(true);
        expect(nextArrow.classList.contains("right-0")).toBe(false);
        expect(pager?.classList.contains("inset-x-0")).toBe(true);
        expect(pager?.classList.contains("bottom-0")).toBe(true);

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
                    scrollPagerLeft: "Pager links",
                    scrollPagerRight: "Pager rechts"
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

    it("inverts horizontal keyboard navigation when DOM is RTL", () => {
        fixture.componentRef.setInput("data", ["Item 1", "Item 2", "Item 3"]);
        fixture.componentRef.setInput("index", 0);

        const host = fixture.nativeElement as HTMLElement;
        host.setAttribute("dir", "rtl");
        fixture.detectChanges();

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
});
