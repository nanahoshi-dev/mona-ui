import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import {
    contextMenuContentThemeVariants,
    menubarBaseThemeVariants,
    menubarListItemThemeVariants
} from "../../styles/menu.styles";

import { MenubarComponent } from "./menubar.component";
import { MenuComponent } from "../menu/menu.component";

@Component({
    imports: [MenubarComponent, MenuComponent],
    template: `
        <mona-menubar [disabled]="true">
            <mona-menu text="File"></mona-menu>
        </mona-menubar>
    `
})
class DisabledMenubarHostComponent {}

describe("MenubarComponent", () => {
    let component: MenubarComponent;
    let fixture: ComponentFixture<MenubarComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MenubarComponent, DisabledMenubarHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(MenubarComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("uses a muted glass bar and an elevated overlay menu", () => {
        const barClasses = menubarBaseThemeVariants({ rounded: "medium", size: "medium" }).split(/\s+/);
        const menuClasses = contextMenuContentThemeVariants({
            rounded: "medium",
            size: "medium"
        }).split(/\s+/);

        expect(barClasses).toContain("bg-(--mona-menubar-background)");
        expect(barClasses).toContain(
            "[backdrop-filter:var(--mona-menubar-backdrop-filter,var(--mona-effect-raised-backdrop-filter,none))]"
        );
        expect(barClasses).toContain("border-border-subtle");
        expect(menuClasses).toContain(
            "[background-color:var(--mona-effect-overlay-background-color,var(--color-surface-overlay))]"
        );
        expect(menuClasses).toContain("border-border");
        expect(menuClasses).toContain("shadow-(--shadow-overlay)");
    });

    it("visually and semantically disables the whole menubar", () => {
        const hostFixture = TestBed.createComponent(DisabledMenubarHostComponent);
        hostFixture.detectChanges();

        const menubar = hostFixture.nativeElement.querySelector("mona-menubar") as HTMLElement;
        const menuItem = menubar.querySelector('[role="menuitem"]') as HTMLElement;

        expect(menubar.dataset["disabled"]).toBe("true");
        expect(menubar.classList.contains("data-[disabled='true']:opacity-50")).toBe(true);
        expect(menuItem.dataset["disabled"]).toBe("true");
        expect(menuItem.getAttribute("aria-disabled")).toBe("true");
        expect(menuItem.tabIndex).toBe(-1);
    });

    it("uses the menu highlight for hover, focus, and the open menu state", () => {
        const classes = menubarListItemThemeVariants({ rounded: "medium" }).split(/\s+/);
        expect(classes).toContain("hover:bg-[var(--mona-menu-item-hover-background,var(--color-hover))]");
        expect(classes).toContain("focus-within:bg-[var(--mona-menu-item-hover-background,var(--color-hover))]");
        expect(classes).toContain(
            "data-[active='true']:bg-[var(--mona-menu-item-hover-background,var(--color-selected))]"
        );
        expect(classes).toContain(
            "data-[active='true']:text-[var(--mona-menu-item-hover-foreground,var(--color-selected-foreground))]"
        );
    });
});
