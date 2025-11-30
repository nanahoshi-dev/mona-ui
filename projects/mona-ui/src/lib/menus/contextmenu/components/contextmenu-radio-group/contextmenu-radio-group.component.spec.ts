import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ContextMenuRadioGroupComponent } from "./contextmenu-radio-group.component";

describe("ContextmenuRadioGroupComponent", () => {
    let component: ContextMenuRadioGroupComponent;
    let fixture: ComponentFixture<ContextMenuRadioGroupComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ContextMenuRadioGroupComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(ContextMenuRadioGroupComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
