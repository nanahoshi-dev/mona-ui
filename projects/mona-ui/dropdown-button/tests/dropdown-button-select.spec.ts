import { InteractivityChecker } from "@angular/cdk/a11y";
import { Component, inject } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { type DialogRef, DialogService } from "@nanahoshi/mona-ui/dialog";
import { MONA_DEFAULT_LOCALE, MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import type { PopupMenuItemClickEvent } from "@nanahoshi/mona-ui/popup-menu";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DropdownButtonComponent } from "../components/dropdown-button/dropdown-button.component";
import { DropdownButtonItemComponent } from "../components/dropdown-button-item/dropdown-button-item.component";

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
    imports: [DropdownButtonComponent, DropdownButtonItemComponent],
    template: `
        <mona-dropdown-button text="New" (menuItemClick)="onClick($event)" (menuItemSelect)="onSelect($event)">
            <mona-dropdown-button-item label="Folder" value="folder"></mona-dropdown-button-item>
            <mona-dropdown-button-item label="Text document" value="text"></mona-dropdown-button-item>
        </mona-dropdown-button>
    `
})
class DropdownHostComponent {
    readonly #dialogService = inject(DialogService);
    public readonly clicks: Seen[] = [];
    public readonly selections: Seen[] = [];
    public dialogRef: DialogRef | null = null;
    public keepOpen = false;
    public openDialog = false;

    public onClick(event: PopupMenuItemClickEvent): void {
        this.clicks.push(see(event));
        if (this.keepOpen) {
            event.preventDefault();
        }
    }

    public onSelect(event: PopupMenuItemClickEvent): void {
        this.selections.push(see(event));
        if (this.openDialog) {
            this.dialogRef = this.#dialogService.show({ text: "Name the new item.", title: "New" });
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

describe("dropdown button menu choice", () => {
    let fixture: ComponentFixture<DropdownHostComponent>;
    let host: DropdownHostComponent;
    let button: HTMLButtonElement;

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
        button.focus();
        button.click();
        await settle();
        return menus()[0];
    }

    beforeEach(async () => {
        TestBed.inject(MonaI18nService).use(MONA_DEFAULT_LOCALE);
        // jsdom has no layout: without this, the dialog's focus trap finds nothing to focus.
        vi.spyOn(TestBed.inject(InteractivityChecker), "isVisible").mockReturnValue(true);
        fixture = TestBed.createComponent(DropdownHostComponent);
        host = fixture.componentInstance;
        document.body.appendChild(fixture.nativeElement);
        await settle();
        button = (fixture.nativeElement as HTMLElement).querySelector("button")!;
    });

    afterEach(() => {
        (fixture.nativeElement as HTMLElement).remove();
        document.querySelectorAll(".cdk-overlay-container").forEach(element => element.remove());
        document.documentElement.classList.remove("cdk-global-scrollblock");
        vi.restoreAllMocks();
    });

    it("emits menuItemClick while the menu is open, and menuItemSelect once it has closed and focused the button", async () => {
        const menu = await open();
        item("Folder").click();

        expect(host.clicks.length).toBe(1);
        expect(host.clicks[0].active).toBe(menu);
        expect(host.selections.length).toBe(0);

        await settleClose();
        expect(host.selections.length).toBe(1);
        expect(host.selections[0].active).toBe(button);
        expect(host.selections[0].menus).toBe(0);
        expect(host.selections[0].value).toBe("folder");
        expect(button.getAttribute("aria-expanded")).toBe("false");
    });

    it("emits menuItemSelect after the menu has closed for an item chosen from the keyboard", async () => {
        button.focus();
        keydown(button, "ArrowDown");
        await settle();
        const menu = menus()[0];
        keydown(menu, "ArrowDown");
        keydown(menu, "Enter");
        await settleClose();

        expect(host.selections.length).toBe(1);
        expect(host.selections[0].active).toBe(button);
        expect(host.selections[0].menus).toBe(0);
        expect(host.selections[0].value).toBe("text");
    });

    it("gives the focus back to the button when a dialog opened from menuItemSelect closes", async () => {
        host.openDialog = true;
        await open();
        item("Text document").click();
        await settleClose();

        const dialog = document.querySelector<HTMLElement>("[role='dialog']");
        expect(dialog).not.toBeNull();
        expect(dialog!.contains(document.activeElement)).toBe(true);

        host.dialogRef!.close();
        await settleClose();
        expect(document.querySelector("[role='dialog']")).toBeNull();
        expect(document.activeElement).toBe(button);
    });

    it("doesn't emit menuItemSelect, and stays open, when menuItemClick is prevented", async () => {
        host.keepOpen = true;
        await open();
        item("Folder").click();
        await settleClose();

        expect(host.clicks.length).toBe(1);
        expect(host.selections.length).toBe(0);
        expect(menus().length).toBe(1);
    });
});
