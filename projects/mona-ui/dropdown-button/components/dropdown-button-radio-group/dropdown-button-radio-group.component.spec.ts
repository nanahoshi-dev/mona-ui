import { ComponentFixture, TestBed } from "@angular/core/testing";

import { DropdownButtonRadioGroupComponent } from "./dropdown-button-radio-group.component";

describe("DropdownButtonRadioGroupComponent", () => {
    let component: DropdownButtonRadioGroupComponent;
    let fixture: ComponentFixture<DropdownButtonRadioGroupComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [DropdownButtonRadioGroupComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(DropdownButtonRadioGroupComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
