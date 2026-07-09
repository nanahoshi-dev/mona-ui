import { ComponentFixture, TestBed } from "@angular/core/testing";

import { PopupMenuItemComponent } from "./popup-menu-item.component";

describe("PopupMenuItemComponent", () => {
    let component: PopupMenuItemComponent;
    let fixture: ComponentFixture<PopupMenuItemComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [PopupMenuItemComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(PopupMenuItemComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
