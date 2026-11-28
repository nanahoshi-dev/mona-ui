import { InteractivityChecker } from "@angular/cdk/a11y";
import { Component, inject } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { type DialogRef, DialogService } from "@nanahoshi/mona-ui/dialog";
import { MONA_DEFAULT_LOCALE, MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MenuComponent } from "../components/menu/menu.component";
import { MenuItemComponent } from "../components/menu-item/menu-item.component";
import { MenubarComponent } from "../components/menubar/menubar.component";
import type { MenuItemClickEvent } from "../models/MenuItemClickEvent";

/** What a handler found when it ran. */
interface Seen {
    readonly active: Element | null;
    readonly menus: number;
    readonly value: unknown;
}

function menus(): HTMLElement[] {
    return Array.from(document.querySelectorAll<HTMLElement>("[role='menu']"));
}

function see(event: MenuItemClickEvent): Seen {
    return { active: document.activeElement, menus: menus().length, value: event.value };
}

@Component({
    imports: [MenubarComponent, MenuComponent, MenuItemComponent],
    template: `
        <mona-menubar aria-label="Application" (menuItemClick)="onClick($event)" (menuItemSelect)="onSelect($event)">
            <mona-menu text="File">
                <mona-menu-item label="New" value="new"></mona-menu-item>
                <mona-menu-item label="Open" value="open"></mona-menu-item>
            </mona-menu>
            <mona-menu text="Edit">
                <mona-menu-item label="Undo" value="undo"></mona-menu-item>
            </mona-menu>
        </mona-menubar>
    `
})
class MenubarHostComponent {
    readonly #dialogService = inject(DialogService);
    public readonly clicks: Seen[] = [];
    public readonly selections: Seen[] = [];
    public dialogRef: DialogRef | null = null;
    public keepOpen = false;
    public openDialog = false;

    public onClick(event: MenuItemClickEvent): void {
        this.clicks.push(see(event));
        if (this.keepOpen) {
            event.preventDefault();
        }
    }

    public onSelect(event: MenuItemClickEvent): void {
        this.selections.push(see(event));
        if (this.openDialog) {
            this.dialogRef = this.#dialogService.show({ text: "Choose a file to open.", title: "Open" });
        }
    }
}

function item(label: string): HTMLElement {
    const found = Array.from(document.querySelectorAll<HTMLElement>("[role='menu'] [role='menuitem']")).find(
        element => element.textContent?.trim() === label
    );
    if (!found) {
        throw new Error(`No menu item "${label}"`);
    }
    return found;
}

function keydown(target: Element, key: string): void {
    target.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key }));
}

function wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

describe("menubar menu choice", () => {
    let fixture: ComponentFixture<MenubarHostComponent>;
    let host: MenubarHostComponent;
    let file: HTMLLIElement;

    async function settle(): Promise<void> {
        fixture.detectChanges();
        await fixture.whenStable();
        await wait(5);
        fixture.detectChanges();
    }

    /** Waits for a popup's leave animation, and for what follows its close. */
    async function settleClose(): Promise<void> {
        await settle();
        await wait(200);
        await settle();
    }

    async function open(): Promise<HTMLElement> {
        file.focus();
        file.click();
        await settle();
        return menus()[0];
    }

    beforeEach(async () => {
        TestBed.inject(MonaI18nService).use(MONA_DEFAULT_LOCALE);
        // jsdom has no layout: without this, the dialog's focus trap finds nothing to focus.
        vi.spyOn(TestBed.inject(InteractivityChecker), "isVisible").mockReturnValue(true);
        fixture = TestBed.createComponent(MenubarHostComponent);
        host = fixture.componentInstance;
        document.body.appendChild(fixture.nativeElement);
        await settle();
        file = (fixture.nativeElement as HTMLElement).querySelector("[role='menubar'] > li")!;
    });

    afterEach(() => {
        (fixture.nativeElement as HTMLElement).remove();
        document.querySelectorAll(".cdk-overlay-container").forEach(element => element.remove());
        document.documentElement.classList.remove("cdk-global-scrollblock");
        vi.restoreAllMocks();
    });

    it("emits menuItemClick while the menu is open, and menuItemSelect once it has closed and focused the menubar item", async () => {
        const menu = await open();
        item("Open").click();

        expect(host.clicks.length).toBe(1);
        expect(host.clicks[0].active).toBe(menu);
        expect(host.selections.length).toBe(0);

        await settleClose();
        expect(host.selections.length).toBe(1);
        expect(host.selections[0].active).toBe(file);
        expect(host.selections[0].menus).toBe(0);
        expect(host.selections[0].value).toBe("open");
        expect(file.getAttribute("aria-expanded")).toBe("false");
    });

    it("emits menuItemSelect after the menu has closed for an item chosen from the keyboard", async () => {
        file.focus();
        keydown(file, "Enter");
        await settle();
        const menu = menus()[0];
        keydown(menu, "ArrowDown");
        keydown(menu, "Enter");
        await settleClose();

        expect(host.selections.length).toBe(1);
        expect(host.selections[0].active).toBe(file);
        expect(host.selections[0].menus).toBe(0);
        expect(host.selections[0].value).toBe("open");
    });

    it("gives the focus back to the menubar item when a dialog opened from menuItemSelect closes", async () => {
        host.openDialog = true;
        await open();
        item("Open").click();
        await settleClose();

        const dialog = document.querySelector<HTMLElement>("[role='dialog']");
        expect(dialog).not.toBeNull();
        expect(dialog!.contains(document.activeElement)).toBe(true);

        host.dialogRef!.close();
        await settleClose();
        expect(document.querySelector("[role='dialog']")).toBeNull();
        expect(document.activeElement).toBe(file);
    });

    it("doesn't emit menuItemSelect, and stays open, when menuItemClick is prevented", async () => {
        host.keepOpen = true;
        await open();
        item("New").click();
        await settleClose();

        expect(host.clicks.length).toBe(1);
        expect(host.selections.length).toBe(0);
        expect(menus().length).toBe(1);
    });
});
