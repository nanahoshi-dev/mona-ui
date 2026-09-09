import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MONA_DEFAULT_LOCALE, MonaI18nService } from "@nanahoshi/mona-ui/i18n";
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

@Component({
    imports: [MenubarComponent, MenuComponent],
    template: `
        <mona-menubar>
            <mona-menu text="File"></mona-menu>
            <mona-menu text="Edit"></mona-menu>
            <mona-menu text="View"></mona-menu>
        </mona-menubar>
    `
})
class TestMenubarHostComponent {}

describe("MenubarComponent", () => {
    let component: MenubarComponent;
    let fixture: ComponentFixture<MenubarComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MenubarComponent, DisabledMenubarHostComponent, TestMenubarHostComponent]
        }).compileComponents();

        TestBed.inject(MonaI18nService).use(MONA_DEFAULT_LOCALE);
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

    it("navigates horizontally with ArrowRight / ArrowLeft in LTR", () => {
        const hostFixture = TestBed.createComponent(TestMenubarHostComponent);
        hostFixture.detectChanges();

        const items = hostFixture.nativeElement.querySelectorAll('li[role="menuitem"]') as NodeListOf<HTMLElement>;
        items[0].focus();
        expect(document.activeElement).toBe(items[0]);

        // ArrowRight advances to Edit
        items[0].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true }));
        hostFixture.detectChanges();
        expect(document.activeElement).toBe(items[1]);

        // ArrowRight advances to View
        items[1].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true }));
        hostFixture.detectChanges();
        expect(document.activeElement).toBe(items[2]);

        // ArrowLeft goes back to Edit
        items[2].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true, cancelable: true }));
        hostFixture.detectChanges();
        expect(document.activeElement).toBe(items[1]);
    });

    it("inverts horizontal arrow key navigation in RTL", () => {
        const i18n = TestBed.inject(MonaI18nService);
        i18n.use({
            ...MONA_DEFAULT_LOCALE,
            direction: "rtl",
            id: "ar"
        });

        const hostFixture = TestBed.createComponent(TestMenubarHostComponent);
        hostFixture.nativeElement.setAttribute("dir", "rtl");
        hostFixture.detectChanges();

        const items = hostFixture.nativeElement.querySelectorAll('li[role="menuitem"]') as NodeListOf<HTMLElement>;
        items[0].focus();
        expect(document.activeElement).toBe(items[0]);

        // RTL: ArrowLeft advances to next menu (Edit)
        items[0].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true, cancelable: true }));
        hostFixture.detectChanges();
        expect(document.activeElement).toBe(items[1]);

        // RTL: ArrowRight moves back to previous menu (File)
        items[1].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true }));
        hostFixture.detectChanges();
        expect(document.activeElement).toBe(items[0]);

        i18n.use(MONA_DEFAULT_LOCALE);
    });

    it("Case 2: RTL locale + LTR DOM maintains normal LTR arrow key navigation", () => {
        const i18n = TestBed.inject(MonaI18nService);
        i18n.use({
            ...MONA_DEFAULT_LOCALE,
            direction: "rtl",
            id: "ar"
        });

        const hostFixture = TestBed.createComponent(TestMenubarHostComponent);
        hostFixture.detectChanges();

        const items = hostFixture.nativeElement.querySelectorAll('li[role="menuitem"]') as NodeListOf<HTMLElement>;
        items[0].focus();
        expect(document.activeElement).toBe(items[0]);

        // In LTR: ArrowRight advances to next menu (Edit)
        items[0].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true }));
        hostFixture.detectChanges();
        expect(document.activeElement).toBe(items[1]);

        i18n.use(MONA_DEFAULT_LOCALE);
    });

    it("navigates to first and last menu with Home and End", () => {
        const hostFixture = TestBed.createComponent(TestMenubarHostComponent);
        hostFixture.detectChanges();

        const items = hostFixture.nativeElement.querySelectorAll('li[role="menuitem"]') as NodeListOf<HTMLElement>;
        items[0].focus();

        // End moves to last menu (View)
        items[0].dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true, cancelable: true }));
        hostFixture.detectChanges();
        expect(document.activeElement).toBe(items[2]);

        // Home moves to first menu (File)
        items[2].dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true, cancelable: true }));
        hostFixture.detectChanges();
        expect(document.activeElement).toBe(items[0]);
    });
});
