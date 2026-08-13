import { ComponentFixture, TestBed } from "@angular/core/testing";
import { SpinnerComponent } from "./spinner.component";

describe("SpinnerComponent", () => {
    let fixture: ComponentFixture<SpinnerComponent>;
    let host: HTMLElement;

    beforeEach(() => {
        TestBed.configureTestingModule({ imports: [SpinnerComponent] });
        fixture = TestBed.createComponent(SpinnerComponent);
        host = fixture.nativeElement;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(fixture.componentInstance).toBeTruthy();
    });

    it("should render the default appearance with a lucide loader svg", () => {
        const svg = host.querySelector("svg");
        expect(svg).toBeTruthy();
        expect(svg?.classList.contains("animate-[spin_1.5s_linear_infinite]")).toBe(true);
    });

    it("should render 2 segments for pulsing appearance", () => {
        fixture.componentRef.setInput("appearance", "pulsing");
        fixture.detectChanges();

        const segments = host.querySelectorAll("[data-segment]");
        expect(segments.length).toBe(2);
        expect(host.querySelector(".mona-spinner-pulsing-container")).toBeTruthy();
    });

    it("should render 3 segments for infinite-spinner appearance", () => {
        fixture.componentRef.setInput("appearance", "infinite-spinner");
        fixture.detectChanges();

        const segments = host.querySelectorAll("[data-segment]");
        expect(segments.length).toBe(3);
        expect(host.querySelector(".mona-spinner-infinite-container")).toBeTruthy();
    });

    it("should render 4 segments for converging-spinner appearance", () => {
        fixture.componentRef.setInput("appearance", "converging-spinner");
        fixture.detectChanges();

        const segments = host.querySelectorAll("[data-segment]");
        expect(segments.length).toBe(4);
        expect(host.querySelector(".mona-spinner-converge-container")).toBeTruthy();
    });

    it.each([
        ["small", "w-3", "h-3"],
        ["medium", "w-4", "h-4"],
        ["large", "w-6", "h-6"]
    ] as const)("should apply appropriate sizing classes for %s size", (size, widthClass, heightClass) => {
        fixture.componentRef.setInput("size", size);
        fixture.detectChanges();

        expect(host.classList.contains(widthClass)).toBe(true);
        expect(host.classList.contains(heightClass)).toBe(true);
    });

    it("should merge user classes onto the host", () => {
        fixture.componentRef.setInput("class", "text-primary custom-spinner");
        fixture.detectChanges();

        expect(host.classList.contains("text-primary")).toBe(true);
        expect(host.classList.contains("custom-spinner")).toBe(true);
    });

    it("should have status role and default loading aria-label in standalone mode", () => {
        expect(host.getAttribute("role")).toBe("status");
        expect(host.getAttribute("aria-label")).toBe("Loading");
        expect(host.getAttribute("aria-hidden")).toBeNull();
    });

    it("should support custom aria-label", () => {
        fixture.componentRef.setInput("aria-label", "Saving changes");
        fixture.detectChanges();

        expect(host.getAttribute("aria-label")).toBe("Saving changes");
    });

    it("should remove status semantics and set aria-hidden when decorative is true", () => {
        fixture.componentRef.setInput("decorative", true);
        fixture.detectChanges();

        expect(host.getAttribute("role")).toBeNull();
        expect(host.getAttribute("aria-label")).toBeNull();
        expect(host.getAttribute("aria-hidden")).toBe("true");
    });

    it("should not generate duplicate HTML IDs", () => {
        const fixture2 = TestBed.createComponent(SpinnerComponent);
        fixture2.componentRef.setInput("appearance", "converging-spinner");
        fixture2.detectChanges();

        const allIds = Array.from(host.querySelectorAll("[id]")).concat(
            Array.from(fixture2.nativeElement.querySelectorAll("[id]"))
        );
        expect(allIds.length).toBe(0);
    });
});
