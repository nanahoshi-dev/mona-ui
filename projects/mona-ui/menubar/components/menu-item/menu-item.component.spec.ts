import { ComponentFixture, TestBed } from "@angular/core/testing";
import { menuItemThemeVariants } from "../../styles/menu.styles";

import { MenuItemComponent } from "./menu-item.component";

describe("MenuItemComponent", () => {
    let component: MenuItemComponent;
    let fixture: ComponentFixture<MenuItemComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MenuItemComponent],
            providers: []
        }).compileComponents();

        fixture = TestBed.createComponent(MenuItemComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("uses neutral hover, focus, active, and disabled states", () => {
        const classes = menuItemThemeVariants("mona")({ size: "medium" }).split(/\s+/);

        expect(classes).toContain("hover:bg-hover");
        expect(classes).toContain("focus-within:bg-hover");
        expect(classes).toContain("data-[focused]:bg-hover");
        expect(classes).toContain("data-[disabled='true']:text-disabled-foreground");
        expect(classes).not.toContain("focus-within:bg-accent");
        expect(classes).not.toContain("text-accent-foreground");
    });
});
