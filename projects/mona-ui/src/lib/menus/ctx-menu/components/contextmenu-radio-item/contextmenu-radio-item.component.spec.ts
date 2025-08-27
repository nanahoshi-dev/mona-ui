import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ContextMenuRadioItemComponent } from "./contextmenu-radio-item.component";

describe("ContextmenuRadioItemComponent", () => {
    let component: ContextMenuRadioItemComponent;
    let fixture: ComponentFixture<ContextMenuRadioItemComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ContextMenuRadioItemComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(ContextMenuRadioItemComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
