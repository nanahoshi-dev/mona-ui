import { ComponentFixture, TestBed } from "@angular/core/testing";

import { FilterInputComponent } from "./filter-input.component";

describe("FilterInputComponent", () => {
    let component: FilterInputComponent;
    let fixture: ComponentFixture<FilterInputComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [FilterInputComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(FilterInputComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("leaves the text box wrapper out of the tab order", () => {
        const textBox = fixture.nativeElement.querySelector("mona-text-box") as HTMLElement;

        expect(textBox.hasAttribute("tabindex")).toBe(false);
        expect(textBox.querySelector("input")?.tabIndex).toBe(0);
    });
});
