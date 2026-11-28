import { InteractivityChecker } from "@angular/cdk/a11y";
import { Component, inject } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { type DialogRef, DialogService } from "@nanahoshi/mona-ui/dialog";
import { MONA_DEFAULT_LOCALE, MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import type { PopupMenuItemClickEvent } from "@nanahoshi/mona-ui/popup-menu";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ContextMenuComponent } from "../components/contextmenu/context-menu.component";
import { ContextMenuItemComponent } from "../components/contextmenu-item/context-menu-item.component";

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
    imports: [ContextMenuComponent, ContextMenuItemComponent],
    template: `
        <div #region class="region" tabindex="0">
            Files
            <button class="row" type="button">report.txt</button>
        </div>
        <mona-contextmenu [target]="region" (menuClick)="onClick($event)" (menuSelect)="onSelect($event)">
            <mona-contextmenu-item label="Rename" value="rename"></mona-contextmenu-item>
            <mona-contextmenu-item label="Delete" value="delete"></mona-contextmenu-item>
        </mona-contextmenu>
    `
})
class ContextMenuHostComponent {
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

describe("context menu choice", () => {
    let fixture: ComponentFixture<ContextMenuHostComponent>;
    let host: ContextMenuHostComponent;
    let region: HTMLElement;
    let row: HTMLButtonElement;

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

    /** Right-clicks an element, as the browser does: it takes the focus on the way. */
    async function rightClick(element: HTMLElement): Promise<HTMLElement> {
        element.focus();
        element.dispatchEvent(
            new MouseEvent("contextmenu", { bubbles: true, button: 2, cancelable: true, clientX: 10, clientY: 10 })
        );
        await settle();
        return menus()[0];
    }

    beforeEach(async () => {
        TestBed.inject(MonaI18nService).use(MONA_DEFAULT_LOCALE);
        // jsdom has no layout: without this, the dialog's focus trap finds nothing to focus.
        vi.spyOn(TestBed.inject(InteractivityChecker), "isVisible").mockReturnValue(true);
        fixture = TestBed.createComponent(ContextMenuHostComponent);
        host = fixture.componentInstance;
        document.body.appendChild(fixture.nativeElement);
        await settle();
        region = (fixture.nativeElement as HTMLElement).querySelector(".region")!;
        row = region.querySelector(".row")!;
    });

    afterEach(() => {
        (fixture.nativeElement as HTMLElement).remove();
        document.querySelectorAll(".cdk-overlay-container").forEach(element => element.remove());
        document.documentElement.classList.remove("cdk-global-scrollblock");
        vi.restoreAllMocks();
    });

    it("emits menuClick while the menu is open, and menuSelect once it has closed and focused the target", async () => {
        const menu = await rightClick(region);
        item("Rename").click();

        expect(host.clicks.length).toBe(1);
        expect(host.clicks[0].active).toBe(menu);
        expect(host.selections.length).toBe(0);

        await settleClose();
        expect(host.selections.length).toBe(1);
        expect(host.selections[0].active).toBe(region);
        expect(host.selections[0].menus).toBe(0);
        expect(host.selections[0].value).toBe("rename");
    });

    it("focuses the element in the target that opened the menu before it emits menuSelect", async () => {
        await rightClick(row);
        item("Delete").click();
        await settleClose();

        expect(host.selections.length).toBe(1);
        expect(host.selections[0].active).toBe(row);
        expect(host.selections[0].menus).toBe(0);
    });

    it("emits menuSelect after the menu has closed for a menu opened and used from the keyboard", async () => {
        region.focus();
        keydown(region, "ContextMenu");
        await settle();
        keydown(menus()[0], "Enter");
        await settleClose();

        expect(host.selections.length).toBe(1);
        expect(host.selections[0].active).toBe(region);
        expect(host.selections[0].menus).toBe(0);
        expect(host.selections[0].value).toBe("rename");
    });

    it("gives the focus back to the target when a dialog opened from menuSelect closes", async () => {
        host.openDialog = true;
        await rightClick(region);
        item("Rename").click();
        await settleClose();

        const dialog = document.querySelector<HTMLElement>("[role='dialog']");
        expect(dialog).not.toBeNull();
        expect(dialog!.contains(document.activeElement)).toBe(true);

        host.dialogRef!.close();
        await settleClose();
        expect(document.querySelector("[role='dialog']")).toBeNull();
        expect(document.activeElement).toBe(region);
    });

    it("doesn't emit menuSelect, and stays open, when menuClick is prevented", async () => {
        host.keepOpen = true;
        await rightClick(region);
        item("Rename").click();
        await settleClose();

        expect(host.clicks.length).toBe(1);
        expect(host.selections.length).toBe(0);
        expect(menus().length).toBe(1);
    });
});
