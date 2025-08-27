import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideAnimations } from "@angular/platform-browser/animations";
import { ContextMenuComponent } from "../../../../menus/contextmenu/components/contextmenu/contextmenu.component";

import { DropdownButtonComponent } from "./dropdown-button.component";

describe("DropdownButtonComponent", () => {
    let component: DropdownButtonComponent;
    let fixture: ComponentFixture<DropdownButtonComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [DropdownButtonComponent, ContextMenuComponent],
            providers: [provideAnimations()]
        });
        fixture = TestBed.createComponent(DropdownButtonComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
