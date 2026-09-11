import { ComponentFixture, TestBed } from "@angular/core/testing";

import { SwitchComponent } from "./switch.component";

describe("SwitchComponent", () => {
    let component: SwitchComponent;
    let fixture: ComponentFixture<SwitchComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [SwitchComponent]
        });
        fixture = TestBed.createComponent(SwitchComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should use primary selection with a neutral raised handle and semantic state colors", () => {
        const hostElement = fixture.nativeElement as HTMLElement;
        const handleElement = fixture.nativeElement.querySelector("div") as HTMLDivElement;

        expect(hostElement.classList.contains("data-[active='true']:bg-primary")).toBe(true);
        expect(hostElement.classList.contains("focus-visible:ring-focus-indicator/35")).toBe(true);
        expect(hostElement.classList.contains("data-[invalid='true']:focus-visible:ring-error/35")).toBe(true);
        expect(hostElement.classList.contains("data-[disabled='true']:bg-disabled-background")).toBe(true);
        expect(
            handleElement.classList.contains(
                "[background-color:var(--mona-effect-raised-background-color,var(--color-surface-raised))]"
            )
        ).toBe(true);
        expect(handleElement.classList.contains("border-border-subtle")).toBe(true);
    });

    it("uses logical inset-inline-start positioning and transitions on the handle", () => {
        const handleElement = fixture.nativeElement.querySelector("div") as HTMLDivElement;

        expect(handleElement.classList.contains("transition-[inset-inline-start,background]")).toBe(true);
        expect(handleElement.classList.contains("data-[active='false']:start-0.5")).toBe(true);
        expect(handleElement.classList.contains("data-[active='true']:start-[calc(100%-22px)]")).toBe(true);
    });

    it("merges custom user class via tailwind-merge", () => {
        fixture.componentRef.setInput("class", "custom-switch-class");
        fixture.detectChanges();
        const hostElement = fixture.nativeElement as HTMLElement;
        expect(hostElement.classList.contains("custom-switch-class")).toBe(true);
    });
});

