import { ComponentFixture, TestBed } from "@angular/core/testing";

import { RadioButtonComponent } from "./radio-button.component";

describe("RadioButtonComponent", () => {
    let component: RadioButtonComponent;
    let fixture: ComponentFixture<RadioButtonComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [RadioButtonComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(RadioButtonComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should draw one semantic focus indicator around the visible control", () => {
        const inputElement = fixture.nativeElement.querySelector("input") as HTMLInputElement;
        const circleElement = fixture.nativeElement.querySelector("span") as HTMLSpanElement;

        expect(inputElement.classList.toString()).not.toContain("focus:ring");
        expect(inputElement.classList.toString()).not.toContain("ring-offset");
        expect(circleElement.classList.contains("peer-focus-visible:ring-focus-indicator/35")).toBe(true);
        expect(circleElement.classList.contains("data-[invalid='true']:peer-focus-visible:ring-error/35")).toBe(true);
        expect(circleElement.classList.contains("peer-disabled:bg-disabled-background")).toBe(true);
    });
});
