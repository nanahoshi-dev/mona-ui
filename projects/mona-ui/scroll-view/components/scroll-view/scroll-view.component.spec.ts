import { ComponentFixture, TestBed } from "@angular/core/testing";

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

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("uses a soft surface boundary and neutral carousel controls", () => {
        fixture.componentRef.setInput("arrows", true);
        fixture.componentRef.setInput("data", ["First", "Second"]);
        fixture.componentRef.setInput("infinite", true);
        fixture.componentRef.setInput("pageable", true);
        fixture.detectChanges();

        const host = fixture.nativeElement as HTMLElement;
        const navigationArrow = host.querySelector("[data-navigate-prev]") as HTMLButtonElement;
        const activePage = host.querySelector("[data-active-page='true']") as HTMLButtonElement;

        expect(host.classList.contains("bg-surface")).toBe(true);
        expect(host.classList.contains("border-border-subtle")).toBe(true);
        expect(host.classList.contains("border-2")).toBe(false);
        expect(navigationArrow.classList.contains("bg-surface-overlay/65")).toBe(true);
        expect(navigationArrow.classList.contains("hover:bg-hover/90")).toBe(true);
        expect(navigationArrow.classList.contains("focus-visible:ring-focus-indicator/35")).toBe(true);
        expect(activePage.classList.contains("!bg-foreground")).toBe(true);
        expect(activePage.classList.contains("hover:!bg-foreground")).toBe(true);
        expect(activePage.classList.contains("!bg-primary")).toBe(false);
        expect(activePage.classList.contains("bg-white")).toBe(false);
    });
});
