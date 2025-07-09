import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideAnimations } from "@angular/platform-browser/animations";
import { ImmutableSet } from "@mirei/ts-collections";
import { MenuItem } from "../models/MenuItem";
import { ContextMenuService } from "../services/context-menu.service";

import { ContextMenuItemComponent } from "./context-menu-item.component";

describe("ContextMenuItemComponent", () => {
    let component: ContextMenuItemComponent;
    let fixture: ComponentFixture<ContextMenuItemComponent>;
    let menuItem: MenuItem;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [ContextMenuItemComponent],
            providers: [ContextMenuService, provideAnimations()]
        });
        fixture = TestBed.createComponent(ContextMenuItemComponent);
        component = fixture.componentInstance;
        menuItem = new MenuItem({});
        fixture.componentRef.setInput("menuItem", menuItem);
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
