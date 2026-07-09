import { ComponentFixture, TestBed } from "@angular/core/testing";

import { DropdownButtonGroupComponent } from "./dropdown-button-group.component";

describe("DropdownButtonGroupComponent", () => {
    let component: DropdownButtonGroupComponent;
    let fixture: ComponentFixture<DropdownButtonGroupComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [DropdownButtonGroupComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(DropdownButtonGroupComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
