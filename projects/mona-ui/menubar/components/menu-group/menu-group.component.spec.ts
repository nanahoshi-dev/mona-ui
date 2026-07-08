import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideAnimations } from "@angular/platform-browser/animations";

import { MenuGroupComponent } from "./menu-group.component";

describe("MenuItemGroupComponent", () => {
    let component: MenuGroupComponent;
    let fixture: ComponentFixture<MenuGroupComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MenuGroupComponent],
            providers: [provideAnimations()]
        }).compileComponents();

        fixture = TestBed.createComponent(MenuGroupComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
