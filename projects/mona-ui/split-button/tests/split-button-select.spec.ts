import { InteractivityChecker } from "@angular/cdk/a11y";
import { Component, inject } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { type DialogRef, DialogService } from "@nanahoshi/mona-ui/dialog";
import { MONA_DEFAULT_LOCALE, MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import type { PopupMenuItemClickEvent } from "@nanahoshi/mona-ui/popup-menu";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SplitButtonComponent } from "../components/split-button/split-button.component";
import { SplitButtonItemComponent } from "../components/split-button-item/split-button-item.component";

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
    imports: [SplitButtonComponent, SplitButtonItemComponent],
    template: `
        <mona-split-button text="Save" (menuItemClick)="onClick($event)" (menuItemSelect)="onSelect($event)">
            <mona-split-button-item label="Save as…" value="save-as"></mona-split-button-item>
            <mona-split-button-item label="Export PDF" value="export"></mona-split-button-item>
        </mona-split-button>
    `
})
class SplitButtonHostComponent {
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
            this.dialogRef = this.#dialogService.show({ text: "Choose where to save.", title: "Save as" });
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

function keydown(target: Element, key: string, init: KeyboardEventInit = {}): void {
    target.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key, ...init }));
}

function wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

describe("split button menu choice", () => {
    let fixture: ComponentFixture<SplitButtonHostComponent>;
    let host: SplitButtonHostComponent;
    let mainButton: HTMLButtonElement;
    let menuButton: HTMLButtonElement;

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
        menuButton.focus();
        menuButton.click();
        await settle();
        return menus()[0];
    }

    beforeEach(async () => {
        TestBed.inject(MonaI18nService).use(MONA_DEFAULT_LOCALE);
        // jsdom has no layout: without this, the dialog's focus trap finds nothing to focus.
        vi.spyOn(TestBed.inject(InteractivityChecker), "isVisible").mockReturnValue(true);
        fixture = TestBed.createComponent(SplitButtonHostComponent);
        host = fixture.componentInstance;
        document.body.appendChild(fixture.nativeElement);
        await settle();
        [mainButton, menuButton] = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll("button"));
    });

    afterEach(() => {
        (fixture.nativeElement as HTMLElement).remove();
        document.querySelectorAll(".cdk-overlay-container").forEach(element => element.remove());
        document.documentElement.classList.remove("cdk-global-scrollblock");
        vi.restoreAllMocks();
    });

    it("emits menuItemClick while the menu is open, and menuItemSelect once it has closed and focused the arrow", async () => {
        const menu = await open();
        item("Save as…").click();

        expect(host.clicks.length).toBe(1);
        expect(host.clicks[0].active).toBe(menu);
        expect(host.selections.length).toBe(0);

        await settleClose();
        expect(host.selections.length).toBe(1);
        expect(host.selections[0].active).toBe(menuButton);
        expect(host.selections[0].menus).toBe(0);
        expect(host.selections[0].value).toBe("save-as");
        expect(menuButton.getAttribute("aria-expanded")).toBe("false");
    });

    it("focuses the main button before menuItemSelect when the menu opened from it with Alt+ArrowDown", async () => {
        mainButton.focus();
        keydown(mainButton, "ArrowDown", { altKey: true });
        await settle();
        const menu = menus()[0];
        keydown(menu, "ArrowDown");
        keydown(menu, "Enter");
        await settleClose();

        expect(host.selections.length).toBe(1);
        expect(host.selections[0].active).toBe(mainButton);
        expect(host.selections[0].menus).toBe(0);
        expect(host.selections[0].value).toBe("export");
    });

    it("gives the focus back to the arrow when a dialog opened from menuItemSelect closes", async () => {
        host.openDialog = true;
        await open();
        item("Save as…").click();
        await settleClose();

        const dialog = document.querySelector<HTMLElement>("[role='dialog']");
        expect(dialog).not.toBeNull();
        expect(dialog!.contains(document.activeElement)).toBe(true);

        host.dialogRef!.close();
        await settleClose();
        expect(document.querySelector("[role='dialog']")).toBeNull();
        expect(document.activeElement).toBe(menuButton);
    });

    it("doesn't emit menuItemSelect, and stays open, when menuItemClick is prevented", async () => {
        host.keepOpen = true;
        await open();
        item("Export PDF").click();
        await settleClose();

        expect(host.clicks.length).toBe(1);
        expect(host.selections.length).toBe(0);
        expect(menus().length).toBe(1);
    });
});
