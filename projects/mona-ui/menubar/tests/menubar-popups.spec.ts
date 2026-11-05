import { Component } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MenuComponent } from "../components/menu/menu.component";
import { MenuItemComponent } from "../components/menu-item/menu-item.component";
import { MenubarComponent } from "../components/menubar/menubar.component";

@Component({
    imports: [MenubarComponent, MenuComponent, MenuItemComponent],
    template: `
        <mona-menubar ariaLabel="Application">
            <mona-menu text="File">
                <mona-menu-item label="New"></mona-menu-item>
                <mona-menu-item label="Open"></mona-menu-item>
            </mona-menu>
            <mona-menu text="Edit">
                <mona-menu-item label="Undo"></mona-menu-item>
                <mona-menu-item label="Redo"></mona-menu-item>
            </mona-menu>
        </mona-menubar>
    `
})
class MenubarHostComponent {}

function keydown(target: Element, key: string): KeyboardEvent {
    const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key });
    target.dispatchEvent(event);
    return event;
}

function wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

describe("menubar popups", () => {
    let fixture: ComponentFixture<MenubarHostComponent>;
    let menus: HTMLLIElement[];

    async function settle(): Promise<void> {
        fixture.detectChanges();
        await fixture.whenStable();
        await wait(5);
        fixture.detectChanges();
    }

    function openMenus(): HTMLElement[] {
        return Array.from(document.querySelectorAll<HTMLElement>("[role='menu']"));
    }

    function activeLabel(menu: HTMLElement): string | null {
        const id = menu.getAttribute("aria-activedescendant");
        return id ? (document.getElementById(id)?.textContent?.trim() ?? null) : null;
    }

    beforeEach(async () => {
        fixture = TestBed.createComponent(MenubarHostComponent);
        document.body.appendChild(fixture.nativeElement);
        await settle();
        menus = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll("[role='menubar'] > li"));
    });

    afterEach(() => {
        (fixture.nativeElement as HTMLElement).remove();
    });

    it("opens a menu from the keyboard with its first item highlighted", async () => {
        menus[0].focus();
        keydown(menus[0], "Enter");
        await settle();

        const menu = openMenus()[0];
        expect(document.activeElement).toBe(menu);
        expect(activeLabel(menu)).toBe("New");
    });

    it("moves to the next menu with ArrowRight and returns focus to it on Escape", async () => {
        menus[0].focus();
        keydown(menus[0], "Enter");
        await settle();

        keydown(openMenus()[0], "ArrowRight");
        await settle();
        await wait(200);

        expect(openMenus().length).toBe(1);
        expect(openMenus()[0].textContent).toContain("Undo");
        expect(menus[1].getAttribute("aria-expanded")).toBe("true");
        expect(document.activeElement).toBe(openMenus()[0]);

        keydown(openMenus()[0], "Escape");
        await settle();
        await wait(200);

        expect(openMenus().length).toBe(0);
        expect(document.activeElement).toBe(menus[1]);
    });

    it("returns focus to the menu after Escape when it was opened by click", async () => {
        menus[0].focus();
        menus[0].click();
        await settle();
        expect(openMenus().length).toBe(1);

        keydown(openMenus()[0], "Escape");
        await settle();
        await wait(200);

        expect(document.activeElement).toBe(menus[0]);
        expect(menus[0].getAttribute("aria-expanded")).toBe("false");
    });

    it("closes on Tab with focus back on the menubar, so Tab moves on from it", async () => {
        menus[0].focus();
        keydown(menus[0], "Enter");
        await settle();

        const tab = keydown(openMenus()[0], "Tab");

        expect(tab.defaultPrevented).toBe(false);
        expect(document.activeElement).toBe(menus[0]);
        await settle();
        await wait(200);
        expect(openMenus().length).toBe(0);
        expect(menus[0].getAttribute("aria-expanded")).toBe("false");
    });
});
