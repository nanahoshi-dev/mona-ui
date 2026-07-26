import { ComponentFixture, TestBed } from "@angular/core/testing";

import { SkeletonComponent } from "./skeleton.component";

describe("SkeletonComponent", () => {
    let fixture: ComponentFixture<SkeletonComponent>;
    let host: HTMLElement;

    beforeEach(() => {
        TestBed.configureTestingModule({ imports: [SkeletonComponent] });
        fixture = TestBed.createComponent(SkeletonComponent);
        host = fixture.nativeElement;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(fixture.componentInstance).toBeTruthy();
    });

    it("should fill its container by default", () => {
        expect(host.style.width).toBe("100%");
        expect(host.style.height).toBe("1rem");
    });

    it("should treat numeric sizes as pixels", () => {
        fixture.componentRef.setInput("width", 120);
        fixture.componentRef.setInput("height", 32);
        fixture.detectChanges();

        expect(host.style.width).toBe("120px");
        expect(host.style.height).toBe("32px");
    });

    it("should pulse only when motion is welcome", () => {
        expect(host.classList.contains("motion-safe:animate-pulse")).toBe(true);
        expect(host.classList.contains("animate-pulse")).toBe(false);
    });

    it("should hide itself from assistive technology, being purely decorative", () => {
        expect(host.getAttribute("aria-hidden")).toBe("true");
    });

    it.each([
        ["none", "rounded-none"],
        ["small", "rounded-sm"],
        ["medium", "rounded-md"],
        ["large", "rounded-lg"],
        ["full", "rounded-full"]
    ] as const)("should apply the %s rounded class", (rounded, expectedClass) => {
        fixture.componentRef.setInput("rounded", rounded);
        fixture.detectChanges();
        expect(host.classList.contains(expectedClass)).toBe(true);
    });

    it("should merge user classes onto the host", () => {
        fixture.componentRef.setInput("class", "custom-skeleton");
        fixture.detectChanges();
        expect(host.classList.contains("custom-skeleton")).toBe(true);
    });
});
