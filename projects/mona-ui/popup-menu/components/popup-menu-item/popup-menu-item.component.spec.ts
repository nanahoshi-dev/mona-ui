import { ComponentFixture, TestBed } from "@angular/core/testing";
import { popupMenuItemThemeVariants } from "../../styles/popup-menu.styles";

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

    it("uses the same neutral highlight for leaf and submenu rows", () => {
        const classes = popupMenuItemThemeVariants({ rounded: "medium", size: "medium" }).split(/\s+/);

        expect(classes).toContain("hover:bg-hover");
        expect(classes).toContain("focus-within:bg-hover");
        expect(classes).toContain("data-[active='true']:bg-hover");
        expect(classes).toContain("data-[active='true']:text-foreground");
        expect(classes).toContain("data-[disabled='true']:text-disabled-foreground");
        expect(classes).not.toContain("data-[active='true']:bg-(--color-selected)");
        expect(classes).not.toContain("focus-within:bg-accent");
        expect(classes).not.toContain("text-accent-foreground");
    });
});
