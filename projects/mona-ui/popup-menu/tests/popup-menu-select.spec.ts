import { InteractivityChecker } from "@angular/cdk/a11y";
import { Component, inject } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { type DialogRef, DialogService } from "@nanahoshi/mona-ui/dialog";
import { MONA_DEFAULT_LOCALE, MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import type { PopupMenuItemClickEvent } from "@nanahoshi/mona-ui/internal/popup-menu";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PopupMenuComponent } from "../components/popup-menu/popup-menu.component";
import { PopupMenuItemComponent } from "../components/popup-menu-item/popup-menu-item.component";
import type { PopupMenuCloseEvent } from "../models/PopupMenuCloseEvent";

/** What a handler found when it ran. */
interface Seen {
    readonly active: Element | null;
    readonly menus: number;
    readonly value: unknown;
}

function menus(): HTMLElement[] {
    return Array.from(document.querySelectorAll<HTMLElement>("[role='menu']"));
}

function see(event: PopupMenuItemClickEvent): Seen {
    return { active: document.activeElement, menus: menus().length, value: event.value };
}

@Component({
    imports: [PopupMenuComponent, PopupMenuItemComponent],
    template: `
        <button #trigger type="button">Actions</button>
        <mona-popup-menu
            [target]="trigger"
            (close)="onClose($event)"
            (menuClick)="onClick($event)"
            (menuSelect)="onSelect($event)">
            <mona-popup-menu-item label="Rename" value="rename"></mona-popup-menu-item>
            <mona-popup-menu-item label="Pin" value="pin" (menuClick)="onItemClick($event)"></mona-popup-menu-item>
        </mona-popup-menu>
    `
})
class MenuHostComponent {
    readonly #dialogService = inject(DialogService);
    public readonly clicks: Seen[] = [];
    public readonly selections: Seen[] = [];
    public dialogRef: DialogRef | null = null;
    public keepOpen = false;
    public keepOpenOnClose = false;
    public keepOpenOnItem = false;
    public openDialog = false;

    public onClick(event: PopupMenuItemClickEvent): void {
        this.clicks.push(see(event));
        if (this.keepOpen) {
            event.preventDefault();
        }
    }

    public onClose(event: PopupMenuCloseEvent): void {
        if (this.keepOpenOnClose) {
            event.preventDefault();
        }
    }

    public onItemClick(event: PopupMenuItemClickEvent): void {
        if (this.keepOpenOnItem) {
            event.preventDefault();
        }
    }

    public onSelect(event: PopupMenuItemClickEvent): void {
        this.selections.push(see(event));
        if (this.openDialog) {
            this.dialogRef = this.#dialogService.show({ text: "Choose a new name.", title: "Rename" });
        }
    }
}

function item(label: string): HTMLElement {
    const found = Array.from(document.querySelectorAll<HTMLElement>("[role='menuitem']")).find(
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

describe("popup menu choice", () => {
    let fixture: ComponentFixture<MenuHostComponent>;
    let host: MenuHostComponent;
    let trigger: HTMLButtonElement;

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
        trigger.focus();
        trigger.click();
        await settle();
        return menus()[0];
    }

    beforeEach(async () => {
        TestBed.inject(MonaI18nService).use(MONA_DEFAULT_LOCALE);
        // jsdom has no layout: without this, the dialog's focus trap finds nothing to focus.
        vi.spyOn(TestBed.inject(InteractivityChecker), "isVisible").mockReturnValue(true);
        fixture = TestBed.createComponent(MenuHostComponent);
        host = fixture.componentInstance;
        document.body.appendChild(fixture.nativeElement);
        await settle();
        trigger = (fixture.nativeElement as HTMLElement).querySelector("button")!;
    });

    afterEach(() => {
        (fixture.nativeElement as HTMLElement).remove();
        document.querySelectorAll(".cdk-overlay-container").forEach(element => element.remove());
        document.documentElement.classList.remove("cdk-global-scrollblock");
        vi.restoreAllMocks();
    });

    it("emits menuClick while the menu is open, and menuSelect once it has closed and focused the trigger", async () => {
        const menu = await open();
        item("Rename").click();

        expect(host.clicks.length).toBe(1);
        expect(host.clicks[0].active).toBe(menu);
        expect(host.clicks[0].menus).toBe(1);
        expect(host.selections.length).toBe(0);

        await settleClose();
        expect(host.selections.length).toBe(1);
        expect(host.selections[0].active).toBe(trigger);
        expect(host.selections[0].menus).toBe(0);
        expect(host.selections[0].value).toBe("rename");
    });

    it("emits menuSelect after the menu has closed for an item chosen with Enter", async () => {
        const menu = await open();
        keydown(menu, "ArrowDown");
        keydown(menu, "Enter");
        await settleClose();

        expect(host.selections.length).toBe(1);
        expect(host.selections[0].active).toBe(trigger);
        expect(host.selections[0].menus).toBe(0);
    });

    it("gives the focus back to the trigger when a dialog opened from menuSelect closes", async () => {
        host.openDialog = true;
        await open();
        item("Rename").click();
        await settleClose();

        const dialog = document.querySelector<HTMLElement>("[role='dialog']");
        expect(dialog).not.toBeNull();
        expect(dialog!.contains(document.activeElement)).toBe(true);

        host.dialogRef!.close();
        await settleClose();
        expect(document.querySelector("[role='dialog']")).toBeNull();
        expect(document.activeElement).toBe(trigger);
    });

    it("doesn't emit menuSelect, and stays open, when menuClick is prevented", async () => {
        host.keepOpen = true;
        await open();
        item("Rename").click();
        await settleClose();

        expect(host.clicks.length).toBe(1);
        expect(host.selections.length).toBe(0);
        expect(menus().length).toBe(1);
    });

    it("doesn't emit menuSelect, or menuClick, when the item's own menuClick is prevented", async () => {
        host.keepOpenOnItem = true;
        await open();
        item("Pin").click();
        await settleClose();

        expect(host.clicks.length).toBe(0);
        expect(host.selections.length).toBe(0);
        expect(menus().length).toBe(1);
    });

    it("emits menuSelect right away when a close handler keeps the menu open", async () => {
        host.keepOpenOnClose = true;
        const menu = await open();
        item("Rename").click();

        expect(host.selections.length).toBe(1);
        expect(host.selections[0].active).toBe(menu);
        await settleClose();
        expect(host.selections.length).toBe(1);
        expect(menus().length).toBe(1);
    });
});
