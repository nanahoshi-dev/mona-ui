import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ContextMenuCheckboxItemComponent } from "./contextmenu-checkbox-item.component";

describe("ContextmenuCheckboxItemComponent", () => {
    let component: ContextMenuCheckboxItemComponent;
    let fixture: ComponentFixture<ContextMenuCheckboxItemComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ContextMenuCheckboxItemComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(ContextMenuCheckboxItemComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
