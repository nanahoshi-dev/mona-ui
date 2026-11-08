import { Component } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MenuComponent } from "../components/menu/menu.component";
import { MenuItemComponent } from "../components/menu-item/menu-item.component";
import { MenubarComponent } from "../components/menubar/menubar.component";
import { ContextMenuItemComponent } from "../../contextmenu/components/contextmenu-item/context-menu-item.component";

@Component({
    imports: [MenubarComponent, MenuComponent, MenuItemComponent],
    template: `
        <mona-menubar aria-label="Application">
            <mona-menu text="File">
                <mona-menu-item label="New"></mona-menu-item>
                <mona-menu-item label="Open"></mona-menu-item>
                <mona-menu-item label="Recent">
                    <mona-menu-item label="Report"></mona-menu-item>
                    <mona-menu-item label="Notes"></mona-menu-item>
                </mona-menu-item>
            </mona-menu>
            <mona-menu text="Edit">
                <mona-menu-item label="Undo"></mona-menu-item>
                <mona-menu-item label="Redo"></mona-menu-item>
            </mona-menu>
            <mona-menu text="View" [disabled]="true">
                <mona-menu-item label="Zoom"></mona-menu-item>
            </mona-menu>
            <mona-menu text="Help"></mona-menu>
        </mona-menubar>
    `
})
class MenubarHostComponent {}

@Component({
    imports: [MenubarComponent, MenuComponent, ContextMenuItemComponent],
    template: `
        <mona-menubar>
            <mona-menu text="File">
                <mona-contextmenu-item label="Foreign"></mona-contextmenu-item>
            </mona-menu>
        </mona-menubar>
    `
})
class ForeignItemHostComponent {}

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

    it("moves to the previous menu on the first ArrowLeft in a popup opened from the keyboard", async () => {
        menus[1].focus();
        keydown(menus[1], "Enter");
        await settle();
        expect(openMenus()[0].textContent).toContain("Undo");

        keydown(openMenus()[0], "ArrowLeft");
        await settle();
        await wait(200);

        expect(openMenus().length).toBe(1);
        expect(openMenus()[0].textContent).toContain("New");
        expect(menus[0].getAttribute("aria-expanded")).toBe("true");
        expect(menus[0].getAttribute("tabindex")).toBe("0");
        expect(menus[1].getAttribute("tabindex")).toBe("-1");
    });

    it("closes a submenu on ArrowLeft without leaving the menu", async () => {
        menus[0].focus();
        keydown(menus[0], "Enter");
        await settle();
        const popup = openMenus()[0];
        keydown(popup, "ArrowUp");
        keydown(popup, "ArrowRight");
        await settle();
        expect(openMenus().length).toBe(2);

        keydown(openMenus()[1], "ArrowLeft");
        await settle();
        await wait(200);

        expect(openMenus().length).toBe(1);
        expect(openMenus()[0].textContent).toContain("New");
        expect(menus[0].getAttribute("aria-expanded")).toBe("true");
    });

    it("opens with the last item highlighted on ArrowUp", async () => {
        menus[1].focus();
        keydown(menus[1], "ArrowUp");
        await settle();
        expect(activeLabel(openMenus()[0])).toBe("Redo");
    });

    it("names each popup after its menubar item", async () => {
        menus[0].focus();
        keydown(menus[0], "Enter");
        await settle();
        expect(menus[0].id).not.toBe("");
        expect(openMenus()[0].getAttribute("aria-labelledby")).toBe(menus[0].id);
    });

    it("treats a menu without items as a plain item", async () => {
        const help = menus[3];
        expect(help.hasAttribute("aria-haspopup")).toBe(false);
        expect(help.hasAttribute("aria-expanded")).toBe(false);

        help.focus();
        keydown(help, "Enter");
        help.click();
        await settle();
        expect(openMenus().length).toBe(0);
    });

    it("lets focus reach a disabled menu, which doesn't open", async () => {
        menus[1].focus();
        keydown(menus[1], "ArrowRight");
        await settle();
        expect(document.activeElement).toBe(menus[2]);
        expect(menus[2].getAttribute("aria-disabled")).toBe("true");

        keydown(menus[2], "Enter");
        await settle();
        expect(openMenus().length).toBe(0);
    });

    it("lands on the menubar item when the popup moves to a menu it can't open", async () => {
        menus[1].focus();
        keydown(menus[1], "Enter");
        await settle();

        keydown(openMenus()[0], "ArrowRight");
        await settle();
        await wait(200);

        expect(openMenus().length).toBe(0);
        expect(document.activeElement).toBe(menus[2]);
        expect(menus[2].getAttribute("tabindex")).toBe("0");
    });

    it("moves to a menu by its first letter", async () => {
        menus[0].focus();
        keydown(menus[0], "h");
        expect(document.activeElement).toBe(menus[3]);

        keydown(menus[3], "E");
        expect(document.activeElement).toBe(menus[1]);
    });

    it("rejects items from another menu family", () => {
        const foreign = TestBed.createComponent(ForeignItemHostComponent);
        expect(() => foreign.detectChanges()).toThrow(/mona-menu-item/);
    });
});
