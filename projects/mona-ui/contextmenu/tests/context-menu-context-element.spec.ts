import { Component, computed, viewChild } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import type { PopupMenuItemClickEvent } from "@nanahoshi/mona-ui/popup-menu";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ContextMenuComponent } from "../components/contextmenu/context-menu.component";
import { ContextMenuItemComponent } from "../components/contextmenu-item/context-menu-item.component";

/** One menu on a tab strip, which names itself after the tab it opened on and offers Close only for a tab. */
@Component({
    imports: [ContextMenuComponent, ContextMenuItemComponent],
    template: `
        <div #strip class="strip" role="tablist" aria-label="Tabs">
            <button type="button" role="tab" class="docs" aria-selected="true" data-name="Docs">Docs</button>
            <button type="button" role="tab" class="music" aria-selected="false" data-name="Music">
                <svg aria-hidden="true" viewBox="0 0 1 1"><path d="M0 0h1v1z"></path></svg>
                Music
            </button>
        </div>
        <div #list class="list" role="listbox" tabindex="0" aria-label="Files" aria-activedescendant="file-b">
            <div id="file-a" role="option" aria-selected="false">a.txt</div>
            <div id="file-b" role="option" aria-selected="false">b.txt</div>
        </div>
        <mona-contextmenu
            #menu
            [target]="strip"
            [aria-label]="label()"
            (menuClick)="clicks.push($event)"
            (menuSelect)="selections.push($event)">
            <mona-contextmenu-item label="Close" value="close" [disabled]="tabName() === null"></mona-contextmenu-item>
            <mona-contextmenu-item label="New tab" value="new"></mona-contextmenu-item>
        </mona-contextmenu>
        <mona-contextmenu #listMenu [target]="list">
            <mona-contextmenu-item label="Open" value="open"></mona-contextmenu-item>
        </mona-contextmenu>
    `
})
class TabStripHostComponent {
    public readonly clicks: PopupMenuItemClickEvent[] = [];
    public readonly label = computed(() => {
        const name = this.tabName();
        return name === null ? "Tabs" : `Tab ${name}`;
    });
    public readonly listMenu = viewChild.required<ContextMenuComponent>("listMenu");
    public readonly menu = viewChild.required<ContextMenuComponent>("menu");
    public readonly selections: PopupMenuItemClickEvent[] = [];
    public readonly tabName = computed(
        () => this.menu().contextElement()?.closest("[role='tab']")?.getAttribute("data-name") ?? null
    );
}

function menus(): HTMLElement[] {
    return Array.from(document.querySelectorAll<HTMLElement>("[role='menu']"));
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

describe("context menu contextElement", () => {
    let fixture: ComponentFixture<TabStripHostComponent>;
    let host: TabStripHostComponent;
    let strip: HTMLElement;
    let docs: HTMLButtonElement;
    let music: HTMLButtonElement;

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

    /** Right-clicks an element, as the browser does: the closest focusable element takes the focus on the way. */
    async function rightClick(element: Element): Promise<void> {
        element.closest<HTMLElement>("button, [tabindex]")?.focus();
        element.dispatchEvent(
            new MouseEvent("contextmenu", { bubbles: true, button: 2, cancelable: true, clientX: 10, clientY: 10 })
        );
        await settle();
    }

    beforeEach(async () => {
        fixture = TestBed.createComponent(TabStripHostComponent);
        host = fixture.componentInstance;
        document.body.appendChild(fixture.nativeElement);
        await settle();
        const element = fixture.nativeElement as HTMLElement;
        strip = element.querySelector(".strip")!;
        docs = element.querySelector(".docs")!;
        music = element.querySelector(".music")!;
    });

    afterEach(() => {
        (fixture.nativeElement as HTMLElement).remove();
        document.querySelectorAll(".cdk-overlay-container").forEach(element => element.remove());
    });

    it("is null until the menu has opened", () => {
        expect(host.menu().contextElement()).toBeNull();
    });

    it("is the element under the pointer after a right-click, and names and fills the menu from the start", async () => {
        await rightClick(music);

        expect(host.menu().contextElement()).toBe(music);
        expect(menus()[0].getAttribute("aria-label")).toBe("Tab Music");
        expect(item("Close").getAttribute("aria-disabled")).not.toBe("true");
    });

    it("is the HTML element an SVG graphic under the pointer is in", async () => {
        await rightClick(music.querySelector("path")!);

        expect(host.menu().contextElement()).toBe(music);
    });

    it("is the target itself for a right-click on the target's own space", async () => {
        await rightClick(strip);

        expect(host.menu().contextElement()).toBe(strip);
        expect(menus()[0].getAttribute("aria-label")).toBe("Tabs");
        expect(item("Close").getAttribute("aria-disabled")).toBe("true");
    });

    it("is the focused element in the target after the ContextMenu key or Shift+F10", async () => {
        music.focus();
        keydown(music, "ContextMenu");
        await settle();
        expect(host.menu().contextElement()).toBe(music);
        expect(menus()[0].getAttribute("aria-label")).toBe("Tab Music");
        keydown(menus()[0], "Escape");
        await settleClose();
        expect(document.activeElement).toBe(music);

        docs.focus();
        keydown(docs, "F10", { shiftKey: true });
        await settle();
        expect(host.menu().contextElement()).toBe(docs);
        expect(menus()[0].getAttribute("aria-label")).toBe("Tab Docs");
    });

    it("is the element the focused element's aria-activedescendant names, from the keyboard", async () => {
        const list = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(".list")!;
        list.focus();
        keydown(list, "ContextMenu");
        await settle();

        expect(host.listMenu().contextElement()?.id).toBe("file-b");
    });

    it("comes with menuClick and menuSelect, and stays after the menu closes until it opens again", async () => {
        await rightClick(music);
        item("Close").click();
        expect(host.clicks.map(event => event.contextElement)).toEqual([music]);

        await settleClose();
        expect(menus().length).toBe(0);
        expect(host.selections.map(event => event.contextElement)).toEqual([music]);
        expect(host.menu().contextElement()).toBe(music);

        await rightClick(docs);
        expect(host.menu().contextElement()).toBe(docs);
        // The chosen item's event keeps the element its own menu opened on.
        expect(host.selections[0].contextElement).toBe(music);
    });
});
