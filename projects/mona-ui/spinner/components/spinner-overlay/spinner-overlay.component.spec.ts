import { ComponentFixture, TestBed } from "@angular/core/testing";
import { SpinnerComponent } from "../spinner/spinner.component";
import { SpinnerOverlayComponent } from "./spinner-overlay.component";

describe("SpinnerOverlayComponent", () => {
    let fixture: ComponentFixture<SpinnerOverlayComponent>;
    let host: HTMLElement;

    beforeEach(() => {
        TestBed.configureTestingModule({ imports: [SpinnerOverlayComponent] });
        fixture = TestBed.createComponent(SpinnerOverlayComponent);
        host = fixture.nativeElement;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(fixture.componentInstance).toBeTruthy();
    });

    it("should render local overlay by default with absolute positioning", () => {
        expect(host.classList.contains("absolute")).toBe(true);
        expect(host.classList.contains("inset-0")).toBe(true);
        expect(host.style.zIndex).toBe("1");
    });

    it("should render full-page overlay with fixed positioning when fullPage is true", () => {
        fixture.componentRef.setInput("fullPage", true);
        fixture.detectChanges();

        expect(host.classList.contains("fixed")).toBe(true);
        expect(host.classList.contains("inset-0")).toBe(true);
        expect(host.style.zIndex).toBe("50");
    });

    it("should respect custom zIndex input", () => {
        fixture.componentRef.setInput("zIndex", 9999);
        fixture.detectChanges();

        expect(host.style.zIndex).toBe("9999");
    });

    it("should render nested SpinnerComponent as decorative", () => {
        const spinnerElement = host.querySelector("mona-spinner");
        expect(spinnerElement).toBeTruthy();
        expect(spinnerElement?.getAttribute("aria-hidden")).toBe("true");
        expect(spinnerElement?.getAttribute("role")).toBeNull();
    });

    it("should forward appearance and size to nested SpinnerComponent", () => {
        fixture.componentRef.setInput("appearance", "pulsing");
        fixture.componentRef.setInput("size", "large");
        fixture.detectChanges();

        const spinnerElement = host.querySelector("mona-spinner");
        expect(spinnerElement?.classList.contains("w-6")).toBe(true);
        expect(spinnerElement?.querySelectorAll("[data-segment]").length).toBe(2);
    });

    it("should render screen-reader fallback when no visible text is provided", () => {
        const srOnly = host.querySelector(".sr-only");
        expect(srOnly).toBeTruthy();
        expect(srOnly?.textContent?.trim()).toBe("Loading");
    });

    it("should render visible text when provided", () => {
        fixture.componentRef.setInput("text", "Fetching records...");
        fixture.detectChanges();

        expect(host.textContent).toContain("Fetching records...");
        expect(host.querySelector(".sr-only")).toBeNull();
    });

    it("should not render cancellation button by default", () => {
        expect(host.querySelector("button")).toBeNull();
    });

    it("should render cancellation button with custom text and emit cancel output on click", () => {
        fixture.componentRef.setInput("cancellable", true);
        fixture.componentRef.setInput("cancelText", "Stop Loading");
        fixture.detectChanges();

        const button = host.querySelector("button");
        expect(button).toBeTruthy();
        expect(button?.textContent?.trim()).toBe("Stop Loading");

        let cancelEmitted = false;
        fixture.componentInstance.cancel.subscribe(() => {
            cancelEmitted = true;
        });

        button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        expect(cancelEmitted).toBe(true);
    });
});
