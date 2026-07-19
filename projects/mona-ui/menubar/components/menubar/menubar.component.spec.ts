import { ComponentFixture, TestBed } from "@angular/core/testing";
import { contextMenuContentThemeVariants, menubarBaseThemeVariants } from "../../styles/menu.styles";

import { MenubarComponent } from "./menubar.component";

describe("MenubarComponent", () => {
    let component: MenubarComponent;
    let fixture: ComponentFixture<MenubarComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MenubarComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(MenubarComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("uses a muted bar and an elevated overlay menu", () => {
        const barClasses = menubarBaseThemeVariants({ rounded: "medium", size: "medium" }).split(/\s+/);
        const menuClasses = contextMenuContentThemeVariants({
            rounded: "medium",
            size: "medium"
        }).split(/\s+/);

        expect(barClasses).toContain("bg-(--mona-menubar-background)");
        expect(barClasses).toContain("border-border-subtle");
        expect(menuClasses).toContain(
            "[background-color:var(--mona-effect-overlay-background-color,var(--color-surface-overlay))]"
        );
        expect(menuClasses).toContain("border-border");
        expect(menuClasses).toContain("shadow-(--shadow-overlay)");
    });
});
