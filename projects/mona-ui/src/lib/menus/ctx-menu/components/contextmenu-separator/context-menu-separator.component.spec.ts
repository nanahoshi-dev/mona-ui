import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ContextMenuSeparatorComponent } from "./context-menu-separator.component";

describe("ContextMenuSeparatorComponent", () => {
    let component: ContextMenuSeparatorComponent;
    let fixture: ComponentFixture<ContextMenuSeparatorComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ContextMenuSeparatorComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(ContextMenuSeparatorComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
