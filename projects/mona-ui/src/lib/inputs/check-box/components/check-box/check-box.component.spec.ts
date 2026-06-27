import { ComponentFixture, TestBed } from "@angular/core/testing";

import { CheckBoxComponent } from "./check-box.component";

describe("CheckBoxComponent", () => {
    let component: CheckBoxComponent;
    let fixture: ComponentFixture<CheckBoxComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CheckBoxComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(CheckBoxComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should keep the native input focusable for keyboard navigation", () => {
        const inputElement = fixture.nativeElement.querySelector("input") as HTMLInputElement;
        const checkmarkElement = fixture.nativeElement.querySelector("span") as HTMLSpanElement;

        expect(inputElement.tabIndex).toBe(0);
        expect(inputElement.classList.contains("hidden")).toBe(false);
        expect(inputElement.classList.contains("sr-only")).toBe(true);
        expect(checkmarkElement.classList.contains("peer-focus-visible:ring-2")).toBe(true);
    });
});
