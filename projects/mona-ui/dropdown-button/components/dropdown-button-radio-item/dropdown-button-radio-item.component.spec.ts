import { ComponentFixture, TestBed } from "@angular/core/testing";

import { DropdownButtonRadioItemComponent } from "./dropdown-button-radio-item.component";

describe("DropdownButtonRadioItemComponent", () => {
    let component: DropdownButtonRadioItemComponent;
    let fixture: ComponentFixture<DropdownButtonRadioItemComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [DropdownButtonRadioItemComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(DropdownButtonRadioItemComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
