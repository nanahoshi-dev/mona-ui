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
        expect(handleElement.classList.contains("bg-surface-raised")).toBe(true);
        expect(handleElement.classList.contains("border-border-subtle")).toBe(true);
    });
});
