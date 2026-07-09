import { ComponentFixture, TestBed } from "@angular/core/testing";

import { MenuRadioGroupComponent } from "./menu-radio-group.component";

describe("MenuRadioGroupComponent", () => {
    let component: MenuRadioGroupComponent;
    let fixture: ComponentFixture<MenuRadioGroupComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MenuRadioGroupComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(MenuRadioGroupComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
